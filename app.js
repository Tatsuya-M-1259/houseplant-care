// app.js

import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 0. 定数定義・状態管理
    // ----------------------------------------------------
    const WATER_TYPES = {
        WaterOnly: { name: '水のみ', class: 'water' },
        WaterAndFertilizer: { name: '水と液肥', class: 'fertilizer' },
        WaterAndActivator: { name: '水と活性剤', class: 'activator' },
        WaterFertilizerAndActivator: { name: '水・液肥・活性剤', class: 'complex' }
    };
    
    const SEASONS = {
        SPRING: { name: '春 (3月〜5月)', key: 'SPRING' },
        SUMMER: { name: '夏 (6月〜8月)', key: 'SUMMER' },
        AUTUMN: { name: '秋 (9月〜11月)', key: 'AUTUMN' },
        WINTER: { name: '冬 (12月〜2月)', key: 'WINTER' }
    };

    const DB_NAME = 'HouseplantDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';

    let db = null; 
    let userPlants = [];
    let currentPlantId = null;
    let deletedPlantBackup = null; // Undo用
    let deletedPlantIndex = -1;

    const objectUrls = new Set();

    // ----------------------------------------------------
    // 1. Utilities
    // ----------------------------------------------------
    function generateUUID() { return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15); }
    function getLocalTodayDate() { return new Date().toISOString().split('T')[0]; }
    function parseDateAsLocal(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (intervalDays === INTERVAL_WATER_STOP || !lastDateString || isNaN(intervalDays)) return null;
        const lastDate = parseDateAsLocal(lastDateString);
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + parseInt(intervalDays));
        return nextDate.toISOString().split('T')[0];
    }

    function getCurrentSeason() {
        if (currentGlobalSeason && currentGlobalSeason !== 'AUTO') return currentGlobalSeason;
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'SPRING';
        if (month >= 6 && month <= 8) return 'SUMMER';
        if (month >= 9 && month <= 11) return 'AUTUMN';
        return 'WINTER';
    }

    function formatDateJp(dateStr) {
        const d = new Date(dateStr);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }

    // ----------------------------------------------------
    // 2. Notifications (Undo付き)
    // ----------------------------------------------------
    function showNotification(message, type = 'success', duration = 3000, action = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        if (action) {
            const btn = document.createElement('button');
            btn.textContent = action.text;
            btn.className = 'toast-action-btn';
            btn.onclick = () => { action.callback(); toast.remove(); };
            toast.appendChild(btn);
        }
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }

    // ----------------------------------------------------
    // 3. UI Rendering & Dashboard
    // ----------------------------------------------------
    function renderPlantCards() {
        const list = document.getElementById('plant-card-list');
        const dashboard = document.getElementById('dashboard');
        const urgentList = document.getElementById('urgent-plant-list');
        if (!list) return;

        objectUrls.forEach(url => URL.revokeObjectURL(url));
        objectUrls.clear();

        const activeSeasonKey = getCurrentSeason();
        const sortedPlants = sortAndFilterPlants();

        // ダッシュボード（緊急）の更新
        const urgentPlants = sortedPlants.filter(p => {
            const d = PLANT_DATA.find(sd => String(sd.id) === String(p.speciesId));
            const next = calculateNextWateringDate(p.waterLog[0]?.date || p.entryDate, d.management[activeSeasonKey].waterIntervalDays);
            return next && new Date(next) <= new Date(getLocalTodayDate());
        });

        if (urgentPlants.length > 0) {
            dashboard.style.display = 'block';
            urgentList.innerHTML = urgentPlants.map(p => `<div class="urgent-item">🚨 ${p.name}</div>`).join('');
        } else {
            dashboard.style.display = 'none';
        }

        // メインリストの描画
        list.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'plant-card-container';
        sortedPlants.forEach(plant => {
            const data = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
            if (data) container.appendChild(createPlantCard(plant, data, activeSeasonKey));
        });
        list.appendChild(container);

        // Sortable（ドラッグ＆ドロップ）の有効化
        if (currentSort === 'manual') {
            new Sortable(container, {
                animation: 150, handle: '.drag-handle',
                onEnd: () => {
                    const newOrderIds = Array.from(container.children).map(c => c.dataset.id);
                    userPlants = newOrderIds.map(id => userPlants.find(p => String(p.id) === String(id)));
                    saveUserPlants(userPlants);
                }
            });
        }
    }

    function createPlantCard(userPlant, speciesData, seasonKey) {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.dataset.id = userPlant.id;
        
        card.innerHTML = `
            <div class="controls"><span class="drag-handle">☰</span><button class="delete-btn">×</button></div>
            <div class="season-selector">
                ${Object.keys(SEASONS).map(k => `<button class="${k === seasonKey ? 'active' : ''}" data-season="${k}">${SEASONS[k].name.split(' ')[0]}</button>`).join('')}
            </div>
            <div class="card-content-wrapper"></div>
            <div class="card-footer"><button class="action-button tertiary water-done-btn">💧 記録</button></div>
        `;

        const wrapper = card.querySelector('.card-content-wrapper');
        renderCardContent(wrapper, userPlant, speciesData, seasonKey);

        card.querySelector('.season-selector').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            e.stopPropagation();
            card.querySelectorAll('.season-selector button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCardContent(wrapper, userPlant, speciesData, btn.dataset.season);
        });

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.controls') && !e.target.closest('.season-selector') && !e.target.closest('.card-footer')) {
                showDetailsModal(userPlant, speciesData);
            }
        });

        return card;
    }

    async function renderCardContent(container, userPlant, speciesData, seasonKey) {
        let imgSrc = `./${speciesData.img}`;
        const blob = await getImageFromDB(userPlant.id);
        if (blob) { imgSrc = URL.createObjectURL(blob); objectUrls.add(imgSrc); }

        const sData = speciesData.management[seasonKey];
        const lastLog = userPlant.waterLog[0] || { date: userPlant.entryDate };
        const nextDate = calculateNextWateringDate(lastLog.date, sData.waterIntervalDays);
        const isAlert = nextDate && new Date(nextDate) <= new Date(getLocalTodayDate());

        container.innerHTML = `
            <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
            <div class="card-header"><h3>${userPlant.name}</h3><p>${speciesData.species}</p></div>
            <div class="status-box ${isAlert ? 'alert-bg' : ''}">
                ${sData.waterIntervalDays === INTERVAL_WATER_STOP ? '❄️ 断水・休眠中' : isAlert ? '⚠️ 水やり時期' : '🌿 順調'}
            </div>
            <div class="care-info">
                <p><strong>水:</strong> ${sData.water}</p>
                <p><strong>葉水:</strong> ${sData.mist || 'なし'}</p>
                <p><strong>次回:</strong> <span class="${isAlert ? 'alert-text' : ''}">${nextDate ? formatDateJp(nextDate) : '不要'}</span></p>
            </div>
        `;
    }

    // ----------------------------------------------------
    // 4. Details Modal (カルテ)
    // ----------------------------------------------------
    function showDetailsModal(userPlant, speciesData) {
        currentPlantId = userPlant.id;
        const modal = document.getElementById('details-modal');
        if (!modal) return;

        document.getElementById('detail-plant-name').textContent = userPlant.name;
        document.getElementById('detail-species-name').textContent = speciesData.species;
        document.getElementById('entry-date-display').textContent = formatDateJp(userPlant.entryDate);

        const sData = speciesData.management[getCurrentSeason()];
        document.getElementById('season-care-content').innerHTML = `
            <ul>
                <li><strong>水やり:</strong> ${sData.water}</li>
                <li><strong>葉水:</strong> ${sData.mist || 'なし'}</li>
                <li><strong>置き場所:</strong> ${sData.light}</li>
                <li><strong>最低温度:</strong> ${speciesData.minTemp}℃以上</li>
            </ul>
        `;

        document.getElementById('plant-details').innerHTML = `
            <div class="card basic-info">
                <p><strong>特徴:</strong> ${speciesData.feature}</p>
                <p><strong>肥料:</strong> ${speciesData.maintenance.fertilizer}</p>
                <p><strong>植え替え:</strong> ${speciesData.maintenance.repotting}</p>
            </div>
        `;

        renderHistorySection(userPlant);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function renderHistorySection(userPlant) {
        const historyContainer = document.getElementById('water-done-in-detail');
        historyContainer.innerHTML = '<h3>📝 水やり履歴</h3><ul id="water-history-list" class="history-list"></ul>';
        const list = document.getElementById('water-history-list');
        userPlant.waterLog.slice(0, 5).forEach(log => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${formatDateJp(log.date)}</span> <small>${WATER_TYPES[log.type]?.name || '水のみ'}</small>`;
            list.appendChild(li);
        });
        const logBtn = document.createElement('button');
        logBtn.className = 'action-button tertiary water-done-btn-detail';
        logBtn.textContent = '💧 今日の水やりを記録';
        logBtn.onclick = () => showWaterTypeModal(userPlant.id);
        historyContainer.prepend(logBtn);
    }

    // ----------------------------------------------------
    // 5. Data Logic & Events
    // ----------------------------------------------------
    async function initDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onsuccess = (e) => { db = e.target.result; resolve(db); };
            request.onupgradeneeded = (e) => {
                if (!e.target.result.objectStoreNames.contains(STORE_NAME)) e.target.result.createObjectStore(STORE_NAME);
            };
        });
    }

    async function getImageFromDB(plantId) {
        if (!db) return null;
        return new Promise(resolve => {
            const request = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME).get(String(plantId));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    function saveUserPlants(plants) {
        localStorage.setItem('userPlants', JSON.stringify(plants));
        localStorage.setItem('last_update_time', Date.now());
    }

    function sortAndFilterPlants() {
        let filtered = [...userPlants];
        const activeSeason = getCurrentSeason();
        filtered.sort((a, b) => {
            if (currentSort === 'nextWateringDate') {
                const getVal = (p) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                    const next = calculateNextWateringDate(p.waterLog[0]?.date || p.entryDate, d.management[activeSeason].waterIntervalDays);
                    return next ? new Date(next).getTime() : Date.now() + 315360000000;
                };
                return getVal(a) - getVal(b);
            }
            return a.name.localeCompare(b.name, 'ja');
        });
        return filtered;
    }

    function showWaterTypeModal(plantId) {
        currentPlantId = plantId;
        const modal = document.getElementById('water-type-modal');
        modal.style.display = 'block';
        const options = document.getElementById('water-type-options');
        options.innerHTML = '';
        Object.keys(WATER_TYPES).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'action-button';
            btn.textContent = WATER_TYPES[key].name;
            btn.onclick = () => {
                const idx = userPlants.findIndex(p => String(p.id) === String(currentPlantId));
                userPlants[idx].waterLog.unshift({ date: getLocalTodayDate(), type: key });
                saveUserPlants(userPlants);
                renderPlantCards();
                modal.style.display = 'none';
                if (document.getElementById('details-modal').style.display === 'block') {
                    showDetailsModal(userPlants[idx], PLANT_DATA.find(d => String(d.id) === String(userPlants[idx].speciesId)));
                }
            };
            options.appendChild(btn);
        });
    }

    const init = async () => {
        await initDB();
        userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
        
        document.getElementById('global-season-select')?.addEventListener('change', (e) => {
            currentGlobalSeason = e.target.value;
            localStorage.setItem('global-season-select', currentGlobalSeason);
            renderPlantCards();
        });

        document.getElementById('add-plant-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const speciesId = document.getElementById('species-select').value;
            const waterDate = document.getElementById('last-watered').value;
            const waterType = document.getElementById('water-type-select').value;
            const species = PLANT_DATA.find(p => String(p.id) === String(speciesId));
            const newPlant = {
                id: generateUUID(), speciesId, name: document.getElementById('plant-name').value || species.species,
                entryDate: getLocalTodayDate(), waterLog: [{ date: waterDate, type: waterType }],
                repottingLog: [], hasCustomImage: false
            };
            userPlants.push(newPlant);
            saveUserPlants(userPlants);
            renderPlantCards();
            e.target.reset();
            showNotification('新しく植物を迎えました！', 'success');
        });

        document.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card');
            if (e.target.closest('.delete-btn')) {
                const id = card.dataset.id;
                const idx = userPlants.findIndex(p => String(p.id) === String(id));
                deletedPlantBackup = userPlants[idx];
                deletedPlantIndex = idx;
                userPlants.splice(idx, 1);
                saveUserPlants(userPlants);
                renderPlantCards();
                showNotification('削除しました', 'warning', 5000, {
                    text: '元に戻す',
                    callback: () => {
                        userPlants.splice(deletedPlantIndex, 0, deletedPlantBackup);
                        saveUserPlants(userPlants);
                        renderPlantCards();
                    }
                });
            } else if (e.target.closest('.water-done-btn')) {
                showWaterTypeModal(card.dataset.id);
            } else if (e.target.classList.contains('close-button') || e.target.classList.contains('close-button-water-type')) {
                e.target.closest('.modal').style.display = 'none';
                document.body.style.overflow = '';
            }
        });

        // 植物種のセレクトボックス初期化
        const speciesSelect = document.getElementById('species-select');
        if (speciesSelect) {
            PLANT_DATA.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id; opt.textContent = p.species;
                speciesSelect.appendChild(opt);
            });
        }

        renderPlantCards();
    };

    init();
});

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
        if(!dateStr) return '未登録';
        const d = new Date(dateStr);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }

    // ----------------------------------------------------
    // 2. Database & Storage
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

    async function saveImageToDB(plantId, blob) {
        const tx = db.transaction([STORE_NAME], "readwrite");
        tx.objectStore(STORE_NAME).put(blob, String(plantId));
        return new Promise(resolve => tx.oncomplete = () => resolve());
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
        renderLastUpdateTime();
    }

    // ----------------------------------------------------
    // 3. UI Rendering
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

        list.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'plant-card-container';
        sortedPlants.forEach(plant => {
            const data = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
            if (data) container.appendChild(createPlantCard(plant, data, activeSeasonKey));
        });
        list.appendChild(container);
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
        const nextDateStr = calculateNextWateringDate(lastLog.date, sData.waterIntervalDays);
        const today = new Date(getLocalTodayDate());
        const nextDate = nextDateStr ? new Date(nextDateStr) : null;

        let statusText = '🌿 順調';
        let statusClass = '';
        let dateDisplayText = nextDateStr ? formatDateJp(nextDateStr) : '不要';

        if (sData.waterIntervalDays === INTERVAL_WATER_STOP) {
            statusText = '❄️ 断水・休眠中';
        } else if (nextDate && nextDate <= today) {
            statusText = '⚠️ 水やり時期';
            statusClass = 'alert-bg';
        }

        container.innerHTML = `
            <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
            <div class="card-header"><h3>${userPlant.name}</h3><p>${speciesData.species}</p></div>
            <div class="status-box ${statusClass}">${statusText}</div>
            <div class="care-info">
                <p><strong>水やり:</strong> ${sData.water}</p>
                <p><strong>目安:</strong> <span class="${statusClass ? 'alert-text' : ''}">${dateDisplayText}</span></p>
            </div>
        `;
    }

    // ----------------------------------------------------
    // 4. Modal Logic (Details, Water Type)
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
                <li><strong>必要な光量:</strong> ${sData.light || 'なし'}</li>
                <li><strong>水やり方法:</strong> ${speciesData.water_method}</li>
                <li><strong>季節の頻度:</strong> ${sData.water}</li>
                <li><strong>葉水目安:</strong> ${sData.mist || 'なし'}</li>
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

    function showWaterTypeModal(plantId) {
        currentPlantId = plantId;
        const plant = userPlants.find(p => String(p.id) === String(plantId));
        const modal = document.getElementById('water-type-modal');
        document.getElementById('water-type-modal-title').textContent = `「${plant.name}」の記録`;
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
            } else if (currentSort === 'name') {
                return a.name.localeCompare(b.name, 'ja');
            } else if (currentSort === 'entryDate') {
                return new Date(b.entryDate) - new Date(a.entryDate);
            }
            return 0;
        });
        return filtered;
    }

    function showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ----------------------------------------------------
    // 5. Initialize & Event Listeners
    // ----------------------------------------------------
    const init = async () => {
        await initDB();
        userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];

        // 並び替え・季節設定の初期化
        document.getElementById('sort-select').value = currentSort;
        document.getElementById('global-season-select').value = currentGlobalSeason;

        // 1. 植物名の選択肢を生成
        const speciesSelect = document.getElementById('species-select');
        PLANT_DATA.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id; opt.textContent = p.species;
            speciesSelect.appendChild(opt);
        });

        // 2. 「今日」ボタン
        document.getElementById('set-today-button').addEventListener('click', () => {
            document.getElementById('last-watered').value = getLocalTodayDate();
        });

        // 3. 植物登録フォーム
        document.getElementById('add-plant-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const speciesId = document.getElementById('species-select').value;
            const species = PLANT_DATA.find(p => String(p.id) === String(speciesId));
            const newPlant = {
                id: generateUUID(), speciesId, name: document.getElementById('plant-name').value || species.species,
                entryDate: getLocalTodayDate(), waterLog: [{ date: document.getElementById('last-watered').value, type: document.getElementById('water-type-select').value }],
                repottingLog: []
            };
            userPlants.push(newPlant);
            saveUserPlants(userPlants);
            renderPlantCards();
            e.target.reset();
            showNotification('新しく植物を迎えました！');
        });

        // 4. 写真変更処理
        const photoInput = document.createElement('input');
        photoInput.type = 'file'; photoInput.accept = 'image/*';
        document.getElementById('change-photo-button').addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file && currentPlantId) {
                await saveImageToDB(currentPlantId, file);
                showNotification('写真を保存しました');
                renderPlantCards();
                const plant = userPlants.find(p => p.id === currentPlantId);
                showDetailsModal(plant, PLANT_DATA.find(d => String(d.id) === String(plant.speciesId)));
            }
        });

        // 5. モーダル内アコーディオン
        document.querySelector('.accordion-header').addEventListener('click', (e) => {
            const header = e.currentTarget;
            const content = document.getElementById(header.dataset.target);
            header.classList.toggle('collapsed');
            content.classList.toggle('expanded');
        });

        // 6. 設定変更の監視
        document.getElementById('global-season-select').addEventListener('change', (e) => {
            currentGlobalSeason = e.target.value;
            localStorage.setItem('global-season-select', currentGlobalSeason);
            renderPlantCards();
        });
        document.getElementById('sort-select').addEventListener('change', (e) => {
            currentSort = e.target.value;
            localStorage.setItem('sort-select', currentSort);
            renderPlantCards();
        });

        // 7. エクスポート / インポート
        document.getElementById('export-data-button').addEventListener('click', () => {
            const dataStr = JSON.stringify(userPlants);
            const blob = new Blob([dataStr], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'my-plants.json';
            a.click();
        });
        document.getElementById('import-data-button').addEventListener('click', () => document.getElementById('import-file-input').click());
        document.getElementById('import-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (re) => {
                userPlants = JSON.parse(re.target.result);
                saveUserPlants(userPlants);
                renderPlantCards();
                showNotification('データを読み込みました');
            };
            reader.readAsText(file);
        });

        // 8. 全般的なクリックイベント (削除、記録、閉じる)
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card');
            if (e.target.closest('.delete-btn')) {
                if (confirm('この植物を削除しますか？')) {
                    userPlants = userPlants.filter(p => String(p.id) !== String(card.dataset.id));
                    saveUserPlants(userPlants);
                    renderPlantCards();
                }
            } else if (e.target.closest('.water-done-btn')) {
                showWaterTypeModal(card.dataset.id);
            } else if (e.target.classList.contains('close-button') || e.target.classList.contains('close-button-water-type')) {
                e.target.closest('.modal').style.display = 'none';
                document.body.style.overflow = '';
            } else if (e.target.id === 'edit-plant-name-button') {
                const newName = prompt('新しいニックネームを入力:', document.getElementById('detail-plant-name').textContent);
                if (newName) {
                    const idx = userPlants.findIndex(p => p.id === currentPlantId);
                    userPlants[idx].name = newName;
                    saveUserPlants(userPlants);
                    document.getElementById('detail-plant-name').textContent = newName;
                    renderPlantCards();
                }
            }
        });

        renderPlantCards();
        renderLastUpdateTime();
    };

    function renderLastUpdateTime() {
        const display = document.getElementById('last-update-display');
        if (!display) return;
        const time = localStorage.getItem('last_update_time');
        display.textContent = time ? `最終更新: ${new Date(parseInt(time)).toLocaleString('ja-JP')}` : '';
    }

    init();
});

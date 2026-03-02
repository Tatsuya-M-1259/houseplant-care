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
        SPRING: { name: '春 (3月〜5月)', startMonth: 3, endMonth: 5 },
        SUMMER: { name: '夏 (6月〜8月)', startMonth: 6, endMonth: 8 },
        AUTUMN: { name: '秋 (9月〜11月)', startMonth: 9, endMonth: 11 },
        WINTER: { name: '冬 (12月〜2月)', startMonth: 12, endMonth: 2 }
    };

    const DB_NAME = 'HouseplantDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentFilter = localStorage.getItem('filter-select') || 'all';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';

    let db = null; 
    let userPlants = [];
    let currentPlantId = null;

    // メモリリーク対策用のURL管理セット
    const objectUrls = new Set();

    // ----------------------------------------------------
    // 1. Utilities (UUID, Date, Memory Mgmt)
    // ----------------------------------------------------
    function generateUUID() {
        return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    }

    function getLocalTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

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
        const y = nextDate.getFullYear();
        const m = String(nextDate.getMonth() + 1).padStart(2, '0');
        const d = String(nextDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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
        return `${d.getMonth() + 1}月${d.getDate()}日`;
    }

    // ----------------------------------------------------
    // 2. IndexedDB & Data Persistence
    // ----------------------------------------------------
    async function initDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onsuccess = (e) => { db = e.target.result; resolve(db); };
            request.onupgradeneeded = (e) => {
                if (!e.target.result.objectStoreNames.contains(STORE_NAME)) {
                    e.target.result.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    async function getImageFromDB(plantId) {
        if (!db) return null;
        return new Promise(resolve => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const request = transaction.objectStore(STORE_NAME).get(String(plantId));
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
    // 3. UI Rendering (Cards & Modal)
    // ----------------------------------------------------
    function sortAndFilterPlants() {
        let filtered = [...userPlants];
        const activeSeason = getCurrentSeason();

        if (currentFilter !== 'all') {
            const threshold = { 'temp10': 10, 'temp5': 5, 'temp0': 0 }[currentFilter];
            filtered = filtered.filter(p => {
                const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                return d && d.minTemp >= threshold;
            });
        }

        filtered.sort((a, b) => {
            if (currentSort === 'nextWateringDate') {
                const getSortValue = (plant) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                    if (!d) return Infinity;
                    const last = plant.waterLog[0] || { date: plant.entryDate };
                    const next = calculateNextWateringDate(last.date, d.management[activeSeason].waterIntervalDays);
                    return next ? new Date(next).getTime() : Date.now() + 315360000000;
                };
                return getSortValue(a) - getSortValue(b);
            }
            if (currentSort === 'name') return a.name.localeCompare(b.name, 'ja');
            if (currentSort === 'entryDate') return new Date(b.entryDate) - new Date(a.entryDate);
            return 0;
        });
        return filtered;
    }

    const plantCardList = document.getElementById('plant-card-list');

    function renderPlantCards() {
        if (!plantCardList) return;
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        objectUrls.clear();

        const activeSeasonKey = getCurrentSeason();
        const sortedPlants = sortAndFilterPlants();

        if (sortedPlants.length === 0) {
            plantCardList.innerHTML = `<div class="empty-state"><p>植物が登録されていません。</p></div>`;
            return;
        }

        const cardContainer = document.createElement('div');
        cardContainer.className = 'plant-card-container';

        sortedPlants.forEach(userPlant => {
            const speciesData = PLANT_DATA.find(d => String(d.id) === String(userPlant.speciesId));
            if (speciesData) {
                cardContainer.appendChild(createPlantCard(userPlant, speciesData, activeSeasonKey));
            }
        });

        plantCardList.innerHTML = '';
        plantCardList.appendChild(cardContainer);
    }

    function createPlantCard(userPlant, speciesData, seasonKey) {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.dataset.id = userPlant.id;
        
        card.innerHTML = `
            <div class="controls">
                <span class="drag-handle">☰</span>
                <button class="delete-btn">×</button>
            </div>
            <div class="season-selector">
                ${Object.keys(SEASONS).map(key => `
                    <button class="${key === seasonKey ? 'active' : ''}" data-season="${key}">
                        ${SEASONS[key].name.split(' ')[0]}
                    </button>
                `).join('')}
            </div>
            <div class="card-content-wrapper"></div>
            <div class="card-footer">
                <button class="action-button tertiary water-done-btn">💧 記録</button>
            </div>
        `;

        const contentWrapper = card.querySelector('.card-content-wrapper');
        renderCardContent(contentWrapper, userPlant, speciesData, seasonKey);

        // 季節切り替えイベント
        card.querySelector('.season-selector').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            e.stopPropagation();
            card.querySelectorAll('.season-selector button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCardContent(contentWrapper, userPlant, speciesData, btn.dataset.season);
        });

        // カードクリックで詳細（カルテ）を開く
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
        if (blob) {
            imgSrc = (blob instanceof Blob) ? URL.createObjectURL(blob) : blob;
            if (imgSrc.startsWith('blob:')) objectUrls.add(imgSrc);
        }

        const sData = speciesData.management[seasonKey];
        const lastLog = userPlant.waterLog[0] || { date: userPlant.entryDate };
        const nextDate = calculateNextWateringDate(lastLog.date, sData.waterIntervalDays);
        const isAlert = nextDate && new Date(nextDate) <= new Date(getLocalTodayDate());

        container.innerHTML = `
            <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
            <div class="card-header">
                <h3>${userPlant.name}</h3>
                <p>${speciesData.species}</p>
            </div>
            <div class="status-box ${isAlert ? 'alert-bg' : ''}">
                ${sData.waterIntervalDays === INTERVAL_WATER_STOP ? '❄️ 冬季断水・休眠中' : 
                  isAlert ? '⚠️ 水やり時期' : '🌿 順調'}
            </div>
            <div class="care-info">
                <p><strong>水やり:</strong> ${sData.water}</p>
                <p><strong>葉水:</strong> ${sData.mist || 'なし'}</p>
                <p><strong>次回目安:</strong> <span class="${isAlert ? 'alert-text' : ''}">
                    ${nextDate ? formatDateJp(nextDate) : '不要'}
                </span></p>
            </div>
        `;
    }

    // ----------------------------------------------------
    // 4. Details Modal (The Karte)
    // ----------------------------------------------------
    function showDetailsModal(userPlant, speciesData) {
        currentPlantId = userPlant.id;
        const modal = document.getElementById('details-modal');
        if (!modal) return;

        document.getElementById('detail-plant-name').textContent = userPlant.name;
        document.getElementById('detail-species-name').textContent = speciesData.species;
        document.getElementById('entry-date-display').textContent = formatDateJp(userPlant.entryDate);

        // 現在の季節に応じた詳細ケア
        const sData = speciesData.management[getCurrentSeason()];
        const careContent = document.getElementById('season-care-content');
        careContent.innerHTML = `
            <ul>
                <li><strong>水やり方法:</strong> ${speciesData.water_method}</li>
                <li><strong>季節の頻度:</strong> ${sData.water}</li>
                <li><strong>葉水タイミング:</strong> ${sData.mist || 'なし'}</li>
                <li><strong>置き場所:</strong> ${sData.light}</li>
                <li><strong>最低温度:</strong> ${speciesData.minTemp}℃以上</li>
            </ul>
        `;

        // 基本情報の表示
        const plantDetails = document.getElementById('plant-details');
        plantDetails.innerHTML = `
            <div class="card basic-info">
                <h3>🔍 特徴・お手入れ</h3>
                <p><strong>特徴:</strong> ${speciesData.feature}</p>
                <p><strong>肥料:</strong> ${speciesData.maintenance.fertilizer}</p>
                <p><strong>植え替え:</strong> ${speciesData.maintenance.repotting}</p>
                <p><strong>剪定:</strong> ${speciesData.maintenance.pruning}</p>
            </div>
        `;

        // 履歴セクション（水やり履歴など）
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
            li.innerHTML = `<span>${formatDateJp(log.date)}</span> <small class="type-badge">${WATER_TYPES[log.type]?.name || '水のみ'}</small>`;
            list.appendChild(li);
        });
        
        const logBtn = document.createElement('button');
        logBtn.className = 'action-button tertiary water-done-btn-detail';
        logBtn.textContent = '💧 今日の水やりを記録';
        logBtn.onclick = () => showWaterTypeModal(userPlant.id);
        historyContainer.prepend(logBtn);
    }

    // ----------------------------------------------------
    // 5. Events & Initialization
    // ----------------------------------------------------
    function showWaterTypeModal(plantId) {
        currentPlantId = plantId;
        const plant = userPlants.find(p => String(p.id) === String(plantId));
        const modal = document.getElementById('water-type-modal');
        document.getElementById('water-type-modal-title').textContent = `「${plant.name}」の水やり記録`;
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
                if (modal.style.display === 'block') modal.style.display = 'none';
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
        
        // 季節/ソート設定の初期化
        const gSelect = document.getElementById('global-season-select');
        if (gSelect) {
            gSelect.value = currentGlobalSeason;
            gSelect.addEventListener('change', (e) => {
                currentGlobalSeason = e.target.value;
                localStorage.setItem('global-season-select', currentGlobalSeason);
                renderPlantCards();
            });
        }
        
        document.getElementById('sort-select')?.addEventListener('change', (e) => {
            currentSort = e.target.value;
            localStorage.setItem('sort-select', currentSort);
            renderPlantCards();
        });

        // 植物登録フォーム
        document.getElementById('add-plant-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const speciesId = document.getElementById('species-select').value;
            const waterDate = document.getElementById('last-watered').value;
            const waterType = document.getElementById('water-type-select').value;
            const species = PLANT_DATA.find(p => String(p.id) === String(speciesId));

            const newPlant = {
                id: generateUUID(),
                speciesId: speciesId,
                name: document.getElementById('plant-name').value || species.species,
                entryDate: getLocalTodayDate(),
                waterLog: [{ date: waterDate, type: waterType }],
                repottingLog: [],
                hasCustomImage: false
            };
            userPlants.push(newPlant);
            saveUserPlants(userPlants);
            renderPlantCards();
            e.target.reset();
        });

        // 削除・記録ボタン（デリゲート）
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card');
            if (!card && !e.target.closest('.modal-content')) return;

            if (e.target.closest('.delete-btn')) {
                const id = card.dataset.id;
                if (confirm('この植物を削除しますか？')) {
                    userPlants = userPlants.filter(p => String(p.id) !== String(id));
                    saveUserPlants(userPlants);
                    renderPlantCards();
                }
            } else if (e.target.closest('.water-done-btn')) {
                showWaterTypeModal(card.dataset.id);
            } else if (e.target.classList.contains('close-button') || e.target.classList.contains('close-button-water-type')) {
                e.target.closest('.modal').style.display = 'none';
                document.body.style.overflow = '';
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

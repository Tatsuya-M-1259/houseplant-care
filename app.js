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

    // メモリリーク対策用のURL管理
    const objectUrls = new Set();

    // ----------------------------------------------------
    // 1. Utilities (UUID, Date, Memory)
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

    /**
     * 水やり推奨日の計算
     * 断水(999)の場合はnullを返す
     */
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
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    }

    // ----------------------------------------------------
    // 2. IndexedDB & Data Persistence
    // ----------------------------------------------------
    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onsuccess = (e) => { db = e.target.result; resolve(db); };
            request.onupgradeneeded = (e) => {
                const dbInstance = e.target.result;
                if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                    dbInstance.createObjectStore(STORE_NAME);
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

    async function saveImageToDB(plantId, blob) {
        if (!db) return;
        const transaction = db.transaction([STORE_NAME], "readwrite");
        await transaction.objectStore(STORE_NAME).put(blob, String(plantId));
    }

    function saveUserPlants(plants) {
        localStorage.setItem('userPlants', JSON.stringify(plants));
        localStorage.setItem('last_update_time', Date.now());
        renderLastUpdateTime();
    }

    // ----------------------------------------------------
    // 3. Main Logic (Sort, Filter, Render)
    // ----------------------------------------------------
    function sortAndFilterPlants() {
        let filtered = [...userPlants];
        const activeSeason = getCurrentSeason();

        // フィルタリング: 耐寒温度
        if (currentFilter !== 'all') {
            const threshold = { 'temp10': 10, 'temp5': 5, 'temp0': 0 }[currentFilter];
            filtered = filtered.filter(p => {
                const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                return d && d.minTemp >= threshold;
            });
        }

        // ソート
        filtered.sort((a, b) => {
            if (currentSort === 'nextWateringDate') {
                const getSortValue = (plant) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                    if (!d) return Infinity;
                    const last = plant.waterLog[0] || { date: plant.entryDate };
                    const next = calculateNextWateringDate(last.date, d.management[activeSeason].waterIntervalDays);
                    // 断水中のものは末尾に送る（10年後のタイムスタンプ）
                    return next ? new Date(next).getTime() : Date.now() + 315360000000;
                };
                return getSortValue(a) - getSortValue(getSortValue(b));
            }
            if (currentSort === 'name') return a.name.localeCompare(b.name, 'ja');
            if (currentSort === 'entryDate') return new Date(b.entryDate) - new Date(a.entryDate);
            if (currentSort === 'minTemp') {
                const dA = PLANT_DATA.find(pd => String(pd.id) === String(a.speciesId));
                const dB = PLANT_DATA.find(pd => String(pd.id) === String(b.speciesId));
                return (dA?.minTemp || 0) - (dB?.minTemp || 0);
            }
            return 0;
        });

        return filtered;
    }

    const plantCardList = document.getElementById('plant-card-list');

    function renderPlantCards() {
        if (!plantCardList) return;
        
        // メモリ解放
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
                const card = createPlantCard(userPlant, speciesData, activeSeasonKey);
                cardContainer.appendChild(card);
            }
        });

        plantCardList.innerHTML = '';
        plantCardList.appendChild(cardContainer);
    }

    function createPlantCard(userPlant, speciesData, seasonKey) {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.dataset.id = userPlant.id;
        
        const seasonButtons = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].map(key => `
            <button class="${key === seasonKey ? 'active' : ''}" data-season="${key}">
                ${SEASONS[key].name.split(' ')[0]}
            </button>
        `).join('');

        card.innerHTML = `
            <div class="controls">
                <span class="drag-handle">☰</span>
                <button class="delete-btn">×</button>
            </div>
            <div class="season-selector">${seasonButtons}</div>
            <div class="card-content-wrapper"></div>
            <div class="card-footer">
                <button class="action-button tertiary water-done-btn">💧 記録</button>
            </div>
        `;

        const contentWrapper = card.querySelector('.card-content-wrapper');
        renderCardContent(contentWrapper, userPlant, speciesData, seasonKey);

        // カード内限定の季節切り替え
        card.querySelector('.season-selector').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            card.querySelectorAll('.season-selector button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCardContent(contentWrapper, userPlant, speciesData, btn.dataset.season);
        });

        return card;
    }

    async function renderCardContent(container, userPlant, speciesData, seasonKey) {
        let imgSrc = `./${speciesData.img}`;
        if (userPlant.hasCustomImage) {
            const blob = await getImageFromDB(userPlant.id);
            if (blob) {
                imgSrc = (blob instanceof Blob) ? URL.createObjectURL(blob) : blob;
                if (imgSrc.startsWith('blob:')) objectUrls.add(imgSrc);
            }
        }

        const seasonData = speciesData.management[seasonKey];
        const lastLog = userPlant.waterLog[0] || { date: userPlant.entryDate };
        const nextDate = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        const today = new Date(getLocalTodayDate());
        const isAlert = nextDate && new Date(nextDate) <= today;

        container.innerHTML = `
            <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
            <div class="card-header">
                <h3>${userPlant.name}</h3>
                <p>${speciesData.species}</p>
            </div>
            <div class="status-box ${isAlert ? 'alert-bg' : ''}">
                ${seasonData.waterIntervalDays === INTERVAL_WATER_STOP ? '❄️ 冬季断水・休眠中' : 
                  isAlert ? '⚠️ 水やりの時期です' : '🌿 順調です'}
            </div>
            <div class="care-info">
                <p><strong>水やり:</strong> ${seasonData.water}</p>
                <p><strong>次回目安:</strong> <span class="${isAlert ? 'alert-text' : ''}">
                    ${nextDate ? formatDateJp(nextDate) : '不要（断水中）'}
                </span></p>
            </div>
        `;
    }

    function renderLastUpdateTime() {
        const display = document.getElementById('last-update-display');
        if (!display) return;
        const time = localStorage.getItem('last_update_time');
        display.textContent = time ? `最終更新: ${new Date(parseInt(time)).toLocaleString('ja-JP')}` : '';
    }

    // ----------------------------------------------------
    // 4. Modal & Interaction
    // ----------------------------------------------------
    function showWaterTypeModal(plantId) {
        const plant = userPlants.find(p => String(p.id) === String(plantId));
        const modal = document.getElementById('water-type-modal');
        if (!plant || !modal) return;

        currentPlantId = plantId;
        document.getElementById('water-type-modal-title').textContent = `「${plant.name}」の記録`;
        modal.style.display = 'block';

        const options = modal.querySelector('#water-type-options');
        options.innerHTML = '';
        Object.keys(WATER_TYPES).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'action-button';
            btn.textContent = WATER_TYPES[key].name;
            btn.onclick = () => {
                const today = getLocalTodayDate();
                const plantIdx = userPlants.findIndex(p => String(p.id) === String(currentPlantId));
                userPlants[plantIdx].waterLog.unshift({ date: today, type: key });
                saveUserPlants(userPlants);
                renderPlantCards();
                modal.style.display = 'none';
            };
            options.appendChild(btn);
        });
    }

    // ----------------------------------------------------
    // 5. Initialize & Event Listeners
    // ----------------------------------------------------
    const init = async () => {
        await initDB();
        userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
        
        // 季節設定
        const seasonSelect = document.getElementById('global-season-select');
        if (seasonSelect) {
            seasonSelect.value = currentGlobalSeason;
            seasonSelect.addEventListener('change', (e) => {
                currentGlobalSeason = e.target.value;
                localStorage.setItem('global-season-select', currentGlobalSeason);
                renderPlantCards();
            });
        }

        // ソート設定
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.value = currentSort;
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                localStorage.setItem('sort-select', currentSort);
                renderPlantCards();
            });
        }

        // 植物追加フォーム
        document.getElementById('add-plant-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const speciesId = document.getElementById('species-select').value;
            const name = document.getElementById('plant-name').value;
            const date = document.getElementById('last-watered').value;
            const type = document.getElementById('water-type-select').value;

            if (!speciesId || !date) return;

            const species = PLANT_DATA.find(p => String(p.id) === String(speciesId));
            const newPlant = {
                id: generateUUID(),
                speciesId: speciesId,
                name: name || species.species,
                entryDate: getLocalTodayDate(),
                waterLog: [{ date: date, type: type }],
                repottingLog: [],
                hasCustomImage: false
            };

            userPlants.push(newPlant);
            saveUserPlants(userPlants);
            renderPlantCards();
            e.target.reset();
        });

        // 削除・水やりボタン（デリゲート）
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card');
            if (!card) return;
            const id = card.dataset.id;

            if (e.target.closest('.delete-btn')) {
                if (confirm('削除しますか？')) {
                    userPlants = userPlants.filter(p => String(p.id) !== String(id));
                    saveUserPlants(userPlants);
                    renderPlantCards();
                }
            } else if (e.target.closest('.water-done-btn')) {
                showWaterTypeModal(id);
            }
        });

        // モーダルを閉じる
        document.querySelectorAll('.close-button, .close-button-water-type').forEach(btn => {
            btn.onclick = () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            };
        });

        renderPlantCards();
        renderLastUpdateTime();
    };

    init();
});

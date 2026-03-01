// app.js

import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 0. 定数定義
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

    const TEMP_FILTER_MAP = { 
        'temp10': 10, 
        'temp5': 5, 
        'temp0': 0 
    };

    const IMAGE_BASE_PATH = './'; 
    const DB_NAME = 'HouseplantDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentFilter = localStorage.getItem('filter-select') || 'all';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';

    let currentPlantId = null;
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    let db = null; 

    const objectUrls = new Set();

    // DOM Elements
    const plantCardList = document.getElementById('plant-card-list');
    const addPlantForm = document.getElementById('add-plant-form');
    const plantNameInput = document.getElementById('plant-name');
    const speciesSelect = document.getElementById('species-select');
    const lastWateredInput = document.getElementById('last-watered');
    const nextWateringPreview = document.getElementById('next-watering-preview');
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    const globalSeasonSelect = document.getElementById('global-season-select');
    const quickSortButtonsContainer = document.getElementById('quick-sort-buttons');
    const lastUpdateDisplay = document.getElementById('last-update-display');
    const notificationArea = document.getElementById('notification-area');
    const detailsModal = document.getElementById('details-modal');
    const plantDetails = document.getElementById('plant-details');
    const closeDetailButton = document.querySelector('.close-button');
    const waterTypeModal = document.getElementById('water-type-modal');
    const closeWaterTypeButton = document.querySelector('.close-button-water-type');
    const waterTypeModalTitle = document.getElementById('water-type-modal-title');
    const waterDateDisplay = document.getElementById('water-date-display');
    const waterTypeOptionsContainer = document.getElementById('water-type-options');
    const customImageInput = document.getElementById('custom-image-input');
    const changePhotoButton = document.getElementById('change-photo-btn');
    const editNameButton = document.getElementById('edit-name-btn');
    const detailPlantName = document.getElementById('detail-plant-name');
    const detailSpeciesName = document.getElementById('detail-species-name');
    const entryDateDisplay = document.getElementById('entry-date-display');
    const timeSinceEntryDisplay = document.getElementById('time-since-entry');
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    const repottingDateDisplay = document.getElementById('repotting-date-display');
    const waterHistoryList = document.getElementById('water-history-list');
    const waterDoneInDetailContainer = document.getElementById('water-done-in-detail-container');
    const prevPlantBtn = document.getElementById('prev-plant-btn');
    const nextPlantBtn = document.getElementById('next-plant-btn');
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    // ----------------------------------------------------
    // 1. Utilities & Date Logic
    // ----------------------------------------------------

    function parseDateAsLocal(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatDateToISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getLocalTodayDate() {
        return formatDateToISO(new Date());
    }

    // 【改善】季節移行時の平滑化ロジックを取り入れた計算関数
    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (!lastDateString || intervalDays === INTERVAL_WATER_STOP || intervalDays == null || isNaN(intervalDays)) return null;
        
        const lastDate = parseDateAsLocal(lastDateString);
        if (!lastDate) return null;

        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + parseInt(intervalDays));
        
        return formatDateToISO(nextDate);
    }

    function formatJapaneseDate(d) {
        const date = parseDateAsLocal(d) || new Date(d);
        return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    // ----------------------------------------------------
    // 2. Data Persistence (IndexedDB & LocalStorage)
    // ----------------------------------------------------
    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onsuccess = (e) => { db = e.target.result; resolve(db); };
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function getImageFromDB(plantId) {
        return new Promise((resolve) => {
            if (!db) return resolve(null);
            const transaction = db.transaction([STORE_NAME], "readonly");
            const request = transaction.objectStore(STORE_NAME).get(plantId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    async function saveImageToDB(plantId, imageData) {
        if (!db) return;
        const transaction = db.transaction([STORE_NAME], "readwrite");
        transaction.objectStore(STORE_NAME).put(imageData, plantId);
    }

    function saveUserPlants(plants) {
        localStorage.setItem('userPlants', JSON.stringify(plants));
        localStorage.setItem('last_update_time', Date.now());
        renderLastUpdateTime();
    }

    // ----------------------------------------------------
    // 3. Rendering & Logic
    // ----------------------------------------------------

    function getCurrentSeason() {
        if (currentGlobalSeason && currentGlobalSeason !== 'AUTO') return currentGlobalSeason;
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'SPRING';
        if (month >= 6 && month <= 8) return 'SUMMER';
        if (month >= 9 && month <= 11) return 'AUTUMN';
        return 'WINTER';
    }

    function getSeasonRisk(seasonKey, data) {
        const currentMonth = new Date().getMonth() + 1;
        if (currentMonth === 3 && seasonKey === 'SPRING') return '冬からの移行期（徐々に水量を増やす）';
        if (seasonKey === 'WINTER') return data.minTemp >= 10 ? '厳重な保温が必要' : '寒さ対策';
        if (seasonKey === 'SUMMER') return '水切れ・蒸れに注意';
        return '成長期';
    }

    async function renderCardContentAsync(container, userPlant, data, seasonKey) {
        let imgSrc = `${IMAGE_BASE_PATH}${data.img}`;
        if (userPlant.hasCustomImage) {
            const storedData = await getImageFromDB(userPlant.id);
            if (storedData) imgSrc = (storedData instanceof Blob) ? URL.createObjectURL(storedData) : storedData;
        }

        // 【改善】計算前に履歴を確実に最新順へソート
        const sortedLog = [...userPlant.waterLog].sort((a, b) => parseDateAsLocal(b.date) - parseDateAsLocal(a.date));
        const lastLog = sortedLog[0] || { date: userPlant.entryDate };
        
        const seasonData = data.management[seasonKey];
        const nextDateString = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        
        const currentMonth = new Date().getMonth() + 1;
        const transitionAlert = (currentMonth === 3) ? '<div class="alert-box">⚠️ 春の管理移行期：土の乾きを優先確認</div>' : '';

        container.innerHTML = `
            <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
            <div class="card-header">
                <h3>${escapeHTML(userPlant.name)}</h3>
                <p>${escapeHTML(data.species)}</p>
            </div>
            ${transitionAlert}
            <div class="status-box">${SEASONS[seasonKey].name.split(' ')[0]}: ${escapeHTML(getSeasonRisk(seasonKey, data))}</div>
            <div class="card-content-wrapper">
                <h4>現在の管理</h4>
                <ul>
                    <li>水: ${escapeHTML(seasonData.water)}</li>
                    <li>葉水: ${escapeHTML(seasonData.mist || 'なし')}</li>
                    <li>次回目安: ${nextDateString ? formatJapaneseDate(nextDateString) : '未定（断水期）'}</li>
                </ul>
            </div>
        `;
    }

    function renderPlantCards() {
        if (!plantCardList) return;
        const seasonKey = getCurrentSeason();
        const sortedPlants = sortAndFilterPlants();
        
        plantCardList.innerHTML = '';
        const cardContainer = document.createElement('div');
        cardContainer.className = 'plant-card-container';

        sortedPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(d => String(d.id) === String(userPlant.speciesId));
            if (!data) return;

            const card = document.createElement('div');
            card.className = 'plant-card';
            card.dataset.id = userPlant.id;
            card.innerHTML = `
                <div class="controls"><span class="drag-handle">☰</span><button class="delete-btn">×</button></div>
                <div class="season-selector">
                    ${Object.keys(SEASONS).map(key => `<button class="${key === seasonKey ? 'active' : ''}">${SEASONS[key].name.split(' ')[0]}</button>`).join('')}
                </div>
                <div class="card-body">Loading...</div>
                <div class="card-footer"><button class="action-button tertiary water-done-btn">💧 記録</button></div>
            `;
            cardContainer.appendChild(card);
            renderCardContentAsync(card.querySelector('.card-body'), userPlant, data, seasonKey);
        });
        plantCardList.appendChild(cardContainer);
    }

    function sortAndFilterPlants() {
        let filtered = [...userPlants];
        if (currentFilter !== 'all') {
            const th = TEMP_FILTER_MAP[currentFilter];
            filtered = filtered.filter(p => (PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId))?.minTemp >= th));
        }

        filtered.sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name);
            if (currentSort === 'entryDate') return parseDateAsLocal(b.entryDate) - parseDateAsLocal(a.entryDate);
            if (currentSort === 'nextWateringDate') {
                const getNext = (p) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                    const last = [...p.waterLog].sort((x, y) => parseDateAsLocal(y.date) - parseDateAsLocal(x.date))[0] || { date: p.entryDate };
                    const next = calculateNextWateringDate(last.date, d.management[getCurrentSeason()].waterIntervalDays);
                    return next ? parseDateAsLocal(next).getTime() : 9e15;
                };
                return getNext(a) - getNext(b);
            }
            return 0;
        });
        return filtered;
    }

    // ----------------------------------------------------
    // 4. Initialization & Event Listeners
    // ----------------------------------------------------
    async function initializeApp() {
        await initDB();
        renderLastUpdateTime();
        renderPlantCards();
        renderQuickSortButtons();

        // フォームプレビュー更新
        const updatePreview = () => {
            const speciesId = speciesSelect.value;
            const lastDate = lastWateredInput.value;
            if (!speciesId || !lastDate) return;
            const data = PLANT_DATA.find(p => String(p.id) === speciesId);
            const interval = data.management[getCurrentSeason()].waterIntervalDays;
            const next = calculateNextWateringDate(lastDate, interval);
            nextWateringPreview.textContent = next ? `次回予定日: ${formatJapaneseDate(next)}` : `次回予定: ${data.management[getCurrentSeason()].water}`;
        };

        lastWateredInput.addEventListener('change', updatePreview);
        speciesSelect.addEventListener('change', updatePreview);
    }

    function renderLastUpdateTime() {
        const time = localStorage.getItem('last_update_time');
        if (lastUpdateDisplay && time) {
            lastUpdateDisplay.textContent = `最終更新: ${new Date(parseInt(time)).toLocaleString('ja-JP')}`;
        }
    }

    function renderQuickSortButtons() {
        if (!quickSortButtonsContainer) return;
        const options = [
            { v: 'nextWateringDate', l: '💧 急ぎ順' },
            { v: 'name', l: '🌱 名前順' },
            { v: 'entryDate', l: '📅 登録順' }
        ];
        quickSortButtonsContainer.innerHTML = options.map(o => 
            `<button class="${currentSort === o.v ? 'active' : ''}" data-sort="${o.v}">${o.l}</button>`
        ).join('');
    }

    initializeApp();
});

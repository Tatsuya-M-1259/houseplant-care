// app.js

import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 0. 基本設定とサービスワーカー更新検知
    // ----------------------------------------------------
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (confirm('新しいバージョンがあります。更新を適用しますか？')) {
                            window.location.reload();
                        }
                    }
                };
            };
        });
    }

    const SEASONS = {
        SPRING: { name: '春 (3月〜5月)', icon: '🌱' },
        SUMMER: { name: '夏 (6月〜8月)', icon: '☀️' },
        AUTUMN: { name: '秋 (9月〜11月)', icon: '🍂' },
        WINTER: { name: '冬 (12月〜2月)', icon: '❄️' }
    };

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];

    // ----------------------------------------------------
    // 1. 日付ロジック（パースの統一）
    // ----------------------------------------------------
    function parseDateAsLocal(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatDateToISO(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function getCurrentSeason() {
        if (currentGlobalSeason !== 'AUTO') return currentGlobalSeason;
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'SPRING';
        if (month >= 6 && month <= 8) return 'SUMMER';
        if (month >= 9 && month <= 11) return 'AUTUMN';
        return 'WINTER';
    }

    // ----------------------------------------------------
    // 2. 水やり推奨日計算（移行期の平滑化）
    // ----------------------------------------------------
    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (!lastDateString || intervalDays === INTERVAL_WATER_STOP || intervalDays == null || isNaN(intervalDays)) return null;
        const lastDate = parseDateAsLocal(lastDateString);
        lastDate.setDate(lastDate.getDate() + parseInt(intervalDays));
        return formatDateToISO(lastDate);
    }

    // ----------------------------------------------------
    // 3. レンダリング
    // ----------------------------------------------------
    async function renderCardContentAsync(container, userPlant, data, seasonKey) {
        const sortedLog = [...userPlant.waterLog].sort((a, b) => parseDateAsLocal(b.date) - parseDateAsLocal(a.date));
        const lastLog = sortedLog[0] || { date: userPlant.entryDate };
        const seasonData = data.management[seasonKey];

        const nextDateStr = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        const nextDateDisplay = nextDateStr 
            ? `${nextDateStr.replace(/-/g, '/')}頃` 
            : `<span class="status-dormant">冬の休眠中（断水）</span>`;

        const currentMonth = new Date().getMonth() + 1;
        // 3月かつ春設定の場合にアラートを表示
        const transitionAlert = (currentMonth === 3 && seasonKey === 'SPRING') 
            ? `<div class="alert-box">⚠️ <strong>春の管理移行期</strong><br>土の乾きを直接指で触って確認してください</div>` 
            : '';

        container.innerHTML = `
            <div class="card-image"><img src="./${data.img}" loading="lazy"></div>
            <div class="card-header">
                <h3>${escapeHTML(userPlant.name)}</h3>
                <p>${escapeHTML(data.species)}</p>
            </div>
            ${transitionAlert}
            <div class="status-box">${SEASONS[seasonKey].icon} ${SEASONS[seasonKey].name.split(' ')[0]}の管理</div>
            <div class="card-content-wrapper">
                <ul>
                    <li>水やり: ${escapeHTML(seasonData.water)}</li>
                    <li>葉水: ${escapeHTML(seasonData.mist || '必要なし')}</li>
                    <li>次回目安: ${nextDateDisplay}</li>
                </ul>
            </div>
        `;
    }

    // グローバルな季節設定を更新し再描画
    window.updateGlobalSeason = (newSeason) => {
        currentGlobalSeason = newSeason;
        localStorage.setItem('global-season-select', newSeason);
        renderPlantCards();
        renderQuickSortButtons(); // ソートボタンの状態も更新
    };

    function renderPlantCards() {
        const plantCardList = document.getElementById('plant-card-list');
        if (!plantCardList) return;
        const seasonKey = getCurrentSeason();
        plantCardList.innerHTML = '';
        
        const sortedPlants = sortAndFilterPlants();
        sortedPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(d => String(d.id) === String(userPlant.speciesId));
            const card = document.createElement('div');
            card.className = 'plant-card';
            card.innerHTML = `
                <div class="season-selector">
                    ${Object.keys(SEASONS).map(key => `
                        <button class="${key === seasonKey ? 'active' : ''}" onclick="updateGlobalSeason('${key}')">
                            ${SEASONS[key].name.split(' ')[0]}
                        </button>
                    `).join('')}
                    <button class="${currentGlobalSeason === 'AUTO' ? 'active' : ''}" onclick="updateGlobalSeason('AUTO')">自動</button>
                </div>
                <div class="card-body"></div>
            `;
            plantCardList.appendChild(card);
            renderCardContentAsync(card.querySelector('.card-body'), userPlant, data, seasonKey);
        });
    }

    function sortAndFilterPlants() {
        let filtered = [...userPlants];
        if (currentSort === 'nextWateringDate') {
            filtered.sort((a, b) => {
                const getNext = (p) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                    const last = [...p.waterLog].sort((x, y) => parseDateAsLocal(y.date) - parseDateAsLocal(x.date))[0] || { date: p.entryDate };
                    const next = calculateNextWateringDate(last.date, d.management[getCurrentSeason()].waterIntervalDays);
                    return next ? parseDateAsLocal(next).getTime() : 9e15;
                };
                return getNext(a) - getNext(b);
            });
        }
        return filtered;
    }

    function renderQuickSortButtons() {
        const container = document.getElementById('quick-sort-buttons');
        if (!container) return;
        const options = [
            { v: 'nextWateringDate', l: '💧 急ぎ順' },
            { v: 'name', l: '🌱 名前順' },
            { v: 'entryDate', l: '📅 登録順' }
        ];
        container.innerHTML = options.map(o => 
            `<button class="action-button secondary ${currentSort === o.v ? 'active' : ''}" onclick="setSort('${o.v}')">${o.l}</button>`
        ).join('');
    }

    window.setSort = (sortType) => {
        currentSort = sortType;
        localStorage.setItem('sort-select', sortType);
        renderPlantCards();
        renderQuickSortButtons();
    };

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    renderPlantCards();
    renderQuickSortButtons();
});

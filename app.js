// app.js

import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 定数・基本設定
    const SEASONS = {
        SPRING: { name: '春 (3月〜5月)', icon: '🌱' },
        SUMMER: { name: '夏 (6月〜8月)', icon: '☀️' },
        AUTUMN: { name: '秋 (9月〜11月)', icon: '🍂' },
        WINTER: { name: '冬 (12月〜2月)', icon: '❄️' }
    };

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];

    // 日付処理の統一
    function parseDateAsLocal(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function formatDateToISO(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    // 現在の適用季節を取得
    function getCurrentSeason() {
        if (currentGlobalSeason !== 'AUTO') return currentGlobalSeason;
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'SPRING';
        if (month >= 6 && month <= 8) return 'SUMMER';
        if (month >= 9 && month <= 11) return 'AUTUMN';
        return 'WINTER';
    }

    // 【改善】断水期の表現と移行期のリスク判定
    function getWateringStatusLabel(nextDate, seasonData) {
        if (seasonData.waterIntervalDays === INTERVAL_WATER_STOP) {
            return `<span class="status-dormant">💤 水やり不要（休眠中）</span>`;
        }
        return nextDate ? `${nextDate.getFullYear()}年${nextDate.getMonth()+1}月${date.getDate()}日` : '状態を確認';
    }

    async function renderCardContentAsync(container, userPlant, data, seasonKey) {
        const sortedLog = [...userPlant.waterLog].sort((a, b) => parseDateAsLocal(b.date) - parseDateAsLocal(a.date));
        const lastLog = sortedLog[0] || { date: userPlant.entryDate };
        const seasonData = data.management[seasonKey];

        // 次回予定日の算出
        let nextDateDisplay = '未定';
        if (seasonData.waterIntervalDays !== INTERVAL_WATER_STOP) {
            const lastDate = parseDateAsLocal(lastLog.date);
            lastDate.setDate(lastDate.getDate() + parseInt(seasonData.waterIntervalDays));
            nextDateDisplay = `${lastDate.getFullYear()}年${lastDate.getMonth()+1}月${lastDate.getDate()}日`;
        } else {
            nextDateDisplay = `<strong style="color: var(--primary-dark);">冬の休眠中（断水）</strong>`;
        }

        // 【改善】視認性を高めたアラート
        const currentMonth = new Date().getMonth() + 1;
        const transitionAlert = (currentMonth === 3 && seasonKey === 'SPRING') 
            ? `<div class="alert-box">⚠️ <strong>春の管理移行期</strong><br>土の乾き具合を直接指で触って確認してください</div>` 
            : '';

        container.innerHTML = `
            <div class="card-image"><img src="${data.img}" loading="lazy"></div>
            <div class="card-header">
                <h3>${userPlant.name}</h3>
                <p>${data.species}</p>
            </div>
            ${transitionAlert}
            <div class="status-box">${SEASONS[seasonKey].icon} ${SEASONS[seasonKey].name.split(' ')[0]}の管理</div>
            <div class="card-content-wrapper">
                <ul>
                    <li>💧 水やり: ${seasonData.water}</li>
                    <li>💨 葉水: ${seasonData.mist || '必要なし'}</li>
                    <li>📅 次回目安: ${nextDateDisplay}</li>
                </ul>
            </div>
        `;
    }

    // 【改善】季節設定の連動UI
    function updateGlobalSeason(newSeason) {
        currentGlobalSeason = newSeason;
        localStorage.setItem('global-season-select', newSeason);
        renderPlantCards();
    }

    function renderPlantCards() {
        const plantCardList = document.getElementById('plant-card-list');
        const seasonKey = getCurrentSeason();
        plantCardList.innerHTML = '';
        
        userPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(d => String(d.id) === String(userPlant.speciesId));
            const card = document.createElement('div');
            card.className = 'plant-card';
            card.innerHTML = `
                <div class="season-selector">
                    ${Object.keys(SEASONS).map(key => `
                        <button class="${key === seasonKey ? 'active' : ''}" onclick="window.updateGlobalSeason('${key}')">
                            ${SEASONS[key].name.split(' ')[0]}
                        </button>
                    `).join('')}
                    <button class="${currentGlobalSeason === 'AUTO' ? 'active' : ''}" onclick="window.updateGlobalSeason('AUTO')">自動</button>
                </div>
                <div class="card-body"></div>
                <div class="card-footer"><button class="action-button tertiary">💧 記録する</button></div>
            `;
            plantCardList.appendChild(card);
            renderCardContentAsync(card.querySelector('.card-body'), userPlant, data, seasonKey);
        });
    }

    // クイックソートのレンダリング（フィードバック強化）
    window.setSort = (sortType) => {
        currentSort = sortType;
        localStorage.setItem('sort-select', sortType);
        renderPlantCards();
        renderSortButtons();
    };

    function renderSortButtons() {
        const container = document.getElementById('quick-sort-buttons');
        const options = [{v:'nextWateringDate', l:'💧 急ぎ順'}, {v:'name', l:'🌱 名前順'}];
        container.innerHTML = options.map(o => `
            <button class="action-button secondary ${currentSort === o.v ? 'active' : ''}" onclick="setSort('${o.v}')">${o.l}</button>
        `).join('');
    }

    window.updateGlobalSeason = updateGlobalSeason;
    renderSortButtons();
    renderPlantCards();
});

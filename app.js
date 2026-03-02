// app.js
import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    // サービスワーカーの更新検知
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

    // 【修正】日付形式が混在（/ や -）していても正確に読み込むロジック
    function parseDateAsLocal(dateString) {
        if (!dateString) return null;
        const normalized = dateString.replace(/\//g, '-');
        const [year, month, day] = normalized.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
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

    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (!lastDateString || intervalDays === INTERVAL_WATER_STOP || intervalDays == null || isNaN(intervalDays)) return null;
        const lastDate = parseDateAsLocal(lastDateString);
        if (!lastDate) return null;
        lastDate.setDate(lastDate.getDate() + parseInt(intervalDays));
        return formatDateToISO(lastDate);
    }

    // 【修正】UIを以前のシンプルさに戻したレンダリング
    async function renderCardContentAsync(container, userPlant, data, seasonKey) {
        // 履歴を確実にソートしてから最新を取得
        const sortedLog = [...userPlant.waterLog].sort((a, b) => parseDateAsLocal(b.date) - parseDateAsLocal(a.date));
        const lastLog = sortedLog[0] || { date: userPlant.entryDate };
        const seasonData = data.management[seasonKey];

        const nextDateStr = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        const nextDateDisplay = nextDateStr 
            ? `${nextDateStr.replace(/-/g, '/')}頃` 
            : `冬の休眠中（断水）`;

        const currentMonth = new Date().getMonth() + 1;
        const transitionAlert = (currentMonth === 3 && seasonKey === 'SPRING') 
            ? `<div class="transition-note">⚠️ 春の移行期：土の乾きを確認</div>` 
            : '';

        container.innerHTML = `
            <div class="card-image"><img src="./${data.img}" loading="lazy"></div>
            <div class="card-header">
                <h3>${escapeHTML(userPlant.name)}</h3>
                <p>${escapeHTML(data.species)}</p>
            </div>
            ${transitionAlert}
            <div class="status-badge">${SEASONS[seasonKey].icon} ${SEASONS[seasonKey].name.split(' ')[0]}</div>
            <div class="card-details">
                <ul>
                    <li>💧 <strong>水やり:</strong> ${escapeHTML(seasonData.water)}</li>
                    <li>📅 <strong>次回目安:</strong> ${nextDateDisplay}</li>
                </ul>
            </div>
        `;
    }

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
                <div class="card-body"></div>
                <div class="card-footer">
                    <button class="action-button tertiary" onclick="showDetails('${userPlant.id}')">詳細・記録</button>
                </div>
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

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    }

    renderPlantCards();
});

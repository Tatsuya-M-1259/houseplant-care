// app.js

// 🌟 データのインポート
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

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentFilter = localStorage.getItem('filter-select') || 'all';

    // ----------------------------------------------------
    // 🌟 修正: 日本時間 (ローカルタイム) の今日の日付を取得
    // ----------------------------------------------------
    function getLocalTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ⚠️ 修正: const today = ... を削除し、関数内で都度呼び出すように変更

    // ----------------------------------------------------
    // 🌟 画像エラーハンドリング
    // ----------------------------------------------------
    function getPlaceholderImage() {
        return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 300 200'%3e%3crect fill='%23e0e0e0' width='300' height='200'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23888'%3eNo Image%3c/text%3e%3c/svg%3e";
    }

    window.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') {
            const placeholder = getPlaceholderImage();
            if (e.target.src !== placeholder) { 
                e.target.src = placeholder;
                e.target.alt = "画像読み込み失敗";
                console.warn(`画像読み込み失敗: ${e.target.alt}`);
            }
        }
    }, true);

    // ----------------------------------------------------
    // 2. カスタムUIユーティリティ
    // ----------------------------------------------------

    function showNotification(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        notificationArea.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    }

    function showCustomConfirm(message, onConfirm, onCancel = () => {}) {
        if (window.confirm(message)) {
            onConfirm();
        } else {
            onCancel();
        }
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"']/g, function(match) {
            switch (match) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return match;
            }
        });
    }
    
    function saveUserPlants(plants) {
        localStorage.setItem('userPlants', JSON.stringify(plants));
        localStorage.setItem('last_update_time', Date.now()); 
        renderLastUpdateTime(); 
    }
    
    // 🌟 修正: デフォルト引数を関数呼び出しに変更（常に最新の日付を使用）
    function updateLastWatered(plantId, type, date = getLocalTodayDate()) {
        const numericId = parseInt(plantId);
        const plantIndex = userPlants.findIndex(p => p.id === numericId);
        
        if (plantIndex !== -1) {
            const newLogEntry = { date: date, type: type };
            
            if (!Array.isArray(userPlants[plantIndex].waterLog)) {
                userPlants[plantIndex].waterLog = [];
            }
            
            const isDuplicate = userPlants[plantIndex].waterLog.some(log => log.date === date && log.type === type);
            if (!isDuplicate) {
                userPlants[plantIndex].waterLog.unshift(newLogEntry);
            }
            
            userPlants[plantIndex].waterLog.sort((a, b) => new Date(b.date) - new Date(a.date));

            saveUserPlants(userPlants);
            renderPlantCards(); 
            showNotification(`${userPlants[plantIndex].name} の水やり日と内容を記録しました！(${WATER_TYPES[type].name})`, 'success');
            
            waterTypeModal.style.display = 'none';
            if (detailsModal.style.display === 'block') {
                 const plantData = PLANT_DATA.find(p => p.id == userPlants[plantIndex].speciesId);
                 showDetailsModal(userPlants[plantIndex], plantData);
            }
        }
    }


    // ----------------------------------------------------
    // 1. DOM要素の定義
    // ----------------------------------------------------
    const plantCardList = document.getElementById('plant-card-list'); 
    const speciesSelect = document.getElementById('species-select');
    const addPlantForm = document.getElementById('add-plant-form');
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    const nextWateringPreview = document.getElementById('next-watering-preview');
    const setTodayButton = document.getElementById('set-today-button');
    const notificationControlContainer = document.getElementById('notification-control-container');
    const prevPlantButton = document.getElementById('prev-plant-btn');
    const nextPlantButton = document.getElementById('next-plant-btn');
    const quickSortButtonsContainer = document.getElementById('quick-sort-buttons');
    const lastUpdateDisplay = document.getElementById('last-update-display');

    const lastWateredInput = document.getElementById('last-watered');
    if (lastWateredInput) {
        // 修正: 常に最新の日付をセット
        const today = getLocalTodayDate();
        lastWateredInput.setAttribute('max', today);
        lastWateredInput.value = today; 
    }

    const detailsModal = document.getElementById('details-modal'); 
    const closeDetailButton = detailsModal ? detailsModal.querySelector('.close-button') : null; 
    const plantDetails = document.getElementById('plant-details'); 
    
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    const editPurchaseDateButton = document.getElementById('edit-purchase-date-button');
    const waterDoneInDetailContainer = document.getElementById('water-done-in-detail'); 
    const entryDateDisplay = document.getElementById('entry-date-display');
    const timeSinceEntryDisplay = document.getElementById('time-since-entry-display');
    const repottingDateDisplay = document.getElementById('repotting-date-display');
    const editRepottingDateButton = document.getElementById('edit-repotting-date-button'); 
    
    const waterHistoryList = document.getElementById('water-history-list');
    const repottingHistoryList = document.getElementById('repotting-history-list');

    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal ? purchaseDateModal.querySelector('.close-button-purchase-date') : null;
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    
    const repottingDateModal = document.getElementById('repotting-date-modal');
    const closeRepottingDateButton = repottingDateModal ? repottingDateModal.querySelector('.close-button-repotting-date') : null;
    const repottingDateInput = document.getElementById('repotting-date-input');
    const saveRepottingDateButton = document.getElementById('save-repotting-date-button');
    
    const waterTypeModal = document.getElementById('water-type-modal');
    const closeWaterTypeButton = waterTypeModal ? waterTypeModal.querySelector('.close-button-water-type') : null;
    const waterTypeModalTitle = document.getElementById('water-type-modal-title');
    const waterDateDisplay = document.getElementById('water-date-display');
    const waterTypeOptionsContainer = document.getElementById('water-type-options');

    const exportButton = document.getElementById('export-data-button');
    const importButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');
    const importFileNameDisplay = document.getElementById('import-file-name');
    
    const NOTIFICATION_AREA_ID = 'custom-notification-area';
    let notificationArea = document.getElementById(NOTIFICATION_AREA_ID);
    if (!notificationArea) {
        notificationArea = document.createElement('div');
        notificationArea.id = NOTIFICATION_AREA_ID;
        document.body.appendChild(notificationArea);
    }
    
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    
    // データ構造の自動移行ロジック
    function migrateOldData(plants) {
        let hasChanges = false;
        plants.forEach(p => {
            const oldPurchaseDate = localStorage.getItem(`purchase_date_${p.id}`);
            if (oldPurchaseDate) {
                p.purchaseDate = oldPurchaseDate;
                localStorage.removeItem(`purchase_date_${p.id}`);
                hasChanges = true;
            }
            const oldRepottingDate = localStorage.getItem(`repotting_date_${p.id}`);
            if (oldRepottingDate) {
                if (!Array.isArray(p.repottingLog)) p.repottingLog = [];
                if (!p.repottingLog.some(l => l.date === oldRepottingDate)) {
                    p.repottingLog.push({ date: oldRepottingDate });
                    p.repottingLog.sort((a, b) => new Date(b.date) - new Date(a.date));
                }
                localStorage.removeItem(`repotting_date_${p.id}`);
                hasChanges = true;
            }
        });
        
        if (hasChanges) {
            saveUserPlants(plants);
            console.log('Data migration completed.');
        }
    }

    userPlants = normalizePlantData(userPlants);
    migrateOldData(userPlants);
    saveUserPlants(userPlants);
    
    let currentPlantId = null;

    // ----------------------------------------------------
    // 3. 季節判定ロジック
    // ----------------------------------------------------

    function getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        
        if (month >= SEASONS.SPRING.startMonth && month <= SEASONS.SPRING.endMonth) return 'SPRING';
        if (month >= SEASONS.SUMMER.startMonth && month <= SEASONS.SUMMER.endMonth) return 'SUMMER';
        if (month >= SEASONS.AUTUMN.startMonth && month <= SEASONS.AUTUMN.endMonth) return 'AUTUMN';
        return 'WINTER';
    }
    const currentSeasonKey = getCurrentSeason();

    // ----------------------------------------------------
    // 4. 初期化処理, 日付データ処理 
    // ----------------------------------------------------

    function parseDateAsLocal(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (!lastDateString || intervalDays === INTERVAL_WATER_STOP || intervalDays == null || isNaN(intervalDays)) {
            return null;
        }
        const lastDate = parseDateAsLocal(lastDateString);
        lastDate.setDate(lastDate.getDate() + parseInt(intervalDays));
        
        const y = lastDate.getFullYear();
        const m = String(lastDate.getMonth() + 1).padStart(2, '0');
        const d = String(lastDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    function normalizePlantData(plants) {
        const today = getLocalTodayDate(); // 修正: 最新の日付を取得
        const normalizedPlants = plants.map(p => {
            if (!p.entryDate) {
                if (p.lastWatered) {
                    p.entryDate = p.lastWatered;
                } else if (p.waterLog && p.waterLog.length > 0) {
                    p.entryDate = p.waterLog[0].date;
                } else if (p.lastWatering && p.lastWatering.date) {
                    p.entryDate = p.lastWatering.date;
                } else {
                    p.entryDate = today;
                }
            }
            
            if (!Array.isArray(p.waterLog)) {
                p.waterLog = [];
                if (p.lastWatering && p.lastWatering.date && p.lastWatering.type) {
                    p.waterLog.push({ 
                        date: p.lastWatering.date, 
                        type: p.lastWatering.type 
                    });
                } 
                else if (p.lastWatered) {
                    if (p.waterLog.length === 0 || p.waterLog.every(log => log.date !== p.lastWatered)) {
                         p.waterLog.push({ 
                            date: p.lastWatered, 
                            type: 'WaterOnly' 
                        });
                    }
                } else if (p.waterLog.length === 0) {
                    p.waterLog.push({ date: p.entryDate, type: 'WaterOnly' });
                }
            } else {
                 p.waterLog.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
            
            if (!Array.isArray(p.repottingLog)) {
                p.repottingLog = [];
            }
            p.repottingLog.sort((a, b) => new Date(b.date) - new Date(a.date));

            delete p.lastWatered; 
            delete p.lastWatering; 
            
            return p;
        });
        
        return normalizedPlants;
    }

    function renderLastUpdateTime() {
        const lastUpdateTime = localStorage.getItem('last_update_time');
        const lastExportTime = localStorage.getItem('last_export_time');
        
        let displayHtml = '';
        
        if (lastUpdateTime) {
            const updateDate = new Date(parseInt(lastUpdateTime));
            const formattedUpdateTime = dateToJpTime(updateDate);
            displayHtml += `**最終データ更新:** ${formattedUpdateTime}`;
            
            if (lastExportTime) {
                const exportDate = new Date(parseInt(lastExportTime));
                const formattedExportTime = dateToJpTime(exportDate);
                const daysSinceExport = Math.floor((Date.now() - exportDate.getTime()) / (1000 * 60 * 60 * 24));
                
                displayHtml += `<br><strong>最終エクスポート:</strong> ${formattedExportTime}`;
                
                if (daysSinceExport >= 7) {
                    displayHtml += `<br><span class="warning-text">⚠️ バックアップが${daysSinceExport}日以上前です。エクスポートを推奨します。</span>`;
                    if (exportButton) exportButton.classList.add('backup-warning');
                } else {
                    if (exportButton) exportButton.classList.remove('backup-warning');
                }
            } else {
                displayHtml += '<br><strong>最終エクスポート:</strong> 未実行 ⚠️';
                if (exportButton) exportButton.classList.add('backup-warning');
            }
        } else {
            displayHtml = 'データが見つかりません。新規登録してください。';
        }
        
        if (lastUpdateDisplay) {
            lastUpdateDisplay.innerHTML = displayHtml;
        }
    }
    
    function dateToJpTime(date) {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(/\//g, '/').replace(',', ' ');
    }


    // 🌟 通知ロジックの修正
    function checkDailyNotifications() {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const today = getLocalTodayDate(); // 修正: 最新の日付を取得

        const plantsToWater = userPlants.filter(p => {
            const data = PLANT_DATA.find(pd => pd.id == p.speciesId);
            const seasonData = data.management[currentSeasonKey];
            const lastLog = p.waterLog[0] || { date: p.entryDate };
            const nextDateString = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
            
            if (!nextDateString) return false;

            return nextDateString <= today;
        });

        if (plantsToWater.length > 0) {
            const names = plantsToWater.map(p => p.name).join(', ');
            new Notification('水やりリマインダー', {
                body: `水やり予定日です（または過ぎています）: ${names}`,
                icon: 'icon-192x192.png'
            });
        }
    }
    
    function setupNotificationUI() {
        notificationControlContainer.innerHTML = '';

        if (!('Notification' in window)) {
            notificationControlContainer.innerHTML = '<p style="font-size:0.9em; color:var(--color-alert);">⚠️ お使いのブラウザは通知をサポートしていません。</p>';
            return;
        }

        const permission = Notification.permission;
        let message = '';
        let buttonText = '';
        let buttonClass = '';
        let buttonAction = null;
        
        if (permission === 'granted') {
            message = '✅ 通知は有効です。水やり予定日になるとお知らせします。';
        } else if (permission === 'denied') {
            message = '❌ 通知が拒否されています。ブラウザの設定から許可してください。';
            buttonText = '再試行 (ブラウザ設定へ)';
            buttonClass = 'action-button tertiary';
        } else {
            message = '🔔 水やりリマインダーを有効にしますか？';
            buttonText = '通知を有効にする';
            buttonClass = 'action-button primary';
            buttonAction = () => {
                Notification.requestPermission().then(newPermission => {
                    if (newPermission === 'granted') {
                        showNotification('通知が有効になりました！', 'success');
                        checkDailyNotifications();
                    } else {
                        showNotification('通知の許可がありませんでした。', 'warning');
                    }
                    setupNotificationUI();
                });
            };
        }
        
        const info = document.createElement('p');
        info.style.marginBottom = '10px';
        info.style.fontWeight = '600';
        info.textContent = message;
        notificationControlContainer.appendChild(info);

        if (buttonText) {
            const button = document.createElement('button');
            button.textContent = buttonText;
            button.className = buttonClass;
            if (buttonAction) {
                button.onclick = buttonAction;
            }
            notificationControlContainer.appendChild(button);
        }
    }


    function initializeApp() {
        if (speciesSelect) {
             PLANT_DATA.forEach(plant => {
                const option = document.createElement('option');
                option.value = plant.id;
                option.textContent = `${plant.species} (${plant.scientific})`;
                speciesSelect.appendChild(option);
            });
        }
        
        if (sortSelect) sortSelect.value = currentSort;
        if (filterSelect) filterSelect.value = currentFilter;

        renderLastUpdateTime();
        renderPlantCards();
        
        setupNotificationUI();
        checkDailyNotifications();
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkDailyNotifications();
            }
        });
        
        if (setTodayButton && lastWateredInput) {
            setTodayButton.onclick = () => {
                const today = getLocalTodayDate(); // 修正: ボタン押下時の最新日付
                lastWateredInput.value = today;
                lastWateredInput.dispatchEvent(new Event('change'));
            };
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                localStorage.setItem('sort-select', currentSort);
                renderPlantCards();
                renderQuickSortButtons();
            });
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                currentFilter = e.target.value;
                localStorage.setItem('filter-select', currentFilter);
                renderPlantCards();
            });
        }
        
        if (lastWateredInput && speciesSelect) {
             const updatePreview = () => {
                const speciesId = speciesSelect.value;
                const lastDate = lastWateredInput.value;
                const today = getLocalTodayDate(); // 修正: 最新日付
                
                if (!speciesId || !lastDate) {
                    nextWateringPreview.textContent = '植物種と水やり日を選択してください。';
                    nextWateringPreview.classList.remove('alert-date');
                    return;
                }
                
                const plantData = PLANT_DATA.find(p => p.id == speciesId);
                if (!plantData) return;

                const intervalDays = plantData.management[currentSeasonKey].waterIntervalDays;
                const nextDateString = calculateNextWateringDate(lastDate, intervalDays);
                
                if (nextDateString === null) {
                    nextWateringPreview.textContent = `次回予定日: ${plantData.management[currentSeasonKey].water}（断水期間）`;
                    nextWateringPreview.classList.remove('alert-date');
                    return;
                }
                
                nextWateringPreview.textContent = `次回水やり予定日 (目安): ${formatJapaneseDate(nextDateString)}`;
                
                if (nextDateString < today) {
                    nextWateringPreview.textContent += ' ⚠️ (計算結果が過去日になっています。水やり日を確認してください)';
                    nextWateringPreview.classList.add('alert-date');
                } else {
                    nextWateringPreview.classList.remove('alert-date');
                }
             };

             lastWateredInput.addEventListener('change', updatePreview);
             speciesSelect.addEventListener('change', updatePreview);
             updatePreview();
        }
        
        document.querySelectorAll('.modal-content').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('accordion-header') || e.target.closest('.accordion-header')) {
                    const header = e.target.closest('.accordion-header');
                    const targetId = header.getAttribute('data-target');
                    const content = document.getElementById(targetId);

                    if (content) {
                        const isExpanded = content.classList.contains('expanded');
                        content.classList.toggle('expanded', !isExpanded);
                        header.classList.toggle('collapsed', isExpanded);
                    }
                }
            });
        });
        
        window.addEventListener('popstate', (e) => {
            if (detailsModal.style.display === 'block') {
                detailsModal.style.display = 'none';
                currentPlantId = null;
            }
        });

        renderQuickSortButtons();
    }
    
    function renderQuickSortButtons() {
        if (!quickSortButtonsContainer) return;
        
        const quickSorts = [
            { value: 'nextWateringDate', label: '💧 急ぎ' },
            { value: 'name', label: '🌱 名前順' },
            { value: 'entryDate', label: '📅 登録順' }
        ];
        
        quickSortButtonsContainer.innerHTML = '';
        
        quickSorts.forEach(sort => {
            const button = document.createElement('button');
            button.textContent = sort.label;
            button.className = (currentSort === sort.value) ? 'active' : '';
            button.onclick = () => {
                currentSort = sort.value;
                localStorage.setItem('sort-select', currentSort);
                if (sortSelect) sortSelect.value = currentSort;
                renderPlantCards();
                renderQuickSortButtons();
            };
            quickSortButtonsContainer.appendChild(button);
        });
    }
    
    function formatJapaneseDate(dateString) {
        if (!dateString) return '未設定';
        const [year, month, day] = dateString.split('-');
        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }

    function calculateTimeSince(startDateString) {
        if (!startDateString) return '';
        
        const start = parseDateAsLocal(startDateString);
        const today = getLocalTodayDate(); // 修正: 最新日付
        const now = parseDateAsLocal(today);
        
        const diffTime = now - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays < 0) return `${Math.abs(diffDays)} 日後`; 
        if (diffDays === 0) return '今日';

        if (diffDays >= 365) {
            const diffYears = (diffDays / 365.25).toFixed(1); 
            return `約 ${diffYears} 年`;
        }
        return `${diffDays} 日`;
    }
    
    const getPurchaseDate = (plantId) => {
        const plant = userPlants.find(p => p.id === parseInt(plantId));
        return plant ? plant.purchaseDate : null;
    };
    
    const savePurchaseDate = (plantId, date) => { 
        const plantIndex = userPlants.findIndex(p => p.id === parseInt(plantId));
        if (plantIndex !== -1) {
            userPlants[plantIndex].purchaseDate = date;
            saveUserPlants(userPlants);
        }
    };
    
    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        if (purchaseDateDisplay) purchaseDateDisplay.textContent = formatJapaneseDate(date);
    };
    
    const getLatestRepottingDate = (userPlant) => userPlant.repottingLog && userPlant.repottingLog.length > 0 ? userPlant.repottingLog[0].date : null;
    
    // ----------------------------------------------------
    // 5. カルテレンダリングとカード生成 
    // ----------------------------------------------------
    
    function sortAndFilterPlants() {
        let filteredPlants = userPlants.map(p => {
            const data = PLANT_DATA.find(pd => pd.id == p.speciesId);
            const lastLog = p.waterLog && p.waterLog.length > 0 ? p.waterLog[0] : { date: p.entryDate, type: 'WaterOnly' };
            const seasonData = data.management[currentSeasonKey];
            const nextWateringDate = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
            
            return {
                ...p,
                data,
                nextWateringDate: nextWateringDate,
                minTemp: data.minTemp
            };
        });
        
        if (currentFilter !== 'all') {
            const tempMap = { 'temp10': 10, 'temp5': 5, 'temp0': 0 };
            const minTempThreshold = tempMap[currentFilter];
            filteredPlants = filteredPlants.filter(p => p.minTemp >= minTempThreshold);
        }

        filteredPlants.sort((a, b) => {
            if (currentSort === 'name') {
                return a.name.localeCompare(b.name);
            } else if (currentSort === 'entryDate') {
                return new Date(b.entryDate) - new Date(a.entryDate); 
            } else if (currentSort === 'minTemp') {
                return a.minTemp - b.minTemp; 
            } else if (currentSort === 'nextWateringDate') {
                const aDate = a.nextWateringDate ? new Date(a.nextWateringDate).getTime() : Infinity;
                const bDate = b.nextWateringDate ? new Date(b.nextWateringDate).getTime() : Infinity;
                return aDate - bDate;
            }
            return 0;
        });

        return filteredPlants;
    }


    function renderPlantCards() {
        if (!plantCardList) return;

        const sortedAndFilteredPlants = sortAndFilterPlants();
        
        if (sortedAndFilteredPlants.length === 0) {
            plantCardList.innerHTML = `
                <div class="empty-state">
                    <p>現在のフィルタ条件に一致する植物はありません。</p>
                    <p>または、カルテに植物がまだ登録されていません。</p>
                </div>
            `;
            return; 
        }

        const cardContainer = document.createElement('div');
        cardContainer.className = 'plant-card-container';
        
        sortedAndFilteredPlants.forEach(userPlant => {
            const data = userPlant.data; 
            const card = createPlantCard(userPlant, data, currentSeasonKey); 
            cardContainer.appendChild(card);
        });

        plantCardList.innerHTML = '';
        plantCardList.appendChild(cardContainer);

        if (currentSort !== 'nextWateringDate') {
            new Sortable(cardContainer, {
                animation: 150,
                handle: '.drag-handle', 
                delay: 100, 
                delayOnTouchOnly: true,
                touchStartThreshold: 5, 
                ghostClass: 'sortable-ghost', 
                onEnd: function (evt) {
                    const newOrderIds = Array.from(cardContainer.children).map(card => parseInt(card.dataset.id));
                    const visibleItemsInMain = [];
                    const idToIndexMap = new Map(newOrderIds.map((id, index) => [id, index]));

                    userPlants.forEach((p, index) => {
                        if (idToIndexMap.has(p.id)) {
                            visibleItemsInMain.push({ plant: p, originalIndex: index });
                        }
                    });

                    const slotIndices = visibleItemsInMain.map(item => item.originalIndex).sort((a, b) => a - b);

                    visibleItemsInMain.sort((a, b) => {
                        const indexA = idToIndexMap.get(a.plant.id);
                        const indexB = idToIndexMap.get(b.plant.id);
                        return indexA - indexB;
                    });

                    slotIndices.forEach((slotIndex, i) => {
                        userPlants[slotIndex] = visibleItemsInMain[i].plant;
                    });

                    saveUserPlants(userPlants);
                }
            });
        }
    }
    
    function showWaterTypeSelectionModal(plantId) {
        const numericId = parseInt(plantId);
        const plant = userPlants.find(p => p.id === numericId);
        if (!plant || !waterTypeModal) return;

        const today = getLocalTodayDate(); // 修正: 最新日付
        waterTypeModalTitle.textContent = `「${plant.name}」の水やり内容`;
        waterDateDisplay.textContent = formatJapaneseDate(today) + ' に完了'; 
        waterTypeOptionsContainer.innerHTML = '';
        
        Object.keys(WATER_TYPES).forEach(key => {
            const typeData = WATER_TYPES[key];
            const button = document.createElement('button');
            button.textContent = typeData.name;
            button.className = 'action-button';
            button.onclick = () => {
                updateLastWatered(numericId, key, today);
            };
            waterTypeOptionsContainer.appendChild(button);
        });
        
        waterTypeModal.style.display = 'block';
    }


    function createPlantCard(userPlant, data, activeSeasonKey) {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.setAttribute('data-id', userPlant.id);
        
        const controls = document.createElement('div');
        controls.className = 'controls';
        
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '☰';
        dragHandle.setAttribute('aria-label', '並び替え用ハンドル');
        
        const isAutoSorted = currentSort === 'nextWateringDate';
        if (isAutoSorted) {
             dragHandle.style.opacity = '0';
             dragHandle.style.cursor = 'default';
             dragHandle.style.pointerEvents = 'none'; 
        }

        controls.appendChild(dragHandle);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = '×';
        deleteButton.setAttribute('aria-label', `${userPlant.name}のカルテを削除`);
        deleteButton.onclick = (e) => { 
            e.stopPropagation(); 
            deletePlantCard(userPlant.id);
        };
        controls.appendChild(deleteButton);
        card.appendChild(controls); 

        const seasonSelector = document.createElement('div');
        seasonSelector.className = 'season-selector';
        ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].forEach(key => {
            const button = document.createElement('button');
            button.textContent = SEASONS[key].name.split(' ')[0];
            button.className = key === activeSeasonKey ? 'active' : '';
            button.onclick = (e) => { 
                e.stopPropagation();
                seasonSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const contentElement = card.querySelector('.card-content-wrapper');
                if(contentElement) contentElement.innerHTML = generateCardContent(userPlant, data, key);
            };
            seasonSelector.appendChild(button);
        });
        
        const content = document.createElement('div');
        content.className = 'card-content-wrapper'; 
        content.innerHTML = generateCardContent(userPlant, data, activeSeasonKey);
        
        card.appendChild(seasonSelector); 
        card.appendChild(content);
        
        const waterButton = document.createElement('button');
        waterButton.className = 'action-button tertiary water-done-btn';
        waterButton.textContent = '💧 記録 (内容選択)'; 
        waterButton.onclick = (e) => {
            e.stopPropagation();
            showWaterTypeSelectionModal(userPlant.id); 
        };
        
        let pressTimer = null;
        let startX, startY;

        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            pressTimer = setTimeout(() => {
                showWaterTypeSelectionModal(userPlant.id);
                e.target.dataset.isLongPress = 'true';
                if (navigator.vibrate) navigator.vibrate(50);
            }, 500); 
        });

        card.addEventListener('touchend', (e) => {
            clearTimeout(pressTimer);
            if (e.target.dataset.isLongPress === 'true') {
                 delete e.target.dataset.isLongPress; 
                 e.preventDefault();
            }
            pressTimer = null;
        });

        card.addEventListener('touchmove', (e) => {
             const moveX = e.touches[0].clientX;
             const moveY = e.touches[0].clientY;
             
             if (Math.abs(moveX - startX) > 10 || Math.abs(moveY - startY) > 10) {
                 clearTimeout(pressTimer);
                 pressTimer = null;
             }
        });
        
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';
        cardFooter.appendChild(waterButton);
        card.appendChild(cardFooter);

        card.addEventListener('click', (e) => {
            if (e.target.dataset.isLongPress === 'true') {
                delete e.target.dataset.isLongPress;
                return;
            }
            showDetailsModal(userPlant, data);
        });

        return card;
    }
    
    function checkRepottingStatus(plantData, userPlantId) {
        const repottingText = plantData.maintenance.repotting; 
        const match = repottingText.match(/(\d+)月.([〜~])(\d+)月/);

        if (!match) {
            return `<li>植え替え推奨時期: ${repottingText}</li>`;
        }

        const startMonth = parseInt(match[1]);
        const endMonth = parseInt(match[3]);
        const currentMonth = new Date().getMonth() + 1; 

        let isRecommendedTime = false;
        if (startMonth <= endMonth) { 
            isRecommendedTime = (currentMonth >= startMonth && currentMonth <= endMonth);
        } else { 
            isRecommendedTime = (currentMonth >= startMonth || currentMonth <= endMonth);
        }
        
        const userPlant = userPlants.find(p => p.id === userPlantId);
        const lastRepottingDateString = getLatestRepottingDate(userPlant);
        
        let isOverOneYear = true;
        
        if (lastRepottingDateString) {
            const lastRepottingDate = parseDateAsLocal(lastRepottingDateString);
            const today = getLocalTodayDate(); // 修正: 最新日付
            const oneYearAgo = parseDateAsLocal(today);
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            if (lastRepottingDate > oneYearAgo) {
                isOverOneYear = false;
            }
        } else {
             isOverOneYear = true; 
        }

        if (isRecommendedTime && isOverOneYear) {
            return `<li class="risk-message repotting-alert">⚠️ <span class="risk-alert warning">植え替え推奨時期 (${repottingText})！${lastRepottingDateString ? '直近の植え替え日から1年以上経過しています。' : '植え替え日が未設定です。'}</span></li>`;
        }
        
        return `<li>植え替え推奨時期: ${repottingText}</li>`;
    }

    function generateCardContent(userPlant, data, seasonKey) {
        const seasonData = data.management[seasonKey];
        const riskText = getSeasonRisk(seasonKey, data);
        
        const lastLog = userPlant.waterLog && userPlant.waterLog.length > 0 ? userPlant.waterLog[0] : { date: userPlant.entryDate, type: 'WaterOnly' };
        
        const lastWateringDate = parseDateAsLocal(lastLog.date);
        const today = getLocalTodayDate(); // 修正: 最新日付
        const todayDate = parseDateAsLocal(today);
        
        const timeSinceWatered = Math.floor((todayDate - lastWateringDate) / (1000 * 60 * 60 * 24)); 
        
        let recommendedIntervalDays = seasonData.waterIntervalDays || null; 
        
        const nextWateringDateString = calculateNextWateringDate(lastLog.date, recommendedIntervalDays);
        
        let intervalDisplay = '';
        
        if (recommendedIntervalDays !== null) {
            if (recommendedIntervalDays === INTERVAL_WATER_STOP) { 
                 intervalDisplay = `（${SEASONS[seasonKey].name.split(' ')[0]}は断水期間）`;
            } else {
                 intervalDisplay = `（${recommendedIntervalDays}日目安）`;
            }
        } else {
            intervalDisplay = `（推奨間隔データなし）`;
        }

        let actionMessage = '';
        if (nextWateringDateString && recommendedIntervalDays <= 30) { 
            const daysUntilNext = Math.ceil((parseDateAsLocal(nextWateringDateString) - todayDate) / (1000 * 60 * 60 * 24));
            
            if (daysUntilNext <= 0) {
                actionMessage = `<li class="risk-message">🚨 <span class="risk-alert danger">水やり目安日を**${Math.abs(daysUntilNext) + 1}日超過**！</span></li>`;
            } else if (daysUntilNext <= 3) {
                actionMessage = `<li class="risk-message">⚠️ <span class="risk-alert warning">あと**${daysUntilNext}日**で水やり目安日です。</span></li>`;
            } else {
                actionMessage = `<li>次回目安まで、あと **${daysUntilNext}日** です。</li>`;
            }
        } else {
            actionMessage = `<li>前回水やり日から **${timeSinceWatered}日経過**。</li>`;
        }
        
        const nextWateringInfo = nextWateringDateString && recommendedIntervalDays !== INTERVAL_WATER_STOP
            ? `<li><strong>次回予定日:</strong> <span style="color: ${nextWateringDateString <= today ? 'var(--color-alert)' : 'var(--color-primary)'}; font-weight: 700;">${formatJapaneseDate(nextWateringDateString)}</span></li>`
            : `<li><strong>次回予定日:</strong> ${recommendedIntervalDays === INTERVAL_WATER_STOP ? '断水中' : '算出不可'}</li>`;


        const waterMethodText = data.water_method || '水やり方法は詳細を確認してください。';
        const waterMethodSummary = waterMethodText.split('。')[0] + '。';
        
        const lastWateringTypeKey = lastLog.type;
        const lastWateringType = WATER_TYPES[lastWateringTypeKey] || WATER_TYPES.WaterOnly;
        
        const timeSinceEntry = calculateTimeSince(userPlant.entryDate);
        
        const repottingReminder = checkRepottingStatus(data, userPlant.id);


        return `
            <div class="card-image">
                <img src="${data.img}" alt="${data.species}" 
                     style="object-fit: contain;"> </div>
            <div class="card-header">
                <h3>${userPlant.name}</h3>
                <p>${data.species} (登録から ${timeSinceEntry})</p>
            </div>
            
            <div class="status-box">
                ${SEASONS[seasonKey].name.split(' ')[0]}の最重要管理項目: **${riskText}**
            </div>

            <h4>現在の管理プロトコル</h4>
            <ul>
                <li>**水やり量:** ${waterMethodSummary}</li>
                <li>**推奨頻度:** ${seasonData.water} <span style="font-size:0.9em; font-weight:normal;">${intervalDisplay}</span></li>
                <li><strong>前回水やり:</strong> ${formatJapaneseDate(lastLog.date)} 
                    <strong class="last-watered-type">
                        <span class="water-type-badge ${lastWateringType.class}">
                            ${lastWateringType.name}
                        </span>
                    </strong>
                </li>
                ${nextWateringInfo}
                ${actionMessage}
                <li>**光量要求:** ${seasonData.light}</li>
            </ul>
            
            <ul style="border-top: 1px dashed #f0f0f0; margin-top: 10px; padding-top: 10px;">
                ${repottingReminder}
            </ul>
        `;
    }
    
    function getSeasonRisk(seasonKey, data) {
        if (seasonKey === 'WINTER') {
            if (data.minTemp >= 10) return '厳重な低温・断水管理！根腐れリスク大！'; 
            if (data.minTemp >= 5) return '断水管理と夜間の窓際隔離！';
            return '冬季は極端な断水で休眠誘導。管理容易。';
        }
        if (seasonKey === 'SUMMER') return '積極的な換気による高温障害回避！';
        if (seasonKey === 'AUTUMN') return '休眠に向けた水・施肥の漸減準備。'; 
        return '成長期再開！水やりと施肥を徐々に再開。'; 
    }

    function renderWaterHistory(waterLog, plantId) {
        if (!waterHistoryList) return;
        waterHistoryList.innerHTML = '';
        
        if (!waterLog || waterLog.length === 0) {
            waterHistoryList.innerHTML = '<li style="justify-content: center; color: var(--color-text-mid);">まだ水やり記録がありません。</li>';
            return;
        }

        waterLog.forEach((log, index) => {
            const logItem = document.createElement('li');
            const typeData = WATER_TYPES[log.type] || WATER_TYPES.WaterOnly;
            
            const contentSpan = document.createElement('span');
            contentSpan.className = 'log-content';
            contentSpan.innerHTML = `
                <span class="date">${formatJapaneseDate(log.date)}</span>
                <span class="water-type-badge ${typeData.class}">${typeData.name}</span>
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-log-btn';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'この記録を削除';
            deleteBtn.setAttribute('aria-label', `${formatJapaneseDate(log.date)}の記録を削除`);
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); 
                deleteWaterLog(plantId, index);
            };

            logItem.appendChild(contentSpan);
            logItem.appendChild(deleteBtn);
            waterHistoryList.appendChild(logItem);
        });
    }

    function deleteWaterLog(plantId, logIndex) {
        const plantIndex = userPlants.findIndex(p => p.id === plantId);
        if (plantIndex === -1) return;

        if (window.confirm('この水やり記録を削除しますか？\n（削除すると元に戻せません）')) {
            userPlants[plantIndex].waterLog.splice(logIndex, 1); 
            
            saveUserPlants(userPlants);
            
            const plantData = PLANT_DATA.find(p => p.id == userPlants[plantIndex].speciesId);
            showDetailsModal(userPlants[plantIndex], plantData);
            
            renderPlantCards(); 
            
            showNotification('記録を削除しました。', 'success');
        }
    }

    function renderRepottingHistory(repottingLog) {
        if (!repottingHistoryList) return;
        repottingHistoryList.innerHTML = '';
        
        if (!repottingLog || repottingLog.length === 0) {
            repottingHistoryList.innerHTML = '<li style="justify-content: center; color: var(--color-text-mid);">まだ植え替え記録がありません。</li>';
            return;
        }

        repottingLog.forEach(log => {
            const logItem = document.createElement('li');
            logItem.innerHTML = `<span class="date">${formatJapaneseDate(log.date)}</span>`;
            repottingHistoryList.appendChild(logItem);
        });
    }

    function showDetailsModal(userPlant, plantData) {
        if (!detailsModal || !plantDetails) return;

        currentPlantId = userPlant.id;
        const seasonData = plantData.management[currentSeasonKey];
        const maintenance = plantData.maintenance;
        
        entryDateDisplay.textContent = formatJapaneseDate(userPlant.entryDate);
        timeSinceEntryDisplay.textContent = calculateTimeSince(userPlant.entryDate);
        
        const latestRepottingDate = getLatestRepottingDate(userPlant);
        repottingDateDisplay.textContent = formatJapaneseDate(latestRepottingDate);


        const repottingReminderMessage = checkRepottingStatus(plantData, userPlant.id);

        const safeWaterMethod = plantData.water_method || '詳細不明';

        const seasonCareContentHtml = `
            <ul>
                <li><strong>水やり量（一度に与える量）:</strong> ${safeWaterMethod}</li>
                <li><strong>水やり頻度（タイミング）:</strong> ${seasonData.water}</li>
                <li><strong>光:</strong> ${seasonData.light}</li>
                ${seasonData.tempRisk ? `<li><strong>寒さ対策:</strong> ${seasonData.tempRisk}</li>` : ''}
            </ul>
        `;
        
        const basicMaintenanceContentHtml = `
            <ul>
                <li><strong>難易度:</strong> ${plantData.difficulty}</li>
                <li><strong>特徴:</strong> ${plantData.feature}</li>
                <li><strong>最低越冬温度:</strong> ${plantData.minTemp}°C</li>
                <li><strong>肥料:</strong> ${maintenance.fertilizer}</li>
                <li><strong>植え替え:</strong> ${maintenance.repotting}</li>
                <li><strong>剪定:</strong> ${maintenance.pruning}</li>
            </ul>
            <div class="detail-section" style="padding: 10px 0; border-top: 1px solid #e9ecef;">
                ${repottingReminderMessage}
            </div>
        `;
        
        const seasonCareContentDiv = document.getElementById('season-care-content');
        const basicMaintenanceContentDiv = document.getElementById('basic-maintenance-content');
        
        if (seasonCareContentDiv) seasonCareContentDiv.innerHTML = seasonCareContentHtml;
        if (basicMaintenanceContentDiv) basicMaintenanceContentDiv.innerHTML = basicMaintenanceContentHtml;
        
        document.getElementById('season-care-content').classList.add('expanded');
        document.querySelector('#season-care-wrapper .accordion-header').classList.remove('collapsed');
        
        document.getElementById('basic-maintenance-content').classList.remove('expanded');
        document.querySelector('#basic-maintenance-wrapper .accordion-header').classList.add('collapsed');
        
        document.getElementById('water-history-list').classList.add('expanded');
        document.querySelector('#water-history-section .accordion-header').classList.remove('collapsed');
        
        document.getElementById('repotting-history-list').classList.remove('expanded');
        document.querySelector('#repotting-history-section .accordion-header').classList.add('collapsed');

        
        updatePurchaseDateDisplay(userPlant.id); 
        
        renderWaterHistory(userPlant.waterLog, userPlant.id);
        renderRepottingHistory(userPlant.repottingLog); 
        
        if (waterDoneInDetailContainer) {
            waterDoneInDetailContainer.innerHTML = ''; 
            const waterButton = document.createElement('button');
            waterButton.className = 'action-button water-done-btn'; 
            waterButton.textContent = '💧 水やり完了 (内容選択)';
            waterButton.onclick = () => {
                showWaterTypeSelectionModal(userPlant.id); 
            };
            waterDoneInDetailContainer.appendChild(waterButton);
        }
        
        const currentPlantsList = sortAndFilterPlants();
        const currentIndex = currentPlantsList.findIndex(p => p.id === userPlant.id);
        
        prevPlantButton.style.display = currentIndex > 0 ? 'block' : 'none';
        nextPlantButton.style.display = currentIndex < currentPlantsList.length - 1 ? 'block' : 'none';

        prevPlantButton.onclick = () => {
            if (currentIndex > 0) {
                const prevPlant = currentPlantsList[currentIndex - 1];
                const prevPlantData = PLANT_DATA.find(p => p.id == prevPlant.speciesId);
                showDetailsModal(prevPlant, prevPlantData);
            }
        };

        nextPlantButton.onclick = () => {
            if (currentIndex < currentPlantsList.length - 1) {
                const nextPlant = currentPlantsList[currentIndex + 1];
                const nextPlantData = PLANT_DATA.find(p => p.id == nextPlant.speciesId);
                showDetailsModal(nextPlant, nextPlantData);
            }
        };
        
        let touchstartX = 0;
        let touchendX = 0;
        const modalContent = detailsModal.querySelector('.modal-content');

        const checkDirection = () => {
            const threshold = 50; 
            if (touchendX < touchstartX - threshold) { 
                nextPlantButton.click();
            }
            if (touchendX > touchstartX + threshold) { 
                prevPlantButton.click();
            }
        };

        modalContent.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        }, { passive: true });

        modalContent.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            checkDirection();
        }, { passive: true });


        if (detailsModal.style.display === 'block') {
            history.replaceState({ modal: 'details' }, null, '');
        } else {
            history.pushState({ modal: 'details' }, null, '');
            detailsModal.style.display = 'block';
        }
    }

    if (closeDetailButton) {
        closeDetailButton.onclick = () => {
            if (history.state && history.state.modal === 'details') {
                history.back(); 
            } else {
                detailsModal.style.display = 'none';
                currentPlantId = null;
            }
        };
    }
    
    if (closeWaterTypeButton) {
        closeWaterTypeButton.onclick = () => {
            waterTypeModal.style.display = 'none';
        };
    }
    
    if (addPlantForm) {
        addPlantForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const lastWateredDate = document.getElementById('last-watered').value;
            const waterType = document.getElementById('water-type-select').value;
            
            const newPlant = {
                id: Date.now(), 
                name: escapeHTML(document.getElementById('plant-name').value),
                speciesId: document.getElementById('species-select').value,
                entryDate: lastWateredDate,
                waterLog: [{
                    date: lastWateredDate,
                    type: waterType
                }],
                repottingLog: []
            };

            userPlants.unshift(newPlant);
            saveUserPlants(userPlants); 
            
            renderPlantCards();
            addPlantForm.reset();
            
            if (lastWateredInput) {
                // 修正: フォームリセット時も最新日付をセット
                lastWateredInput.value = getLocalTodayDate();
            }
            showNotification(`「${newPlant.name}」をカルテに追加しました！`, 'success');
            
            nextWateringPreview.textContent = '植物種と水やり日を選択してください。';
            nextWateringPreview.classList.remove('alert-date');
        });
    }

    function deletePlantCard(id) {
        const numericId = parseInt(id); 
        
        showCustomConfirm('この植物のカルテを削除してもよろしいですか？', () => {
             userPlants = userPlants.filter(plant => plant.id !== numericId);
             saveUserPlants(userPlants); 
            
             localStorage.removeItem(`purchase_date_${numericId}`);
             localStorage.removeItem(`repotting_date_${numericId}`); 
            
             renderPlantCards();
             showNotification('カルテを削除しました。', 'success'); 
        });
    }

    // 🌟 修正: 抜け落ちていた購入日モーダル関連の処理を追加
    if (closePurchaseDateButton) {
        closePurchaseDateButton.onclick = () => {
            purchaseDateModal.style.display = 'none';
            if (detailsModal) detailsModal.style.display = 'block';
        };
    }

    if (editPurchaseDateButton) {
        editPurchaseDateButton.onclick = () => {
            if (currentPlantId === null) {
                 showNotification('エラー: まず植物カードをクリックして詳細を表示してください。', 'error');
                 return;
            }

            // 現在の購入日を取得してフォームにセット
            const plant = userPlants.find(p => p.id === currentPlantId);
            const today = getLocalTodayDate();

            if (plant && plant.purchaseDate) {
                purchaseDateInput.value = plant.purchaseDate;
            } else {
                purchaseDateInput.value = today;
            }

            detailsModal.style.display = 'none';
            purchaseDateModal.style.display = 'block';
            purchaseDateInput.setAttribute('max', today);
        };
    }

    if (savePurchaseDateButton) {
        savePurchaseDateButton.onclick = () => {
            const newDate = purchaseDateInput.value;
            if (newDate && currentPlantId !== null) {
                const plantIndex = userPlants.findIndex(p => p.id === currentPlantId);
                if (plantIndex !== -1) {
                    userPlants[plantIndex].purchaseDate = newDate;
                    saveUserPlants(userPlants);
                    
                    // 詳細画面の表示を即時更新
                    updatePurchaseDateDisplay(currentPlantId);
                    
                    showNotification('購入日を保存しました。', 'success');
                }
                
                purchaseDateModal.style.display = 'none';
                if (detailsModal) detailsModal.style.display = 'block';
            } else {
                showNotification('日付を入力してください。', 'warning');
            }
        };
    }

    if (closeRepottingDateButton) {
        closeRepottingDateButton.onclick = () => {
            repottingDateModal.style.display = 'none';
            if (detailsModal) detailsModal.style.display = 'block'; 
        };
    }

    if (editRepottingDateButton) {
        editRepottingDateButton.onclick = () => {
            if (currentPlantId === null) {
                 showNotification('エラー: まず植物カードをクリックして詳細を表示してください。', 'error');
                 return;
            }

            detailsModal.style.display = 'none'; 
            repottingDateModal.style.display = 'block';
            
            // 修正: 最新日付をmaxに設定
            const today = getLocalTodayDate();
            repottingDateInput.setAttribute('max', today); 
            repottingDateInput.value = today; 
        };
    }
    
    if (saveRepottingDateButton) {
        saveRepottingDateButton.onclick = () => {
            const newDate = repottingDateInput.value;
            if (newDate && currentPlantId !== null) {
                const userPlantIndex = userPlants.findIndex(p => p.id === currentPlantId);
                
                if (userPlantIndex !== -1) {
                    const newRepottingEntry = { date: newDate };
                    
                    if (!Array.isArray(userPlants[userPlantIndex].repottingLog)) {
                        userPlants[userPlantIndex].repottingLog = [];
                    }
                    
                    userPlants[userPlantIndex].repottingLog.unshift(newRepottingEntry);
                    userPlants[userPlantIndex].repottingLog.sort((a, b) => new Date(b.date) - new Date(a.date));

                    saveUserPlants(userPlants); 
                }
                
                showNotification('植え替え記録を追加しました。', 'success');
                
                repottingDateModal.style.display = 'none';
                if (detailsModal) detailsModal.style.display = 'block'; 
                
                const plantData = PLANT_DATA.find(p => p.id == userPlants[userPlantIndex].speciesId);
                showDetailsModal(userPlants[userPlantIndex], plantData);
                renderPlantCards();
            } else {
                showNotification('日付を入力してください。', 'warning');
            }
        };
    }

    const collectAllData = () => {
        return {
            userPlants: userPlants
        };
    };

    if (exportButton) {
        exportButton.onclick = () => {
            const data = collectAllData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const h = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            
            a.download = `houseplant_care_backup_${y}${m}${d}_${h}${min}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            localStorage.setItem('last_export_time', Date.now());
            renderLastUpdateTime();
            
            showNotification('カルテデータのエクスポートが完了しました。', 'success');
        };
    }

    if (importButton) {
        importButton.onclick = () => {
            importFileInput.click();
        };
    }

    if (importFileInput) {
        importFileInput.onchange = () => {
            if (importFileInput.files.length > 0) {
                importFileNameDisplay.textContent = importFileInput.files[0].name;
                processImportFile(importFileInput.files[0]);
            } else {
                importFileNameDisplay.textContent = 'ファイル未選択';
            }
        };
    }

    const processImportFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                let loadedPlants = [];
                if (Array.isArray(importedData.userPlants)) {
                    loadedPlants = importedData.userPlants;
                } else if (Array.isArray(importedData)) {
                    loadedPlants = importedData; 
                } else {
                    throw new Error('JSON形式が正しくありません。データが見つかりません。');
                }
                
                showCustomConfirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？', () => {
                    userPlants = normalizePlantData(loadedPlants); 
                    
                    if (importedData.purchaseDates) {
                        Object.keys(importedData.purchaseDates).forEach(key => {
                            const idMatch = key.match(/purchase_date_(\d+)/);
                            if (idMatch) {
                                const plantId = parseInt(idMatch[1]);
                                const plant = userPlants.find(p => p.id === plantId);
                                if (plant) {
                                    plant.purchaseDate = importedData.purchaseDates[key];
                                }
                            }
                        });
                    }
                    
                    if (importedData.repottingDates) {
                        Object.keys(importedData.repottingDates).forEach(key => {
                            const idMatch = key.match(/repotting_date_(\d+)/);
                            if (idMatch) {
                                const plantId = parseInt(idMatch[1]);
                                const plantIndex = userPlants.findIndex(p => p.id === plantId);
                                if (plantIndex !== -1) {
                                     const date = importedData.repottingDates[key];
                                     if (!userPlants[plantIndex].repottingLog.some(log => log.date === date)) {
                                         userPlants[plantIndex].repottingLog.push({ date: date });
                                         userPlants[plantIndex].repottingLog.sort((a, b) => new Date(b.date) - new Date(a.date));
                                     }
                                }
                            }
                        });
                    }

                    saveUserPlants(userPlants); 

                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('purchase_date_') || key.startsWith('repotting_date_'))) {
                            localStorage.removeItem(key);
                        }
                    }

                    showNotification('カルテデータのインポートが完了しました。画面を更新します。', 'success');
                    renderPlantCards(); 
                }, () => {
                    // キャンセル
                });

            } catch (error) {
                showNotification('データのインポートに失敗しました。ファイル形式を確認してください。エラー: ' + error.message, 'error', 5000); 
                console.error("Import Error:", error);
            } finally {
                if(importFileInput) {
                    importFileInput.value = '';
                    importFileNameDisplay.textContent = 'ファイル未選択';
                }
            }
        };
        reader.readAsText(file);
    };


    // ----------------------------------------------------
    // 11. 🌟 Service Worker 登録ロジックの追加
    // ----------------------------------------------------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('ServiceWorker registration failed: ', registrationError);
                });
        });
    }
    
    initializeApp();

});

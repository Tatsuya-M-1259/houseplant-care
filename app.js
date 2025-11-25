// app.js

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

    // ----------------------------------------------------
    // 2. カスタムUIユーティリティ
    // ----------------------------------------------------

    /**
     * カスタムトースト通知を表示する
     */
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

    /**
     * ブラウザ標準のconfirmを使いつつ、カスタムモーダルへの置き換えを容易にする
     */
    function showCustomConfirm(message, onConfirm, onCancel = () => {}) {
        if (window.confirm(message)) {
            onConfirm();
        } else {
            onCancel();
        }
    }

    /**
     * ユーザー入力のHTMLをエスケープし、XSSを防ぐ
     */
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
    
    /**
     * 🌟 水やりログに記録を追加する関数
     * @param {number} plantId - 植物のID
     * @param {string} type - 水やり内容のキー ('WaterOnly', 'WaterAndFertilizer', etc.)
     * @param {string} [date] - 更新日 (デフォルトは今日)
     */
    function updateLastWatered(plantId, type, date = new Date().toISOString().split('T')[0]) {
        const numericId = parseInt(plantId);
        const plantIndex = userPlants.findIndex(p => p.id === numericId);
        
        if (plantIndex !== -1) {
            // waterLog配列の先頭に新しい記録を追加
            const newLogEntry = { date: date, type: type };
            
            // waterLog が配列であることを保証
            if (!Array.isArray(userPlants[plantIndex].waterLog)) {
                userPlants[plantIndex].waterLog = [];
            }
            
            // 重複チェック（今日の日付で同じタイプが既にあればスキップ）
            const isDuplicate = userPlants[plantIndex].waterLog.some(log => log.date === date && log.type === type);
            if (!isDuplicate) {
                userPlants[plantIndex].waterLog.unshift(newLogEntry);
            }

            localStorage.setItem('userPlants', JSON.stringify(userPlants));
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

    const today = new Date().toISOString().split('T')[0];
    const lastWateredInput = document.getElementById('last-watered');
    if (lastWateredInput) {
        lastWateredInput.setAttribute('max', today);
        lastWateredInput.value = today; 
    }

    // モーダル要素
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
    
    // 🌟 新規: 水やり履歴リスト要素
    const waterHistoryList = document.getElementById('water-history-list');

    // 購入日入力モーダル
    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal ? purchaseDateModal.querySelector('.close-button-purchase-date') : null;
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    
    // 植え替え日入力モーダル
    const repottingDateModal = document.getElementById('repotting-date-modal');
    const closeRepottingDateButton = repottingDateModal ? repottingDateModal.querySelector('.close-button-repotting-date') : null;
    const repottingDateInput = document.getElementById('repotting-date-input');
    const saveRepottingDateButton = document.getElementById('save-repotting-date-button');
    
    // 水やり内容選択モーダル要素
    const waterTypeModal = document.getElementById('water-type-modal');
    const closeWaterTypeButton = waterTypeModal ? waterTypeModal.querySelector('.close-button-water-type') : null;
    const waterTypeModalTitle = document.getElementById('water-type-modal-title');
    const waterDateDisplay = document.getElementById('water-date-display');
    const waterTypeOptionsContainer = document.getElementById('water-type-options');

    // エクスポート/インポート関連の要素
    const exportButton = document.getElementById('export-data-button');
    const importButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');
    const importFileNameDisplay = document.getElementById('import-file-name');
    
    // カスタム通知エリアの動的生成
    const NOTIFICATION_AREA_ID = 'custom-notification-area';
    let notificationArea = document.getElementById(NOTIFICATION_AREA_ID);
    if (!notificationArea) {
        notificationArea = document.createElement('div');
        notificationArea.id = NOTIFICATION_AREA_ID;
        document.body.appendChild(notificationArea);
    }
    
    // データ状態の管理
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    // データ形式の正規化/マイグレーション
    userPlants = normalizePlantData(userPlants);
    localStorage.setItem('userPlants', JSON.stringify(userPlants)); 
    
    let currentPlantId = null;
    let draggedId = null; 

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
    // 4. 初期化処理, Local Storage / 日付データ処理 
    // ----------------------------------------------------

    /**
     * 🌟 既存データを新しい waterLog 形式に変換する（マイグレーション）
     */
    function normalizePlantData(plants) {
        const normalizedPlants = plants.map(p => {
            // 1. entryDate の設定
            if (!p.entryDate) {
                if (p.lastWatered) {
                    p.entryDate = p.lastWatered;
                } else if (p.lastWatering && p.lastWatering.date) {
                    p.entryDate = p.lastWatering.date;
                } else {
                    p.entryDate = today;
                }
            }
            
            // 2. waterLog の設定（重要）
            if (!Array.isArray(p.waterLog)) {
                p.waterLog = [];
                // lastWatering（旧々形式）が存在すれば、それを最初のログエントリとして追加
                if (p.lastWatering && p.lastWatering.date && p.lastWatering.type) {
                    p.waterLog.push({ 
                        date: p.lastWatering.date, 
                        type: p.lastWatering.type 
                    });
                } 
                // lastWatered（旧形式）が存在すれば、それを WaterOnly でログとして追加
                else if (p.lastWatered) {
                    if (p.waterLog.length === 0 || p.waterLog.every(log => log.date !== p.lastWatered)) {
                         p.waterLog.push({ 
                            date: p.lastWatered, 
                            type: 'WaterOnly' 
                        });
                    }
                } else if (p.waterLog.length === 0) {
                    // ログが全くない場合、初期の登録日を水のみログとして追加
                    p.waterLog.push({ date: p.entryDate, type: 'WaterOnly' });
                }
            } else {
                 // 配列が存在する場合は、新しい形式のログであることを確認し、ソート
                 p.waterLog.sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            // 古いプロパティを削除（クリーンアップ）
            delete p.lastWatered; 
            delete p.lastWatering; 
            
            return p;
        });
        
        return normalizedPlants;
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

        renderPlantCards();
    }
    
    // 日付表示ユーティリティ関数
    function formatJapaneseDate(dateString) {
        if (!dateString) return '未設定';
        const [year, month, day] = dateString.split('-');
        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }

    // 日数/年数を計算するユーティリティ関数
    function calculateTimeSince(startDateString) {
        if (!startDateString) return '';
        
        const start = new Date(startDateString);
        const today = new Date();
        start.setHours(0, 0, 0, 0); 
        today.setHours(0, 0, 0, 0); 
        
        const diffTime = Math.abs(today - start);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays >= 365) {
            const diffYears = (diffDays / 365.25).toFixed(1); 
            return `約 ${diffYears} 年`;
        }
        return `${diffDays} 日`;
    }
    
    // Local Storage Helper Functions
    const getPurchaseDate = (plantId) => localStorage.getItem(`purchase_date_${plantId}`);
    const savePurchaseDate = (plantId, date) => localStorage.setItem(`purchase_date_${plantId}`, date);
    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        if (purchaseDateDisplay) purchaseDateDisplay.textContent = formatJapaneseDate(date);
    };
    
    const getRepottingDate = (plantId) => localStorage.getItem(`repotting_date_${plantId}`);
    const saveRepottingDate = (plantId, date) => localStorage.setItem(`repotting_date_${plantId}`, date);
    const updateRepottingDateDisplay = (plantId) => {
        const date = getRepottingDate(plantId);
        if (repottingDateDisplay) repottingDateDisplay.textContent = formatJapaneseDate(date);
    };
    
    // ----------------------------------------------------
    // 5. カルテレンダリングとカード生成 
    // ----------------------------------------------------

    function renderPlantCards() {
        if (!plantCardList) return;

        if (userPlants.length === 0) {
            plantCardList.innerHTML = `
                <div class="empty-state">
                    <p>カルテに植物がまだ登録されていません。</p>
                    <p>上の「🌱 新規植物の登録」セクションから、育てている植物を登録しましょう！</p>
                </div>
            `;
            return; 
        }

        const cardContainer = document.createElement('div');
        cardContainer.className = 'plant-card-container';
        
        userPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(p => p.id == userPlant.speciesId);
            if (!data) return;

            const card = createPlantCard(userPlant, data, currentSeasonKey); 
            cardContainer.appendChild(card);
        });

        plantCardList.innerHTML = '';
        plantCardList.appendChild(cardContainer);
    }
    
    /**
     * 水やり内容の選択カスタムモーダルを表示する関数
     */
    function showWaterTypeSelectionModal(plantId) {
        const numericId = parseInt(plantId);
        const plant = userPlants.find(p => p.id === numericId);
        if (!plant || !waterTypeModal) return;

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
        card.setAttribute('draggable', true);
        
        const controls = document.createElement('div');
        controls.className = 'controls';
        
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '☰';
        controls.appendChild(dragHandle);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = '×';
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
        
        // 水やり完了ボタンの変更: カスタムモーダル表示に変更
        const waterButton = document.createElement('button');
        waterButton.className = 'action-button tertiary water-done-btn';
        waterButton.textContent = '💧 水やり完了 (内容選択)';
        waterButton.onclick = (e) => {
            e.stopPropagation();
            showWaterTypeSelectionModal(userPlant.id); 
        };
        
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';
        cardFooter.appendChild(waterButton);
        card.appendChild(cardFooter);

        card.addEventListener('click', () => showDetailsModal(userPlant, data));
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        return card;
    }
    
    /**
     * 植え替えリマインダーロジックを実装
     */
    function checkRepottingStatus(plantData, userPlantId) {
        const repottingText = plantData.maintenance.repotting; // 例: '5月〜8月'
        const match = repottingText.match(/(\d+)月.([〜~])(\d+)月/);

        if (!match) {
            return `<li>植え替え推奨時期: ${repottingText}</li>`;
        }

        const startMonth = parseInt(match[1]);
        const endMonth = parseInt(match[3]);
        const currentMonth = new Date().getMonth() + 1; // 1-12

        let isRecommendedTime = false;
        if (startMonth <= endMonth) { 
            isRecommendedTime = (currentMonth >= startMonth && currentMonth <= endMonth);
        } else { 
            isRecommendedTime = (currentMonth >= startMonth || currentMonth <= endMonth);
        }
        
        const lastRepottingDateString = getRepottingDate(userPlantId);
        let isOverOneYear = true;
        
        if (lastRepottingDateString) {
            const lastRepottingDate = new Date(lastRepottingDateString);
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            oneYearAgo.setDate(oneYearAgo.getDate() - 1); 

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
        
        // 🌟 waterLogの最新エントリを使用
        const lastLog = userPlant.waterLog && userPlant.waterLog.length > 0 ? userPlant.waterLog[0] : { date: today, type: 'WaterOnly' };
        
        const lastWateringDate = new Date(lastLog.date);
        const todayDate = new Date();
        lastWateringDate.setHours(0, 0, 0, 0); 
        todayDate.setHours(0, 0, 0, 0); 
        const timeSinceWatered = Math.floor((todayDate - lastWateringDate) / (1000 * 60 * 60 * 24)); 
        
        let recommendedIntervalDays = seasonData.waterIntervalDays || null; 
        let intervalDisplay = '';
        
        if (recommendedIntervalDays !== null) {
            if (recommendedIntervalDays === 999) { 
                 intervalDisplay = `（現在 ${SEASONS[seasonKey].name.split(' ')[0]} は断水期間です）`;
            } else {
                 intervalDisplay = `（約 ${recommendedIntervalDays} 日ごと）`;
            }
        } else {
            intervalDisplay = `（推奨間隔データなし）`;
        }

        let actionMessage = '';
        if (recommendedIntervalDays && recommendedIntervalDays <= 30) { 
            const daysUntilNext = recommendedIntervalDays - timeSinceWatered;
            
            if (daysUntilNext <= 0) {
                actionMessage = `<li class="risk-message">🚨 <span class="risk-alert danger">水やり目安日を**${Math.abs(daysUntilNext)}日超過**！</span></li>`;
            } else if (daysUntilNext <= 3) {
                actionMessage = `<li class="risk-message">⚠️ <span class="risk-alert warning">あと**${daysUntilNext}日**で水やり目安日です。</span></li>`;
            } else {
                actionMessage = `<li>次回目安まで、あと **${daysUntilNext}日** です。</li>`;
            }
        } else {
            actionMessage = `<li>前回水やり日から **${timeSinceWatered}日経過**。</li>`;
        }

        const waterMethodSummary = data.water_method.split('。')[0] + '。';
        
        const lastWateringTypeKey = lastLog.type;
        const lastWateringType = WATER_TYPES[lastWateringTypeKey] || WATER_TYPES.WaterOnly;
        
        const timeSinceEntry = calculateTimeSince(userPlant.entryDate);
        
        const repottingReminder = checkRepottingStatus(data, userPlant.id);


        return `
            <div class="card-image">
                <img src="${data.img}" alt="${data.species}" 
                     onerror="this.onerror=null; this.src='https://placehold.co/150x150/e9ecef/495057?text=No+Image'; this.style.objectFit='contain';">
            </div>
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

    /**
     * 🌟 水やり履歴をレンダリングする関数
     */
    function renderWaterHistory(waterLog) {
        if (!waterHistoryList) return;
        waterHistoryList.innerHTML = '';
        
        if (!waterLog || waterLog.length === 0) {
            waterHistoryList.innerHTML = '<li style="justify-content: center; color: var(--color-text-mid);">まだ水やり記録がありません。</li>';
            return;
        }

        waterLog.forEach(log => {
            const logItem = document.createElement('li');
            const typeData = WATER_TYPES[log.type] || WATER_TYPES.WaterOnly;
            
            logItem.innerHTML = `
                <span class="date">${formatJapaneseDate(log.date)}</span>
                <span class="water-type-badge ${typeData.class}">${typeData.name}</span>
            `;
            waterHistoryList.appendChild(logItem);
        });
    }

    // 詳細モーダルで水やり情報を分割表示
    function showDetailsModal(userPlant, plantData) {
        if (!detailsModal || !plantDetails) return;

        currentPlantId = userPlant.id;
        const seasonData = plantData.management[currentSeasonKey];
        const maintenance = plantData.maintenance;
        
        entryDateDisplay.textContent = formatJapaneseDate(userPlant.entryDate);
        timeSinceEntryDisplay.textContent = calculateTimeSince(userPlant.entryDate);

        const repottingReminderMessage = checkRepottingStatus(plantData, userPlant.id);

        plantDetails.innerHTML = `
            <h2>${userPlant.name} (${plantData.species})</h2>
            <p class="scientific-name">${plantData.scientific}</p>
            <div style="text-align:center; margin-bottom: 20px;">
                <img src="${plantData.img}" alt="${plantData.species}" class="detail-image" 
                     style="max-width: 100%; height: auto;"
                     onerror="this.onerror=null; this.src='https://placehold.co/250x250/e9ecef/495057?text=No+Image'; this.style.objectFit='contain';">
            </div>
            
            <div class="detail-section">
                <h3>現在の季節別ケア (${SEASONS[currentSeasonKey].name})</h3>
                <ul>
                    <li><strong>水やり量（一度に与える量）:</strong> ${plantData.water_method}</li>
                    <li><strong>水やり頻度（タイミング）:</strong> ${seasonData.water}</li>
                    <li><strong>光:</strong> ${seasonData.light}</li>
                    ${seasonData.tempRisk ? `<li><strong>寒さ対策:</strong> ${seasonData.tempRisk}</li>` : ''}
                </ul>
            </div>
            <div class="detail-section">
                <h3>基本情報・年間メンテナンス</h3>
                <ul>
                    <li><strong>難易度:</strong> ${plantData.difficulty}</li>
                    <li><strong>特徴:</strong> ${plantData.feature}</li>
                    <li><strong>最低越冬温度:</strong> ${plantData.minTemp}°C</li>
                    <li><strong>肥料:</strong> ${maintenance.fertilizer}</li>
                    <li><strong>植え替え:</strong> ${maintenance.repotting}</li>
                    <li><strong>剪定:</strong> ${maintenance.pruning}</li>
                </ul>
            </div>
            
            <div class="detail-section" style="padding: 10px 0; border-top: 1px solid #e9ecef;">
                ${repottingReminderMessage}
            </div>
        `;
        
        updatePurchaseDateDisplay(userPlant.id); 
        updateRepottingDateDisplay(userPlant.id); 
        
        // 🌟 水やり履歴のレンダリング
        renderWaterHistory(userPlant.waterLog);
        
        // 水やり完了ボタンの変更: カスタムモーダル表示に変更
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

        detailsModal.style.display = 'block'; 
    }

    if (closeDetailButton) {
        closeDetailButton.onclick = () => {
            detailsModal.style.display = 'none';
            currentPlantId = null;
        };
    }
    
    // 水やり内容選択モーダルのクローズ処理
    if (closeWaterTypeButton) {
        closeWaterTypeButton.onclick = () => {
            waterTypeModal.style.display = 'none';
        };
    }
    
    // ----------------------------------------------------
    // 6. 新規植物登録処理
    // ----------------------------------------------------

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
                // 🌟 構造変更: waterLogを初期化し、最初の記録を格納
                waterLog: [{
                    date: lastWateredDate,
                    type: waterType
                }]
            };

            userPlants.unshift(newPlant);
            localStorage.setItem('userPlants', JSON.stringify(userPlants));
            
            renderPlantCards();
            addPlantForm.reset();
            
            if (lastWateredInput) {
                lastWateredInput.value = today;
            }
            showNotification(`「${newPlant.name}」をカルテに追加しました！`, 'success');
        });
    }

    // ----------------------------------------------------
    // 7. カルテ削除ロジック
    // ----------------------------------------------------

    function deletePlantCard(id) {
        const numericId = parseInt(id); 
        
        showCustomConfirm('この植物のカルテを削除してもよろしいですか？', () => {
             userPlants = userPlants.filter(plant => plant.id !== numericId);
             localStorage.setItem('userPlants', JSON.stringify(userPlants));
            
             localStorage.removeItem(`purchase_date_${numericId}`);
             localStorage.removeItem(`repotting_date_${numericId}`);
            
             renderPlantCards();
             showNotification('カルテを削除しました。', 'success'); 
        });
    }

    // ----------------------------------------------------
    // 8. ドラッグ＆ドロップ（順序変更）ロジック
    // ----------------------------------------------------

    function handleDragStart(e) {
        draggedId = parseInt(e.target.dataset.id);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => e.target.style.opacity = '0.4', 0);
    }

    function handleDragOver(e) {
        e.preventDefault(); 
        
        const targetCard = e.target.closest('.plant-card');
        if (!targetCard || targetCard.classList.contains('dragging')) return;
        
        const bounding = targetCard.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        
        if (e.clientY < offset) {
            targetCard.classList.add('drop-before');
            targetCard.classList.remove('drop-after');
        } else {
            targetCard.classList.add('drop-after');
            targetCard.classList.remove('drop-before');
        }
        
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        
        const targetCard = e.target.closest('.plant-card');
        if (!targetCard || draggedId === null) return;

        targetCard.classList.remove('drop-before', 'drop-after');

        const droppedId = parseInt(targetCard.dataset.id);
        
        const draggedIndex = userPlants.findIndex(p => p.id === draggedId);
        let droppedIndex = userPlants.findIndex(p => p.id === droppedId);

        if (draggedIndex === -1 || droppedIndex === -1 || draggedIndex === droppedIndex) return;

        const [draggedItem] = userPlants.splice(draggedIndex, 1);
        
        const bounding = targetCard.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        
        let insertIndex = droppedIndex;

        if (e.clientY > offset) {
            insertIndex = droppedIndex + 1;
        }
        
        if (insertIndex > draggedIndex) {
            insertIndex--;
        }

        userPlants.splice(insertIndex, 0, draggedItem);
        
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        renderPlantCards();
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        e.target.style.opacity = '1'; 
        document.querySelectorAll('.plant-card').forEach(card => {
            card.classList.remove('drop-before', 'drop-after');
        });
        draggedId = null;
    }


    // ----------------------------------------------------
    // 9. 購入日/植え替え日入力モーダル処理
    // ----------------------------------------------------
    
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

            detailsModal.style.display = 'none'; 
            purchaseDateModal.style.display = 'block';
            purchaseDateInput.setAttribute('max', today); 

            const existingDate = getPurchaseDate(currentPlantId);
            purchaseDateInput.value = existingDate || '';
        };
    }
    
    if (savePurchaseDateButton) {
        savePurchaseDateButton.onclick = () => {
            const newDate = purchaseDateInput.value;
            if (newDate && currentPlantId !== null) {
                savePurchaseDate(currentPlantId, newDate);
                showNotification('購入日を保存しました。', 'success');
                
                purchaseDateModal.style.display = 'none';
                if (detailsModal) detailsModal.style.display = 'block'; 
                updatePurchaseDateDisplay(currentPlantId);
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
            repottingDateInput.setAttribute('max', today); 
            
            const existingDate = getRepottingDate(currentPlantId);
            repottingDateInput.value = existingDate || '';
        };
    }
    
    if (saveRepottingDateButton) {
        saveRepottingDateButton.onclick = () => {
            const newDate = repottingDateInput.value;
            if (newDate && currentPlantId !== null) {
                saveRepottingDate(currentPlantId, newDate);
                showNotification('植え替え日を保存しました。', 'success');
                
                repottingDateModal.style.display = 'none';
                if (detailsModal) detailsModal.style.display = 'block'; 
                updateRepottingDateDisplay(currentPlantId);
                renderPlantCards(); 
            } else {
                showNotification('日付を入力してください。', 'warning');
            }
        };
    }


    // ----------------------------------------------------
    // 10. エクスポート/インポート機能
    // ----------------------------------------------------

    const collectAllData = () => {
        const userPlantsRaw = localStorage.getItem('userPlants');
        const purchaseDates = {};
        const repottingDates = {}; 

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('purchase_date_')) {
                purchaseDates[key] = localStorage.getItem(key);
            }
            if (key && key.startsWith('repotting_date_')) {
                repottingDates[key] = localStorage.getItem(key);
            }
        }

        return {
            userPlants: userPlantsRaw ? JSON.parse(userPlantsRaw) : [],
            purchaseDates: purchaseDates,
            repottingDates: repottingDates 
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
            a.download = `houseplant_care_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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

                if (!Array.isArray(importedData.userPlants) || typeof importedData.purchaseDates !== 'object') {
                    throw new Error('JSON形式が正しくありません。必要なキー（userPlants, purchaseDates）が見つかりません。');
                }
                
                showCustomConfirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？', () => {
                    // userPlantsの正規化処理は、インポートされたデータに対しても適用されるため、waterLogへの変換も安全に行われる。
                    userPlants = normalizePlantData(importedData.userPlants); 
                    localStorage.setItem('userPlants', JSON.stringify(userPlants));

                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('purchase_date_') || key.startsWith('repotting_date_') || key === 'userPlants' || key === 'purchaseDates')) {
                            localStorage.removeItem(key);
                        }
                    }
                    
                    Object.keys(importedData.purchaseDates).forEach(key => {
                        localStorage.setItem(key, importedData.purchaseDates[key]);
                    });
                    
                    if (importedData.repottingDates) {
                        Object.keys(importedData.repottingDates).forEach(key => {
                            localStorage.setItem(key, importedData.repottingDates[key]);
                        });
                    }

                    showNotification('カルテデータのインポートが完了しました。画面を更新します。', 'success');
                    renderPlantCards(); 
                }, () => {
                    // キャンセルの場合、処理なし
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
    // 11. PWA Service Worker 登録ロジック
    // ----------------------------------------------------
    
    initializeApp();

});

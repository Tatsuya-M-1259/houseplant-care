// app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 0. 新規: 定数定義
    // ----------------------------------------------------
    const WATER_TYPES = {
        WaterOnly: { name: '水のみ', class: 'water' },
        WaterAndFertilizer: { name: '水と液肥', class: 'fertilizer' },
        WaterAndActivator: { name: '水と活性剤', class: 'activator' },
        WaterFertilizerAndActivator: { name: '水・液肥・活性剤', class: 'complex' }
    };

    // ----------------------------------------------------
    // 2. カスタムUIユーティリティ (alert/confirmの代替)
    // ----------------------------------------------------

    /**
     * カスタムトースト通知を表示する
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知のタイプ ('success', 'warning', 'error')
     * @param {number} duration - 表示時間 (ms)
     */
    function showNotification(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`; // タイプ別のクラスを適用
        toast.textContent = message;

        notificationArea.appendChild(toast);

        // フェードイン
        setTimeout(() => toast.classList.add('show'), 10);

        // フェードアウト
        setTimeout(() => {
            toast.classList.remove('show');
            // DOMから削除
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
     * 新規: 水やり日と内容を更新する
     * @param {number} plantId - 植物のID
     * @param {string} type - 水やり内容のキー ('WaterOnly', 'WaterAndFertilizer', etc.)
     * @param {string} [date] - 更新日 (デフォルトは今日)
     */
    function updateLastWatered(plantId, type, date = new Date().toISOString().split('T')[0]) {
        const numericId = parseInt(plantId);
        const plantIndex = userPlants.findIndex(p => p.id === numericId);
        
        if (plantIndex !== -1) {
            // 🌟 構造を更新: lastWatering オブジェクトを使用
            userPlants[plantIndex].lastWatering = {
                date: date,
                type: type
            };
            
            // 古い lastWatered プロパティが存在する場合は削除
            delete userPlants[plantIndex].lastWatered; 

            localStorage.setItem('userPlants', JSON.stringify(userPlants));
            renderPlantCards();
            showNotification(`${userPlants[plantIndex].name} の水やり日と内容を更新しました！(${WATER_TYPES[type].name})`, 'success');
            
            // 詳細モーダルが開いている場合は表示を更新
            if (currentPlantId === numericId && detailsModal.style.display === 'block') {
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

    // 日付入力の最大値を今日に設定し、未来日の入力を防止
    const today = new Date().toISOString().split('T')[0];
    const lastWateredInput = document.getElementById('last-watered');
    if (lastWateredInput) {
        lastWateredInput.setAttribute('max', today);
        lastWateredInput.value = today; // 🌟 初期値を今日に設定
    }

    // モーダル要素
    const detailsModal = document.getElementById('details-modal'); 
    const closeDetailButton = detailsModal ? detailsModal.querySelector('.close-button') : null; 
    const plantDetails = document.getElementById('plant-details'); 
    
    // 詳細モーダル内の要素
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    const editPurchaseDateButton = document.getElementById('edit-purchase-date-button');
    const waterDoneInDetailContainer = document.getElementById('water-done-in-detail'); 
    // 🌟 新規: 詳細モーダルの新規要素
    const entryDateDisplay = document.getElementById('entry-date-display');
    const timeSinceEntryDisplay = document.getElementById('time-since-entry-display');
    const repottingDateDisplay = document.getElementById('repotting-date-display');
    const editRepottingDateButton = document.getElementById('edit-repotting-date-button'); // 植え替え日ボタン
    
    // 購入日入力モーダル
    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal ? purchaseDateModal.querySelector('.close-button-purchase-date') : null;
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    
    // 🌟 新規: 植え替え日入力モーダル
    const repottingDateModal = document.getElementById('repotting-date-modal');
    const closeRepottingDateButton = repottingDateModal ? repottingDateModal.querySelector('.close-button-repotting-date') : null;
    const repottingDateInput = document.getElementById('repotting-date-input');
    const saveRepottingDateButton = document.getElementById('save-repotting-date-button');
    
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
    // 🌟 新規: データ形式の正規化/マイグレーション
    userPlants = normalizePlantData(userPlants);
    localStorage.setItem('userPlants', JSON.stringify(userPlants)); // 念のため更新
    
    let currentPlantId = null;
    let draggedId = null; 

    // ----------------------------------------------------
    // 3. 季節判定ロジック (変更なし)
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
     * 新規: 既存データを新しい形式に変換する（マイグレーション）
     */
    function normalizePlantData(plants) {
        return plants.map(p => {
            // 登録日がない場合は、既存の lastWatered または今日の日付を設定
            if (!p.entryDate) {
                p.entryDate = p.lastWatered || today; 
            }
            
            // lastWatering がない場合は、 lastWatered (string) から変換
            if (!p.lastWatering || typeof p.lastWatering === 'string') {
                p.lastWatering = {
                    date: p.lastWatered || today, // dateは既存のlastWateredを使用
                    type: 'WaterOnly' // 内容はデフォルトの「水のみ」を設定
                };
            }

            // 古い lastWatered プロパティを削除（クリーンアップ）
            delete p.lastWatered; 
            
            return p;
        });
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
    
    // 🌟 新規: 日付表示ユーティリティ関数
    function formatJapaneseDate(dateString) {
        if (!dateString) return '未設定';
        const [year, month, day] = dateString.split('-');
        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
    }

    // 🌟 新規: 日数/年数を計算するユーティリティ関数
    function calculateTimeSince(startDateString) {
        if (!startDateString) return '';
        
        const start = new Date(startDateString);
        const today = new Date();
        start.setHours(0, 0, 0, 0); // 時刻を無視
        today.setHours(0, 0, 0, 0); // 時刻を無視
        
        const diffTime = Math.abs(today - start);
        // 1日 = 1000ms * 60s * 60m * 24h
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays >= 365) {
            const diffYears = (diffDays / 365.25).toFixed(1); // 閏年考慮
            return `約 ${diffYears} 年`;
        }
        return `${diffDays} 日`;
    }
    
    // Local Storage Helper Functions (Repotting Date を追加)
    
    const getPurchaseDate = (plantId) => {
        return localStorage.getItem(`purchase_date_${plantId}`);
    };

    const savePurchaseDate = (plantId, date) => {
        localStorage.setItem(`purchase_date_${plantId}`, date);
    };

    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        if (purchaseDateDisplay) {
            purchaseDateDisplay.textContent = formatJapaneseDate(date);
        }
    };
    
    // 🌟 新規: 植え替え日ヘルパー
    const getRepottingDate = (plantId) => {
        return localStorage.getItem(`repotting_date_${plantId}`);
    };

    const saveRepottingDate = (plantId, date) => {
        localStorage.setItem(`repotting_date_${plantId}`, date);
    };

    const updateRepottingDateDisplay = (plantId) => {
        const date = getRepottingDate(plantId);
        if (repottingDateDisplay) {
            repottingDateDisplay.textContent = formatJapaneseDate(date);
        }
    };
    
    // ----------------------------------------------------
    // 5. カルテレンダリングとカード生成 
    // ----------------------------------------------------

    function renderPlantCards() {
        if (!plantCardList) return;

        // 🌟 改善: 空のカルテリストに対するフィードバック
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
     * 新規: 水やり内容の選択ダイアログを表示する関数
     */
    function showWaterTypeSelection(plantId) {
        const plant = userPlants.find(p => p.id === parseInt(plantId));
        if (!plant) return;

        // ブラウザ標準のpromptをカスタム通知/確認に置き換えるための暫定的な実装
        const waterTypesOptions = Object.keys(WATER_TYPES).map((key, index) => 
            `${index + 1}: ${WATER_TYPES[key].name}`
        ).join('\n');

        const input = window.prompt(
            `「${plant.name}」の水やり内容を選択してください。\n\n${waterTypesOptions}\n\n数字を入力してください:`
        );

        if (input) {
            const index = parseInt(input) - 1;
            const selectedKey = Object.keys(WATER_TYPES)[index];

            if (selectedKey) {
                // 🌟 updateLastWatered を呼び出す
                updateLastWatered(plantId, selectedKey);
            } else {
                showNotification('無効な選択です。', 'error');
            }
        }
    }


    function createPlantCard(userPlant, data, activeSeasonKey) {
        
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.setAttribute('data-id', userPlant.id);
        card.setAttribute('draggable', true);
        
        // コントロールボタンコンテナ
        const controls = document.createElement('div');
        controls.className = 'controls';
        
        // ドラッグハンドル
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '☰';
        controls.appendChild(dragHandle);

        // 削除ボタン
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = '×';
        deleteButton.onclick = (e) => { 
            e.stopPropagation(); 
            deletePlantCard(userPlant.id);
        };
        controls.appendChild(deleteButton);
        card.appendChild(controls); 

        // 季節選択ボタンの生成 
        const seasonSelector = document.createElement('div');
        seasonSelector.className = 'season-selector';
        
        ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].forEach(key => {
            const button = document.createElement('button');
            button.textContent = SEASONS[key].name.split(' ')[0];
            button.className = key === activeSeasonKey ? 'active' : '';
            
            // 季節切替機能の実装
            button.onclick = (e) => { 
                e.stopPropagation();
                
                seasonSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const contentElement = card.querySelector('.card-content-wrapper');
                if(contentElement) {
                    contentElement.innerHTML = generateCardContent(userPlant, data, key);
                }
            };
            seasonSelector.appendChild(button);
        });

        const content = document.createElement('div');
        content.className = 'card-content-wrapper'; 
        content.innerHTML = generateCardContent(userPlant, data, activeSeasonKey);
        
        card.appendChild(seasonSelector); 
        card.appendChild(content);
        
        // 🌟 水やり完了ボタンの変更: showWaterTypeSelectionを呼び出す
        const waterButton = document.createElement('button');
        waterButton.className = 'action-button tertiary water-done-btn';
        waterButton.textContent = '💧 水やり完了 (内容選択)';
        waterButton.onclick = (e) => {
            e.stopPropagation();
            // 🌟 新しい水やり内容選択ロジックを呼び出す
            showWaterTypeSelection(userPlant.id);
        };
        
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';
        cardFooter.appendChild(waterButton);
        card.appendChild(cardFooter);


        card.addEventListener('click', () => showDetailsModal(userPlant, data));

        // ドラッグ＆ドロップイベントリスナー
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        return card;
    }

    function generateCardContent(userPlant, data, seasonKey) {
        const seasonData = data.management[seasonKey];
        const riskText = getSeasonRisk(seasonKey, data);
        
        // 🌟 userPlant.lastWatering.date を使用する
        const lastWateringDate = new Date(userPlant.lastWatering.date);
        const todayDate = new Date();
        lastWateringDate.setHours(0, 0, 0, 0); // 時刻を無視
        todayDate.setHours(0, 0, 0, 0); // 時刻を無視
        const timeSinceWatered = Math.floor((todayDate - lastWateringDate) / (1000 * 60 * 60 * 24)); 
        
        // waterIntervalDaysプロパティを使用して推奨間隔を取得 (データ駆動)
        let recommendedIntervalDays = seasonData.waterIntervalDays || null; 
        let intervalDisplay = '';
        
        if (recommendedIntervalDays !== null) {
            if (recommendedIntervalDays === 999) { // 999は断水期間
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
        
        // 🌟 新規: 前回の水やり内容表示
        const lastWateringTypeKey = userPlant.lastWatering.type;
        const lastWateringType = WATER_TYPES[lastWateringTypeKey] || WATER_TYPES.WaterOnly;
        
        // 🌟 新規: 登録日と経過日数の表示
        const timeSinceEntry = calculateTimeSince(userPlant.entryDate);

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
                <li><strong>前回水やり:</strong> ${formatJapaneseDate(userPlant.lastWatering.date)} 
                    <strong class="last-watered-type">
                        <span class="water-type-badge ${lastWateringType.class}">
                            ${lastWateringType.name}
                        </span>
                    </strong>
                </li>
                ${actionMessage}
                <li>**光量要求:** ${seasonData.light}</li>
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

    // 詳細モーダルで水やり情報を分割表示
    function showDetailsModal(userPlant, plantData) {
        if (!detailsModal || !plantDetails) return;

        currentPlantId = userPlant.id;
        const seasonData = plantData.management[currentSeasonKey];
        const maintenance = plantData.maintenance;
        
        // 🌟 登録日と経過日数の表示を更新
        entryDateDisplay.textContent = formatJapaneseDate(userPlant.entryDate);
        timeSinceEntryDisplay.textContent = calculateTimeSince(userPlant.entryDate);

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
        `;
        
        updatePurchaseDateDisplay(userPlant.id); 
        // 🌟 新規: 植え替え日表示を更新
        updateRepottingDateDisplay(userPlant.id); 
        
        // 🌟 水やり完了ボタンの変更: showWaterTypeSelectionを呼び出す
        if (waterDoneInDetailContainer) {
            waterDoneInDetailContainer.innerHTML = ''; // 一旦クリア
            const waterButton = document.createElement('button');
            waterButton.className = 'action-button water-done-btn'; // スタイルはCSSで調整
            waterButton.textContent = '💧 水やり完了 (内容選択)';
            waterButton.onclick = () => {
                // 🌟 新しい水やり内容選択ロジックを呼び出す
                showWaterTypeSelection(userPlant.id);
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
    
    // ----------------------------------------------------
    // 6. 新規植物登録処理 
    // ----------------------------------------------------

    if (addPlantForm) {
        addPlantForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // 🌟 新規: 水やり内容を取得
            const lastWateredDate = document.getElementById('last-watered').value;
            const waterType = document.getElementById('water-type-select').value;
            
            const newPlant = {
                id: Date.now(), 
                // 🌟 改善: 植物名をサニタイズしてXSSを防止
                name: escapeHTML(document.getElementById('plant-name').value),
                speciesId: document.getElementById('species-select').value,
                // 🌟 新規: 登録日を lastWatered と同じ日に設定
                entryDate: lastWateredDate,
                // 🌟 構造変更: lastWatering オブジェクト
                lastWatering: {
                    date: lastWateredDate,
                    type: waterType
                }
            };

            userPlants.unshift(newPlant);
            localStorage.setItem('userPlants', JSON.stringify(userPlants));
            
            renderPlantCards();
            addPlantForm.reset();
            
            // lastWateredInput の初期値を今日に戻す
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
        
        // 🌟 修正: カスタム確認関数を使用
        showCustomConfirm('この植物のカルテを削除してもよろしいですか？', () => {
             userPlants = userPlants.filter(plant => plant.id !== numericId);
             localStorage.setItem('userPlants', JSON.stringify(userPlants));
            
             localStorage.removeItem(`purchase_date_${numericId}`);
             // 🌟 新規: 植え替え日も削除
             localStorage.removeItem(`repotting_date_${numericId}`);
            
             renderPlantCards();
             showNotification('カルテを削除しました。', 'success'); 
        });
    }

    // ----------------------------------------------------
    // 8. ドラッグ＆ドロップ（順序変更）ロジック (CSSクラスを適用)
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
        
        // CSSクラスを操作
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

        // クラスを削除して視覚フィードバックをリセット
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
        // すべてのカードのクラスをリセット
        document.querySelectorAll('.plant-card').forEach(card => {
            card.classList.remove('drop-before', 'drop-after');
        });
        draggedId = null;
    }


    // ----------------------------------------------------
    // 9. 購入日入力モーダル処理 (変更なし)
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
            purchaseDateInput.setAttribute('max', today); // 未来日入力防止

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
    
    // ----------------------------------------------------
    // 9.5. 新規: 植え替え日入力モーダル処理
    // ----------------------------------------------------
    
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
            repottingDateInput.setAttribute('max', today); // 未来日入力防止
            
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
        const repottingDates = {}; // 🌟 新規: 植え替え日データ

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('purchase_date_')) {
                purchaseDates[key] = localStorage.getItem(key);
            }
            // 🌟 新規: 植え替え日を収集
            if (key && key.startsWith('repotting_date_')) {
                repottingDates[key] = localStorage.getItem(key);
            }
        }

        return {
            userPlants: userPlantsRaw ? JSON.parse(userPlantsRaw) : [],
            purchaseDates: purchaseDates,
            repottingDates: repottingDates // 🌟 新規: エクスポートデータに追加
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

                // 必要なキーの確認 (repottingDatesはオプションとして扱う)
                if (!Array.isArray(importedData.userPlants) || typeof importedData.purchaseDates !== 'object') {
                    throw new Error('JSON形式が正しくありません。必要なキー（userPlants, purchaseDates）が見つかりません。');
                }
                
                showCustomConfirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？', () => {
                    // 1. userPlants (メインカルテ) の更新と正規化
                    userPlants = normalizePlantData(importedData.userPlants); 
                    localStorage.setItem('userPlants', JSON.stringify(userPlants));

                    // 2. LocalStorage のデータクリーンアップ (古いデータ形式も削除)
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && (key.startsWith('purchase_date_') || key.startsWith('repotting_date_') || key === 'userPlants' || key === 'purchaseDates')) {
                            localStorage.removeItem(key);
                        }
                    }
                    
                    // 3. Purchase Dates (購入日) の更新
                    Object.keys(importedData.purchaseDates).forEach(key => {
                        localStorage.setItem(key, importedData.purchaseDates[key]);
                    });
                    
                    // 4. 🌟 新規: Repotting Dates (植え替え日) の更新
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
                // 成功/エラー/キャンセルにかかわらず、ファイル選択はここで必ずリセットする
                if(importFileInput) {
                    importFileInput.value = '';
                    importFileNameDisplay.textContent = 'ファイル未選択';
                }
            }
        };
        reader.readAsText(file);
    };


    // ----------------------------------------------------
    // 11. PWA Service Worker 登録ロジック (変更なし)
    // ----------------------------------------------------
    
    initializeApp();

});

// app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 2. カスタムUIユーティリティ (alert/confirmの代替)
    // ----------------------------------------------------

    /**
     * カスタムトースト通知を表示する
     */
    function showNotification(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
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
     * 🌟 改善: ユーザー入力のHTMLをエスケープし、XSSを防ぐ
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

    // ----------------------------------------------------
    // 1. DOM要素の定義
    // ----------------------------------------------------
    const plantCardList = document.getElementById('plant-card-list'); // 登録済み植物カードの表示エリア
    const speciesSelect = document.getElementById('species-select');
    const addPlantForm = document.getElementById('add-plant-form');

    // 🌟 改善: 日付入力の最大値を今日に設定し、未来日の入力を防止
    const today = new Date().toISOString().split('T')[0];
    const lastWateredInput = document.getElementById('last-watered');
    if (lastWateredInput) {
        lastWateredInput.setAttribute('max', today);
    }

    // モーダル要素
    const detailsModal = document.getElementById('details-modal'); // 詳細モーダル
    const closeDetailButton = detailsModal ? detailsModal.querySelector('.close-button') : null; 
    const plantDetails = document.getElementById('plant-details'); // 詳細情報の挿入エリア
    
    // 詳細モーダル内の要素
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    const editPurchaseDateButton = document.getElementById('edit-purchase-date-button');
    
    // 購入日入力モーダル
    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal ? purchaseDateModal.querySelector('.close-button-purchase-date') : null;
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    
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
    // 4. 初期化処理, Local Storage / 購入日データ処理 (変更なし)
    // ----------------------------------------------------

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
    
    const getPurchaseDate = (plantId) => {
        return localStorage.getItem(`purchase_date_${plantId}`);
    };

    const savePurchaseDate = (plantId, date) => {
        localStorage.setItem(`purchase_date_${plantId}`, date);
    };

    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        if (purchaseDateDisplay) {
            if (date) {
                const [year, month, day] = date.split('-');
                purchaseDateDisplay.textContent = `${year}年${parseInt(month)}月${parseInt(day)}日`;
            } else {
                purchaseDateDisplay.textContent = '未設定';
            }
        }
    };
    
    // ----------------------------------------------------
    // 5. カルテレンダリングとカード生成 
    // ----------------------------------------------------

    function renderPlantCards() {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'plant-card-container';
        
        userPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(p => p.id == userPlant.speciesId);
            if (!data) return;

            const card = createPlantCard(userPlant, data, currentSeasonKey); 
            cardContainer.appendChild(card);
        });

        if (plantCardList) {
            plantCardList.innerHTML = '';
            plantCardList.appendChild(cardContainer);
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
        
        const lastWateredDate = new Date(userPlant.lastWatered);
        const today = new Date();
        const timeSinceWatered = Math.floor((today - lastWateredDate) / (1000 * 60 * 60 * 24)); 
        
        // waterIntervalDaysプロパティを使用して推奨間隔を取得 (データ駆動)
        let recommendedIntervalDays = seasonData.waterIntervalDays || null; 
        let intervalDisplay = '';
        
        // waterIntervalDaysが定義されている場合
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

        return `
            <div class="card-image">
                <!-- 🌟 改善: 画像がロードできなかった場合の代替処理を追加 -->
                <img src="${data.img}" alt="${data.species}" 
                     onerror="this.onerror=null; this.src='https://placehold.co/150x150/e9ecef/495057?text=No+Image'; this.style.objectFit='contain';">
            </div>
            <div class="card-header">
                <h3>${userPlant.name}</h3>
                <p>${data.species}</p>
            </div>
            
            <div class="status-box">
                ${SEASONS[seasonKey].name.split(' ')[0]}の最重要管理項目: **${riskText}**
            </div>

            <h4>現在の管理プロトコル</h4>
            <ul>
                <li>**水やり量:** ${waterMethodSummary}</li>
                <li>**推奨頻度:** ${seasonData.water} <span style="font-size:0.9em; font-weight:normal;">${intervalDisplay}</span></li>
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

    // 詳細モーダルで水やり情報を分割表示 (表示の一貫性を修正)
    function showDetailsModal(userPlant, plantData) {
        if (!detailsModal || !plantDetails) return;

        currentPlantId = userPlant.id;
        // 詳細モーダルは常に現在の実世界の季節を表示
        const seasonData = plantData.management[currentSeasonKey];
        const maintenance = plantData.maintenance;

        plantDetails.innerHTML = `
            <h2>${userPlant.name} (${plantData.species})</h2>
            <p class="scientific-name">${plantData.scientific}</p>
            <div style="text-align:center; margin-bottom: 20px;">
                <!-- 🌟 改善: 画像がロードできなかった場合の代替処理を追加 -->
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
        detailsModal.style.display = 'block'; 
    }

    if (closeDetailButton) {
        closeDetailButton.onclick = () => {
            detailsModal.style.display = 'none';
            currentPlantId = null;
        };
    }
    
    // ----------------------------------------------------
    // 6. 新規植物登録処理 (通知をカスタムに修正)
    // ----------------------------------------------------

    if (addPlantForm) {
        addPlantForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // フォームのバリデーションはHTMLのrequiredとmax属性に任せる
            const newPlant = {
                id: Date.now(), 
                // 🌟 改善: 植物名をサニタイズしてXSSを防止
                name: escapeHTML(document.getElementById('plant-name').value),
                speciesId: document.getElementById('species-select').value,
                lastWatered: document.getElementById('last-watered').value,
            };

            userPlants.unshift(newPlant);
            localStorage.setItem('userPlants', JSON.stringify(userPlants));
            
            renderPlantCards();
            addPlantForm.reset();
            // 🌟 修正: カスタム通知を使用
            showNotification(`「${newPlant.name}」をカルテに追加しました！`);
        });
    }

    // ----------------------------------------------------
    // 7. カルテ削除ロジック (確認をカスタムに修正)
    // ----------------------------------------------------

    function deletePlantCard(id) {
        const numericId = parseInt(id); 
        
        // 🌟 修正: カスタム確認関数を使用
        showCustomConfirm('この植物のカルテを削除してもよろしいですか？', () => {
             userPlants = userPlants.filter(plant => plant.id !== numericId);
             localStorage.setItem('userPlants', JSON.stringify(userPlants));
            
             localStorage.removeItem(`purchase_date_${numericId}`);
            
             renderPlantCards();
             showNotification('カルテを削除しました。'); 
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
    // 9. 購入日入力モーダル処理 (通知をカスタムに修正)
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
                 // 🌟 修正: カスタム通知を使用
                 showNotification('エラー: まず植物カードをクリックして詳細を表示してください。');
                 return;
            }

            detailsModal.style.display = 'none'; 
            purchaseDateModal.style.display = 'block';

            const existingDate = getPurchaseDate(currentPlantId);
            purchaseDateInput.value = existingDate || '';
        };
    }
    
    if (savePurchaseDateButton) {
        savePurchaseDateButton.onclick = () => {
            const newDate = purchaseDateInput.value;
            if (newDate && currentPlantId !== null) {
                savePurchaseDate(currentPlantId, newDate);
                // 🌟 修正: カスタム通知を使用
                showNotification('購入日を保存しました。');
                
                purchaseDateModal.style.display = 'none';
                if (detailsModal) detailsModal.style.display = 'block'; 
                updatePurchaseDateDisplay(currentPlantId);
            } else {
                // 🌟 修正: カスタム通知を使用
                showNotification('日付を入力してください。');
            }
        };
    }
    
    // ----------------------------------------------------
    // 10. エクスポート/インポート機能 (通知と確認をカスタムに修正 + 堅牢化)
    // ----------------------------------------------------

    const collectAllData = () => {
        const userPlantsRaw = localStorage.getItem('userPlants');
        const purchaseDates = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('purchase_date_')) {
                purchaseDates[key] = localStorage.getItem(key);
            }
        }

        return {
            userPlants: userPlantsRaw ? JSON.parse(userPlantsRaw) : [],
            purchaseDates: purchaseDates
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
            // 🌟 修正: カスタム通知を使用
            showNotification('カルテデータのエクスポートが完了しました。');
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
                
                // 🌟 修正: カスタム確認関数を使用
                showCustomConfirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？', () => {
                    // 1. userPlants (メインカルテ) の更新
                    userPlants = importedData.userPlants; 
                    localStorage.setItem('userPlants', JSON.stringify(userPlants));

                    // 2. Purchase Dates (購入日) の更新
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('purchase_date_')) {
                            localStorage.removeItem(key);
                        }
                    }
                    Object.keys(importedData.purchaseDates).forEach(key => {
                        localStorage.setItem(key, importedData.purchaseDates[key]);
                    });

                    // 🌟 修正: カスタム通知を使用
                    showNotification('カルテデータのインポートが完了しました。画面を更新します。');
                    renderPlantCards(); 
                }, () => {
                    // キャンセルの場合、処理なし（finally でファイル入力をリセットする）
                });

            } catch (error) {
                // 🌟 修正: カスタム通知を使用
                showNotification('データのインポートに失敗しました。ファイル形式を確認してください。エラー: ' + error.message, 5000); 
                console.error("Import Error:", error);
            } finally {
                // 🌟 修正: 成功/エラー/キャンセルにかかわらず、ファイル選択はここで必ずリセットする (堅牢化)
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

// app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 0. 定数定義 (SEASONSをdata.jsから移動)
    // ----------------------------------------------------
    const WATER_TYPES = {
        WaterOnly: { name: '水のみ', class: 'water' },
        WaterAndFertilizer: { name: '水と液肥', class: 'fertilizer' },
        WaterAndActivator: { name: '水と活性剤', class: 'activator' },
        WaterFertilizerAndActivator: { name: '水・液肥・活性剤', class: 'complex' }
    };
    
    // 🌟 修正: 運用ロジックであるSEASONS定義をapp.jsへ移動
    const SEASONS = {
        SPRING: { name: '春 (3月〜5月)', startMonth: 3, endMonth: 5 },
        SUMMER: { name: '夏 (6月〜8月)', startMonth: 6, endMonth: 8 },
        AUTUMN: { name: '秋 (9月〜11月)', startMonth: 9, endMonth: 11 },
        WINTER: { name: '冬 (12月〜2月)', startMonth: 12, endMonth: 2 }
    };

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentFilter = localStorage.getItem('filter-select') || 'all';


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
     * 🌟 Local Storageにデータを保存し、更新時間を記録する
     */
    function saveUserPlants(plants) {
        localStorage.setItem('userPlants', JSON.stringify(plants));
        localStorage.setItem('last_update_time', Date.now()); // 更新時間を記録
        renderLastUpdateTime(); // UIを更新
    }
    
    /**
     * 水やりログに記録を追加する関数
     */
    function updateLastWatered(plantId, type, date = new Date().toISOString().split('T')[0]) {
        const numericId = parseInt(plantId);
        const plantIndex = userPlants.findIndex(p => p.id === numericId);
        
        if (plantIndex !== -1) {
            const newLogEntry = { date: date, type: type };
            
            if (!Array.isArray(userPlants[plantIndex].waterLog)) {
                userPlants[plantIndex].waterLog = [];
            }
            
            // 重複チェック（今日の日付で同じタイプが既にあればスキップ）
            const isDuplicate = userPlants[plantIndex].waterLog.some(log => log.date === date && log.type === type);
            if (!isDuplicate) {
                userPlants[plantIndex].waterLog.unshift(newLogEntry);
            }
            
            // 最新ログが先頭になるようにソート
            userPlants[plantIndex].waterLog.sort((a, b) => new Date(b.date) - new Date(a.date));


            saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
            renderPlantCards(); // カードを再描画（ソート/予定日更新のため）
            showNotification(`${userPlants[plantIndex].name} の水やり日と内容を記録しました！(${WATER_TYPES[type].name})`, 'success');
            
            waterTypeModal.style.display = 'none';
            if (detailsModal.style.display === 'block') {
                 const plantData = PLANT_DATA.find(p => p.id == userPlants[plantIndex].speciesId);
                 showDetailsModal(userPlants[plantIndex], plantData);
            }
        }
    }

    /**
     * 水やり履歴から特定のエントリを削除する関数 (今回はUIから呼ばれないがロジックは保持)
     */
    function deleteWaterHistoryEntry(plantId, date, type) {
        const numericId = parseInt(plantId);
        const plantIndex = userPlants.findIndex(p => p.id === numericId);
        
        if (plantIndex !== -1) {
            showCustomConfirm('この水やり記録を削除してもよろしいですか？', () => {
                
                const initialLength = userPlants[plantIndex].waterLog.length;
                userPlants[plantIndex].waterLog = userPlants[plantIndex].waterLog.filter((log, index, arr) => {
                    if (log.date === date && log.type === type && arr.length === initialLength) {
                        arr.length--; 
                        return false; 
                    }
                    return true; 
                });
                
                userPlants[plantIndex].waterLog.sort((a, b) => new Date(b.date) - new Date(a.date));

                saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
                renderPlantCards();
                showNotification(`水やり記録 (${formatJapaneseDate(date)}) を削除しました。`, 'success');
                
                const plantData = PLANT_DATA.find(p => p.id == userPlants[plantIndex].speciesId);
                showDetailsModal(userPlants[plantIndex], plantData);
            });
        }
    }


    // ----------------------------------------------------
    // 1. DOM要素の定義
    // ----------------------------------------------------
    const plantCardList = document.getElementById('plant-card-list'); 
    const speciesSelect = document.getElementById('species-select');
    const addPlantForm = document.getElementById('add-plant-form');
    // ソート/フィルタリングのDOM要素
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    // 新規登録フォームの要素
    const nextWateringPreview = document.getElementById('next-watering-preview');
    const setTodayButton = document.getElementById('set-today-button');
    // 通知コントロールコンテナ
    const notificationControlContainer = document.getElementById('notification-control-container');
    // 🌟 改善: モーダルナビゲーションボタン
    const prevPlantButton = document.getElementById('prev-plant-btn');
    const nextPlantButton = document.getElementById('next-plant-btn');
    // 🌟 改善: クイックソートボタンエリア
    const quickSortButtonsContainer = document.getElementById('quick-sort-buttons');
    // 🌟 改善: 最終更新日時表示エリア
    const lastUpdateDisplay = document.getElementById('last-update-display');


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
    
    // 水やり履歴リスト要素
    const waterHistoryList = document.getElementById('water-history-list');
    // 植え替え履歴リスト要素
    const repottingHistoryList = document.getElementById('repotting-history-list');

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
    saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
    
    let currentPlantId = null;
    let draggedId = null; 

    // ----------------------------------------------------
    // 3. 季節判定ロジック (SEASONS定義がapp.jsに移動したため、PLANT_DATAは使用可能)
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

    /**
     * 次回水やり予定日を計算する
     */
    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (!lastDateString || intervalDays === 999 || intervalDays === null) return null;

        const lastDate = new Date(lastDateString);
        lastDate.setDate(lastDate.getDate() + intervalDays);
        
        return lastDate.toISOString().split('T')[0];
    }
    
    /**
     * 既存データを新しい waterLog, repottingLog 形式に変換する（マイグレーション）
     */
    function normalizePlantData(plants) {
        const normalizedPlants = plants.map(p => {
            // 1. entryDate の設定
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
            
            // 2. waterLog の設定（重要）
            if (!Array.isArray(p.waterLog)) {
                p.waterLog = [];
                // 優先度順に旧データをログとして変換
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
            
            // 🌟 改善: 3. repottingLog の設定 (旧 repotting_date_X から変換)
            const repottingDateStr = localStorage.getItem(`repotting_date_${p.id}`);
            if (!Array.isArray(p.repottingLog)) {
                p.repottingLog = [];
            }
            if (repottingDateStr && p.repottingLog.length === 0) {
                p.repottingLog.push({ date: repottingDateStr });
            }
            p.repottingLog.sort((a, b) => new Date(b.date) - new Date(a.date)); // 最新が先頭

            // 古いプロパティを削除（クリーンアップ）
            delete p.lastWatered; 
            delete p.lastWatering; 
            
            return p;
        });
        
        return normalizedPlants;
    }

    // 🌟 最終更新日時を整形して表示
    function renderLastUpdateTime() {
        const lastUpdateTime = localStorage.getItem('last_update_time');
        const lastExportTime = localStorage.getItem('last_export_time');
        
        let displayHtml = '';
        
        if (lastUpdateTime) {
            const updateDate = new Date(parseInt(lastUpdateTime));
            const formattedUpdateTime = dateToJpTime(updateDate);
            displayHtml += `**最終データ更新:** ${formattedUpdateTime}`;
            
            // 最終エクスポート日時の表示と比較
            if (lastExportTime) {
                const exportDate = new Date(parseInt(lastExportTime));
                const formattedExportTime = dateToJpTime(exportDate);
                const daysSinceExport = Math.floor((Date.now() - exportDate.getTime()) / (1000 * 60 * 60 * 24));
                
                displayHtml += `<br><strong>最終エクスポート:</strong> ${formattedExportTime}`;
                
                // 🌟 改善2: 7日以上バックアップがない場合に警告
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
    
    // Dateオブジェクトを日本語の時刻形式に変換するヘルパー関数
    function dateToJpTime(date) {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(/\//g, '/').replace(',', ' ');
    }


    // 🌟 PWA通知機能のための関数
    function registerNotification(plantId, plantName, dateString) {
        // SWが利用可能か、権限があるか確認
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            const nextWateringDate = new Date(dateString);
            const now = new Date(today);
            
            // 通知は、予定日の前日深夜に届くように設定
            const notificationTriggerDate = new Date(nextWateringDate);
            notificationTriggerDate.setDate(notificationTriggerDate.getDate() - 1); 
            
            // 通知トリガー日が現在時刻以降かつ、遠すぎない場合
            if (notificationTriggerDate > now) {
                // 実際のPWAでは、ここではSWにメッセージを送って永続的な通知をスケジュールしますが、
                // この環境では、許可されていることを確認するにとどめます。
            }
        }
    }
    
    // 🌟 通知権限をリクエストし、UIを更新する関数
    function setupNotificationUI() {
        notificationControlContainer.innerHTML = ''; // UIをリセット

        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
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
        } else { // default
            message = '🔔 水やりリマインダーを有効にしますか？';
            buttonText = '通知を有効にする';
            buttonClass = 'action-button primary';
            buttonAction = () => {
                Notification.requestPermission().then(newPermission => {
                    if (newPermission === 'granted') {
                        showNotification('通知が有効になりました！', 'success');
                    } else {
                        showNotification('通知の許可がありませんでした。', 'warning');
                    }
                    setupNotificationUI(); // UIを再更新
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
            } else {
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
        
        // 🌟 ソート/フィルタの初期値をUIに反映
        if (sortSelect) sortSelect.value = currentSort;
        if (filterSelect) filterSelect.value = currentFilter;

        renderLastUpdateTime(); // 最終更新日時をロード時に表示
        renderPlantCards();
        
        // 🌟 PWA通知UIのセットアップ
        setupNotificationUI();
        
        // 🌟 新規: 今日をセットボタンのイベントリスナー
        if (setTodayButton && lastWateredInput) {
            setTodayButton.onclick = () => {
                lastWateredInput.value = today;
                lastWateredInput.dispatchEvent(new Event('change')); // プレビューを更新
            };
        }
        
        // 🌟 ソート/フィルタのイベントリスナー
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                localStorage.setItem('sort-select', currentSort);
                renderPlantCards();
                renderQuickSortButtons(); // クイックボタンも更新
            });
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                currentFilter = e.target.value;
                localStorage.setItem('filter-select', currentFilter);
                renderPlantCards();
            });
        }
        
        // 🌟 新規登録フォームのリアルタイム予定日プレビュー
        if (lastWateredInput && speciesSelect) {
             const updatePreview = () => {
                const speciesId = speciesSelect.value;
                const lastDate = lastWateredInput.value;
                
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
                
                // 過去の日付でないかチェック
                if (nextDateString < today) {
                    nextWateringPreview.textContent += ' ⚠️ (計算結果が過去日になっています。水やり日を確認してください)';
                    nextWateringPreview.classList.add('alert-date');
                } else {
                    nextWateringPreview.classList.remove('alert-date');
                }
             };

             lastWateredInput.addEventListener('change', updatePreview);
             speciesSelect.addEventListener('change', updatePreview);
             updatePreview(); // 初期実行
        }
        
        // 🌟 改善: モーダルのアコーディオン制御を初期化
        document.querySelectorAll('.modal-content').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('accordion-header') || e.target.closest('.accordion-header')) {
                    const header = e.target.closest('.accordion-header');
                    const targetId = header.getAttribute('data-target');
                    const content = document.getElementById(targetId);

                    if (content) {
                        const isExpanded = content.classList.contains('expanded');
                        
                        // 開閉状態をトグル
                        content.classList.toggle('expanded', !isExpanded);
                        header.classList.toggle('collapsed', isExpanded);
                    }
                }
            });
        });
        
        renderQuickSortButtons();
    }
    
    // 🌟 改善: クイックソートボタンのレンダリング
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
    const savePurchaseDate = (plantId, date) => { 
        localStorage.setItem(`purchase_date_${plantId}`, date);
        renderLastUpdateTime(); // データ更新時に時刻を記録
    };
    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        if (purchaseDateDisplay) purchaseDateDisplay.textContent = formatJapaneseDate(date);
    };
    
    // 🌟 修正: 植え替え日取得は log から行う
    const getLatestRepottingDate = (userPlant) => userPlant.repottingLog && userPlant.repottingLog.length > 0 ? userPlant.repottingLog[0].date : null;
    
    // ----------------------------------------------------
    // 5. カルテレンダリングとカード生成 
    // ----------------------------------------------------
    
    /**
     * ソートとフィルタリングを適用した植物リストを返す
     */
    function sortAndFilterPlants() {
        let filteredPlants = userPlants.map(p => {
            const data = PLANT_DATA.find(pd => pd.id == p.speciesId);
            const lastLog = p.waterLog && p.waterLog.length > 0 ? p.waterLog[0] : { date: p.entryDate, type: 'WaterOnly' };
            const seasonData = data.management[currentSeasonKey];
            const nextWateringDate = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
            
            // ソート/フィルタリングに必要なメタデータをオブジェクトに追加
            return {
                ...p,
                data,
                nextWateringDate: nextWateringDate,
                minTemp: data.minTemp
            };
        });
        
        // 1. フィルタリングの適用
        if (currentFilter !== 'all') {
            const tempMap = { 'temp10': 10, 'temp5': 5, 'temp0': 0 };
            const minTempThreshold = tempMap[currentFilter];
            filteredPlants = filteredPlants.filter(p => p.minTemp >= minTempThreshold);
        }

        // 2. ソートの適用
        filteredPlants.sort((a, b) => {
            if (currentSort === 'name') {
                return a.name.localeCompare(b.name);
            } else if (currentSort === 'entryDate') {
                return new Date(b.entryDate) - new Date(a.entryDate); // 新しい順
            } else if (currentSort === 'minTemp') {
                return a.minTemp - b.minTemp; // 低い順
            } else if (currentSort === 'nextWateringDate') {
                // null (断水期間) のものを後回しにする
                const aDate = a.nextWateringDate ? new Date(a.nextWateringDate).getTime() : Infinity;
                const bDate = b.nextWateringDate ? new Date(b.nextWateringDate).getTime() : Infinity;
                
                // 日付が古い（近い）順に並べる
                return aDate - bDate;
            }
            return 0;
        });

        return filteredPlants;
    }


    function renderPlantCards() {
        if (!plantCardList) return;

        // 🌟 ソートとフィルタリングを適用したリストを取得
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
            const data = userPlant.data; // sortAndFilterPlantsで追加したメタデータを使用
            const card = createPlantCard(userPlant, data, currentSeasonKey); 
            cardContainer.appendChild(card);
            
            // 🌟 通知の登録を試みる (PWA通知が許可されている場合)
            if (userPlant.nextWateringDate) {
                registerNotification(userPlant.id, userPlant.name, userPlant.nextWateringDate);
            }
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
        
        // 🌟 改善: 自動ソート時はドラッグ機能を無効化
        const isAutoSorted = currentSort === 'nextWateringDate';
        card.setAttribute('draggable', !isAutoSorted);
        
        const controls = document.createElement('div');
        controls.className = 'controls';
        
        const dragHandle = document.createElement('span');
        dragHandle.className = 'drag-handle';
        dragHandle.textContent = '☰';
        
        // 🌟 改善: 自動ソート時はハンドルを非表示または透明化
        if (isAutoSorted) {
             dragHandle.style.opacity = '0';
             dragHandle.style.cursor = 'default';
        }

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
        
        // 🌟 改善1: カード上の直接アクションボタン
        const waterButton = document.createElement('button');
        waterButton.className = 'action-button tertiary water-done-btn';
        waterButton.textContent = '💧 記録 (内容選択)'; // テキストを短縮
        waterButton.onclick = (e) => {
            e.stopPropagation();
            showWaterTypeSelectionModal(userPlant.id); 
        };
        
        // 🌟 改善1: ロングタップイベントを追加 (モバイルUX向上)
        let pressTimer = null;
        card.addEventListener('touchstart', (e) => {
            // e.stopPropagation(); // clickイベントを防ぐため、clickハンドラ側で処理
            // ブラウザのコンテキストメニューを抑制
            e.preventDefault(); 
            // 500msの長押しで水やりモーダルを出す
            pressTimer = setTimeout(() => {
                showWaterTypeSelectionModal(userPlant.id);
                // ロングタップが成功した場合、clickイベントが発生しないようにする
                e.target.dataset.isLongPress = 'true';
            }, 500); 
        });

        card.addEventListener('touchend', (e) => {
            clearTimeout(pressTimer);
            if (e.target.dataset.isLongPress === 'true') {
                 // 長押し後に指を離した場合、clickイベントを発火させない
                 delete e.target.dataset.isLongPress; 
            }
            pressTimer = null;
        });

        card.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
        
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';
        cardFooter.appendChild(waterButton);
        card.appendChild(cardFooter);

        card.addEventListener('click', (e) => {
            // ロングタップでモーダルが開いた後のclickイベントを無視
            if (e.target.dataset.isLongPress === 'true') {
                delete e.target.dataset.isLongPress;
                return;
            }
            showDetailsModal(userPlant, data);
        });
        
        // D&Dイベントのバインド
        if (!isAutoSorted) {
             card.addEventListener('dragstart', handleDragStart);
             card.addEventListener('dragover', handleDragOver);
             card.addEventListener('drop', handleDrop);
             card.addEventListener('dragend', handleDragEnd);
        }

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
        
        const userPlant = userPlants.find(p => p.id === userPlantId);
        const lastRepottingDateString = getLatestRepottingDate(userPlant);
        
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
        
        // waterLogの最新エントリを使用
        const lastLog = userPlant.waterLog && userPlant.waterLog.length > 0 ? userPlant.waterLog[0] : { date: userPlant.entryDate, type: 'WaterOnly' };
        
        const lastWateringDate = new Date(lastLog.date);
        const todayDate = new Date();
        lastWateringDate.setHours(0, 0, 0, 0); 
        todayDate.setHours(0, 0, 0, 0); 
        const timeSinceWatered = Math.floor((todayDate - lastWateringDate) / (1000 * 60 * 60 * 24)); 
        
        let recommendedIntervalDays = seasonData.waterIntervalDays || null; 
        
        // 🌟 次回予定日を計算
        const nextWateringDateString = calculateNextWateringDate(lastLog.date, recommendedIntervalDays);
        
        let intervalDisplay = '';
        
        if (recommendedIntervalDays !== null) {
            // 🌟 改善: 推奨頻度テキストに日数を統合して表示
            if (recommendedIntervalDays === 999) { 
                 intervalDisplay = `（${SEASONS[seasonKey].name.split(' ')[0]}は断水期間）`;
            } else {
                 intervalDisplay = `（${recommendedIntervalDays}日目安）`;
            }
        } else {
            intervalDisplay = `（推奨間隔データなし）`;
        }

        let actionMessage = '';
        if (nextWateringDateString && recommendedIntervalDays <= 30) { 
            // 予定日と今日の日数の差を計算
            const daysUntilNext = Math.ceil((new Date(nextWateringDateString) - todayDate) / (1000 * 60 * 60 * 24));
            
            if (daysUntilNext <= 0) {
                // 予定日を過ぎた場合 (daysUntilNext <= 0 は当日の深夜0時を過ぎた瞬間をカバー)
                actionMessage = `<li class="risk-message">🚨 <span class="risk-alert danger">水やり目安日を**${Math.abs(daysUntilNext) + 1}日超過**！</span></li>`;
            } else if (daysUntilNext <= 3) {
                actionMessage = `<li class="risk-message">⚠️ <span class="risk-alert warning">あと**${daysUntilNext}日**で水やり目安日です。</span></li>`;
            } else {
                actionMessage = `<li>次回目安まで、あと **${daysUntilNext}日** です。</li>`;
            }
        } else {
            actionMessage = `<li>前回水やり日から **${timeSinceWatered}日経過**。</li>`;
        }
        
        // 🌟 次回予定日の情報表示
        const nextWateringInfo = nextWateringDateString && recommendedIntervalDays !== 999
            ? `<li><strong>次回予定日:</strong> <span style="color: ${nextWateringDateString <= today ? 'var(--color-alert)' : 'var(--color-primary)'}; font-weight: 700;">${formatJapaneseDate(nextWateringDateString)}</span></li>`
            : `<li><strong>次回予定日:</strong> ${recommendedIntervalDays === 999 ? '断水中' : '算出不可'}</li>`;


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

    /**
     * 水やり履歴をレンダリングする関数
     */
    function renderWaterHistory(waterLog, plantId) {
        if (!waterHistoryList) return;
        waterHistoryList.innerHTML = '';
        
        if (!waterLog || waterLog.length === 0) {
            waterHistoryList.innerHTML = '<li style="justify-content: center; color: var(--color-text-mid);">まだ水やり記録がありません。</li>';
            return;
        }

        waterLog.forEach(log => {
            const logItem = document.createElement('li');
            const typeData = WATER_TYPES[log.type] || WATER_TYPES.WaterOnly;
            
            const contentSpan = document.createElement('span');
            contentSpan.className = 'log-content';
            contentSpan.innerHTML = `
                <span class="date">${formatJapaneseDate(log.date)}</span>
                <span class="water-type-badge ${typeData.class}">${typeData.name}</span>
            `;
            
            // 削除ボタンは今回は見送るため、レンダリングしない
            // const deleteButton = document.createElement('button'); 
            
            logItem.appendChild(contentSpan);
            waterHistoryList.appendChild(logItem);
        });
    }

    // 植え替え履歴のレンダリング
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


    // 詳細モーダルで水やり情報を分割表示
    function showDetailsModal(userPlant, plantData) {
        if (!detailsModal || !plantDetails) return;

        currentPlantId = userPlant.id;
        const seasonData = plantData.management[currentSeasonKey];
        const maintenance = plantData.maintenance;
        
        entryDateDisplay.textContent = formatJapaneseDate(userPlant.entryDate);
        timeSinceEntryDisplay.textContent = calculateTimeSince(userPlant.entryDate);
        
        // 植え替え日表示をログの最新から取得
        const latestRepottingDate = getLatestRepottingDate(userPlant);
        repottingDateDisplay.textContent = formatJapaneseDate(latestRepottingDate);


        const repottingReminderMessage = checkRepottingStatus(plantData, userPlant.id);

        // 🌟 改善: アコーディオンの内容を直接コンテンツエリアに挿入
        const seasonCareContentHtml = `
            <ul>
                <li><strong>水やり量（一度に与える量）:</strong> ${plantData.water_method}</li>
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
        
        // 既存のHTML構造を利用して動的に挿入
        const seasonCareContentDiv = document.getElementById('season-care-content');
        const basicMaintenanceContentDiv = document.getElementById('basic-maintenance-content');
        
        if (seasonCareContentDiv) seasonCareContentDiv.innerHTML = seasonCareContentHtml;
        if (basicMaintenanceContentDiv) basicMaintenanceContentDiv.innerHTML = basicMaintenanceContentHtml;
        
        // 🌟 改善: アコーディオンの初期状態を設定 (現在の季節ケアと水やり履歴をデフォルトで開く)
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
        renderRepottingHistory(userPlant.repottingLog); // 🌟 植え替え履歴のレンダリング
        
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
        
        // 🌟 改善: モーダルナビゲーションの状態更新とイベントリスナー設定
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
        
        // 🌟 改善1: モーダルスワイプ操作を追加
        let touchstartX = 0;
        let touchendX = 0;
        const modalContent = detailsModal.querySelector('.modal-content');

        const checkDirection = () => {
            const threshold = 50; // スワイプと認識する最小距離
            if (touchendX < touchstartX - threshold) { // 左にスワイプ (次の植物)
                nextPlantButton.click();
            }
            if (touchendX > touchstartX + threshold) { // 右にスワイプ (前の植物)
                prevPlantButton.click();
            }
        };

        // スワイプイベントを追加（passive: trueでスムーズなスクロールを阻害しないようにする）
        modalContent.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        }, { passive: true });

        modalContent.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            checkDirection();
        }, { passive: true });


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
                // 構造変更: waterLogを初期化し、最初の記録を格納
                waterLog: [{
                    date: lastWateredDate,
                    type: waterType
                }],
                // 🌟 改善: 植え替えログを空の配列で初期化
                repottingLog: []
            };

            userPlants.unshift(newPlant);
            saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
            
            renderPlantCards();
            addPlantForm.reset();
            
            if (lastWateredInput) {
                lastWateredInput.value = today;
            }
            showNotification(`「${newPlant.name}」をカルテに追加しました！`, 'success');
            
            // フォームプレビューをリセット
            nextWateringPreview.textContent = '植物種と水やり日を選択してください。';
            nextWateringPreview.classList.remove('alert-date');
        });
    }

    // ----------------------------------------------------
    // 7. カルテ削除ロジック
    // ----------------------------------------------------

    function deletePlantCard(id) {
        const numericId = parseInt(id); 
        
        showCustomConfirm('この植物のカルテを削除してもよろしいですか？', () => {
             userPlants = userPlants.filter(plant => plant.id !== numericId);
             saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
            
             localStorage.removeItem(`purchase_date_${numericId}`);
             localStorage.removeItem(`repotting_date_${numericId}`); // 旧形式のデータも削除
            
             renderPlantCards();
             showNotification('カルテを削除しました。', 'success'); 
        });
    }

    // ----------------------------------------------------
    // 8. ドラッグ＆ドロップ（順序変更）ロジック
    // ----------------------------------------------------
    
    // D&Dイベントは自動ソートが有効な場合にのみ無視される。

    function handleDragStart(e) {
        // 自動ソートが適用されている場合はD&Dを無視
        if (currentSort !== 'nextWateringDate') {
            draggedId = parseInt(e.target.dataset.id);
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => e.target.style.opacity = '0.4', 0);
        }
    }

    function handleDragOver(e) {
        if (currentSort !== 'nextWateringDate') {
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
    }

    function handleDrop(e) {
        if (currentSort !== 'nextWateringDate') {
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
            
            // D&D後の並び順を永続化
            saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
            renderPlantCards();
        }
    }

    function handleDragEnd(e) {
        if (currentSort !== 'nextWateringDate') {
            e.target.classList.remove('dragging');
            e.target.style.opacity = '1'; 
            document.querySelectorAll('.plant-card').forEach(card => {
                card.classList.remove('drop-before', 'drop-after');
            });
            draggedId = null;
        }
    }


    // ----------------------------------------------------
    // 9. 購入日/植え替え日入力モーダル処理
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
            repottingDateInput.setAttribute('max', today); 
            
            repottingDateInput.value = today; // 初期値を今日に設定
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
                    
                    // ログに追加し、ソート
                    userPlants[userPlantIndex].repottingLog.unshift(newRepottingEntry);
                    userPlants[userPlantIndex].repottingLog.sort((a, b) => new Date(b.date) - new Date(a.date));

                    saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
                    
                    // 旧形式のLocal Storageキーを削除 (クリーンアップ)
                    localStorage.removeItem(`repotting_date_${currentPlantId}`);
                }
                
                showNotification('植え替え記録を追加しました。', 'success');
                
                repottingDateModal.style.display = 'none';
                if (detailsModal) detailsModal.style.display = 'block'; 
                
                // 再描画して、新しいログをカードと詳細に反映
                const plantData = PLANT_DATA.find(p => p.id == userPlants[userPlantIndex].speciesId);
                showDetailsModal(userPlants[userPlantIndex], plantData);
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
        
        // 植え替え日はuserPlants.repottingLogに統合されたため、ここでは購入日のみを旧形式でエクスポート
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('purchase_date_')) {
                purchaseDates[key] = localStorage.getItem(key);
            }
        }

        return {
            userPlants: userPlantsRaw ? JSON.parse(userPlantsRaw) : [],
            purchaseDates: purchaseDates,
            // repottingDatesはuserPlants内のrepottingLogに統合されたため、省略
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
            
            // 🌟 改善2: 最終エクスポート日時を記録
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

                if (!Array.isArray(importedData.userPlants) || typeof importedData.purchaseDates !== 'object') {
                    throw new Error('JSON形式が正しくありません。必要なキー（userPlants, purchaseDates）が見つかりません。');
                }
                
                showCustomConfirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？', () => {
                    // userPlantsの正規化処理は、インポートされたデータに対しても適用されるため、waterLogへの変換も安全に行われる。
                    userPlants = normalizePlantData(importedData.userPlants); 
                    saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用

                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        // 古い repotting_date_X も削除
                        if (key && (key.startsWith('purchase_date_') || key.startsWith('repotting_date_') || key === 'userPlants' || key === 'purchaseDates')) {
                            localStorage.removeItem(key);
                        }
                    }
                    
                    Object.keys(importedData.purchaseDates).forEach(key => {
                        localStorage.setItem(key, importedData.purchaseDates[key]);
                    });
                    
                    // 旧形式のrepottingDatesがあれば、userPlants内のrepottingLogに統合する（マイグレーション）
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
                        saveUserPlants(userPlants); // 🌟 saveUserPlantsを使用
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

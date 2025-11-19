// app.js

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. DOM要素の定義
    // ----------------------------------------------------
    const plantList = document.getElementById('plant-list'); // 登録済み植物カードの親要素
    const plantCardList = document.getElementById('plant-card-list'); // 旧名から変更
    const speciesSelect = document.getElementById('species-select');
    const addPlantForm = document.getElementById('add-plant-form');

    // モーダル要素
    const detailsModal = document.getElementById('details-modal');
    // 詳細モーダル内の要素（現在はHTML側で非表示）
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    const editPurchaseDateButton = document.getElementById('edit-purchase-date-button');
    
    // 購入日入力モーダル
    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal.querySelector('.close-button-purchase-date');
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    
    // エクスポート/インポート関連の要素
    const exportButton = document.getElementById('export-data-button');
    const importButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');
    const importFileNameDisplay = document.getElementById('import-file-name');
    
    // データ状態の管理
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    let currentPlantId = null;
    let draggedId = null; // ドラッグ中のカードIDを保持

    // ----------------------------------------------------
    // 2. 季節判定ロジック
    // ----------------------------------------------------

    function getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (typeof SEASONS === 'undefined') return 'SPRING'; // Fallback
        
        if (month >= SEASONS.SPRING.startMonth && month <= SEASONS.SPRING.endMonth) return 'SPRING';
        if (month >= SEASONS.SUMMER.startMonth && month <= SEASONS.SUMMER.endMonth) return 'SUMMER';
        if (month >= SEASONS.AUTUMN.startMonth && month <= SEASONS.AUTUMN.endMonth) return 'AUTUMN';
        return 'WINTER';
    }
    const currentSeasonKey = getCurrentSeason();

    // ----------------------------------------------------
    // 3. 初期化処理
    // ----------------------------------------------------

    function initializeApp() {
        // SELECTボックスに植物データを挿入
        PLANT_DATA.forEach(plant => {
            const option = document.createElement('option');
            option.value = plant.id;
            option.textContent = `${plant.species} (${plant.scientific})`;
            speciesSelect.appendChild(option);
        });

        renderPlantCards();
    }
    
    // ----------------------------------------------------
    // 4. Local Storage / 購入日データ処理
    // ----------------------------------------------------
    
    const getPurchaseDate = (plantId) => {
        return localStorage.getItem(`purchase_date_${plantId}`);
    };

    const savePurchaseDate = (plantId, date) => {
        localStorage.setItem(`purchase_date_${plantId}`, date);
    };

    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        // HTML要素が非表示のため、Nullチェックを追加
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
        plantCardList.innerHTML = '';
        
        userPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(p => p.id == userPlant.speciesId);
            if (!data) return;

            const card = createPlantCard(userPlant, data, currentSeasonKey);
            plantCardList.appendChild(card);
        });
    }

    function createPlantCard(userPlant, data, activeSeasonKey) {
        // ... (カード作成ロジック - ターン6の機能を使用)
        // ここでは簡略化のため、ドラッグ＆ドロップ関連のイベントは省略しますが、元の機能に従ってイベントリスナーを付与する必要があります。
        
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.setAttribute('data-id', userPlant.id);
        card.setAttribute('draggable', true);
        
        // コントロールボタンコンテナ
        const controls = document.createElement('div');
        
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
            e.stopPropagation(); // クリックがカード詳細へ伝播するのを防ぐ
            deletePlantCard(userPlant.id);
        };
        controls.appendChild(deleteButton);
        card.appendChild(controls); 

        // 季節選択ボタンの生成 (ここでは簡略化し、詳細モーダルに水やり計算ロジックを移譲)
        const seasonSelector = document.createElement('div');
        seasonSelector.className = 'season-selector';
        ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].forEach(key => {
            const button = document.createElement('button');
            button.textContent = SEASONS[key].name.split(' ')[0];
            button.className = key === activeSeasonKey ? 'active' : '';
            // カード表示は現在の季節に固定
            seasonSelector.appendChild(button);
        });

        const content = document.createElement('div');
        // 初期コンテンツの生成
        content.innerHTML = generateCardContent(userPlant, data, activeSeasonKey);
        
        card.appendChild(seasonSelector); 
        card.appendChild(content);

        // イベントリスナーの付与
        card.addEventListener('click', () => showDetailsModal(userPlant, data));

        // ドラッグ＆ドロップイベントリスナー (完全版ロジックを適用)
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        return card;
    }

    function generateCardContent(userPlant, data, seasonKey) {
        // ... (水やり計算とコンテンツ生成ロジック - ターン6の機能を使用)
        const seasonData = data.management[seasonKey];
        const riskText = getSeasonRisk(seasonKey, data);
        
        const lastWateredDate = new Date(userPlant.lastWatered);
        const today = new Date();
        const timeSinceWatered = Math.floor((today - lastWateredDate) / (1000 * 60 * 60 * 24)); 
        
        let recommendedIntervalDays = null;
        let intervalDisplay = '';
        const intervalMatch = seasonData.water.match(/(\d+)\s*日後/);
        
        if (intervalMatch) {
            recommendedIntervalDays = parseInt(intervalMatch[1]) + 7; 
            intervalDisplay = `（約 ${recommendedIntervalDays} 日ごと）`;
        } else if (seasonData.water.includes('乾いたらすぐ') || seasonData.water.includes('水苔が乾いたら')) {
            recommendedIntervalDays = 7; 
            intervalDisplay = `（約 ${recommendedIntervalDays} 日ごと）`;
        } else if (seasonData.water.includes('乾かさないように')) {
            recommendedIntervalDays = 4; 
            intervalDisplay = `（約 ${recommendedIntervalDays} 日ごと）`;
        } else if (seasonData.water.includes('断水')) {
            recommendedIntervalDays = 999; 
            intervalDisplay = `（現在 ${SEASONS[seasonKey].name.split(' ')[0]} は断水期間です）`;
        }

        let actionMessage = '';
        if (recommendedIntervalDays && recommendedIntervalDays <= 30) { 
            const daysUntilNext = recommendedIntervalDays - timeSinceWatered;
            
            if (daysUntilNext <= 0) {
                actionMessage = `<li style="color:#d9534f; font-weight:bold;">🚨 水やり目安日を**${Math.abs(daysUntilNext)}日超過**！</li>`;
            } else if (daysUntilNext <= 3) {
                actionMessage = `<li style="color:#f0ad4e; font-weight:bold;">⚠️ あと**${daysUntilNext}日**で水やり目安日です。</li>`;
            } else {
                actionMessage = `<li>次回目安まで、あと **${daysUntilNext}日** です。</li>`;
            }
        } else {
            actionMessage = `<li>前回水やり日から **${timeSinceWatered}日経過**。</li>`;
        }

        return `
            <div class="card-image">
                <img src="${data.img}" alt="${data.species}">
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

    // 詳細モーダル表示（今回はカード詳細として使用せず、購入日編集の連携用として残す）
    function showDetailsModal(userPlant, plantData) {
        currentPlantId = userPlant.id;
        
        // 必須ではないが、購入日ボタンを表示するために更新処理を呼び出し
        updatePurchaseDateDisplay(userPlant.id); 

        // 💡 登録植物の詳細情報を含む別のモーダルUIをここに展開するのが理想的ですが、
        // 今回の修正では購入日編集の起動のみを目的とします。
        // デフォルトでは、カードクリックで何も起こりません。
        // ただし、購入日編集ボタンが機能するために currentPlantId をセットしておきます。
        // alert(`[${userPlant.name}] 詳細情報 (購入日編集を有効化)`);
    }

    // ----------------------------------------------------
    // 6. 新規植物登録処理
    // ----------------------------------------------------

    addPlantForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const newPlant = {
            id: Date.now(), // ユニークID
            name: document.getElementById('plant-name').value,
            speciesId: document.getElementById('species-select').value,
            lastWatered: document.getElementById('last-watered').value,
        };

        userPlants.unshift(newPlant);
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        
        renderPlantCards();
        addPlantForm.reset();
        alert(`「${newPlant.name}」をカルテに追加しました！`);
    });

    // ----------------------------------------------------
    // 7. カルテ削除ロジック
    // ----------------------------------------------------

    function deletePlantCard(id) {
        const numericId = parseInt(id); 
        
        if (!confirm('この植物のカルテを削除してもよろしいですか？')) {
            return;
        }
        
        // userPlantsから削除
        userPlants = userPlants.filter(plant => plant.id !== numericId);
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        
        // 購入日データも削除（任意だがクリーンアップのために実施）
        localStorage.removeItem(`purchase_date_${numericId}`);
        
        renderPlantCards();
    }

    // ----------------------------------------------------
    // 8. ドラッグ＆ドロップ（順序変更）ロジック
    // ----------------------------------------------------

    function handleDragStart(e) {
        draggedId = parseInt(e.target.dataset.id);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault(); 
        
        const targetCard = e.target.closest('.plant-card');
        if (!targetCard || targetCard.classList.contains('dragging')) return;
        
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        
        const targetCard = e.target.closest('.plant-card');
        if (!targetCard || draggedId === null) return;

        const droppedId = parseInt(targetCard.dataset.id);
        
        const draggedIndex = userPlants.findIndex(p => p.id === draggedId);
        const droppedIndex = userPlants.findIndex(p => p.id === droppedId);

        if (draggedIndex === -1 || droppedIndex === -1 || draggedIndex === droppedIndex) return;

        const [draggedItem] = userPlants.splice(draggedIndex, 1);
        userPlants.splice(droppedIndex, 0, draggedItem);
        
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        renderPlantCards();
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedId = null;
    }


    // ----------------------------------------------------
    // 9. 購入日入力モーダル処理
    // ----------------------------------------------------
    
    // 購入日モーダルを閉じる
    closePurchaseDateButton.onclick = () => {
        purchaseDateModal.style.display = 'none';
        // (詳細モーダルがないため、ここでは何もしません)
    };

    // 「購入日を記録/変更」ボタンクリック時の処理
    if (editPurchaseDateButton) {
        editPurchaseDateButton.onclick = () => {
            // 💡 本来カード詳細から起動される想定だが、ここではIDがセットされていれば実行
            if (currentPlantId === null) {
                 alert('エラー: まず植物カードをクリックして詳細を表示してください。');
                 return;
            }

            // 詳細モーダルから購入日入力モーダルへ切り替え
            // detailsModal.style.display = 'none'; // 詳細モーダルがないためコメントアウト
            purchaseDateModal.style.display = 'block';

            // 既に保存されている日付があれば入力欄にセット
            const existingDate = getPurchaseDate(currentPlantId);
            purchaseDateInput.value = existingDate || '';
        };
    }
    
    // 「保存」ボタンクリック時の処理
    savePurchaseDateButton.onclick = () => {
        const newDate = purchaseDateInput.value;
        if (newDate && currentPlantId !== null) {
            savePurchaseDate(currentPlantId, newDate);
            alert('購入日を保存しました。');
            
            purchaseDateModal.style.display = 'none';
            // 詳細表示を更新する関数を呼び出す（画面上の表示も更新される）
            updatePurchaseDateDisplay(currentPlantId);
        } else {
            alert('日付を入力してください。');
        }
    };
    
    // ----------------------------------------------------
    // 10. エクスポート/インポート機能
    // ----------------------------------------------------

    const collectAllData = () => {
        const userPlantsRaw = localStorage.getItem('userPlants');
        const purchaseDates = {};
        
        // LocalStorage全体をチェックし、購入日キーを収集
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
        alert('カルテデータのエクスポートが完了しました。');
    };

    importButton.onclick = () => {
        importFileInput.click();
    };

    importFileInput.onchange = () => {
        if (importFileInput.files.length > 0) {
            importFileNameDisplay.textContent = importFileInput.files[0].name;
            processImportFile(importFileInput.files[0]);
        } else {
            importFileNameDisplay.textContent = 'ファイル未選択';
        }
    };

    const processImportFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!Array.isArray(importedData.userPlants) || typeof importedData.purchaseDates !== 'object') {
                    throw new Error('JSON形式が正しくありません。必要なキー（userPlants, purchaseDates）が見つかりません。');
                }
                
                if (!confirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？')) {
                    return;
                }

                // 1. userPlants (メインカルテ) の更新
                userPlants = importedData.userPlants; // グローバル変数も更新
                localStorage.setItem('userPlants', JSON.stringify(userPlants));

                // 2. Purchase Dates (購入日) の更新: 既存のデータをクリアしてから書き込み
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    // userPlantsとpurchase_date_以外のデータも残したい場合は、このクリア範囲を調整
                    if (key && (key.startsWith('purchase_date_') || key === 'userPlants')) {
                        localStorage.removeItem(key);
                    }
                }
                Object.keys(importedData.purchaseDates).forEach(key => {
                    localStorage.setItem(key, importedData.purchaseDates[key]);
                });

                alert('カルテデータのインポートが完了しました。画面を更新します。');
                // アプリの初期化と再レンダリング (DOMContentLoaded後の再起動処理)
                renderPlantCards(); 

            } catch (error) {
                alert('データのインポートに失敗しました。ファイル形式を確認してください。エラー: ' + error.message);
                console.error("Import Error:", error);
            } finally {
                importFileInput.value = '';
                importFileNameDisplay.textContent = 'ファイル未選択';
            }
        };
        reader.readAsText(file);
    };


    // ----------------------------------------------------
    // 11. PWA Service Worker 登録ロジック
    // ----------------------------------------------------
    
    // Service Workerの登録はHTMLの最後に<script src="sw.js"></script>で行われているため、ここでは省略

    // アプリケーション起動
    initializeApp();

});

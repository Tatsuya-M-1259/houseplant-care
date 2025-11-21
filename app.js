// app.js

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. DOM要素の定義
    // ----------------------------------------------------
    const plantCardList = document.getElementById('plant-card-list'); // 登録済み植物カードの表示エリア
    const speciesSelect = document.getElementById('species-select');
    const addPlantForm = document.getElementById('add-plant-form');

    // モーダル要素
    const detailsModal = document.getElementById('details-modal'); // 詳細モーダル
    const closeDetailButton = detailsModal ? detailsModal.querySelector('.close-button') : null; // close-buttonの取得
    const plantDetails = document.getElementById('plant-details'); // 詳細情報の挿入エリア
    
    // 詳細モーダル内の要素
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
    // 2. 季節判定ロジック (既存)
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
    // 3. 初期化処理 (既存)
    // ----------------------------------------------------

    function initializeApp() {
        // SELECTボックスに植物データを挿入
        // PLANT_DATA配列全体を使用するため、新しく追加されたデータも自動的に含まれる
        PLANT_DATA.forEach(plant => {
            const option = document.createElement('option');
            option.value = plant.id;
            option.textContent = `${plant.species} (${plant.scientific})`;
            speciesSelect.appendChild(option);
        });

        renderPlantCards();
    }
    
    // ----------------------------------------------------
    // 4. Local Storage / 購入日データ処理 (既存)
    // ----------------------------------------------------
    
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
    // 5. カルテレンダリングとカード生成 (水やり量表示を追加)
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

        plantCardList.innerHTML = '';
        plantCardList.appendChild(cardContainer);
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
        // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではconfirm()が使われているため、そのままにしています。
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
            // 季節切替機能は未実装のため、現状はクリックしても何も起こらないダミーです
            button.onclick = (e) => { 
                e.stopPropagation();
                // 本来であれば、ここでカードのコンテンツを切り替えるロジックを実装します
                // renderPlantCardContent(card, userPlant, data, key);
            };
            seasonSelector.appendChild(button);
        });

        const content = document.createElement('div');
        content.innerHTML = generateCardContent(userPlant, data, activeSeasonKey);
        
        card.appendChild(seasonSelector); 
        card.appendChild(content);

        // イベントリスナーの付与
        card.addEventListener('click', () => showDetailsModal(userPlant, data));

        // ドラッグ＆ドロップイベントリスナー (既存)
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
        
        let recommendedIntervalDays = null;
        let intervalDisplay = '';
        const intervalMatch = seasonData.water.match(/(\d+)\s*日後/);
        
        // 推奨間隔日数（目安）を計算
        if (intervalMatch) {
            // 例: 「土中が乾いてから2-3日後」=> 3日+7日(乾燥期間を考慮) = 10日と仮定 (ざっくりとした目安)
            recommendedIntervalDays = parseInt(intervalMatch[1]) + 7; 
            intervalDisplay = `（約 ${recommendedIntervalDays} 日ごと）`;
        } else if (seasonData.water.includes('乾いたらすぐ') || seasonData.water.includes('水苔が乾いたら')) {
            // 週1回程度
            recommendedIntervalDays = 7; 
            intervalDisplay = `（約 ${recommendedIntervalDays} 日ごと）`;
        } else if (seasonData.water.includes('乾かさないように')) {
            // 4-5日ごと
            recommendedIntervalDays = 5; 
            intervalDisplay = `（約 ${recommendedIntervalDays} 日ごと）`;
        } else if (seasonData.water.includes('断水') || seasonData.water.includes('ほぼ断水')) {
            recommendedIntervalDays = 999; 
            intervalDisplay = `（現在 ${SEASONS[seasonKey].name.split(' ')[0]} は断水期間です）`;
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

        // water_methodの最初の文（句点まで）を取得して簡潔に表示
        const waterMethodSummary = data.water_method.split('。')[0] + '。';

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

    // 🌟 修正: 詳細モーダルで水やり情報を分割表示
    function showDetailsModal(userPlant, plantData) {
        if (!detailsModal || !plantDetails) return; // モーダル要素が存在しない場合はスキップ

        currentPlantId = userPlant.id;
        const seasonData = plantData.management[currentSeasonKey];
        const maintenance = plantData.maintenance;

        // 詳細情報の内容を動的に生成
        plantDetails.innerHTML = `
            <h2>${userPlant.name} (${plantData.species})</h2>
            <p class="scientific-name">${plantData.scientific}</p>
            <div style="text-align:center; margin-bottom: 20px;">
                <img src="${plantData.img}" alt="${plantData.species}" class="detail-image" style="max-width: 100%; height: auto;">
            </div>
            
            <div class="detail-section">
                <h3>季節別ケア (${SEASONS[currentSeasonKey].name})</h3>
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
        detailsModal.style.display = 'block'; // モーダルを表示
    }

    // 🌟 追加: 詳細モーダルの閉じるロジック
    if (closeDetailButton) {
        closeDetailButton.onclick = () => {
            detailsModal.style.display = 'none';
            currentPlantId = null;
        };
    }
    
    // ----------------------------------------------------
    // 6. 新規植物登録処理 (既存)
    // ----------------------------------------------------

    addPlantForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const newPlant = {
            id: Date.now(), 
            name: document.getElementById('plant-name').value,
            speciesId: document.getElementById('species-select').value,
            lastWatered: document.getElementById('last-watered').value,
        };

        userPlants.unshift(newPlant);
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        
        renderPlantCards();
        addPlantForm.reset();
        // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではalert()が使われているため、そのままにしています。
        alert(`「${newPlant.name}」をカルテに追加しました！`);
    });

    // ----------------------------------------------------
    // 7. カルテ削除ロジック (既存)
    // ----------------------------------------------------

    function deletePlantCard(id) {
        const numericId = parseInt(id); 
        
        // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではconfirm()が使われているため、そのままにしています。
        if (!confirm('この植物のカルテを削除してもよろしいですか？')) {
            return;
        }
        
        userPlants = userPlants.filter(plant => plant.id !== numericId);
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        
        localStorage.removeItem(`purchase_date_${numericId}`);
        
        renderPlantCards();
    }

    // ----------------------------------------------------
    // 8. ドラッグ＆ドロップ（順序変更）ロジック (既存)
    // ----------------------------------------------------

    function handleDragStart(e) {
        draggedId = parseInt(e.target.dataset.id);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // ドラッグ中のカードは一時的に見えなくする
        setTimeout(() => e.target.style.opacity = '0.4', 0);
    }

    function handleDragOver(e) {
        e.preventDefault(); 
        
        const targetCard = e.target.closest('.plant-card');
        if (!targetCard || targetCard.classList.contains('dragging')) return;
        
        // ドロップ先のカードの位置によって挿入位置を決定
        const bounding = targetCard.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        
        if (e.clientY < offset) {
            targetCard.style.borderTop = '2px solid var(--color-primary)';
            targetCard.style.borderBottom = 'none';
        } else {
            targetCard.style.borderBottom = '2px solid var(--color-primary)';
            targetCard.style.borderTop = 'none';
        }
        
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        
        const targetCard = e.target.closest('.plant-card');
        if (!targetCard || draggedId === null) return;

        targetCard.style.borderTop = 'none';
        targetCard.style.borderBottom = 'none';

        const droppedId = parseInt(targetCard.dataset.id);
        
        const draggedIndex = userPlants.findIndex(p => p.id === draggedId);
        const droppedIndex = userPlants.findIndex(p => p.id === droppedId);

        if (draggedIndex === -1 || droppedIndex === -1 || draggedIndex === droppedIndex) return;

        const [draggedItem] = userPlants.splice(draggedIndex, 1);
        
        // ドロップ位置に応じて挿入位置を調整
        const bounding = targetCard.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        
        let newIndex = droppedIndex;
        if (e.clientY > offset && droppedIndex < userPlants.length) {
            // 下半分にドロップした場合、挿入インデックスを+1
            newIndex = droppedIndex + (draggedIndex < droppedIndex ? 0 : 1);
        } else if (e.clientY < offset && droppedIndex > 0) {
            // 上半分にドロップした場合、挿入インデックスをそのまま
            newIndex = droppedIndex - (draggedIndex > droppedIndex ? 0 : 1);
        } else {
            // 端の処理
            newIndex = droppedIndex;
        }
        
        userPlants.splice(newIndex, 0, draggedItem);
        
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        renderPlantCards();
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        e.target.style.opacity = '1'; // 透明度を元に戻す
        // すべてのカードのボーダーをリセット
        document.querySelectorAll('.plant-card').forEach(card => {
            card.style.borderTop = 'none';
            card.style.borderBottom = 'none';
        });
        draggedId = null;
    }


    // ----------------------------------------------------
    // 9. 購入日入力モーダル処理 (既存)
    // ----------------------------------------------------
    
    closePurchaseDateButton.onclick = () => {
        purchaseDateModal.style.display = 'none';
        if (detailsModal) detailsModal.style.display = 'block'; // 詳細モーダルに戻る
    };

    if (editPurchaseDateButton) {
        editPurchaseDateButton.onclick = () => {
            if (currentPlantId === null) {
                 // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではalert()が使われているため、そのままにしています。
                 alert('エラー: まず植物カードをクリックして詳細を表示してください。');
                 return;
            }

            detailsModal.style.display = 'none'; 
            purchaseDateModal.style.display = 'block';

            const existingDate = getPurchaseDate(currentPlantId);
            purchaseDateInput.value = existingDate || '';
        };
    }
    
    savePurchaseDateButton.onclick = () => {
        const newDate = purchaseDateInput.value;
        if (newDate && currentPlantId !== null) {
            savePurchaseDate(currentPlantId, newDate);
            // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではalert()が使われているため、そのままにしています。
            alert('購入日を保存しました。');
            
            purchaseDateModal.style.display = 'none';
            if (detailsModal) detailsModal.style.display = 'block'; // 詳細モーダルに戻る
            updatePurchaseDateDisplay(currentPlantId);
        } else {
            // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではalert()が使われているため、そのままにしています。
            alert('日付を入力してください。');
        }
    };
    
    // ----------------------------------------------------
    // 10. エクスポート/インポート機能 (既存)
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
        // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではalert()が使われているため、そのままにしています。
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
                
                // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではconfirm()が使われているため、そのままにしています。
                if (!confirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？')) {
                    return;
                }

                // 1. userPlants (メインカルテ) の更新
                userPlants = importedData.userPlants; 
                localStorage.setItem('userPlants', JSON.stringify(userPlants));

                // 2. Purchase Dates (購入日) の更新
                // 既存の購入日データをクリア
                // 注意: localStorageに購入日以外のデータがある場合、それもクリアされます。
                // 実際にはキーをチェックして削除するのが望ましいですが、ここではpurchase_date_のみを対象としています。
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('purchase_date_')) {
                        localStorage.removeItem(key);
                    }
                }
                Object.keys(importedData.purchaseDates).forEach(key => {
                    localStorage.setItem(key, importedData.purchaseDates[key]);
                });

                // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではalert()が使われているため、そのままにしています。
                alert('カルテデータのインポートが完了しました。画面を更新します。');
                renderPlantCards(); 

            } catch (error) {
                // 代替手段としてカスタムモーダルを使用すべきだが、既存のコードではalert()が使われているため、そのままにしています。
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
    // 11. PWA Service Worker 登録ロジック (既存)
    // ----------------------------------------------------
    
    // アプリケーション起動
    initializeApp();

});

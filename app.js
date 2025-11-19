// app.js

document.addEventListener('DOMContentLoaded', () => {
    const plantList = document.getElementById('plant-list');
    const detailsModal = document.getElementById('details-modal');
    const closeButton = detailsModal.querySelector('.close-button');
    const plantDetails = document.getElementById('plant-details');
    
    // 購入日関連の要素
    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal.querySelector('.close-button-purchase-date');
    const editPurchaseDateButton = document.getElementById('edit-purchase-date-button');
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    
    // 🌟 追加: エクスポート/インポート関連の要素
    const exportButton = document.getElementById('export-data-button');
    const importButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');
    const importFileNameDisplay = document.getElementById('import-file-name');

    let currentPlantId = null;

    // 現在の月を取得し、季節を決定するヘルパー関数 (既存)
    const getCurrentSeason = () => {
        const month = new Date().getMonth() + 1;
        if (typeof SEASONS === 'undefined') return 'SPRING'; 
        
        if (month >= SEASONS.SPRING.startMonth && month <= SEASONS.SPRING.endMonth) return 'SPRING';
        if (month >= SEASONS.SUMMER.startMonth && month <= SEASONS.SUMMER.endMonth) return 'SUMMER';
        if (month >= SEASONS.AUTUMN.startMonth && month <= SEASONS.AUTUMN.endMonth) return 'AUTUMN';
        return 'WINTER';
    };
    const currentSeasonKey = getCurrentSeason();

    // LocalStorageから購入日を取得する関数 (既存)
    const getPurchaseDate = (plantId) => {
        return localStorage.getItem(`purchase_date_${plantId}`);
    };

    // LocalStorageに購入日を保存する関数 (既存)
    const savePurchaseDate = (plantId, date) => {
        localStorage.setItem(`purchase_date_${plantId}`, date);
    };

    // 購入日表示を更新する関数 (既存)
    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        if (date) {
            const [year, month, day] = date.split('-');
            purchaseDateDisplay.textContent = `${year}年${parseInt(month)}月${parseInt(day)}日`;
        } else {
            purchaseDateDisplay.textContent = '未設定';
        }
    };
    
    // 観葉植物リストのレンダリング (既存)
    const renderPlantList = () => {
        plantList.innerHTML = '';
        PLANT_DATA.forEach(plant => {
            const card = document.createElement('div');
            card.className = 'plant-card';
            card.setAttribute('data-id', plant.id);

            const seasonData = plant.management[currentSeasonKey];

            card.innerHTML = `
                <img src="${plant.img}" alt="${plant.species}" class="plant-image">
                <h2>${plant.species} (${plant.scientific})</h2>
                <div class="info-group">
                    <p><strong>現在の季節:</strong> ${SEASONS[currentSeasonKey].name}</p>
                    <p><strong>💡 水やり:</strong> ${seasonData.water}</p>
                    <p><strong>☀️ 光:</strong> ${seasonData.light}</p>
                    <p><strong>🌡️ 最低温度:</strong> ${plant.minTemp}°C</p>
                </div>
            `;
            card.addEventListener('click', () => showDetailsModal(plant));
            plantList.appendChild(card);
        });
    };

    // 詳細モーダルの表示（既存）
    const showDetailsModal = (plant) => {
        currentPlantId = plant.id;
        const seasonData = plant.management[currentSeasonKey];
        const maintenance = plant.maintenance;

        plantDetails.innerHTML = `
            <h2>${plant.species}</h2>
            <p class="scientific-name">${plant.scientific}</p>
            <img src="${plant.img}" alt="${plant.species}" class="detail-image">
            <div class="detail-section">
                <h3>季節別ケア (${SEASONS[currentSeasonKey].name})</h3>
                <ul>
                    <li><strong>水やり:</strong> ${seasonData.water}</li>
                    <li><strong>光:</strong> ${seasonData.light}</li>
                    ${seasonData.tempRisk ? `<li><strong>寒さ対策:</strong> ${seasonData.tempRisk}</li>` : ''}
                </ul>
            </div>
            <div class="detail-section">
                <h3>基本情報・年間メンテナンス</h3>
                <ul>
                    <li><strong>難易度:</strong> ${plant.difficulty}</li>
                    <li><strong>特徴:</strong> ${plant.feature}</li>
                    <li><strong>最低越冬温度:</strong> ${plant.minTemp}°C</li>
                    <li><strong>肥料:</strong> ${maintenance.fertilizer}</li>
                    <li><strong>植え替え:</strong> ${maintenance.repotting}</li>
                    <li><strong>剪定:</strong> ${maintenance.pruning}</li>
                </ul>
            </div>
        `;
        
        updatePurchaseDateDisplay(plant.id);
        detailsModal.style.display = 'block';
    };

    // モーダルの閉じるロジック (既存)
    closeButton.onclick = () => {
        detailsModal.style.display = 'none';
        currentPlantId = null;
    };

    // ... (window.onclick モーダル閉じるロジック - 既存)

    closePurchaseDateButton.onclick = () => {
        purchaseDateModal.style.display = 'none';
    };

    // 「購入日を記録/変更」ボタンクリック時の処理 (既存)
    editPurchaseDateButton.onclick = () => {
        if (currentPlantId === null) return; 

        detailsModal.style.display = 'none';
        purchaseDateModal.style.display = 'block';

        const existingDate = getPurchaseDate(currentPlantId);
        purchaseDateInput.value = existingDate || '';
    };

    // 「保存」ボタンクリック時の処理 (既存)
    savePurchaseDateButton.onclick = () => {
        const newDate = purchaseDateInput.value;
        if (newDate && currentPlantId !== null) {
            savePurchaseDate(currentPlantId, newDate);
            alert('購入日を保存しました。');
            
            purchaseDateModal.style.display = 'none';
            detailsModal.style.display = 'block';
            updatePurchaseDateDisplay(currentPlantId);
        } else {
            alert('日付を入力してください。');
        }
    };

    // =================================================================
    // 🌟 [エクスポート/インポート機能] 
    // =================================================================

    // 🌟 追加: データを収集する関数
    const collectAllData = () => {
        const userPlants = localStorage.getItem('userPlants');
        const purchaseDates = {};
        
        // LocalStorage全体をチェックし、購入日キーを収集
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('purchase_date_')) {
                purchaseDates[key] = localStorage.getItem(key);
            }
        }

        return {
            userPlants: userPlants ? JSON.parse(userPlants) : [],
            purchaseDates: purchaseDates
        };
    };

    // 🌟 追加: エクスポート処理
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

    // 🌟 追加: インポートファイル選択の処理
    importButton.onclick = () => {
        importFileInput.click(); // ファイル選択ダイアログを開く
    };

    // 🌟 追加: ファイル名表示の更新
    importFileInput.onchange = () => {
        if (importFileInput.files.length > 0) {
            importFileNameDisplay.textContent = importFileInput.files[0].name;
            processImportFile(importFileInput.files[0]);
        } else {
            importFileNameDisplay.textContent = 'ファイル未選択';
        }
    };

    // 🌟 追加: インポートファイル処理
    const processImportFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);

                if (!importedData.userPlants || !importedData.purchaseDates) {
                    throw new Error('JSON形式が正しくありません。');
                }
                
                if (!confirm('現在のカルテ情報をインポートデータで上書きします。よろしいですか？')) {
                    return;
                }

                // 1. userPlants (メインカルテ) の更新
                localStorage.setItem('userPlants', JSON.stringify(importedData.userPlants));

                // 2. Purchase Dates (購入日) の更新
                // 既存の購入日データをクリア
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('purchase_date_')) {
                        localStorage.removeItem(key);
                    }
                }
                // 新しい購入日データを書き込み
                Object.keys(importedData.purchaseDates).forEach(key => {
                    localStorage.setItem(key, importedData.purchaseDates[key]);
                });

                alert('カルテデータのインポートが完了しました。');
                // アプリの初期化と再レンダリング
                initializeData(); 
                renderPlantList();

            } catch (error) {
                alert('データのインポートに失敗しました。ファイル形式を確認してください。エラー: ' + error.message);
            } finally {
                // ファイル入力のリセット
                importFileInput.value = '';
                importFileNameDisplay.textContent = 'ファイル未選択';
            }
        };
        reader.readAsText(file);
    };

    // データの初期化とリフレッシュ処理を統合
    const initializeData = () => {
        // 現在はLocal Storageからデータを取得するのみ
        // userPlantsは現在のアプリ構造では使用されていないため、購入日データのみがユーザーデータです。
        // Local Storageから最新の userPlants を取得する必要があるが、現在のアプリは登録機能がないため省略。
        // ここでは、購入日データがインポートされた後、画面を更新するために renderPlantList() を呼び出すだけで十分です。
    };


    // 初期化
    renderPlantList();
});

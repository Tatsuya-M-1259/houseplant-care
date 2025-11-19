// app.js

document.addEventListener('DOMContentLoaded', () => {
    const plantList = document.getElementById('plant-list');
    const detailsModal = document.getElementById('details-modal');
    const closeButton = detailsModal.querySelector('.close-button');
    const plantDetails = document.getElementById('plant-details');
    
    // 🌟 追加: 購入日関連の要素
    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal.querySelector('.close-button-purchase-date');
    const editPurchaseDateButton = document.getElementById('edit-purchase-date-button');
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    
    let currentPlantId = null;

    // 現在の月を取得し、季節を決定するヘルパー関数 (既存)
    const getCurrentSeason = () => {
        const month = new Date().getMonth() + 1;
        // 季節区分の定義はdata.jsにあります
        if (typeof SEASONS === 'undefined') return 'SPRING'; // Fallback
        
        if (month >= SEASONS.SPRING.startMonth && month <= SEASONS.SPRING.endMonth) return 'SPRING';
        if (month >= SEASONS.SUMMER.startMonth && month <= SEASONS.SUMMER.endMonth) return 'SUMMER';
        if (month >= SEASONS.AUTUMN.startMonth && month <= SEASONS.AUTUMN.endMonth) return 'AUTUMN';
        return 'WINTER';
    };
    const currentSeasonKey = getCurrentSeason();

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

    // 🌟 修正: 詳細モーダルの表示（購入日表示ロジック追加）
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
        
        // 🌟 追加: 購入日を取得して表示を更新
        updatePurchaseDateDisplay(plant.id);

        detailsModal.style.display = 'block';
    };

    // モーダルの閉じるロジック (既存)
    closeButton.onclick = () => {
        detailsModal.style.display = 'none';
        currentPlantId = null;
    };

    window.onclick = (event) => {
        if (event.target == detailsModal) {
            detailsModal.style.display = 'none';
            currentPlantId = null;
        }
        // 🌟 追加: 購入日モーダルを閉じる
        if (event.target == purchaseDateModal) {
            purchaseDateModal.style.display = 'none';
        }
    };
    
    // 🌟 追加: 購入日モーダルを閉じるボタン
    closePurchaseDateButton.onclick = () => {
        purchaseDateModal.style.display = 'none';
    };


    // =================================================================
    // 🌟 [購入日記録機能] 
    // =================================================================

    // 🌟 追加: LocalStorageから購入日を取得する関数
    const getPurchaseDate = (plantId) => {
        // キーを 'purchase_date_1', 'purchase_date_2' のように設定
        return localStorage.getItem(`purchase_date_${plantId}`);
    };

    // 🌟 追加: LocalStorageに購入日を保存する関数
    const savePurchaseDate = (plantId, date) => {
        localStorage.setItem(`purchase_date_${plantId}`, date);
    };

    // 🌟 追加: 購入日表示を更新する関数
    const updatePurchaseDateDisplay = (plantId) => {
        const date = getPurchaseDate(plantId);
        if (date) {
            // YYYY-MM-DD形式をYYYY年M月D日に変換して表示
            const [year, month, day] = date.split('-');
            purchaseDateDisplay.textContent = `${year}年${parseInt(month)}月${parseInt(day)}日`;
        } else {
            purchaseDateDisplay.textContent = '未設定';
        }
    };


    // 🌟 追加: 「購入日を記録/変更」ボタンクリック時の処理
    editPurchaseDateButton.onclick = () => {
        if (currentPlantId === null) return; 

        // 詳細モーダルから購入日入力モーダルへ切り替え
        detailsModal.style.display = 'none';
        purchaseDateModal.style.display = 'block';

        // 既に保存されている日付があれば入力欄にセット
        const existingDate = getPurchaseDate(currentPlantId);
        purchaseDateInput.value = existingDate || '';
    };

    // 🌟 追加: 「保存」ボタンクリック時の処理
    savePurchaseDateButton.onclick = () => {
        const newDate = purchaseDateInput.value;
        if (newDate && currentPlantId !== null) {
            savePurchaseDate(currentPlantId, newDate);
            alert('購入日を保存しました。');
            
            // 購入日入力モーダルを閉じる
            purchaseDateModal.style.display = 'none';
            
            // 詳細モーダルを再表示し、購入日表示を更新
            detailsModal.style.display = 'block';
            updatePurchaseDateDisplay(currentPlantId);
        } else {
            alert('日付を入力してください。');
        }
    };
    
    // 初期化
    renderPlantList();
    
    // PWA Service Worker 登録ロジック (既存)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // sw.js を登録
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

});

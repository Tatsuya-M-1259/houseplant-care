// app.js

const speciesSelect = document.getElementById('species-select');
const addPlantForm = document.getElementById('add-plant-form');
const plantCardList = document.getElementById('plant-card-list');

let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
let draggedId = null; // 🌟 追加: ドラッグ中のカードIDを保持

// ----------------------------------------------------
// 1. 季節判定ロジック (変更なし)
// ----------------------------------------------------

function getCurrentSeason() {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12

    if (month >= SEASONS.SPRING.startMonth && month <= SEASONS.SPRING.endMonth) return 'SPRING';
    if (month >= SEASONS.SUMMER.startMonth && month <= SEASONS.SUMMER.endMonth) return 'SUMMER';
    if (month >= SEASONS.AUTUMN.startMonth && month <= SEASONS.AUTUMN.endMonth) return 'AUTUMN';
    
    // 12月、1月、2月の場合
    if (month === 12 || month === 1 || month === 2) return 'WINTER';
    
    return 'SPRING'; // デフォルト
}

// ----------------------------------------------------
// 2. 初期化 (Select Boxへのデータ挿入) (変更なし)
// ----------------------------------------------------

function initializeApp() {
    PLANT_DATA.forEach(plant => {
        const option = document.createElement('option');
        option.value = plant.id;
        option.textContent = `${plant.species} (${plant.scientific})`;
        speciesSelect.appendChild(option);
    });

    renderPlantCards();
}

// ----------------------------------------------------
// 3. カルテレンダリング
// ----------------------------------------------------

function renderPlantCards() {
    plantCardList.innerHTML = '';
    const currentSeasonKey = getCurrentSeason();

    userPlants.slice(0, 10).forEach(userPlant => { // デフォで10個まで表示
        const data = PLANT_DATA.find(p => p.id == userPlant.speciesId);
        if (!data) return;

        const card = createPlantCard(userPlant, data, currentSeasonKey);
        plantCardList.appendChild(card);
    });
    // 10個以上の処理（ここでは省略）
}

function createPlantCard(userPlant, data, activeSeasonKey) {
    const card = document.createElement('div');
    card.className = 'plant-card';
    card.setAttribute('data-id', userPlant.id); // 🌟 追加: 削除・並び替え用のID
    card.setAttribute('draggable', true); // 🌟 追加: ドラッグ可能にする

    // 🌟 追加: コントロールボタンコンテナ
    const controls = document.createElement('div');
    
    // 🌟 追加: ドラッグハンドル (持ち手)
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '☰'; // 持ち手アイコン
    controls.appendChild(dragHandle);

    // 🌟 追加: 削除ボタン
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '×';
    deleteButton.onclick = () => deletePlantCard(userPlant.id); // 削除関数を呼び出す
    controls.appendChild(deleteButton);

    card.appendChild(controls); 

    // 季節選択ボタンの生成 (変更なし)
    const seasonSelector = document.createElement('div');
    seasonSelector.className = 'season-selector';
    ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].forEach(key => {
        const button = document.createElement('button');
        button.textContent = SEASONS[key].name.split(' ')[0]; // 季節名のみ
        button.className = key === activeSeasonKey ? 'active' : '';
        // ボタンクリック時にコンテンツを更新するイベントリスナーを設定
        button.onclick = () => {
            // 現在アクティブなボタンを非アクティブにし、クリックされたボタンをアクティブにする
            card.querySelectorAll('.season-selector button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // カードコンテンツを更新
            updateCardContent(card, userPlant, data, key);
        };
        seasonSelector.appendChild(button);
    });

    // 初期コンテンツの生成
    const content = document.createElement('div');
    content.innerHTML = generateCardContent(userPlant, data, activeSeasonKey);
    
    card.appendChild(seasonSelector); 
    card.appendChild(content);
    
    // 🌟 追加: ドラッグイベントリスナーの設定
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

function updateCardContent(cardElement, userPlant, data, newSeasonKey) {
    // 季節選択UIの次の要素（コンテンツ部分）を取得し、更新
    // DOM構造の変更に合わせて修正
    const contentElement = cardElement.querySelector('.season-selector').nextElementSibling;
    if (contentElement) {
        contentElement.innerHTML = generateCardContent(userPlant, data, newSeasonKey);
    }
}

// ----------------------------------------------------
// 4. カルテコンテンツ生成 (HTMLテンプレート) (変更なし)
// ----------------------------------------------------

function generateCardContent(userPlant, data, seasonKey) {
    const seasonData = data.management[seasonKey];
    const riskText = getSeasonRisk(seasonKey, data);
    
    const lastWateredDate = new Date(userPlant.lastWatered);
    const timeSinceWatered = Math.floor((new Date() - lastWateredDate) / (1000 * 60 * 60 * 24)); // 日数計算
    
    // 次の水やり目安のロジックは複雑なため、ここでは簡略化し、注意喚起に留めます。
    // 冬は14日、その他は7日経過で確認を促すメッセージに変更
    const waterGuidance = (timeSinceWatered > 7 && seasonKey !== 'WINTER') || (timeSinceWatered > 14 && seasonKey === 'WINTER')
                          ? `水やりから${timeSinceWatered}日経過。**土の状態を厳格に確認**し、プロトコルに従って給水してください。` 
                          : seasonData.water;

    return `
        <div class="card-image">
            <img src="${data.img}" alt="${data.species}">
        </div>
        <div class="card-header">
            <h3>${userPlant.name}</h3>
            <p>${data.species} (最低越冬温度: ${data.minTemp}℃)</p>
            <p>難易度: <b>${data.difficulty}</b> | 特徴: ${data.feature}</p>
        </div>
        
        <div class="status-box">
            ${SEASONS[seasonKey].name.split(' ')[0]}の最重要管理項目: **${riskText}**
        </div>

        <h4>現在の管理プロトコル (${SEASONS[seasonKey].name.split(' ')[0]})</h4>
        <ul>
            <li>**水やり:** ${waterGuidance}</li>
            <li>**光量要求:** ${seasonData.light}</li>
            ${seasonData.tempRisk ? `<li>**⚠️ 特殊対応:** ${seasonData.tempRisk}</li>` : ''}
            ${seasonKey === 'WINTER' ? '<li>**根腐れ注意:** 過剰水やりは最大の死亡原因です。</li>' : ''}
        </ul>

        <h4>年間メンテナンス</h4>
        <ul>
            <li>**植え替え推奨:** ${data.maintenance.repotting}</li>
            <li>**施肥推奨:** ${data.maintenance.fertilizer}</li>
            <li>**剪定推奨:** ${data.maintenance.pruning}</li>
        </ul>
    `;
}

function getSeasonRisk(seasonKey, data) {
    if (seasonKey === 'WINTER') {
        // 耐寒性「弱」（10℃以上）の種は特に厳重な管理を強調
        if (data.minTemp >= 10) {
            return '厳重な低温・断水管理！根腐れリスク大！'; 
        }
        // 耐寒性「やや弱」（5℃以上）の種
        if (data.minTemp >= 5) {
            return '断水管理と夜間の窓際隔離！';
        }
        // 耐寒性「強」の種
        return '冬季は極端な断水で休眠誘導。管理容易。';
    }
    if (seasonKey === 'SUMMER') {
        // 日中の高温障害（換気管理）が重要
        return '積極的な換気による高温障害回避！';
    }
    if (seasonKey === 'AUTUMN') {
        // 休眠期に向けた乾燥耐性訓練を開始
        return '休眠に向けた水・施肥の漸減準備。'; 
    }
    // 春
    return '成長期再開！水やりと施肥を徐々に再開。'; 
}

// ----------------------------------------------------
// 5. 植物登録処理 (変更なし)
// ----------------------------------------------------

addPlantForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const newPlant = {
        id: Date.now(),
        name: document.getElementById('plant-name').value,
        speciesId: document.getElementById('species-select').value,
        lastWatered: document.getElementById('last-watered').value,
    };

    userPlants.unshift(newPlant); // 新しいものをリストの先頭に追加
    localStorage.setItem('userPlants', JSON.stringify(userPlants));
    
    // UIを更新
    renderPlantCards();
    addPlantForm.reset();
});

// ----------------------------------------------------
// 6. 🌟 追加: カルテ削除ロジック
// ----------------------------------------------------

function deletePlantCard(id) {
    // IDは数値型として比較するため、引数を数値に変換
    const numericId = parseInt(id); 
    
    if (!confirm('この植物のカルテを削除してもよろしいですか？')) {
        return;
    }
    
    // IDに一致しないものだけを残してフィルタリング
    userPlants = userPlants.filter(plant => plant.id !== numericId);
    
    // localStorageを更新
    localStorage.setItem('userPlants', JSON.stringify(userPlants));
    
    // UIを再描画
    renderPlantCards();
}

// ----------------------------------------------------
// 7. 🌟 追加: ドラッグ＆ドロップ（順序変更）ロジック
// ----------------------------------------------------

function handleDragStart(e) {
    // ドラッグする要素のIDを取得
    draggedId = parseInt(e.target.dataset.id);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault(); // これがないとdropイベントが発火しない
    
    const targetCard = e.target.closest('.plant-card');
    if (!targetCard || targetCard.classList.contains('dragging')) return;
    
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    
    const targetCard = e.target.closest('.plant-card');
    if (!targetCard || draggedId === null) return;

    const droppedId = parseInt(targetCard.dataset.id);
    
    // 1. 配列内のインデックスを取得
    const draggedIndex = userPlants.findIndex(p => p.id === draggedId);
    const droppedIndex = userPlants.findIndex(p => p.id === droppedId);

    if (draggedIndex === -1 || droppedIndex === -1 || draggedIndex === droppedIndex) return;

    // 2. 配列の順番を入れ替える
    const [draggedItem] = userPlants.splice(draggedIndex, 1);
    userPlants.splice(droppedIndex, 0, draggedItem);
    
    // 3. localStorageを更新
    localStorage.setItem('userPlants', JSON.stringify(userPlants));
    
    // 4. UIを再描画
    renderPlantCards();
}

function handleDragEnd(e) {
    // ドラッグ終了時にクラスを削除し、IDをクリア
    e.target.classList.remove('dragging');
    draggedId = null;
}

// アプリケーション起動
initializeApp();

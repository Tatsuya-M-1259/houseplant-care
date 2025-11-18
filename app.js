// app.js

const speciesSelect = document.getElementById('species-select');
const addPlantForm = document.getElementById('add-plant-form');
const plantCardList = document.getElementById('plant-card-list');

let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];

// ----------------------------------------------------
// 1. 季節判定ロジック
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
// 2. 初期化 (Select Boxへのデータ挿入)
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

    // 季節選択ボタンの生成
    const seasonSelector = document.createElement('div');
    seasonSelector.className = 'season-selector';
    ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].forEach(key => {
        const button = document.createElement('button');
        button.textContent = SEASONS[key].name.split(' ')[0]; // 季節名のみ
        button.className = key === activeSeasonKey ? 'active' : '';
        button.onclick = () => updateCardContent(card, userPlant, data, key);
        seasonSelector.appendChild(button);
    });

    // 初期コンテンツの生成
    card.innerHTML = generateCardContent(userPlant, data, activeSeasonKey);
    card.prepend(seasonSelector); // 選択ボタンをコンテンツの前に配置

    return card;
}

function updateCardContent(cardElement, userPlant, data, newSeasonKey) {
    // ボタンのアクティブ状態を更新
    cardElement.querySelectorAll('.season-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    cardElement.querySelector(`.season-selector button:contains(${SEASONS[newSeasonKey].name.split(' ')[0]})`).classList.add('active');

    // コンテンツ部分のみを更新
    const newContent = generateCardContent(userPlant, data, newSeasonKey);
    
    // 季節選択UI以外の部分を置き換えるための処理
    // （ここでは簡略化のためinnerHTMLを直接更新していますが、実務ではより細かくDOM操作を行います）
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newContent;
    
    // 既存のカードコンテンツを削除し、新しいものを追加
    Array.from(cardElement.children).filter(child => !child.classList.contains('season-selector')).forEach(child => child.remove());
    Array.from(tempDiv.children).forEach(child => cardElement.appendChild(child));
}

// ----------------------------------------------------
// 4. カルテコンテンツ生成 (HTMLテンプレート)
// ----------------------------------------------------

function generateCardContent(userPlant, data, seasonKey) {
    const seasonData = data.management[seasonKey];
    const riskText = getSeasonRisk(seasonKey, data);
    
    const lastWateredDate = new Date(userPlant.lastWatered);
    const timeSinceWatered = Math.floor((new Date() - lastWateredDate) / (1000 * 60 * 60 * 24)); // 日数計算
    
    // 次の水やり目安のロジックは複雑なため、ここでは簡略化し、注意喚起に留めます。
    const waterGuidance = timeSinceWatered > 5 && seasonKey !== 'WINTER' 
                          ? `水やりから${timeSinceWatered}日経過。注意して土の状態を確認してください。` 
                          : seasonData.water;

    return `
        <div class="card-image">${data.species}の写真</div>
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
            [cite_start]<li>**水やり:** ${waterGuidance} [cite: 45]</li>
            [cite_start]<li>**光量要求:** ${seasonData.light} [cite: 45]</li>
            ${seasonData.tempRisk ? [cite_start]`<li>**⚠️ 特殊対応:** ${seasonData.tempRisk} [cite: 16, 30, 31]</li>` : ''}
        </ul>

        <h4>年間メンテナンス</h4>
        <ul>
            [cite_start]<li>**植え替え推奨:** ${data.maintenance.repotting} [cite: 64]</li>
            [cite_start]<li>**施肥推奨:** ${data.maintenance.fertilizer} [cite: 64]</li>
            [cite_start]<li>**剪定推奨:** ${data.maintenance.pruning} [cite: 64]</li>
        </ul>
    `;
}

function getSeasonRisk(seasonKey, data) {
    if (seasonKey === 'WINTER') {
        [cite_start]// 耐寒性「弱」（10℃以上）の種は特に厳重な管理を強調 [cite: 30]
        if (data.minTemp >= 10) {
            return '厳重な低温・断水管理！根腐れリスク大！'; [cite_start]// [cite: 12]
        }
        return '断水管理と夜間の窓際隔離！'; [cite_start]// [cite: 16, 43]
    }
    if (seasonKey === 'SUMMER') {
        [cite_start]// 夏は換気による高温障害回避が重要 [cite: 10, 15]
        return '積極的な換気による高温障害回避！';
    }
    if (seasonKey === 'AUTUMN') {
        return '休眠に向けた水・施肥の漸減準備。'; [cite_start]// [cite: 11]
    }
    return '成長期再開！施肥と水やりを再開。'; [cite_start]// [cite: 9]
}

// ----------------------------------------------------
// 5. 植物登録処理
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

// アプリケーション起動
initializeApp();

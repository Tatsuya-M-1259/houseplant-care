// app.js
import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 状態管理 ---
    const WATER_TYPES = {
        WaterOnly: { name: '水のみ', class: 'water' },
        WaterAndFertilizer: { name: '水と液肥', class: 'fertilizer' },
        WaterAndActivator: { name: '水と活性剤', class: 'activator' },
        WaterFertilizerAndActivator: { name: '水・液肥・活性剤', class: 'complex' }
    };
    
    const DB_NAME = 'HouseplantDB';
    const STORE_NAME = 'images';
    let db = null; 
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    let currentPlantId = null;
    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';
    const objectUrls = new Set();

    // --- ユーティリティ (JST対応) ---
    const getLocalTodayDate = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const parseDate = (str) => {
        if (!str) return null;
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d, 0, 0, 0); 
    };

    const calculateNextDate = (lastDateStr, interval) => {
        if (interval === INTERVAL_WATER_STOP || !lastDateStr) return null;
        const next = parseDate(lastDateStr);
        next.setDate(next.getDate() + parseInt(interval));
        const y = next.getFullYear();
        const m = String(next.getMonth() + 1).padStart(2, '0');
        const d = String(next.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const getCurrentSeasonKey = () => {
        if (currentGlobalSeason !== 'AUTO') return currentGlobalSeason;
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'SPRING';
        if (month >= 6 && month <= 8) return 'SUMMER';
        if (month >= 9 && month <= 11) return 'AUTUMN';
        return 'WINTER';
    };

    const formatDateJp = (str) => {
        if (!str) return '未登録';
        const d = parseDate(str);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    };

    const saveToLocal = () => {
        localStorage.setItem('userPlants', JSON.stringify(userPlants));
        localStorage.setItem('last_update_time', Date.now());
        const display = document.getElementById('last-update-display');
        if (display) display.textContent = `最終更新: ${new Date().toLocaleString('ja-JP')}`;
    };

    // --- Database (IndexedDB) ---
    const initDB = () => new Promise(resolve => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
        req.onsuccess = (e) => { db = e.target.result; resolve(); };
    });

    const saveImage = async (id, blob) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(blob, String(id));
    };

    const getImage = (id) => new Promise(resolve => {
        const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(String(id));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });

    // --- メイン描画処理 ---
    const render = async () => {
        const list = document.getElementById('plant-card-list');
        const dashboard = document.getElementById('dashboard');
        const urgentList = document.getElementById('urgent-plant-list');
        const season = getCurrentSeasonKey();
        
        objectUrls.forEach(URL.revokeObjectURL);
        objectUrls.clear();

        const sorted = [...userPlants].sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name, 'ja');
            const getNextTime = (p) => {
                const data = PLANT_DATA.find(d => String(d.id) === String(p.speciesId));
                const next = calculateNextDate(p.waterLog[0]?.date || p.entryDate, data.management[season].waterIntervalDays);
                return next ? new Date(next).getTime() : Infinity;
            };
            return getNextTime(a) - getNextTime(b);
        });

        // ダッシュボード（通知）
        const urgents = sorted.filter(p => {
            const data = PLANT_DATA.find(d => String(d.id) === String(p.speciesId));
            const next = calculateNextDate(p.waterLog[0]?.date || p.entryDate, data.management[season].waterIntervalDays);
            return next && new Date(next) <= new Date(getLocalTodayDate());
        });
        dashboard.style.display = urgents.length ? 'block' : 'none';
        urgentList.innerHTML = urgents.map(p => `<div class="urgent-item">🚨 ${p.name}</div>`).join('');

        list.innerHTML = '';
        for (const plant of sorted) {
            const species = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
            const card = document.createElement('div');
            card.className = 'plant-card';
            card.dataset.id = plant.id;
            
            const blob = await getImage(plant.id);
            const imgSrc = blob ? URL.createObjectURL(blob) : `./${species.img}`;
            if (blob) objectUrls.add(imgSrc);

            const mnt = species.management[season];
            const nextDateStr = calculateNextDate(plant.waterLog[0]?.date || plant.entryDate, mnt.waterIntervalDays);
            const isUrgent = nextDateStr && new Date(nextDateStr) <= new Date(getLocalTodayDate());

            card.innerHTML = `
                <div class="controls"><button class="delete-btn">×</button></div>
                <div class="card-content-wrapper">
                    <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
                    <div class="card-header"><h3>${plant.name}</h3><p>${species.species}</p></div>
                    <div class="status-box ${isUrgent ? 'alert-bg' : ''}">${isUrgent ? '⚠️ 水やり時期' : '🌿 順調'}</div>
                    <div class="care-info"><p><strong>目安:</strong> ${formatDateJp(nextDateStr)}</p></div>
                </div>
                <div class="card-footer"><button class="action-button tertiary water-done-btn">💧 記録</button></div>
            `;
            list.appendChild(card);
        }
    };

    // --- モーダル表示 ---
    const showModal = (id) => {
        currentPlantId = id;
        const plant = userPlants.find(p => p.id === id);
        const species = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
        const modal = document.getElementById('details-modal');

        document.getElementById('detail-plant-name').textContent = plant.name;
        document.getElementById('detail-species-name').textContent = species.species;
        document.getElementById('entry-date-display').textContent = formatDateJp(plant.entryDate);
        
        const mnt = species.management[getCurrentSeasonKey()];
        document.getElementById('season-care-content').innerHTML = `
            <ul>
                <li><strong>光量:</strong> ${mnt.light}</li>
                <li><strong>水やり方法:</strong> ${species.water_method}</li>
                <li><strong>季節の頻度:</strong> ${mnt.water}</li>
                <li><strong>最低温度:</strong> ${species.minTemp}℃</li>
            </ul>
        `;

        const historyArea = document.getElementById('water-done-in-detail');
        historyArea.innerHTML = `<h3>📝 履歴</h3><button class="action-button tertiary" id="record-water-detail">💧 記録する</button>
            <ul class="history-list">${plant.waterLog.slice(0, 5).map(l => `<li>${formatDateJp(l.date)} - ${WATER_TYPES[l.type]?.name}</li>`).join('')}</ul>`;
        
        document.getElementById('record-water-detail').onclick = () => showWaterTypeModal(id);

        modal.style.display = 'block';
    };

    const showWaterTypeModal = (id) => {
        currentPlantId = id;
        const modal = document.getElementById('water-type-modal');
        const container = document.getElementById('water-type-options');
        container.innerHTML = '';
        Object.keys(WATER_TYPES).forEach(type => {
            const btn = document.createElement('button');
            btn.className = 'action-button';
            btn.textContent = WATER_TYPES[type].name;
            btn.onclick = () => {
                const idx = userPlants.findIndex(p => p.id === id);
                userPlants[idx].waterLog.unshift({ date: getLocalTodayDate(), type });
                saveToLocal();
                modal.style.display = 'none';
                render();
                if (document.getElementById('details-modal').style.display === 'block') showModal(id);
            };
            container.appendChild(btn);
        });
        modal.style.display = 'block';
    };

    // --- 全イベント登録 ---
    const setupEvents = () => {
        // プレビュー
        const updatePreview = () => {
            const sid = document.getElementById('species-select').value;
            const date = document.getElementById('last-watered').value;
            const preview = document.getElementById('next-watering-preview');
            const species = PLANT_DATA.find(d => String(d.id) === String(sid));
            if (species && date) {
                const next = calculateNextDate(date, species.management[getCurrentSeasonKey()].waterIntervalDays);
                preview.textContent = `次回予定: ${formatDateJp(next)}`;
            }
        };
        document.getElementById('species-select').onchange = updatePreview;
        document.getElementById('last-watered').onchange = updatePreview;

        // 登録
        document.getElementById('add-plant-form').onsubmit = (e) => {
            e.preventDefault();
            const sid = document.getElementById('species-select').value;
            const newPlant = {
                id: crypto.randomUUID(), speciesId: sid,
                name: document.getElementById('plant-name').value || '新しい植物',
                entryDate: getLocalTodayDate(),
                waterLog: [{ date: document.getElementById('last-watered').value, type: document.getElementById('water-type-select').value }]
            };
            userPlants.push(newPlant);
            saveToLocal();
            render();
            e.target.reset();
        };

        // 並び替え・設定
        document.getElementById('sort-select').onchange = (e) => { currentSort = e.target.value; localStorage.setItem('sort-select', currentSort); render(); };
        document.getElementById('global-season-select').onchange = (e) => { currentGlobalSeason = e.target.value; localStorage.setItem('global-season-select', currentGlobalSeason); render(); };
        document.getElementById('set-today-button').onclick = () => { document.getElementById('last-watered').value = getLocalTodayDate(); updatePreview(); };

        // 写真・編集
        const fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.accept = 'image/*';
        document.getElementById('change-photo-button').onclick = () => fileInput.click();
        fileInput.onchange = async (e) => { if (e.target.files[0] && currentPlantId) { await saveImage(currentPlantId, e.target.files[0]); render(); showModal(currentPlantId); } };
        
        document.getElementById('edit-plant-name-button').onclick = () => {
            const newName = prompt('名前を変更:', document.getElementById('detail-plant-name').textContent);
            if (newName) {
                const idx = userPlants.findIndex(p => p.id === currentPlantId);
                userPlants[idx].name = newName;
                saveToLocal();
                showModal(currentPlantId);
                render();
            }
        };

        // ナビゲーション
        document.getElementById('prev-plant-btn').onclick = () => { const idx = userPlants.findIndex(p => p.id === currentPlantId); if (idx > 0) showModal(userPlants[idx - 1].id); };
        document.getElementById('next-plant-btn').onclick = () => { const idx = userPlants.findIndex(p => p.id === currentPlantId); if (idx < userPlants.length - 1) showModal(userPlants[idx + 1].id); };

        // アコーディオン
        document.querySelector('.accordion-header').onclick = (e) => {
            e.currentTarget.classList.toggle('collapsed');
            document.getElementById('season-care-content').classList.toggle('expanded');
        };

        // データ管理
        document.getElementById('export-data-button').onclick = () => {
            const blob = new Blob([JSON.stringify(userPlants)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'plants_data.json'; a.click();
        };
        document.getElementById('import-data-button').onclick = () => document.getElementById('import-file-input').click();
        document.getElementById('import-file-input').onchange = (e) => {
            const reader = new FileReader();
            reader.onload = (re) => { userPlants = JSON.parse(re.target.result); saveToLocal(); render(); alert('データを読み込みました'); };
            reader.readAsText(e.target.files[0]);
        };

        // スクロール・閉じる・削除
        const scrollTopBtn = document.getElementById('scroll-to-top');
        window.onscroll = () => scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
        scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        document.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card');
            if (e.target.closest('.delete-btn')) {
                if (confirm('削除しますか？')) { userPlants = userPlants.filter(p => p.id !== card.dataset.id); saveToLocal(); render(); }
            } else if (e.target.closest('.water-done-btn')) {
                showWaterTypeModal(card.dataset.id);
            } else if (e.target.closest('.card-content-wrapper')) {
                showModal(card.dataset.id);
            } else if (e.target.closest('.close-button') || e.target.closest('.close-button-water-type')) {
                e.target.closest('.modal').style.display = 'none';
            }
        });
    };

    const start = async () => {
        await initDB();
        const sel = document.getElementById('species-select');
        PLANT_DATA.forEach(p => sel.add(new Option(p.species, p.id)));
        setupEvents();
        render();
        const lastTime = localStorage.getItem('last_update_time');
        if (lastTime) document.getElementById('last-update-display').textContent = `最終更新: ${new Date(parseInt(lastTime)).toLocaleString('ja-JP')}`;
    };

    start();
});

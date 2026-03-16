// app.js
import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 定数・状態管理 ---
    const WATER_TYPES = {
        WaterOnly: { name: '水のみ', class: 'water' },
        WaterAndFertilizer: { name: '水と液肥', class: 'fertilizer' },
        WaterAndActivator: { name: '水と活性剤', class: 'activator' },
        WaterFertilizerAndActivator: { name: '水・液肥・活性剤', class: 'complex' }
    };
    
    const SEASONS = {
        SPRING: { name: '春 (3-5月)', key: 'SPRING' },
        SUMMER: { name: '夏 (6-8月)', key: 'SUMMER' },
        AUTUMN: { name: '秋 (9-11月)', key: 'AUTUMN' },
        WINTER: { name: '冬 (12-2月)', key: 'WINTER' }
    };

    const DB_NAME = 'HouseplantDB';
    const STORE_NAME = 'images';
    let db = null; 
    let userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    let currentPlantId = null;
    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';
    const objectUrls = new Set();

    // --- ユーティリティ（日本時間対応版） ---
    // 常にローカル（日本時間）の「今日」を YYYY-MM-DD 形式で取得
    const getLocalTodayDate = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // 文字列から日付オブジェクトを作成（安全な日本時間解釈）
    const parseDate = (str) => {
        if (!str) return null;
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d, 0, 0, 0); 
    };

    // 次回の水やり日を計算し、ローカル形式で返す
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
    });

    // --- 描画ロジック ---
    const render = () => {
        const list = document.getElementById('plant-card-list');
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

        list.innerHTML = '';
        sorted.forEach(plant => {
            const species = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
            if (!species) return;

            const card = document.createElement('div');
            card.className = 'plant-card';
            card.innerHTML = `
                <div class="controls"><button class="delete-btn">×</button></div>
                <div class="card-content-wrapper" id="content-${plant.id}"></div>
                <div class="card-footer"><button class="action-button tertiary water-done-btn">💧 記録</button></div>
            `;
            
            list.appendChild(card);
            updateCardContent(plant, species, season);

            card.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn') && !e.target.closest('.water-done-btn')) {
                    showModal(plant.id);
                }
            });
        });
    };

    const updateCardContent = async (plant, species, season) => {
        const wrapper = document.getElementById(`content-${plant.id}`);
        const blob = await getImage(plant.id);
        const imgSrc = blob ? URL.createObjectURL(blob) : `./${species.img}`;
        if (blob) objectUrls.add(imgSrc);

        const mnt = species.management[season];
        const nextDate = calculateNextDate(plant.waterLog[0]?.date || plant.entryDate, mnt.waterIntervalDays);
        const isUrgent = nextDate && new Date(nextDate) <= new Date(getLocalTodayDate());

        wrapper.innerHTML = `
            <div class="card-image"><img src="${imgSrc}"></div>
            <div class="card-header"><h3>${plant.name}</h3><p>${species.species}</p></div>
            <div class="status-box ${isUrgent ? 'alert-bg' : ''}">${isUrgent ? '⚠️ 水やり時期' : '🌿 順調'}</div>
            <div class="care-info">
                <p><strong>目安:</strong> ${formatDateJp(nextDate)}</p>
            </div>
        `;
    };

    // --- モーダル・ナビゲーション ---
    const showModal = (id) => {
        currentPlantId = id;
        const plant = userPlants.find(p => p.id === id);
        const species = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
        const modal = document.getElementById('details-modal');

        document.getElementById('detail-plant-name').textContent = plant.name;
        document.getElementById('detail-species-name').textContent = species.species;
        document.getElementById('entry-date-display').textContent = formatDateJp(plant.entryDate);
        
        const historyList = document.getElementById('water-done-in-detail');
        historyList.innerHTML = '<h3>📝 履歴</h3><ul>' + 
            plant.waterLog.slice(0, 5).map(l => `<li>${formatDateJp(l.date)} - ${WATER_TYPES[l.type]?.name}</li>`).join('') + 
            '</ul>';

        modal.style.display = 'block';
    };

    // --- イベント登録 ---
    const setupEvents = () => {
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

        document.getElementById('prev-plant-btn').onclick = () => {
            const idx = userPlants.findIndex(p => p.id === currentPlantId);
            if (idx > 0) showModal(userPlants[idx - 1].id);
        };
        document.getElementById('next-plant-btn').onclick = () => {
            const idx = userPlants.findIndex(p => p.id === currentPlantId);
            if (idx < userPlants.length - 1) showModal(userPlants[idx + 1].id);
        };

        const scrollTopBtn = document.getElementById('scroll-to-top');
        window.onscroll = () => scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
        scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

        const fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.accept = 'image/*';
        document.getElementById('change-photo-button').onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            if (e.target.files[0] && currentPlantId) {
                await saveImage(currentPlantId, e.target.files[0]);
                render();
            }
        };

        document.getElementById('sort-select').onchange = (e) => {
            currentSort = e.target.value;
            localStorage.setItem('sort-select', currentSort);
            render();
        };
        document.getElementById('global-season-select').onchange = (e) => {
            currentGlobalSeason = e.target.value;
            localStorage.setItem('global-season-select', currentGlobalSeason);
            render();
        };

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
            localStorage.setItem('userPlants', JSON.stringify(userPlants));
            render();
            e.target.reset();
        };

        document.addEventListener('click', (e) => {
            const card = e.target.closest('.plant-card');
            if (e.target.closest('.delete-btn') && confirm('削除しますか？')) {
                const id = card.querySelector('.card-content-wrapper').id.replace('content-', '');
                userPlants = userPlants.filter(p => p.id !== id);
                localStorage.setItem('userPlants', JSON.stringify(userPlants));
                render();
            } else if (e.target.closest('.close-button')) {
                document.getElementById('details-modal').style.display = 'none';
            }
        });

        document.getElementById('set-today-button').onclick = () => {
            document.getElementById('last-watered').value = getLocalTodayDate();
            updatePreview();
        };
    };

    const start = async () => {
        await initDB();
        const sel = document.getElementById('species-select');
        PLANT_DATA.forEach(p => sel.add(new Option(p.species, p.id)));
        setupEvents();
        render();
    };

    start();
});

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
    let userPlants = [];
    let currentPlantId = null;
    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';
    let sortedIds = []; 
    const objectUrls = new Set();

    // --- ユーティリティ ---
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
        try {
            localStorage.setItem('userPlants', JSON.stringify(userPlants));
            localStorage.setItem('last_update_time', Date.now());
            const display = document.getElementById('last-update-display');
            if (display) display.textContent = `最終更新: ${new Date().toLocaleString('ja-JP')}`;
        } catch (e) { console.error("保存失敗:", e); }
    };

    const blobToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    const base64ToBlob = (base64) => {
        try {
            const parts = base64.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const uInt8Array = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i);
            return new Blob([uInt8Array], { type: contentType });
        } catch (e) { return null; }
    };

    const showLoading = (text) => {
        const overlay = document.getElementById('loading-overlay');
        if(overlay) { document.getElementById('loading-text').textContent = text; overlay.style.display = 'flex'; }
    };

    const hideLoading = () => {
        const overlay = document.getElementById('loading-overlay');
        if(overlay) overlay.style.display = 'none';
    };

    const initDB = () => new Promise(resolve => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
        req.onsuccess = (e) => { db = e.target.result; resolve(); };
        req.onerror = () => { console.error("DB初期化失敗"); resolve(); };
    });

    const saveImage = async (id, blob) => {
        if (!db) return;
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(blob, String(id));
    };

    const getImage = (id) => new Promise(resolve => {
        if (!db) { resolve(null); return; }
        const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(String(id));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });

    const render = async () => {
        const list = document.getElementById('plant-card-list');
        if(!list) return;
        list.innerHTML = '';
        const season = getCurrentSeasonKey();
        
        // ソート処理
        const sorted = [...userPlants].sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name, 'ja');
            const getNextTime = (p) => {
                const d = PLANT_DATA.find(d => String(d.id) === String(p.speciesId));
                const next = calculateNextDate(p.waterLog[0]?.date || p.entryDate, d?.management[season].waterIntervalDays);
                return next ? new Date(next).getTime() : Infinity;
            };
            return getNextTime(a) - getNextTime(b);
        });

        for (const plant of sorted) {
            const species = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
            if (!species) continue;
            const card = document.createElement('div');
            card.className = 'plant-card';
            card.dataset.id = plant.id;
            const blob = await getImage(plant.id);
            const imgSrc = blob ? URL.createObjectURL(blob) : `./${species.img}`;
            const mnt = species.management[season];
            const nextDateStr = calculateNextDate(plant.waterLog[0]?.date || plant.entryDate, mnt.waterIntervalDays);
            
            card.innerHTML = `
                <div class="controls"><button class="delete-btn">×</button></div>
                <div class="card-content-wrapper">
                    <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
                    <h3>${plant.name}</h3><p>${species.species}</p>
                    <p>次回: ${formatDateJp(nextDateStr)}</p>
                </div>
                <button class="water-done-btn">💧 記録</button>
            `;
            list.appendChild(card);
        }
    };

    // --- イベント登録 ---
    const setupEvents = () => {
        document.getElementById('add-plant-form').onsubmit = (e) => {
            e.preventDefault();
            userPlants.push({ id: crypto.randomUUID(), speciesId: document.getElementById('species-select').value, name: document.getElementById('plant-name').value, entryDate: getLocalTodayDate(), waterLog: [{ date: document.getElementById('last-watered').value, type: document.getElementById('water-type-select').value }], repottingLog: [] });
            saveToLocal(); render(); e.target.reset();
        };

        document.getElementById('export-data-button').onclick = async () => {
            const exportData = JSON.parse(JSON.stringify(userPlants));
            for (let plant of exportData) {
                const blob = await getImage(plant.id);
                if (blob) plant.imageData = await blobToBase64(blob);
            }
            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'plants_backup.json'; a.click();
        };

        document.getElementById('import-data-button').onclick = () => document.getElementById('import-file-input').click();
        document.getElementById('import-file-input').onchange = (e) => {
            const reader = new FileReader();
            reader.onload = async (re) => {
                const imported = JSON.parse(re.target.result);
                for (let plant of imported) {
                    if (plant.imageData) {
                        const blob = base64ToBlob(plant.imageData);
                        if (blob) await saveImage(plant.id, blob);
                        delete plant.imageData;
                    }
                }
                userPlants = imported;
                saveToLocal(); render(); alert('復元しました');
            };
            reader.readAsText(e.target.files[0]);
        };
    };

    const start = async () => {
        try { userPlants = JSON.parse(localStorage.getItem('userPlants')) || []; } catch(e) { userPlants = []; }
        await initDB();
        const sel = document.getElementById('species-select');
        if(sel) PLANT_DATA.forEach(p => sel.add(new Option(p.species, p.id)));
        setupEvents();
        render();
    };
    start();
});

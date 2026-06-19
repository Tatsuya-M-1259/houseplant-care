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

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const base64ToBlob = (base64) => {
        if (!base64 || !base64.includes(';base64,')) return null; 
        try {
            const parts = base64.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) uInt8Array[i] = raw.charCodeAt(i);
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
        req.onerror = () => { console.error("DB初期化失敗"); resolve(); }; // エラーでも止まらないようにする
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
        const dashboard = document.getElementById('dashboard');
        const urgentList = document.getElementById('urgent-plant-list');
        const season = getCurrentSeasonKey();
        
        objectUrls.forEach(URL.revokeObjectURL);
        objectUrls.clear();

        const sorted = [...userPlants].sort((a, b) => {
            const dataA = PLANT_DATA.find(d => String(d.id) === String(a.speciesId));
            const dataB = PLANT_DATA.find(d => String(d.id) === String(b.speciesId));
            if (currentSort === 'name') return a.name.localeCompare(b.name, 'ja');
            if (currentSort === 'minTemp') return (dataA?.minTemp || 0) - (dataB?.minTemp || 0);
            if (currentSort === 'entryDate') return parseDate(b.entryDate) - parseDate(a.entryDate);
            const getNextTime = (p, data) => {
                const next = calculateNextDate(p.waterLog[0]?.date || p.entryDate, data?.management[season].waterIntervalDays);
                return next ? new Date(next).getTime() : Infinity;
            };
            return getNextTime(a, dataA) - getNextTime(b, dataB);
        });

        sortedIds = sorted.map(p => p.id);
        const urgents = sorted.filter(p => {
            const data = PLANT_DATA.find(d => String(d.id) === String(p.speciesId));
            const next = calculateNextDate(p.waterLog[0]?.date || p.entryDate, data?.management[season].waterIntervalDays);
            return next && new Date(next) <= new Date(getLocalTodayDate());
        });
        if(dashboard) dashboard.style.display = urgents.length ? 'block' : 'none';
        if(urgentList) urgentList.innerHTML = urgents.map(p => `<div class="urgent-item">🚨 ${p.name}</div>`).join('');

        if(!list) return;
        list.innerHTML = '';
        for (const plant of sorted) {
            const species = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
            if (!species) continue;
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
                <div class="controls"><span class="drag-handle">☰</span><button class="delete-btn">×</button></div>
                <div class="card-content-wrapper">
                    <div class="card-image"><img src="${imgSrc}" loading="lazy"></div>
                    <div class="card-header"><h3>${plant.name}</h3><p>${species.species}</p></div>
                    <div class="status-box ${isUrgent ? 'alert-bg' : ''}">${isUrgent ? '⚠️ 水やり時期' : '🌿 順順'}</div>
                    <div class="care-info">
                        <p><strong>目安:</strong> ${formatDateJp(nextDateStr)}</p>
                        <div class="quick-care-tags"><span>☀️ ${mnt.light}</span><span>💧 ${mnt.water}</span>${mnt.mist ? `<span>💨 葉水: ${mnt.mist}</span>` : ''}</div>
                    </div>
                </div>
                <div class="card-footer"><button class="action-button tertiary water-done-btn">💧 記録</button></div>
            `;
            list.appendChild(card);
        }
    };

    const showModal = (id) => {
        currentPlantId = id;
        const plant = userPlants.find(p => p.id === id);
        const species = PLANT_DATA.find(d => String(d.id) === String(plant.speciesId));
        const modal = document.getElementById('details-modal');
        const detailSel = document.getElementById('detail-species-change-select');
        if (detailSel) detailSel.value = plant.speciesId;
        document.getElementById('detail-plant-name').textContent = plant.name;
        document.getElementById('detail-species-name').innerHTML = `${species.species} <small>(${species.scientific})</small>`;
        const detailImg = document.getElementById('detail-plant-image');
        getImage(id).then(blob => {
            const imgSrc = blob ? URL.createObjectURL(blob) : `./${species.img}`;
            detailImg.src = imgSrc;
            if (blob) objectUrls.add(imgSrc); 
        });
        const season = getCurrentSeasonKey();
        const mnt = species.management[season];
        const nextDateStr = calculateNextDate(plant.waterLog[0]?.date || plant.entryDate, mnt.waterIntervalDays);
        const isUrgent = nextDateStr && new Date(nextDateStr) <= new Date(getLocalTodayDate());
        document.getElementById('detail-next-watering').innerHTML = `
            <div class="status-box ${isUrgent ? 'alert-bg' : ''}" style="margin: 0 0 1rem 0;">${isUrgent ? '⚠️ 水やり時期です' : '🌿 順調'}</div>
            <div class="care-info" style="margin: 0 0 1.5rem 1rem;"><p style="font-size: 1.1rem; margin:0;"><strong>次回目安:</strong> ${formatDateJp(nextDateStr)}</p></div>`;
        document.getElementById('season-care-content').innerHTML = `<ul><li><strong>光量:</strong> ${mnt.light}</li><li><strong>水やり:</strong> ${mnt.water}</li><li><strong>葉水:</strong> ${mnt.mist || '-'}</li><li><strong>温度:</strong> ${species.minTemp}℃以上</li></ul>`;
        document.getElementById('plant-details').innerHTML = `<p><strong>特徴:</strong> ${species.feature}</p>`;
        document.getElementById('entry-date-display').textContent = formatDateJp(plant.entryDate);
        const historyArea = document.getElementById('water-done-in-detail');
        historyArea.innerHTML = `<h3>📝 履歴</h3><button class="action-button tertiary" id="record-water-detail">💧 記録</button><ul class="history-list">${plant.waterLog.slice(0, 5).map(l => `<li>${formatDateJp(l.date)} - ${WATER_TYPES[l.type]?.name}</li>`).join('')}</ul>`;
        document.getElementById('record-water-detail').onclick = () => showWaterTypeModal(id);
        modal.style.display = 'block';
    };

    const showWaterTypeModal = (id) => {
        currentPlantId = id;
        const plant = userPlants.find(p => p.id === id);
        const modal = document.getElementById('water-type-modal');
        document.getElementById('water-type-modal-title').textContent = `${plant.name} の記録`;
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

    // --- イベント登録 ---
    const setupEvents = () => {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#quick-sort-buttons')) {
                const btn = e.target.closest('button');
                if (!btn) return;
                currentSort = btn.dataset.sort;
                localStorage.setItem('sort-select', currentSort);
                render();
            }
            if (e.target.classList.contains('delete-btn')) {
                const id = e.target.closest('.plant-card').dataset.id;
                if (confirm('削除しますか？')) { userPlants = userPlants.filter(p => p.id !== id); saveToLocal(); render(); }
            }
            if (e.target.classList.contains('water-done-btn')) showWaterTypeModal(e.target.closest('.plant-card').dataset.id);
            if (e.target.closest('.card-content-wrapper') && !e.target.closest('.controls')) showModal(e.target.closest('.plant-card').dataset.id);
            if (e.target.classList.contains('close-button') || e.target.classList.contains('close-button-water-type')) e.target.closest('.modal').style.display = 'none';
        });

        document.getElementById('add-plant-form').onsubmit = (e) => {
            e.preventDefault();
            const sid = document.getElementById('species-select').value;
            userPlants.push({ id: crypto.randomUUID(), speciesId: sid, name: document.getElementById('plant-name').value, entryDate: getLocalTodayDate(), waterLog: [{ date: document.getElementById('last-watered').value, type: document.getElementById('water-type-select').value }], repottingLog: [] });
            saveToLocal(); render(); e.target.reset();
        };

        // --- 追加：インポート/エクスポートのイベント登録 ---
        document.getElementById('export-data-button').onclick = async () => {
            showLoading('エクスポート中...');
            const exportData = JSON.parse(JSON.stringify(userPlants));
            for (let plant of exportData) {
                const blob = await getImage(plant.id);
                if (blob) plant.imageData = await blobToBase64(blob);
            }
            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `plants_backup_${getLocalTodayDate()}.json`; a.click();
            hideLoading();
        };

        document.getElementById('import-data-button').onclick = () => document.getElementById('import-file-input').click();
        document.getElementById('import-file-input').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (re) => {
                showLoading('復元中...');
                const imported = JSON.parse(re.target.result);
                for (let plant of imported) {
                    if (plant.imageData) {
                        const blob = base64ToBlob(plant.imageData);
                        if (blob) await saveImage(plant.id, blob);
                        delete plant.imageData;
                    }
                }
                userPlants = imported;
                saveToLocal();
                render();
                hideLoading();
                alert('復元完了');
            };
            reader.readAsText(file);
        };

        const detailFileInput = document.getElementById('detail-file-input');
        document.getElementById('change-photo-button').onclick = () => detailFileInput.click();
        detailFileInput.onchange = async (e) => {
            if (e.target.files[0]) {
                await saveImage(currentPlantId, e.target.files[0]);
                render(); showModal(currentPlantId);
            }
        };
    };

    const start = async () => {
        try {
            const saved = localStorage.getItem('userPlants');
            userPlants = saved ? JSON.parse(saved) : [];
        } catch (e) { userPlants = []; }

        setupEvents();

        try {
            if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.error);
            await initDB();
            const sel = document.getElementById('species-select');
            if(sel) PLANT_DATA.forEach(p => sel.add(new Option(p.species, p.id)));
            await render();
        } catch (e) { console.error("初期化失敗:", e); }
    };

    start();
});

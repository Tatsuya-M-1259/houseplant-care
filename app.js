// app.js

import { PLANT_DATA, INTERVAL_WATER_STOP } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------
    // 0. 定数定義
    // ----------------------------------------------------
    const WATER_TYPES = {
        WaterOnly: { name: '水のみ', class: 'water' },
        WaterAndFertilizer: { name: '水と液肥', class: 'fertilizer' },
        WaterAndActivator: { name: '水と活性剤', class: 'activator' },
        WaterFertilizerAndActivator: { name: '水・液肥・活性剤', class: 'complex' }
    };
    
    const SEASONS = {
        SPRING: { name: '春 (3月〜5月)', startMonth: 3, endMonth: 5 },
        SUMMER: { name: '夏 (6月〜8月)', startMonth: 6, endMonth: 8 },
        AUTUMN: { name: '秋 (9月〜11月)', startMonth: 9, endMonth: 11 },
        WINTER: { name: '冬 (12月〜2月)', startMonth: 12, endMonth: 2 }
    };

    const TEMP_FILTER_MAP = { 
        'temp10': 10, 
        'temp5': 5, 
        'temp0': 0 
    };

    const IMAGE_BASE_PATH = './'; 
    const DB_NAME = 'HouseplantDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentFilter = localStorage.getItem('filter-select') || 'all';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';

    let deletedPlantBackup = null;
    let deletedPlantIndex = -1;
    let db = null; 

    const objectUrls = new Set();

    // ----------------------------------------------------
    // 1. Utilities
    // ----------------------------------------------------

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function createManagedObjectURL(blob) {
        const url = URL.createObjectURL(blob);
        objectUrls.add(url);
        return url;
    }

    function revokeAllObjectUrls() {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        objectUrls.clear();
    }

    function compressImage(file, maxWidth = 1024, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas to Blob conversion failed'));
                    }, 'image/jpeg', quality);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    function base64ToBlob(base64, mimeType = 'image/jpeg') {
        const bin = atob(base64.split(',')[1]);
        const buffer = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buffer[i] = bin.charCodeAt(i);
        return new Blob([buffer], { type: mimeType });
    }

    // ----------------------------------------------------
    // 2. IndexedDB Utilities
    // ----------------------------------------------------
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => reject(event.target.error);
            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    function saveImageToDB(plantId, imageData) {
        return new Promise((resolve, reject) => {
            if (!db) return reject("DB not initialized");
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(imageData, plantId);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function getImageFromDB(plantId) {
        return new Promise((resolve, reject) => {
            if (!db) return resolve(null);
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(plantId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        });
    }

    function deleteImageFromDB(plantId) {
        return new Promise((resolve, reject) => {
            if (!db) return resolve();
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(plantId);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function cleanupOrphanedImages() {
        if (!db) return;
        const validIds = new Set(userPlants.map(p => String(p.id)));
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const storedId = String(cursor.key);
                if (!validIds.has(storedId)) cursor.delete();
                cursor.continue();
            }
        };
    }

    // ----------------------------------------------------
    // 3. General Logic
    // ----------------------------------------------------
    function getLocalTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function toggleBodyScroll(lock) {
        document.body.style.overflow = lock ? 'hidden' : '';
    }

    function showNotification(message, type = 'success', duration = 3000, action = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        toast.appendChild(messageSpan);
        if (action) {
            const actionBtn = document.createElement('button');
            actionBtn.textContent = action.text;
            actionBtn.className = 'toast-action-btn';
            actionBtn.onclick = () => {
                action.callback();
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            };
            toast.appendChild(actionBtn);
        }
        notificationArea.appendChild(toast);
        toast.offsetHeight; 
        toast.classList.add('show');
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => toast.remove());
            }, duration);
        }
    }

    function showCustomConfirm(message, onConfirm) {
        if (window.confirm(message)) onConfirm();
    }

    function escapeHTML(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/[&<>"']/g, function(match) {
            const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return escapeMap[match];
        });
    }
    
    function saveUserPlants(plants) {
        try {
            localStorage.setItem('userPlants', JSON.stringify(plants));
            localStorage.setItem('last_update_time', Date.now()); 
            renderLastUpdateTime(); 
        } catch (e) {
            console.error("保存失敗:", e);
            showNotification("データ保存に失敗しました。", 'error');
        }
    }
    
    function updateLastWatered(plantId, type, date = getLocalTodayDate()) {
        const strId = String(plantId);
        const plantIndex = userPlants.findIndex(p => String(p.id) === strId);
        if (plantIndex !== -1) {
            const newLogEntry = { date: date, type: type };
            if (!Array.isArray(userPlants[plantIndex].waterLog)) userPlants[plantIndex].waterLog = [];
            const isDuplicate = userPlants[plantIndex].waterLog.some(log => log.date === date && log.type === type);
            if (!isDuplicate) userPlants[plantIndex].waterLog.unshift(newLogEntry);
            userPlants[plantIndex].waterLog.sort((a, b) => new Date(b.date) - new Date(a.date));
            saveUserPlants(userPlants);
            renderPlantCards(); 
            showNotification(`${userPlants[plantIndex].name} の記録完了！`, 'success');
            waterTypeModal.style.display = 'none';
            if (detailsModal.style.display === 'block') {
                 const plantData = PLANT_DATA.find(p => String(p.id) === String(userPlants[plantIndex].speciesId));
                 if (plantData) showDetailsModal(userPlants[plantIndex], plantData);
            } else {
                 toggleBodyScroll(false); 
            }
        }
    }

    function getCurrentSeason() {
        if (currentGlobalSeason && currentGlobalSeason !== 'AUTO') return currentGlobalSeason;
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'SPRING';
        if (month >= 6 && month <= 8) return 'SUMMER';
        if (month >= 9 && month <= 11) return 'AUTUMN';
        return 'WINTER';
    }

    function parseDateAsLocal(dateString) {
        if (!dateString) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // 【修正箇所】季節の変わり目（3月）の補正ロジックを強化した水やり日計算
    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (!lastDateString || intervalDays === INTERVAL_WATER_STOP || intervalDays == null || isNaN(intervalDays)) return null;
        const lastDate = parseDateAsLocal(lastDateString);
        lastDate.setDate(lastDate.getDate() + parseInt(intervalDays));
        const y = lastDate.getFullYear();
        const m = String(lastDate.getMonth() + 1).padStart(2, '0');
        const d = String(lastDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function renderLastUpdateTime() {
        const lastUpdateTime = localStorage.getItem('last_update_time');
        const lastExportTime = localStorage.getItem('last_export_time');
        let displayHtml = '';
        if (lastUpdateTime) {
            const updateDate = new Date(parseInt(lastUpdateTime));
            displayHtml += `**最終データ更新:** ${dateToJpTime(updateDate)}`;
            if (lastExportTime) {
                const exportDate = new Date(parseInt(lastExportTime));
                displayHtml += `<br><strong>最終エクスポート:</strong> ${dateToJpTime(exportDate)}`;
            } else {
                displayHtml += '<br><strong>最終エクスポート:</strong> 未実行 ⚠️';
                if (exportButton) exportButton.classList.add('backup-warning');
            }
        } else {
            displayHtml = 'データなし';
        }
        if (lastUpdateDisplay) lastUpdateDisplay.innerHTML = displayHtml;
    }
    
    function dateToJpTime(date) {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).replace(/\//g, '/').replace(',', ' ');
    }

    // ----------------------------------------------------
    // 4. Initialize App
    // ----------------------------------------------------
    async function initializeApp() {
        try {
            await initDB();
            console.log("IndexedDB Initialized.");
        } catch(e) {
            console.error("IndexedDB Init Failed", e);
            showNotification("データベースの初期化に失敗しました", "error");
        }

        if (speciesSelect) {
             PLANT_DATA.forEach(plant => {
                const option = document.createElement('option');
                option.value = String(plant.id);
                option.textContent = `${plant.species}`;
                speciesSelect.appendChild(option);
            });
        }
        
        if (sortSelect) sortSelect.value = currentSort;
        if (filterSelect) filterSelect.value = currentFilter;
        if (globalSeasonSelect) globalSeasonSelect.value = currentGlobalSeason;

        renderLastUpdateTime();
        renderPlantCards();
        setupNotificationUI();
        
        if (editNameButton) {
            editNameButton.onclick = () => {
                if (!currentPlantId) return;
                const plantIndex = userPlants.findIndex(p => String(p.id) === String(currentPlantId));
                if (plantIndex === -1) return;
                const currentName = userPlants[plantIndex].name;
                const newName = window.prompt("新しい名前を入力してください:", currentName);
                if (newName !== null && newName.trim() !== "") {
                    userPlants[plantIndex].name = newName.trim();
                    saveUserPlants(userPlants);
                    if (detailPlantName) detailPlantName.textContent = newName.trim();
                    renderPlantCards();
                    showNotification("名前を変更しました", "success");
                }
            };
        }

        if (globalSeasonSelect) {
            globalSeasonSelect.addEventListener('change', (e) => {
                currentGlobalSeason = e.target.value;
                localStorage.setItem('global-season-select', currentGlobalSeason);
                renderPlantCards();
                showNotification(`季節設定を「${e.target.options[e.target.selectedIndex].text}」に変更しました。`, 'success');
            });
        }

        if (setTodayButton && lastWateredInput) {
            setTodayButton.onclick = () => {
                lastWateredInput.value = getLocalTodayDate();
                lastWateredInput.dispatchEvent(new Event('change'));
            };
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                localStorage.setItem('sort-select', currentSort);
                renderPlantCards();
                renderQuickSortButtons();
            });
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                currentFilter = e.target.value;
                localStorage.setItem('filter-select', currentFilter);
                renderPlantCards();
            });
        }
        
        const updatePreview = () => {
            const speciesId = speciesSelect.value;
            const lastDate = lastWateredInput.value;
            if (!speciesId || !lastDate) {
                nextWateringPreview.textContent = '植物種と水やり日を選択してください。';
                return;
            }
            const plantData = PLANT_DATA.find(p => String(p.id) === String(speciesId));
            if (!plantData) return;
            const currentSeasonKey = getCurrentSeason();
            const intervalDays = plantData.management[currentSeasonKey].waterIntervalDays;
            const nextDateString = calculateNextWateringDate(lastDate, intervalDays);
            if (nextDateString === null) {
                nextWateringPreview.textContent = `次回予定: ${plantData.management[currentSeasonKey].water}`;
                return;
            }
            nextWateringPreview.textContent = `次回予定日: ${formatJapaneseDate(nextDateString)}`;
        };
        if (lastWateredInput && speciesSelect) {
             lastWateredInput.addEventListener('change', updatePreview);
             speciesSelect.addEventListener('change', updatePreview);
        }

        window.addEventListener('click', (e) => {
            if (e.target === waterTypeModal || e.target === purchaseDateModal || e.target === repottingDateModal || e.target === detailsModal) {
                e.target.style.display = 'none';
                if (e.target === detailsModal) {
                    currentPlantId = null;
                    toggleBodyScroll(false);
                }
                return;
            }
            if (e.target === lightboxModal) { closeLightbox(); return; }
            const waterBtn = e.target.closest('.water-done-btn-detail');
            if (waterBtn && currentPlantId) { showWaterTypeSelectionModal(currentPlantId); return; }
            const deleteLogBtn = e.target.closest('.delete-log-btn');
            if (deleteLogBtn) {
                const id = deleteLogBtn.dataset.plantid;
                const idx = parseInt(deleteLogBtn.dataset.index);
                if (id && !isNaN(idx)) deleteWaterLog(id, idx);
                return;
            }
        });

        window.addEventListener('popstate', (e) => {
            if (detailsModal.style.display === 'block') {
                detailsModal.style.display = 'none';
                currentPlantId = null;
                toggleBodyScroll(false); 
            }
        });

        if (closeDetailButton) closeDetailButton.onclick = () => { detailsModal.style.display = 'none'; currentPlantId = null; toggleBodyScroll(false); };
        if (closeWaterTypeButton) closeWaterTypeButton.onclick = () => waterTypeModal.style.display = 'none';
        if (closePurchaseDateButton) closePurchaseDateButton.onclick = () => purchaseDateModal.style.display = 'none';
        if (closeRepottingDateButton) closeRepottingDateButton.onclick = () => repottingDateModal.style.display = 'none';

        const handlePrevNextPlant = (direction) => {
            if (!currentPlantId) return;
            const sortedPlants = sortAndFilterPlants(); 
            const currentIndex = sortedPlants.findIndex(p => String(p.id) === String(currentPlantId));
            if (currentIndex === -1) return;
            let newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = sortedPlants.length - 1; 
            if (newIndex >= sortedPlants.length) newIndex = 0; 
            const targetPlant = sortedPlants[newIndex];
            const targetData = PLANT_DATA.find(pd => String(pd.id) === String(targetPlant.speciesId));
            if (targetData) showDetailsModal(targetPlant, targetData);
        };

        if (prevPlantBtn) prevPlantBtn.onclick = (e) => { e.stopPropagation(); handlePrevNextPlant(-1); };
        if (nextPlantBtn) nextPlantBtn.onclick = (e) => { e.stopPropagation(); handlePrevNextPlant(1); };

        document.querySelectorAll('.modal-content').forEach(modal => {
            modal.addEventListener('click', (e) => {
                const header = e.target.closest('.accordion-header');
                if (header) {
                    const targetId = header.getAttribute('data-target');
                    const content = document.getElementById(targetId);
                    if (content) {
                        content.classList.toggle('expanded');
                        header.classList.toggle('collapsed');
                    }
                }
            });
        });

        if (scrollToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) scrollToTopBtn.classList.add('visible');
                else scrollToTopBtn.classList.remove('visible');
            });
            scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }

        if (plantCardList) {
            plantCardList.addEventListener('click', (e) => {
                const card = e.target.closest('.plant-card');
                if (!card) return;
                const plantId = card.dataset.id;
                const plant = userPlants.find(p => String(p.id) === String(plantId));
                if (e.target.closest('.delete-btn')) { e.stopPropagation(); deletePlantCard(plantId); return; }
                if (e.target.tagName === 'BUTTON' && e.target.parentElement.classList.contains('season-selector')) {
                    e.stopPropagation();
                    const buttons = e.target.parentElement.querySelectorAll('button');
                    buttons.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    let selectedSeason = 'SPRING';
                    Object.keys(SEASONS).forEach(key => { if (SEASONS[key].name.startsWith(e.target.textContent)) selectedSeason = key; });
                    const contentElement = card.querySelector('.card-content-wrapper');
                    const plantData = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                    if (plantData) renderCardContentAsync(contentElement, plant, plantData, selectedSeason);
                    return;
                }
                if (e.target.closest('.water-done-btn')) { e.stopPropagation(); showWaterTypeSelectionModal(plantId); return; }
                const plantData = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                if (plantData) showDetailsModal(plant, plantData);
            });
        }
        
        if (addPlantForm) {
            addPlantForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const speciesId = speciesSelect.value;
                const lastWateredDate = lastWateredInput.value;
                const inputName = plantNameInput.value.trim(); 
                if (speciesId && lastWateredDate) {
                    const selectedPlantData = PLANT_DATA.find(p => String(p.id) === String(speciesId));
                    const newPlant = {
                        id: generateUUID(),
                        speciesId: speciesId,
                        name: inputName || (selectedPlantData ? selectedPlantData.species : '植物'),
                        entryDate: getLocalTodayDate(),
                        waterLog: [{ date: lastWateredDate, type: 'WaterOnly' }],
                        repottingLog: [],
                        hasCustomImage: false
                    };
                    userPlants.push(newPlant);
                    saveUserPlants(userPlants);
                    renderPlantCards();
                    showNotification('植物を追加しました！', 'success');
                    plantNameInput.value = ''; speciesSelect.value = ''; nextWateringPreview.textContent = '';
                }
            });
        }
        
        function setupNotificationUI() {
            if (!notificationControlContainer) return;
            notificationControlContainer.innerHTML = '';
            const btn = document.createElement('button');
            btn.textContent = '通知設定を開く (未実装)'; btn.className = 'action-button secondary';
            btn.onclick = () => showNotification('通知機能は現在開発中です。', 'info');
            notificationControlContainer.appendChild(btn);
        }
        renderQuickSortButtons();
    }

    if (changePhotoButton && customImageInput) {
        changePhotoButton.onclick = () => customImageInput.click();
        customImageInput.onchange = async (e) => {
            if (!customImageInput.files || !customImageInput.files[0]) return;
            const file = customImageInput.files[0];
            try {
                showNotification('画像を処理中...', 'success', 1000);
                const compressedBlob = await compressImage(file);
                if (currentPlantId !== null) {
                    await saveImageToDB(currentPlantId, compressedBlob);
                    const plantIndex = userPlants.findIndex(p => String(p.id) === String(currentPlantId));
                    if (plantIndex !== -1) {
                        userPlants[plantIndex].hasCustomImage = true;
                        saveUserPlants(userPlants);
                        const detailImage = plantDetails.querySelector('.detail-image');
                        if (detailImage) detailImage.src = createManagedObjectURL(compressedBlob);
                        renderPlantCards(); 
                        showNotification('写真を変更しました！', 'success');
                    }
                }
            } catch (err) { showNotification('画像の保存に失敗しました', 'error'); }
            customImageInput.value = '';
        };
    }

    // 【修正箇所】履歴の再ソートと3月移行期のアラート表示を追加したレンダリング
    async function renderCardContentAsync(container, userPlant, data, seasonKey) {
        let imgSrc = `${IMAGE_BASE_PATH}${data.img}`;
        if (userPlant.hasCustomImage) {
            const storedData = await getImageFromDB(userPlant.id);
            if (storedData) imgSrc = (storedData instanceof Blob) ? createManagedObjectURL(storedData) : storedData;
        }

        // 履歴を確実に日付順にソートして最新を取得
        const sortedLog = [...userPlant.waterLog].sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastLog = sortedLog[0] || { date: userPlant.entryDate, type: 'WaterOnly' };
        
        const seasonData = data.management[seasonKey];
        const nextDateString = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        
        // 3月特有のアラート表示判定
        const currentMonth = new Date().getMonth() + 1;
        const transitionAlert = (currentMonth === 3) ? '<div class="alert-box">⚠️ 春の管理移行期：土の乾きを優先確認</div>' : '';

        const html = `
            <div class="card-image">
                <img src="${imgSrc}" loading="lazy" style="object-fit: cover;">
            </div>
            <div class="card-header">
                <h3>${escapeHTML(userPlant.name)}</h3>
                <p>${escapeHTML(data.species)}</p>
            </div>
            ${transitionAlert}
            <div class="status-box">
                ${SEASONS[seasonKey].name.split(' ')[0]}: **${escapeHTML(getSeasonRisk(seasonKey, data))}**
            </div>
            <h4>現在の管理</h4>
            <ul>
                <li>**水:** ${escapeHTML(seasonData.water)}</li>
                <li>**葉水:** ${escapeHTML(seasonData.mist || 'なし')}</li>
                <li>**次回目安:** ${nextDateString ? formatJapaneseDate(nextDateString) : '未定（断水期）'}</li>
            </ul>
        `;
        container.innerHTML = html;
        container.style.opacity = '0';
        requestAnimationFrame(() => container.style.opacity = '1');
        container.style.transition = 'opacity 0.3s ease';
    }

    function renderPlantCards() {
        if (!plantCardList) return;
        revokeAllObjectUrls();
        const seasonKey = getCurrentSeason();
        const sortedPlants = sortAndFilterPlants();
        if (sortedPlants.length === 0) {
            plantCardList.innerHTML = `<div class="empty-state"><p>植物が登録されていません。</p></div>`;
            return;
        }
        const fragment = document.createDocumentFragment();
        const cardContainer = document.createElement('div');
        cardContainer.className = 'plant-card-container';
        sortedPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(d => String(d.id) === String(userPlant.speciesId));
            if (data) {
                const card = createPlantCardSkeleton(userPlant, data, seasonKey);
                cardContainer.appendChild(card);
                renderCardContentAsync(card.querySelector('.card-content-wrapper'), userPlant, data, seasonKey);
            }
        });
        plantCardList.innerHTML = ''; plantCardList.appendChild(cardContainer);
        if (currentSort !== 'nextWateringDate') {
            new Sortable(cardContainer, {
                animation: 150, handle: '.drag-handle', delay: 100, delayOnTouchOnly: true,
                onEnd: function () {
                    const newOrderIds = Array.from(cardContainer.children).map(card => String(card.dataset.id));
                    const visibleItems = [];
                    const idMap = new Map(newOrderIds.map((id, idx) => [id, idx]));
                    userPlants.forEach((p, idx) => { if (idMap.has(String(p.id))) visibleItems.push({ p, idx }); });
                    const slots = visibleItems.map(item => item.idx).sort((a, b) => a - b);
                    visibleItems.sort((a, b) => idMap.get(String(a.p.id)) - idMap.get(String(b.p.id)));
                    slots.forEach((slot, i) => userPlants[slot] = visibleItems[i].p);
                    saveUserPlants(userPlants);
                }
            });
        }
    }

    function createPlantCardSkeleton(userPlant, data, activeSeasonKey) {
        const card = document.createElement('div');
        card.className = 'plant-card';
        card.setAttribute('data-id', String(userPlant.id));
        card.innerHTML = `
            <div class="controls"><span class="drag-handle">☰</span><button class="delete-btn">×</button></div>
            <div class="season-selector">
                ${['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].map(key => `
                    <button class="${key === activeSeasonKey ? 'active' : ''}">${SEASONS[key].name.split(' ')[0]}</button>
                `).join('')}
            </div>
            <div class="card-content-wrapper"><div style="padding:20px; text-align:center;">Loading...</div></div>
            <div class="card-footer"><button class="action-button tertiary water-done-btn">💧 記録</button></div>
        `;
        return card;
    }

    function sortAndFilterPlants() {
        let filtered = [...userPlants];
        if (currentFilter !== 'all') {
            const th = TEMP_FILTER_MAP[currentFilter];
            if (th !== undefined) filtered = filtered.filter(p => (PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId))?.minTemp >= th));
        }
        filtered.sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name);
            if (currentSort === 'entryDate') return new Date(b.entryDate) - new Date(a.entryDate); 
            if (currentSort === 'minTemp') return (PLANT_DATA.find(pd => String(pd.id) === String(a.speciesId))?.minTemp || 0) - (PLANT_DATA.find(pd => String(pd.id) === String(b.speciesId))?.minTemp || 0);
            return 0;
        });
        if (currentSort === 'nextWateringDate') {
            const seasonKey = getCurrentSeason();
            filtered.sort((a, b) => {
                const getNext = (p) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                    if (!d) return 9e12;
                    const last = p.waterLog[0] || { date: p.entryDate };
                    const next = calculateNextWateringDate(last.date, d.management[seasonKey].waterIntervalDays);
                    return next ? new Date(next).getTime() : 9e12;
                };
                return getNext(a) - getNext(b);
            });
        }
        return filtered;
    }

    // 【修正箇所】季節リスク判定に3月の移行期説明を追加
    function getSeasonRisk(seasonKey, data) {
        const currentMonth = new Date().getMonth() + 1;
        if (currentMonth === 3 && seasonKey === 'SPRING') {
            return '冬からの移行期（徐々に回数を増やす）';
        }
        if (seasonKey === 'WINTER') return data.minTemp >= 10 ? '厳重な保温が必要' : '寒さ対策';
        if (seasonKey === 'SUMMER') return '水切れ・蒸れに注意';
        return '成長期';
    }

    async function showDetailsModal(userPlant, plantData) {
        if (!detailsModal) return;
        currentPlantId = userPlant.id;
        if (detailPlantName) detailPlantName.textContent = userPlant.name;
        if (detailSpeciesName) detailSpeciesName.textContent = plantData.species;
        let imgSrc = `${IMAGE_BASE_PATH}${plantData.img}`;
        if (userPlant.hasCustomImage) {
            const storedData = await getImageFromDB(userPlant.id);
            if (storedData) imgSrc = (storedData instanceof Blob) ? createManagedObjectURL(storedData) : storedData;
        }
        const existingImg = plantDetails.querySelector('.detail-image-container');
        if (existingImg) existingImg.remove();
        const detailImgContainer = document.createElement('div');
        detailImgContainer.className = 'detail-image-container';
        detailImgContainer.innerHTML = `<img src="${imgSrc}" class="detail-image">`;
        detailImgContainer.onclick = () => openLightbox(imgSrc);
        plantDetails.prepend(detailImgContainer);
        
        if(entryDateDisplay) {
            entryDateDisplay.textContent = formatJapaneseDate(userPlant.entryDate);
            const diffDays = Math.ceil(Math.abs(new Date() - new Date(userPlant.entryDate)) / (1000*60*60*24)); 
            timeSinceEntryDisplay.textContent = `${diffDays}日目`;
        }
        if(purchaseDateDisplay) purchaseDateDisplay.textContent = userPlant.purchaseDate ? formatJapaneseDate(userPlant.purchaseDate) : '未設定';
        if(repottingDateDisplay) repottingDateDisplay.textContent = userPlant.repottingLog[0] ? formatJapaneseDate(userPlant.repottingLog[0].date) : '未設定';

        const seasonData = plantData.management[getCurrentSeason()];
        const seasonContent = document.getElementById('season-care-content');
        if(seasonContent) {
            seasonContent.innerHTML = `<ul><li><strong>水やり:</strong> ${escapeHTML(seasonData.water)}</li><li><strong>葉水:</strong> ${escapeHTML(seasonData.mist || 'なし')}</li><li><strong>光:</strong> ${escapeHTML(seasonData.light)}</li></ul>`;
            seasonContent.classList.add('expanded');
        }
        renderWaterHistory(userPlant.waterLog, userPlant.id);
        renderRepottingHistory(userPlant.repottingLog);
        if (waterDoneInDetailContainer) {
            waterDoneInDetailContainer.innerHTML = ''; 
            const btn = document.createElement('button');
            btn.className = 'action-button water-done-btn-detail'; btn.textContent = '💧 水やり完了 (内容選択)';
            waterDoneInDetailContainer.appendChild(btn);
        }
        if (detailsModal.style.display !== 'block') {
            detailsModal.style.display = 'block'; toggleBodyScroll(true);
        }
    }

    function showWaterTypeSelectionModal(plantId) {
        const plant = userPlants.find(p => String(p.id) === String(plantId));
        if (!plant || !waterTypeModal) return;
        const today = getLocalTodayDate();
        if(waterTypeModalTitle) waterTypeModalTitle.textContent = `「${escapeHTML(plant.name)}」の水やり内容`;
        if(waterDateDisplay) waterDateDisplay.textContent = formatJapaneseDate(today) + ' に完了'; 
        if(waterTypeOptionsContainer) {
            waterTypeOptionsContainer.innerHTML = '';
            Object.keys(WATER_TYPES).forEach(key => {
                const btn = document.createElement('button');
                btn.textContent = WATER_TYPES[key].name; btn.className = 'action-button';
                btn.onclick = () => updateLastWatered(String(plantId), key, today);
                waterTypeOptionsContainer.appendChild(btn);
            });
        }
        waterTypeModal.style.display = 'block';
    }

    function renderWaterHistory(logs, id) {
        if (!waterHistoryList) return;
        waterHistoryList.innerHTML = logs.length ? '' : '<li>なし</li>';
        [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((log, idx) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${formatJapaneseDate(log.date)}</span><button class="delete-log-btn" data-plantid="${id}" data-index="${idx}">×</button>`;
            waterHistoryList.appendChild(li);
        });
    }

    function formatJapaneseDate(d) {
        const date = new Date(d);
        return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
    }

    function renderQuickSortButtons() {
        if (!quickSortButtonsContainer) return;
        const quickSorts = [{ v: 'nextWateringDate', l: '💧 急ぎ' }, { v: 'name', l: '🌱 名前順' }, { v: 'entryDate', l: '📅 登録順' }];
        quickSortButtonsContainer.innerHTML = '';
        quickSorts.forEach(s => {
            const btn = document.createElement('button');
            btn.textContent = s.l; btn.className = (currentSort === s.v) ? 'active' : '';
            btn.onclick = () => { currentSort = s.v; localStorage.setItem('sort-select', s.v); renderPlantCards(); renderQuickSortButtons(); };
            quickSortButtonsContainer.appendChild(btn);
        });
    }

    initializeApp();
});

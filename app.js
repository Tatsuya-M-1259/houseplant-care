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

    // メモリリーク対策用のURL管理セット
    const objectUrls = new Set();

    // ----------------------------------------------------
    // 1. Utilities (UUID, Image, Memory Mgmt)
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
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
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
                if (!validIds.has(storedId)) {
                    cursor.delete();
                }
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
            if (!Array.isArray(userPlants[plantIndex].waterLog)) {
                userPlants[plantIndex].waterLog = [];
            }
            const isDuplicate = userPlants[plantIndex].waterLog.some(log => log.date === date && log.type === type);
            if (!isDuplicate) {
                userPlants[plantIndex].waterLog.unshift(newLogEntry);
            }
            userPlants[plantIndex].waterLog.sort((a, b) => new Date(b.date) - new Date(a.date));

            saveUserPlants(userPlants);
            renderPlantCards(); 
            showNotification(`${userPlants[plantIndex].name} の記録完了！`, 'success');
            
            waterTypeModal.style.display = 'none';
            
            const isDetailOpen = detailsModal.style.display === 'block';
            if (isDetailOpen) {
                 const plantData = PLANT_DATA.find(p => String(p.id) === String(userPlants[plantIndex].speciesId));
                 if (plantData) {
                    showDetailsModal(userPlants[plantIndex], plantData);
                 }
            } else {
                 toggleBodyScroll(false); 
            }
        }
    }

    // ----------------------------------------------------
    // DOM Elements
    // ----------------------------------------------------
    const plantCardList = document.getElementById('plant-card-list'); 
    const plantNameInput = document.getElementById('plant-name'); 
    const editNameButton = document.getElementById('edit-plant-name-button'); 
    const speciesSelect = document.getElementById('species-select');
    const addPlantForm = document.getElementById('add-plant-form');
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    const globalSeasonSelect = document.getElementById('global-season-select');
    const nextWateringPreview = document.getElementById('next-watering-preview');
    const setTodayButton = document.getElementById('set-today-button');
    const notificationControlContainer = document.getElementById('notification-control-container');
    const quickSortButtonsContainer = document.getElementById('quick-sort-buttons');
    const lastUpdateDisplay = document.getElementById('last-update-display');
    const lastWateredInput = document.getElementById('last-watered');
    
    const detailsModal = document.getElementById('details-modal'); 
    const closeDetailButton = detailsModal ? detailsModal.querySelector('.close-button') : null; 
    const plantDetails = document.getElementById('plant-details'); 
    const detailPlantName = document.getElementById('detail-plant-name');
    const detailSpeciesName = document.getElementById('detail-species-name');
    const prevPlantBtn = document.getElementById('prev-plant-btn');
    const nextPlantBtn = document.getElementById('next-plant-btn');

    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    
    const purchaseDateDisplay = document.getElementById('purchase-date-display');
    const editPurchaseDateButton = document.getElementById('edit-purchase-date-button');
    const waterDoneInDetailContainer = document.getElementById('water-done-in-detail'); 
    const entryDateDisplay = document.getElementById('entry-date-display');
    const timeSinceEntryDisplay = document.getElementById('time-since-entry-display');
    const repottingDateDisplay = document.getElementById('repotting-date-display');
    const editRepottingDateButton = document.getElementById('edit-repotting-date-button'); 
    
    const customImageInput = document.getElementById('custom-image-input');
    const changePhotoButton = document.getElementById('change-photo-button');

    const waterHistoryList = document.getElementById('water-history-list');
    const repottingHistoryList = document.getElementById('repotting-history-list');

    const purchaseDateModal = document.getElementById('purchase-date-modal');
    const closePurchaseDateButton = purchaseDateModal ? purchaseDateModal.querySelector('.close-button-purchase-date') : null;
    const purchaseDateInput = document.getElementById('purchase-date-input');
    const savePurchaseDateButton = document.getElementById('save-purchase-date-button');
    
    const repottingDateModal = document.getElementById('repotting-date-modal');
    const closeRepottingDateButton = repottingDateModal ? repottingDateModal.querySelector('.close-button-repotting-date') : null;
    const repottingDateInput = document.getElementById('repotting-date-input');
    const saveRepottingDateButton = document.getElementById('save-repotting-date-button');
    
    const waterTypeModal = document.getElementById('water-type-modal');
    const closeWaterTypeButton = waterTypeModal ? waterTypeModal.querySelector('.close-button-water-type') : null;
    const waterTypeModalTitle = document.getElementById('water-type-modal-title');
    const waterDateDisplay = document.getElementById('water-date-display');
    const waterTypeOptionsContainer = document.getElementById('water-type-options');

    const exportButton = document.getElementById('export-data-button');
    const exportIncludeImages = document.getElementById('export-include-images'); 
    const importButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');
    const importFileNameDisplay = document.getElementById('import-file-name');
    
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    
    const NOTIFICATION_AREA_ID = 'custom-notification-area';
    let notificationArea = document.getElementById(NOTIFICATION_AREA_ID);
    if (!notificationArea) {
        notificationArea = document.createElement('div');
        notificationArea.id = NOTIFICATION_AREA_ID;
        document.body.appendChild(notificationArea);
    }
    
    if (lastWateredInput) {
        const today = getLocalTodayDate();
        lastWateredInput.setAttribute('max', today);
        lastWateredInput.value = today; 
    }

    let userPlants = [];
    let currentPlantId = null;

    try {
        userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    } catch (e) {
        console.error("Data Load Error:", e);
        userPlants = [];
    }
    
    function validatePlantData(plant) {
        if (!plant || typeof plant !== 'object') return null;
        const safePlant = { ...plant };
        if (!safePlant.id) safePlant.id = generateUUID();
        else safePlant.id = String(safePlant.id); 
        if (!safePlant.speciesId) safePlant.speciesId = '1';
        else safePlant.speciesId = String(safePlant.speciesId);
        if (!safePlant.name) safePlant.name = '名無し';
        if (!safePlant.entryDate) safePlant.entryDate = getLocalTodayDate();
        if (!Array.isArray(safePlant.waterLog)) safePlant.waterLog = [];
        if (!Array.isArray(safePlant.repottingLog)) safePlant.repottingLog = [];
        if (safePlant._exportImageData) delete safePlant._exportImageData;
        return safePlant;
    }

    function normalizePlantData(plants) {
        if (!Array.isArray(plants)) return [];
        return plants.map(validatePlantData).filter(p => p !== null);
    }
    userPlants = normalizePlantData(userPlants);
    
    // ----------------------------------------------------
    // Logic: Season & Dates
    // ----------------------------------------------------

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
                nextWateringPreview.classList.remove('alert-date');
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

        // Global Event Delegation
        window.addEventListener('click', (e) => {
            if (e.target === waterTypeModal) {
                waterTypeModal.style.display = 'none';
                return;
            }
            if (e.target === purchaseDateModal) {
                purchaseDateModal.style.display = 'none';
                return;
            }
            if (e.target === repottingDateModal) {
                repottingDateModal.style.display = 'none';
                return;
            }
            if (e.target === lightboxModal) {
                closeLightbox();
                return;
            }
            if (e.target === detailsModal) {
                closeDetailModal();
                return;
            }

            const waterBtn = e.target.closest('.water-done-btn-detail');
            if (waterBtn && currentPlantId) {
                showWaterTypeSelectionModal(currentPlantId);
                return;
            }
            
            const deleteLogBtn = e.target.closest('.delete-log-btn');
            if (deleteLogBtn) {
                const id = deleteLogBtn.dataset.plantid;
                const idx = parseInt(deleteLogBtn.dataset.index);
                if (id && !isNaN(idx)) {
                    deleteWaterLog(id, idx);
                }
                return;
            }
        });

        window.addEventListener('popstate', (e) => {
            if (detailsModal.style.display === 'block') {
                detailsModal.style.display = 'none';
                currentPlantId = null;
                toggleBodyScroll(false); 
            }
            if (waterTypeModal) waterTypeModal.style.display = 'none';
            if (purchaseDateModal) purchaseDateModal.style.display = 'none';
            if (repottingDateModal) repottingDateModal.style.display = 'none';
            if (lightboxModal) lightboxModal.classList.remove('active');
        });

        const closeDetailModal = () => {
            if (history.state && history.state.modal === 'details') {
                history.back(); 
            } else { 
                detailsModal.style.display = 'none'; 
                currentPlantId = null; 
                toggleBodyScroll(false); 
            }
        };
        if (closeDetailButton) closeDetailButton.onclick = closeDetailModal;
        
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
            
            if (targetData) {
                showDetailsModal(targetPlant, targetData);
            } else {
                console.warn("Plant data not found for:", targetPlant.name);
            }
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
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        if (plantCardList) {
            plantCardList.addEventListener('click', (e) => {
                const card = e.target.closest('.plant-card');
                if (!card) return;
                const plantId = card.dataset.id;
                const plant = userPlants.find(p => String(p.id) === String(plantId));
                
                if (e.target.closest('.delete-btn')) {
                    e.stopPropagation();
                    deletePlantCard(plantId);
                    return;
                }
                if (e.target.tagName === 'BUTTON' && e.target.parentElement.classList.contains('season-selector')) {
                    e.stopPropagation();
                    const buttons = e.target.parentElement.querySelectorAll('button');
                    buttons.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    let selectedSeason = 'SPRING';
                    Object.keys(SEASONS).forEach(key => {
                        if (SEASONS[key].name.startsWith(e.target.textContent)) selectedSeason = key;
                    });
                    const contentElement = card.querySelector('.card-content-wrapper');
                    const plantData = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                    if (plantData) {
                        renderCardContentAsync(contentElement, plant, plantData, selectedSeason);
                    }
                    return;
                }
                if (e.target.closest('.water-done-btn')) {
                    e.stopPropagation();
                    showWaterTypeSelectionModal(plantId);
                    return;
                }
                
                const plantData = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                if (plantData) {
                    showDetailsModal(plant, plantData);
                } else {
                    showNotification("植物データの読み込みに失敗しました", "error");
                }
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
        
                    plantNameInput.value = ''; 
                    speciesSelect.value = '';
                    nextWateringPreview.textContent = '';
                }
            });
        }
        
        function setupNotificationUI() {
            if (!notificationControlContainer) return;
            notificationControlContainer.innerHTML = '';
            
            const btn = document.createElement('button');
            btn.textContent = '通知設定を開く (未実装)';
            btn.className = 'action-button secondary';
            btn.onclick = () => showNotification('通知機能は現在開発中です。', 'info');
            notificationControlContainer.appendChild(btn);
        }

        renderQuickSortButtons();
    } // end initializeApp

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
            } catch (err) {
                console.error(err);
                showNotification('画像の保存に失敗しました', 'error');
            }
            customImageInput.value = '';
        };
    }

    const collectAllData = async (includeImages = true) => {
        const plantsToExport = JSON.parse(JSON.stringify(userPlants));
        if (includeImages) {
            for (const plant of plantsToExport) {
                if (plant.hasCustomImage) {
                    try {
                        const imageData = await getImageFromDB(plant.id);
                         if (imageData instanceof Blob) {
                            const reader = new FileReader();
                            plant._exportImageData = await new Promise(resolve => {
                                reader.onload = e => resolve(e.target.result);
                                reader.readAsDataURL(imageData);
                            });
                         } else if (imageData) {
                             plant._exportImageData = imageData; 
                         }
                    } catch (e) {
                        console.warn(`画像のエクスポートに失敗: ${plant.name}`, e);
                    }
                }
            }
        }
        return { userPlants: plantsToExport, version: 1.1, exportedAt: Date.now() };
    };

    if (exportButton) {
        exportButton.onclick = async () => {
            try {
                const includeImages = exportIncludeImages ? exportIncludeImages.checked : true;
                showNotification(includeImages ? 'バックアップデータを作成中...' : 'テキストデータを作成中...', 'success', 1000);
                
                const data = await collectAllData(includeImages);
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                const now = new Date();
                const dateStr = now.getFullYear() +
                                String(now.getMonth()+1).padStart(2,'0') + 
                                String(now.getDate()).padStart(2,'0') + '-' + 
                                String(now.getHours()).padStart(2,'0') + 
                                String(now.getMinutes()).padStart(2,'0');
                a.download = `houseplant_backup_${dateStr}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                localStorage.setItem('last_export_time', Date.now());
                renderLastUpdateTime();
                showNotification('エクスポートが完了しました。', 'success');
            } catch (e) {
                console.error(e);
                showNotification('エクスポートに失敗しました。', 'error');
            }
        };
    }

    if (importButton) {
        importButton.onclick = () => importFileInput.click();
    }

    if (importFileInput) {
        importFileInput.onchange = (e) => {
            if (importFileInput.files.length > 0) {
                importFileNameDisplay.textContent = importFileInput.files[0].name;
                processImportFile(importFileInput.files[0]);
            } else {
                importFileNameDisplay.textContent = 'ファイル未選択';
            }
        };
    }

    const processImportFile = (file) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                let loadedPlants = [];
                if (importedData.userPlants && Array.isArray(importedData.userPlants)) {
                    loadedPlants = importedData.userPlants;
                } else if (Array.isArray(importedData)) {
                    loadedPlants = importedData;
                } else {
                    throw new Error('データ形式が正しくありません。');
                }
                
                showCustomConfirm('現在のデータを上書きします。よろしいですか？', async () => {
                    try {
                        loadedPlants = normalizePlantData(loadedPlants);
                        for (const plant of loadedPlants) {
                            if (plant._exportImageData) {
                                // Base64画像をBlobに変換して保存
                                try {
                                    const blob = base64ToBlob(plant._exportImageData);
                                    await saveImageToDB(plant.id, blob);
                                    plant.hasCustomImage = true;
                                } catch (err) {
                                    console.warn("画像変換エラー:", err);
                                    await saveImageToDB(plant.id, plant._exportImageData);
                                    plant.hasCustomImage = true;
                                }
                                delete plant._exportImageData; 
                            }
                        }
                        userPlants = loadedPlants;
                        saveUserPlants(userPlants);
                        renderPlantCards();
                        showNotification('インポートが完了しました。', 'success');
                    } catch (err) {
                        console.error(err);
                        showNotification('画像の復元中にエラーが発生しました。', 'error');
                    }
                });
            } catch (error) {
                showNotification('インポート失敗: ' + error.message, 'error', 5000); 
            } finally {
                if(importFileInput) {
                    importFileInput.value = '';
                    importFileNameDisplay.textContent = 'ファイル未選択';
                }
            }
        };
        reader.readAsText(file);
    };

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
                const contentWrapper = card.querySelector('.card-content-wrapper');
                renderCardContentAsync(contentWrapper, userPlant, data, seasonKey);
            }
        });

        plantCardList.innerHTML = '';
        plantCardList.appendChild(cardContainer);
        
        if (currentSort !== 'nextWateringDate') {
            new Sortable(cardContainer, {
                animation: 150,
                handle: '.drag-handle', 
                delay: 100, 
                delayOnTouchOnly: true,
                touchStartThreshold: 5, 
                ghostClass: 'sortable-ghost', 
                onEnd: function (evt) {
                    const newOrderIds = Array.from(cardContainer.children).map(card => String(card.dataset.id));
                    const visibleItemsInMain = [];
                    const idToIndexMap = new Map(newOrderIds.map((id, index) => [id, index]));
                    userPlants.forEach((p, index) => {
                        if (idToIndexMap.has(String(p.id))) {
                            visibleItemsInMain.push({ plant: p, originalIndex: index });
                        }
                    });
                    const slotIndices = visibleItemsInMain.map(item => item.originalIndex).sort((a, b) => a - b);
                    visibleItemsInMain.sort((a, b) => {
                        const indexA = idToIndexMap.get(String(a.plant.id));
                        const indexB = idToIndexMap.get(String(b.plant.id));
                        return indexA - indexB;
                    });
                    slotIndices.forEach((slotIndex, i) => {
                        userPlants[slotIndex] = visibleItemsInMain[i].plant;
                    });
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
            <div class="controls">
                <span class="drag-handle">☰</span>
                <button class="delete-btn">×</button>
            </div>
            <div class="season-selector">
                ${['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].map(key => `
                    <button class="${key === activeSeasonKey ? 'active' : ''}">${SEASONS[key].name.split(' ')[0]}</button>
                `).join('')}
            </div>
            <div class="card-content-wrapper">
                <div style="padding:20px; text-align:center;">Loading...</div>
            </div>
            <div class="card-footer">
                <button class="action-button tertiary water-done-btn">💧 記録</button>
            </div>
        `;
        return card;
    }

    async function renderCardContentAsync(container, userPlant, data, seasonKey) {
        let imgSrc = `${IMAGE_BASE_PATH}${data.img}`;
        if (userPlant.hasCustomImage) {
            const storedData = await getImageFromDB(userPlant.id);
            if (storedData) {
                if (storedData instanceof Blob) {
                    imgSrc = createManagedObjectURL(storedData);
                } else {
                    imgSrc = storedData;
                }
            }
        }

        const seasonData = data.management[seasonKey];
        const lastLog = userPlant.waterLog[0] || { date: userPlant.entryDate, type: 'WaterOnly' };
        const nextDateString = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        const mistingInfo = seasonData.mist || 'データなし';
        
        const html = `
            <div class="card-image">
                <img src="${imgSrc}" loading="lazy" style="object-fit: cover;">
            </div>
            <div class="card-header">
                <h3>${escapeHTML(userPlant.name)}</h3>
                <p>${escapeHTML(data.species)}</p>
            </div>
            <div class="status-box">
                ${SEASONS[seasonKey].name.split(' ')[0]}: **${escapeHTML(getSeasonRisk(seasonKey, data))}**
            </div>
            <h4>現在の管理</h4>
            <ul>
                <li>**水:** ${escapeHTML(seasonData.water)}</li>
                <li>**葉水:** ${escapeHTML(mistingInfo)}</li>
                <li>**次回:** ${nextDateString ? formatJapaneseDate(nextDateString) : '未定'}</li>
            </ul>
        `;
        container.innerHTML = html;
        container.style.opacity = '0';
        requestAnimationFrame(() => container.style.opacity = '1');
        container.style.transition = 'opacity 0.3s ease';
    }

    function sortAndFilterPlants() {
        let filtered = [...userPlants];
        if (currentFilter !== 'all') {
            const th = TEMP_FILTER_MAP[currentFilter];
            if (th !== undefined) {
                filtered = filtered.filter(p => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                    if (!d) return false;
                    return d.minTemp >= th;
                });
            }
        }
        filtered.sort((a, b) => {
            if (currentSort === 'name') return a.name.localeCompare(b.name);
            if (currentSort === 'entryDate') return new Date(b.entryDate) - new Date(a.entryDate); 
            if (currentSort === 'minTemp') {
                const dataA = PLANT_DATA.find(pd => String(pd.id) === String(a.speciesId));
                const dataB = PLANT_DATA.find(pd => String(pd.id) === String(b.speciesId));
                if (!dataA || !dataB) return 0;
                return dataA.minTemp - dataB.minTemp; 
            }
            return 0;
        });
        if (currentSort === 'nextWateringDate') {
            const seasonKey = getCurrentSeason();
            filtered.sort((a, b) => {
                const getNextDate = (plant) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                    if (!d) return 9999999999999;
                    const last = plant.waterLog[0] || { date: plant.entryDate };
                    const next = calculateNextWateringDate(last.date, d.management[seasonKey].waterIntervalDays);
                    return next ? new Date(next).getTime() : 9999999999999;
                };
                return getNextDate(a) - getNextDate(b);
            });
        }
        return filtered;
    }

    async function showDetailsModal(userPlant, plantData) {
        if (!detailsModal) return;
        currentPlantId = userPlant.id;
        
        if (detailPlantName) detailPlantName.textContent = userPlant.name;
        if (detailSpeciesName) detailSpeciesName.textContent = plantData.species;

        let imgSrc = `${IMAGE_BASE_PATH}${plantData.img}`;
        if (userPlant.hasCustomImage) {
            const storedData = await getImageFromDB(userPlant.id);
            if (storedData) {
                if (storedData instanceof Blob) {
                    imgSrc = createManagedObjectURL(storedData);
                } else {
                    imgSrc = storedData;
                }
            }
        }

        const detailImageContainer = document.createElement('div');
        detailImageContainer.className = 'detail-image-container';
        detailImageContainer.innerHTML = `<img src="${imgSrc}" class="detail-image">`; 
        detailImageContainer.onclick = () => openLightbox(imgSrc);
        
        const existingImg = plantDetails.querySelector('.detail-image-container');
        if (existingImg) existingImg.remove();
        plantDetails.prepend(detailImageContainer);
        
        const seasonData = plantData.management[getCurrentSeason()];
        const maintenance = plantData.maintenance;
        
        if(entryDateDisplay) {
            entryDateDisplay.textContent = formatJapaneseDate(userPlant.entryDate);
            const diffTime = Math.abs(new Date() - new Date(userPlant.entryDate));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            timeSinceEntryDisplay.textContent = `${diffDays}日目`;
        }
        if(purchaseDateDisplay) purchaseDateDisplay.textContent = userPlant.purchaseDate ? formatJapaneseDate(userPlant.purchaseDate) : '未設定';
        if(repottingDateDisplay) {
            const lastRepot = userPlant.repottingLog[0] ? formatJapaneseDate(userPlant.repottingLog[0].date) : '未設定';
            repottingDateDisplay.textContent = lastRepot;
        }

        const seasonContent = document.getElementById('season-care-content');
        if(seasonContent) {
            seasonContent.innerHTML = `
                <ul>
                    <li><strong>水やり:</strong> ${escapeHTML(seasonData.water)}</li>
                    <li><strong>葉水:</strong> ${escapeHTML(seasonData.mist || 'なし')}</li>
                    <li><strong>光:</strong> ${escapeHTML(seasonData.light)}</li>
                    ${seasonData.tempRisk ? `<li><strong>寒さ対策:</strong> ${escapeHTML(seasonData.tempRisk)}</li>` : ''}
                </ul>
            `;
            seasonContent.classList.add('expanded');
            const h = document.querySelector('[data-target="season-care-content"]');
            if(h) h.classList.remove('collapsed');
        }

        const basicContent = document.getElementById('basic-maintenance-content');
        if(basicContent) {
            basicContent.innerHTML = `
                <ul>
                    <li><strong>難易度:</strong> ${escapeHTML(plantData.difficulty)}</li>
                    <li><strong>特徴:</strong> ${escapeHTML(plantData.feature)}</li>
                    <li><strong>最低越冬温度:</strong> ${escapeHTML(String(plantData.minTemp))}°C</li>
                    <li><strong>肥料:</strong> ${escapeHTML(maintenance.fertilizer)}</li>
                    <li><strong>植え替え:</strong> ${escapeHTML(maintenance.repotting)}</li>
                    <li><strong>剪定:</strong> ${escapeHTML(maintenance.pruning)}</li>
                </ul>
            `;
            basicContent.classList.remove('expanded');
            const h = document.querySelector('[data-target="basic-maintenance-content"]');
            if(h) h.classList.add('collapsed');
        }
        
        const waterList = document.getElementById('water-history-list');
        if(waterList) {
            waterList.classList.add('expanded');
            const h = document.querySelector('[data-target="water-history-list"]');
            if(h) h.classList.remove('collapsed');
        }
        const repotList = document.getElementById('repotting-history-list');
        if(repotList) {
            repotList.classList.remove('expanded');
            const h = document.querySelector('[data-target="repotting-history-list"]');
            if(h) h.classList.add('collapsed');
        }
        
        renderWaterHistory(userPlant.waterLog, userPlant.id);
        renderRepottingHistory(userPlant.repottingLog);
        
        if (waterDoneInDetailContainer) {
            waterDoneInDetailContainer.innerHTML = ''; 
            const waterButton = document.createElement('button');
            waterButton.className = 'action-button water-done-btn-detail'; 
            waterButton.textContent = '💧 水やり完了 (内容選択)';
            waterDoneInDetailContainer.appendChild(waterButton);
        }

        if (detailsModal.style.display !== 'block') {
            detailsModal.style.display = 'block';
            toggleBodyScroll(true);
            history.pushState({ modal: 'details' }, null, '#details');
        }
    }

    function showWaterTypeSelectionModal(plantId) {
        const strId = String(plantId);
        const plant = userPlants.find(p => String(p.id) === strId);
        if (!plant || !waterTypeModal) return;

        const today = getLocalTodayDate();
        if(waterTypeModalTitle) waterTypeModalTitle.textContent = `「${escapeHTML(plant.name)}」の水やり内容`;
        if(waterDateDisplay) waterDateDisplay.textContent = formatJapaneseDate(today) + ' に完了'; 
        
        if(waterTypeOptionsContainer) {
            waterTypeOptionsContainer.innerHTML = '';
            Object.keys(WATER_TYPES).forEach(key => {
                const typeData = WATER_TYPES[key];
                const button = document.createElement('button');
                button.textContent = typeData.name;
                button.className = 'action-button';
                button.onclick = () => updateLastWatered(strId, key, today);
                waterTypeOptionsContainer.appendChild(button);
            });
        }
        waterTypeModal.style.display = 'block';
    }

    if (editPurchaseDateButton) {
        editPurchaseDateButton.onclick = () => {
            if (currentPlantId === null) return;
            const plant = userPlants.find(p => String(p.id) === String(currentPlantId));
            const today = getLocalTodayDate();
            if (purchaseDateInput) {
                purchaseDateInput.value = plant && plant.purchaseDate ? plant.purchaseDate : today;
                purchaseDateInput.setAttribute('max', today);
            }
            purchaseDateModal.style.display = 'block';
        };
    }

    if (savePurchaseDateButton) {
        savePurchaseDateButton.onclick = () => {
            const newDate = purchaseDateInput.value;
            if (newDate && currentPlantId !== null) {
                const plantIndex = userPlants.findIndex(p => String(p.id) === String(currentPlantId));
                if (plantIndex !== -1) {
                    userPlants[plantIndex].purchaseDate = newDate;
                    saveUserPlants(userPlants);
                    if(purchaseDateDisplay) purchaseDateDisplay.textContent = formatJapaneseDate(newDate);
                    showNotification('購入日を保存しました。', 'success');
                }
                purchaseDateModal.style.display = 'none';
            } else {
                showNotification('日付を入力してください。', 'warning');
            }
        };
    }

    if (editRepottingDateButton) {
        editRepottingDateButton.onclick = () => {
            if (currentPlantId === null) return;
            repottingDateModal.style.display = 'block';
            const today = getLocalTodayDate();
            if(repottingDateInput) {
                repottingDateInput.setAttribute('max', today); 
                repottingDateInput.value = today; 
            }
        };
    }
    
    if (saveRepottingDateButton) {
        saveRepottingDateButton.onclick = () => {
            const newDate = repottingDateInput.value;
            if (newDate && currentPlantId !== null) {
                const userPlantIndex = userPlants.findIndex(p => String(p.id) === String(currentPlantId));
                if (userPlantIndex !== -1) {
                    const newRepottingEntry = { date: newDate };
                    if (!Array.isArray(userPlants[userPlantIndex].repottingLog)) {
                        userPlants[userPlantIndex].repottingLog = [];
                    }
                    userPlants[userPlantIndex].repottingLog.unshift(newRepottingEntry);
                    userPlants[userPlantIndex].repottingLog.sort((a, b) => new Date(b.date) - new Date(a.date));
                    saveUserPlants(userPlants); 
                }
                showNotification('植え替え記録を追加しました。', 'success');
                repottingDateModal.style.display = 'none';
                
                const plantData = PLANT_DATA.find(p => String(p.id) === String(userPlants[userPlantIndex].speciesId));
                showDetailsModal(userPlants[userPlantIndex], plantData);
                renderPlantCards();
            } else {
                showNotification('日付を入力してください。', 'warning');
            }
        };
    }

    function deletePlantCard(id) {
        const index = userPlants.findIndex(p => String(p.id) === String(id));
        if (index === -1) return;
        
        if (!window.confirm(`${userPlants[index].name} を削除しますか？\nこの操作は取り消せますが、画像データは一時的に保持されるだけです。`)) {
            return;
        }
        
        deletedPlantBackup = userPlants[index];
        deletedPlantIndex = index;
        
        userPlants.splice(index, 1);
        saveUserPlants(userPlants);
        
        renderPlantCards();
        
        showNotification('削除しました', 'warning', 5000, {
            text: '元に戻す',
            callback: () => {
                userPlants.splice(deletedPlantIndex, 0, deletedPlantBackup);
                saveUserPlants(userPlants);
                renderPlantCards();
            }
        });
        
        setTimeout(() => {
            if (!userPlants.find(p => String(p.id) === String(id))) {
                deleteImageFromDB(id).then(() => cleanupOrphanedImages());
            }
        }, 6000);
    }

    function renderWaterHistory(logs, id) {
        if (!waterHistoryList) return;
        waterHistoryList.innerHTML = logs.length ? '' : '<li>なし</li>';
        logs.forEach((log, idx) => {
            const li = document.createElement('li');
            const span = document.createElement('span');
            span.textContent = formatJapaneseDate(log.date);
            const btn = document.createElement('button');
            btn.textContent = '×';
            btn.className = 'delete-log-btn';
            btn.dataset.plantid = id;
            btn.dataset.index = idx;
            li.appendChild(span);
            li.appendChild(btn);
            waterHistoryList.appendChild(li);
        });
    }
    
    function renderRepottingHistory(logs) {
        if (!repottingHistoryList) return;
        repottingHistoryList.innerHTML = logs.length ? '' : '<li>なし</li>';
        logs.forEach(log => {
            const li = document.createElement('li');
            li.textContent = formatJapaneseDate(log.date);
            repottingHistoryList.appendChild(li);
        });
    }
    
    function openLightbox(src) {
        if(lightboxModal && lightboxImage) {
            lightboxImage.src = src;
            lightboxModal.classList.add('active');
        }
    }
    
    function closeLightbox() {
        if(lightboxModal) lightboxModal.classList.remove('active');
    }
    
    function deleteWaterLog(id, idx) {
        const pIndex = userPlants.findIndex(p => String(p.id) === String(id));
        if (pIndex > -1 && confirm('この水やり記録を削除しますか？')) {
            userPlants[pIndex].waterLog.splice(idx, 1);
            saveUserPlants(userPlants);
            showDetailsModal(userPlants[pIndex], PLANT_DATA.find(d => String(d.id) === userPlants[pIndex].speciesId));
        }
    }
    
    function getSeasonRisk(seasonKey, data) {
        if (seasonKey === 'WINTER') return data.minTemp >= 10 ? '厳重な保温が必要' : '寒さ対策';
        if (seasonKey === 'SUMMER') return '水切れ・蒸れに注意';
        return '成長期';
    }

    function formatJapaneseDate(d) {
        const date = new Date(d);
        return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
    }
    
    function renderQuickSortButtons() {
        if (!quickSortButtonsContainer) return;
        const quickSorts = [
            { value: 'nextWateringDate', label: '💧 急ぎ' },
            { value: 'name', label: '🌱 名前順' },
            { value: 'entryDate', label: '📅 登録順' }
        ];
        quickSortButtonsContainer.innerHTML = '';
        quickSorts.forEach(sort => {
            const button = document.createElement('button');
            button.textContent = sort.label;
            button.className = (currentSort === sort.value) ? 'active' : '';
            button.onclick = () => {
                currentSort = sort.value;
                localStorage.setItem('sort-select', currentSort);
                if (sortSelect) sortSelect.value = currentSort;
                renderPlantCards();
                renderQuickSortButtons();
            };
            quickSortButtonsContainer.appendChild(button);
        });
    }

    initializeApp();
});

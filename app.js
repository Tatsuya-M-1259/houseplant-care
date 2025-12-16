// app.js

// 🌟 データのインポート
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

    const IMAGE_BASE_PATH = './'; 
    const DB_NAME = 'HouseplantDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';

    let currentSort = localStorage.getItem('sort-select') || 'nextWateringDate';
    let currentFilter = localStorage.getItem('filter-select') || 'all';
    let currentGlobalSeason = localStorage.getItem('global-season-select') || 'AUTO';

    let deletedPlantBackup = null;
    let deletedPlantIndex = -1;
    let deleteTimeoutId = null;
    let db = null; // IndexedDB instance

    // ----------------------------------------------------
    // 1. IndexedDB Utilities (画像保存用)
    // ----------------------------------------------------
    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => {
                console.error("Database error: " + event.target.errorCode);
                reject(event.target.error);
            };
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

    // 🌟 ガベージコレクション
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
                    console.log(`Garbage Collecting: Removing orphaned image for ID ${storedId}`);
                    cursor.delete();
                }
                cursor.continue();
            }
        };
    }

    // ----------------------------------------------------
    // 2. 画像圧縮ユーティリティ
    // ----------------------------------------------------
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
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    // ----------------------------------------------------
    // ユーティリティ関数
    // ----------------------------------------------------
    function getLocalTodayDate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getPlaceholderImage() {
        return "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 300 200'%3e%3crect fill='%23e0e0e0' width='300' height='200'/%3e%3ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23888'%3eNo Image%3c/text%3e%3c/svg%3e";
    }

    window.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') {
            const placeholder = getPlaceholderImage();
            if (e.target.src !== placeholder) { 
                e.target.src = placeholder;
                e.target.alt = "画像読み込み失敗";
            }
        }
    }, true);

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
        toast.offsetHeight; // Force reflow
        toast.classList.add('show');

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                toast.addEventListener('transitionend', () => toast.remove());
            }, duration);
        }
    }

    function showCustomConfirm(message, onConfirm) {
        if (window.confirm(message)) {
            onConfirm();
        }
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
            if (detailsModal.style.display === 'block') {
                 const plantData = PLANT_DATA.find(p => String(p.id) === String(userPlants[plantIndex].speciesId));
                 showDetailsModal(userPlants[plantIndex], plantData);
            }
        }
    }

    // ----------------------------------------------------
    // DOM要素
    // ----------------------------------------------------
    const plantCardList = document.getElementById('plant-card-list'); 
    const speciesSelect = document.getElementById('species-select');
    const addPlantForm = document.getElementById('add-plant-form');
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    const globalSeasonSelect = document.getElementById('global-season-select');
    const nextWateringPreview = document.getElementById('next-watering-preview');
    const setTodayButton = document.getElementById('set-today-button');
    const notificationControlContainer = document.getElementById('notification-control-container');
    const prevPlantButton = document.getElementById('prev-plant-btn');
    const nextPlantButton = document.getElementById('next-plant-btn');
    const quickSortButtonsContainer = document.getElementById('quick-sort-buttons');
    const lastUpdateDisplay = document.getElementById('last-update-display');
    const lastWateredInput = document.getElementById('last-watered');
    
    // Modals
    const detailsModal = document.getElementById('details-modal'); 
    const closeDetailButton = detailsModal ? detailsModal.querySelector('.close-button') : null; 
    const plantDetails = document.getElementById('plant-details'); 
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
    const exportIncludeImages = document.getElementById('export-include-images'); // 🌟 追加
    const importButton = document.getElementById('import-data-button');
    const importFileInput = document.getElementById('import-file-input');
    const importFileNameDisplay = document.getElementById('import-file-name');
    
    // 🌟 Scroll to top button
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
    try {
        userPlants = JSON.parse(localStorage.getItem('userPlants')) || [];
    } catch (e) {
        console.error("Data Load Error:", e);
        userPlants = [];
    }
    
    // 🌟 バリデーション機能: データの健全性をチェックして補正
    function validatePlantData(plant) {
        // 必須フィールドの補完
        if (!plant.id) plant.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
        if (!plant.speciesId) plant.speciesId = '1'; // デフォルトID
        if (!plant.name) plant.name = '名無し';
        if (!plant.entryDate) plant.entryDate = getLocalTodayDate();
        if (!Array.isArray(plant.waterLog)) plant.waterLog = [];
        if (!Array.isArray(plant.repottingLog)) plant.repottingLog = [];
        // ゴミデータの削除
        if (plant._exportImageData) delete plant._exportImageData;
        return plant;
    }

    // データ正規化・移行
    function normalizePlantData(plants) {
        if (!Array.isArray(plants)) return [];
        return plants.map(p => {
            // IDを文字列型に統一
            p.id = String(p.id);
            p.speciesId = String(p.speciesId);
            return validatePlantData(p);
        });
    }
    userPlants = normalizePlantData(userPlants);
    
    // ----------------------------------------------------
    // ロジック
    // ----------------------------------------------------

    function getCurrentSeason() {
        if (currentGlobalSeason && currentGlobalSeason !== 'AUTO') {
            return currentGlobalSeason;
        }
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
        if (!lastDateString || intervalDays === INTERVAL_WATER_STOP || intervalDays == null || isNaN(intervalDays)) {
            return null;
        }
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

    async function initializeApp() {
        // DB初期化
        try {
            await initDB();
            console.log("IndexedDB Initialized.");
            // 🌟 起動時にゴミ掃除を実行
            cleanupOrphanedImages();
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
        
        // イベントリスナー設定
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
        
        // プレビュー更新ロジック
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

        // 共通クリックハンドラ
        window.addEventListener('click', (e) => {
            if (e.target === detailsModal) closeDetailModal();
            if (e.target === waterTypeModal) waterTypeModal.style.display = 'none';
            if (e.target === purchaseDateModal) purchaseDateModal.style.display = 'none';
            if (e.target === repottingDateModal) repottingDateModal.style.display = 'none';
            if (e.target === lightboxModal) closeLightbox();
        });

        // モーダル閉じるボタン系
        const closeDetailModal = () => {
            if (history.state && history.state.modal === 'details') history.back();
            else { detailsModal.style.display = 'none'; currentPlantId = null; }
        };
        if (closeDetailButton) closeDetailButton.onclick = closeDetailModal;
        
        // アコーディオン
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

        // 🌟 Scroll to top logic
        if (scrollToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) scrollToTopBtn.classList.add('visible');
                else scrollToTopBtn.classList.remove('visible');
            });
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // カードリスト イベントデリゲーション
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
                    // 個別カードの季節切り替えはUI上のみ（再描画）
                    const buttons = e.target.parentElement.querySelectorAll('button');
                    buttons.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    let selectedSeason = 'SPRING';
                    Object.keys(SEASONS).forEach(key => {
                        if (SEASONS[key].name.startsWith(e.target.textContent)) selectedSeason = key;
                    });
                    const contentElement = card.querySelector('.card-content-wrapper');
                    const plantData = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                    // Async rendering for image
                    renderCardContentAsync(contentElement, plant, plantData, selectedSeason);
                    return;
                }
                if (e.target.closest('.water-done-btn')) {
                    e.stopPropagation();
                    showWaterTypeSelectionModal(plantId);
                    return;
                }
                // 詳細モーダル表示
                showDetailsModal(plant, PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId)));
            });
        }

        renderQuickSortButtons();
    } // end initializeApp

    // ----------------------------------------------------
    // 写真変更ロジック
    // ----------------------------------------------------
    if (changePhotoButton && customImageInput) {
        changePhotoButton.onclick = () => customImageInput.click();
        
        customImageInput.onchange = async (e) => {
            if (!customImageInput.files || !customImageInput.files[0]) return;
            const file = customImageInput.files[0];
            
            try {
                showNotification('画像を処理中...', 'success', 1000);
                // 圧縮してBase64取得
                const compressedDataUrl = await compressImage(file);
                
                if (currentPlantId !== null) {
                    // IDBへ保存
                    await saveImageToDB(currentPlantId, compressedDataUrl);
                    
                    // localStorageのフラグ更新
                    const plantIndex = userPlants.findIndex(p => String(p.id) === String(currentPlantId));
                    if (plantIndex !== -1) {
                        userPlants[plantIndex].hasCustomImage = true;
                        saveUserPlants(userPlants);
                        
                        // UI更新
                        const detailImage = plantDetails.querySelector('.detail-image');
                        if (detailImage) detailImage.src = compressedDataUrl;
                        renderPlantCards(); // リストも更新
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

    // ----------------------------------------------------
    // エクスポート・インポートロジック (🌟 修正箇所)
    // ----------------------------------------------------
    
    // 🌟 画像データを含めてデータを収集する非同期関数
    const collectAllData = async (includeImages = true) => {
        // データをディープコピー
        const plantsToExport = JSON.parse(JSON.stringify(userPlants));
        
        if (includeImages) {
            // 画像がある植物について、IndexedDBからデータを取得して結合
            for (const plant of plantsToExport) {
                if (plant.hasCustomImage) {
                    try {
                        const imageData = await getImageFromDB(plant.id);
                        if (imageData) {
                            // 一時的にBase64データをプロパティに追加
                            plant._exportImageData = imageData;
                        }
                    } catch (e) {
                        console.warn(`画像のエクスポートに失敗: ${plant.name}`, e);
                    }
                }
            }
        }
        
        return {
            userPlants: plantsToExport,
            version: 1.0,
            exportedAt: Date.now()
        };
    };

    if (exportButton) {
        exportButton.onclick = async () => { // asyncにする
            try {
                const includeImages = exportIncludeImages ? exportIncludeImages.checked : true;
                showNotification(includeImages ? 'バックアップデータを作成中...' : 'テキストデータを作成中...', 'success', 1000);
                
                const data = await collectAllData(includeImages); // awaitで待機
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                const now = new Date();
                // ファイル名を見やすく整形 (YYYYMMDD-HHMM)
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
        importButton.onclick = () => {
            importFileInput.click();
        };
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
        reader.onload = async (e) => { // asyncにする
            try {
                const importedData = JSON.parse(e.target.result);
                let loadedPlants = [];
                
                if (importedData.userPlants && Array.isArray(importedData.userPlants)) {
                    loadedPlants = importedData.userPlants;
                } else if (Array.isArray(importedData)) {
                    // 古い形式のサポート
                    loadedPlants = importedData;
                } else {
                    throw new Error('データ形式が正しくありません。');
                }
                
                showCustomConfirm('現在のデータを上書きします。よろしいですか？', async () => { // async callback
                    try {
                        // 1. まずデータを正規化 (バリデーション含む)
                        loadedPlants = normalizePlantData(loadedPlants);
                        
                        // 2. 画像データの復元処理
                        for (const plant of loadedPlants) {
                            // エクスポートデータに画像が含まれている場合
                            if (plant._exportImageData) {
                                await saveImageToDB(plant.id, plant._exportImageData);
                                plant.hasCustomImage = true;
                                // 不要になった一時データを削除（localStorage節約）
                                delete plant._exportImageData; 
                            }
                        }
                        
                        // 3. 状態更新
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

    // ----------------------------------------------------
    // カードレンダリング (Async対応)
    // ----------------------------------------------------
    function renderPlantCards() {
        if (!plantCardList) return;
        const seasonKey = getCurrentSeason();
        const sortedPlants = sortAndFilterPlants(); // 既存ロジック使用

        if (sortedPlants.length === 0) {
            plantCardList.innerHTML = `<div class="empty-state"><p>植物が登録されていません。</p></div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        const cardContainer = document.createElement('div');
        cardContainer.className = 'plant-card-container';

        sortedPlants.forEach(userPlant => {
            const data = PLANT_DATA.find(d => String(d.id) === String(userPlant.speciesId));
            const card = createPlantCardSkeleton(userPlant, data, seasonKey);
            cardContainer.appendChild(card);
            
            // 中身を非同期で描画
            const contentWrapper = card.querySelector('.card-content-wrapper');
            renderCardContentAsync(contentWrapper, userPlant, data, seasonKey);
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
        
        // 枠組みだけ作成
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
        // 画像取得
        let imgSrc = `${IMAGE_BASE_PATH}${data.img}`;
        if (userPlant.hasCustomImage) {
            const customImg = await getImageFromDB(userPlant.id);
            if (customImg) imgSrc = customImg;
        }

        const seasonData = data.management[seasonKey];
        const lastLog = userPlant.waterLog[0] || { date: userPlant.entryDate, type: 'WaterOnly' };
        const nextDateString = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        const waterMethodSummary = (data.water_method || '').split('。')[0] + '。';
        const mistingInfo = seasonData.mist || 'データなし';
        
        // HTML生成
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
    }

    function sortAndFilterPlants() {
        // 既存のソートフィルタロジックを流用
        let filtered = [...userPlants];
        if (currentFilter !== 'all') {
            const tempMap = { 'temp10': 10, 'temp5': 5, 'temp0': 0 };
            const th = tempMap[currentFilter];
            filtered = filtered.filter(p => {
                const d = PLANT_DATA.find(pd => String(pd.id) === String(p.speciesId));
                return d.minTemp >= th;
            });
        }
        
        filtered.sort((a, b) => {
            if (currentSort === 'name') {
                return a.name.localeCompare(b.name);
            } else if (currentSort === 'entryDate') {
                return new Date(b.entryDate) - new Date(a.entryDate); 
            } else if (currentSort === 'minTemp') {
                const dataA = PLANT_DATA.find(pd => String(pd.id) === String(a.speciesId));
                const dataB = PLANT_DATA.find(pd => String(pd.id) === String(b.speciesId));
                return dataA.minTemp - dataB.minTemp; 
            } else if (currentSort === 'nextWateringDate') {
                // ここは簡易計算（厳密なソートのためには本来ここでAsync計算が必要だが、複雑化を避けるため既存ロジック踏襲）
                // 実際にはrender時に計算されるが、ソート用には同期的に計算できる範囲で行う
                return 0; // 暫定
            }
            return 0;
        });
        
        // nextWateringDateソートの再実装（簡易版）
        if (currentSort === 'nextWateringDate') {
            const seasonKey = getCurrentSeason();
            filtered.sort((a, b) => {
                const getNextDate = (plant) => {
                    const d = PLANT_DATA.find(pd => String(pd.id) === String(plant.speciesId));
                    const last = plant.waterLog[0] || { date: plant.entryDate };
                    const next = calculateNextWateringDate(last.date, d.management[seasonKey].waterIntervalDays);
                    return next ? new Date(next).getTime() : 9999999999999;
                };
                return getNextDate(a) - getNextDate(b);
            });
        }

        return filtered;
    }

    // ----------------------------------------------------
    // 詳細モーダル表示 (Async Image)
    // ----------------------------------------------------
    async function showDetailsModal(userPlant, plantData) {
        if (!detailsModal) return;
        currentPlantId = userPlant.id;
        
        let imgSrc = `${IMAGE_BASE_PATH}${plantData.img}`;
        if (userPlant.hasCustomImage) {
            const customImg = await getImageFromDB(userPlant.id);
            if (customImg) imgSrc = customImg;
        }

        // DOM更新
        const detailImageContainer = document.createElement('div');
        detailImageContainer.className = 'detail-image-container';
        detailImageContainer.innerHTML = `<img src="${imgSrc}" class="detail-image">`; // object-fitはCSSで制御
        detailImageContainer.onclick = () => openLightbox(imgSrc);
        
        const existingImg = plantDetails.querySelector('.detail-image-container');
        if (existingImg) existingImg.remove();
        plantDetails.prepend(detailImageContainer);
        
        // テキスト情報の埋め込み (前回と同様)
        const seasonData = plantData.management[getCurrentSeason()];
        document.getElementById('season-care-content').innerHTML = `
            <ul>
                <li><strong>水やり:</strong> ${escapeHTML(seasonData.water)}</li>
                <li><strong>葉水:</strong> ${escapeHTML(seasonData.mist || 'なし')}</li>
                <li><strong>光:</strong> ${escapeHTML(seasonData.light)}</li>
            </ul>
        `;
        
        // 履歴表示など
        renderWaterHistory(userPlant.waterLog, userPlant.id);
        renderRepottingHistory(userPlant.repottingLog);
        
        detailsModal.style.display = 'block';
    }

    // ----------------------------------------------------
    // その他 既存の補助関数 (省略せず実装が必要)
    // ----------------------------------------------------
    
    function deletePlantCard(id) {
        const index = userPlants.findIndex(p => String(p.id) === String(id));
        if (index === -1) return;
        
        // バックアップ
        deletedPlantBackup = userPlants[index];
        deletedPlantIndex = index;
        
        userPlants.splice(index, 1);
        saveUserPlants(userPlants);
        
        // IDBからはまだ削除しない (Undoのため)
        
        renderPlantCards();
        
        showNotification('削除しました', 'warning', 5000, {
            text: '元に戻す',
            callback: () => {
                userPlants.splice(deletedPlantIndex, 0, deletedPlantBackup);
                saveUserPlants(userPlants);
                renderPlantCards();
            }
        });
        
        // 5秒後にIDBから削除するロジック（ガベージコレクションがあるため厳密には不要だが念のため）
        setTimeout(() => {
            // Undoされずに残っているか確認
            if (!userPlants.find(p => String(p.id) === String(id))) {
                deleteImageFromDB(id);
            }
        }, 6000);
    }

    // ----------------------------------------------------
    // 初期化実行
    // ----------------------------------------------------
    if (addPlantForm) {
        addPlantForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newPlant = {
                id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), // UUID推奨
                name: escapeHTML(document.getElementById('plant-name').value),
                speciesId: String(document.getElementById('species-select').value),
                entryDate: document.getElementById('last-watered').value,
                waterLog: [{ date: document.getElementById('last-watered').value, type: document.getElementById('water-type-select').value }],
                repottingLog: [],
                hasCustomImage: false
            };
            userPlants.unshift(newPlant);
            saveUserPlants(userPlants);
            renderPlantCards();
            addPlantForm.reset();
            showNotification('追加しました！', 'success');
        });
    }

    // ----------------------------------------------------
    // Service Worker
    // ----------------------------------------------------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                reg.onupdatefound = () => {
                    const installingWorker = reg.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showNotification('新しいバージョンがあります', 'success', 0, {
                                text: '更新',
                                callback: () => window.location.reload()
                            });
                        }
                    };
                };
            });
        });
    }

    initializeApp();
    
    // ----------------------------------------------------
    // ヘルパー関数定義
    // ----------------------------------------------------
    function getSeasonRisk(seasonKey, data) {
        if (seasonKey === 'WINTER') return data.minTemp >= 10 ? '厳重な保温が必要' : '寒さ対策';
        if (seasonKey === 'SUMMER') return '水切れ・蒸れに注意';
        return '成長期';
    }
    
    function renderWaterHistory(logs, id) {
        if (!waterHistoryList) return;
        waterHistoryList.innerHTML = logs.length ? '' : '<li>なし</li>';
        logs.forEach((log, idx) => {
            const li = document.createElement('li');
            // イベントリスナーでの実装を推奨
            const span = document.createElement('span');
            span.textContent = formatJapaneseDate(log.date);
            const btn = document.createElement('button');
            btn.textContent = '×';
            btn.className = 'delete-log-btn';
            btn.onclick = (e) => { e.stopPropagation(); deleteWaterLog(id, idx); };
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
        if (pIndex > -1 && confirm('削除しますか？')) {
            userPlants[pIndex].waterLog.splice(idx, 1);
            saveUserPlants(userPlants);
            showDetailsModal(userPlants[pIndex], PLANT_DATA.find(d => String(d.id) === userPlants[pIndex].speciesId));
        }
    }
    
    function formatJapaneseDate(d) {
        const date = new Date(d);
        return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`;
    }
});

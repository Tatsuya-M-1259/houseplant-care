// app.js (一部抜粋・修正版)

// ...（既存の定数定義などは維持）

document.addEventListener('DOMContentLoaded', () => {
    // ...

    // 【修正】次回水やり日の計算ロジック
    function calculateNextWateringDate(lastDateString, intervalDays) {
        if (!lastDateString || intervalDays === INTERVAL_WATER_STOP || intervalDays == null || isNaN(intervalDays)) return null;
        
        const lastDate = parseDateAsLocal(lastDateString);
        const today = new Date();
        const lastDateObj = new Date(lastDateString);
        
        // 季節の変わり目（3月）の補正ロジック
        // 前回の水やりから日数が経過しすぎている場合、今日の季節の間隔を適用するが
        // 土の状態確認を促すメッセージが必要なため、ここでは純粋に日付を算出
        lastDate.setDate(lastDate.getDate() + parseInt(intervalDays));
        
        const y = lastDate.getFullYear();
        const m = String(lastDate.getMonth() + 1).padStart(2, '0');
        const d = String(lastDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // 【修正】カードコンテンツの非同期レンダリング
    async function renderCardContentAsync(container, userPlant, data, seasonKey) {
        let imgSrc = `${IMAGE_BASE_PATH}${data.img}`;
        if (userPlant.hasCustomImage) {
            const storedData = await getImageFromDB(userPlant.id);
            if (storedData) {
                imgSrc = (storedData instanceof Blob) ? createManagedObjectURL(storedData) : storedData;
            }
        }

        // ログを日付順に確実にソートしてから最新を取得 [修正ポイント]
        const sortedLog = [...userPlant.waterLog].sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastLog = sortedLog[0] || { date: userPlant.entryDate, type: 'WaterOnly' };
        
        const seasonData = data.management[seasonKey];
        const nextDateString = calculateNextWateringDate(lastLog.date, seasonData.waterIntervalDays);
        const mistingInfo = seasonData.mist || 'データなし';
        
        // 3月特有のアラート表示を追加 [修正ポイント]
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
                <li>**葉水:** ${escapeHTML(mistingInfo)}</li>
                <li>**次回目安:** ${nextDateString ? formatJapaneseDate(nextDateString) : '未定（断水期）'}</li>
            </ul>
        `;
        container.innerHTML = html;
        container.style.opacity = '0';
        requestAnimationFrame(() => container.style.opacity = '1');
        container.style.transition = 'opacity 0.3s ease';
    }

    // 【修正】季節リスク判定の改善
    function getSeasonRisk(seasonKey, data) {
        const currentMonth = new Date().getMonth() + 1;
        if (currentMonth === 3 && seasonKey === 'SPRING') {
            return '冬からの移行期（徐々に回数を増やす）';
        }
        if (seasonKey === 'WINTER') return data.minTemp >= 10 ? '厳重な保温が必要' : '寒さ対策';
        if (seasonKey === 'SUMMER') return '水切れ・蒸れに注意';
        return '成長期';
    }

    // ...（その他の関数は維持）
});

// data.js

// 添付ドキュメントに基づく季節区分
const SEASONS = {
    [cite_start]SPRING: { name: '春 (3月〜5月)', startMonth: 3, endMonth: 5 }, // [cite: 9]
    [cite_start]SUMMER: { name: '夏 (6月〜8月)', startMonth: 6, endMonth: 8 }, // [cite: 10]
    [cite_start]AUTUMN: { name: '秋 (9月〜11月)', startMonth: 9, endMonth: 11 }, // [cite: 11]
    [cite_start]WINTER: { name: '冬 (12月〜2月)', startMonth: 12, endMonth: 2 } // [cite: 12]
};

// データセットAとBの統合（抜粋）
const PLANT_DATA = [
    {
        id: 1,
        species: 'コルジリネ',
        scientific: 'Cordyline terminalis',
        [cite_start]minTemp: 5, // 5℃〜10℃の低い方で定義 [cite: 21]
        [cite_start]difficulty: 'やや容易', // [cite: 21]
        [cite_start]feature: '鋭い葉、鉢植えが一般的', // [cite: 19, 21]
        img: 'Cordyline.jpg',
        management: {
            [cite_start]SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' }, // [cite: 45]
            [cite_start]SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた' }, // [cite: 45]
            [cite_start]AUTUMN: { water: '土表面が乾いてから1日後', light: '明るい日なた' }, // [cite: 45]
            [cite_start]WINTER: { water: '土中が乾いてから2-3日後 (少量)', light: '明るい日なた', tempRisk: '夜間窓際隔離（最低5℃確保）' } // [cite: 31, 45]
        },
        maintenance: {
            [cite_start]fertilizer: '4月, 9月', // [cite: 64]
            [cite_start]repotting: '5月〜7月', // [cite: 64]
            [cite_start]pruning: '9月〜12月 (下葉除去)' // [cite: 61, 64]
        }
    },
    {
        id: 3,
        species: 'モンステラ',
        scientific: 'Monstera deliciosa',
        [cite_start]minTemp: 10, // 10℃〜15℃の低い方で定義 [cite: 21]
        [cite_start]difficulty: '中程度', // [cite: 21]
        [cite_start]feature: '多湿を好む、根腐れ注意', // [cite: 4, 21]
        img: 'Monstera.jpg',
        management: {
            [cite_start]SPRING: { water: '土表面が乾いたらすぐ', light: '半日陰 (明るい日陰)' }, // [cite: 45]
            [cite_start]SUMMER: { water: '土表面が乾いたらすぐ', light: '半日陰 (明るい日陰)' }, // [cite: 45]
            [cite_start]AUTUMN: { water: '土表面が乾いてから1-2日後', light: '半日陰 (明るい日陰)' }, // [cite: 45]
            [cite_start]WINTER: { water: '土中が完全に乾いてから2-3日後 (少量)', light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）' } // [cite: 30, 43, 45]
        },
        maintenance: {
            [cite_start]fertilizer: '4月, 9月', // [cite: 64]
            [cite_start]repotting: '5月〜8月', // [cite: 64]
            [cite_start]pruning: '5月〜8月 (過密部整理)' // [cite: 62, 64]
        }
    }
    // 残りの18種のデータをここに追加
];

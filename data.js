// data.js

// 季節区分の定義
const SEASONS = {
    SPRING: { name: '春 (3月〜5月)', startMonth: 3, endMonth: 5 },
    SUMMER: { name: '夏 (6月〜8月)', startMonth: 6, endMonth: 8 },
    AUTUMN: { name: '秋 (9月〜11月)', startMonth: 9, endMonth: 11 },
    WINTER: { name: '冬 (12月〜2月)', startMonth: 12, endMonth: 2 }
};

// 全20種の観葉植物データセット (A, Bの統合)
const PLANT_DATA = [
    // No. 1: コルジリネ
    {
        id: 1, species: 'コルジリネ', scientific: 'Cordyline terminalis', minTemp: 5, difficulty: 'やや容易', feature: '鋭い葉、鉢植えが一般的', img: 'Cordyline.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '明るい日なた' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', light: '明るい日なた', tempRisk: '夜間窓際隔離（最低5℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜12月 (下葉除去)' }
    },
    // No. 2: パキラ
    {
        id: 2, species: 'パキラ', scientific: 'Pachira glabra/aquatica', minTemp: 5, difficulty: '容易', feature: '乾燥に強く、耐陰性あり', img: 'Pachira.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '明るい日なた/半日陰' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', light: '半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月 (樹形維持)' }
    },
    // No. 3: モンステラ
    {
        id: 3, species: 'モンステラ', scientific: 'Monstera deliciosa', minTemp: 10, difficulty: '中程度', feature: '多湿を好む、根腐れ注意', img: 'Monstera.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '半日陰 (明るい日陰)' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '半日陰 (明るい日陰)' },
            AUTUMN: { water: '土表面が乾いてから1-2日後', light: '半日陰' },
            WINTER: { water: '土中が完全に乾いてから2-3日後 (少量)', light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月 (過密部整理)' }
    },
    // No. 4: ガジュマル
    {
        id: 4, species: 'ガジュマル', scientific: 'Ficus microcarpa', minTemp: 5, difficulty: '容易', feature: '強い耐陰性、多幸の木', img: 'Gajumaru.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '半日陰' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '半日陰' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '半日陰' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', light: '半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）' }
        },
        maintenance: { fertilizer: '5月, 9月', repotting: '5月〜8月', pruning: '5月〜9月 (徒長枝剪定)' }
    },
    // No. 5: サンスベリア
    {
        id: 5, species: 'サンスベリア', scientific: 'Sansevieria trifasciata', minTemp: 5, difficulty: '容易', feature: '極めて乾燥に強い、休眠誘導', img: 'Sansevieria.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            AUTUMN: { water: '土表面が乾いてから2日後', light: '明るい日なた' },
            WINTER: { water: 'ほぼ断水', light: '明るい日なた', tempRisk: '夜間窓際隔離（最低5℃確保）' }
        },
        maintenance: { fertilizer: '施肥不要 (または5月)', repotting: '5月〜7月', pruning: '不要' }
    },
    // No. 6: ドラセナ
    {
        id: 6, species: 'ドラセナ', scientific: 'Dracaena fragrans', minTemp: 10, difficulty: '中程度', feature: '幸福の木、葉水必須', img: 'Dracaena.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '明るい日なた/半日陰' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜8月 (切り戻し)' }
    },
    // No. 7: シェフレラ
    {
        id: 7, species: 'シェフレラ', scientific: 'Schefflera arboricola', minTemp: 5, difficulty: '容易', feature: '非常に丈夫、耐陰性強い', img: 'Schefflera.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '半日陰 (時々日光浴)' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '半日陰 (時々日光浴)' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '半日陰' },
            WINTER: { water: '土表面が乾いたら少量', light: '半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜12月 (樹形維持)' }
    },
    // No. 8: ユッカ
    {
        id: 8, species: 'ユッカ', scientific: 'Yucca', minTemp: -3, difficulty: '容易', feature: '乾燥管理、強い耐寒性', img: 'Yucca.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            AUTUMN: { water: '土表面が乾いてから2日後', light: '明るい日なた' },
            WINTER: { water: '土中が乾いてから3日後 (少量)', light: '明るい日なた', tempRisk: '断水で休眠誘導。管理容易。' } 
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜11月 (古葉除去)' }
    },
    // No. 9: アンスリウム
    {
        id: 9, species: 'アンスリウム', scientific: 'Anthurium', minTemp: 10, difficulty: '中程度', feature: '花を観賞、多湿を好む', img: 'Anthurium.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日陰 (直射日光避)' },
            SUMMER: { water: '土を乾かさないように', light: '明るい日陰 (直射日光避)' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '明るい日陰' },
            WINTER: { water: '土中が乾いてから2日後', light: '明るい日陰', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '花後の剪定' }
    },
    // No. 10: ポトス
    {
        id: 10, species: 'ポトス', scientific: 'Epipremnum aureum', minTemp: 10, difficulty: '容易', feature: '耐陰性あり、つる性', img: 'Pothos.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '半日陰' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '半日陰' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '半日陰' },
            WINTER: { water: '土中が乾いてから2日後', light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '5月〜9月 (つる整理)' }
    },
    // No. 11: アロカシア
    {
        id: 11, species: 'アロカシア', scientific: 'Alocasia odora', minTemp: 10, difficulty: '中程度', feature: '葉の質感に多様性、休眠管理種あり', img: 'Alocasia.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた (緑葉種)' },
            SUMMER: { water: '土を乾かさないように', light: '明るい日なた (緑葉種)' },
            AUTUMN: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            WINTER: { water: '乾かし気味/休眠管理 (金属光沢種)', light: '明るい日なた', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '随時 (傷んだ葉除去)' }
    },
    // No. 12: インドゴムノキ
    {
        id: 12, species: 'インドゴムノキ', scientific: 'Ficus elastica', minTemp: 5, difficulty: '容易', feature: '日光で樹形が整う、葉が大きい', img: 'FicusElastica.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた/夏は遮光' }, // 耐暑性が弱い点を考慮
            AUTUMN: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            WINTER: { water: '土表面が乾いたら少量', light: '明るい日なた/半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月 (樹形維持)' }
    },
    // No. 13: エバーフレッシュ
    {
        id: 13, species: 'エバーフレッシュ', scientific: 'Cojoba arborea', minTemp: 10, difficulty: '中程度', feature: '夜に葉を閉じる、日陰で育つ', img: 'Everfresh.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            AUTUMN: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            WINTER: { water: '土中が乾いてから2日後 (少量)', light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月 (過密部整理)' }
    },
    // No. 14: クロトン
    {
        id: 14, species: 'クロトン', scientific: 'Codiaeum variegatum', minTemp: 10, difficulty: '中程度', feature: '鮮やかな葉色、日光必須', img: 'Croton.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた (必須)' },
            SUMMER: { water: '土を乾かさないように', light: '明るい日なた (必須)' },
            AUTUMN: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            WINTER: { water: '土表面が乾いたら少量', light: '明るい日なた', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月 (樹形維持)' }
    },
    // No. 15: コーヒーノキ
    {
        id: 15, species: 'コーヒーノキ', scientific: 'Coffea arabica', minTemp: 10, difficulty: '難しい', feature: '日当たりを好む、熱帯植物', img: 'Coffee.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            AUTUMN: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            WINTER: { water: '土表面が乾いたら少量', light: '明るい日なた', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜8月 (徒長枝剪定)' }
    },
    // No. 16: トックリラン
    {
        id: 16, species: 'トックリラン', scientific: 'Beaucarnea recurvata', minTemp: -3, difficulty: '容易', feature: '極めて乾燥に強い、基部肥大化', img: 'Beaucarnea.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            AUTUMN: { water: '土表面が乾いてから2日後', light: '明るい日なた' },
            WINTER: { water: '土中が乾いてから3日後 (少量)', light: '明るい日なた', tempRisk: '断水で休眠誘導。管理容易。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '不要' }
    },
    // No. 17: フィカス・ウンベラータ
    {
        id: 17, species: 'ウンベラータ', scientific: 'Ficus umbellata', minTemp: 10, difficulty: '中程度', feature: '成長早い、剪定必須', img: 'FicusUmbellata.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた/半日陰' },
            AUTUMN: { water: '土表面が乾いてから1日後', light: '明るい日なた/半日陰' },
            WINTER: { water: '土中が乾いてから2日後 (少量)', light: '明るい日なた/半日陰', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月 (積極的な剪定)' }
    },
    // No. 18: オーガスタ
    {
        id: 18, species: 'オーガスタ', scientific: 'Strelitzia nicolai', minTemp: 5, difficulty: 'やや容易', feature: '極楽鳥花の仲間、大型化', img: 'Strelitzia.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            SUMMER: { water: '土を乾かさないように', light: '明るい日なた' },
            AUTUMN: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            WINTER: { water: '土中が乾いてから2日後', light: '明るい日なた', tempRisk: '夜間窓際隔離（最低5℃確保）' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '随時 (古葉除去)' }
    },
    // No. 19: ビカクシダ
    {
        id: 19, species: 'ビカクシダ', scientific: 'Platycerium', minTemp: 10, difficulty: '難しい', feature: '着生植物、水やり方法が特殊', img: 'Platycerium.jpg',
        management: {
            SPRING: { water: '水苔が乾いたら', light: '明るい日陰' },
            SUMMER: { water: '水苔が乾いたら', light: '明るい日陰' },
            AUTUMN: { water: '水苔が乾いてから1日後', light: '明るい日陰' },
            WINTER: { water: '水苔が乾いてから2日後 (頻度低)', light: '明るい日陰', tempRisk: '厳重な温度管理（最低10℃確保）' }
        },
        maintenance: { fertilizer: '施肥不要 (または液肥)', repotting: '5月〜8月', pruning: '不要' }
    },
    // No. 20: アローカリア
    {
        id: 20, species: 'アローカリア', scientific: 'Araucaria heterophylla', minTemp: 0, difficulty: '容易', feature: '強い耐寒性、コニファー', img: 'Araucaria.jpg',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            SUMMER: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            AUTUMN: { water: '土表面が乾いたらすぐ', light: '明るい日なた' },
            WINTER: { water: '土表面が乾いてから2日後 (少量)', light: '明るい日なた', tempRisk: '管理容易。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '不要' }
    }
];

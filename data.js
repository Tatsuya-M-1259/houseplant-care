// data.js

/**
 * 季節区分の定義
 */
export const INTERVAL_WATER_STOP = 999;

/**
 * 全27種の観葉植物データセット (湿度項目追加版)
 */
export const PLANT_DATA = [
    {
        id: 1, species: 'コルジリネ', scientific: 'Cordyline terminalis', minTemp: 5, difficulty: 'やや容易', feature: '鋭い葉、鉢植えが一般的', img: 'cordyline.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた', mist: '毎日1回。葉裏にも。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた', mist: '毎日朝夕。たっぷりと。', humidity: '60%〜70%' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日なた', mist: '毎日1回。', humidity: '50%〜60%' },
            WINTER: { water: '土中が乾いてから2-3日後', waterIntervalDays: 14, light: '明るい日なた', mist: '週2-3回。暖かい昼間に。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜12月' }
    },
    {
        id: 2, species: 'パキラ', scientific: 'Pachira glabra/aquatica', minTemp: 5, difficulty: '容易', feature: '乾燥に強く、耐陰性あり', img: 'pachira.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '2-3日に1回。', humidity: '50%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日なた/半日陰', mist: '2-3日に1回。', humidity: '50%前後' },
            WINTER: { water: '土中が乾いてから2-3日後', waterIntervalDays: 14, light: '半日陰', mist: '週1-2回。暖房乾燥時に。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 3, species: 'モンステラ', scientific: 'Monstera deliciosa', minTemp: 10, difficulty: '中程度', feature: '多湿を好む、根腐れ注意', img: 'monstera.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰 (明るい日陰)', mist: '毎日1回。', humidity: '60%以上' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰 (明るい日陰)', mist: '毎日朝夕2回。', humidity: '70%前後' },
            AUTUMN: { water: '土表面が乾いてから1-2日後', waterIntervalDays: 10, light: '半日陰', mist: '2-3日に1回。', humidity: '60%以上' },
            WINTER: { water: '土中が完全に乾いてから2-3日後', waterIntervalDays: 14, light: '半日陰', mist: '週1-2回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 4, species: 'ガジュマル', scientific: 'Ficus microcarpa', minTemp: 5, difficulty: '容易', feature: '強い耐陰性、多幸の木', img: 'gajumaru.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日1回。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日朝夕。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '半日陰', mist: '2-3日に1回。', humidity: '50%以上' },
            WINTER: { water: '土中が乾いてから2-3日後', waterIntervalDays: 14, light: '半日陰', mist: '週1-2回。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '5月, 9月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 5, species: 'サンスベリア', scientific: 'Sansevieria trifasciata', minTemp: 5, difficulty: '容易', feature: '極めて乾燥に強い', img: 'sansevieria.jpeg',
        water_method: '完全に乾いてから。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '不要 (多湿を嫌う)', humidity: '40%〜50%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '不要。蒸れ注意。', humidity: '50%以下' },
            AUTUMN: { water: '土表面が乾いてから2日後', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。', humidity: '40%以上' },
            WINTER: { water: 'ほぼ断水', waterIntervalDays: INTERVAL_WATER_STOP, light: '日当たり良好', mist: '不要。', humidity: '乾燥気味で可' }
        },
        maintenance: { fertilizer: '5月', repotting: '5月〜7月', pruning: '不要' }
    },
    {
        id: 6, species: 'ドラセナ', scientific: 'Dracaena fragrans', minTemp: 10, difficulty: '中程度', feature: '幸福の木、葉水必須', img: 'dracaena.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日なた/半日陰', mist: '毎日1回。', humidity: '50%以上' },
            WINTER: { water: '土中が乾いてから2-3日後', waterIntervalDays: 14, light: '半日陰', mist: '週2-3回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 7, species: 'シェフレラ', scientific: 'Schefflera arboricola', minTemp: 5, difficulty: '容易', feature: '非常に丈夫', img: 'schefflera.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '2-3日に1回。', humidity: '40%〜60%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日1回。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '半日陰', mist: '2-3日に1回。', humidity: '50%前後' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '半日陰', mist: '週1回。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜12月' }
    },
    {
        id: 8, species: 'ユッカ', scientific: 'Yucca', minTemp: -3, difficulty: '容易', feature: '乾燥管理、強い耐寒性', img: 'yucca.jpg',
        water_method: '鉢底からたっぷりと。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '週1-2回。', humidity: '40%〜50%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '週2-3回。夕方に。', humidity: '50%前後' },
            AUTUMN: { water: '土表面が乾いてから2日後', waterIntervalDays: 14, light: '日当たり良好', mist: '週1回。', humidity: '40%以上' },
            WINTER: { water: '土中が乾いてから3日後', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。', humidity: '乾燥に強い' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜11月' }
    },
    {
        id: 9, species: 'アンスリウム', scientific: 'Anthurium', minTemp: 10, difficulty: '中程度', feature: '多湿を好む', img: 'anthurium.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日陰', mist: '毎日1回。', humidity: '60%以上' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '明るい日陰', mist: '毎日朝夕2回。', humidity: '70%前後' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日陰', mist: '毎日1回。', humidity: '60%前後' },
            WINTER: { water: '土中が乾いてから2日後', waterIntervalDays: 14, light: '明るい日陰', mist: '週2-3回。昼間に。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '花後' }
    },
    {
        id: 10, species: 'ポトス', scientific: 'Epipremnum aureum', minTemp: 10, difficulty: '容易', feature: '耐陰性あり、つる性', img: 'pothos.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日1回。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日朝夕。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '半日陰', mist: '毎日1回。', humidity: '50%以上' },
            WINTER: { water: '土中が乾いてから2日後', waterIntervalDays: 14, light: '半日陰', mist: '週2-3回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '5月〜9月' }
    },
    {
        id: 11, species: 'アロカシア', scientific: 'Alocasia odora', minTemp: 10, difficulty: '中程度', feature: '葉の質感に多様性', img: 'alocasia.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日1回。', humidity: '60%〜70%' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '日当たり良好', mist: '毎日朝夕。', humidity: '70%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日1回。', humidity: '60%前後' },
            WINTER: { water: '乾かし気味に管理', waterIntervalDays: 14, light: '日当たり良好', mist: '週1-2回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '随時' }
    },
    {
        id: 12, species: 'インドゴムノキ', scientific: 'Ficus elastica', minTemp: 5, difficulty: '容易', feature: '葉が大きい', img: 'indian_rubber.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。', humidity: '50%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '2-3日に1回。', humidity: '50%以上' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '日当たり良好/半日陰', mist: '週1回。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 13, species: 'エバーフレッシュ', scientific: 'Cojoba arborea', minTemp: 10, difficulty: '中程度', feature: '夜に葉を閉じる', img: 'everfresh.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。昼間に。', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。乾燥注意。', humidity: '70%前後' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日1回。', humidity: '60%前後' },
            WINTER: { water: '土中が乾いてから2日後', waterIntervalDays: 14, light: '半日陰', mist: '週2-3回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 14, species: 'クロトン', scientific: 'Codiaeum variegatum', minTemp: 10, difficulty: '中程度', feature: '鮮やかな葉色、日光必須', img: 'croton.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好 (必須)', mist: '毎日1回。', humidity: '60%前後' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '日当たり良好 (必須)', mist: '毎日朝夕。', humidity: '70%前後' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。', humidity: '60%前後' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '日当たり良好', mist: '週1-2回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 15, species: 'コーヒーノキ', scientific: 'Coffea arabica', minTemp: 10, difficulty: '難しい', feature: '日当たりを好む', img: 'coffee_tree.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日1回。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日朝夕。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。', humidity: '50%以上' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '日当たり良好', mist: '週1-2回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 16, species: 'トックリラン', scientific: 'Beaucarnea recurvata', minTemp: -3, difficulty: '容易', feature: '極めて乾燥に強い', img: 'ponytail_palm.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '週1回。', humidity: '40%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '週1-2回。', humidity: '50%前後' },
            AUTUMN: { water: '土表面が乾いてから2日後', waterIntervalDays: 14, light: '日当たり良好', mist: '週1回。', humidity: '40%以上' },
            WINTER: { water: '土中が乾いてから3日後', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。', humidity: '乾燥に非常に強い' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜11月' }
    },
    {
        id: 17, species: 'ウンベラータ', scientific: 'Ficus umbellata', minTemp: 10, difficulty: '中程度', feature: '成長早い', img: 'ficus_umbellata.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '日当たり良好/半日陰', mist: '毎日1回。', humidity: '50%以上' },
            WINTER: { water: '土中が乾いてから2日後', waterIntervalDays: 14, light: '日当たり良好/半日陰', mist: '週2-3回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 18, species: 'オーガスタ', scientific: 'Strelitzia nicolai', minTemp: 5, difficulty: 'やや容易', feature: '大型化', img: 'augusta.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。', humidity: '50%前後' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '日当たり良好', mist: '毎日1回。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。', humidity: '50%前後' },
            WINTER: { water: '土中が乾いてから2-3日後', waterIntervalDays: 14, light: '日当たり良好', mist: '週1回。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '随時' }
    },
    {
        id: 19, species: 'ビカクシダ', scientific: 'Platycerium', minTemp: 10, difficulty: '難しい', feature: '着生植物', img: 'staghorn_fern.jpg',
        water_method: '水苔が乾いたらソーキング。',
        management: {
            SPRING: { water: '水苔が乾いたら', waterIntervalDays: 7, light: '明るい日陰', mist: '毎日1回。', humidity: '60%〜70%' },
            SUMMER: { water: '水苔が乾いたら', waterIntervalDays: 7, light: '明るい日陰', mist: '毎日朝夕。', humidity: '70%以上' },
            AUTUMN: { water: '水苔が乾いてから1日後', waterIntervalDays: 10, light: '明るい日陰', mist: '毎日1回。', humidity: '60%前後' },
            WINTER: { water: '水苔が乾いてから2日後', waterIntervalDays: 14, light: '明るい日陰', mist: '週2-3回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '液肥', repotting: '5月〜8月', pruning: '不要' }
    },
    {
        id: 20, species: 'アローカリア', scientific: 'Araucaria heterophylla', minTemp: 0, difficulty: '容易', feature: '強い耐寒性', img: 'araucaria.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。', humidity: '50%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日1回。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。', humidity: '50%前後' },
            WINTER: { water: '土表面が乾いてから2日後', waterIntervalDays: 10, light: '日当たり良好', mist: '週1回。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '不要' }
    },
    {
        id: 21, species: 'アデニウム', scientific: 'Adenium obesum', minTemp: 10, difficulty: 'やや容易', feature: '塊根植物、砂漠のバラ', img: 'adenium.jpg.jpeg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が完全に乾いてから', waterIntervalDays: 10, light: '日当たり良好', mist: '不要。', humidity: '40%前後' },
            SUMMER: { water: '土表面が完全に乾いてから', waterIntervalDays: 7, light: '日当たり良好', mist: '週1-2回。夕方に。', humidity: '50%前後' },
            AUTUMN: { water: '土表面が乾いてから2-3日後', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。', humidity: '40%以上' },
            WINTER: { water: '断水', waterIntervalDays: INTERVAL_WATER_STOP, light: '日当たり良好', mist: '不要。', humidity: '乾燥に強い' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜7月', pruning: '5月〜9月' }
    },
    {
        id: 22, species: 'エケベリア', scientific: 'Echeveria', minTemp: 5, difficulty: '容易', feature: 'ロゼット状の多肉植物', img: 'echeveria.jpg.jpeg',
        water_method: '鉢底からたっぷりと。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '不要。', humidity: '40%前後' },
            SUMMER: { water: '断水/控えめ (月1回)', waterIntervalDays: 30, light: '半日陰 (蒸れ注意)', mist: '不要。蒸れ厳禁。', humidity: '50%以下' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '不要。', humidity: '40%前後' },
            WINTER: { water: '断水/控えめ', waterIntervalDays: 30, light: '日当たり良好', mist: '不要。', humidity: '乾燥気味で可' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '3月〜5月, 9月〜11月', pruning: '不要' }
    },
    {
        id: 23, species: 'カランコエ', scientific: 'Kalanchoe blossfeldiana', minTemp: 5, difficulty: '容易', feature: '多肉植物、短日植物', img: 'kalanchoe.jpg',
        water_method: '鉢底からたっぷりと。葉にかからないように。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '不要。', humidity: '40%〜50%' },
            SUMMER: { water: '土表面が乾いてから2-3日後', waterIntervalDays: 10, light: '半日陰', mist: '不要。', humidity: '50%前後' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '不要。', humidity: '40%以上' },
            WINTER: { water: '土中が乾いてから2-3日後', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。', humidity: '40%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜6月', pruning: '花後' }
    },
    {
        id: 24, species: 'マランタ', scientific: 'Maranta leuconeura', minTemp: 10, difficulty: '中程度', feature: '祈り植物、美しい葉模様', img: 'maranta.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾き始めたらすぐ', waterIntervalDays: 5, light: '明るい日陰', mist: '毎日1回。', humidity: '60%〜70%' },
            SUMMER: { water: '土表面が乾き始めたらすぐ', waterIntervalDays: 3, light: '明るい日陰', mist: '毎日朝夕。', humidity: '70%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日陰', mist: '毎日1回。', humidity: '60%前後' },
            WINTER: { water: '土中が乾いてから1-2日後', waterIntervalDays: 10, light: '明るい日陰', mist: '毎日1回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜6月', pruning: '随時' }
    },
    {
        id: 25, species: 'ソフォラ・リトルベイビー', scientific: 'Sophora prostrata \'Little Baby\'', minTemp: 5, difficulty: '難しい', feature: 'ジグザグの枝、小さな葉', img: 'sophora.jpg',
        water_method: '鉢底からたっぷりと。水切れ厳禁。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 3, light: '日当たり良好', mist: '毎日1〜2回。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾き始めたらすぐ', waterIntervalDays: 2, light: '半日陰', mist: '毎日朝夕。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 5, light: '日当たり良好', mist: '毎日1回。', humidity: '50%以上' },
            WINTER: { water: '土表面が乾いてから1〜2日後', waterIntervalDays: 10, light: '明るい日向', mist: '毎日1回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '4月〜6月', pruning: '5月〜7月' }
    },
    {
        id: 26, species: 'ユーフォルビア・ホワイトゴースト', scientific: 'Euphorbia lactea \'White Ghost\'', minTemp: 10, difficulty: '容易', feature: '独特な白いフォルム', img: 'white_ghost.jpg',
        water_method: '鉢底からたっぷりと。乾燥気味に。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '不要。', humidity: '40%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '不要。', humidity: '50%前後' },
            AUTUMN: { water: '土表面が乾いてから2-3日後', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。', humidity: '40%以上' },
            WINTER: { water: '断水/控えめ (月1回)', waterIntervalDays: 30, light: '明るい日向', mist: '不要。', humidity: '乾燥に強い' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜7月', pruning: '随時' }
    },
    {
        id: 27, species: 'ペペロミア', scientific: 'Peperomia', minTemp: 10, difficulty: '容易', feature: '肉厚な葉、耐陰性あり', img: 'peperomia.jpg',
        water_method: '土が完全に乾いてから。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日陰', mist: '2-3日に1回。', humidity: '50%〜60%' },
            SUMMER: { water: '土表面が乾いてから1-2日後', waterIntervalDays: 10, light: '明るい日陰', mist: '毎日1回。', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日陰', mist: '2-3日に1回。', humidity: '50%以上' },
            WINTER: { water: '土中が乾いてから2-3日後', waterIntervalDays: 14, light: '明るい日陰', mist: '週1-2回。', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜8月', pruning: '随時' }
    }
];

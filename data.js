// data.js

/**
 * 季節区分の定義
 */
export const INTERVAL_WATER_STOP = 999;

/**
 * 天草・室内・ライト10h・サーキュレーター・加湿器完備 環境特化型データセット
 */
export const PLANT_DATA = [
    {
        id: 1, species: 'コルジリネ', scientific: 'Cordyline terminalis', minTemp: 5, difficulty: '容易', feature: 'ライトと風で徒長を防ぎ、鮮やかな葉色を維持可能。', img: 'cordyline.jpg',
        water_method: '鉢底からたっぷり。受け皿の水は捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '70%前後' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 10, light: 'ライト10h（窓際）', mist: '毎日1回', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜7月', pruning: '9月〜12月' }
    },
    {
        id: 2, species: 'パキラ', scientific: 'Pachira glabra/aquatica', minTemp: 5, difficulty: '容易', feature: '安定した光で新芽が展開しやすい。', img: 'pachira.jpg',
        water_method: '鉢底からたっぷり。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '2日に1回', humidity: '50%以上' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h＋レース越し', mist: '2日に1回', humidity: '50%以上' },
            WINTER: { water: '土表面が乾いて2日後', waterIntervalDays: 12, light: 'ライト10h維持', mist: '週2回', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月〜8月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 3, species: 'モンステラ', scientific: 'Monstera deliciosa', minTemp: 10, difficulty: '容易', feature: '加湿器と微風により、理想的な湿度環境。', img: 'monstera.jpg',
        water_method: '鉢底からたっぷり。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%以上' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '70%前後' },
            AUTUMN: { water: '土表面が乾いて1日後', waterIntervalDays: 7, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%以上' },
            WINTER: { water: '土中が乾いて1日後', waterIntervalDays: 12, light: 'ライト10h維持', mist: '毎日1回', humidity: '55%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 4, species: 'ガジュマル', scientific: 'Ficus microcarpa', minTemp: 5, difficulty: '容易', feature: '微風により幹が太くなりやすい。', img: 'gajumaru.jpg',
        water_method: '鉢底からたっぷり。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いて1日後', waterIntervalDays: 7, light: 'ライト10h＋レース越し', mist: '2日に1回', humidity: '60%前後' },
            WINTER: { water: '土表面が乾いて2日後', waterIntervalDays: 12, light: 'ライト10h維持', mist: '週2回', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 5, species: 'サンスベリア', scientific: 'Sansevieria trifasciata', minTemp: 5, difficulty: '容易', feature: 'ライトにより冬でも成長が止まらない。', img: 'sansevieria.jpeg',
        water_method: '完全に乾いてから。',
        management: {
            SPRING: { water: '土が乾いて2日後', waterIntervalDays: 10, light: 'ライト直下（強）', mist: '不要', humidity: '50%以下' },
            SUMMER: { water: '土が乾いたらすぐ', waterIntervalDays: 7, light: 'ライト直下（強）', mist: '不要', humidity: '50%以下' },
            AUTUMN: { water: '土が乾いて2日後', waterIntervalDays: 10, light: 'ライト直下（強）', mist: '不要', humidity: '50%以下' },
            WINTER: { water: '土が乾いて1週間後', waterIntervalDays: 20, light: 'ライト直下維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '5月', repotting: '5月〜7月', pruning: '不要' }
    },
    {
        id: 6, species: 'ドラセナ', scientific: 'Dracaena fragrans', minTemp: 10, difficulty: '容易', feature: 'サーキュレーターで葉の蒸れを防ぐ。', img: 'dracaena.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いて1日後', waterIntervalDays: 7, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            WINTER: { water: '土中が乾いて2日後', waterIntervalDays: 12, light: 'ライト10h維持', mist: '毎日1回', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '5月〜8月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 7, species: 'シェフレラ', scientific: 'Schefflera arboricola', minTemp: 5, difficulty: '容易', feature: 'ライト照射で徒長せず密に育つ。', img: 'schefflera.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋窓際', mist: '2日に1回', humidity: '50%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋窓際', mist: '毎日1回', humidity: '60%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h＋窓際', mist: '2日に1回', humidity: '50%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 10, light: 'ライト10h維持', mist: '週2回', humidity: '45%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜7月', pruning: '9月〜12月' }
    },
    {
        id: 8, species: 'ユッカ', scientific: 'Yucca', minTemp: -3, difficulty: '容易', feature: '強光を好むため、ライト直下が最適。', img: 'yucca.jpg',
        water_method: '完全に乾いてから。',
        management: {
            SPRING: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト直下（強）', mist: '週1回', humidity: '45%前後' },
            SUMMER: { water: '土が乾いたらすぐ', waterIntervalDays: 5, light: 'ライト直下（強）', mist: '週2回', humidity: '50%前後' },
            AUTUMN: { water: '土が乾いて1日後', waterIntervalDays: 8, light: 'ライト直下（強）', mist: '週1回', humidity: '45%前後' },
            WINTER: { water: '土中が乾いて3日後', waterIntervalDays: 15, light: 'ライト維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜7月', pruning: '9月〜11月' }
    },
    {
        id: 9, species: 'アンスリウム', scientific: 'Anthurium', minTemp: 10, difficulty: '中程度', feature: '加湿器必須、ライトで花持ちが向上。', img: 'anthurium.jpg',
        water_method: '土表面が乾いたらたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h（弱め）', mist: '毎日1回', humidity: '70%前後' },
            SUMMER: { water: '土表面が乾く直前に', waterIntervalDays: 3, light: 'ライト10h（弱め）', mist: '毎日2回', humidity: '75%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h（弱め）', mist: '毎日1回', humidity: '70%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 10, light: 'ライト維持', mist: '毎日1回', humidity: '60%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜8月', pruning: '花後' }
    },
    {
        id: 10, species: 'ポトス', scientific: 'Epipremnum aureum', minTemp: 10, difficulty: '容易', feature: 'ライトと微風で葉が大きく育つ。', img: 'pothos.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 10, light: 'ライト維持', mist: '毎日1回', humidity: '55%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜7月', pruning: '5月〜9月' }
    },
    {
        id: 11, species: 'アロカシア', scientific: 'Alocasia odora', minTemp: 10, difficulty: '中程度', feature: '高湿度＋微風＋ライトは最高の育成条件。', img: 'alocasia.jpg',
        water_method: '土表面が乾き始めたらたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾き始めたら', waterIntervalDays: 4, light: 'ライト10h直下', mist: '毎日1〜2回', humidity: '70%以上' },
            SUMMER: { water: '土表面が乾き始めたらすぐ', waterIntervalDays: 3, light: 'ライト10h直下', mist: '毎日2回', humidity: '75%以上' },
            AUTUMN: { water: '土表面が乾き始めたら', waterIntervalDays: 5, light: 'ライト10h直下', mist: '毎日1〜2回', humidity: '70%前後' },
            WINTER: { water: '土表面が乾いたら', waterIntervalDays: 8, light: 'ライト10h維持', mist: '毎日1回', humidity: '65%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜8月', pruning: '随時' }
    },
    {
        id: 12, species: 'インドゴムノキ', scientific: 'Ficus elastica', minTemp: 5, difficulty: '容易', feature: 'ライトにより冬も艶やかな葉を維持。', img: 'indian_rubber.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '55%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h＋レース越し', mist: '2日に1回', humidity: '55%以上' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 12, light: 'ライト10h維持', mist: '週2回', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 13, species: 'エバーフレッシュ', scientific: 'Cojoba arborea', minTemp: 10, difficulty: '中程度', feature: '風がある環境では蒸散が早いため水切れ注意。', img: 'everfresh.jpg',
        water_method: '土が乾き切る前にたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾き始めたら', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '65%前後' },
            SUMMER: { water: '土表面が乾き始めたらすぐ', waterIntervalDays: 3, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '70%以上' },
            AUTUMN: { water: '土表面が乾き始めたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '65%前後' },
            WINTER: { water: '土表面が乾いたら', waterIntervalDays: 8, light: 'ライト10h維持', mist: '毎日1回', humidity: '60%以上' }
        },
        maintenance: { fertilizer: '5月〜8月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 14, species: 'クロトン', scientific: 'Codiaeum variegatum', minTemp: 10, difficulty: '中程度', feature: 'ライト照射で紅葉のような色彩が鮮やかに。', img: 'croton.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h直下', mist: '毎日1回', humidity: '65%前後' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 3, light: 'ライト10h直下', mist: '毎日2回', humidity: '70%前後' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h直下', mist: '2日に1回', humidity: '65%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 10, light: 'ライト維持', mist: '毎日1回', humidity: '60%以上' }
        },
        maintenance: { fertilizer: '5月〜8月', repotting: '5月〜8月', pruning: '5月〜9月' }
    },
    {
        id: 15, species: 'コーヒーノキ', scientific: 'Coffea arbica', minTemp: 10, difficulty: '難しい', feature: '安定した光と風があれば室内でも結実可能。', img: 'coffee_tree.jpg',
        water_method: '鉢底からたっぷりと。水切れ厳禁。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋窓際', mist: '毎日1回', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋窓際', mist: '毎日2回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h＋窓際', mist: '毎日1回', humidity: '60%以上' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 10, light: 'ライト10h維持', mist: '毎日1回', humidity: '55%以上' }
        },
        maintenance: { fertilizer: '5月〜8月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 16, species: 'トックリラン', scientific: 'Beaucarnea recurvata', minTemp: -3, difficulty: '容易', feature: '微風とライトで引き締まったフォルムに。', img: 'ponytail_palm.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土が乾いて2日後', waterIntervalDays: 8, light: 'ライト直下', mist: '週1回', humidity: '45%前後' },
            SUMMER: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト直下', mist: '週1-2回', humidity: '50%前後' },
            AUTUMN: { water: '土が乾いて2日後', waterIntervalDays: 10, light: 'ライト直下', mist: '週1回', humidity: '45%以上' },
            WINTER: { water: '土中が乾いて1週間後', waterIntervalDays: 20, light: 'ライト維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜7月', pruning: '9月〜11月' }
    },
    {
        id: 17, species: 'ウンベラータ', scientific: 'Ficus umbellata', minTemp: 10, difficulty: '中程度', feature: 'ライトにより冬の落葉を防ぎやすい。', img: 'ficus_umbellata.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋レース越し', mist: '毎日2回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いて1日後', waterIntervalDays: 7, light: 'ライト10h＋レース越し', mist: '毎日1回', humidity: '60%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 10, light: 'ライト10h維持', mist: '毎日1回', humidity: '55%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜8月', pruning: '5月〜8月' }
    },
    {
        id: 18, species: 'オーガスタ', scientific: 'Strelitzia nicolai', minTemp: 5, difficulty: '容易', feature: 'ライト照射で葉が割れにくく美しく育つ。', img: 'augusta.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h直下', mist: '2日に1回', humidity: '55%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h直下', mist: '毎日1回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h直下', mist: '2日に1回', humidity: '55%前後' },
            WINTER: { water: '土中が乾いて2日後', waterIntervalDays: 12, light: 'ライト10h維持', mist: '週2回', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜8月', pruning: '随時' }
    },
    {
        id: 19, species: 'ビカクシダ', scientific: 'Platycerium', minTemp: 10, difficulty: '中程度', feature: '微風と加湿器が着生植物には理想的', img: 'staghorn_fern.jpg',
        water_method: '水苔が乾いたらソーキングまたはシャワー。',
        management: {
            SPRING: { water: '水苔が乾いたら', waterIntervalDays: 5, light: 'ライト10h（横から）', mist: '毎日2回', humidity: '70%前後' },
            SUMMER: { water: '水苔が乾いたら', waterIntervalDays: 4, light: 'ライト10h（横から）', mist: '毎日3回', humidity: '75%以上' },
            AUTUMN: { water: '水苔が乾いたら', waterIntervalDays: 6, light: 'ライト10h（横から）', mist: '毎日2回', humidity: '70%前後' },
            WINTER: { water: '水苔が乾いて1日後', waterIntervalDays: 10, light: 'ライト維持', mist: '毎日1回', humidity: '65%以上' }
        },
        maintenance: { fertilizer: '液肥', repotting: '5月〜8月', pruning: '不要' }
    },
    {
        id: 20, species: 'アローカリア', scientific: 'Araucaria heterophylla', minTemp: 0, difficulty: '容易', feature: '微風により枝が強く育つ。', img: 'araucaria.jpg',
        water_method: '鉢底からたっぷりと', 
        management: {
            SPRING: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h＋窓際', mist: '2日に1回', humidity: '55%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 4, light: 'ライト10h＋窓際', mist: '毎日1回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 6, light: 'ライト10h＋窓際', mist: '2日に1回', humidity: '55%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 10, light: 'ライト維持', mist: '週1-2回', humidity: '50%以上' }
        },
        maintenance: { fertilizer: '4月〜9月', repotting: '5月〜7月', pruning: '不要' }
    },
    {
        id: 21, species: 'アデニウム', scientific: 'Adenium obesum', minTemp: 10, difficulty: '容易', feature: 'ライト10hで塊根が太り、徒長を防げる。', img: 'adenium.jpg.jpeg',
        water_method: '鉢底からたっぷりと。風があるため蒸れにくい。', 
        management: {
            SPRING: { water: '土が乾いて1日後', waterIntervalDays: 7, light: 'ライト直下（強）', mist: '不要', humidity: '45%前後' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 5, light: 'ライト直下（強）', mist: '不要', humidity: '50%前後' },
            AUTUMN: { water: '土が乾いて1日後', waterIntervalDays: 8, light: 'ライト直下（強）', mist: '不要', humidity: '45%以上' },
            WINTER: { water: '土表面が乾いて3日後', waterIntervalDays: 15, light: 'ライト維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '5月〜8月', repotting: '5月〜7月', pruning: '5月〜9月' }
    },
    {
        id: 22, species: 'エケベリア', scientific: 'Echeveria', minTemp: 5, difficulty: '容易', feature: 'ライトがあれば室内でもロゼットが美しく維持。', img: 'echeveria.jpg.jpeg',
        water_method: '土が完全に乾いてから。',
        management: {
            SPRING: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト直下（強）', mist: '不要', humidity: '40%前後' },
            SUMMER: { water: '月2回程度', waterIntervalDays: 15, light: 'ライト直下（強）', mist: '不要（蒸れ厳禁）', humidity: '50%以下' },
            AUTUMN: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト直下（強）', mist: '不要', humidity: '40%前後' },
            WINTER: { water: '月1-2回', waterIntervalDays: 20, light: 'ライト直下維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '3月〜5月, 9月〜11月', pruning: '不要' }
    },
    {
        id: 23, species: 'カランコエ', scientific: 'Kalanchoe blossfeldiana', minTemp: 5, difficulty: '容易', feature: 'ライト管理により花芽が付きやすい。', img: 'kalanchoe.jpg',
        water_method: '鉢底からたっぷりと。葉にかからないように。', 
        management: {
            SPRING: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト10h', mist: '不要', humidity: '45%前後' },
            SUMMER: { water: '土表面が乾いて1日後', waterIntervalDays: 8, light: 'ライト10h', mist: '不要', humidity: '50%前後' },
            AUTUMN: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト10h', mist: '不要', humidity: '45%以上' },
            WINTER: { water: '土中が乾いて2日後', waterIntervalDays: 12, light: 'ライト維持', mist: '不要', humidity: '45%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜6月', pruning: '花後' }
    },
    {
        id: 24, species: 'マランタ', scientific: 'Maranta leuconeura', minTemp: 10, difficulty: '中程度', feature: 'ライトと加湿器で葉の模様が鮮やかに。', img: 'maranta.jpg',
        water_method: '鉢底からたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾き始めたら', waterIntervalDays: 4, light: 'ライト10h（弱め）', mist: '毎日1回', humidity: '70%前後' },
            SUMMER: { water: '土表面が乾き始めたらすぐ', waterIntervalDays: 3, light: 'ライト10h（弱め）', mist: '毎日2回', humidity: '75%以上' },
            AUTUMN: { water: '土表面が乾いたら', waterIntervalDays: 5, light: 'ライト10h（弱め）', mist: '毎日1回', humidity: '70%前後' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 8, light: 'ライト維持', mist: '毎日1回', humidity: '65%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜6月', pruning: '随時' }
    },
    {
        id: 25, species: 'ソフォラ・リトルベイビー', scientific: 'Sophora prostrata', minTemp: 5, difficulty: '中程度', feature: '水切れ厳禁。ライトと微風で管理が安定。', img: 'sophora.jpg',
        water_method: '土が乾き切る前にたっぷりと。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 2, light: 'ライト10h＋窓際', mist: '毎日2回', humidity: '60%前後' },
            SUMMER: { water: '土表面が乾く直前に', waterIntervalDays: 1, light: 'ライト10h＋窓際', mist: '毎日2回', humidity: '65%以上' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 3, light: 'ライト10h＋窓際', mist: '毎日2回', humidity: '60%以上' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 5, light: 'ライト10h維持', mist: '毎日1回', humidity: '55%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '4月〜6月', pruning: '5月〜7月' }
    },
    {
        id: 26, species: 'ユーフォルビア・ホワイトゴースト', scientific: 'Euphorbia lactea \'White Ghost\'', minTemp: 10, difficulty: '容易', feature: 'ライトがあれば徒長せず白いフォルムを維持可能。', img: 'white_ghost.jpg',
        water_method: '鉢底からたっぷりと。',
        management: {
            SPRING: { water: '土が乾いたらすぐ', waterIntervalDays: 8, light: 'ライト直下', mist: '不要', humidity: '45%前後' },
            SUMMER: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト直下', mist: '不要', humidity: '50%前後' },
            AUTUMN: { water: '土が乾いて2日後', waterIntervalDays: 10, light: 'ライト直下', mist: '不要', humidity: '45%以上' },
            WINTER: { water: '月1-2回', waterIntervalDays: 20, light: 'ライト維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '5月〜8月', repotting: '5月〜7月', pruning: '随時' }
    },
    {
        id: 27, species: 'ペペロミア', scientific: 'Peperomia', minTemp: 10, difficulty: '容易', feature: 'ライトがあれば冬も新芽が出る。', img: 'peperomia.jpg',
        water_method: '土が完全に乾いてから。',
        management: {
            SPRING: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト10h（弱め）', mist: '2日に1回', humidity: '60%前後' },
            SUMMER: { water: '土が乾いて1日後', waterIntervalDays: 8, light: 'ライト10h（弱め）', mist: '毎日1回', humidity: '65%以上' },
            AUTUMN: { water: '土が乾いたらすぐ', waterIntervalDays: 6, light: 'ライト10h（弱め）', mist: '2日に1回', humidity: '60%以上' },
            WINTER: { water: '土表面が乾いて1日後', waterIntervalDays: 12, light: 'ライト維持', mist: '週2回', humidity: '55%以上' }
        },
        maintenance: { fertilizer: '5月〜9月', repotting: '5月〜8月', pruning: '随時' }
    },
    {
        id: 28, species: 'アガベ', scientific: 'Agave', minTemp: 5, difficulty: '容易', feature: '強光を非常に好むため、ライト直下での管理が必須。乾燥に強く、この環境下では徒長せず引き締まって育つ。', img: 'agave.jpg',
        water_method: '土が完全に乾いてから鉢底からたっぷりと。風通しを重視し、蒸れを防ぐ。', 
        management: {
            SPRING: { water: '土が乾いて3日後', waterIntervalDays: 10, light: 'ライト直下（強）', mist: '不要', humidity: '45%前後' },
            SUMMER: { water: '土が乾いたらすぐ', waterIntervalDays: 7, light: 'ライト直下（強）', mist: '不要', humidity: '50%以下' },
            AUTUMN: { water: '土が乾いて3日後', waterIntervalDays: 10, light: 'ライト直下（強）', mist: '不要', humidity: '45%前後' },
            WINTER: { water: '月1回程度（ほぼ断水）', waterIntervalDays: 30, light: 'ライト直下維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '5月〜8月（緩効性肥料）', repotting: '5月〜8月', pruning: '不要（下葉の処理のみ）' }
    },
    {
        id: 29, species: 'サボテン（ミニ品種）', scientific: 'Cactaceae', minTemp: 5, difficulty: '容易', feature: '卓上でも管理しやすいミニサボテン。強光と風通しを確保することで、形を崩さずコンパクトに維持できる。', img: 'cactus.jpg',
        water_method: '土が完全に乾いてから数日後、鉢底からたっぷりと。休眠期はほぼ断水。', 
        management: {
            SPRING: { water: '土が乾いて3日後', waterIntervalDays: 14, light: 'ライト直下（強）', mist: '不要', humidity: '45%前後' },
            SUMMER: { water: '土が乾いたらすぐ', waterIntervalDays: 10, light: 'ライト直下（強）', mist: '不要', humidity: '50%以下' },
            AUTUMN: { water: '土が乾いて3日後', waterIntervalDays: 14, light: 'ライト直下（強）', mist: '不要', humidity: '45%前後' },
            WINTER: { water: '月1回程度（ほぼ断水）', waterIntervalDays: 30, light: 'ライト直下維持', mist: '不要', humidity: '乾燥気味' }
        },
        maintenance: { fertilizer: '5月〜8月（少量）', repotting: '4月〜6月', pruning: '不要' }
    }
];

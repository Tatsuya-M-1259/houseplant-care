// data.js

/**
 * 季節区分の定義
 */
export const INTERVAL_WATER_STOP = 999;

/**
 * 全23種の観葉植物データセット
 */
export const PLANT_DATA = [
    {
        id: 1, species: 'コルジリネ', scientific: 'Cordyline terminalis', minTemp: 5, difficulty: 'やや容易', feature: '鋭い葉、鉢植えが一般的', img: 'cordyline.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた', mist: '毎日1回。ハダニ予防に葉の裏にも。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた', mist: '毎日朝夕。乾燥を防ぐためたっぷりと。' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日なた', mist: '毎日1回。乾燥する日は回数を増やす。' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', waterIntervalDays: 14, light: '明るい日なた', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '週2-3回。暖かい昼間に霧吹き程度。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜12月 (下葉除去)' }
    },
    {
        id: 2, species: 'パキラ', scientific: 'Pachira glabra/aquatica', minTemp: 5, difficulty: '容易', feature: '乾燥に強く、耐陰性あり', img: 'pachira.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '2-3日に1回。新芽の成長を促す。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。害虫予防のため葉の裏も。' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日なた/半日陰', mist: '2-3日に1回。' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', waterIntervalDays: 14, light: '半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '週1-2回。暖房で乾燥する場合のみ。' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月 (樹形維持)' }
    },
    {
        id: 3, species: 'モンステラ', scientific: 'Monstera deliciosa', minTemp: 10, difficulty: '中程度', feature: '多湿を好む、根腐れ注意', img: 'monstera.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰 (明るい日陰)', mist: '毎日1回。新芽周辺は重点的に。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰 (明るい日陰)', mist: '毎日朝夕2回。気根にも水をかける。' },
            AUTUMN: { water: '土表面が乾いてから1-2日後', waterIntervalDays: 10, light: '半日陰', mist: '2-3日に1回。乾燥する日は回数を増やす。' },
            WINTER: { water: '土中が完全に乾いてから2-3日後 (少量)', waterIntervalDays: 14, light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週1-2回。暖かい日の昼間に霧吹き程度。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月 (過密部整理)' }
    },
    {
        id: 4, species: 'ガジュマル', scientific: 'Ficus microcarpa', minTemp: 5, difficulty: '容易', feature: '強い耐陰性、多幸の木', img: 'gajumaru.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日1回。カイガラムシ予防に有効。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日朝夕。気根があればそこにも。' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '半日陰', mist: '2-3日に1回。' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', waterIntervalDays: 14, light: '半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '週1-2回。葉の埃を落とす程度に。' }
        },
        maintenance: { fertilizer: '5月, 9月', repotting: '5月〜8月', pruning: '5月〜9月 (徒長枝剪定)' }
    },
    {
        id: 5, species: 'サンスベリア', scientific: 'Sansevieria trifasciata', minTemp: 5, difficulty: '容易', feature: '極めて乾燥に強い、休眠誘導', img: 'sansevieria.jpeg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。葉のシワや土中の乾燥具合を見て水やりを行う。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '不要（または週1回軽く）。水が溜まると腐るため注意。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '不要（または週1回軽く）。蒸れに注意。' },
            AUTUMN: { water: '土表面が乾いてから2日後', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。' },
            WINTER: { water: 'ほぼ断水', waterIntervalDays: INTERVAL_WATER_STOP, light: '日当たり良好', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '不要。完全に乾燥させる。' }
        },
        maintenance: { fertilizer: '施肥不要 (または5月)', repotting: '5月〜7月', pruning: '不要' }
    },
    {
        id: 6, species: 'ドラセナ', scientific: 'Dracaena fragrans', minTemp: 10, difficulty: '中程度', feature: '幸福の木、葉水必須', img: 'dracaena.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。ハダニ予防に必須。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。葉先が枯れやすいので重点的に。' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日なた/半日陰', mist: '毎日1回。' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', waterIntervalDays: 14, light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週2-3回。暖房の風が当たらないように。' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜8月 (切り戻し)' }
    },
    {
        id: 7, species: 'シェフレラ', scientific: 'Schefflera arboricola', minTemp: 5, difficulty: '容易', feature: '非常に丈夫、耐陰性強い', img: 'schefflera.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰 (時々日光浴)', mist: '2-3日に1回。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰 (時々日光浴)', mist: '毎日1回。' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '半日陰', mist: '2-3日に1回。' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '週1回。葉の汚れを落とす程度。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜12月 (樹形維持)' }
    },
    {
        id: 8, species: 'ユッカ', scientific: 'Yucca', minTemp: -3, difficulty: '容易', feature: '乾燥管理、強い耐寒性', img: 'yucca.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。葉のシワや土中の乾燥具合を見て水やりを行う。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '週1-2回。あまり必要としない。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '週2-3回。夕方の涼しい時間帯に。' },
            AUTUMN: { water: '土表面が乾いてから2日後', waterIntervalDays: 14, light: '日当たり良好', mist: '週1回。' },
            WINTER: { water: '土中が乾いてから3日後 (少量)', waterIntervalDays: 14, light: '日当たり良好', tempRisk: '断水で休眠誘導。管理容易。', mist: '不要（または月1回）。' } 
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜11月 (古葉除去)' }
    },
    {
        id: 9, species: 'アンスリウム', scientific: 'Anthurium', minTemp: 10, difficulty: '中程度', feature: '花を観賞、多湿を好む', img: 'anthurium.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日陰 (直射日光避)', mist: '毎日1回。湿度維持が重要。' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '明るい日陰 (直射日光避)', mist: '毎日朝夕。葉の周りの湿度を高める。' }, 
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '明るい日陰', mist: '毎日1回。' },
            WINTER: { water: '土中が乾いてから2日後', waterIntervalDays: 14, light: '明るい日陰', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週2-3回。暖かい昼間に。花にはかけない。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '花後の剪定' }
    },
    {
        id: 10, species: 'ポトス', scientific: 'Epipremnum aureum', minTemp: 10, difficulty: '容易', feature: '耐陰性あり、つる性', img: 'pothos.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日1回。気根にも水分を。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '半日陰', mist: '毎日朝夕。' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '半日陰', mist: '毎日1回。' },
            WINTER: { water: '土中が乾いてから2日後', waterIntervalDays: 14, light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週2-3回。乾燥を防ぐ。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '5月〜9月 (つる整理)' }
    },
    {
        id: 11, species: 'アロカシア', scientific: 'Alocasia odora', minTemp: 10, difficulty: '中程度', feature: '葉の質感に多様性、休眠管理種あり', img: 'alocasia.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好 (緑葉種)', mist: '毎日1回。ハダニがつきやすいので裏面も。' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '日当たり良好 (緑葉種)', mist: '毎日朝夕。たっぷりと。' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日1回。' },
            WINTER: { water: '乾かし気味/休眠管理 (金属光沢種)', waterIntervalDays: 14, light: '日当たり良好', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週1-2回。休眠中は控えめに。' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '随時 (傷んだ葉除去)' }
    },
    {
        id: 12, species: 'インドゴムノキ', scientific: 'Ficus elastica', minTemp: 5, difficulty: '容易', feature: '日光で樹形が整う、葉が大きい', img: 'indian_rubber.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。大きな葉の埃を落とすように。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。' }, 
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '2-3日に1回。' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '日当たり良好/半日陰', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '週1回。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月 (樹形維持)' }
    },
    {
        id: 13, species: 'エバーフレッシュ', scientific: 'Cojoba arborea', minTemp: 10, difficulty: '中程度', feature: '夜に葉を閉じる、日陰で育つ', img: 'everfresh.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。葉が閉じている夜は避ける。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。乾燥すると落葉しやすい。' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日1回。' },
            WINTER: { water: '土中が乾いてから2日後 (少量)', waterIntervalDays: 14, light: '半日陰', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週2-3回。昼間の暖かい時間に。' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月 (過密部整理)' }
    },
    {
        id: 14, species: 'クロトン', scientific: 'Codiaeum variegatum', minTemp: 10, difficulty: '中程度', feature: '鮮やかな葉色、日光必須', img: 'croton.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好 (必須)', mist: '毎日1回。ハダニ予防。' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '日当たり良好 (必須)', mist: '毎日朝夕。' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '日当たり良好', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週1-2回。' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜9月 (樹形維持)' }
    },
    {
        id: 15, species: 'コーヒーノキ', scientific: 'Coffea arabica', minTemp: 10, difficulty: '難しい', feature: '日当たりを好む、熱帯植物', img: 'coffee_tree.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日1回。艶のある葉を保つため。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日朝夕。' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。' },
            WINTER: { water: '土表面が乾いたら少量', waterIntervalDays: 14, light: '日当たり良好', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週1-2回。暖房乾燥に注意。' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜8月', pruning: '5月〜8月 (徒長枝剪定)' }
    },
    {
        id: 16, species: 'トックリラン', scientific: 'Beaucarnea recurvata', minTemp: -3, difficulty: '容易', feature: '極めて乾燥に強い、基部肥大化', img: 'ponytail_palm.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '週1回. あまり必要ない。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 10, light: '日当たり良好', mist: '週1-2回。' },
            AUTUMN: { water: '土表面が乾いてから2日後', waterIntervalDays: 14, light: '日当たり良好', mist: '週1回。' },
            WINTER: { water: '土中が乾いてから3日後 (少量)', waterIntervalDays: 14, light: '日当たり良好', tempRisk: '断水で休眠誘導。管理容易。', mist: '不要。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '9月〜11月 (古葉除去)' }
    },
    {
        id: 17, species: 'ウンベラータ', scientific: 'Ficus umbellata', minTemp: 10, difficulty: '中程度', feature: '成長早い、剪定必須', img: 'ficus_umbellata.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '明るい日なた/半日陰', mist: '毎日1回。ハダニ予防に重要。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好/半日陰', mist: '毎日朝夕。大きな葉の裏も忘れずに。' },
            AUTUMN: { water: '土表面が乾いてから1日後', waterIntervalDays: 10, light: '日当たり良好/半日陰', mist: '毎日1回。' },
            WINTER: { water: '土中が乾いてから2日後 (少量)', waterIntervalDays: 14, light: '日当たり良好/半日陰', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週2-3回。乾燥による落葉を防ぐ。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '5月〜8月 (積極的な剪定)' }
    },
    {
        id: 18, species: 'オーガスタ', scientific: 'Strelitzia nicolai', minTemp: 5, difficulty: 'やや容易', feature: '極楽鳥花の仲間、大型化', img: 'augusta.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。' },
            SUMMER: { water: '土を乾かさないように', waterIntervalDays: 5, light: '日当たり良好', mist: '毎日1回。葉割れ防止に湿度を保つ。' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', waterIntervalDays: 14, light: '日当たり良好', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '週1回。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜8月', pruning: '随時 (古葉除去)' }
    },
    {
        id: 19, species: 'ビカクシダ', scientific: 'Platycerium', minTemp: 10, difficulty: '難しい', feature: '着生植物、水やり方法が特殊', img: 'staghorn_fern.jpg',
        water_method: '水苔が乾いたら、バケツに水を張り貯水葉ごと全体を浸す（ソーキング）。',
        management: {
            SPRING: { water: '水苔が乾いたら', waterIntervalDays: 7, light: '明るい日陰', mist: '毎日1回。全体的に湿らせる。' },
            SUMMER: { water: '水苔が乾いたら', waterIntervalDays: 7, light: '明るい日陰', mist: '毎日朝夕。空中の湿度を高く保つ。' },
            AUTUMN: { water: '水苔が乾いてから1日後', waterIntervalDays: 10, light: '明るい日陰', mist: '毎日1回。' },
            WINTER: { water: '水苔が乾いてから2日後 (頻度低)', waterIntervalDays: 14, light: '明るい日陰', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '週2-3回。暖房乾燥に注意。' }
        },
        maintenance: { fertilizer: '施肥不要 (または液肥)', repotting: '5月〜8月', pruning: '不要' }
    },
    {
        id: 20, species: 'アローカリア', scientific: 'Araucaria heterophylla', minTemp: 0, difficulty: '容易', feature: '強い耐寒性、コニファー', img: 'araucaria.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。' },
            SUMMER: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '毎日1回。' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '2-3日に1回。' },
            WINTER: { water: '土表面が乾いてから2日後 (少量)', waterIntervalDays: 10, light: '日当たり良好', tempRisk: '管理容易。', mist: '週1回。' }
        },
        maintenance: { fertilizer: '4月, 9月', repotting: '5月〜7月', pruning: '不要' }
    },
    {
        id: 21, species: 'アデニウム', scientific: 'Adenium obesum', minTemp: 10, difficulty: 'やや容易', feature: '塊根植物、砂漠のバラ、乾燥に非常に強い', img: 'adenium.jpg.jpeg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。受け皿の水はすぐに捨てる。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ (完全に乾いてから)', waterIntervalDays: 10, light: '日当たり良好 (屋外/風通し良く)', mist: '不要（または週1回）。' },
            SUMMER: { water: '土表面が乾いたらすぐ (完全に乾いてから)', waterIntervalDays: 7, light: '日当たり良好 (屋外/直射日光可)', mist: '週1-2回。夕方に軽く。' },
            AUTUMN: { water: '土表面が乾いてから2-3日後 (徐々に頻度減)', waterIntervalDays: 14, light: '日当たり良好', mist: '不要。' },
            WINTER: { water: '**断水** (落葉時)。葉が残る場合は少量。', waterIntervalDays: INTERVAL_WATER_STOP, light: '日当たり良好', tempRisk: '厳重な温度管理（最低10℃確保）', mist: '不要。' }
        },
        maintenance: { fertilizer: '5月, 8月', repotting: '5月〜7月', pruning: '5月〜9月 (樹形維持)' }
    },
    {
        id: 22, species: 'エケベリア', scientific: 'Echeveria', minTemp: 5, difficulty: '容易', feature: '春秋型、ロゼット状、紅葉する多肉植物', img: 'echeveria.jpg.jpeg',
        water_method: '鉢底から水が流れ出るまでたっぷりと. 葉のシワや土中の乾燥具合を見て水やりを行う。',
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好 (風通し良く)', mist: '不要。水が溜まると腐る。' },
            SUMMER: { water: '断水/控えめ (月に1回程度、夕方)', waterIntervalDays: 30, light: '半日陰 (蒸れ注意)', mist: '不要。蒸れ厳禁。' },
            AUTUMN: { water: '土表面が乾いたらすぐ (紅葉のために控えめ)', waterIntervalDays: 7, light: '日当たり良好 (寒さに当てる)', mist: '不要。' },
            WINTER: { water: '断水/控えめ (葉にシワが出たら少量)', waterIntervalDays: 30, light: '日当たり良好', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '不要。' }
        },
        maintenance: { fertilizer: '4月, 9月 (秋は早めに)', repotting: '3月〜5月, 9月〜11月', pruning: '不要 (古葉除去)' }
    },
    // No. 23: カランコエを追加
    {
        id: 23, 
        species: 'カランコエ', 
        scientific: 'Kalanchoe blossfeldiana', 
        minTemp: 5, 
        difficulty: '容易', 
        feature: '多肉植物、短日植物、色鮮やかな花を咲かせる', 
        img: 'kalanchoe.jpg',
        water_method: '鉢底から水が流れ出るまでたっぷりと。葉に水がかからないように注意する。', 
        management: {
            SPRING: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '不要。蒸れに弱いため避ける。' },
            SUMMER: { water: '土表面が乾いてから2-3日後', waterIntervalDays: 10, light: '半日陰 (風通し良く)', mist: '不要。' },
            AUTUMN: { water: '土表面が乾いたらすぐ', waterIntervalDays: 7, light: '日当たり良好', mist: '不要。' },
            WINTER: { water: '土中が乾いてから2-3日後 (少量)', waterIntervalDays: 14, light: '日当たり良好', tempRisk: '夜間窓際隔離（最低5℃確保）', mist: '不要。' }
        },
        maintenance: { fertilizer: '5月〜9月 (花期を除く)', repotting: '5月〜6月', pruning: '花後の切り戻し' }
    }
];

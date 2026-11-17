/**
 * Встроенный справочник КБЖУ кондитерских ингредиентов на 100 г.
 * Значения ориентировочные, приведены к типичным продуктам из открытых таблиц
 * состава (USDA и справочники пищевой ценности). Пользователь всегда может
 * отредактировать цифры или оставить поля пустыми.
 */
export type NutritionGroup = 'sugars' | 'gelling' | 'dairy' | 'fruit' | 'dry'

export interface NutritionPreset {
  id: string
  name: string
  group: NutritionGroup
  /** Альтернативные написания для поиска */
  aliases?: string[]
  kcal: number
  proteins: number
  fats: number
  carbs: number
}

export const NUTRITION_GROUP_LABELS: Record<NutritionGroup, string> = {
  sugars: 'Сахар и подсластители',
  gelling: 'Желирующие и загустители',
  dairy: 'Яичные и молочные',
  fruit: 'Фрукты, ягоды и пюре',
  dry: 'Шоколад, орехи, какао, мука',
}

export const NUTRITION_PRESETS: NutritionPreset[] = [
  // ───────────────── Сахар и подсластители ─────────────────
  { id: 'sugar', name: 'Сахар-песок', group: 'sugars', aliases: ['сахар', 'сахарный песок'], kcal: 398, proteins: 0, fats: 0, carbs: 99.8 },
  { id: 'powdered-sugar', name: 'Сахарная пудра', group: 'sugars', aliases: ['пудра'], kcal: 398, proteins: 0, fats: 0, carbs: 99.8 },
  { id: 'cane-sugar', name: 'Сахар тростниковый', group: 'sugars', aliases: ['коричневый сахар', 'демерара'], kcal: 396, proteins: 0, fats: 0, carbs: 99 },
  { id: 'glucose-syrup', name: 'Глюкозный сироп', group: 'sugars', aliases: ['сироп глюкозы'], kcal: 320, proteins: 0, fats: 0, carbs: 80 },
  { id: 'invert-syrup', name: 'Инвертный сироп', group: 'sugars', aliases: ['инверт'], kcal: 304, proteins: 0, fats: 0, carbs: 76 },
  { id: 'honey', name: 'Мёд', group: 'sugars', aliases: ['мед'], kcal: 304, proteins: 0.3, fats: 0, carbs: 82.4 },
  { id: 'erythritol', name: 'Эритрит', group: 'sugars', aliases: ['эритритол'], kcal: 0, proteins: 0, fats: 0, carbs: 0 },
  { id: 'isomalt', name: 'Изомальт', group: 'sugars', aliases: ['изомальтит'], kcal: 200, proteins: 0, fats: 0, carbs: 98 },
  { id: 'xylitol', name: 'Ксилит', group: 'sugars', kcal: 240, proteins: 0, fats: 0, carbs: 99 },
  { id: 'sorbitol', name: 'Сорбит', group: 'sugars', kcal: 260, proteins: 0, fats: 0, carbs: 99 },
  { id: 'stevia', name: 'Экстракт стевии', group: 'sugars', aliases: ['стевия', 'стевиозид'], kcal: 0, proteins: 0, fats: 0, carbs: 0 },
  { id: 'agave-syrup', name: 'Сироп агавы', group: 'sugars', kcal: 310, proteins: 0, fats: 0, carbs: 76 },
  { id: 'molasses', name: 'Патока', group: 'sugars', aliases: ['меласса'], kcal: 290, proteins: 0, fats: 0, carbs: 78 },
  { id: 'maltodextrin', name: 'Мальтодекстрин', group: 'sugars', kcal: 380, proteins: 0, fats: 0, carbs: 95 },
  { id: 'coconut-sugar', name: 'Сахар кокосовый', group: 'sugars', kcal: 380, proteins: 0, fats: 0, carbs: 90 },
  { id: 'fructose', name: 'Фруктоза', group: 'sugars', kcal: 368, proteins: 0, fats: 0, carbs: 99.8 },
  { id: 'condensed-milk', name: 'Сгущённое молоко', group: 'sugars', aliases: ['сгущенка', 'сгущенное молоко'], kcal: 321, proteins: 7.9, fats: 8.7, carbs: 54.4 },
  { id: 'boiled-condensed-milk', name: 'Сгущённое молоко варёное', group: 'sugars', aliases: ['вареная сгущенка', 'ирис'], kcal: 340, proteins: 7, fats: 8, carbs: 58 },

  // ──────────────── Желирующие и загустители ────────────────
  // Внимание: в задании для агар-агара указано 900 — это сила геля (г/см²),
  // а не калорийность. Здесь используется пищевая ценность сухого агар-агара.
  { id: 'agar-agar', name: 'Агар-агар', group: 'gelling', aliases: ['агар'], kcal: 306, proteins: 6.2, fats: 0.3, carbs: 80.9 },
  { id: 'apple-pectin', name: 'Пектин яблочный', group: 'gelling', aliases: ['пектин'], kcal: 325, proteins: 0.3, fats: 0.1, carbs: 85 },
  { id: 'citrus-pectin', name: 'Пектин цитрусовый', group: 'gelling', kcal: 320, proteins: 0.2, fats: 0.1, carbs: 88 },
  { id: 'pectin-nh', name: 'Пектин NH', group: 'gelling', aliases: ['пектин nh', 'амидированный пектин'], kcal: 320, proteins: 0.2, fats: 0.1, carbs: 88 },
  { id: 'gelatin-powder', name: 'Желатин (порошок)', group: 'gelling', aliases: ['желатин'], kcal: 335, proteins: 85.6, fats: 0.1, carbs: 0 },
  { id: 'gelatin-leaf', name: 'Желатин (листовой)', group: 'gelling', aliases: ['желатин листовой', 'желатиновые листы'], kcal: 330, proteins: 84, fats: 0.1, carbs: 0 },
  { id: 'corn-starch', name: 'Крахмал кукурузный', group: 'gelling', aliases: ['крахмал'], kcal: 381, proteins: 0.3, fats: 0.1, carbs: 91.3 },
  { id: 'potato-starch', name: 'Крахмал картофельный', group: 'gelling', kcal: 357, proteins: 0.1, fats: 0.1, carbs: 83 },
  { id: 'xanthan-gum', name: 'Ксантановая камедь', group: 'gelling', aliases: ['ксантан'], kcal: 320, proteins: 6, fats: 0, carbs: 79 },
  { id: 'guar-gum', name: 'Гуаровая камедь', group: 'gelling', aliases: ['гуар'], kcal: 200, proteins: 5, fats: 0, carbs: 80 },
  { id: 'carrageenan', name: 'Каррагинан', group: 'gelling', kcal: 250, proteins: 1, fats: 0, carbs: 75 },
  { id: 'modified-starch', name: 'Крахмал модифицированный', group: 'gelling', kcal: 350, proteins: 0.2, fats: 0.1, carbs: 87 },

  // ───────────────── Яичные и молочные ─────────────────
  { id: 'egg-white', name: 'Яичный белок (сырой)', group: 'dairy', aliases: ['белок', 'белки'], kcal: 52, proteins: 10.9, fats: 0.2, carbs: 0.7 },
  { id: 'egg-albumin', name: 'Альбумин (сухой белок)', group: 'dairy', aliases: ['сухой белок', 'альбумин'], kcal: 382, proteins: 81, fats: 0.2, carbs: 7.8 },
  { id: 'egg-yolk', name: 'Желток', group: 'dairy', aliases: ['желтки'], kcal: 322, proteins: 15.9, fats: 26.5, carbs: 3.6 },
  { id: 'egg-whole', name: 'Яйцо куриное', group: 'dairy', aliases: ['яйцо', 'яйца'], kcal: 143, proteins: 12.6, fats: 9.5, carbs: 0.7 },
  { id: 'quail-egg', name: 'Яйцо перепелиное', group: 'dairy', aliases: ['перепелиное яйцо'], kcal: 158, proteins: 13, fats: 11, carbs: 0.4 },
  { id: 'egg-melange', name: 'Меланж яичный', group: 'dairy', aliases: ['меланж'], kcal: 157, proteins: 12.7, fats: 11.5, carbs: 0.7 },
  { id: 'butter-825', name: 'Масло сливочное 82,5%', group: 'dairy', aliases: ['масло сливочное', 'сливочное масло'], kcal: 748, proteins: 0.5, fats: 82.5, carbs: 0.8 },
  { id: 'ghee', name: 'Масло топлёное', group: 'dairy', aliases: ['гхи'], kcal: 892, proteins: 0.2, fats: 99, carbs: 0 },
  { id: 'cream-33', name: 'Сливки 33%', group: 'dairy', aliases: ['сливки'], kcal: 322, proteins: 2.2, fats: 33, carbs: 3.2 },
  { id: 'cream-20', name: 'Сливки 20%', group: 'dairy', kcal: 205, proteins: 2.5, fats: 20, carbs: 3.7 },
  { id: 'cream-dry', name: 'Сливки сухие', group: 'dairy', kcal: 567, proteins: 22, fats: 50, carbs: 19 },
  { id: 'cream-cheese', name: 'Творожный сыр', group: 'dairy', aliases: ['крем-чиз', 'cream cheese'], kcal: 250, proteins: 6, fats: 22, carbs: 3.5 },
  { id: 'mascarpone', name: 'Маскарпоне', group: 'dairy', kcal: 430, proteins: 4.5, fats: 44, carbs: 4.5 },
  { id: 'ricotta', name: 'Рикотта', group: 'dairy', kcal: 174, proteins: 11, fats: 13, carbs: 3 },
  { id: 'milk-32', name: 'Молоко 3,2%', group: 'dairy', aliases: ['молоко'], kcal: 59, proteins: 2.9, fats: 3.2, carbs: 4.7 },
  { id: 'milk-powder', name: 'Молоко сухое', group: 'dairy', kcal: 496, proteins: 26.3, fats: 26.7, carbs: 38 },
  { id: 'milk-powder-skim', name: 'Молоко сухое обезжиренное', group: 'dairy', aliases: ['сом'], kcal: 362, proteins: 36, fats: 1, carbs: 52 },
  { id: 'yogurt-natural', name: 'Йогурт натуральный', group: 'dairy', aliases: ['йогурт'], kcal: 66, proteins: 4.3, fats: 3.2, carbs: 4.5 },
  { id: 'vegetable-oil', name: 'Масло растительное', group: 'dairy', aliases: ['масло подсолнечное'], kcal: 899, proteins: 0, fats: 99.9, carbs: 0 },
  { id: 'coconut-milk', name: 'Молоко кокосовое', group: 'dairy', kcal: 230, proteins: 2.3, fats: 24, carbs: 5.5 },

  // ───────────────── Фрукты, ягоды и пюре ─────────────────
  { id: 'apple-puree', name: 'Пюре яблочное', group: 'fruit', aliases: ['яблочное пюре'], kcal: 52, proteins: 0.2, fats: 0.2, carbs: 12.8 },
  { id: 'blackcurrant-puree', name: 'Пюре чёрной смородины', group: 'fruit', aliases: ['смородина', 'пюре смородины'], kcal: 44, proteins: 1, fats: 0.3, carbs: 9.6 },
  { id: 'raspberry-puree', name: 'Пюре малиновое', group: 'fruit', aliases: ['малина'], kcal: 42, proteins: 1.2, fats: 0.7, carbs: 7.9 },
  { id: 'strawberry-puree', name: 'Пюре клубничное', group: 'fruit', aliases: ['клубника', 'земляника'], kcal: 36, proteins: 0.7, fats: 0.4, carbs: 7.7 },
  { id: 'cherry-puree', name: 'Пюре вишнёвое', group: 'fruit', aliases: ['вишня'], kcal: 50, proteins: 1, fats: 0.3, carbs: 10.6 },
  { id: 'banana-puree', name: 'Пюре банановое', group: 'fruit', aliases: ['банан'], kcal: 89, proteins: 1.1, fats: 0.3, carbs: 22.8 },
  { id: 'mango-puree', name: 'Пюре манго', group: 'fruit', aliases: ['манго'], kcal: 60, proteins: 0.8, fats: 0.4, carbs: 15 },
  { id: 'peach-puree', name: 'Пюре персиковое', group: 'fruit', aliases: ['персик'], kcal: 45, proteins: 0.9, fats: 0.1, carbs: 10.5 },
  { id: 'pear-puree', name: 'Пюре грушевое', group: 'fruit', aliases: ['груша'], kcal: 48, proteins: 0.4, fats: 0.1, carbs: 12 },
  { id: 'apricot-puree', name: 'Пюре абрикосовое', group: 'fruit', aliases: ['абрикос'], kcal: 48, proteins: 1, fats: 0.1, carbs: 11 },
  { id: 'blueberry-puree', name: 'Пюре черничное', group: 'fruit', aliases: ['черника'], kcal: 57, proteins: 0.7, fats: 0.3, carbs: 12.1 },
  { id: 'cranberry-puree', name: 'Пюре клюквенное', group: 'fruit', aliases: ['клюква'], kcal: 46, proteins: 0.5, fats: 0.1, carbs: 12 },
  { id: 'lingonberry-puree', name: 'Пюре брусничное', group: 'fruit', aliases: ['брусника'], kcal: 43, proteins: 0.7, fats: 0.5, carbs: 8.2 },
  { id: 'orange-juice', name: 'Сок апельсиновый', group: 'fruit', aliases: ['апельсин'], kcal: 45, proteins: 0.7, fats: 0.2, carbs: 10.4 },
  { id: 'lemon-juice', name: 'Сок лимонный', group: 'fruit', aliases: ['лимон'], kcal: 22, proteins: 0.4, fats: 0.2, carbs: 6.9 },
  { id: 'lemon-acid', name: 'Кислота лимонная', group: 'fruit', aliases: ['лимонная кислота'], kcal: 0, proteins: 0, fats: 0, carbs: 0 },
  { id: 'apple-fresh', name: 'Яблоки свежие', group: 'fruit', aliases: ['яблоко'], kcal: 52, proteins: 0.4, fats: 0.4, carbs: 9.8 },
  { id: 'raisin', name: 'Изюм', group: 'fruit', kcal: 299, proteins: 3.1, fats: 0.5, carbs: 79 },
  { id: 'dates', name: 'Финики', group: 'fruit', aliases: ['финик'], kcal: 282, proteins: 2.5, fats: 0.4, carbs: 75 },
  { id: 'dried-apricot', name: 'Курага', group: 'fruit', kcal: 241, proteins: 3.4, fats: 0.5, carbs: 62.6 },
  { id: 'prune', name: 'Чернослив', group: 'fruit', kcal: 240, proteins: 2.2, fats: 0.4, carbs: 63.9 },
  { id: 'candied-fruit', name: 'Цукаты', group: 'fruit', kcal: 322, proteins: 0.3, fats: 0.1, carbs: 80 },
  { id: 'apricot-jam', name: 'Джем абрикосовый', group: 'fruit', aliases: ['джем'], kcal: 250, proteins: 0.3, fats: 0.1, carbs: 62 },

  // ───────────────── Шоколад, орехи, какао, мука ─────────────────
  { id: 'chocolate-dark', name: 'Шоколад тёмный 70%', group: 'dry', aliases: ['темный шоколад', 'шоколад'], kcal: 598, proteins: 7.8, fats: 42.6, carbs: 45.9 },
  { id: 'chocolate-milk', name: 'Шоколад молочный', group: 'dry', kcal: 535, proteins: 7.6, fats: 29.7, carbs: 59.4 },
  { id: 'chocolate-white', name: 'Шоколад белый', group: 'dry', kcal: 539, proteins: 6, fats: 32, carbs: 59 },
  { id: 'chocolate-ruby', name: 'Шоколад рубиновый', group: 'dry', kcal: 540, proteins: 6.5, fats: 32, carbs: 56 },
  { id: 'chocolate-drops', name: 'Капли шоколадные', group: 'dry', aliases: ['шоколадные капли', 'каллеты'], kcal: 530, proteins: 6, fats: 30, carbs: 60 },
  { id: 'cocoa-powder', name: 'Какао-порошок', group: 'dry', aliases: ['какао'], kcal: 228, proteins: 19.6, fats: 13.7, carbs: 57.9 },
  { id: 'cocoa-butter', name: 'Какао-масло', group: 'dry', kcal: 884, proteins: 0, fats: 100, carbs: 0 },
  { id: 'cocoa-mass', name: 'Какао тёртое', group: 'dry', aliases: ['какао тертое'], kcal: 580, proteins: 12, fats: 53, carbs: 14 },
  { id: 'almond-flour', name: 'Миндальная мука', group: 'dry', aliases: ['мука миндальная'], kcal: 579, proteins: 21.2, fats: 49.9, carbs: 21.6 },
  { id: 'hazelnut-flour', name: 'Фундучная мука', group: 'dry', aliases: ['мука фундучная'], kcal: 628, proteins: 15, fats: 61, carbs: 17 },
  { id: 'wheat-flour', name: 'Мука пшеничная в/с', group: 'dry', aliases: ['мука', 'мука пшеничная'], kcal: 334, proteins: 10.3, fats: 1.1, carbs: 70.6 },
  { id: 'rice-flour', name: 'Мука рисовая', group: 'dry', kcal: 366, proteins: 5.9, fats: 1.4, carbs: 80 },
  { id: 'corn-flour', name: 'Мука кукурузная', group: 'dry', kcal: 364, proteins: 7, fats: 1.2, carbs: 76 },
  { id: 'oat-flour', name: 'Мука овсяная', group: 'dry', kcal: 389, proteins: 13, fats: 6.5, carbs: 66 },
  { id: 'coconut-flour', name: 'Мука кокосовая', group: 'dry', kcal: 443, proteins: 19, fats: 15, carbs: 60 },
  { id: 'walnut', name: 'Грецкий орех', group: 'dry', aliases: ['орех грецкий'], kcal: 654, proteins: 15.2, fats: 65.2, carbs: 13.7 },
  { id: 'almond', name: 'Миндаль', group: 'dry', kcal: 579, proteins: 21.2, fats: 49.9, carbs: 21.6 },
  { id: 'pistachio', name: 'Фисташка', group: 'dry', kcal: 562, proteins: 20.2, fats: 45.3, carbs: 27.2 },
  { id: 'cashew', name: 'Кешью', group: 'dry', kcal: 553, proteins: 18.2, fats: 43.9, carbs: 30.2 },
  { id: 'peanut', name: 'Арахис', group: 'dry', kcal: 567, proteins: 25.8, fats: 49.2, carbs: 16.1 },
  { id: 'hazelnut', name: 'Фундук', group: 'dry', aliases: ['лесной орех'], kcal: 628, proteins: 15, fats: 60.8, carbs: 16.7 },
  { id: 'pecan', name: 'Пекан', group: 'dry', kcal: 691, proteins: 9.2, fats: 72, carbs: 13.9 },
  { id: 'sesame', name: 'Кунжут', group: 'dry', kcal: 573, proteins: 17.7, fats: 49.7, carbs: 23.4 },
  { id: 'poppy', name: 'Мак', group: 'dry', kcal: 525, proteins: 18, fats: 41.6, carbs: 28.1 },
  { id: 'coconut-flakes', name: 'Кокосовая стружка', group: 'dry', aliases: ['кокос'], kcal: 660, proteins: 6.9, fats: 64.5, carbs: 23.7 },
  { id: 'cinnamon', name: 'Корица', group: 'dry', kcal: 247, proteins: 4, fats: 1.2, carbs: 80.6 },
  { id: 'vanilla-extract', name: 'Ванильный экстракт', group: 'dry', aliases: ['ваниль'], kcal: 288, proteins: 0.1, fats: 0.1, carbs: 12.7 },
  { id: 'salt', name: 'Соль', group: 'dry', kcal: 0, proteins: 0, fats: 0, carbs: 0 },
  { id: 'water', name: 'Вода', group: 'dry', kcal: 0, proteins: 0, fats: 0, carbs: 0 },
  { id: 'baking-powder', name: 'Разрыхлитель', group: 'dry', kcal: 53, proteins: 0, fats: 0, carbs: 27.7 },
  { id: 'soda', name: 'Сода пищевая', group: 'dry', aliases: ['сода'], kcal: 0, proteins: 0, fats: 0, carbs: 0 },
]

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/ё/g, 'е')
}

/** Поиск по справочнику: точное совпадение → начало названия → вхождение → алиас. */
export function searchNutritionPresets(query: string, limit = 6): NutritionPreset[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const scored: { preset: NutritionPreset; score: number }[] = []

  for (const preset of NUTRITION_PRESETS) {
    const name = normalize(preset.name)
    let score = Number.POSITIVE_INFINITY

    if (name === q) score = 0
    else if (name.startsWith(q)) score = 1
    else if (name.includes(q)) score = 2
    else if (preset.aliases?.some((alias) => normalize(alias).startsWith(q))) score = 3
    else if (preset.aliases?.some((alias) => normalize(alias).includes(q))) score = 4

    if (score !== Number.POSITIVE_INFINITY) scored.push({ preset, score })
  }

  return scored
    .sort((a, b) => a.score - b.score || a.preset.name.localeCompare(b.preset.name, 'ru'))
    .slice(0, limit)
    .map((entry) => entry.preset)
}

/** Точное совпадение названия или алиаса — для автоподстановки КБЖУ. */
export function findNutritionPresetByName(name: string): NutritionPreset | undefined {
  const q = normalize(name)
  if (!q) return undefined
  return (
    NUTRITION_PRESETS.find((preset) => normalize(preset.name) === q) ??
    NUTRITION_PRESETS.find((preset) => preset.aliases?.some((alias) => normalize(alias) === q))
  )
}

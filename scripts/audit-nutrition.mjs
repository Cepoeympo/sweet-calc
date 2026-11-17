/**
 * Аудит справочника КБЖУ: сверяет калорийность с расчётом по Атуотеру
 * (4 ккал/г белка, 9 ккал/г жира, 4 ккал/г углеводов) и показывает отклонения.
 * Запуск: node scripts/audit-nutrition.mjs
 */
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/data/nutritionPresets.ts', import.meta.url), 'utf8')

const rowPattern =
  /id: '([^']+)',\s*name: '([^']+)',\s*group: '([^']+)'.*?kcal: ([0-9.]+), proteins: ([0-9.]+), fats: ([0-9.]+), carbs: ([0-9.]+)/g

const rows = []
for (const match of source.matchAll(rowPattern)) {
  const [, id, name, group, kcal, proteins, fats, carbs] = match
  rows.push({
    id,
    name,
    group,
    kcal: Number(kcal),
    proteins: Number(proteins),
    fats: Number(fats),
    carbs: Number(carbs),
  })
}

const atwater = (row) => row.proteins * 4 + row.fats * 9 + row.carbs * 4

const analyzed = rows.map((row) => {
  const calculated = atwater(row)
  const deviation = row.kcal > 0 ? ((calculated - row.kcal) / row.kcal) * 100 : 0
  return { ...row, calculated, deviation }
})

const sorted = [...analyzed].sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))

console.log(`Позиций найдено: ${rows.length}`)
console.log('')
console.log('Отклонение калорийности от расчёта по БЖУ (проверяем вручную):')
console.log('')

for (const row of sorted) {
  if (Math.abs(row.deviation) < 12) continue
  console.log(
    `${row.deviation > 0 ? '+' : ''}${row.deviation.toFixed(0)}%  ${row.name.padEnd(32)} ` +
      `ккал ${row.kcal}  Б ${row.proteins}  Ж ${row.fats}  У ${row.carbs}  → по БЖУ ${row.calculated.toFixed(0)}`,
  )
}

const zeroKcalWithMacros = analyzed.filter(
  (row) => row.kcal === 0 && (row.proteins > 0 || row.fats > 0 || row.carbs > 0),
)
console.log('')
console.log(`Позиций с 0 ккал, но ненулевыми БЖУ: ${zeroKcalWithMacros.length}`)

const outOfRange = analyzed.filter(
  (row) =>
    row.kcal < 0 ||
    row.kcal > 900 ||
    row.proteins > 100 ||
    row.fats > 100 ||
    row.carbs > 100,
)
console.log(`Позиций с выходом за допустимые диапазоны: ${outOfRange.length}`)

const ids = new Set()
const duplicates = []
for (const row of rows) {
  if (ids.has(row.id)) duplicates.push(row.id)
  ids.add(row.id)
}
console.log(`Дубликатов идентификаторов: ${duplicates.length}${duplicates.length ? ` (${duplicates.join(', ')})` : ''}`)

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function getWeekRange(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = (d.getDay() + 6) % 7 // 0 = segunda
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

export function fmtDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function weekKey(dateStr) {
  const { start } = getWeekRange(dateStr)
  return start.toISOString().slice(0, 10)
}

export function monthKey(dateStr) {
  return dateStr.slice(0, 7)
}

export function monthLabel(mk) {
  const [y, m] = mk.split('-')
  const names = ['janeiro','fevereiro','março','abril','maio','junho','julho',
    'agosto','setembro','outubro','novembro','dezembro']
  return names[parseInt(m, 10) - 1] + '/' + y
}

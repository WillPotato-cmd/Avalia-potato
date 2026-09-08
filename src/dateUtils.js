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

export function monthLabelShort(mk) {
  const [y, m] = mk.split('-')
  const names = ['janeiro','fevereiro','março','abril','maio','junho','julho',
    'agosto','setembro','outubro','novembro','dezembro']
  return names[parseInt(m, 10) - 1] + '/' + y.slice(2)
}

export function currentMonthValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function addMonthsToKey(mk, delta) {
  const [y, m] = mk.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function subtractYearFromKey(mk) {
  const [y, m] = mk.split('-')
  return `${parseInt(y, 10) - 1}-${m}`
}

export function pctVar(atual, anterior) {
  if (!anterior) return null
  return ((atual - anterior) / anterior) * 100
}

export function fmtPct(v) {
  if (v === null || v === undefined || isNaN(v)) return 'N/A'
  const sinal = v > 0 ? '+' : ''
  return `${sinal}${v.toFixed(2).replace('.', ',')}%`
}

export function fmtMoeda(v) {
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\d(?=(\d{3})+,)/g, '$&.')
}

export function brDateToISO(br) {
  const m = br.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

export function parseIfoodText(raw) {
  const text = raw.replace(/\r/g, '').trim()
  const result = { pedido: '', data: '', nota: '', cliente: '', texto: '' }

  const pedidoMatch = text.match(/(\d{3,})\s*\n\s*Pedido feito em/i)
  if (pedidoMatch) result.pedido = pedidoMatch[1]

  const dataMatch = text.match(/Pedido feito em\s*(\d{2}\/\d{2}\/\d{4})/i)
  if (dataMatch) result.data = brDateToISO(dataMatch[1])

  const notaMatch = text.match(/Nota de avalia[cç][aã]o\s*\n\s*(\d)/i)
  if (notaMatch) result.nota = notaMatch[1]

  const clienteMatch = text.match(/\n([^\n]+?)\s+disse\b/i)
  if (clienteMatch) result.cliente = clienteMatch[1].trim()

  const emMatches = [...text.matchAll(/\nem\s+\d{2}\/\d{2}\/\d{4}\s*\n/gi)]
  if (emMatches.length) {
    const last = emMatches[emMatches.length - 1]
    const idx = last.index + last[0].length
    result.texto = text.slice(idx).trim()
  }
  return result
}

export function parse99FoodText(raw) {
  // Formato real: linha 1 = nome do cliente, linha 2 = "DD/MM/AAAA HH:MM", restante = comentário.
  const text = raw.replace(/\r/g, '').trim()
  const result = { pedido: '', data: '', nota: '', cliente: '', texto: '' }
  const linhas = text.split('\n').map(l => l.trim()).filter(l => l)

  let dataIdx = -1, dataEncontrada = null
  for (let i = 0; i < linhas.length; i++) {
    const m = linhas[i].match(/^(\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}$/)
    if (m) { dataIdx = i; dataEncontrada = m[1]; break }
  }

  if (dataIdx >= 0) {
    result.cliente = linhas.slice(0, dataIdx).join(' ').trim()
    result.data = brDateToISO(dataEncontrada)
    result.texto = linhas.slice(dataIdx + 1).join('\n').trim()
  } else {
    const m2 = text.match(/(\d{2}\/\d{2}\/\d{4})/)
    if (m2) result.data = brDateToISO(m2[1])
    result.texto = text
  }

  return result
}

export function parseSemanaLabel(label, ano) {
  const m = label.match(/\(?\s*(\d{1,2})\/(\d{1,2})/)
  if (!m) return null
  const dia = m[1].padStart(2, '0')
  const mes = m[2].padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function parseValorMonetario(str) {
  if (str == null) return 0
  const limpo = String(str).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(limpo)
  return isNaN(num) ? 0 : num
}

export function parseMesLabel(str, anoPadrao) {
  const s = str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  let m = s.match(/^(\d{4})-(\d{1,2})$/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`
  m = s.match(/^(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}`
  const nomes = ['janeiro','fevereiro','marco','abril','maio','junho','julho',
    'agosto','setembro','outubro','novembro','dezembro']
  m = s.match(/^([a-z]+)\s*\/?\s*(\d{2,4})?$/i)
  if (m) {
    const idx = nomes.indexOf(m[1])
    if (idx >= 0) {
      let ano = m[2] ? m[2] : String(anoPadrao)
      if (ano.length === 2) ano = '20' + ano
      return `${ano}-${String(idx + 1).padStart(2, '0')}`
    }
  }
  return null
}

export function parseMotivosString(str) {
  if (!str) return []
  return str.split(';').map(s => s.trim()).filter(Boolean).map(par => {
    const idx = par.lastIndexOf(':')
    if (idx === -1) return { motivo: par, quantidade: 1 }
    const motivo = par.slice(0, idx).trim()
    const qtd = parseInt(par.slice(idx + 1).trim(), 10) || 0
    return { motivo, quantidade: qtd }
  }).filter(m => m.motivo)
}

export function motivosToString(arr) {
  return (arr || []).map(m => `${m.motivo}:${m.quantidade}`).join('; ')
}

import React, { useMemo, useState } from 'react'
import { getWeekRange, fmtDate, weekKey, todayISO } from './dateUtils'

export default function RelatorioSemanal({ lojas, feedbacks }) {
  const weeks = useMemo(() => {
    const set = new Set(feedbacks.map(f => weekKey(f.data)))
    return [...set].sort().reverse()
  }, [feedbacks])

  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [semana, setSemana] = useState(weeks[0] || weekKey(todayISO()))
  const [copiado, setCopiado] = useState(false)

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre uma loja primeiro.</p></div>
  }

  const lojaAtual = lojaId || lojas[0].id
  const wk = semana || weeks[0] || weekKey(todayISO())
  const loja = lojas.find(l => l.id === lojaAtual)
  const { start, end } = getWeekRange(wk)

  const items = feedbacks
    .filter(f => f.loja_id === lojaAtual && weekKey(f.data) === wk)
    .sort((a, b) => a.data.localeCompare(b.data))

  let texto = ''
  let media = 0
  if (items.length > 0) {
    media = items.reduce((s, f) => s + f.nota, 0) / items.length
    texto = `Relatório de feedbacks — ${loja?.nome}\n`
    texto += `Semana: ${fmtDate(start)} a ${fmtDate(end)}\n\n`
    items.forEach((f, i) => {
      const d = new Date(f.data + 'T00:00:00')
      texto += `${i + 1}. ${fmtDate(d)} — Nota ${f.nota}${f.texto ? `\n"${f.texto}"` : ' (sem comentário)'}\n\n`
    })
    texto += `Média da semana: ${media.toFixed(2)} (${items.length} avaliação${items.length > 1 ? 'ões' : ''})`
  }

  function copiar() {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    })
  }

  const weekOptions = weeks.length ? weeks : [wk]

  return (
    <div className="card">
      <h2>Relatório semanal</h2>
      <div className="row">
        <div>
          <label>Loja</label>
          <select value={lojaAtual} onChange={e => setLojaId(e.target.value)}>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
        <div>
          <label>Semana</label>
          <select value={wk} onChange={e => setSemana(e.target.value)}>
            {weekOptions.map(w => {
              const r = getWeekRange(w)
              return <option key={w} value={w}>{fmtDate(r.start)} a {fmtDate(r.end)}</option>
            })}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="empty">Nenhum feedback registrado para essa loja nessa semana.</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div className="metric-grid">
            <div className="metric"><div className="label">Feedbacks na semana</div><div className="value">{items.length}</div></div>
            <div className="metric"><div className="label">Média da semana</div><div className="value">{media.toFixed(2)}</div></div>
          </div>
          <label>Texto pronto para enviar</label>
          <textarea className="report" readOnly value={texto} />
          <button className="btn-secondary" style={{ marginTop: 10 }} onClick={copiar}>Copiar texto</button>
          {copiado && <span className="copied">Copiado!</span>}
        </div>
      )}
    </div>
  )
}

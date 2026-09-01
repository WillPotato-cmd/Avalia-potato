import React, { useMemo, useState } from 'react'
import { getWeekRange, fmtDate, weekKey, monthKey, monthLabel, todayISO } from './dateUtils'

export default function PanoramaMensal({ lojas, feedbacks }) {
  const months = useMemo(() => {
    const set = new Set(feedbacks.map(f => monthKey(f.data)))
    return [...set].sort().reverse()
  }, [feedbacks])

  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [mes, setMes] = useState(months[0] || monthKey(todayISO()))
  const [copiado, setCopiado] = useState(false)

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre uma loja primeiro.</p></div>
  }

  const lojaAtual = lojaId || lojas[0].id
  const mk = mes || months[0] || monthKey(todayISO())
  const loja = lojas.find(l => l.id === lojaAtual)

  const itemsDoMes = feedbacks.filter(f => f.loja_id === lojaAtual && monthKey(f.data) === mk)

  let texto = '', mediaGeral = 0, weekAverages = []
  if (itemsDoMes.length > 0) {
    const byWeek = {}
    itemsDoMes.forEach(f => {
      const wk = weekKey(f.data)
      if (!byWeek[wk]) byWeek[wk] = []
      byWeek[wk].push(f)
    })
    const weekKeys = Object.keys(byWeek).sort()
    weekAverages = weekKeys.map(wk => {
      const arr = byWeek[wk]
      const media = arr.reduce((s, f) => s + f.nota, 0) / arr.length
      return { wk, media, count: arr.length }
    })

    const totalAvaliacoes = itemsDoMes.length
    mediaGeral = itemsDoMes.reduce((s, f) => s + f.nota, 0) / totalAvaliacoes
    const comTexto = itemsDoMes.filter(f => f.texto).length
    const semTexto = totalAvaliacoes - comTexto

    texto = `Panorama mensal — ${loja?.nome}\n`
    texto += `Mês: ${monthLabel(mk)}\n\n`
    weekAverages.forEach((w, i) => {
      const r = getWeekRange(w.wk)
      texto += `Semana ${i + 1} (${fmtDate(r.start)} a ${fmtDate(r.end)}): média ${w.media.toFixed(2)} — ${w.count} avaliação(ões)\n`
    })
    texto += `\nTotal de avaliações no mês: ${totalAvaliacoes} (${comTexto} com comentário, ${semTexto} só com nota)\n`
    texto += `Média geral do mês: ${mediaGeral.toFixed(2)}`
  }

  function copiar() {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    })
  }

  const monthOptions = months.length ? months : [mk]

  return (
    <div className="card">
      <h2>Panorama mensal</h2>
      <div className="row">
        <div>
          <label>Loja</label>
          <select value={lojaAtual} onChange={e => setLojaId(e.target.value)}>
            {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
        <div>
          <label>Mês</label>
          <select value={mk} onChange={e => setMes(e.target.value)}>
            {monthOptions.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      {itemsDoMes.length === 0 ? (
        <p className="empty">Nenhum feedback registrado para essa loja nesse mês.</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div className="metric-grid">
            <div className="metric"><div className="label">Média geral do mês</div><div className="value">{mediaGeral.toFixed(2)}</div></div>
            <div className="metric"><div className="label">Total de avaliações</div><div className="value">{itemsDoMes.length}</div></div>
            <div className="metric"><div className="label">Semanas com dados</div><div className="value">{weekAverages.length}</div></div>
          </div>
          <table style={{ marginBottom: 16 }}>
            <thead><tr><th>Semana</th><th>Período</th><th>Avaliações</th><th>Média</th></tr></thead>
            <tbody>
              {weekAverages.map((w, i) => {
                const r = getWeekRange(w.wk)
                return (
                  <tr key={w.wk}>
                    <td>Semana {i + 1}</td>
                    <td>{fmtDate(r.start)} a {fmtDate(r.end)}</td>
                    <td>{w.count}</td>
                    <td>{w.media.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <label>Texto pronto para enviar</label>
          <textarea className="report" readOnly value={texto} style={{ minHeight: 200 }} />
          <button className="btn-secondary" style={{ marginTop: 10 }} onClick={copiar}>Copiar texto</button>
          {copiado && <span className="copied">Copiado!</span>}
        </div>
      )}
    </div>
  )
}

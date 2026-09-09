import React, { useState } from 'react'

export default function NotasTotais({ lojas, feedbacks, notasSecas }) {
  const hoje = new Date()
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [inicio, setInicio] = useState(primeiroDia)
  const [fim, setFim] = useState(ultimoDia)
  const [origemFiltro, setOrigemFiltro] = useState('ambos')
  const [copiado, setCopiado] = useState(false)

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre uma loja primeiro.</p></div>
  }

  function fmtDataBR(iso) {
    const [, m, d] = iso.split('-')
    return `${d}/${m}`
  }

  function monthRangeDates(mk) {
    const [y, m] = mk.split('-')
    const first = `${y}-${m}-01`
    const last = new Date(parseInt(y, 10), parseInt(m, 10), 0).toISOString().slice(0, 10)
    return { first, last }
  }

  let itemsNoPeriodo = feedbacks.filter(f => f.data >= inicio && f.data <= fim)
  let secasNoPeriodo = notasSecas.filter(n => {
    const { first, last } = monthRangeDates(n.mes)
    return last >= inicio && first <= fim
  })

  if (origemFiltro !== 'ambos') {
    itemsNoPeriodo = itemsNoPeriodo.filter(f => f.origem === origemFiltro)
    secasNoPeriodo = secasNoPeriodo.filter(n => n.origem === origemFiltro)
  }

  const origemLabel = origemFiltro === 'ifood' ? ' (somente iFood)' : origemFiltro === '99food' ? ' (somente 99Food)' : ''

  const regioesMap = {}
  const ordemRegioes = []
  lojas.forEach(l => {
    const reg = (l.regiao && l.regiao.trim()) || 'Sem região'
    if (!regioesMap[reg]) { regioesMap[reg] = []; ordemRegioes.push(reg) }
    regioesMap[reg].push(l)
  })

  let texto = ''
  const blocos = []

  if (itemsNoPeriodo.length > 0 || secasNoPeriodo.length > 0) {
    ordemRegioes.forEach(regiao => {
      const lojasDaRegiao = regioesMap[regiao].filter(l =>
        itemsNoPeriodo.some(f => f.loja_id === l.id) || secasNoPeriodo.some(n => n.loja_id === l.id)
      )
      if (lojasDaRegiao.length === 0) return

      texto += `${regiao}${origemLabel}\n`
      texto += `Agora a média mensal com base em todas as avaliações _(*com* e *sem comentários*)_ entre ${fmtDataBR(inicio)} e ${fmtDataBR(fim)}:\n`

      const linhasLojas = []
      lojasDaRegiao.forEach((loja, idx) => {
        const itemsLoja = itemsNoPeriodo.filter(f => f.loja_id === loja.id)
        const secasLoja = secasNoPeriodo.filter(n => n.loja_id === loja.id)
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        itemsLoja.forEach(f => { counts[f.nota]++ })
        secasLoja.forEach(n => { counts[n.nota] += n.quantidade })
        const total = counts[5] + counts[4] + counts[3] + counts[2] + counts[1]
        const soma = counts[5] * 5 + counts[4] * 4 + counts[3] * 3 + counts[2] * 2 + counts[1] * 1
        const media = total > 0 ? soma / total : 0
        const mediaStr = media.toFixed(2).replace('.', ',')

        texto += `*${loja.nome}:*\n`
        texto += `Nota 5: ${counts[5]}\nNota 4: ${counts[4]}\nNota 3: ${counts[3]}\nNota 2: ${counts[2]}\nNota 1: ${counts[1]}\n`
        texto += `> *Média: ${mediaStr}* ⭐\n`
        if (idx < lojasDaRegiao.length - 1) texto += `--------------------------------------\n`

        linhasLojas.push({ nome: loja.nome, counts, mediaStr })
      })
      texto += `\n\n`
      blocos.push({ regiao, linhasLojas })
    })
  }

  function copiar() {
    navigator.clipboard.writeText(texto.trim()).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    })
  }

  return (
    <div className="card">
      <h2>Notas totais por região</h2>
      <p className="muted">Conta quantas notas 5, 4, 3, 2 e 1 cada loja recebeu no período (com e sem comentário) e calcula a média ponderada, agrupando por região.</p>
      <div className="row">
        <div>
          <label>De</label>
          <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
        </div>
        <div>
          <label>Até</label>
          <input type="date" value={fim} onChange={e => setFim(e.target.value)} />
        </div>
        <div>
          <label>Origem</label>
          <select value={origemFiltro} onChange={e => setOrigemFiltro(e.target.value)}>
            <option value="ambos">Ambos (iFood + 99Food)</option>
            <option value="ifood">Somente iFood</option>
            <option value="99food">Somente 99Food</option>
          </select>
        </div>
      </div>

      {blocos.length === 0 ? (
        <p className="empty">Nenhum feedback ou nota registrada nesse período{origemFiltro !== 'ambos' ? ' para essa origem' : ''}.</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          {blocos.map(b => (
            <div key={b.regiao}>
              <h2 style={{ marginTop: 20 }}>{b.regiao}{origemLabel}</h2>
              <table>
                <thead><tr><th>Loja</th><th>5</th><th>4</th><th>3</th><th>2</th><th>1</th><th>Média</th></tr></thead>
                <tbody>
                  {b.linhasLojas.map(l => (
                    <tr key={l.nome}>
                      <td>{l.nome}</td><td>{l.counts[5]}</td><td>{l.counts[4]}</td><td>{l.counts[3]}</td>
                      <td>{l.counts[2]}</td><td>{l.counts[1]}</td><td><strong>{l.mediaStr}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <label style={{ marginTop: 16 }}>Texto pronto para enviar</label>
          <textarea className="report" readOnly value={texto.trim()} style={{ minHeight: 320 }} />
          <button className="btn-secondary" style={{ marginTop: 10 }} onClick={copiar}>Copiar texto</button>
          {copiado && <span className="copied">Copiado!</span>}
        </div>
      )}
    </div>
  )
}

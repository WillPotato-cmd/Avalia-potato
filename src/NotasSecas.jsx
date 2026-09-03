import React, { useMemo, useState } from 'react'
import { supabase } from './supabaseClient'
import { currentMonthValue, monthLabelShort } from './dateUtils'

function ScoreBadge({ n }) {
  return <span className={`badge b${n}`}>{n}</span>
}

function OrigemTag({ origem }) {
  if (!origem) return null
  const label = origem === 'ifood' ? 'iFood' : '99Food'
  return <span className={`tag tag-${origem}`}>{label}</span>
}

export default function NotasSecas({ lojas, notasSecas, onChange }) {
  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [mes, setMes] = useState(currentMonthValue())
  const [origem, setOrigem] = useState('ifood')
  const [nota, setNota] = useState(5)
  const [qtd, setQtd] = useState(1)
  const [msg, setMsg] = useState(false)

  const [relLojaId, setRelLojaId] = useState(lojas[0]?.id || '')
  const [relMes, setRelMes] = useState(currentMonthValue())
  const [copiado, setCopiado] = useState(false)

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre pelo menos uma loja na aba "Lojas" antes de lançar notas.</p></div>
  }

  async function salvar() {
    const loja = lojaId || lojas[0].id
    if (!mes) { alert('Selecione o mês.'); return }
    if (!qtd || qtd < 1) { alert('Informe uma quantidade válida.'); return }
    const { error } = await supabase.from('notas_secas').insert({
      loja_id: loja, mes, origem, nota: parseInt(nota, 10), quantidade: parseInt(qtd, 10)
    })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setQtd(1)
    setMsg(true)
    setTimeout(() => setMsg(false), 1800)
    onChange()
  }

  async function excluir(id) {
    const { error } = await supabase.from('notas_secas').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    onChange()
  }

  const recentes = [...notasSecas]
    .sort((a, b) => b.mes.localeCompare(a.mes) || new Date(b.criado_em) - new Date(a.criado_em))
    .slice(0, 10)

  const relLojaAtual = relLojaId || lojas[0].id
  const relLoja = lojas.find(l => l.id === relLojaAtual)
  const itensRel = notasSecas.filter(n => n.loja_id === relLojaAtual && n.mes === relMes)

  let textoRel = '', totalRel = 0, mediaRel = 0
  const countsRel = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  if (itensRel.length > 0) {
    itensRel.forEach(n => { countsRel[n.nota] += n.quantidade })
    totalRel = countsRel[5] + countsRel[4] + countsRel[3] + countsRel[2] + countsRel[1]
    const soma = countsRel[5] * 5 + countsRel[4] * 4 + countsRel[3] * 3 + countsRel[2] * 2 + countsRel[1] * 1
    mediaRel = totalRel > 0 ? soma / totalRel : 0
    const mediaStr = mediaRel.toFixed(2).replace('.', ',')
    textoRel = `Mês de ${monthLabelShort(relMes)}\n`
    textoRel += `5 - ${countsRel[5]}\n4 - ${countsRel[4]}\n3 - ${countsRel[3]}\n2 - ${countsRel[2]}\n1 - ${countsRel[1]}\n`
    textoRel += `Total de Avaliações: ${totalRel}\n`
    textoRel += `Média das notas: ${mediaStr}`
  }

  function copiarRel() {
    navigator.clipboard.writeText(textoRel).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    })
  }

  return (
    <div>
      <div className="card">
        <h2>Notas secas (lançamento em massa)</h2>
        <p className="muted">Use aqui para lançar rapidamente notas sem comentário — ex: "essa loja recebeu 59 notas 5 nesse mês". Esses lançamentos não aparecem na lista de feedbacks nem nos relatórios semanal/mensal — eles só entram na conta dos relatórios "Notas totais" e do relatório mensal abaixo.</p>
        <label>Loja</label>
        <select value={lojaId || lojas[0].id} onChange={e => setLojaId(e.target.value)}>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <div className="row">
          <div>
            <label>Mês</label>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} />
          </div>
          <div>
            <label>Origem</label>
            <select value={origem} onChange={e => setOrigem(e.target.value)}>
              <option value="ifood">iFood</option>
              <option value="99food">99Food</option>
            </select>
          </div>
          <div>
            <label>Nota (1 a 5)</label>
            <select value={nota} onChange={e => setNota(e.target.value)}>
              <option value="5">5</option><option value="4">4</option><option value="3">3</option>
              <option value="2">2</option><option value="1">1</option>
            </select>
          </div>
          <div>
            <label>Quantidade</label>
            <input type="number" min="1" value={qtd} onChange={e => setQtd(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={salvar}>Adicionar</button>
        {msg && <p className="copied">Lançamento adicionado.</p>}

        <h2 style={{ marginTop: 28 }}>Lançamentos recentes</h2>
        <table>
          <thead><tr><th>Mês</th><th>Loja</th><th>Origem</th><th>Nota</th><th>Quantidade</th><th></th></tr></thead>
          <tbody>
            {recentes.length === 0 && <tr><td colSpan={6} className="empty">Nenhum lançamento ainda.</td></tr>}
            {recentes.map(n => {
              const loja = lojas.find(l => l.id === n.loja_id)
              return (
                <tr key={n.id}>
                  <td>{monthLabelShort(n.mes)}</td>
                  <td>{loja ? loja.nome : '—'}</td>
                  <td><OrigemTag origem={n.origem} /></td>
                  <td><ScoreBadge n={n.nota} /></td>
                  <td>{n.quantidade}</td>
                  <td><button className="icon-btn" onClick={() => excluir(n.id)}>Excluir</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Relatório mensal desta loja</h2>
        <div className="row">
          <div>
            <label>Loja</label>
            <select value={relLojaAtual} onChange={e => setRelLojaId(e.target.value)}>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label>Mês</label>
            <input type="month" value={relMes} onChange={e => setRelMes(e.target.value)} />
          </div>
        </div>
        {itensRel.length === 0 ? (
          <p className="empty">Nenhuma nota seca lançada para essa loja nesse mês.</p>
        ) : (
          <div style={{ marginTop: 16 }}>
            <div className="metric-grid">
              <div className="metric"><div className="label">Total de avaliações</div><div className="value">{totalRel}</div></div>
              <div className="metric"><div className="label">Média das notas</div><div className="value">{mediaRel.toFixed(2).replace('.', ',')}</div></div>
            </div>
            <label>Texto pronto para enviar</label>
            <textarea className="report" readOnly value={textoRel} style={{ minHeight: 180 }} />
            <button className="btn-secondary" style={{ marginTop: 10 }} onClick={copiarRel}>Copiar texto</button>
            {copiado && <span className="copied">Copiado!</span>}
          </div>
        )}
      </div>
    </div>
  )
}

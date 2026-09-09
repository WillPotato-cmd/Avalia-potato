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

  const [filtroMes, setFiltroMes] = useState('')
  const [filtroLoja, setFiltroLoja] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [filtroNota, setFiltroNota] = useState('')
  const [filtroQtd, setFiltroQtd] = useState('')
  const [pagina, setPagina] = useState(1)
  const ITENS_POR_PAGINA = 10

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

  const mesesDisponiveis = [...new Set(notasSecas.map(n => n.mes))].sort().reverse()

  let filtrados = [...notasSecas]
  if (filtroMes) filtrados = filtrados.filter(n => n.mes === filtroMes)
  if (filtroLoja) filtrados = filtrados.filter(n => n.loja_id === filtroLoja)
  if (filtroOrigem) filtrados = filtrados.filter(n => n.origem === filtroOrigem)
  if (filtroNota) filtrados = filtrados.filter(n => n.nota === parseInt(filtroNota, 10))
  if (filtroQtd !== '') filtrados = filtrados.filter(n => n.quantidade === parseInt(filtroQtd, 10))
  filtrados.sort((a, b) => b.mes.localeCompare(a.mes) || new Date(b.criado_em) - new Date(a.criado_em))

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicioIdx = (paginaAtual - 1) * ITENS_POR_PAGINA
  const paginaItens = filtrados.slice(inicioIdx, inicioIdx + ITENS_POR_PAGINA)

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

        <h2 style={{ marginTop: 28 }}>Lançamentos</h2>
        <div className="row">
          <div>
            <label>Filtrar por mês</label>
            <select value={filtroMes} onChange={e => { setFiltroMes(e.target.value); setPagina(1) }}>
              <option value="">Todos os meses</option>
              {mesesDisponiveis.map(mk => <option key={mk} value={mk}>{monthLabelShort(mk)}</option>)}
            </select>
          </div>
          <div>
            <label>Filtrar por loja</label>
            <select value={filtroLoja} onChange={e => { setFiltroLoja(e.target.value); setPagina(1) }}>
              <option value="">Todas as lojas</option>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label>Filtrar por origem</label>
            <select value={filtroOrigem} onChange={e => { setFiltroOrigem(e.target.value); setPagina(1) }}>
              <option value="">Todas</option>
              <option value="ifood">iFood</option>
              <option value="99food">99Food</option>
            </select>
          </div>
          <div>
            <label>Filtrar por nota</label>
            <select value={filtroNota} onChange={e => { setFiltroNota(e.target.value); setPagina(1) }}>
              <option value="">Todas</option>
              <option value="5">5</option><option value="4">4</option><option value="3">3</option>
              <option value="2">2</option><option value="1">1</option>
            </select>
          </div>
          <div>
            <label>Filtrar por quantidade</label>
            <input type="number" min="0" placeholder="Exata" value={filtroQtd} onChange={e => { setFiltroQtd(e.target.value); setPagina(1) }} />
          </div>
        </div>
        <table>
          <thead><tr><th>Mês</th><th>Loja</th><th>Origem</th><th>Nota</th><th>Quantidade</th><th></th></tr></thead>
          <tbody>
            {paginaItens.length === 0 && <tr><td colSpan={6} className="empty">Nenhum lançamento encontrado com esses filtros.</td></tr>}
            {paginaItens.map(n => {
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
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <button className="btn-secondary" disabled={paginaAtual <= 1} onClick={() => setPagina(p => p - 1)}>← Anterior</button>
          <span className="muted">Página {paginaAtual} de {totalPaginas} ({filtrados.length} lançamento(s))</span>
          <button className="btn-secondary" disabled={paginaAtual >= totalPaginas} onClick={() => setPagina(p => p + 1)}>Próxima →</button>
        </div>
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

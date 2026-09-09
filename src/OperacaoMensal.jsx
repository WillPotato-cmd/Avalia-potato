import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { currentMonthValue, monthLabelShort, parseMesLabel, parseMotivosString } from './dateUtils'

export default function OperacaoMensal({ lojas, operacaoMensal, onChange }) {
  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [mes, setMes] = useState(currentMonthValue())
  const [motivos, setMotivos] = useState([])
  const [novoMotivo, setNovoMotivo] = useState('')
  const [novaQtd, setNovaQtd] = useState(1)
  const [tempoFunc, setTempoFunc] = useState('')
  const [tempoPct, setTempoPct] = useState('')
  const [logEntrega, setLogEntrega] = useState('')
  const [logPreparo, setLogPreparo] = useState('')
  const [logEspera, setLogEspera] = useState('')
  const [msg, setMsg] = useState(false)

  const [impLojaId, setImpLojaId] = useState(lojas[0]?.id || '')
  const [impAno, setImpAno] = useState(new Date().getFullYear())
  const [colar, setColar] = useState('')
  const [impMsg, setImpMsg] = useState({ text: '', ok: true })

  const [filtroMes, setFiltroMes] = useState('')
  const [filtroLoja, setFiltroLoja] = useState('')
  const [pagina, setPagina] = useState(1)
  const ITENS_POR_PAGINA = 10

  useEffect(() => {
    const loja = lojaId || lojas[0]?.id
    const existente = operacaoMensal.find(o => o.loja_id === loja && o.mes === mes)
    setMotivos(existente && existente.motivos_cancelamento ? existente.motivos_cancelamento.map(m => ({ ...m })) : [])
    setTempoFunc(existente ? (existente.tempo_func || '') : '')
    setTempoPct(existente && existente.tempo_pct != null ? existente.tempo_pct : '')
    setLogEntrega(existente && existente.log_entrega != null ? existente.log_entrega : '')
    setLogPreparo(existente && existente.log_preparo != null ? existente.log_preparo : '')
    setLogEspera(existente && existente.log_espera != null ? existente.log_espera : '')
  }, [lojaId, mes, operacaoMensal])

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre pelo menos uma loja na aba "Lojas" antes de lançar dados de operação.</p></div>
  }

  function adicionarMotivo() {
    const m = novoMotivo.trim()
    const q = parseInt(novaQtd, 10)
    if (!m) { alert('Digite o motivo do cancelamento.'); return }
    if (!q || q < 1) { alert('Informe uma quantidade válida.'); return }
    setMotivos([...motivos, { motivo: m, quantidade: q }])
    setNovoMotivo('')
    setNovaQtd(1)
  }

  function removerMotivo(idx) {
    setMotivos(motivos.filter((_, i) => i !== idx))
  }

  async function salvar() {
    if (!mes) { alert('Selecione o mês.'); return }
    const { error } = await supabase.from('operacao_mensal').upsert({
      loja_id: lojaId || lojas[0].id, mes,
      motivos_cancelamento: motivos,
      tempo_func: tempoFunc.trim() || null,
      tempo_pct: tempoPct !== '' ? parseFloat(tempoPct) : null,
      log_entrega: logEntrega !== '' ? parseInt(logEntrega, 10) : null,
      log_preparo: logPreparo !== '' ? parseInt(logPreparo, 10) : null,
      log_espera: logEspera !== '' ? parseInt(logEspera, 10) : null
    }, { onConflict: 'loja_id,mes' })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setMsg(true)
    setTimeout(() => setMsg(false), 1800)
    onChange()
  }

  async function excluir(id) {
    const { error } = await supabase.from('operacao_mensal').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    onChange()
  }

  async function importar() {
    const raw = colar.trim()
    if (!raw) { setImpMsg({ text: 'Cole as linhas da planilha primeiro.', ok: false }); return }
    const linhas = raw.split('\n').map(l => l.trim()).filter(l => l)
    let importadas = 0, ignoradas = 0
    const registros = []

    linhas.forEach(linha => {
      const cols = linha.split('\t').map(c => c.trim())
      if (cols.length < 1) { ignoradas++; return }
      const mesLinha = parseMesLabel(cols[0], impAno)
      if (!mesLinha) { ignoradas++; return }
      registros.push({
        loja_id: impLojaId || lojas[0].id, mes: mesLinha,
        motivos_cancelamento: parseMotivosString(cols[1] || ''),
        tempo_func: cols[2] || null,
        tempo_pct: cols[3] ? parseFloat(cols[3].replace(',', '.')) : null,
        log_entrega: cols[4] ? parseInt(cols[4], 10) : null,
        log_preparo: cols[5] ? parseInt(cols[5], 10) : null,
        log_espera: cols[6] ? parseInt(cols[6], 10) : null
      })
      importadas++
    })

    if (importadas === 0) {
      setImpMsg({ text: 'Não consegui identificar nenhum mês válido na primeira coluna. Confira o formato colado.', ok: false })
      return
    }

    const { error } = await supabase.from('operacao_mensal').upsert(registros, { onConflict: 'loja_id,mes' })
    if (error) { setImpMsg({ text: 'Erro ao importar: ' + error.message, ok: false }); return }

    setImpMsg({ text: `${importadas} mês(es) importado(s) com sucesso${ignoradas > 0 ? ` (${ignoradas} ignorada(s))` : ''}. Meses já existentes foram atualizados.`, ok: true })
    setColar('')
    onChange()
  }

  const mesesDisponiveis = [...new Set(operacaoMensal.map(o => o.mes))].sort().reverse()

  let filtrados = [...operacaoMensal]
  if (filtroMes) filtrados = filtrados.filter(o => o.mes === filtroMes)
  if (filtroLoja) filtrados = filtrados.filter(o => o.loja_id === filtroLoja)
  filtrados.sort((a, b) => b.mes.localeCompare(a.mes) || new Date(b.criado_em) - new Date(a.criado_em))

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicioIdx = (paginaAtual - 1) * ITENS_POR_PAGINA
  const paginaItens = filtrados.slice(inicioIdx, inicioIdx + ITENS_POR_PAGINA)

  return (
    <div>
      <div className="card">
        <h2>Operação mensal</h2>
        <p className="muted">Lance aqui, uma vez por mês, os dados de cancelamentos, tempo de funcionamento e logística de cada loja.</p>
        <label>Loja</label>
        <select value={lojaId || lojas[0].id} onChange={e => setLojaId(e.target.value)}>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <label>Mês</label>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} />

        <h2 style={{ marginTop: 20, fontSize: 15 }}>Cancelamentos</h2>
        <p className="muted">Adicione cada motivo de cancelamento com a quantidade de vezes que ocorreu no mês. O total de cancelamentos da loja é a soma de todos os motivos.</p>
        <table style={{ marginBottom: 10 }}>
          <thead><tr><th>Motivo</th><th>Quantidade</th><th></th></tr></thead>
          <tbody>
            {motivos.length === 0 && <tr><td colSpan={3} className="empty">Nenhum motivo adicionado ainda.</td></tr>}
            {motivos.map((m, idx) => (
              <tr key={idx}>
                <td>{m.motivo}</td>
                <td>{m.quantidade}</td>
                <td><button className="icon-btn" onClick={() => removerMotivo(idx)}>Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row">
          <input type="text" placeholder="Ex: Item em falta" value={novoMotivo} onChange={e => setNovoMotivo(e.target.value)} />
          <input type="number" min="1" value={novaQtd} onChange={e => setNovaQtd(e.target.value)} style={{ maxWidth: 120 }} />
          <button className="btn-secondary" type="button" onClick={adicionarMotivo}>+ Adicionar motivo</button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>Total de cancelamentos no mês: {motivos.reduce((s, m) => s + m.quantidade, 0)}</p>

        <h2 style={{ marginTop: 20, fontSize: 15 }}>Tempo de funcionamento</h2>
        <div className="row">
          <div>
            <label>Total de horas no mês (ex: 340h44)</label>
            <input type="text" placeholder="Ex: 340h44" value={tempoFunc} onChange={e => setTempoFunc(e.target.value)} />
          </div>
          <div>
            <label>% do tempo total possível</label>
            <input type="number" min="0" max="100" step="0.01" placeholder="Ex: 99.92" value={tempoPct} onChange={e => setTempoPct(e.target.value)} />
          </div>
        </div>

        <h2 style={{ marginTop: 20, fontSize: 15 }}>Logística</h2>
        <div className="row">
          <div>
            <label>Tempo de entrega (min)</label>
            <input type="number" min="0" value={logEntrega} onChange={e => setLogEntrega(e.target.value)} />
          </div>
          <div>
            <label>Tempo de preparo (min)</label>
            <input type="number" min="0" value={logPreparo} onChange={e => setLogPreparo(e.target.value)} />
          </div>
          <div>
            <label>Tempo de espera (min)</label>
            <input type="number" min="0" value={logEspera} onChange={e => setLogEspera(e.target.value)} />
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: 14 }} onClick={salvar}>Salvar dados do mês</button>
        {msg && <p className="copied">Dados salvos.</p>}

        <h2 style={{ marginTop: 28 }}>Meses lançados</h2>
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
        </div>
        <table>
          <thead><tr><th>Mês</th><th>Loja</th><th>Total cancelamentos</th><th>Tempo func.</th><th></th></tr></thead>
          <tbody>
            {paginaItens.length === 0 && <tr><td colSpan={5} className="empty">Nenhum lançamento encontrado com esses filtros.</td></tr>}
            {paginaItens.map(o => {
              const loja = lojas.find(l => l.id === o.loja_id)
              const total = (o.motivos_cancelamento || []).reduce((s, m) => s + m.quantidade, 0)
              return (
                <tr key={o.id}>
                  <td>{monthLabelShort(o.mes)}</td>
                  <td>{loja ? loja.nome : '—'}</td>
                  <td>{total}</td>
                  <td>{o.tempo_func || '—'} ({o.tempo_pct != null ? o.tempo_pct + '%' : '—'})</td>
                  <td><button className="icon-btn" onClick={() => excluir(o.id)}>Excluir</button></td>
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
        <h2>Importar dados operacionais da planilha</h2>
        <p className="muted">
          Cole uma linha por mês, copiada da sua planilha, na ordem: <strong>Mês | Motivos de cancelamento | Tempo de
          funcionamento | % tempo | Tempo entrega | Tempo preparo | Tempo espera</strong>. A coluna de motivos segue o
          formato "Motivo:quantidade; Motivo2:quantidade2" (ex: "Item em falta:12; Pedido completo:9"). O "Mês" aceita
          "Julho", "Julho/26", "07/2026" ou "2026-07".
        </p>
        <label>Loja</label>
        <select value={impLojaId || lojas[0].id} onChange={e => setImpLojaId(e.target.value)}>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <div className="row">
          <div>
            <label>Ano padrão (se o mês não trouxer ano)</label>
            <input type="number" value={impAno} onChange={e => setImpAno(e.target.value)} />
          </div>
        </div>
        <label>Cole aqui as linhas copiadas da planilha</label>
        <textarea
          value={colar}
          onChange={e => setColar(e.target.value)}
          placeholder={'Julho\tItem em falta:5; Pedido completo:2\t340h44\t99.92\t22\t8\t5'}
          style={{ minHeight: 140, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12.5 }}
        />
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={importar}>Importar linhas</button>
        {impMsg.text && <p className="muted" style={{ marginTop: 10, color: impMsg.ok ? 'var(--success)' : 'var(--danger)' }}>{impMsg.text}</p>}
      </div>
    </div>
  )
}

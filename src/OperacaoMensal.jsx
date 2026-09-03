import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { currentMonthValue, monthLabelShort, parseMesLabel } from './dateUtils'

export default function OperacaoMensal({ lojas, operacaoMensal, onChange }) {
  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [mes, setMes] = useState(currentMonthValue())
  const [cancelCliente, setCancelCliente] = useState(0)
  const [cancelPlataforma, setCancelPlataforma] = useState(0)
  const [motivos, setMotivos] = useState('')
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

  useEffect(() => {
    const loja = lojaId || lojas[0]?.id
    const existente = operacaoMensal.find(o => o.loja_id === loja && o.mes === mes)
    setCancelCliente(existente ? existente.cancel_cliente : 0)
    setCancelPlataforma(existente ? existente.cancel_plataforma : 0)
    setMotivos(existente ? (existente.motivos || '') : '')
    setTempoFunc(existente ? (existente.tempo_func || '') : '')
    setTempoPct(existente && existente.tempo_pct != null ? existente.tempo_pct : '')
    setLogEntrega(existente && existente.log_entrega != null ? existente.log_entrega : '')
    setLogPreparo(existente && existente.log_preparo != null ? existente.log_preparo : '')
    setLogEspera(existente && existente.log_espera != null ? existente.log_espera : '')
  }, [lojaId, mes, operacaoMensal])

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre pelo menos uma loja na aba "Lojas" antes de lançar dados de operação.</p></div>
  }

  async function salvar() {
    if (!mes) { alert('Selecione o mês.'); return }
    const { error } = await supabase.from('operacao_mensal').upsert({
      loja_id: lojaId || lojas[0].id, mes,
      cancel_cliente: parseInt(cancelCliente, 10) || 0,
      cancel_plataforma: parseInt(cancelPlataforma, 10) || 0,
      motivos: motivos.trim() || null,
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
        cancel_cliente: cols[1] ? (parseInt(cols[1], 10) || 0) : 0,
        cancel_plataforma: cols[2] ? (parseInt(cols[2], 10) || 0) : 0,
        motivos: cols[3] || null,
        tempo_func: cols[4] || null,
        tempo_pct: cols[5] ? parseFloat(cols[5].replace(',', '.')) : null,
        log_entrega: cols[6] ? parseInt(cols[6], 10) : null,
        log_preparo: cols[7] ? parseInt(cols[7], 10) : null,
        log_espera: cols[8] ? parseInt(cols[8], 10) : null
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

  const recentes = [...operacaoMensal]
    .sort((a, b) => b.mes.localeCompare(a.mes) || new Date(b.criado_em) - new Date(a.criado_em))
    .slice(0, 10)

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
        <div className="row">
          <div>
            <label>Qtd. cancelados pelo cliente</label>
            <input type="number" min="0" value={cancelCliente} onChange={e => setCancelCliente(e.target.value)} />
          </div>
          <div>
            <label>Qtd. cancelados pela plataforma/loja</label>
            <input type="number" min="0" value={cancelPlataforma} onChange={e => setCancelPlataforma(e.target.value)} />
          </div>
        </div>
        <label>Principais motivos de cancelamento (opcional)</label>
        <textarea placeholder="Ex: Item em falta (5), Demora na entrega (3)..." value={motivos} onChange={e => setMotivos(e.target.value)} />

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
        <table>
          <thead><tr><th>Mês</th><th>Loja</th><th>Cancel. (cliente/plat.)</th><th>Tempo func.</th><th></th></tr></thead>
          <tbody>
            {recentes.length === 0 && <tr><td colSpan={5} className="empty">Nenhum lançamento ainda.</td></tr>}
            {recentes.map(o => {
              const loja = lojas.find(l => l.id === o.loja_id)
              return (
                <tr key={o.id}>
                  <td>{monthLabelShort(o.mes)}</td>
                  <td>{loja ? loja.nome : '—'}</td>
                  <td>{o.cancel_cliente || 0} / {o.cancel_plataforma || 0}</td>
                  <td>{o.tempo_func || '—'} ({o.tempo_pct != null ? o.tempo_pct + '%' : '—'})</td>
                  <td><button className="icon-btn" onClick={() => excluir(o.id)}>Excluir</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Importar dados operacionais da planilha</h2>
        <p className="muted">
          Cole uma linha por mês, copiada da sua planilha, na ordem: <strong>Mês | Qtd. cancel. cliente | Qtd. cancel.
          plataforma | Motivos | Tempo de funcionamento | % tempo | Tempo entrega | Tempo preparo | Tempo espera</strong>.
          O "Mês" aceita "Julho", "Julho/26", "07/2026" ou "2026-07". Colunas ausentes na sua planilha podem ficar em branco.
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
          placeholder={'Julho\t5\t2\tItem em falta (3)\t340h44\t99.92\t22\t8\t5'}
          style={{ minHeight: 140, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12.5 }}
        />
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={importar}>Importar linhas</button>
        {impMsg.text && <p className="muted" style={{ marginTop: 10, color: impMsg.ok ? 'var(--success)' : 'var(--danger)' }}>{impMsg.text}</p>}
      </div>
    </div>
  )
}

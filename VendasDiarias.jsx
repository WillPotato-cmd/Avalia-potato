import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { todayISO, fmtDate, monthKey, monthLabelShort, parseSemanaLabel, parseValorMonetario } from './dateUtils'

function OrigemTag({ origem }) {
  if (!origem) return null
  const label = origem === 'ifood' ? 'iFood' : '99Food'
  return <span className={`tag tag-${origem}`}>{label}</span>
}

export default function VendasDiarias({ lojas, vendasDiarias, onChange }) {
  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [canal, setCanal] = useState('ifood')
  const [data, setData] = useState(todayISO())
  const [pedidos, setPedidos] = useState(0)
  const [vendas, setVendas] = useState(0)
  const [investimento, setInvestimento] = useState(0)
  const [msg, setMsg] = useState(false)

  const [impLojaId, setImpLojaId] = useState(lojas[0]?.id || '')
  const [impCanal, setImpCanal] = useState('ifood')
  const [impAno, setImpAno] = useState(new Date().getFullYear())
  const [colar, setColar] = useState('')
  const [impMsg, setImpMsg] = useState({ text: '', ok: true })

  const [filtroMes, setFiltroMes] = useState('')
  const [filtroLoja, setFiltroLoja] = useState('')
  const [filtroCanal, setFiltroCanal] = useState('')
  const [pagina, setPagina] = useState(1)
  const ITENS_POR_PAGINA = 31

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre pelo menos uma loja na aba "Lojas" antes de lançar dados de operação.</p></div>
  }

  async function salvar() {
    if (!data) { alert('Selecione a data.'); return }
    const { error } = await supabase.from('vendas_diarias').insert({
      loja_id: lojaId || lojas[0].id, canal, data,
      pedidos: parseInt(pedidos, 10) || 0,
      vendas: parseFloat(vendas) || 0,
      investimento: parseFloat(investimento) || 0
    })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setMsg(true)
    setTimeout(() => setMsg(false), 1800)
    onChange()
  }

  async function excluir(id) {
    const { error } = await supabase.from('vendas_diarias').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    onChange()
  }

  async function importar() {
    const raw = colar.trim()
    if (!raw) { setImpMsg({ text: 'Cole as linhas da planilha primeiro.', ok: false }); return }
    const linhas = raw.split('\n').map(l => l.trim()).filter(l => l)
    let importadas = 0, ignoradas = 0
    const novos = []

    linhas.forEach(linha => {
      const cols = linha.split('\t').map(c => c.trim())
      if (cols.length < 2) { ignoradas++; return }
      const dataSemana = parseSemanaLabel(cols[0], impAno)
      const ped = parseInt(cols[1], 10)
      if (!dataSemana || isNaN(ped)) { ignoradas++; return }
      const vend = cols[4] !== undefined ? parseValorMonetario(cols[4]) : 0
      const inv = cols[5] !== undefined ? parseValorMonetario(cols[5]) : 0
      novos.push({
        loja_id: impLojaId || lojas[0].id, canal: impCanal, data: dataSemana,
        pedidos: ped, vendas: vend, investimento: inv
      })
      importadas++
    })

    if (importadas === 0) {
      setImpMsg({ text: 'Não consegui identificar nenhuma linha válida. Confira o formato colado.', ok: false })
      return
    }

    const { error } = await supabase.from('vendas_diarias').insert(novos)
    if (error) { setImpMsg({ text: 'Erro ao importar: ' + error.message, ok: false }); return }

    setImpMsg({ text: `${importadas} linha(s) importada(s) com sucesso${ignoradas > 0 ? ` (${ignoradas} ignorada(s))` : ''}.`, ok: true })
    setColar('')
    onChange()
  }

  const mesesDisponiveis = [...new Set(vendasDiarias.map(o => monthKey(o.data)))].sort().reverse()

  let filtrados = [...vendasDiarias]
  if (filtroMes) filtrados = filtrados.filter(o => monthKey(o.data) === filtroMes)
  if (filtroLoja) filtrados = filtrados.filter(o => o.loja_id === filtroLoja)
  if (filtroCanal) filtrados = filtrados.filter(o => o.canal === filtroCanal)
  filtrados.sort((a, b) => b.data.localeCompare(a.data) || new Date(b.criado_em) - new Date(a.criado_em))

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicioIdx = (paginaAtual - 1) * ITENS_POR_PAGINA
  const paginaItens = filtrados.slice(inicioIdx, inicioIdx + ITENS_POR_PAGINA)

  return (
    <div>
      <div className="card">
        <h2>Vendas diárias</h2>
        <p className="muted">Lance aqui, dia a dia, os dados de pedidos, vendas e investimento de cada loja, separando por canal (iFood ou 99Food). O site soma tudo automaticamente por mês para alimentar o comparativo do relatório final.</p>
        <label>Loja</label>
        <select value={lojaId || lojas[0].id} onChange={e => setLojaId(e.target.value)}>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <div className="row">
          <div>
            <label>Canal</label>
            <select value={canal} onChange={e => setCanal(e.target.value)}>
              <option value="ifood">iFood</option>
              <option value="99food">99Food</option>
            </select>
          </div>
          <div>
            <label>Data</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Nº de pedidos</label>
            <input type="number" min="0" value={pedidos} onChange={e => setPedidos(e.target.value)} />
          </div>
          <div>
            <label>Vendas (R$)</label>
            <input type="number" min="0" step="0.01" value={vendas} onChange={e => setVendas(e.target.value)} />
          </div>
          <div>
            <label>Investimento (R$)</label>
            <input type="number" min="0" step="0.01" value={investimento} onChange={e => setInvestimento(e.target.value)} />
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
            <label>Filtrar por canal</label>
            <select value={filtroCanal} onChange={e => { setFiltroCanal(e.target.value); setPagina(1) }}>
              <option value="">Todos</option>
              <option value="ifood">iFood</option>
              <option value="99food">99Food</option>
            </select>
          </div>
        </div>
        <table>
          <thead><tr><th>Data</th><th>Loja</th><th>Canal</th><th>Pedidos</th><th>Vendas</th><th>Invest.</th><th></th></tr></thead>
          <tbody>
            {paginaItens.length === 0 && <tr><td colSpan={7} className="empty">Nenhum lançamento encontrado com esses filtros.</td></tr>}
            {paginaItens.map(o => {
              const loja = lojas.find(l => l.id === o.loja_id)
              const d = new Date(o.data + 'T00:00:00')
              return (
                <tr key={o.id}>
                  <td>{fmtDate(d)}</td>
                  <td>{loja ? loja.nome : '—'}</td>
                  <td><OrigemTag origem={o.canal} /></td>
                  <td>{o.pedidos}</td>
                  <td>R$ {Number(o.vendas).toFixed(2)}</td>
                  <td>R$ {Number(o.investimento).toFixed(2)}</td>
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
        <h2>Importar da planilha do Google Sheets</h2>
        <p className="muted">
          Na sua planilha, selecione as células com as linhas de "Semana" (ex: "Sem 1 (28/7 - 4/08)"), Nº de Pedidos,
          C/Promo, S/Promo, $ de Vendas e $ de Investimento — copie (Ctrl+C) e cole abaixo. O site identifica cada semana
          e lança automaticamente.
        </p>
        <div className="row">
          <div>
            <label>Loja</label>
            <select value={impLojaId || lojas[0].id} onChange={e => setImpLojaId(e.target.value)}>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label>Canal</label>
            <select value={impCanal} onChange={e => setImpCanal(e.target.value)}>
              <option value="ifood">iFood</option>
              <option value="99food">99Food</option>
            </select>
          </div>
          <div>
            <label>Ano das datas</label>
            <input type="number" value={impAno} onChange={e => setImpAno(e.target.value)} />
          </div>
        </div>
        <label>Cole aqui as linhas copiadas da planilha</label>
        <textarea
          value={colar}
          onChange={e => setColar(e.target.value)}
          placeholder={'Sem 1 (28/7 - 4/08)\t12\t3\t9\tR$ 450,00\tR$ 80,00'}
          style={{ minHeight: 140, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12.5 }}
        />
        <button className="btn-primary" style={{ marginTop: 14 }} onClick={importar}>Importar linhas</button>
        {impMsg.text && <p className="muted" style={{ marginTop: 10, color: impMsg.ok ? 'var(--success)' : 'var(--danger)' }}>{impMsg.text}</p>}
      </div>
    </div>
  )
}

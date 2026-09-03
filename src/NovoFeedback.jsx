import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { todayISO, fmtDate, parseIfoodText, parse99FoodText } from './dateUtils'

function ScoreBadge({ n }) {
  return <span className={`badge b${n}`}>{n}</span>
}

function OrigemTag({ origem }) {
  if (!origem) return null
  const label = origem === 'ifood' ? 'iFood' : '99Food'
  return <span className={`tag tag-${origem}`}>{label}</span>
}

export default function NovoFeedback({ lojas, feedbacks, onChange }) {
  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [data, setData] = useState(todayISO())
  const [nota, setNota] = useState(5)
  const [origem, setOrigem] = useState('ifood')
  const [pedido, setPedido] = useState('')
  const [cliente, setCliente] = useState('')
  const [texto, setTexto] = useState('')
  const [colar, setColar] = useState('')
  const [autoMsg, setAutoMsg] = useState({ text: '', ok: true })
  const [msg, setMsg] = useState(false)

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre pelo menos uma loja na aba "Lojas" antes de lançar feedbacks.</p></div>
  }

  function preencherAutomaticamente() {
    const raw = colar.trim()
    if (!raw) { setAutoMsg({ text: 'Cole o texto da avaliação primeiro.', ok: false }); return }
    const pareceIfood = /Nota de avalia[cç][aã]o|Pedido feito em/i.test(raw)
    const parsed = pareceIfood ? parseIfoodText(raw) : parse99FoodText(raw)
    setOrigem(pareceIfood ? 'ifood' : '99food')
    if (parsed.pedido) setPedido(parsed.pedido)
    if (parsed.data) setData(parsed.data)
    if (parsed.nota) setNota(parsed.nota)
    if (parsed.cliente) setCliente(parsed.cliente)
    if (parsed.texto) setTexto(parsed.texto)
    const encontrados = Object.values(parsed).filter(v => v).length
    setAutoMsg(encontrados === 0
      ? { text: 'Não consegui identificar os dados. Confira e preencha manualmente.', ok: false }
      : { text: 'Campos preenchidos! Confira antes de salvar.', ok: true })
  }

  async function salvar() {
    if (!data) { alert('Selecione uma data.'); return }
    const loja = lojaId || lojas[0].id
    const { error } = await supabase.from('feedbacks').insert({
      loja_id: loja, data, nota: parseInt(nota, 10), texto: texto.trim() || null,
      origem, pedido: pedido.trim() || null, cliente: cliente.trim() || null
    })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setTexto(''); setPedido(''); setCliente(''); setColar('')
    setAutoMsg({ text: '', ok: true })
    setMsg(true)
    setTimeout(() => setMsg(false), 1800)
    onChange()
  }

  async function excluir(id) {
    const { error } = await supabase.from('feedbacks').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    onChange()
  }

  const recentes = [...feedbacks]
    .sort((a, b) => b.data.localeCompare(a.data) || new Date(b.criado_em) - new Date(a.criado_em))
    .slice(0, 8)

  return (
    <div className="card">
      <h2>Novo feedback</h2>

      <label>Colar avaliação (iFood ou 99Food)</label>
      <textarea
        placeholder="Cole aqui o texto copiado do app de delivery"
        value={colar}
        onChange={e => setColar(e.target.value)}
        style={{ minHeight: 110 }}
      />
      <div className="row" style={{ alignItems: 'center' }}>
        <button className="btn-secondary" type="button" onClick={preencherAutomaticamente}>Preencher automaticamente</button>
        {autoMsg.text && <p className="muted" style={{ flex: 2, color: autoMsg.ok ? 'var(--success)' : 'var(--danger)' }}>{autoMsg.text}</p>}
      </div>

      <label style={{ marginTop: 16 }}>Loja</label>
      <select value={lojaId || lojas[0].id} onChange={e => setLojaId(e.target.value)}>
        {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
      </select>
      <div className="row">
        <div>
          <label>Nº do pedido (opcional)</label>
          <input type="text" placeholder="Ex: 1727" value={pedido} onChange={e => setPedido(e.target.value)} />
        </div>
        <div>
          <label>Nome do cliente (opcional)</label>
          <input type="text" placeholder="Ex: Rose" value={cliente} onChange={e => setCliente(e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} />
        </div>
        <div>
          <label>Nota (1 a 5)</label>
          <select value={nota} onChange={e => setNota(e.target.value)}>
            <option value="5">5 - Ótimo</option>
            <option value="4">4 - Bom</option>
            <option value="3">3 - Regular</option>
            <option value="2">2 - Ruim</option>
            <option value="1">1 - Péssimo</option>
          </select>
        </div>
      </div>
      <label>Origem</label>
      <select value={origem} onChange={e => setOrigem(e.target.value)}>
        <option value="ifood">iFood</option>
        <option value="99food">99Food</option>
      </select>
      <label>Comentário do cliente (opcional)</label>
      <textarea
        placeholder="Cole aqui o comentário do cliente, se houver"
        value={texto}
        onChange={e => setTexto(e.target.value)}
      />
      <button className="btn-primary" style={{ marginTop: 14 }} onClick={salvar}>Adicionar feedback</button>
      {msg && <p className="copied">Feedback adicionado.</p>}

      <h2 style={{ marginTop: 28 }}>Últimos lançamentos</h2>
      <table>
        <thead><tr><th>Data</th><th>Loja</th><th>Cliente</th><th>Origem</th><th>Nota</th><th>Comentário</th><th></th></tr></thead>
        <tbody>
          {recentes.length === 0 && (
            <tr><td colSpan={7} className="empty">Nenhum feedback ainda.</td></tr>
          )}
          {recentes.map(f => {
            const loja = lojas.find(l => l.id === f.loja_id)
            const d = new Date(f.data + 'T00:00:00')
            return (
              <tr key={f.id}>
                <td>{fmtDate(d)}</td>
                <td>{loja ? loja.nome : '—'}</td>
                <td>{f.cliente || <span className="muted">—</span>}</td>
                <td><OrigemTag origem={f.origem} /></td>
                <td><ScoreBadge n={f.nota} /></td>
                <td>{f.texto ? (f.texto.length > 60 ? f.texto.slice(0, 60) + '…' : f.texto) : <span className="muted">sem texto</span>}</td>
                <td><button className="icon-btn" onClick={() => excluir(f.id)}>Excluir</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

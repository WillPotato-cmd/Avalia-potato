import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { todayISO, fmtDate } from './dateUtils'

function ScoreBadge({ n }) {
  return <span className={`badge b${n}`}>{n}</span>
}

export default function NovoFeedback({ lojas, feedbacks, onChange }) {
  const [lojaId, setLojaId] = useState(lojas[0]?.id || '')
  const [data, setData] = useState(todayISO())
  const [nota, setNota] = useState(5)
  const [texto, setTexto] = useState('')
  const [msg, setMsg] = useState(false)

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre pelo menos uma loja na aba "Lojas" antes de lançar feedbacks.</p></div>
  }

  async function salvar() {
    if (!data) { alert('Selecione uma data.'); return }
    const loja = lojaId || lojas[0].id
    const { error } = await supabase.from('feedbacks').insert({
      loja_id: loja, data, nota: parseInt(nota, 10), texto: texto.trim() || null
    })
    if (error) { alert('Erro ao salvar: ' + error.message); return }
    setTexto('')
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
      <label>Loja</label>
      <select value={lojaId || lojas[0].id} onChange={e => setLojaId(e.target.value)}>
        {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
      </select>
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
        <thead><tr><th>Data</th><th>Loja</th><th>Nota</th><th>Comentário</th><th></th></tr></thead>
        <tbody>
          {recentes.length === 0 && (
            <tr><td colSpan={5} className="empty">Nenhum feedback ainda.</td></tr>
          )}
          {recentes.map(f => {
            const loja = lojas.find(l => l.id === f.loja_id)
            const d = new Date(f.data + 'T00:00:00')
            return (
              <tr key={f.id}>
                <td>{fmtDate(d)}</td>
                <td>{loja ? loja.nome : '—'}</td>
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

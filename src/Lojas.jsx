import React, { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Lojas({ lojas, feedbacks, onChange }) {
  const [nome, setNome] = useState('')

  async function addLoja() {
    const val = nome.trim()
    if (!val) return
    const { error } = await supabase.from('lojas').insert({ nome: val })
    if (error) { alert('Erro ao salvar loja: ' + error.message); return }
    setNome('')
    onChange()
  }

  async function deleteLoja(id) {
    if (!confirm('Excluir esta loja? Os feedbacks vinculados a ela ficarão sem loja associada.')) return
    const { error } = await supabase.from('lojas').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    onChange()
  }

  return (
    <div>
      <div className="card">
        <h2>Cadastrar loja</h2>
        <div className="row">
          <input
            type="text"
            placeholder="Nome da loja"
            value={nome}
            onChange={e => setNome(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addLoja() }}
          />
          <button className="btn-primary" onClick={addLoja}>Adicionar</button>
        </div>
      </div>
      <div className="card">
        <h2>Lojas cadastradas</h2>
        <table>
          <thead><tr><th>Nome</th><th>Feedbacks</th><th></th></tr></thead>
          <tbody>
            {lojas.length === 0 && (
              <tr><td colSpan={3} className="empty">Nenhuma loja cadastrada ainda.</td></tr>
            )}
            {lojas.map(l => {
              const count = feedbacks.filter(f => f.loja_id === l.id).length
              return (
                <tr key={l.id}>
                  <td>{l.nome}</td>
                  <td>{count}</td>
                  <td><button className="icon-btn" onClick={() => deleteLoja(l.id)}>Excluir</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

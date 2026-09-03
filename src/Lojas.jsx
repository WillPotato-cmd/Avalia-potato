import React, { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Lojas({ lojas, feedbacks, onChange }) {
  const [nome, setNome] = useState('')
  const [regiao, setRegiao] = useState('')

  async function addLoja() {
    const val = nome.trim()
    if (!val) return
    const { error } = await supabase.from('lojas').insert({ nome: val, regiao: regiao.trim() || null })
    if (error) { alert('Erro ao salvar loja: ' + error.message); return }
    setNome('')
    setRegiao('')
    onChange()
  }

  async function deleteLoja(id) {
    if (!confirm('Excluir esta loja? Os feedbacks vinculados a ela ficarão sem loja associada.')) return
    const { error } = await supabase.from('lojas').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    onChange()
  }

  async function updateRegiao(id, novaRegiao) {
    const { error } = await supabase.from('lojas').update({ regiao: novaRegiao.trim() || null }).eq('id', id)
    if (error) { alert('Erro ao atualizar região: ' + error.message); return }
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
          <input
            type="text"
            placeholder="Região (opcional, ex: Alto Tietê)"
            value={regiao}
            onChange={e => setRegiao(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addLoja() }}
          />
          <button className="btn-primary" onClick={addLoja}>Adicionar</button>
        </div>
      </div>
      <div className="card">
        <h2>Lojas cadastradas</h2>
        <table>
          <thead><tr><th>Nome</th><th>Região</th><th>Feedbacks</th><th></th></tr></thead>
          <tbody>
            {lojas.length === 0 && (
              <tr><td colSpan={4} className="empty">Nenhuma loja cadastrada ainda.</td></tr>
            )}
            {lojas.map(l => {
              const count = feedbacks.filter(f => f.loja_id === l.id).length
              return (
                <tr key={l.id}>
                  <td>{l.nome}</td>
                  <td>
                    <input
                      type="text"
                      defaultValue={l.regiao || ''}
                      placeholder="Sem região"
                      style={{ padding: '5px 8px', fontSize: 13 }}
                      onBlur={e => { if (e.target.value !== (l.regiao || '')) updateRegiao(l.id, e.target.value) }}
                    />
                  </td>
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

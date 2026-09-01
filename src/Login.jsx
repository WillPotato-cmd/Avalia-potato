import React, { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('E-mail ou senha incorretos.')
  }

  return (
    <div className="login-wrap">
      <h1>Controle de feedbacks</h1>
      <p className="muted">Acesso restrito.</p>
      <div className="card" style={{ textAlign: 'left', marginTop: 16 }}>
        <form onSubmit={handleLogin}>
          <label>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label>Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" style={{ width: '100%', marginTop: 14 }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
      <p className="muted" style={{ marginTop: 12 }}>
        Seu usuário é criado direto no painel do Supabase (Authentication → Users) — veja o README.
      </p>
    </div>
  )
}

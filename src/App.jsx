import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Lojas from './Lojas'
import NovoFeedback from './NovoFeedback'
import RelatorioSemanal from './RelatorioSemanal'
import PanoramaMensal from './PanoramaMensal'

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [lojas, setLojas] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [tab, setTab] = useState('novo')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingSession(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const loadData = useCallback(async () => {
    const { data: lojasData } = await supabase.from('lojas').select('*').order('nome')
    const { data: feedbacksData } = await supabase.from('feedbacks').select('*').order('data', { ascending: false })
    setLojas(lojasData || [])
    setFeedbacks(feedbacksData || [])
  }, [])

  useEffect(() => {
    if (session) loadData()
  }, [session, loadData])

  if (loadingSession) return null
  if (!session) return <Login />

  return (
    <div className="app">
      <div className="top">
        <div>
          <h1>Controle de feedbacks</h1>
          <p className="muted">{lojas.length} loja(s) cadastrada(s) · {feedbacks.length} feedback(s) registrado(s)</p>
        </div>
        <button className="btn-secondary" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'novo' ? 'active' : ''}`} onClick={() => setTab('novo')}>Novo feedback</button>
        <button className={`tab ${tab === 'lojas' ? 'active' : ''}`} onClick={() => setTab('lojas')}>Lojas</button>
        <button className={`tab ${tab === 'semanal' ? 'active' : ''}`} onClick={() => setTab('semanal')}>Relatório semanal</button>
        <button className={`tab ${tab === 'mensal' ? 'active' : ''}`} onClick={() => setTab('mensal')}>Panorama mensal</button>
      </div>

      {tab === 'novo' && <NovoFeedback lojas={lojas} feedbacks={feedbacks} onChange={loadData} />}
      {tab === 'lojas' && <Lojas lojas={lojas} feedbacks={feedbacks} onChange={loadData} />}
      {tab === 'semanal' && <RelatorioSemanal lojas={lojas} feedbacks={feedbacks} />}
      {tab === 'mensal' && <PanoramaMensal lojas={lojas} feedbacks={feedbacks} />}
    </div>
  )
}

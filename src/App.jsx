import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Lojas from './Lojas'
import NovoFeedback from './NovoFeedback'
import NotasSecas from './NotasSecas'
import NotasTotais from './NotasTotais'
import RelatorioSemanal from './RelatorioSemanal'
import PanoramaMensal from './PanoramaMensal'
import VendasDiarias from './VendasDiarias'
import OperacaoMensal from './OperacaoMensal'
import RelatorioPPTX from './RelatorioPPTX'

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [lojas, setLojas] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [notasSecas, setNotasSecas] = useState([])
  const [vendasDiarias, setVendasDiarias] = useState([])
  const [operacaoMensal, setOperacaoMensal] = useState([])
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
    const [lojasRes, feedbacksRes, notasSecasRes, vendasRes, operacaoRes] = await Promise.all([
      supabase.from('lojas').select('*').order('nome'),
      supabase.from('feedbacks').select('*').order('data', { ascending: false }),
      supabase.from('notas_secas').select('*'),
      supabase.from('vendas_diarias').select('*'),
      supabase.from('operacao_mensal').select('*')
    ])
    setLojas(lojasRes.data || [])
    setFeedbacks(feedbacksRes.data || [])
    setNotasSecas(notasSecasRes.data || [])
    setVendasDiarias(vendasRes.data || [])
    setOperacaoMensal(operacaoRes.data || [])
  }, [])

  useEffect(() => {
    if (session) loadData()
  }, [session, loadData])

  if (loadingSession) return null
  if (!session) return <Login />

  const abas = [
    ['novo', 'Novo feedback'],
    ['notassecas', 'Notas secas'],
    ['lojas', 'Lojas'],
    ['semanal', 'Relatório semanal'],
    ['mensal', 'Panorama mensal'],
    ['notastotais', 'Notas totais'],
    ['vendasdiarias', 'Vendas diárias'],
    ['opmensal', 'Operação mensal'],
    ['pptx', 'Relatório PPTX']
  ]

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
        {abas.map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'novo' && <NovoFeedback lojas={lojas} feedbacks={feedbacks} onChange={loadData} />}
      {tab === 'notassecas' && <NotasSecas lojas={lojas} notasSecas={notasSecas} onChange={loadData} />}
      {tab === 'lojas' && <Lojas lojas={lojas} feedbacks={feedbacks} onChange={loadData} />}
      {tab === 'semanal' && <RelatorioSemanal lojas={lojas} feedbacks={feedbacks} />}
      {tab === 'mensal' && <PanoramaMensal lojas={lojas} feedbacks={feedbacks} />}
      {tab === 'notastotais' && <NotasTotais lojas={lojas} feedbacks={feedbacks} notasSecas={notasSecas} />}
      {tab === 'vendasdiarias' && <VendasDiarias lojas={lojas} vendasDiarias={vendasDiarias} onChange={loadData} />}
      {tab === 'opmensal' && <OperacaoMensal lojas={lojas} operacaoMensal={operacaoMensal} onChange={loadData} />}
      {tab === 'pptx' && <RelatorioPPTX lojas={lojas} vendasDiarias={vendasDiarias} operacaoMensal={operacaoMensal} />}
    </div>
  )
}

import React, { useState } from 'react'
import pptxgen from 'pptxgenjs'
import {
  monthLabel, monthLabelShort, currentMonthValue,
  addMonthsToKey, subtractYearFromKey, pctVar, fmtPct, fmtMoeda
} from './dateUtils'

export default function RelatorioPPTX({ lojas, vendasDiarias, operacaoMensal }) {
  const regioes = [...new Set(lojas.map(l => (l.regiao && l.regiao.trim()) || 'Sem região'))]
  const [regiao, setRegiao] = useState(regioes[0] || '')
  const [mesAtual, setMesAtual] = useState(currentMonthValue())
  const [msg, setMsg] = useState({ text: '', ok: true })

  if (lojas.length === 0) {
    return <div className="card"><p className="empty">Cadastre lojas e lance dados de operação antes de gerar o relatório.</p></div>
  }

  function somaVendasCanal(lojaId, canal, mk) {
    return vendasDiarias
      .filter(o => o.loja_id === lojaId && o.canal === canal && o.data.slice(0, 7) === mk)
      .reduce((acc, o) => {
        acc.pedidos += o.pedidos
        acc.vendas += Number(o.vendas)
        acc.investimento += Number(o.investimento)
        return acc
      }, { pedidos: 0, vendas: 0, investimento: 0 })
  }

  async function gerar() {
    if (!mesAtual) { setMsg({ text: 'Selecione o mês.', ok: false }); return }
    const mesAnterior = addMonthsToKey(mesAtual, -1)
    const mesRetrasado = addMonthsToKey(mesAtual, -2)
    const mesAnoPassado = subtractYearFromKey(mesAtual)
    const lojasRegiao = lojas.filter(l => ((l.regiao && l.regiao.trim()) || 'Sem região') === regiao)

    if (lojasRegiao.length === 0) {
      setMsg({ text: 'Nenhuma loja encontrada nessa região.', ok: false })
      return
    }

    const pptx = new pptxgen()
    pptx.defineLayout({ name: 'CUSTOM', width: 10, height: 5.63 })
    pptx.layout = 'CUSTOM'
    const corTitulo = '3C3489'
    const corHeader = 'EEEDFE'

    const s1 = pptx.addSlide()
    s1.addText('Resultados Delivery', { x: 0.5, y: 1.6, w: 9, h: 1, fontSize: 36, bold: true, color: corTitulo, align: 'center' })
    s1.addText(monthLabel(mesAtual).replace(/^\w/, c => c.toUpperCase()), { x: 0.5, y: 2.5, w: 9, h: 0.6, fontSize: 22, align: 'center', color: '444444' })
    s1.addText(`[${regiao}]`, { x: 0.5, y: 3.1, w: 9, h: 0.5, fontSize: 16, align: 'center', color: '888888' })

    const s2 = pptx.addSlide()
    s2.addText('Comparativo de Vendas (iFood)', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: corTitulo })
    const rowsIfood = [['Loja', monthLabelShort(mesAnterior), monthLabelShort(mesAtual), 'Comparativo', monthLabelShort(mesAnoPassado), 'Comparativo'].map(t => ({ text: t, options: { bold: true, fill: corHeader } }))]
    let totIfoodAnt = 0, totIfoodAtu = 0, totIfoodAno = 0
    lojasRegiao.forEach(l => {
      const ant = somaVendasCanal(l.id, 'ifood', mesAnterior).pedidos
      const atu = somaVendasCanal(l.id, 'ifood', mesAtual).pedidos
      const ano = somaVendasCanal(l.id, 'ifood', mesAnoPassado).pedidos
      totIfoodAnt += ant; totIfoodAtu += atu; totIfoodAno += ano
      rowsIfood.push([l.nome, String(ant), String(atu), fmtPct(pctVar(atu, ant)), String(ano), fmtPct(pctVar(atu, ano))])
    })
    rowsIfood.push(['TOTAL', String(totIfoodAnt), String(totIfoodAtu), fmtPct(pctVar(totIfoodAtu, totIfoodAnt)), String(totIfoodAno), fmtPct(pctVar(totIfoodAtu, totIfoodAno))].map(t => ({ text: t, options: { bold: true } })))
    s2.addTable(rowsIfood, { x: 0.4, y: 0.9, w: 9.2, fontSize: 11, autoPage: false })

    const s3 = pptx.addSlide()
    s3.addText('Comparativo de Vendas (99Food)', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: corTitulo })
    const rows99 = [['Loja', monthLabelShort(mesAnterior), monthLabelShort(mesAtual), 'Comparativo'].map(t => ({ text: t, options: { bold: true, fill: corHeader } }))]
    let tot99Ant = 0, tot99Atu = 0
    lojasRegiao.forEach(l => {
      const ant = somaVendasCanal(l.id, '99food', mesAnterior).pedidos
      const atu = somaVendasCanal(l.id, '99food', mesAtual).pedidos
      tot99Ant += ant; tot99Atu += atu
      rows99.push([l.nome, String(ant), String(atu), fmtPct(pctVar(atu, ant))])
    })
    rows99.push(['TOTAL', String(tot99Ant), String(tot99Atu), fmtPct(pctVar(tot99Atu, tot99Ant))].map(t => ({ text: t, options: { bold: true } })))
    s3.addTable(rows99, { x: 0.4, y: 0.9, w: 9.2, fontSize: 11, autoPage: false })

    const s4 = pptx.addSlide()
    s4.addText('Comparativo de Custos de Investimento — iFood (R$)', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: corTitulo })
    const rowsInv = [['Loja', monthLabelShort(mesRetrasado), monthLabelShort(mesAnterior), monthLabelShort(mesAtual), 'Variação'].map(t => ({ text: t, options: { bold: true, fill: corHeader } }))]
    let invRetr = 0, invAnt = 0, invAtu = 0
    lojasRegiao.forEach(l => {
      const retr = somaVendasCanal(l.id, 'ifood', mesRetrasado).investimento
      const ant = somaVendasCanal(l.id, 'ifood', mesAnterior).investimento
      const atu = somaVendasCanal(l.id, 'ifood', mesAtual).investimento
      invRetr += retr; invAnt += ant; invAtu += atu
      rowsInv.push([l.nome, fmtMoeda(retr), fmtMoeda(ant), fmtMoeda(atu), fmtPct(pctVar(atu, ant))])
    })
    rowsInv.push(['TOTAL', fmtMoeda(invRetr), fmtMoeda(invAnt), fmtMoeda(invAtu), fmtPct(pctVar(invAtu, invAnt))].map(t => ({ text: t, options: { bold: true } })))
    s4.addTable(rowsInv, { x: 0.4, y: 0.9, w: 9.2, fontSize: 11, autoPage: false })

    const s4b = pptx.addSlide()
    s4b.addText('Comparativo de Custos de Investimento — 99Food (R$)', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: corTitulo })
    const rowsInv99 = [['Loja', monthLabelShort(mesRetrasado), monthLabelShort(mesAnterior), monthLabelShort(mesAtual), 'Variação'].map(t => ({ text: t, options: { bold: true, fill: corHeader } }))]
    let invRetr99 = 0, invAnt99 = 0, invAtu99 = 0
    lojasRegiao.forEach(l => {
      const retr = somaVendasCanal(l.id, '99food', mesRetrasado).investimento
      const ant = somaVendasCanal(l.id, '99food', mesAnterior).investimento
      const atu = somaVendasCanal(l.id, '99food', mesAtual).investimento
      invRetr99 += retr; invAnt99 += ant; invAtu99 += atu
      rowsInv99.push([l.nome, fmtMoeda(retr), fmtMoeda(ant), fmtMoeda(atu), fmtPct(pctVar(atu, ant))])
    })
    rowsInv99.push(['TOTAL', fmtMoeda(invRetr99), fmtMoeda(invAnt99), fmtMoeda(invAtu99), fmtPct(pctVar(invAtu99, invAnt99))].map(t => ({ text: t, options: { bold: true } })))
    s4b.addTable(rowsInv99, { x: 0.4, y: 0.9, w: 9.2, fontSize: 11, autoPage: false })

    const s4c = pptx.addSlide()
    s4c.addText('Evolução do Investimento — Últimos 3 Meses (iFood + 99Food)', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 18, bold: true, color: corTitulo })
    const mesesLinha = [monthLabelShort(mesRetrasado), monthLabelShort(mesAnterior), monthLabelShort(mesAtual)]
    const seriesInvestimento = lojasRegiao.map(l => {
      const retrTotal = somaVendasCanal(l.id, 'ifood', mesRetrasado).investimento + somaVendasCanal(l.id, '99food', mesRetrasado).investimento
      const antTotal = somaVendasCanal(l.id, 'ifood', mesAnterior).investimento + somaVendasCanal(l.id, '99food', mesAnterior).investimento
      const atuTotal = somaVendasCanal(l.id, 'ifood', mesAtual).investimento + somaVendasCanal(l.id, '99food', mesAtual).investimento
      return { name: l.nome, labels: mesesLinha, values: [retrTotal, antTotal, atuTotal] }
    })
    const temDadosLinha = seriesInvestimento.some(s => s.values.some(v => v > 0))
    if (temDadosLinha) {
      s4c.addChart(pptx.ChartType.line, seriesInvestimento, {
        x: 0.4, y: 0.9, w: 9.2, h: 4.3,
        showLegend: true, legendPos: 'r', legendFontSize: 10,
        showValue: true, dataLabelPosition: 't', dataLabelFontSize: 9,
        lineDataSymbol: 'circle', lineDataSymbolSize: 6,
        catAxisLabelFontSize: 11, valAxisLabelFontSize: 10
      })
    } else {
      s4c.addText('Nenhum dado de investimento registrado nesses meses.', { x: 0.4, y: 1.0, w: 9.2, h: 1, fontSize: 13, color: '333333' })
    }

    const s5 = pptx.addSlide()
    s5.addText('Comparativo de Cancelamentos', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: corTitulo })
    const cancelPorLoja = lojasRegiao.map(l => {
      const dadoAtual = operacaoMensal.find(o => o.loja_id === l.id && o.mes === mesAtual)
      const dadoAnterior = operacaoMensal.find(o => o.loja_id === l.id && o.mes === mesAnterior)
      const totalAtual = dadoAtual && dadoAtual.motivos_cancelamento ? dadoAtual.motivos_cancelamento.reduce((s, m) => s + m.quantidade, 0) : 0
      const totalAnterior = dadoAnterior && dadoAnterior.motivos_cancelamento ? dadoAnterior.motivos_cancelamento.reduce((s, m) => s + m.quantidade, 0) : 0
      return { nome: l.nome, totalAtual, totalAnterior }
    }).sort((a, b) => b.totalAtual - a.totalAtual)

    if (cancelPorLoja.some(c => c.totalAtual > 0 || c.totalAnterior > 0)) {
      s5.addChart(pptx.ChartType.bar, [
        { name: monthLabelShort(mesAnterior), labels: cancelPorLoja.map(c => c.nome), values: cancelPorLoja.map(c => c.totalAnterior) },
        { name: monthLabelShort(mesAtual), labels: cancelPorLoja.map(c => c.nome), values: cancelPorLoja.map(c => c.totalAtual) }
      ], {
        x: 0.4, y: 0.9, w: 9.2, h: 4.3,
        barDir: 'col', barGrouping: 'clustered',
        showLegend: true, legendPos: 't',
        showValue: true, dataLabelPosition: 'outEnd',
        chartColors: ['7FA8C9', '1F3B57'],
        catAxisLabelFontSize: 11, valAxisLabelFontSize: 10
      })
    } else {
      s5.addText('Nenhum cancelamento registrado para este mês.', { x: 0.4, y: 1.0, w: 9.2, h: 1, fontSize: 13, color: '333333' })
    }

    const s6 = pptx.addSlide()
    s6.addText('Motivos de Cancelamento', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: corTitulo })
    const motivosAgregados = {}
    lojasRegiao.forEach(l => {
      const dado = operacaoMensal.find(o => o.loja_id === l.id && o.mes === mesAtual)
      if (dado && dado.motivos_cancelamento) {
        dado.motivos_cancelamento.forEach(m => {
          motivosAgregados[m.motivo] = (motivosAgregados[m.motivo] || 0) + m.quantidade
        })
      }
    })
    const motivosOrdenados = Object.entries(motivosAgregados).sort((a, b) => a[1] - b[1])

    if (motivosOrdenados.length > 0) {
      s6.addChart(pptx.ChartType.bar, [
        { name: 'Motivos', labels: motivosOrdenados.map(m => m[0]), values: motivosOrdenados.map(m => m[1]) }
      ], {
        x: 0.4, y: 0.9, w: 9.2, h: 4.3,
        barDir: 'bar',
        showLegend: false,
        showValue: true, dataLabelPosition: 'outEnd',
        chartColors: ['4F81A9'],
        catAxisLabelFontSize: 11, valAxisLabelFontSize: 10
      })
    } else {
      s6.addText('Nenhum motivo de cancelamento registrado para este mês.', { x: 0.4, y: 1.0, w: 9.2, h: 1, fontSize: 13, color: '333333' })
    }

    const s7 = pptx.addSlide()
    s7.addText('Dados de Operação — Tempo de Funcionamento', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 18, bold: true, color: corTitulo })
    const dadosFunc = lojasRegiao.map(l => {
      const atualD = operacaoMensal.find(o => o.loja_id === l.id && o.mes === mesAtual)
      const antD = operacaoMensal.find(o => o.loja_id === l.id && o.mes === mesAnterior)
      return {
        nome: l.nome,
        tempo: atualD ? atualD.tempo_func : '—',
        pct: atualD && atualD.tempo_pct != null ? atualD.tempo_pct : null,
        pctAnterior: antD && antD.tempo_pct != null ? antD.tempo_pct : null
      }
    }).sort((a, b) => (b.pct || 0) - (a.pct || 0))
    const rowsFunc = [['Loja', 'Tempo de funcionamento', '%', 'Variação vs mês anterior'].map(t => ({ text: t, options: { bold: true, fill: corHeader } }))]
    dadosFunc.forEach(d => {
      const variacao = (d.pct != null && d.pctAnterior != null) ? fmtPct(d.pct - d.pctAnterior) : 'N/A'
      rowsFunc.push([d.nome, d.tempo || '—', d.pct != null ? d.pct + '%' : '—', variacao])
    })
    s7.addTable(rowsFunc, { x: 0.4, y: 0.9, w: 9.2, fontSize: 11, autoPage: false })

    const s8 = pptx.addSlide()
    s8.addText('Dados de Logística', { x: 0.4, y: 0.3, w: 9.2, h: 0.5, fontSize: 20, bold: true, color: corTitulo })
    const rowsLog = [['Loja', 'Tempo de Entrega', 'Tempo de Preparo', 'Tempo de Espera'].map(t => ({ text: t, options: { bold: true, fill: corHeader } }))]
    lojasRegiao.forEach(l => {
      const dado = operacaoMensal.find(o => o.loja_id === l.id && o.mes === mesAtual)
      rowsLog.push([
        l.nome,
        dado && dado.log_entrega != null ? `${dado.log_entrega} min` : '—',
        dado && dado.log_preparo != null ? `${dado.log_preparo} min` : '—',
        dado && dado.log_espera != null ? `${dado.log_espera} min` : '—'
      ])
    })
    s8.addTable(rowsLog, { x: 0.4, y: 0.9, w: 9.2, fontSize: 11, autoPage: false })

    const nomeArquivo = `Resultados_${regiao.replace(/\s+/g, '_')}_${mesAtual}.pptx`
    await pptx.writeFile({ fileName: nomeArquivo })
    setMsg({ text: 'PowerPoint gerado! Verifique os downloads do seu navegador.', ok: true })
  }

  return (
    <div className="card">
      <h2>Relatório mensal em PowerPoint</h2>
      <p className="muted">Gera um arquivo .pptx com o comparativo de vendas (iFood e 99Food), investimento, cancelamentos, tempo de funcionamento e logística das lojas da região escolhida, comparando o mês selecionado com o mês anterior e com o mesmo mês do ano passado.</p>
      <div className="row">
        <div>
          <label>Região</label>
          <select value={regiao} onChange={e => setRegiao(e.target.value)}>
            {regioes.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label>Mês do relatório</label>
          <input type="month" value={mesAtual} onChange={e => setMesAtual(e.target.value)} />
        </div>
      </div>
      <button className="btn-primary" style={{ marginTop: 14 }} onClick={gerar}>Gerar PowerPoint</button>
      {msg.text && <p className="muted" style={{ marginTop: 10, color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
    </div>
  )
}

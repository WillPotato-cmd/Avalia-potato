import React, { useState } from 'react'
import { jsPDF } from 'jspdf'
import { gerarPdfRelatorio } from './pdfCore'
import {
  monthLabel, monthLabelShort, currentMonthValue,
  addMonthsToKey, subtractYearFromKey, pctVar, fmtPct, fmtMoeda
} from './dateUtils'

export default function RelatorioPDF({ lojas, vendasDiarias, operacaoMensal }) {
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

  function gerar() {
    if (!mesAtual) { setMsg({ text: 'Selecione o mês.', ok: false }); return }
    const mesAnterior = addMonthsToKey(mesAtual, -1)
    const mesRetrasado = addMonthsToKey(mesAtual, -2)
    const mesAnoPassado = subtractYearFromKey(mesAtual)
    const lojasRegiao = lojas.filter(l => ((l.regiao && l.regiao.trim()) || 'Sem região') === regiao)
    if (lojasRegiao.length === 0) {
      setMsg({ text: 'Nenhuma loja encontrada nessa região.', ok: false })
      return
    }
    const slides = []
    const mensal = (lojaId, mes) => operacaoMensal.find(o => o.loja_id === lojaId && o.mes === mes)
    const totalCancel = d => d && d.motivos_cancelamento ? d.motivos_cancelamento.reduce((s, m) => s + m.quantidade, 0) : 0

    // Capa
    slides.push({ tipo:'capa', titulo:'Resultados Delivery', mes: monthLabel(mesAtual).replace(/^\w/, c => c.toUpperCase()), regiao });

    // Vendas iFood
    const rowsIfood = [];
    let totIfoodAnt=0, totIfoodAtu=0, totIfoodAno=0;
    lojasRegiao.forEach(l => {
      const ant = somaVendasCanal(l.id, 'ifood', mesAnterior).pedidos;
      const atu = somaVendasCanal(l.id, 'ifood', mesAtual).pedidos;
      const ano = somaVendasCanal(l.id, 'ifood', mesAnoPassado).pedidos;
      totIfoodAnt+=ant; totIfoodAtu+=atu; totIfoodAno+=ano;
      rowsIfood.push([l.nome, String(ant), String(atu), fmtPct(pctVar(atu,ant)), String(ano), fmtPct(pctVar(atu,ano))]);
    });
    rowsIfood.push(['TOTAL', String(totIfoodAnt), String(totIfoodAtu), fmtPct(pctVar(totIfoodAtu,totIfoodAnt)), String(totIfoodAno), fmtPct(pctVar(totIfoodAtu,totIfoodAno))]);
    slides.push({ tipo:'tabela', titulo:'Comparativo de Vendas (iFood)', totalUltima:true,
      cab:['Loja', monthLabelShort(mesAnterior), monthLabelShort(mesAtual), 'Comparativo', monthLabelShort(mesAnoPassado), 'Comparativo'], linhas: rowsIfood });

    // Vendas 99Food
    const rows99 = [];
    let tot99Ant=0, tot99Atu=0;
    lojasRegiao.forEach(l => {
      const ant = somaVendasCanal(l.id, '99food', mesAnterior).pedidos;
      const atu = somaVendasCanal(l.id, '99food', mesAtual).pedidos;
      tot99Ant+=ant; tot99Atu+=atu;
      rows99.push([l.nome, String(ant), String(atu), fmtPct(pctVar(atu,ant))]);
    });
    rows99.push(['TOTAL', String(tot99Ant), String(tot99Atu), fmtPct(pctVar(tot99Atu,tot99Ant))]);
    slides.push({ tipo:'tabela', titulo:'Comparativo de Vendas (99Food)', totalUltima:true,
      cab:['Loja', monthLabelShort(mesAnterior), monthLabelShort(mesAtual), 'Comparativo'], linhas: rows99 });

    // Investimento (iFood e 99Food)
    [['ifood','iFood'],['99food','99Food']].forEach(([canal, nomeCanal]) => {
      const rows = [];
      let tr=0, ta=0, tu=0;
      lojasRegiao.forEach(l => {
        const retr = somaVendasCanal(l.id, canal, mesRetrasado).investimento;
        const ant = somaVendasCanal(l.id, canal, mesAnterior).investimento;
        const atu = somaVendasCanal(l.id, canal, mesAtual).investimento;
        tr+=retr; ta+=ant; tu+=atu;
        rows.push([l.nome, fmtMoeda(retr), fmtMoeda(ant), fmtMoeda(atu), fmtPct(pctVar(atu,ant))]);
      });
      rows.push(['TOTAL', fmtMoeda(tr), fmtMoeda(ta), fmtMoeda(tu), fmtPct(pctVar(tu,ta))]);
      slides.push({ tipo:'tabela', titulo:`Comparativo de Custos de Investimento — ${nomeCanal} (R$)`, totalUltima:true,
        cab:['Loja', monthLabelShort(mesRetrasado), monthLabelShort(mesAnterior), monthLabelShort(mesAtual), 'Variação'], linhas: rows });
    });

    // Gráfico de linhas: investimento iFood + 99Food, 3 meses
    const tituloLinha = 'Evolução do Investimento — Últimos 3 Meses (iFood + 99Food)';
    const seriesInv = lojasRegiao.map(l => ({
      nome: l.nome,
      valores: [mesRetrasado, mesAnterior, mesAtual].map(m => somaVendasCanal(l.id,'ifood',m).investimento + somaVendasCanal(l.id,'99food',m).investimento)
    }));
    if(seriesInv.some(s => s.valores.some(v => v > 0))){
      slides.push({ tipo:'linha', titulo:tituloLinha, categorias:[monthLabelShort(mesRetrasado), monthLabelShort(mesAnterior), monthLabelShort(mesAtual)], series: seriesInv });
    } else {
      slides.push({ tipo:'vazio', titulo:tituloLinha, texto:'Nenhum dado de investimento registrado nesses meses.' });
    }

    // Cancelamentos por loja
    const cancelPorLoja = lojasRegiao.map(l => ({
      nome: l.nome,
      totalAtual: totalCancel(mensal(l.id, mesAtual)),
      totalAnterior: totalCancel(mensal(l.id, mesAnterior))
    })).sort((a,b) => b.totalAtual - a.totalAtual);
    if(cancelPorLoja.some(c => c.totalAtual > 0 || c.totalAnterior > 0)){
      slides.push({ tipo:'colunas', titulo:'Comparativo de Cancelamentos', categorias: cancelPorLoja.map(c => c.nome),
        series:[
          { nome: monthLabelShort(mesAnterior), cor:[127,168,201], valores: cancelPorLoja.map(c => c.totalAnterior) },
          { nome: monthLabelShort(mesAtual), cor:[31,59,87], valores: cancelPorLoja.map(c => c.totalAtual) }
        ] });
    } else {
      slides.push({ tipo:'vazio', titulo:'Comparativo de Cancelamentos', texto:'Nenhum cancelamento registrado para este mês.' });
    }

    // Motivos de cancelamento (agregado da região)
    const motivosAgregados = {};
    lojasRegiao.forEach(l => {
      const dado = mensal(l.id, mesAtual);
      if(dado && dado.motivos_cancelamento){
        dado.motivos_cancelamento.forEach(m => { motivosAgregados[m.motivo] = (motivosAgregados[m.motivo] || 0) + m.quantidade; });
      }
    });
    const motivosOrdenados = Object.entries(motivosAgregados).sort((a,b) => a[1] - b[1]);
    if(motivosOrdenados.length > 0){
      slides.push({ tipo:'barrasH', titulo:'Motivos de Cancelamento', categorias: motivosOrdenados.map(m => m[0]), valores: motivosOrdenados.map(m => m[1]) });
    } else {
      slides.push({ tipo:'vazio', titulo:'Motivos de Cancelamento', texto:'Nenhum motivo de cancelamento registrado para este mês.' });
    }

    // Tempo de funcionamento
    const dadosFunc = lojasRegiao.map(l => {
      const a = mensal(l.id, mesAtual), p = mensal(l.id, mesAnterior);
      return { nome: l.nome, tempo: a ? a.tempo_func : '—', pct: a && a.tempo_pct != null ? a.tempo_pct : null, pctAnterior: p && p.tempo_pct != null ? p.tempo_pct : null };
    }).sort((a,b) => (b.pct||0) - (a.pct||0));
    slides.push({ tipo:'tabela', titulo:'Dados de Operação — Tempo de Funcionamento',
      cab:['Loja', 'Tempo de funcionamento', '%', 'Variação vs mês anterior'],
      linhas: dadosFunc.map(d => [d.nome, d.tempo || '—', d.pct != null ? d.pct + '%' : '—', (d.pct != null && d.pctAnterior != null) ? fmtPct(d.pct - d.pctAnterior) : 'N/A']) });

    // Logística
    slides.push({ tipo:'tabela', titulo:'Dados de Logística',
      cab:['Loja', 'Tempo de Entrega', 'Tempo de Preparo', 'Tempo de Espera'],
      linhas: lojasRegiao.map(l => {
        const d = mensal(l.id, mesAtual);
        const f = v => v != null ? `${v} min` : '—';
        return [l.nome, f(d && d.log_entrega), f(d && d.log_preparo), f(d && d.log_espera)];
      }) });

    try {
      const doc = gerarPdfRelatorio(jsPDF, slides)
      doc.save(`Resultados_${regiao.replace(/\s+/g, '_')}_${mesAtual}.pdf`)
      setMsg({ text: 'PDF gerado! Verifique os downloads do seu navegador.', ok: true })
    } catch (e) {
      setMsg({ text: 'Erro ao gerar o PDF: ' + e.message, ok: false })
    }
  }

  return (
    <div className="card">
      <h2>Relatório mensal em PDF</h2>
      <p className="muted">Gera um arquivo .pdf com o comparativo de vendas (iFood e 99Food), investimento, cancelamentos, tempo de funcionamento e logística das lojas da região escolhida, comparando o mês selecionado com o mês anterior e com o mesmo mês do ano passado.</p>
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
      <button className="btn-primary" style={{ marginTop: 14 }} onClick={gerar}>Gerar PDF</button>
      {msg.text && <p className="muted" style={{ marginTop: 10, color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>}
    </div>
  )
}

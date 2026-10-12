// Gerador de PDF do relatório mensal. Recebe a classe jsPDF e um "modelo" de slides.
// slide: {tipo:'capa',titulo,mes,regiao} | {tipo:'tabela',titulo,cab:[],linhas:[[]],totalUltima:bool}
//      | {tipo:'linha',titulo,categorias:[],series:[{nome,valores}]}
//      | {tipo:'colunas',titulo,series:[{nome,cor,valores}],categorias:[]}
//      | {tipo:'barrasH',titulo,categorias:[],valores:[]} | {tipo:'vazio',titulo,texto}
export function gerarPdfRelatorio(JsPDF, slides, fmtNum) {
  const W = 297, H = 167; // 16:9 em mm
  const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: [W, H] });
  const roxo = [60, 52, 137], header = [238, 237, 254], cinza = [68, 68, 68];
  const paleta = [[31,59,87],[127,168,201],[79,129,169],[217,119,6],[22,163,74],[220,38,38],[124,58,237],[8,145,178],[190,24,93],[101,163,13],[234,88,12],[71,85,105],[13,148,136],[161,98,7]];
  const num = fmtNum || (v => String(v).replace('.', ','));
  const fmtMoedaCurta = v => 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\d(?=(\d{3})+,)/g, '$&.');
  const cortar = (t, w) => { t = String(t); while (t.length > 1 && doc.getTextWidth(t) > w) t = t.slice(0, -2) + '…'; return t; };
  const titulo = s => { doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(...roxo); doc.text(s, 14, 20); };

  function tabela(s) {
    titulo(s.titulo);
    const x0 = 14, larg = W - 28, n = s.cab.length;
    const colW = [larg * (n > 4 ? 0.26 : 0.30)];
    for (let i = 1; i < n; i++) colW.push((larg - colW[0]) / (n - 1));
    const alt = Math.min(11, (H - 40) / (s.linhas.length + 1));
    let y = 30;
    const linha = (cels, i, cab, tot) => {
      if (cab) { doc.setFillColor(...header); doc.rect(x0, y, larg, alt, 'F'); }
      else if (i % 2) { doc.setFillColor(248, 248, 252); doc.rect(x0, y, larg, alt, 'F'); }
      doc.setFont('helvetica', cab || tot ? 'bold' : 'normal');
      doc.setFontSize(Math.min(11, alt * 1.1));
      doc.setTextColor(30, 30, 30);
      let x = x0;
      cels.forEach((c, j) => {
        const t = cortar(c, colW[j] - 4);
        if (j === 0) doc.text(t, x + 2, y + alt * 0.68);
        else doc.text(t, x + colW[j] - 2, y + alt * 0.68, { align: 'right' });
        x += colW[j];
      });
      doc.setDrawColor(220, 220, 230); doc.setLineWidth(0.2); doc.line(x0, y + alt, x0 + larg, y + alt);
      y += alt;
    };
    linha(s.cab, 0, true, false);
    s.linhas.forEach((l, i) => linha(l, i, false, s.totalUltima && i === s.linhas.length - 1));
  }

  function eixoY(x, y, w, h, max) {
    const passos = 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110, 110, 110);
    doc.setDrawColor(228, 228, 236); doc.setLineWidth(0.2);
    for (let i = 0; i <= passos; i++) {
      const yy = y + h - (h * i) / passos;
      doc.line(x, yy, x + w, yy);
      doc.text(num(Math.round((max * i) / passos * 100) / 100), x - 2, yy + 1, { align: 'right' });
    }
  }
  const maxBonito = v => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p * 2) / 2 * p || 1; };

  function legenda(itens, x, y, vertical, wMax) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    let xx = x, yy = y;
    itens.forEach(it => {
      doc.setFillColor(...it.cor); doc.rect(xx, yy - 2.6, 3.4, 3.4, 'F');
      doc.setTextColor(40, 40, 40);
      const t = cortar(it.nome, wMax || 60);
      doc.text(t, xx + 5, yy);
      if (vertical) yy += 5.5; else xx += doc.getTextWidth(t) + 14;
    });
  }

  function linhaChart(s) {
    titulo(s.titulo);
    const legW = 52, x = 30, y = 32, w = W - x - legW - 14, h = H - y - 26;
    const max = maxBonito(Math.max(...s.series.flatMap(se => se.valores)));
    eixoY(x, y, w, h, max);
    const nC = s.categorias.length;
    const px = i => x + (w * (i + 0.5)) / nC;
    doc.setFontSize(10); doc.setTextColor(60, 60, 60);
    s.categorias.forEach((c, i) => doc.text(c, px(i), y + h + 7, { align: 'center' }));
    s.series.forEach((se, k) => {
      const cor = paleta[k % paleta.length];
      doc.setDrawColor(...cor); doc.setLineWidth(0.8);
      se.valores.forEach((v, i) => {
        if (i) doc.line(px(i - 1), y + h - (h * se.valores[i - 1]) / max, px(i), y + h - (h * v) / max);
      });
      doc.setFillColor(...cor);
      se.valores.forEach((v, i) => doc.circle(px(i), y + h - (h * v) / max, 1.1, 'F'));
    });
    // rótulos de valor (depois das linhas) – desloca rótulos próximos para não sobrepor
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); 
    for (let i = 0; i < nC; i++) {
      const pts = s.series.map((se, k) => ({ k, v: se.valores[i] })).sort((a, b) => b.v - a.v);
      let ultimoY = -1e9;
      pts.forEach(p => {
        let yy = y + h - (h * p.v) / max - 2.2;
        if (yy - ultimoY < 3) yy = ultimoY + 3;
        ultimoY = yy;
        doc.setTextColor(...paleta[p.k % paleta.length]);
        doc.text(num(Math.round(p.v * 100) / 100), px(i) + 2.5, yy);
      });
    }
    legenda(s.series.map((se, k) => ({ nome: se.nome, cor: paleta[k % paleta.length] })), W - legW - 8, y + 4, true, legW - 6);
  }

  function colunas(s) {
    titulo(s.titulo);
    const x = 24, y = 40, w = W - x - 14, h = H - y - 28;
    const max = maxBonito(Math.max(...s.series.flatMap(se => se.valores)));
    legenda(s.series.map(se => ({ nome: se.nome, cor: se.cor })), W / 2 - 25, 32, false, 40);
    eixoY(x, y, w, h, max);
    const nC = s.categorias.length, grupoW = w / nC, ns = s.series.length;
    const barW = Math.min(14, (grupoW * 0.7) / ns);
    s.categorias.forEach((c, i) => {
      const gx = x + grupoW * i + grupoW / 2 - (barW * ns) / 2;
      s.series.forEach((se, k) => {
        const v = se.valores[i], bh = (h * v) / max;
        doc.setFillColor(...se.cor); doc.rect(gx + k * barW, y + h - bh, barW, bh, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(40, 40, 40);
        doc.text(String(v), gx + k * barW + barW / 2, y + h - bh - 1.5, { align: 'center' });
      });
      doc.setFontSize(9); doc.setTextColor(60, 60, 60);
      doc.text(cortar(c, grupoW - 2), x + grupoW * i + grupoW / 2, y + h + 6, { align: 'center' });
    });
  }

  function barrasH(s) {
    titulo(s.titulo);
    const rotW = 80, x = 14 + rotW, y = 30, w = W - x - 24, h = H - y - 16;
    const n = s.categorias.length, passo = h / n, bh = Math.min(12, passo * 0.65);
    const max = maxBonito(Math.max(...s.valores));
    s.categorias.forEach((c, i) => {
      // ordem: o primeiro item da lista fica embaixo, como no gráfico original (menor→maior de baixo p/ cima)
      const yy = y + h - passo * (i + 1) + (passo - bh) / 2;
      const bw = (w * s.valores[i]) / max;
      doc.setFillColor(79, 129, 169); doc.rect(x, yy, bw, bh, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(50, 50, 50);
      doc.text(cortar(c, rotW - 4), x - 2, yy + bh * 0.68, { align: 'right' });
      doc.text(String(s.valores[i]), x + bw + 2, yy + bh * 0.68);
    });
  }

  slides.forEach((s, i) => {
    if (i) doc.addPage([W, H], 'landscape');
    if (s.tipo === 'capa') {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(40); doc.setTextColor(...roxo);
      doc.text(s.titulo, W / 2, 65, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(24); doc.setTextColor(...cinza);
      doc.text(s.mes, W / 2, 85, { align: 'center' });
      doc.setFontSize(16); doc.setTextColor(136, 136, 136);
      doc.text(`[${s.regiao}]`, W / 2, 98, { align: 'center' });
    } else if (s.tipo === 'tabela') tabela(s);
    else if (s.tipo === 'linha') linhaChart(s);
    else if (s.tipo === 'colunas') colunas(s);
    else if (s.tipo === 'barrasH') barrasH(s);
    else { titulo(s.titulo); doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(51, 51, 51); doc.text(s.texto, 14, 36); }
  });
  return doc;
}

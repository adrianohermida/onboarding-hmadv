/**
 * cnj-pdf-generator.js
 * Gera o Formulário CNJ Anexo II (Recomendação 125/2021) como documento HTML
 * imprimível / exportável para PDF via janela do navegador.
 *
 * Uso:
 *   import { openCnjAnexoIIPrint } from '../js/cnj-pdf-generator.js';
 *   openCnjAnexoIIPrint(caso);   // caso = objeto portal_casos completo
 */

import { buildCNJJson, fmtBRL } from './cnj-engine.js';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function esc(s) {
  return String(s ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(val) {
  const n = Number(val);
  return isNaN(n) ? '—' : fmtBRL(n);
}

function fmtDate(str) {
  if (!str) return '—';
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }
  return esc(str);
}

function fmtPerc(val) {
  const n = Number(val);
  return isNaN(n) ? '—' : `${(n * 100).toFixed(1)}%`;
}

function row(label, value) {
  return `<tr><td class="lbl">${esc(label)}</td><td class="val">${esc(value)}</td></tr>`;
}

function rowMoney(label, value) {
  return `<tr><td class="lbl">${esc(label)}</td><td class="val money">${fmt(value)}</td></tr>`;
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */

const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:ital,wght@0,400;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    color: #000;
    background: #fff;
    margin: 0;
    padding: 0;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 20mm 20mm 15mm 25mm;
    background: #fff;
  }

  @media print {
    @page { size: A4; margin: 20mm 20mm 15mm 25mm; }
    body { margin: 0; }
    .page { width: 100%; padding: 0; }
    .no-print { display: none !important; }
    .page-break { page-break-before: always; }
  }

  /* ── Header ── */
  .doc-header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .doc-header .brasao {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .doc-header h1 {
    font-size: 13pt;
    font-weight: 700;
    margin: 6px 0 2px;
    text-transform: uppercase;
  }
  .doc-header p {
    font-size: 9pt;
    margin: 2px 0 0;
    color: #333;
  }

  /* ── Sections ── */
  .section {
    margin-bottom: 14px;
  }
  .section-title {
    font-size: 10.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .5px;
    background: #e8e8e8;
    border: 1px solid #999;
    padding: 3px 8px;
    margin-bottom: 0;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  td, th {
    border: 1px solid #aaa;
    padding: 3px 6px;
    vertical-align: top;
  }
  th {
    background: #e8e8e8;
    font-weight: 700;
    text-align: center;
    font-size: 9.5pt;
  }
  td.lbl {
    width: 42%;
    font-weight: 600;
    background: #f5f5f5;
  }
  td.val { width: 58%; }
  td.val.money { text-align: right; font-family: monospace; font-size: 10pt; }
  td.center { text-align: center; }
  td.right { text-align: right; }
  tr.subtotal td { background: #f0f4ff; font-weight: 700; }
  tr.total td { background: #dbeafe; font-weight: 700; font-size: 10.5pt; }
  tr.alert td { background: #fef2f2; color: #991b1b; }

  /* ── Grid 2-col ── */
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid #aaa;
  }
  .grid2 .cell {
    padding: 3px 6px;
    border-right: 1px solid #aaa;
    border-bottom: 1px solid #aaa;
  }
  .grid2 .cell:nth-child(even) { border-right: none; }
  .grid2 .lbl { font-weight: 600; font-size: 9pt; color: #444; }
  .grid2 .val { font-size: 10pt; }

  /* ── Creditor table ── */
  .cred-table th, .cred-table td { font-size: 9pt; }

  /* ── Signature ── */
  .sig-block {
    margin-top: 30px;
    display: flex;
    gap: 40px;
    flex-wrap: wrap;
  }
  .sig-line {
    flex: 1;
    min-width: 180px;
    border-top: 1px solid #000;
    padding-top: 4px;
    font-size: 9pt;
    text-align: center;
  }

  /* ── Print button ── */
  .print-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #1e3a5f;
    color: #fff;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 9999;
    font-family: Arial, sans-serif;
    font-size: 14px;
  }
  .print-bar button {
    background: #fff;
    color: #1e3a5f;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
  }
  .print-bar button:hover { background: #e2e8f0; }
  @media print { .print-bar { display: none; } }
`;

/* ── Main builder ─────────────────────────────────────────────────────────── */

export function buildAnexoIIHtml(caso) {
  const d    = buildCNJJson(caso);
  const cli  = d.cliente;
  const eco  = d.socioeconomico;
  const desp = d.despesas;
  const end  = d.endividamento;
  const plan = d.plano_pagamento;
  const ana  = d.analise;
  const cred = d.credores || [];
  const hoje = new Date().toLocaleDateString('pt-BR');

  /* ── Endereço principal ── */
  const addr = (cli.enderecos || [])[0] || {};
  const addrStr = addr.logradouro
    ? `${addr.logradouro}${addr.numero ? ', ' + addr.numero : ''}${addr.complemento ? ' — ' + addr.complemento : ''}, ${addr.bairro || ''}, ${addr.cidade || ''}/${addr.estado || ''}, CEP ${addr.cep || ''}`
    : '—';

  /* ── Telefone principal ── */
  const tel = (cli.telefones || [])[0] || {};
  const telStr = tel.numero ? `(${tel.ddd || ''}) ${tel.numero}` : '—';

  /* ── Dependentes ── */
  const depRows = (eco.dependentes || []).map((dep, i) =>
    `<tr>
      <td class="center">${i + 1}</td>
      <td>${esc(dep.nome || '—')}</td>
      <td class="center">${esc(dep.parentesco || '—')}</td>
      <td class="center">${esc(dep.data_nascimento ? fmtDate(dep.data_nascimento) : dep.idade || '—')}</td>
     </tr>`
  ).join('') || `<tr><td colspan="4" class="center">Nenhum dependente declarado</td></tr>`;

  /* ── Cônjuge ── */
  const conj = eco.conjugue;
  const conjSection = conj ? `
    <tr>${row('Nome do Cônjuge', conj.nome)}</tr>
    <tr>${row('CPF do Cônjuge', conj.cpf)}</tr>
    <tr>${row('Data de Nascimento', fmtDate(conj.data_nascimento))}</tr>
    <tr>${row('Profissão', conj.profissao)}</tr>
    <tr>${rowMoney('Renda do Cônjuge', conj.renda)}</tr>
  ` : '';

  /* ── Despesas ── */
  const despCats = {
    moradia:       'Moradia (aluguel/prestação)',
    alimentacao:   'Alimentação',
    transporte:    'Transporte',
    saude:         'Saúde e medicamentos',
    educacao:      'Educação',
    agua_luz:      'Água e energia',
    internet:      'Internet / telefone',
    vestuario:     'Vestuário',
    lazer:         'Lazer / cultura',
    outros:        'Outros',
  };
  const despRows = Object.entries(despCats).map(([key, label]) =>
    desp[key] ? `<tr><td class="lbl">${esc(label)}</td><td class="val money">${fmt(desp[key])}</td></tr>` : ''
  ).join('');

  /* ── Credores ── */
  const credRows = cred.map((c, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td>${esc(c.nome)}</td>
      <td class="center">${esc(c.tipo || '—')}</td>
      <td class="right">${fmt(c.saldo_original)}</td>
      <td class="right">${fmt(c.saldo_corrigido ?? c.saldo_original)}</td>
      <td class="right">${fmt(c.pmt_atual)}</td>
      <td class="center">${c.processo_judicial ? 'Sim' : 'Não'}</td>
      <td class="center">${c.consignado ? 'Sim' : 'Não'}</td>
    </tr>`
  ).join('') || `<tr><td colspan="8" class="center">Nenhum credor informado</td></tr>`;

  /* ── Plano de pagamento por credor ── */
  const planCredRows = cred.map((c, i) => {
    const percCredor = end.montante_total > 0 ? c.saldo_corrigido / end.montante_total : 0;
    const pmtProposto = (plan.pmt_mensal || 0) * percCredor;
    return `
      <tr>
        <td>${esc(c.nome)}</td>
        <td class="right">${fmt(c.saldo_corrigido ?? c.saldo_original)}</td>
        <td class="center">${fmtPerc(percCredor)}</td>
        <td class="right">${fmt(pmtProposto)}</td>
        <td class="center">${plan.prazo_meses || 60} meses</td>
      </tr>`;
  }).join('') || `<tr><td colspan="5" class="center">—</td></tr>`;

  /* ── Alertas ── */
  const alertas = (ana.alertas || []);
  const alertasHtml = alertas.length
    ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:9.5pt;">` +
      alertas.map(a => `<li class="alert-item">${esc(a)}</li>`).join('') + `</ul>`
    : '<p style="font-size:9.5pt;margin:4px 0 0;">Nenhum alerta identificado.</p>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Formulário CNJ Anexo II — ${esc(cli.nome)}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>

<div class="print-bar no-print">
  <span>📄 Formulário CNJ Anexo II — ${esc(cli.nome)}</span>
  <div style="display:flex;gap:12px">
    <button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
    <button onclick="window.close()" style="background:#c0392b;color:#fff">✕ Fechar</button>
  </div>
</div>

<div class="page" style="margin-top:52px">

  <!-- ═══ CABEÇALHO ════════════════════════════════════════════════════════ -->
  <div class="doc-header">
    <div class="brasao">Poder Judiciário · Conselho Nacional de Justiça</div>
    <h1>Formulário de Superendividamento — Anexo II</h1>
    <p>Recomendação CNJ n.° 125/2021 · Lei 14.181/2021 (Superendividamento)</p>
    <p style="font-size:9pt;margin-top:4px">Gerado em ${hoje} · Sistema Portal Hermida Maia Advocacia</p>
  </div>

  <!-- ═══ SEÇÃO 1 — IDENTIFICAÇÃO ══════════════════════════════════════════ -->
  <div class="section">
    <div class="section-title">1. Identificação do Consumidor Superendividado</div>
    <table>
      ${row('Nome completo', cli.nome)}
      ${row('CPF', cli.cpf)}
      ${row('Data de nascimento', fmtDate(cli.data_nascimento))}
      ${row('Sexo', cli.sexo)}
      ${row('Estado civil', cli.estado_civil)}
      ${row('Profissão', cli.profissao)}
      ${row('Situação profissional', cli.situacao_profissional)}
      ${row('Nome da mãe', cli.nome_mae)}
      ${row('Naturalidade', cli.naturalidade)}
      ${row('Nacionalidade', cli.nacionalidade)}
      ${row('RG / Órgão emissor', cli.rg ? `${cli.rg} / ${cli.rg_emissor || '—'}` : '—')}
      ${row('E-mail', cli.email)}
      ${row('Telefone', telStr)}
      ${row('Endereço completo', addrStr)}
    </table>
  </div>

  <!-- ═══ SEÇÃO 2 — SITUAÇÃO SOCIOECONÔMICA ════════════════════════════════ -->
  <div class="section">
    <div class="section-title">2. Situação Socioeconômica</div>
    <table>
      ${rowMoney('Renda individual mensal líquida', eco.renda_individual)}
      ${rowMoney('Renda familiar total mensal', eco.renda_familiar)}
      ${row('Número de dependentes', eco.n_dependentes || 0)}
      ${conjSection}
    </table>
  </div>

  ${eco.dependentes?.length ? `
  <div class="section">
    <div class="section-title">2a. Dependentes</div>
    <table>
      <thead><tr>
        <th style="width:6%">#</th>
        <th>Nome</th>
        <th style="width:22%">Parentesco</th>
        <th style="width:20%">Nasc./Idade</th>
      </tr></thead>
      <tbody>${depRows}</tbody>
    </table>
  </div>` : ''}

  <!-- ═══ SEÇÃO 3 — DESPESAS MENSAIS ═══════════════════════════════════════ -->
  <div class="section">
    <div class="section-title">3. Despesas Mensais Essenciais (art. 54-B, III, CDC)</div>
    <table>
      ${despRows}
      <tr class="subtotal">
        <td class="lbl">TOTAL DE DESPESAS MENSAIS</td>
        <td class="val money">${fmt(desp._total)}</td>
      </tr>
    </table>
  </div>

  <!-- ═══ SEÇÃO 4 — ANÁLISE DE CAPACIDADE ══════════════════════════════════ -->
  <div class="section">
    <div class="section-title">4. Análise de Capacidade de Pagamento</div>
    <table>
      ${rowMoney('Renda mensal líquida', eco.renda_individual)}
      ${rowMoney('( – ) Despesas mensais essenciais', desp._total)}
      ${rowMoney('( – ) Mínimo existencial (25% SM — Dec. 11.150/2022)', ana.minimo_existencial)}
      <tr class="subtotal">
        ${rowMoney('( = ) Renda disponível para quitação de dívidas', ana.renda_disponivel)}
      </tr>
      <tr>
        <td class="lbl">Percentual comprometido com dívidas</td>
        <td class="val money">${fmtPerc(ana.perc_comprometido)}</td>
      </tr>
    </table>
    ${alertasHtml}
  </div>

  <!-- ═══ SEÇÃO 5 — ENDIVIDAMENTO ═══════════════════════════════════════════ -->
  <div class="section page-break">
    <div class="section-title">5. Quadro Completo de Credores e Dívidas</div>
    <table class="cred-table">
      <thead><tr>
        <th style="width:4%">#</th>
        <th>Credor</th>
        <th style="width:14%">Tipo</th>
        <th style="width:12%">Saldo original</th>
        <th style="width:13%">Saldo corrigido</th>
        <th style="width:12%">Pmt. atual</th>
        <th style="width:8%">Judicial?</th>
        <th style="width:10%">Consignado?</th>
      </tr></thead>
      <tbody>${credRows}</tbody>
      <tfoot>
        <tr class="total">
          <td colspan="3" style="text-align:right;font-weight:700">TOTAL</td>
          <td class="right">${fmt(cred.reduce((a, c) => a + (c.saldo_original || 0), 0))}</td>
          <td class="right">${fmt(end.montante_total)}</td>
          <td class="right">${fmt(end.comprometimento_mensal)}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- ═══ SEÇÃO 6 — PLANO DE PAGAMENTO ══════════════════════════════════════ -->
  <div class="section">
    <div class="section-title">6. Proposta de Plano de Pagamento (art. 104-A CDC)</div>
    <table>
      ${rowMoney('Total das dívidas (corrigidas por SELIC)', end.montante_total)}
      ${rowMoney('Valor mensal disponível para pagamento', plan.renda_disponivel)}
      ${rowMoney('Parcela mensal proposta', plan.pmt_mensal)}
      ${row('Prazo proposto', `${plan.prazo_meses || 60} meses`)}
      ${plan.carencia_meses ? row('Carência solicitada', `${plan.carencia_meses} meses`) : ''}
      ${row('Número de credores', end.n_credores)}
    </table>

    ${cred.length ? `
    <p style="font-size:9.5pt;margin:10px 0 4px;font-weight:700">Distribuição proporcional da parcela mensal por credor:</p>
    <table class="cred-table">
      <thead><tr>
        <th>Credor</th>
        <th style="width:16%">Saldo devedor</th>
        <th style="width:10%">% do total</th>
        <th style="width:16%">Parcela mensal</th>
        <th style="width:14%">Prazo</th>
      </tr></thead>
      <tbody>${planCredRows}</tbody>
    </table>` : ''}
  </div>

  <!-- ═══ SEÇÃO 7 — DECLARAÇÃO E ASSINATURA ════════════════════════════════ -->
  <div class="section">
    <div class="section-title">7. Declaração e Assinatura</div>
    <p style="font-size:10pt;line-height:1.5;margin:8px 0;text-align:justify">
      Declaro, para fins do processo de repactuação de dívidas previsto na
      Lei n.° 14.181/2021 e na Recomendação CNJ n.° 125/2021, que as
      informações prestadas neste formulário são verdadeiras, completas e
      atualizadas, sob pena das cominações legais. Autorizo o escritório
      <strong>Hermida Maia Advocacia</strong> a utilizar estes dados para fins
      exclusivos do processo de superendividamento ora instaurado.
    </p>

    <div class="sig-block" style="margin-top:24px">
      <div class="sig-line">
        <p>${esc(cli.nome)}</p>
        <p>CPF: ${esc(cli.cpf)}</p>
        <p>Requerente / Consumidor Superendividado</p>
      </div>
      <div class="sig-line">
        <p>Local e data: _________________, ${hoje}</p>
        <p>&nbsp;</p>
        <p>Assinatura</p>
      </div>
    </div>
  </div>

  <!-- ═══ RODAPÉ ════════════════════════════════════════════════════════════ -->
  <div style="margin-top:20px;border-top:1px solid #aaa;padding-top:6px;font-size:8pt;color:#555;text-align:center">
    Hermida Maia Advocacia · contato@hermidamaia.adv.br
    · Documento gerado automaticamente pelo Portal do Cliente · ${hoje}
    · Base legal: Lei 14.181/2021 + Recomendação CNJ 125/2021
  </div>

</div><!-- .page -->
</body>
</html>`;
}

/**
 * Abre uma janela com o Formulário CNJ Anexo II pré-preenchido e pronto
 * para impressão / exportação como PDF.
 *
 * @param {Object} caso  Registro completo de portal_casos
 * @returns {Window}     Referência à janela aberta
 */
export function openCnjAnexoIIPrint(caso) {
  const html = buildAnexoIIHtml(caso);
  const win  = window.open('', '_blank', 'width=900,height=800,scrollbars=yes');
  if (!win) {
    console.error('[cnj-pdf-generator] Pop-up bloqueado pelo navegador.');
    return null;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return win;
}

import { CaseService, DebtService, DocumentService } from '../../services/database.js';
import { financialPlanEngine } from '../financeiro/FinancialPlanEngine.js';
import { buildCommunicationSnapshot } from '../mensagens/CommunicationCenter.js';

const MODULE_COPY = {
  'meu-caso': {
    title: 'Meu caso',
    subtitle: 'Acompanhe sua jornada com clareza, sem termos complicados.',
  },
  'meus-documentos': {
    title: 'Meus documentos',
    subtitle: 'Veja o que já foi enviado e o que ainda precisa da sua atenção.',
  },
  'minhas-dividas': {
    title: 'Minhas dívidas',
    subtitle: 'Organize seus credores para que a equipe consiga analisar seu caso.',
  },
  'meu-plano': {
    title: 'Meu plano',
    subtitle: 'Entenda o caminho de análise até a proposta para reorganizar sua vida financeira.',
  },
  mensagens: {
    title: 'Mensagens',
    subtitle: 'Fale com o escritório e acompanhe os próximos retornos.',
  },
  ajuda: {
    title: 'Ajuda',
    subtitle: 'Respostas simples para as dúvidas mais comuns do portal.',
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(value) {
  const number = Number(value || 0);
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function normalizeStatus(value) {
  return String(value || 'pendente').replace(/_/g, ' ');
}

function getDocStats(docs = []) {
  const total = DocumentService.TYPES.length;
  const approved = docs.filter(doc => ['aprovado', 'assinado'].includes(doc.workflow_status || doc.status)).length;
  const sent = docs.filter(doc => doc.storage_path || ['em_analise', 'aprovado', 'assinado'].includes(doc.workflow_status || doc.status)).length;
  const pending = Math.max(0, total - sent);
  const review = docs.filter(doc => ['em_analise', 'recebido'].includes(doc.workflow_status || doc.status)).length;
  return { total, approved, sent, pending, review, progress: total ? Math.round((sent / total) * 100) : 0 };
}

function getDebtStats(debts = []) {
  const total = debts.reduce((sum, debt) => sum + Number(debt.valor || 0), 0);
  const creditors = debts.length;
  const largest = debts.reduce((max, debt) => Number(debt.valor || 0) > Number(max.valor || 0) ? debt : max, {});
  return { total, creditors, largest };
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR');
}

function getNextStep(caso, docStats, debtStats) {
  if (!caso?.onboarding_done) {
    return {
      label: 'Completar dados do caso',
      text: 'O formulário ajuda a equipe a entender sua situação com segurança.',
      href: 'onboarding-v2.html',
      action: 'Continuar formulário',
    };
  }
  if (debtStats.creditors === 0) {
    return {
      label: 'Cadastrar dívidas',
      text: 'Informe seus credores para que a análise financeira possa começar.',
      href: 'minhas-dividas.html',
      action: 'Ver minhas dívidas',
    };
  }
  if (docStats.pending > 0) {
    return {
      label: 'Enviar documentos',
      text: 'Há documentos pendentes para a equipe validar seu caso.',
      href: 'meus-documentos.html',
      action: 'Ver documentos',
    };
  }
  return {
    label: 'Acompanhar análise',
    text: 'Seu caso está com a equipe. Acompanhe mensagens e próximos retornos.',
    href: 'mensagens.html',
    action: 'Abrir mensagens',
  };
}

function renderShellHeader(moduleKey, nextStep = null) {
  const copy = MODULE_COPY[moduleKey] || MODULE_COPY['meu-caso'];
  return `
    <div class="page-header page-header-row cliente-header">
      <div>
        <h1>${escapeHtml(copy.title)}</h1>
        <p>${escapeHtml(copy.subtitle)}</p>
      </div>
      ${nextStep ? `<a class="btn btn-primary btn-sm" href="${nextStep.href}" data-page="${nextStep.href.replace('.html', '')}">${escapeHtml(nextStep.action)}</a>` : ''}
    </div>
  `;
}

function renderNextAction(nextStep) {
  return `
    <div class="cliente-next-action">
      <div>
        <span>Próxima ação</span>
        <strong>${escapeHtml(nextStep.label)}</strong>
        <p>${escapeHtml(nextStep.text)}</p>
      </div>
      <a class="btn btn-primary btn-sm" href="${nextStep.href}" data-page="${nextStep.href.replace('.html', '')}">${escapeHtml(nextStep.action)}</a>
    </div>
  `;
}

function renderCasePage(data) {
  const { caso, docs, debts, docStats, debtStats, nextStep } = data;
  return `
    ${renderShellHeader('meu-caso', nextStep)}
    ${renderNextAction(nextStep)}
    <section class="cliente-kpis">
      <article class="cliente-kpi"><span>Progresso documental</span><strong>${docStats.progress}%</strong><small>${docStats.sent} de ${docStats.total} enviados</small></article>
      <article class="cliente-kpi"><span>Credores</span><strong>${debtStats.creditors}</strong><small>${formatMoney(debtStats.total)} declarados</small></article>
      <article class="cliente-kpi"><span>Fase do caso</span><strong>${escapeHtml(caso?.fase || 'Cadastro')}</strong><small>Atualizado pelo escritório</small></article>
    </section>
    <section class="cliente-card cliente-journey">
      <h2>Seu caminho no portal</h2>
      <div class="cliente-steps">
        ${[
          ['Dados iniciais', caso?.onboarding_done],
          ['Dívidas cadastradas', debtStats.creditors > 0],
          ['Documentos enviados', docStats.pending === 0 && docStats.total > 0],
          ['Análise do escritório', docStats.review > 0 || docStats.approved > 0],
        ].map(([label, done], index) => `
          <div class="cliente-step ${done ? 'is-done' : ''}">
            <span>${index + 1}</span>
            <strong>${label}</strong>
          </div>
        `).join('')}
      </div>
    </section>
    <section class="cliente-card">
      <h2>Resumo tranquilo</h2>
      <p>${docs.length || debts.length ? 'As informações abaixo ajudam a equipe a preparar a análise do seu caso.' : 'Comece preenchendo o formulário e enviando seus documentos. O portal vai orientar cada etapa.'}</p>
      <div class="cliente-link-grid">
        <a href="meus-documentos.html" data-page="meus-documentos">Ver documentos</a>
        <a href="minhas-dividas.html" data-page="minhas-dividas">Ver dívidas</a>
        <a href="meu-plano.html" data-page="meu-plano">Ver plano</a>
        <a href="ajuda.html" data-page="ajuda">Preciso de ajuda</a>
      </div>
    </section>
  `;
}

function renderDocumentsPage(data) {
  const { docs, docStats, nextStep } = data;
  const rows = DocumentService.TYPES.map(type => {
    const doc = docs.find(item => item.tipo === type.tipo) || {};
    const sent = Boolean(doc.storage_path);
    const status = doc.workflow_status || doc.status || 'pendente';
    return `
      <article class="cliente-list-item">
        <div>
          <strong>${escapeHtml(type.label)}</strong>
          <span>${escapeHtml(type.categoria)} ${type.obrigatorio ? 'Obrigatório' : 'Recomendado'}</span>
        </div>
        <small class="${sent ? 'is-ok' : ''}">${escapeHtml(normalizeStatus(status))}</small>
      </article>
    `;
  }).join('');

  return `
    ${renderShellHeader('meus-documentos', nextStep)}
    <section class="cliente-kpis">
      <article class="cliente-kpi"><span>Enviados</span><strong>${docStats.sent}</strong><small>de ${docStats.total} necessários</small></article>
      <article class="cliente-kpi"><span>Pendentes</span><strong>${docStats.pending}</strong><small>para completar o caso</small></article>
      <article class="cliente-kpi"><span>Em análise</span><strong>${docStats.review}</strong><small>com a equipe</small></article>
    </section>
    <section class="cliente-card">
      <div class="cliente-card-head">
        <h2>Lista de documentos</h2>
        <a class="btn btn-primary btn-sm" href="documentos.html" data-page="documentos">Enviar documento</a>
      </div>
      <div class="cliente-list">${rows}</div>
    </section>
  `;
}

function renderDebtsPage(data) {
  const { debts, debtStats, nextStep } = data;
  const rows = debts.length ? debts.map(debt => `
    <article class="cliente-list-item">
      <div>
        <strong>${escapeHtml(debt.credor || 'Credor')}</strong>
        <span>${escapeHtml(debt.tipo || 'Dívida')} ${debt.situacao ? `Status: ${escapeHtml(debt.situacao)}` : ''}</span>
      </div>
      <small>${formatMoney(debt.valor)}</small>
    </article>
  `).join('') : '<div class="cliente-empty">Nenhuma dívida cadastrada ainda.</div>';

  return `
    ${renderShellHeader('minhas-dividas', nextStep)}
    <section class="cliente-kpis">
      <article class="cliente-kpi"><span>Total declarado</span><strong>${formatMoney(debtStats.total)}</strong><small>informado por você</small></article>
      <article class="cliente-kpi"><span>Credores</span><strong>${debtStats.creditors}</strong><small>cadastrados</small></article>
      <article class="cliente-kpi"><span>Maior dívida</span><strong>${formatMoney(debtStats.largest?.valor)}</strong><small>${escapeHtml(debtStats.largest?.credor || '-')}</small></article>
    </section>
    <section class="cliente-card">
      <div class="cliente-card-head">
        <h2>Seus credores</h2>
        <a class="btn btn-primary btn-sm" href="dividas.html" data-page="dividas">Adicionar dívida</a>
      </div>
      <div class="cliente-list">${rows}</div>
    </section>
  `;
}

function renderPlanPage(data) {
  const { caso, docStats, debtStats, nextStep, financialPlan } = data;
  const ready = caso?.onboarding_done && debtStats.creditors > 0 && docStats.pending === 0;
  const diag = financialPlan?.diagnostico || {};
  const proposal = financialPlan?.proposal || {};
  const topScenarios = (financialPlan?.simulations || []).slice(0, 3);
  return `
    ${renderShellHeader('meu-plano', nextStep)}
    <section class="cliente-card cliente-plan-card">
      <span>${ready ? 'Pronto para análise' : 'Em preparação'}</span>
      <h2>${proposal.parcelaSugerida ? `Parcela segura estimada: ${formatMoney(proposal.parcelaSugerida)}` : 'Seu plano será construído depois que as informações essenciais estiverem completas.'}</h2>
      <p>${proposal.observacao || 'O plano depende dos dados do formulário, das dívidas cadastradas e dos documentos enviados. Assim evitamos orientar você com base em informação incompleta.'}</p>
      <div class="cliente-kpis cliente-plan-kpis">
        <article class="cliente-kpi"><span>Renda total</span><strong>${formatMoney(diag.rendaTotal)}</strong><small>Anexo II CNJ</small></article>
        <article class="cliente-kpi"><span>Mínimo existencial</span><strong>${formatMoney(diag.minExistencial)}</strong><small>Preservação obrigatória</small></article>
        <article class="cliente-kpi"><span>Comprometimento atual</span><strong>${formatPercent(diag.comprometimentoPct)}</strong><small>Parcelas sobre renda</small></article>
      </div>
      <div class="cliente-plan-summary">
        <div>
          <span>Proposta consolidada</span>
          <strong>${proposal.prazoMeses ? `${proposal.prazoMeses} meses` : 'Aguardando capacidade segura'}</strong>
          <small>Saldo de referência: ${formatMoney(proposal.saldoNegociado)}</small>
        </div>
        <div>
          <span>Base de cálculo</span>
          <strong>CNJ + Jusfy</strong>
          <small>Planilha Guilherme operacionalizada</small>
        </div>
      </div>
      <div class="cliente-plan-scenarios">
        ${topScenarios.length ? topScenarios.map(item => `
          <article class="${item.sustentavel ? 'is-ok' : ''}">
            <strong>${formatMoney(item.parcela)}</strong>
            <span>${item.prazo} meses · desconto ${Math.round(item.desconto * 100)}%</span>
          </article>
        `).join('') : '<div class="cliente-empty">Preencha renda e dívidas para simular cenários.</div>'}
      </div>
      <div class="cliente-link-grid">
        <a href="onboarding-v2.html" data-page="onboarding-v2">Formulário CNJ</a>
        <a href="minhas-dividas.html" data-page="minhas-dividas">Dívidas</a>
        <a href="meus-documentos.html" data-page="meus-documentos">Documentos</a>
        <a href="financial-dashboard.html" data-page="financial-dashboard">Diagnóstico financeiro</a>
      </div>
    </section>
  `;
}

function renderMessagesPage(data) {
  const { nextStep, communication } = data;
  const timeline = communication.timeline.filter(event => event.visibleToClient).slice(0, 8);
  return `
    ${renderShellHeader('mensagens', nextStep)}
    <section class="cliente-card cliente-message-card">
      <h2>Comunicação com o escritório</h2>
      <p>Veja o histórico principal do seu caso e use o canal oficial para enviar uma dúvida ou observação importante.</p>
      <div class="cliente-message-kpis">
        <article><span>Eventos do caso</span><strong>${communication.visibleClientEvents}</strong></article>
        <article><span>Documentos e dívidas</span><strong>${timeline.length}</strong></article>
      </div>
      <div class="cliente-case-history">
        ${timeline.length ? timeline.map(event => `
          <article>
            <span>${escapeHtml(event.source)} · ${formatDateTime(event.createdAt)}</span>
            <strong>${escapeHtml(event.title)}</strong>
            <p>${escapeHtml(event.detail)}</p>
          </article>
        `).join('') : '<div class="cliente-empty">Seu histórico aparecerá aqui conforme o caso avançar.</div>'}
      </div>
      <div class="cliente-link-grid">
        <a href="suporte.html" data-page="suporte">Abrir atendimento</a>
        <a href="https://hmdesk.freshdesk.com/support/tickets" target="_blank" rel="noopener">Ver chamados</a>
      </div>
    </section>
  `;
}

function renderHelpPage(data) {
  const { nextStep } = data;
  const faqs = [
    ['Por onde começo?', 'Comece pelo Meu caso. O portal mostra a próxima ação mais importante para você.'],
    ['Meus documentos estão seguros?', 'Os envios usam o armazenamento do portal e ficam vinculados ao seu caso.'],
    ['Quando meu plano aparece?', 'Depois que formulário, dívidas e documentos estiverem completos para análise.'],
    ['Como falo com a equipe?', 'Use Mensagens ou Ajuda para abrir atendimento pelo canal oficial.'],
  ];
  return `
    ${renderShellHeader('ajuda', nextStep)}
    <section class="cliente-card">
      <h2>Dúvidas frequentes</h2>
      <div class="cliente-faq">
        ${faqs.map(([question, answer]) => `
          <details>
            <summary>${escapeHtml(question)}</summary>
            <p>${escapeHtml(answer)}</p>
          </details>
        `).join('')}
      </div>
      <div class="cliente-help-actions">
        <a class="btn btn-primary btn-sm" href="mensagens.html" data-page="mensagens">Falar com o escritório</a>
        <a class="btn btn-ghost btn-sm" href="meu-caso.html" data-page="meu-caso">Voltar ao meu caso</a>
      </div>
    </section>
  `;
}

async function loadClientData() {
  await CaseService.ensureExists().catch(() => {});
  const [caso, debts, docs] = await Promise.all([
    CaseService.get().catch(() => null),
    DebtService.list().catch(() => []),
    DocumentService.list().catch(() => []),
  ]);
  const docStats = getDocStats(docs);
  const debtStats = getDebtStats(debts);
  const financialPlan = financialPlanEngine.buildConsolidatedPlan(caso || {}, debts || []);
  const communication = buildCommunicationSnapshot([], {
    onboarding: caso || {},
    documents: docs || [],
    debts: debts || [],
  });
  return {
    caso,
    debts,
    docs,
    docStats,
    debtStats,
    financialPlan,
    communication,
    nextStep: getNextStep(caso, docStats, debtStats),
  };
}

export async function bootClientePage(moduleKey) {
  const host = document.querySelector('[data-cliente-module-host]');
  if (!host) return;

  host.innerHTML = '<section class="cliente-card cliente-loading">Carregando seu portal...</section>';

  try {
    const data = await loadClientData();
    const renderers = {
      'meu-caso': renderCasePage,
      'meus-documentos': renderDocumentsPage,
      'minhas-dividas': renderDebtsPage,
      'meu-plano': renderPlanPage,
      mensagens: renderMessagesPage,
      ajuda: renderHelpPage,
    };
    host.innerHTML = `<section class="cliente-page">${renderers[moduleKey]?.(data) || renderCasePage(data)}</section>`;
    window.initUiKit?.(host);
  } catch (error) {
    host.innerHTML = `
      <section class="cliente-card cliente-error">
        <h1>Não foi possível carregar agora</h1>
        <p>${escapeHtml(error?.message || 'Tente novamente em instantes.')}</p>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.location.reload()">Recarregar</button>
      </section>
    `;
  }
}

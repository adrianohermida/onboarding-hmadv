import {
  CaseService,
  DebtService,
  DocumentService,
  CustasService,
  ContratosService,
  PlanoPagamentoService,
} from '../../services/database.js';
import { financialPlanEngine } from '../financeiro/FinancialPlanEngine.js';
import { buildCommunicationSnapshot } from '../mensagens/CommunicationCenter.js';

const MODULE_COPY = {
  'meu-caso': {
    title: 'Meu caso',
    subtitle: 'Acompanhe sua jornada com clareza, sem termos complicados.',
  },
  custas: {
    title: 'Custas',
    subtitle: 'Veja despesas processuais, guias e comprovantes vinculados ao seu caso.',
  },
  'meus-documentos': {
    title: 'Documentos',
    subtitle: 'Veja o que já foi enviado e o que ainda precisa da sua atenção.',
  },
  contratos: {
    title: 'Contratos',
    subtitle: 'Acompanhe minuta, aceite, assinatura eletrônica e histórico contratual.',
  },
  'minhas-dividas': {
    title: 'Minhas dívidas',
    subtitle: 'Organize seus credores para que a equipe consiga analisar seu caso.',
  },
  'meu-plano': {
    title: 'Meu plano',
    subtitle: 'Entenda o caminho de análise até a proposta para reorganizar sua vida financeira.',
  },
  'plano-pagamento': {
    title: 'Plano de pagamento',
    subtitle: 'Consulte parcelas, cronograma e comprovantes da negociação com credores.',
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
      label: 'Completar plano financeiro',
      text: 'Use os atalhos do Meu plano para cadastrar dívidas e avançar a proposta.',
      href: 'meu-plano.html',
      action: 'Abrir meu plano',
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
        <a href="meus-documentos.html" data-page="meus-documentos">Documentos</a>
        <a href="custas.html" data-page="custas">Custas</a>
        <a href="contratos.html" data-page="contratos">Contratos</a>
        <a href="meu-plano.html" data-page="meu-plano">Meu plano</a>
        <a href="ajuda.html" data-page="ajuda">Preciso de ajuda</a>
      </div>
    </section>
    <section class="cliente-card">
      <h2>Ações rápidas</h2>
      <div class="cliente-help-actions" style="margin-top:0;">
        <button type="button" class="btn btn-ghost btn-sm" data-case-action="info-processo">Informações do processo</button>
        <button type="button" class="btn btn-ghost btn-sm" data-case-action="copia-processo">Cópia do processo</button>
        <button type="button" class="btn btn-ghost btn-sm" data-case-action="duvidas">Tenho dúvidas</button>
        <button type="button" class="btn btn-primary btn-sm" data-case-action="agendar">Agendar horário</button>
      </div>
    </section>
  `;
}

function renderCustasPage(data) {
  const { custas, nextStep } = data;
  const estimated = custas.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const pending = custas.filter(item => ['pendente', 'emitida', 'vencida'].includes(item.status)).length;
  const comprovantes = custas.filter(item => item.comprovante_url || item.comprovante_nome).length;
  const rows = custas.length
    ? custas.slice(0, 10).map(item => `
      <article class="cliente-list-item">
        <div>
          <strong>${escapeHtml(item.titulo || item.descricao || 'Custa processual')}</strong>
          <span>${escapeHtml(normalizeStatus(item.status || 'pendente'))} · ${escapeHtml(item.categoria || 'guia')}</span>
        </div>
        <small>${formatMoney(item.valor)}</small>
      </article>
    `).join('')
    : '<div class="cliente-empty">As custas aparecem aqui quando o escritório vincular guias e despesas ao seu caso.</div>';

  return `
    ${renderShellHeader('custas', nextStep)}
    <section class="cliente-kpis">
      <article class="cliente-kpi"><span>Custas estimadas</span><strong>${formatMoney(estimated)}</strong><small>base inicial de simulação</small></article>
      <article class="cliente-kpi"><span>Guias pendentes</span><strong>${pending}</strong><small>acompanhamento por processo</small></article>
      <article class="cliente-kpi"><span>Comprovantes</span><strong>${comprovantes}</strong><small>vínculos salvos no portal</small></article>
    </section>
    <section class="cliente-card">
      <div class="cliente-card-head">
        <h2>Despesas processuais</h2>
        <a class="btn btn-primary btn-sm" href="meus-documentos.html" data-page="meus-documentos">Enviar comprovante</a>
      </div>
      <div class="cliente-list">${rows}</div>
    </section>
  `;
}

function renderContractsPage(data) {
  const { contratos, docStats, nextStep } = data;
  const minutas = contratos.filter(item => ['rascunho', 'minuta', 'em_revisao'].includes(item.status)).length;
  const aguardando = contratos.filter(item => ['aguardando_aceite', 'enviado'].includes(item.status)).length;
  const assinados = contratos.filter(item => ['assinado', 'concluido'].includes(item.status)).length;
  const rows = contratos.length
    ? contratos.slice(0, 10).map(item => `
      <article class="cliente-list-item">
        <div>
          <strong>${escapeHtml(item.titulo || item.tipo || 'Contrato')}</strong>
          <span>${escapeHtml(normalizeStatus(item.status || 'rascunho'))}</span>
        </div>
        <small class="${['assinado', 'concluido'].includes(item.status) ? 'is-ok' : ''}">${formatDateTime(item.updated_at || item.created_at)}</small>
      </article>
    `).join('')
    : '<div class="cliente-empty">Workflow contratual vazio no momento.</div>';

  return `
    ${renderShellHeader('contratos', nextStep)}
    <section class="cliente-kpis">
      <article class="cliente-kpi"><span>Minutas</span><strong>${minutas}</strong><small>documentação base recebida</small></article>
      <article class="cliente-kpi"><span>Aguardando aceite</span><strong>${aguardando}</strong><small>dependente de pendências</small></article>
      <article class="cliente-kpi"><span>Assinaturas</span><strong>${assinados || (docStats.approved > 0 ? 1 : 0)}</strong><small>status contratual</small></article>
    </section>
    <section class="cliente-card">
      <h2>Workflow contratual</h2>
      <div class="cliente-steps">
        <div class="cliente-step ${minutas > 0 || docStats.sent > 0 ? 'is-done' : ''}"><span>1</span><strong>Minuta</strong></div>
        <div class="cliente-step ${aguardando === 0 && (minutas > 0 || docStats.sent > 0) ? 'is-done' : ''}"><span>2</span><strong>Aceite</strong></div>
        <div class="cliente-step ${assinados > 0 || docStats.approved > 0 ? 'is-done' : ''}"><span>3</span><strong>Assinatura</strong></div>
        <div class="cliente-step"><span>4</span><strong>Histórico</strong></div>
      </div>
      <div class="cliente-list" style="margin-top:14px;">${rows}</div>
      <div class="cliente-help-actions">
        <a class="btn btn-primary btn-sm" href="meus-documentos.html" data-page="meus-documentos">Enviar anexo contratual</a>
        <a class="btn btn-ghost btn-sm" href="financeiro.html" data-page="financeiro">Ver financeiro</a>
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
        <a href="dividas.html" data-page="dividas">Dívidas</a>
        <a href="meus-documentos.html" data-page="meus-documentos">Documentos</a>
        <a href="plano-pagamento.html" data-page="plano-pagamento">Plano de pagamento</a>
        <a href="financial-dashboard.html" data-page="financial-dashboard">Diagnóstico financeiro</a>
      </div>
    </section>
  `;
}

function renderPaymentPlanPage(data) {
  const { debtStats, financialPlan, planosPagamento, nextStep } = data;
  const proposal = financialPlan?.proposal || {};
  const currentPlan = planosPagamento[0] || null;
  const effectivePrazo = Number(currentPlan?.prazo_meses || proposal.prazoMeses || 0);
  const effectiveParcela = Number(currentPlan?.parcela_sugerida || proposal.parcelaSugerida || 0);
  const effectiveSaldo = Number(currentPlan?.valor_total || proposal.saldoNegociado || 0);
  const installments = effectivePrazo && effectiveParcela
    ? Array.from({ length: Math.min(effectivePrazo, 12) }).map((_, index) => ({
      index: index + 1,
      value: effectiveParcela,
    }))
    : [];

  return `
    ${renderShellHeader('plano-pagamento', nextStep)}
    <section class="cliente-kpis">
      <article class="cliente-kpi"><span>Saldo negociado</span><strong>${formatMoney(effectiveSaldo)}</strong><small>base consolidada</small></article>
      <article class="cliente-kpi"><span>Parcela sugerida</span><strong>${formatMoney(effectiveParcela)}</strong><small>com mínimo existencial</small></article>
      <article class="cliente-kpi"><span>Prazo estimado</span><strong>${effectivePrazo || 0} meses</strong><small>${debtStats.creditors} credores</small></article>
    </section>
    <section class="cliente-card">
      <div class="cliente-card-head">
        <h2>Cronograma de pagamento</h2>
        <a class="btn btn-ghost btn-sm" href="meu-plano.html" data-page="meu-plano">Voltar ao plano</a>
      </div>
      <div class="cliente-list">
        ${installments.length ? installments.map(item => `
          <article class="cliente-list-item">
            <div>
              <strong>Parcela ${item.index}</strong>
              <span>Cronograma proposto para negociação</span>
            </div>
            <small>${formatMoney(item.value)}</small>
          </article>
        `).join('') : '<div class="cliente-empty">Preencha renda, despesas e dívidas para gerar o plano de pagamento.</div>'}
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

// ── Meu Caso hub tab helpers ──────────────────────────────────────────────────

function renderMeoCasoProcessosTab(data) {
  const { caso } = data;
  return `
    <section class="cliente-card">
      <h2>Processos vinculados</h2>
      <p>Os processos são vinculados pela equipe jurídica conforme o caso avança no sistema.</p>
      <div class="cliente-kpis">
        <article class="cliente-kpi"><span>Fase do caso</span><strong>${escapeHtml(caso?.fase || 'Cadastro')}</strong><small>atualizado pelo escritório</small></article>
        <article class="cliente-kpi"><span>Número do processo</span><strong>${escapeHtml(caso?.numero_processo || 'A definir')}</strong><small>padrão CNJ</small></article>
      </div>
      <div class="cliente-help-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-case-action="info-processo">Informações do processo</button>
        <button type="button" class="btn btn-ghost btn-sm" data-case-action="copia-processo">Cópia do processo</button>
      </div>
    </section>
  `;
}

function renderMeoCasoDiagnosticoTab(data) {
  const { financialPlan, debtStats } = data;
  const diag = financialPlan?.diagnostico || {};
  return `
    <section class="cliente-card">
      <h2>Diagnóstico financeiro</h2>
      <p>Análise do seu perfil com base nas informações do formulário CNJ e dívidas cadastradas.</p>
      <div class="cliente-kpis">
        <article class="cliente-kpi"><span>Renda declarada</span><strong>${formatMoney(diag.rendaTotal)}</strong><small>Anexo II CNJ</small></article>
        <article class="cliente-kpi"><span>Total de dívidas</span><strong>${formatMoney(debtStats.total)}</strong><small>${debtStats.creditors} credores</small></article>
        <article class="cliente-kpi"><span>Comprometimento</span><strong>${formatPercent(diag.comprometimentoPct)}</strong><small>parcelas sobre renda</small></article>
      </div>
      <div class="cliente-help-actions">
        <a class="btn btn-primary btn-sm" href="financial-dashboard.html" data-page="financial-dashboard">Ver diagnóstico completo</a>
        <a class="btn btn-ghost btn-sm" href="onboarding-v2.html" data-page="onboarding-v2">Formulário CNJ</a>
      </div>
    </section>
  `;
}

function renderMeoCasoPrazosTab() {
  return `
    <section class="cliente-card">
      <h2>Prazos do caso</h2>
      <p>Os prazos processuais são gerenciados pela equipe jurídica e atualizados conforme o andamento.</p>
      <div class="cliente-empty">Os prazos aparecem aqui quando o escritório vincular datas ao seu processo.</div>
      <div class="cliente-help-actions" style="margin-top:14px;">
        <button type="button" class="btn btn-ghost btn-sm" data-case-action="info-processo">Consultar processo</button>
        <a class="btn btn-primary btn-sm" href="ajuda.html#mensagens" data-page="ajuda">Falar com o escritório</a>
      </div>
    </section>
  `;
}

function renderMeoCasoAndamentosTab(data) {
  const { communication } = data;
  const timeline = communication.timeline.filter(event => event.visibleToClient).slice(0, 10);
  return `
    <section class="cliente-card">
      <h2>Andamentos do caso</h2>
      <div class="cliente-case-history">
        ${timeline.length ? timeline.map(event => `
          <article>
            <span>${escapeHtml(event.source)} · ${formatDateTime(event.createdAt)}</span>
            <strong>${escapeHtml(event.title)}</strong>
            <p>${escapeHtml(event.detail)}</p>
          </article>
        `).join('') : '<div class="cliente-empty">Os andamentos aparecem aqui conforme o caso avançar.</div>'}
      </div>
    </section>
  `;
}

// ── Documentos hub tab helpers ─────────────────────────────────────────────────

function renderDocSolicitacoesTab(data) {
  const { docs, docStats } = data;
  const pending = docs.filter(doc => !doc.storage_path);
  return `
    <section class="cliente-card">
      <h2>Solicitações pendentes</h2>
      <p>Documentos que a equipe ainda aguarda para dar continuidade à análise do seu caso.</p>
      <div class="cliente-kpis">
        <article class="cliente-kpi"><span>Pendentes</span><strong>${docStats.pending}</strong><small>aguardando envio</small></article>
        <article class="cliente-kpi"><span>Em análise</span><strong>${docStats.review}</strong><small>com a equipe</small></article>
      </div>
      <div class="cliente-list">
        ${pending.length ? pending.slice(0, 8).map(item => `
          <article class="cliente-list-item">
            <div>
              <strong>${escapeHtml(item.nome || item.tipo || 'Documento')}</strong>
              <span>${escapeHtml(normalizeStatus(item.workflow_status || item.status || 'pendente'))}</span>
            </div>
          </article>
        `).join('') : '<div class="cliente-empty">Nenhuma solicitação pendente no momento.</div>'}
      </div>
      <div class="cliente-help-actions">
        <a class="btn btn-primary btn-sm" href="documentos.html" data-page="documentos">Enviar documento</a>
      </div>
    </section>
  `;
}

function renderDocAssinaturasTab(data) {
  const { contratos, docStats } = data;
  const assinados = contratos.filter(item => ['assinado', 'concluido'].includes(item.status));
  const aguardando = contratos.filter(item => ['aguardando_aceite', 'enviado'].includes(item.status));
  return `
    <section class="cliente-card">
      <h2>Assinaturas</h2>
      <p>Documentos e contratos que requerem ou já receberam assinatura eletrônica.</p>
      <div class="cliente-kpis">
        <article class="cliente-kpi"><span>Assinados</span><strong>${assinados.length || docStats.approved}</strong><small>concluídos</small></article>
        <article class="cliente-kpi"><span>Aguardando</span><strong>${aguardando.length}</strong><small>assinatura pendente</small></article>
      </div>
      <div class="cliente-list">
        ${aguardando.length ? aguardando.map(item => `
          <article class="cliente-list-item">
            <div>
              <strong>${escapeHtml(item.titulo || item.tipo || 'Contrato')}</strong>
              <span>${escapeHtml(normalizeStatus(item.status))}</span>
            </div>
          </article>
        `).join('') : '<div class="cliente-empty">Nenhuma assinatura pendente.</div>'}
      </div>
      <div class="cliente-help-actions">
        <a class="btn btn-ghost btn-sm" href="financeiro.html#contratos" data-page="financeiro">Ver contratos</a>
      </div>
    </section>
  `;
}

function renderDocEstanteTab(data) {
  const { docs, docStats } = data;
  const approved = docs.filter(doc => ['aprovado', 'assinado'].includes(doc.workflow_status || doc.status));
  return `
    <section class="cliente-card">
      <h2>Estante Digital</h2>
      <p>Documentos aprovados e finalizados guardados com segurança no portal.</p>
      <div class="cliente-kpis">
        <article class="cliente-kpi"><span>Aprovados</span><strong>${docStats.approved}</strong><small>na estante digital</small></article>
        <article class="cliente-kpi"><span>Enviados</span><strong>${docStats.sent}</strong><small>no total</small></article>
      </div>
      <div class="cliente-list">
        ${approved.length ? approved.map(doc => `
          <article class="cliente-list-item">
            <div>
              <strong>${escapeHtml(doc.nome || doc.tipo || 'Documento')}</strong>
              <span>${escapeHtml(normalizeStatus(doc.workflow_status || doc.status))}</span>
            </div>
          </article>
        `).join('') : '<div class="cliente-empty">Os documentos aprovados aparecerão aqui.</div>'}
      </div>
    </section>
  `;
}

// ── Hub navigation ────────────────────────────────────────────────────────────

const HUB_TABS = {
  // Legacy hub keys — kept for backward compat
  'meu-caso': [
    { key: 'visao-geral',   label: 'Visão Geral' },
    { key: 'processos',     label: 'Processos' },
    { key: 'plano',         label: 'Plano' },
    { key: 'diagnostico',   label: 'Diagnóstico' },
    { key: 'dividas',       label: 'Dívidas' },
    { key: 'prazos',        label: 'Prazos' },
    { key: 'andamentos',    label: 'Andamentos' },
  ],
  financeiro: [
    { key: 'contratos',      label: 'Contratos' },
    { key: 'custas',         label: 'Custas' },
    { key: 'parcelas',       label: 'Plano de Pagamento' },
    { key: 'dividas',        label: 'Dívidas' },
  ],
  ajuda: [
    { key: 'mensagens',      label: 'Mensagens' },
    { key: 'suporte',        label: 'Suporte' },
    { key: 'ajuda',          label: 'Ajuda' },
    { key: 'jornada',        label: 'Jornada' },
  ],

  // Sprint 5 — new sidebar hubs
  'meus-casos': [
    { key: 'visao-geral',   label: 'Visão Geral' },
    { key: 'processos',     label: 'Processos' },
    { key: 'plano',         label: 'Plano' },
    { key: 'diagnostico',   label: 'Diagnóstico' },
    { key: 'dividas',       label: 'Dívidas' },
    { key: 'prazos',        label: 'Prazos' },
    { key: 'andamentos',    label: 'Andamentos' },
  ],
  'meus-processos': [
    { key: 'lista',         label: 'Processos' },
    { key: 'prazos',        label: 'Prazos' },
    { key: 'andamentos',    label: 'Andamentos' },
  ],
  honorarios: [
    { key: 'contratos',     label: 'Contratos' },
    { key: 'custas',        label: 'Custas' },
    { key: 'parcelas',      label: 'Plano de Pagamento' },
    { key: 'dividas',       label: 'Dívidas' },
  ],
  'meus-documentos': [
    { key: 'lista',         label: 'Meus Documentos' },
    { key: 'solicitacoes',  label: 'Solicitações' },
    { key: 'assinaturas',   label: 'Assinaturas' },
    { key: 'estante',       label: 'Estante Digital' },
  ],
  atendimento: [
    { key: 'mensagens',     label: 'Mensagens' },
    { key: 'suporte',       label: 'Suporte' },
    { key: 'ajuda',         label: 'Ajuda' },
    { key: 'jornada',       label: 'Jornada' },
  ],
  marketplace: [
    { key: 'catalogo',     label: 'Catálogo' },
    { key: 'solicitacoes', label: 'Minhas Solicitações' },
  ],
};

function getActiveHubTab(hubKey) {
  const tabs = HUB_TABS[hubKey];
  if (!tabs) return null;
  const hash = (window.location.hash || '').replace('#', '');
  return tabs.find(t => t.key === hash) ? hash : tabs[0].key;
}

function renderHubNav(hubKey, activeTab) {
  const tabs = HUB_TABS[hubKey];
  if (!tabs) return '';
  return `
    <nav class="hub-tabs" aria-label="Abas do hub">
      ${tabs.map(t => `
        <a class="hub-tab${t.key === activeTab ? ' is-active' : ''}"
           href="#${t.key}" data-hub-tab="${t.key}">${escapeHtml(t.label)}</a>
      `).join('')}
    </nav>
  `;
}

function renderFinancialHubContent(tabKey, data) {
  switch (tabKey) {
    case 'custas':        return renderCustasPage(data);
    case 'parcelas':      return renderPaymentPlanPage(data);
    case 'dividas':       return renderDebtsPage(data);
    default:              return renderContractsPage(data);
  }
}

function renderAtendimentoHubContent(tabKey, data) {
  switch (tabKey) {
    case 'suporte':
      return `
        <section class="cliente-card">
          <h2>Canais de Atendimento</h2>
          <p>Abra um chamado ou acompanhe as solicitações em andamento com o escritório.</p>
          <div class="cliente-help-actions">
            <a class="btn btn-primary btn-sm" href="suporte.html" data-page="suporte">Abrir suporte completo</a>
            <a class="btn btn-ghost btn-sm" href="https://hmdesk.freshdesk.com/support/tickets" target="_blank" rel="noopener">Ver chamados externos</a>
          </div>
        </section>
      `;
    case 'ajuda':
      return renderHelpPage(data);
    case 'jornada':
      return `
        <section class="cliente-card">
          <h2>Sua Jornada</h2>
          <p>Acompanhe os passos do processo de superendividamento e preencha as etapas do formulário CNJ.</p>
          <div class="cliente-help-actions">
            <a class="btn btn-primary btn-sm" href="onboarding-v2.html" data-page="onboarding-v2">Abrir jornada CNJ</a>
            <a class="btn btn-ghost btn-sm" href="financial-dashboard.html" data-page="financial-dashboard">Diagnóstico financeiro</a>
          </div>
        </section>
      `;
    default:
      return renderMessagesPage(data);
  }
}

function renderMeoCasoHubContent(tabKey, data) {
  switch (tabKey) {
    case 'processos':   return renderMeoCasoProcessosTab(data);
    case 'plano':       return renderPlanPage(data);
    case 'diagnostico': return renderMeoCasoDiagnosticoTab(data);
    case 'dividas':     return renderDebtsPage(data);
    case 'prazos':      return renderMeoCasoPrazosTab(data);
    case 'andamentos':  return renderMeoCasoAndamentosTab(data);
    default:            return renderCasePage(data);
  }
}

function renderDocumentosHubContent(tabKey, data) {
  switch (tabKey) {
    case 'solicitacoes': return renderDocSolicitacoesTab(data);
    case 'assinaturas':  return renderDocAssinaturasTab(data);
    case 'estante':      return renderDocEstanteTab(data);
    default:             return renderDocumentsPage(data);
  }
}

async function loadClientData() {
  await CaseService.ensureExists().catch(() => {});
  const [caso, debts, docs, custas, contratos, planosPagamento] = await Promise.all([
    CaseService.get().catch(() => null),
    DebtService.list().catch(() => []),
    DocumentService.list().catch(() => []),
    CustasService.list().catch(() => []),
    ContratosService.list().catch(() => []),
    PlanoPagamentoService.list().catch(() => []),
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
    custas,
    contratos,
    planosPagamento,
    docStats,
    debtStats,
    financialPlan,
    communication,
    nextStep: getNextStep(caso, docStats, debtStats),
  };
}

function dispatchShellContext(caso, nextStep) {
  const faseRaw = caso?.fase || 'Cadastro';
  const faseLabel = String(faseRaw).replace(/_/g, ' ');
  const statusTone = !caso?.onboarding_done ? 'muted'
    : ['concluido', 'encerrado'].includes(faseRaw) ? 'ok'
    : ['suspenso', 'arquivado'].includes(faseRaw) ? 'danger'
    : 'brand';
  const meta = [];
  if (caso?.numero_processo) meta.push(`Proc. ${caso.numero_processo}`);

  document.dispatchEvent(new CustomEvent('shell:set-context', {
    detail: {
      entityLabel: 'Caso',
      title: caso?.full_name || 'Meu caso',
      status: faseLabel,
      statusTone,
      meta,
      nextAction: nextStep?.href ? { label: nextStep.label, href: nextStep.href } : null,
    },
  }));
}

function mountHubTabListeners(host, hubKey, data, renderContent) {
  host.querySelectorAll('[data-hub-tab]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabKey = link.dataset.hubTab;
      window.history.replaceState(null, '', `#${tabKey}`);
      host.querySelectorAll('.hub-tab').forEach(a => a.classList.toggle('is-active', a.dataset.hubTab === tabKey));
      const contentEl = host.querySelector('.hub-tab-content');
      if (contentEl) {
        contentEl.innerHTML = renderContent(tabKey, data);
        window.initUiKit?.(contentEl);
      }
    });
  });
}

function mountCaseActionListeners(host) {
  host.addEventListener('click', (e) => {
    const button = e.target.closest('[data-case-action]');
    if (!button) return;
    const action = button.dataset.caseAction;
    if (action === 'duvidas') {
      window.location.href = 'suporte.html';
      return;
    }
    if (action === 'agendar') {
      window.shellModal?.open?.({
        title: 'Agendar horário',
        body: `
          <div class="cliente-card" style="margin:0;">
            <p>Escolha o melhor canal para agendamento com a equipe.</p>
            <div class="cliente-help-actions" style="margin-top:14px;">
              <a class="btn btn-primary btn-sm" href="suporte.html" data-page="suporte">Solicitar por suporte</a>
              <a class="btn btn-ghost btn-sm" href="ajuda.html#mensagens" data-page="ajuda">Enviar mensagem</a>
            </div>
          </div>
        `,
      });
      return;
    }
    const modalContent = action === 'copia-processo'
      ? {
        title: 'Cópia do processo',
        body: 'Solicitação registrada. A equipe enviará a cópia no canal de mensagens e notificará no suporte.',
      }
      : {
        title: 'Informações do processo',
        body: 'O andamento detalhado está em atualização contínua. Consulte também as mensagens e documentos para últimos movimentos.',
      };
    window.shellModal?.open?.({ title: modalContent.title, body: `<div class="cliente-card" style="margin:0;"><p>${modalContent.body}</p></div>` });
  });
}

// ── Sprint 5 render functions ─────────────────────────────────────────────────

function renderMeusProcessosHubContent(tabKey, data) {
  switch (tabKey) {
    case 'prazos':     return renderMeoCasoPrazosTab(data);
    case 'andamentos': return renderMeoCasoAndamentosTab(data);
    default:           return renderMeoCasoProcessosTab(data);
  }
}

function renderVisaoGeralPage(data) {
  const { caso, docStats, debtStats, nextStep, contratos } = data;
  const faseLabel = caso?.fase ? String(caso.fase).replace(/_/g, ' ') : 'Cadastro';
  const steps = [
    ['Dados iniciais', !!caso?.onboarding_done],
    ['Dívidas cadastradas', debtStats.creditors > 0],
    ['Documentos enviados', docStats.pending === 0],
    ['Em análise pela equipe', !!caso?.onboarding_done && debtStats.creditors > 0],
  ];
  const quickLinks = [
    { key: 'meus-casos',     label: 'Meus Casos',   desc: 'Detalhes e jornada do caso' },
    { key: 'meus-processos', label: 'Processos',    desc: escapeHtml(caso?.numero_processo || 'A definir') },
    { key: 'honorarios',     label: 'Honorários',   desc: `${contratos.length} contrato(s)` },
    { key: 'meus-documentos', label: 'Documentos',  desc: `${docStats.approved}/${docStats.total} aprovados` },
    { key: 'atendimento',    label: 'Atendimento',  desc: 'Mensagens e suporte' },
    { key: 'marketplace',    label: 'Marketplace',  desc: 'Serviços jurídicos' },
  ];
  return `
    <section class="cliente-page">
      <div class="page-header">
        <h1>Visão Geral</h1>
        <p>Resumo do seu caso e próximas ações.</p>
      </div>
      ${nextStep ? `
        <div class="vg-next-action">
          <div class="vg-next-label">
            <strong>${escapeHtml(nextStep.label)}</strong>
            <p>${escapeHtml(nextStep.text)}</p>
          </div>
          <a href="${escapeHtml(nextStep.href)}" data-page="${escapeHtml(nextStep.href.replace('.html', ''))}" class="btn btn-primary btn-sm">${escapeHtml(nextStep.action || 'Ver')}</a>
        </div>
      ` : ''}
      <div class="vg-status-strip">
        <div class="vg-status-item"><span>Fase do caso</span><strong>${escapeHtml(faseLabel)}</strong></div>
        <div class="vg-status-item"><span>Documentos</span><strong>${docStats.approved}/${docStats.total}</strong></div>
        <div class="vg-status-item"><span>Credores</span><strong>${debtStats.creditors}</strong></div>
        <div class="vg-status-item"><span>Contratos</span><strong>${contratos.length}</strong></div>
      </div>
      <div class="vg-journey">
        <div class="vg-journey-title">Sua jornada</div>
        <div class="vg-journey-list">
          ${steps.map(([label, done]) => `
            <div class="vg-journey-item ${done ? 'is-done' : ''}">
              <span class="vg-journey-dot" aria-hidden="true"></span>
              <span>${escapeHtml(label)}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="vg-nav-grid">
        ${quickLinks.map(link => `
          <a href="${escapeHtml(link.key)}.html" data-page="${escapeHtml(link.key)}" class="vg-nav-card">
            <strong>${escapeHtml(link.label)}</strong>
            <small>${escapeHtml(link.desc)}</small>
          </a>
        `).join('')}
      </div>
    </section>
  `;
}

// ── MARKETPLACE ──────────────────────────────────────────────────────────────

const MKT_ORDERS_KEY = 'hm_mkt_orders';

const MKT_CATEGORIES = [
  {
    key: 'busca',
    label: 'Busca & Investigação',
    services: [
      { id: 'diligencias',          label: 'Diligências',          desc: 'Busca de informações e documentos', time: '3–5 dias' },
      { id: 'pesquisa-patrimonial', label: 'Pesquisa Patrimonial', desc: 'Localização de bens e ativos',      time: '5–7 dias' },
    ],
  },
  {
    key: 'representacao',
    label: 'Representação',
    services: [
      { id: 'correspondentes', label: 'Correspondentes', desc: 'Representação em outras comarcas',    time: '2–5 dias' },
      { id: 'audiencias',      label: 'Audiências',      desc: 'Representação em audiências remotas', time: '1–3 dias' },
    ],
  },
  {
    key: 'documentos',
    label: 'Documentos & Cartório',
    services: [
      { id: 'certidoes',  label: 'Certidões',  desc: 'Certidões negativas e judiciais',   time: '2–5 dias' },
      { id: 'protocolos', label: 'Protocolos', desc: 'Petições e documentos em cartório', time: '1–2 dias' },
    ],
  },
  {
    key: 'consultoria',
    label: 'Consultoria & Cálculos',
    services: [
      { id: 'calculos',      label: 'Cálculos Jurídicos', desc: 'Atualização de débitos e liquidação',  time: '2–3 dias' },
      { id: 'pareceres',     label: 'Pareceres',          desc: 'Consulta jurídica especializada',     time: '3–5 dias' },
      { id: 'pericias',      label: 'Perícias',           desc: 'Laudos técnicos e periciais',         time: '5–10 dias' },
    ],
  },
];

const MKT_URGENCY = {
  normal:  { label: 'Normal',  time: '5–7 dias úteis' },
  alta:    { label: 'Alta',    time: '2–3 dias úteis' },
  urgente: { label: 'Urgente', time: '24h úteis'      },
};

const MKT_STATUS = {
  enviada:    { label: 'Enviada',     tone: 'brand' },
  em_analise: { label: 'Em análise',  tone: 'warn'  },
  concluida:  { label: 'Concluída',   tone: 'ok'    },
  cancelada:  { label: 'Cancelada',   tone: 'muted' },
};

function getMktOrders() {
  try { return JSON.parse(localStorage.getItem(MKT_ORDERS_KEY) || '[]'); } catch { return []; }
}

function saveMktOrder(serviceId, serviceLabel, desc, urgency) {
  const orders = getMktOrders();
  orders.unshift({ id: Date.now(), serviceId, serviceLabel, desc, urgency, status: 'enviada', createdAt: new Date().toISOString() });
  localStorage.setItem(MKT_ORDERS_KEY, JSON.stringify(orders.slice(0, 30)));
}

function mktFmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }); } catch { return '—'; }
}

function renderMarketplaceCatalogTab() {
  const activeCount = getMktOrders().filter(o => o.status === 'enviada' || o.status === 'em_analise').length;
  return `
    ${activeCount > 0 ? `
      <div class="mkt-orders-banner">
        <span>Você tem <strong>${activeCount}</strong> solicitação(ões) em andamento.</span>
        <button type="button" class="btn btn-ghost btn-sm" data-goto-tab="solicitacoes">Ver →</button>
      </div>
    ` : ''}
    <div class="mkt-categories">
      ${MKT_CATEGORIES.map(cat => `
        <div class="mkt-category">
          <h3 class="mkt-category-label">${escapeHtml(cat.label)}</h3>
          <div class="mkt-service-grid">
            ${cat.services.map(s => `
              <button type="button"
                class="marketplace-card mkt-service-card"
                data-service="${escapeHtml(s.id)}"
                data-service-label="${escapeHtml(s.label)}">
                <strong>${escapeHtml(s.label)}</strong>
                <small>${escapeHtml(s.desc)}</small>
                <div class="mkt-card-footer">
                  <span class="mkt-time-badge">${escapeHtml(s.time)}</span>
                  <span class="marketplace-cta">Solicitar →</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderMarketplaceSolicitacoesTab() {
  const orders = getMktOrders();
  if (!orders.length) {
    return `
      <div class="mkt-empty">
        <p>Nenhuma solicitação enviada ainda.</p>
        <button type="button" class="btn btn-ghost btn-sm" data-goto-tab="catalogo">Ver catálogo de serviços</button>
      </div>
    `;
  }
  return `
    <div class="mkt-orders-list">
      ${orders.map(o => {
        const st  = MKT_STATUS[o.status]  || MKT_STATUS.enviada;
        const urg = MKT_URGENCY[o.urgency] || MKT_URGENCY.normal;
        return `
          <div class="mkt-order-row">
            <div class="mkt-order-body">
              <strong>${escapeHtml(o.serviceLabel)}</strong>
              ${o.desc ? `<span class="mkt-order-desc">${escapeHtml(o.desc.slice(0, 90))}${o.desc.length > 90 ? '…' : ''}</span>` : ''}
              <span class="mkt-order-meta">${mktFmtDate(o.createdAt)} · ${escapeHtml(urg.label)}</span>
            </div>
            <span class="painel-chip painel-chip--${escapeHtml(st.tone)}">${escapeHtml(st.label)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderMarketplaceHubContent(tabKey) {
  switch (tabKey) {
    case 'solicitacoes': return renderMarketplaceSolicitacoesTab();
    default:             return renderMarketplaceCatalogTab();
  }
}

function openMktRequestModal(serviceId, serviceLabel, host) {
  const urgencyOpts = Object.entries(MKT_URGENCY)
    .map(([k, v]) => `<option value="${escapeHtml(k)}">${escapeHtml(v.label)} — ${escapeHtml(v.time)}</option>`)
    .join('');
  window.shellModal?.open?.({
    title: `Solicitar — ${escapeHtml(serviceLabel)}`,
    body: `
      <form id="mkt-req-form">
        <div class="form-field">
          <label class="form-label">Serviço</label>
          <input type="text" value="${escapeHtml(serviceLabel)}" readonly class="form-input" style="background:var(--line2);color:var(--muted)">
        </div>
        <div class="form-field" style="margin-top:12px">
          <label class="form-label" for="mkt-desc">Descreva sua necessidade</label>
          <textarea id="mkt-desc" class="form-input"
            placeholder="Descreva o que precisa, prazo desejado, processo vinculado..."
            style="resize:vertical;min-height:90px" rows="4"></textarea>
        </div>
        <div class="form-field" style="margin-top:12px">
          <label class="form-label" for="mkt-urgency">Urgência</label>
          <select id="mkt-urgency" class="form-input">${urgencyOpts}</select>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:16px">Enviar solicitação</button>
      </form>
    `,
  });
  const form = document.getElementById('mkt-req-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const desc    = document.getElementById('mkt-desc')?.value?.trim() || '';
    const urgency = document.getElementById('mkt-urgency')?.value || 'normal';
    saveMktOrder(serviceId, serviceLabel, desc, urgency);
    form.innerHTML = `
      <div class="mkt-success">
        <svg viewBox="0 0 24 24" fill="none" width="40" height="40"><circle cx="12" cy="12" r="10" stroke="var(--ok)" stroke-width="1.5"/><path d="M8 12l3 3 5-5" stroke="var(--ok)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p>Solicitação enviada!</p>
        <small>A equipe entrará em contato pelo canal de mensagens.</small>
      </div>
    `;
    setTimeout(() => {
      window.shellModal?.close?.();
      const content = host.querySelector('.hub-tab-content');
      if (content) content.innerHTML = renderMarketplaceHubContent(getActiveHubTab('marketplace'));
    }, 2000);
  });
}

function initMarketplace(host) {
  host.addEventListener('click', e => {
    const card = e.target.closest('[data-service]');
    if (card) {
      openMktRequestModal(card.dataset.service, card.dataset.serviceLabel || card.dataset.service, host);
      return;
    }
    const gotoBtn = e.target.closest('[data-goto-tab]');
    if (gotoBtn) {
      e.preventDefault();
      const tabKey = gotoBtn.dataset.gotoTab;
      host.querySelector(`.hub-tab[data-hub-tab="${tabKey}"]`)?.click();
    }
  });
}

function renderConfiguracoesPage() {
  const sections = [
    { title: 'Perfil',         desc: 'Atualize seus dados pessoais e informações de contato.',     action: 'open-account-modal', view: 'perfil',       label: 'Editar perfil' },
    { title: 'Conta',          desc: 'Configurações de acesso, senha e segurança.',                action: 'open-account-modal', view: 'conta',        label: 'Gerenciar conta' },
    { title: 'Preferências',   desc: 'Controle como e quando você recebe atualizações do portal.', action: 'open-account-modal', view: 'preferencias',  label: 'Preferências' },
    { title: 'Permissões',     desc: 'Visualize suas permissões e nível de acesso.',               action: 'open-account-modal', view: 'permissoes',   label: 'Ver permissões' },
  ];
  return `
    <section class="cliente-page">
      <div class="page-header">
        <h1>Configurações</h1>
        <p>Gerencie sua conta, notificações e preferências do portal.</p>
      </div>
      <div class="config-sections">
        ${sections.map(s => `
          <section class="config-section">
            <h2>${escapeHtml(s.title)}</h2>
            <p>${escapeHtml(s.desc)}</p>
            <button type="button" class="btn btn-ghost btn-sm" data-shell-action="${escapeHtml(s.action)}" data-account-view="${escapeHtml(s.view)}">${escapeHtml(s.label)}</button>
          </section>
        `).join('')}
      </div>
    </section>
  `;
}

export async function bootClientePage(moduleKey) {
  const host = document.querySelector('[data-cliente-module-host]');
  if (!host) return;

  host.innerHTML = '<section class="cliente-card cliente-loading">Carregando seu portal...</section>';

  try {
    const data = await loadClientData();
    dispatchShellContext(data.caso, data.nextStep);

    if (moduleKey === 'meu-caso') {
      const activeTab = getActiveHubTab('meu-caso');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Meu Caso</h1>
            <p>Acompanhe sua jornada com clareza, sem termos complicados.</p>
          </div>
          ${renderHubNav('meu-caso', activeTab)}
          <div class="hub-tab-content">${renderMeoCasoHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountCaseActionListeners(host);
      mountHubTabListeners(host, 'meu-caso', data, renderMeoCasoHubContent);
      return;
    }

    if (moduleKey === 'meus-documentos') {
      const activeTab = getActiveHubTab('meus-documentos');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Documentos</h1>
            <p>Veja o que já foi enviado e o que ainda precisa da sua atenção.</p>
          </div>
          ${renderHubNav('meus-documentos', activeTab)}
          <div class="hub-tab-content">${renderDocumentosHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountHubTabListeners(host, 'meus-documentos', data, renderDocumentosHubContent);
      return;
    }

    if (moduleKey === 'financeiro') {
      const activeTab = getActiveHubTab('financeiro');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Financeiro</h1>
            <p>Contratos, custas, parcelas e dívidas do seu caso.</p>
          </div>
          ${renderHubNav('financeiro', activeTab)}
          <div class="hub-tab-content">${renderFinancialHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountHubTabListeners(host, 'financeiro', data, renderFinancialHubContent);
      return;
    }

    if (moduleKey === 'ajuda') {
      const activeTab = getActiveHubTab('ajuda');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Atendimento</h1>
            <p>Mensagens, suporte e jornada do seu caso.</p>
          </div>
          ${renderHubNav('ajuda', activeTab)}
          <div class="hub-tab-content">${renderAtendimentoHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountHubTabListeners(host, 'ajuda', data, renderAtendimentoHubContent);
      return;
    }

    // ── Sprint 5 — new sidebar hubs ───────────────────────────────────────

    if (moduleKey === 'visao-geral') {
      host.innerHTML = renderVisaoGeralPage(data);
      window.initUiKit?.(host);
      return;
    }

    if (moduleKey === 'meus-casos') {
      const activeTab = getActiveHubTab('meus-casos');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Meus Casos</h1>
            <p>Acompanhe sua jornada com clareza, sem termos complicados.</p>
          </div>
          ${renderHubNav('meus-casos', activeTab)}
          <div class="hub-tab-content">${renderMeoCasoHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountCaseActionListeners(host);
      mountHubTabListeners(host, 'meus-casos', data, renderMeoCasoHubContent);
      return;
    }

    if (moduleKey === 'meus-processos') {
      const activeTab = getActiveHubTab('meus-processos');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Processos</h1>
            <p>Acompanhe os processos judiciais vinculados ao seu caso.</p>
          </div>
          ${renderHubNav('meus-processos', activeTab)}
          <div class="hub-tab-content">${renderMeusProcessosHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountHubTabListeners(host, 'meus-processos', data, renderMeusProcessosHubContent);
      return;
    }

    if (moduleKey === 'honorarios') {
      const activeTab = getActiveHubTab('honorarios');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Honorários</h1>
            <p>Contratos, custas, parcelas e dívidas do seu caso.</p>
          </div>
          ${renderHubNav('honorarios', activeTab)}
          <div class="hub-tab-content">${renderFinancialHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountHubTabListeners(host, 'honorarios', data, renderFinancialHubContent);
      return;
    }

    if (moduleKey === 'atendimento') {
      const activeTab = getActiveHubTab('atendimento');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Atendimento</h1>
            <p>Mensagens, suporte e jornada do seu caso.</p>
          </div>
          ${renderHubNav('atendimento', activeTab)}
          <div class="hub-tab-content">${renderAtendimentoHubContent(activeTab, data)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountHubTabListeners(host, 'atendimento', data, renderAtendimentoHubContent);
      return;
    }

    if (moduleKey === 'marketplace') {
      const activeTab = getActiveHubTab('marketplace');
      host.innerHTML = `
        <section class="cliente-page">
          <div class="page-header">
            <h1>Marketplace Jurídico</h1>
            <p>Solicite serviços complementares ao seu caso.</p>
          </div>
          ${renderHubNav('marketplace', activeTab)}
          <div class="hub-tab-content">${renderMarketplaceHubContent(activeTab)}</div>
        </section>
      `;
      window.initUiKit?.(host);
      mountHubTabListeners(host, 'marketplace', null, renderMarketplaceHubContent);
      initMarketplace(host);
      return;
    }

    if (moduleKey === 'configuracoes') {
      host.innerHTML = renderConfiguracoesPage();
      window.initUiKit?.(host);
      return;
    }

    const renderers = {
      custas: renderCustasPage,
      'minhas-dividas': renderDebtsPage,
      contratos: renderContractsPage,
      'meu-plano': renderPlanPage,
      'plano-pagamento': renderPaymentPlanPage,
      mensagens: renderMessagesPage,
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

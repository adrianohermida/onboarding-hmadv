import type { Meta, StoryObj } from '@storybook/html';

const meta = {
  title: 'App/Ui Kit',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => `
    <div class="btn-group" aria-label="Ações do caso">
      <button class="btn btn-primary">Salvar</button>
      <button class="btn btn-blue">Atualizar</button>
      <button class="btn btn-outline">Ver detalhes</button>
      <button class="btn btn-ghost">Cancelar</button>
      <button class="btn btn-danger">Excluir</button>
    </div>
  `,
};

export const FormFields: Story = {
  render: () => `
    <form class="sec" style="max-width: 760px; display:grid; gap: 16px;">
      <div class="field">
        <label for="client-name">Nome do cliente</label>
        <input id="client-name" class="ui-input" type="text" placeholder="Digite o nome" value="Maria Santos" />
      </div>
      <div class="field">
        <label for="case-status">Status</label>
        <select id="case-status" class="ui-select">
          <option selected>Em análise</option>
          <option>Documentos pendentes</option>
          <option>Proposta enviada</option>
        </select>
      </div>
      <div class="field">
        <label for="case-note">Observação</label>
        <textarea id="case-note" class="ui-textarea" rows="4">Cliente confirmou envio de novos comprovantes.</textarea>
      </div>
    </form>
  `,
};

export const Modal: Story = {
  render: () => `
    <div style="min-height: 420px; position: relative;">
      <div class="ui-modal is-open" aria-hidden="false">
        <div class="ui-modal-panel">
          <div class="ui-modal-header">
            <strong>Revisar proposta</strong>
            <button class="ui-btn ui-btn-ghost ui-btn-sm" data-ui-modal-close aria-label="Fechar">Fechar</button>
          </div>
          <div class="ui-modal-body" style="display:grid; gap: 12px;">
            <p>Confirme os dados da proposta antes de enviar para o cliente.</p>
            <div class="ui-card ui-card-highlight">
              <div class="ui-card-header"><h3 class="ui-card-title">Resumo</h3></div>
              <div class="ui-card-body">Valor total, prazo e condições comerciais.</div>
            </div>
          </div>
          <div class="ui-modal-footer">
            <button class="ui-btn ui-btn-outline">Cancelar</button>
            <button class="ui-btn ui-btn-primary">Enviar</button>
          </div>
        </div>
      </div>
    </div>
  `,
};

export const Drawer: Story = {
  render: () => `
    <div style="min-height: 420px; position: relative;">
      <div class="ui-drawer is-open" aria-hidden="false">
        <aside class="ui-drawer-panel">
          <div class="ui-drawer-header">
            <strong>Filtros rápidos</strong>
            <button class="ui-btn ui-btn-ghost ui-btn-sm" data-ui-drawer-close aria-label="Fechar">Fechar</button>
          </div>
          <div class="ui-drawer-body" style="display:grid; gap: 12px;">
            <label class="field" style="display:grid; gap: 6px;">
              <span>Pesquisar</span>
              <input class="ui-input" type="search" placeholder="Nome, processo ou assunto" />
            </label>
            <label class="field" style="display:grid; gap: 6px;">
              <span>Responsável</span>
              <select class="ui-select">
                <option>Todos</option>
                <option>Advogado</option>
                <option>Financeiro</option>
              </select>
            </label>
          </div>
          <div class="ui-drawer-footer">
            <button class="ui-btn ui-btn-ghost">Limpar</button>
            <button class="ui-btn ui-btn-primary">Aplicar</button>
          </div>
        </aside>
      </div>
    </div>
  `,
};

export const TabsAndDropdown: Story = {
  render: () => `
    <div style="display:grid; gap: 20px; max-width: 760px;">
      <section class="ui-tabs" data-ui-tabs>
        <div role="tablist" aria-label="Seções do caso" style="display:flex; gap: 8px; flex-wrap: wrap;">
          <button role="tab" aria-selected="true" aria-controls="panel-1" class="ui-btn ui-btn-secondary">Resumo</button>
          <button role="tab" aria-selected="false" aria-controls="panel-2" class="ui-btn ui-btn-secondary">Histórico</button>
          <button role="tab" aria-selected="false" aria-controls="panel-3" class="ui-btn ui-btn-secondary">Tarefas</button>
        </div>
        <div id="panel-1" role="tabpanel">
          <div class="ui-card">
            <div class="ui-card-header"><h3 class="ui-card-title">Resumo do caso</h3></div>
            <div class="ui-card-body">Visão consolidada do andamento, pendências e próximos passos.</div>
          </div>
        </div>
        <div id="panel-2" role="tabpanel" hidden>
          <div class="ui-card">
            <div class="ui-card-header"><h3 class="ui-card-title">Histórico</h3></div>
            <div class="ui-card-body">Eventos recentes, interações com o cliente e auditoria.</div>
          </div>
        </div>
        <div id="panel-3" role="tabpanel" hidden>
          <div class="ui-card">
            <div class="ui-card-header"><h3 class="ui-card-title">Tarefas</h3></div>
            <div class="ui-card-body">Checklist operacional e pendências com SLA.</div>
          </div>
        </div>
      </section>

      <div class="ui-dropdown is-open" data-ui-dropdown>
        <button class="ui-btn ui-btn-outline ui-dropdown-trigger">Mais ações</button>
        <div class="ui-dropdown-menu" role="menu">
          <button class="ui-dropdown-item" role="menuitem">Editar cadastro</button>
          <button class="ui-dropdown-item" role="menuitem">Abrir auditoria</button>
          <button class="ui-dropdown-item" role="menuitem">Gerar relatório</button>
        </div>
      </div>
    </div>
  `,
};

export const UploadAndToast: Story = {
  render: () => `
    <div style="display:grid; gap: 16px; max-width: 560px; position: relative; min-height: 220px;">
      <div class="ui-upload ui-document-upload" data-ui-upload>
        <div class="ui-upload-title">Enviar documentos</div>
        <div class="ui-upload-hint">Arraste arquivos aqui ou clique para selecionar PDFs e imagens.</div>
        <button class="ui-btn ui-btn-primary ui-btn-sm">Selecionar arquivos</button>
      </div>

      <div class="ui-toast" style="position: static; width: 100%;">
        <div class="ui-toast-item">Upload concluído com sucesso.</div>
        <div class="ui-toast-item">2 arquivos aguardando validação.</div>
      </div>
    </div>
  `,
};

export const BadgesAndStats: Story = {
  render: () => `
    <div style="display:grid; gap: 16px; max-width: 900px;">
      <div style="display:flex; flex-wrap:wrap; gap: 8px;">
        <span class="ui-badge">Padrão</span>
        <span class="ui-badge ui-badge-ok">Concluído</span>
        <span class="ui-badge ui-badge-warn">Atenção</span>
        <span class="ui-badge ui-badge-danger">Bloqueado</span>
        <span class="ui-badge ui-badge-brand">Admin</span>
        <span class="ui-badge ui-badge-accent">Prioritário</span>
        <span class="ui-badge ui-badge-info">Informativo</span>
        <span class="ui-badge ui-badge-secret">Sigiloso</span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px;">
        <article class="ui-stat-card">
          <div class="ui-stat-label">Casos ativos</div>
          <div class="ui-stat-value">42</div>
          <div class="ui-stat-hint">+4 na semana</div>
        </article>
        <article class="ui-stat-card">
          <div class="ui-stat-label">SLA em dia</div>
          <div class="ui-stat-value">93%</div>
          <div class="ui-stat-hint">meta mínima: 90%</div>
        </article>
        <article class="ui-stat-card">
          <div class="ui-stat-label">Pendente de cliente</div>
          <div class="ui-stat-value">7</div>
          <div class="ui-stat-hint">aguardando documentos</div>
        </article>
      </div>
    </div>
  `,
};

export const TableResponsive: Story = {
  render: () => `
    <div class="ui-table-wrap">
      <table class="ui-table ui-table-responsive ui-process-table">
        <thead>
          <tr>
            <th class="ui-table-priority">Cliente</th>
            <th>Processo</th>
            <th>Status</th>
            <th>Responsável</th>
            <th class="ui-table-priority">Atualização</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="ui-table-priority"><strong>Maria Santos</strong></td>
            <td>5001234-21.2026.8.26.0001</td>
            <td><span class="ui-badge ui-badge-brand">Em análise</span></td>
            <td>Dra. Paula</td>
            <td class="ui-table-priority">há 12 min</td>
          </tr>
          <tr>
            <td class="ui-table-priority"><strong>Rafael Lima</strong></td>
            <td>1008841-09.2026.8.26.0100</td>
            <td><span class="ui-badge ui-badge-warn">Documentos pendentes</span></td>
            <td>Equipe docs</td>
            <td class="ui-table-priority">há 1 h</td>
          </tr>
          <tr>
            <td class="ui-table-priority"><strong>Camila Rocha</strong></td>
            <td>3002221-77.2026.8.26.0405</td>
            <td><span class="ui-badge ui-badge-ok">Concluído</span></td>
            <td>Dr. Felipe</td>
            <td class="ui-table-priority">ontem</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
};

export const StepsAndTimeline: Story = {
  render: () => `
    <div style="display:grid; gap: 20px; max-width: 780px;">
      <ol class="ui-steps">
        <li class="ui-step is-current">
          <span class="ui-step-marker">1</span>
          <div>
            <div class="ui-step-title">Triagem inicial</div>
            <div class="ui-step-text">Documentos básicos recebidos e validados.</div>
          </div>
        </li>
        <li class="ui-step">
          <span class="ui-step-marker">2</span>
          <div>
            <div class="ui-step-title">Análise jurídica</div>
            <div class="ui-step-text">Conferência de dívidas e estratégia processual.</div>
          </div>
        </li>
        <li class="ui-step">
          <span class="ui-step-marker">3</span>
          <div>
            <div class="ui-step-title">Proposta ao cliente</div>
            <div class="ui-step-text">Envio de parecer e cenários de negociação.</div>
          </div>
        </li>
      </ol>

      <ol class="ui-timeline ui-legal-timeline">
        <li class="ui-timeline-item is-current">
          <span class="ui-timeline-marker">A</span>
          <div>
            <div class="ui-timeline-title">Audiência marcada</div>
            <div class="ui-timeline-text">Conciliação agendada para 28/05 às 14h.</div>
            <div class="ui-timeline-meta">há 40 minutos</div>
          </div>
        </li>
        <li class="ui-timeline-item">
          <span class="ui-timeline-marker">D</span>
          <div>
            <div class="ui-timeline-title">Documentos enviados</div>
            <div class="ui-timeline-text">Comprovantes financeiros anexados ao processo.</div>
            <div class="ui-timeline-meta">ontem</div>
          </div>
        </li>
      </ol>
    </div>
  `,
};

export const SearchAndPagination: Story = {
  render: () => `
    <div style="display:grid; gap: 14px; max-width: 760px;">
      <label class="ui-search" aria-label="Busca global">
        <svg class="ui-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="5.5" stroke="currentColor" stroke-width="1.6"></circle>
          <path d="m13.2 13.2 3.1 3.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
        </svg>
        <input class="ui-input" type="search" placeholder="Pesquisar cliente, processo ou ticket" />
      </label>

      <nav class="ui-pagination" aria-label="Paginação de resultados">
        <a class="ui-pagination-link" href="#" aria-label="Página anterior">‹</a>
        <a class="ui-pagination-link" href="#">1</a>
        <a class="ui-pagination-link" href="#" aria-current="page">2</a>
        <a class="ui-pagination-link" href="#">3</a>
        <a class="ui-pagination-link" href="#" aria-label="Próxima página">›</a>
      </nav>
    </div>
  `,
};

export const CalendarAndKanban: Story = {
  render: () => `
    <div style="display:grid; gap: 16px; max-width: 900px;">
      <section class="ui-calendar" aria-label="Agenda semanal">
        <div class="ui-calendar-grid" role="grid">
          <div class="ui-calendar-cell">Seg</div>
          <div class="ui-calendar-cell">Ter</div>
          <div class="ui-calendar-cell">Qua</div>
          <div class="ui-calendar-cell">Qui</div>
          <div class="ui-calendar-cell">Sex</div>
          <div class="ui-calendar-cell">Sáb</div>
          <div class="ui-calendar-cell">Dom</div>
          <div class="ui-calendar-cell">20</div>
          <div class="ui-calendar-cell">21</div>
          <div class="ui-calendar-cell is-today">22</div>
          <div class="ui-calendar-cell">23</div>
          <div class="ui-calendar-cell">24</div>
          <div class="ui-calendar-cell">25</div>
          <div class="ui-calendar-cell">26</div>
        </div>
      </section>

      <div style="display:grid; gap: 10px;">
        <article class="ui-card ui-kanban-card">
          <div class="ui-kanban-title">Revisar contestação</div>
          <div class="ui-kanban-meta">Responsável: Jurídico · SLA: hoje</div>
        </article>
        <article class="ui-card ui-kanban-card">
          <div class="ui-kanban-title">Validar anexos de renda</div>
          <div class="ui-kanban-meta">Responsável: Operação · SLA: amanhã</div>
        </article>
      </div>
    </div>
  `,
};
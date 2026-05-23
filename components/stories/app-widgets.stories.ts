import type { Meta, StoryObj } from '@storybook/html';

const meta = {
  title: 'App/Widgets',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function renderStatusCard({ iconBg, label, value, hint, icon }: { iconBg: string; label: string; value: string; hint: string; icon: string }) {
  return `
    <article class="status-card">
      <div class="status-card-icon ${iconBg}" aria-hidden="true">
        ${icon}
      </div>
      <div class="status-card-body">
        <div class="status-card-label">${label}</div>
        <div class="status-card-value">${value}</div>
        <div class="status-card-hint">${hint}</div>
      </div>
    </article>
  `;
}

export const StatusCards: Story = {
  render: () => `
    <section class="status-cards-grid" aria-label="Indicadores do caso">
      ${renderStatusCard({
        iconBg: 'icon-bg-blue',
        label: 'Documentos',
        value: '3 / 7',
        hint: 'aguardando aprovação',
        icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="10" height="16" rx="1.5" stroke="#2E6DA4" stroke-width="1.5"></rect><path d="M13 2l4 4v12a1 1 0 01-1 1h-3" stroke="#2E6DA4" stroke-width="1.5"></path><path d="M6 8h7M6 11h5" stroke="#2E6DA4" stroke-width="1.5" stroke-linecap="round"></path></svg>',
      })}
      ${renderStatusCard({
        iconBg: 'icon-bg-warn',
        label: 'Análise',
        value: '1 / 4',
        hint: 'em revisão jurídica',
        icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 3v9" stroke="#b7791f" stroke-width="1.5" stroke-linecap="round"></path><circle cx="10" cy="15" r="1" fill="#b7791f"></circle><path d="M4 17l6-14 6 14H4Z" stroke="#b7791f" stroke-width="1.5" stroke-linejoin="round"></path></svg>',
      })}
      ${renderStatusCard({
        iconBg: 'icon-bg-ok',
        label: 'Assinaturas',
        value: '12',
        hint: 'documentos concluídos',
        icon: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M16 6L8.5 14 4 9.5" stroke="#1a7a4a" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path></svg>',
      })}
    </section>
  `,
};

export const ProgressTracker: Story = {
  render: () => `
    <div class="tracker" role="list" aria-label="Progresso do caso">
      <div class="t-step done" role="listitem">
        <div class="t-dot">1</div>
        <div><div class="t-name">Cadastro</div><div class="t-ts">Concluído às 09:20</div></div>
      </div>
      <div class="t-connector done" aria-hidden="true"></div>
      <div class="t-step done" role="listitem">
        <div class="t-dot">2</div>
        <div><div class="t-name">Documentos</div><div class="t-ts">Concluído às 10:05</div></div>
      </div>
      <div class="t-connector done" aria-hidden="true"></div>
      <div class="t-step active" role="listitem">
        <div class="t-dot">3</div>
        <div><div class="t-name">Análise</div><div class="t-ts">Em andamento</div></div>
      </div>
      <div class="t-connector" aria-hidden="true"></div>
      <div class="t-step" role="listitem">
        <div class="t-dot">4</div>
        <div><div class="t-name">Proposta</div><div class="t-ts">Pendente</div></div>
      </div>
      <div class="t-connector" aria-hidden="true"></div>
      <div class="t-step" role="listitem">
        <div class="t-dot">5</div>
        <div><div class="t-name">Concluído</div><div class="t-ts">Pendente</div></div>
      </div>
    </div>
  `,
};

export const LoadingState: Story = {
  render: () => `
    <section class="loading-state" aria-live="polite" aria-busy="true">
      <div class="spinner"></div>
      <p>Carregando o painel do caso e sincronizando os dados do fluxo.</p>
    </section>
  `,
};
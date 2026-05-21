export const RESEND_TEMPLATES = {
  invite: ({ name = 'Cliente' } = {}) => ({ subject: 'Convite para o portal', html: `<p>Ola ${name}, seu acesso ao portal foi criado.</p>` }),
  onboarding: ({ name = 'Cliente' } = {}) => ({ subject: 'Onboarding do portal', html: `<p>Ola ${name}, continue seu onboarding no portal.</p>` }),
  documentos: ({ name = 'Cliente' } = {}) => ({ subject: 'Atualizacao de documentos', html: `<p>Ola ${name}, ha atualizacoes de documentos pendentes.</p>` }),
  assinatura: ({ name = 'Cliente' } = {}) => ({ subject: 'Assinatura pendente', html: `<p>Ola ${name}, existe assinatura pendente.</p>` }),
  sla: ({ name = 'Cliente' } = {}) => ({ subject: 'Alerta de SLA', html: `<p>Ola ${name}, um SLA requer atencao imediata.</p>` }),
  notificacoes: ({ name = 'Cliente' } = {}) => ({ subject: 'Notificacao do portal', html: `<p>Ola ${name}, voce recebeu uma notificacao.</p>` }),
  suporte: ({ name = 'Cliente' } = {}) => ({ subject: 'Suporte atualizado', html: `<p>Ola ${name}, seu atendimento foi atualizado.</p>` }),
};

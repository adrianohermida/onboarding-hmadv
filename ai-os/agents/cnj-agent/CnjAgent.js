export const cnjAgent = {
  key: 'cnj-agent',
  assist: () => ({
    guidance: [
      'Explique Anexo II e fluxo CNJ.',
      'Explique audiencia e plano de pagamento.',
      'Oriente preenchimento sem homologacao automatica.',
    ],
    requires_human_review: true,
  }),
};

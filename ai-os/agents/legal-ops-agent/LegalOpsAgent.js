export const legalOpsAgent = {
  key: 'legal-ops-agent',
  assist: () => ({
    guidance: [
      'Resuma timelines e status de casos.',
      'Sugira proximos passos e gargalos.',
      'Indique pendencias criticas para revisao humana.',
    ],
    legal_ops_aware: true,
  }),
};

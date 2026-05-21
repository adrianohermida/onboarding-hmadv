export const workflowAgent = {
  key: 'workflow-agent',
  assist: () => ({
    guidance: [
      'Sugira proximos passos conforme estado do workflow.',
      'Aponte pendencias e follow-ups.',
      'Nunca aprove ou conclua juridicamente sem revisao.',
    ],
    workflow_aware: true,
  }),
};

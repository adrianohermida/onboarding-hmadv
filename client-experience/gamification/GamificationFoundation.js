export class GamificationFoundation {
  snapshot({ progress = [] } = {}) {
    const completed = progress.filter((entry) => entry.completed === true).length;
    const total = progress.length;

    return {
      subtle_progress_score: total ? completed / total : 0,
      milestones: [
        { key: 'onboarding_inicio', reached: completed > 0 },
        { key: 'documentacao_completa', reached: completed > 2 },
        { key: 'plano_recuperacao', reached: completed > 4 },
      ],
      total,
      completed,
      generated_at: new Date().toISOString(),
    };
  }
}

export const gamificationFoundation = new GamificationFoundation();

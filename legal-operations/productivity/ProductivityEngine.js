export class ProductivityEngine {
  snapshot({ tasks = [], assignments = [] } = {}) {
    const completed = tasks.filter((entry) => entry.status === 'completed').length;
    const open = tasks.filter((entry) => entry.status !== 'completed').length;
    const throughput = completed;
    const active_owners = new Set(assignments.map((entry) => entry.operator_id || entry.lawyer_id).filter(Boolean)).size;

    return {
      tasks_total: tasks.length,
      completed,
      open,
      active_owners,
      throughput,
      bottlenecks: open > completed ? ['tasks_backlog'] : [],
      generated_at: new Date().toISOString(),
    };
  }
}

export const productivityEngine = new ProductivityEngine();

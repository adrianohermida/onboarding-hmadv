const MAX_TASKS = 1200;

export class HumanTaskEngine {
  constructor() {
    this._tasks = [];
  }

  createTask(payload = {}) {
    const task = {
      id: payload.id || `task_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`,
      type: payload.type || 'review',
      title: payload.title || 'Workflow task',
      owner: payload.owner || 'workflow-engine',
      responsible: payload.responsible || 'operations',
      deadline: payload.deadline || null,
      sla: payload.sla || null,
      escalation_path: payload.escalation_path || 'manager->admin',
      tenant_id: payload.tenant_id || 'hmadv',
      workflow_id: payload.workflow_id || null,
      status: payload.status || 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this._tasks.unshift(task);
    if (this._tasks.length > MAX_TASKS) this._tasks.length = MAX_TASKS;
    return task;
  }

  completeTask(taskId, actor = 'system') {
    this._tasks = this._tasks.map((task) => (
      task.id === taskId
        ? { ...task, status: 'completed', completed_by: actor, updated_at: new Date().toISOString() }
        : task
    ));
  }

  list(status = null) {
    if (!status) return [...this._tasks];
    return this._tasks.filter((task) => task.status === status);
  }
}

export const humanTaskEngine = new HumanTaskEngine();

import { humanTaskEngine } from '../human-tasks/HumanTaskEngine.js';

export function assignTask(payload = {}) {
  return humanTaskEngine.createTask({
    ...payload,
    owner: payload.owner || 'workflow-engine',
    responsible: payload.responsible || 'operations',
    tenant_id: payload.tenant_id || 'hmadv',
  });
}

export function completeTask(taskId, actor = 'system') {
  humanTaskEngine.completeTask(taskId, actor);
}

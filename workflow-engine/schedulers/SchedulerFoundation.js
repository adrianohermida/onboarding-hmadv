import { workflowTimerEngine } from '../timers/WorkflowTimerEngine.js';
import { workflowQueue } from '../queues/WorkflowQueue.js';

export class SchedulerFoundation {
  runCycle() {
    const due = workflowTimerEngine.due();
    due.forEach((timer) => {
      workflowQueue.enqueue('scheduled', {
        workflow: timer.workflow,
        tenant_id: timer.tenant_id,
        timer_id: timer.timer_id,
        type: timer.type,
      });
      workflowTimerEngine.complete(timer.timer_id);
    });
    return { processed: due.length };
  }

  scheduleReminder(payload = {}) {
    return workflowTimerEngine.register({
      ...payload,
      type: payload.type || 'reminder',
    });
  }
}

export const schedulerFoundation = new SchedulerFoundation();

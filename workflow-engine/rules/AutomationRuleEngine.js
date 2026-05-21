const MAX_RULE_LOG = 800;

export class AutomationRuleEngine {
  constructor() {
    this._rules = new Map();
    this._history = [];
  }

  register(rule) {
    if (!rule?.id) throw new Error('rule id is required');
    this._rules.set(rule.id, rule);
  }

  async evaluate(trigger, context = {}) {
    const rules = [...this._rules.values()].filter((rule) => rule.trigger === trigger);
    const results = [];

    for (const rule of rules) {
      const guardOk = typeof rule.condition === 'function' ? await rule.condition(context) : true;
      if (!guardOk) continue;

      try {
        const value = typeof rule.action === 'function' ? await rule.action(context) : null;
        const item = { id: rule.id, trigger, ok: true, value, at: new Date().toISOString() };
        this._history.unshift(item);
        results.push(item);
      } catch (error) {
        const item = { id: rule.id, trigger, ok: false, error: String(error), at: new Date().toISOString() };
        this._history.unshift(item);
        results.push(item);
      }
    }

    if (this._history.length > MAX_RULE_LOG) this._history.length = MAX_RULE_LOG;
    return results;
  }

  history() {
    return [...this._history];
  }
}

export const automationRuleEngine = new AutomationRuleEngine();

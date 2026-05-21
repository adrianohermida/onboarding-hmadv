export class ComponentRegistryEngine {
  list() {
    return [
      'ui.card',
      'ui.table',
      'ui.modal',
      'ui.drawer',
      'ui.timeline',
      'ui.form',
      'ui.chart',
      'ui.command-palette',
      'ui.copilot-panel',
      'ui.feedback-toast',
    ];
  }
}

export const componentRegistryEngine = new ComponentRegistryEngine();

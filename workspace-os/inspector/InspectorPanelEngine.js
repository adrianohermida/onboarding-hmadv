class InspectorPanelEngine {
  snapshot(payload = {}) {
    const entities = Array.isArray(payload.entities) ? payload.entities : [
      'cliente',
      'workflow',
      'documento',
      'divida',
      'timeline',
    ];
    return {
      enabled: true,
      entities,
      current_entity: payload.current_entity || entities[0],
      contextual_drawer_ready: true,
      generated_at: new Date().toISOString(),
    };
  }
}

export const inspectorPanelEngine = new InspectorPanelEngine();

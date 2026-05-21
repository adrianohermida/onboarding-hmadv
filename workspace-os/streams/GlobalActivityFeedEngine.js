class GlobalActivityFeedEngine {
  snapshot(activitySnapshot = {}) {
    return {
      realtime_ready: true,
      total: Number(activitySnapshot.total) || 0,
      uploads: Number(activitySnapshot.uploads) || 0,
      onboarding: Number(activitySnapshot.onboarding) || 0,
      workflows: Number(activitySnapshot.workflows) || 0,
      approvals: Number(activitySnapshot.approvals) || 0,
      list: Array.isArray(activitySnapshot.list) ? activitySnapshot.list.slice(0, 100) : [],
      generated_at: new Date().toISOString(),
    };
  }
}

export const globalActivityFeedEngine = new GlobalActivityFeedEngine();

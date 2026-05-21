const PLAN_CATALOG = {
  free: {
    code: 'free',
    name: 'Free',
    limits: {
      max_users: 2,
      max_clients: 20,
      max_workflows: 30,
      max_ai_requests: 300,
      storage_mb: 512,
      monthly_uploads: 150,
      analytics_dashboards: 1,
      integrations: 1,
    },
  },
  starter: {
    code: 'starter',
    name: 'Starter',
    limits: {
      max_users: 8,
      max_clients: 250,
      max_workflows: 300,
      max_ai_requests: 4000,
      storage_mb: 3072,
      monthly_uploads: 1200,
      analytics_dashboards: 4,
      integrations: 4,
    },
  },
  professional: {
    code: 'professional',
    name: 'Professional',
    limits: {
      max_users: 25,
      max_clients: 1500,
      max_workflows: 2500,
      max_ai_requests: 30000,
      storage_mb: 15360,
      monthly_uploads: 12000,
      analytics_dashboards: 15,
      integrations: 15,
    },
  },
  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    limits: {
      max_users: 300,
      max_clients: 25000,
      max_workflows: 50000,
      max_ai_requests: 500000,
      storage_mb: 512000,
      monthly_uploads: 250000,
      analytics_dashboards: 100,
      integrations: 100,
    },
  },
  white_label_future: {
    code: 'white_label_future',
    name: 'White-label (Future)',
    limits: {
      max_users: 1000,
      max_clients: 100000,
      max_workflows: 200000,
      max_ai_requests: 2000000,
      storage_mb: 2097152,
      monthly_uploads: 1000000,
      analytics_dashboards: 500,
      integrations: 500,
    },
  },
};

class PlanEngine {
  get(planCode = 'starter') {
    return PLAN_CATALOG[planCode] || PLAN_CATALOG.starter;
  }

  list() {
    return Object.values(PLAN_CATALOG);
  }
}

export const planEngine = new PlanEngine();

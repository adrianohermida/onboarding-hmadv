import { tenantProvider } from '../tenant/TenantProvider.js';
import { authProvider } from '../auth/AuthProvider.js';

export class ShellProviders {
  async init() {
    const tenant = await tenantProvider.init();
    const auth = await authProvider.init();
    return { tenant, auth };
  }
}

export const shellProviders = new ShellProviders();
export default shellProviders;

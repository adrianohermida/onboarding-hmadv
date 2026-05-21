import { describe, expect, it } from 'vitest';
import { normalizeUiComponentPayload } from '../shared/contracts/ui-os/ComponentContracts.js';
import { normalizeUiModalPayload } from '../shared/contracts/ui-os/ModalContracts.js';
import { normalizeUiTablePayload } from '../shared/contracts/ui-os/TableContracts.js';
import { normalizeUiChartPayload } from '../shared/contracts/ui-os/ChartContracts.js';
import { normalizeUiDashboardPayload } from '../shared/contracts/ui-os/DashboardContracts.js';

describe('ui os contracts', () => {
  it('normalizes component and modal payloads', () => {
    const component = normalizeUiComponentPayload({ tenant_id: 'tenant-ui', component_type: 'table' });
    const modal = normalizeUiModalPayload({ modal_type: 'workflow', open: true });

    expect(component.tenant_id).toBe('tenant-ui');
    expect(modal.modal_type).toBe('workflow');
    expect(modal.open).toBe(true);
  });

  it('normalizes table, chart and dashboard payloads', () => {
    const table = normalizeUiTablePayload({ rows: 12, paginated: true });
    const chart = normalizeUiChartPayload({ chart_type: 'bar', datapoints: 7 });
    const dashboard = normalizeUiDashboardPayload({ layout_mode: 'adaptive-grid', widgets: 8 });

    expect(table.rows).toBe(12);
    expect(chart.chart_type).toBe('bar');
    expect(dashboard.widgets).toBe(8);
  });
});

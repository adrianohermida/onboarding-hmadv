import { normalizeUiComponentPayload } from './ComponentContracts.js';
import { normalizeUiModalPayload } from './ModalContracts.js';
import { normalizeUiTablePayload } from './TableContracts.js';
import { normalizeUiChartPayload } from './ChartContracts.js';
import { normalizeUiDashboardPayload } from './DashboardContracts.js';

export const uiOsContracts = {
  normalizeUiComponentPayload,
  normalizeUiModalPayload,
  normalizeUiTablePayload,
  normalizeUiChartPayload,
  normalizeUiDashboardPayload,
};

export default uiOsContracts;

import { normalizeAiPromptPayload } from './PromptContracts.js';
import { normalizeAiRetrievalPayload } from './RetrievalContracts.js';
import { normalizeAiWorkflowPayload } from './WorkflowCopilotContracts.js';
import { normalizeAiCopilotPayload } from './CopilotContracts.js';
import { normalizeAiReviewPayload } from './ReviewContracts.js';

export const aiOsContracts = {
  normalizePromptPayload: normalizeAiPromptPayload,
  normalizeRetrievalPayload: normalizeAiRetrievalPayload,
  normalizeWorkflowPayload: normalizeAiWorkflowPayload,
  normalizeCopilotPayload: normalizeAiCopilotPayload,
  normalizeReviewPayload: normalizeAiReviewPayload,
};

export default aiOsContracts;

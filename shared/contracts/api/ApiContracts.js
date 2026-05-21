export const ApiRequestContract = {
  required: ['tenant_id', 'request_id', 'permissions', 'payload'],
  validation: 'data-governance/validation/SchemaValidator.js',
  permissionMapping: true,
};

export const ApiResponseContract = {
  required: ['data', 'meta', 'request_id'],
  metadata: ['pagination', 'filters', 'sorting', 'timestamp'],
};

export const ApiErrorContract = {
  required: ['code', 'message', 'request_id', 'tenant_id'],
  schema: 'shared/contracts/api/ErrorContracts.js',
};

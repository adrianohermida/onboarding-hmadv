export const ValidationErrorContract = {
  required: ['code', 'message', 'field', 'request_id', 'tenant_id'],
  code: 'validation_error',
};

export const AuthErrorContract = {
  required: ['code', 'message', 'request_id', 'tenant_id'],
  code: 'auth_error',
};

export const TenantErrorContract = {
  required: ['code', 'message', 'request_id', 'tenant_id'],
  code: 'tenant_error',
};

export const UploadErrorContract = {
  required: ['code', 'message', 'request_id', 'tenant_id', 'file_name'],
  code: 'upload_error',
};

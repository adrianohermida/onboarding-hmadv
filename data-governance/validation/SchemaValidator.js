export function validateRequired(payload, required = []) {
  const errors = [];
  required.forEach((field) => {
    if (payload?.[field] === undefined || payload?.[field] === null || payload?.[field] === '') {
      errors.push(`missing required field: ${field}`);
    }
  });
  return { valid: errors.length === 0, errors };
}

export function validateSchema(payload, schema = {}) {
  const required = schema.required || [];
  const result = validateRequired(payload, required);
  if (!result.valid) return result;

  const errors = [];
  const properties = schema.properties || {};
  Object.entries(properties).forEach(([key, descriptor]) => {
    const value = payload?.[key];
    if (value === undefined || value === null) return;

    if (descriptor.type === 'string' && typeof value !== 'string') errors.push(`${key} must be string`);
    if (descriptor.type === 'number' && typeof value !== 'number') errors.push(`${key} must be number`);
    if (descriptor.type === 'boolean' && typeof value !== 'boolean') errors.push(`${key} must be boolean`);
    if (descriptor.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) errors.push(`${key} must be object`);
  });

  return { valid: errors.length === 0, errors };
}

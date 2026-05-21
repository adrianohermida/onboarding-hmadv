const REQUIRED_FIELDS = [
  'event',
  'version',
  'tenant_id',
  'timestamp',
  'payload',
  'correlation_id',
  'request_id',
];

export function validateEventEnvelope(envelope, registryEntry) {
  const errors = [];

  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, errors: ['event envelope must be an object'] };
  }

  REQUIRED_FIELDS.forEach((field) => {
    if (envelope[field] === undefined || envelope[field] === null || envelope[field] === '') {
      errors.push(`missing field: ${field}`);
    }
  });

  if (typeof envelope.event !== 'string' || !envelope.event.includes('.')) {
    errors.push('event name must follow domain.action format');
  }

  if (registryEntry?.tenantAware === true && !envelope.tenant_id) {
    errors.push('tenant_id is required for tenant-aware events');
  }

  return { valid: errors.length === 0, errors };
}

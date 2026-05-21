import { validateSchema } from './SchemaValidator.js';

export function createTypedValidator(schema) {
  return (payload) => validateSchema(payload, schema);
}

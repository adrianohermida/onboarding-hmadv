const requiredEnv = [
  'NODE_ENV',
];

const missing = requiredEnv.filter(key => !process.env[key]);

if (missing.length) {
  console.error(`[validate-env] missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('[validate-env] required environment variables present');

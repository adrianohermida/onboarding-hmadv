<<<<<<< HEAD
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const modulesDir = path.join(root, 'modules');

const skipFolders = new Set(['events', 'videos', 'debt-engine']);
const requiredKeys = ['module', 'route', 'permissions', 'lazy'];

function fail(message) {
  console.error(`[validate-manifests] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(modulesDir)) fail('modules directory not found');

const moduleFolders = fs.readdirSync(modulesDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .filter(name => !skipFolders.has(name));

const missing = [];
const invalid = [];

for (const folder of moduleFolders) {
  const manifestPath = path.join(modulesDir, folder, 'module.manifest.json');
  if (!fs.existsSync(manifestPath)) {
    missing.push(folder);
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    invalid.push(`${folder}: invalid JSON (${error.message})`);
    continue;
  }

  const missingKeys = requiredKeys.filter(key => parsed[key] === undefined);
  if (missingKeys.length) {
    invalid.push(`${folder}: missing keys ${missingKeys.join(', ')}`);
  }
}

if (missing.length) fail(`missing manifest for modules: ${missing.join(', ')}`);
if (invalid.length) fail(`invalid manifests: ${invalid.join(' | ')}`);

console.log('[validate-manifests] OK');
=======
console.log('validate-manifests: no manifest validation rules registered yet');
>>>>>>> b0f6a91 (feat(platform): add scripts for bootstrap, validation, and diagnostics; update styles and themes)

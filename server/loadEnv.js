/**
 * WrenchIQ — .env.local loader
 *
 * Must be the FIRST import in server/index.js. ES module imports are hoisted
 * and fully evaluated before any of the importing file's own top-level code
 * runs — so env loading has to happen as an import's side effect, not as
 * inline code after other imports, or every module that reads process.env
 * into a top-level const (config.js, most services) sees stale/missing values.
 */

import { readFileSync, existsSync } from 'fs';

for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile)) {
    const lines = readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
    break;
  }
}

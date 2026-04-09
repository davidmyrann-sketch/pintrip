// Post-build: move index.html to ../templates/ so Flask can serve it
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const staticDir  = resolve(__dirname, '../../static');
const tmplDir    = resolve(__dirname, '../../templates');

mkdirSync(tmplDir, { recursive: true });

const html = readFileSync(resolve(staticDir, 'index.html'), 'utf8');
writeFileSync(resolve(tmplDir, 'index.html'), html);
console.log('✅ index.html copied to templates/');

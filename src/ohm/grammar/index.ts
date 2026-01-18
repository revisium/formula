import * as ohm from 'ohm-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const grammarPath = path.join(__dirname, 'formula.ohm');
const grammarText = fs.readFileSync(grammarPath, 'utf-8');

export const grammar = ohm.grammar(grammarText);

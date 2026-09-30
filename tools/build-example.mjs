// Bundles the official Image Edit template as a module, so the page needs no network access to load it.
import { readFileSync, writeFileSync } from 'node:fs';
const raw = readFileSync(new URL('../fixtures/official/image_qwen_image_2_1_image_edit.json', import.meta.url), 'utf8');
const text = JSON.stringify(JSON.parse(raw), null, 2);
writeFileSync(new URL('../example.js', import.meta.url), `// Comfy-Org/workflow_templates templates/image_qwen_image_2_1_image_edit.json at e7cd011d4d (MIT). Rebuild: node tools/build-example.mjs\nexport const OFFICIAL_IMAGE_EDIT = ${JSON.stringify(text)};\n`);

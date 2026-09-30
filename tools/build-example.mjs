// Bundles the official Image Edit template as a module, so the page needs no network access to load it.
import { readFileSync, writeFileSync } from 'node:fs';
const raw = readFileSync(new URL('../fixtures/official/image_qwen_image_2_1_image_edit.json', import.meta.url), 'utf8');
const license = readFileSync(new URL('../fixtures/official/LICENSE.txt', import.meta.url), 'utf8').trimEnd();
const text = JSON.stringify(JSON.parse(raw), null, 2);
// MIT asks for its notice in every copy, and this file is the copy every visitor receives.
writeFileSync(new URL('../example.js', import.meta.url), `// Comfy-Org/workflow_templates templates/image_qwen_image_2_1_image_edit.json at e7cd011d4d. Rebuild: node tools/build-example.mjs
/*
${license}
*/
export const OFFICIAL_IMAGE_EDIT = ${JSON.stringify(text)};
`);

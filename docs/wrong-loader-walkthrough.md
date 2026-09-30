# Catch a Qwen-Image 2.1 file in the wrong loader

The prompt enhancer and text encoder can live in the same folder and use the same loader node. Their destinations differ: the enhancer feeds Generate Text; the text encoder feeds Text Encode Qwen Image 2.1. The [Comfy Org file guide](https://huggingface.co/Comfy-Org/Qwen-Image-2.1) identifies the PE files and encoder files separately.

This walkthrough deliberately puts the PE file in the encoder slot, then changes that one filename. It checks configuration; it does not generate images or prove that a workflow will run on your hardware.

## Reproduce without model downloads

You need Git and a modern Node.js with ES modules. Verified with Node.js 24.11.1. No npm packages, inference service or GPU are needed for this recipe. Run in a new directory:

```sh
git clone https://github.com/CyberNative-AI/comfy-qwen-preflight.git
cd comfy-qwen-preflight
git checkout --detach fc84daaf201c2826fb15c4c35e21c97cff748d7d
node --input-type=module <<'JS'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { REPORTED, t2iRepaired } from './test/labeled-set.js';
import { check } from './engine.js';
const pairs = [
  ['wrong-loader.json', REPORTED.find(c => c.id === 'R1').workflow(), ['files.pe-in-encoder']],
  ['corrected-loader.json', JSON.stringify(t2iRepaired()), []],
];
for (const [name, text, expected] of pairs) {
  fs.writeFileSync(name, text + String.fromCharCode(10));
  const r = check(text, '', { version: '0.38.0' });
  assert.equal(r.ok, true);
  const actionable = r.findings.filter(f => ['fail', 'warn'].includes(f.status));
  assert.deepEqual(actionable.map(f => f.id), expected);
  console.log(name + ': ' + (actionable.map(f => f.id).join(', ') || 'no actionable findings'));
}
JS
```

Expected terminal output:

```text
wrong-loader.json: files.pe-in-encoder
corrected-loader.json: no actionable findings
```

The fixtures reconstruct a reported configuration from a Comfy Org template. They are not a customer's workflow. The repair changes only the encoder filename from `qwen3.5_9b_qwen_image_2.1_pe_t2i.int8_convrot.safetensors` to `qwen3vl_8b_int8_convrot.safetensors`.

## See the same result in your browser

1. Open the [free workflow checker](https://cybernative-ai.github.io/comfy-qwen-preflight/#check).
2. Set **ComfyUI version** to `0.38.0` for this example; leave the optional file listing empty.
3. Choose `wrong-loader.json`. Reading a file runs the check automatically. Expect **1 thing to fix** and **The prompt enhancer is in the text-encoder slot**.
4. Choose `corrected-loader.json`. Expect **Nothing to fix in what this page can check**.
5. For your own setup, export your workflow from ComfyUI, enter your actual ComfyUI version, and check the export locally. Select `qwen3vl_8b_*` in the CLIPLoader that feeds Text Encode Qwen Image 2.1, with type `qwen_image`. Keep the PE in its separate CLIPLoader feeding Generate Text, if you use it. Make that repair in ComfyUI and export again; this checker does not rewrite your workflow.

The checker processes these files in the browser. In our September 30, 2026 rehearsal, each input caused zero network requests after the page loaded. Initial page assets still download. A clean result covers only the rules this checker can inspect: it cannot validate runtime VRAM, launch flags, installed custom-node versions, image quality or speed. Renamed model files can also limit filename-based checks. Never post your private workflow to ask for help; report a rule name and a synthetic example if needed.

If choosing a file does nothing, paste its JSON into **Workflow JSON** and press **Check workflow**. Invalid JSON is an input error, not a clean result. Model filenames must match what is installed; a configuration check does not download or inspect the model weights.

This recipe pins checker revision `fc84daa` and uses ComfyUI `0.38.0` as its example. It makes no claim about today's template package. The templates' original MIT notice is retained in [fixtures/official/LICENSE.txt](https://github.com/CyberNative-AI/comfy-qwen-preflight/blob/fc84daaf201c2826fb15c4c35e21c97cff748d7d/fixtures/official/LICENSE.txt). Checker code and documentation are [MIT licensed](https://github.com/CyberNative-AI/comfy-qwen-preflight/blob/fc84daaf201c2826fb15c4c35e21c97cff748d7d/LICENSE).

An independent tool by CyberNative AI LLC; not affiliated with Qwen, Alibaba Cloud or Comfy Org. Corrections: hello@cybernative.ai.

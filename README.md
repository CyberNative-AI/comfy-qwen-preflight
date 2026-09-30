# Qwen-Image 2.1 workflow preflight

A static page that checks an exported ComfyUI workflow (UI or API format, subgraphs included) for the Qwen-Image 2.1 mistakes that run without an error:

- a model file in the wrong loader (prompt enhancer in the text-encoder slot, GGUF in the core loader, safetensors in the GGUF loader, old VAE or text encoder, wrong CLIPLoader type, Diffusers shards);
- files in the wrong `models/` folder, from an optional folder listing;
- core nodes newer than your ComfyUI (`TextEncodeQwenImage21` and `QwenImage21Cache` need 0.37.0; the `system_prompt` input on Generate Text needs 0.38.0);
- the prompt enhancer without its system prompt, with a dropped or double-wrapped system prompt, the wrong prompt for the task, JSON output that is not extracted, or a token budget below Qwen's;
- a weights-only VRAM plan for 12, 16 and 24 GB cards from the published file sizes.

Everything runs in the page. The Content-Security-Policy sets `connect-src 'none'`, and a browser test proves that no request leaves the page.

Each rule cites its primary source in `engine.js` (`SOURCES`): the Comfy-Org and Qwen Hugging Face repositories, Qwen's `pe_core.py`, the official templates, and the ComfyUI source at v0.37.0 and v0.38.0. `core-nodes.js` is generated from the ComfyUI tags by `tools/core-nodes.py`.

## Run

    python3 -m http.server 8000   # then open http://127.0.0.1:8000/
    npm install && npm test        # engine, labeled set and browser tests (Playwright, Chrome)

`npm test` rewrites `evidence/labeled-report.md`. The report covers 17 problems reported in public threads, each rebuilt as an edit of an official Comfy-Org template, plus 5 clean controls and 9 rules documented in source code.

`fixtures/official/` holds the Comfy-Org Qwen Image 2.1 templates from Comfy-Org/workflow_templates at e7cd011d4d, copyright (c) 2023-present Comfy Org, under the MIT License. Its full text is in [`fixtures/official/LICENSE.txt`](fixtures/official/LICENSE.txt). `example.js` bundles the Image Edit template with that notice, so the page needs no network access (rebuild it with `node tools/build-example.mjs`).

Not affiliated with Qwen, Alibaba Cloud or Comfy Org.

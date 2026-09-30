# Qwen-Image 2.1 workflow preflight

A static page that checks an exported ComfyUI workflow (UI or API format, subgraphs included) for the Qwen-Image 2.1 mistakes that run without an error:

- a model file in the wrong loader (prompt enhancer in the text-encoder slot, GGUF in the core loader, safetensors in the GGUF loader, old VAE or text encoder, wrong CLIPLoader type, Diffusers shards);
- files in the wrong `models/` folder, from an optional folder listing;
- core nodes newer than your ComfyUI (`TextEncodeQwenImage21` and `QwenImage21Cache` need 0.37.0; the `system_prompt` input on Generate Text needs 0.38.0);
- the prompt enhancer without its system prompt, with a dropped or double-wrapped system prompt, the wrong prompt for the task, JSON output that is not extracted, or a token budget below Qwen's;
- a weights-only VRAM plan for 12, 16 and 24 GB cards from the published file sizes, plus what we have measured on a real card (so far, the text-to-image enhancer alone on an RTX 3090).

Everything runs in the page. The Content-Security-Policy sets `connect-src 'none'`, and a browser test proves that no request leaves the page.

Each rule cites its primary source in `engine.js` (`SOURCES`): the Comfy-Org and Qwen Hugging Face repositories, Qwen's `pe_core.py`, the official templates, and the ComfyUI source at v0.37.0 and v0.38.0. `core-nodes.js` is generated from the ComfyUI tags by `tools/core-nodes.py`.

## Run

    python3 -m http.server 8000   # then open http://127.0.0.1:8000/
    npm install && npm test        # engine, labeled set and browser tests (Playwright, Chrome)

`npm test` rewrites `evidence/labeled-report.md`. The report covers 17 problems reported in public threads, each rebuilt as an edit of an official Comfy-Org template, plus 13 clean controls, 4 labelled real exports and 10 rules documented in source code.

`fixtures/official/` holds Comfy-Org Qwen Image 2.1 templates from Comfy-Org/workflow_templates, copyright (c) 2023-present Comfy Org, under the MIT License. Its full text is in [`fixtures/official/LICENSE.txt`](fixtures/official/LICENSE.txt), and it covers every file below:

- the top-level templates, at e7cd011d4d. Their PE wiring is what templates package 0.11.70 ships, the version ComfyUI 0.38.0 installs;
- `main-aec2197f/`: Text to Image and Image Edit on upstream main after the 2026-09-30 fix ([PR #1298](https://github.com/Comfy-Org/workflow_templates/pull/1298)), which no released package contained when this was written;
- `exports-comfyui-0.38.0/`: those 0.11.70 templates as exported from a real ComfyUI 0.38.0: UI round-trips, Export (API) files and the graphs actually queued, untouched apart from the repairs their names describe.

`example.js` bundles the Image Edit template with that notice, so the page needs no network access (rebuild it with `node tools/build-example.mjs`).

## Licence

The check's code and documentation are available under the [MIT License](LICENSE).
The templates in `fixtures/official/` and the copy in `example.js` remain Comfy Org's, under [their MIT License](fixtures/official/LICENSE.txt).
Bundled fonts retain their own licences in `assets/fonts/`.

Not affiliated with Qwen, Alibaba Cloud or Comfy Org.

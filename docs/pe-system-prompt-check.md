# A connected system prompt can still be dropped

Saved a Qwen Image 2.1 Image Edit workflow from templates package **0.11.70**? Its prompt-enhancer repair needs two steps: connect the system prompt, then turn **use_default_template** on in Generate Text. In [ComfyUI 0.38.0](https://github.com/Comfy-Org/ComfyUI/blob/v0.38.0/comfy_extras/nodes_textgen.py#L56), that switch controls whether the supplied system prompt reaches tokenization.

This is a historical-workflow demonstration. The September 30 [upstream fix](https://github.com/Comfy-Org/workflow_templates/pull/1298) is included in templates package **0.11.73**, verified October 1. Fresh templates from that package pass the system-prompt checks. Updating a package does not rewrite a workflow you previously saved. Prefer a fresh fixed template for a new workflow; check the wiring in a saved one.

## Try the incomplete repair and the complete repair

These are public example exports, not your files. They exercise the static checker; no models or image generation are needed.

Download these two files from checker revision `fc84daaf201c2826fb15c4c35e21c97cff748d7d`:

- [Link only: i2i_link_only.api.json](https://raw.githubusercontent.com/CyberNative-AI/comfy-qwen-preflight/fc84daaf201c2826fb15c4c35e21c97cff748d7d/fixtures/official/exports-comfyui-0.38.0/i2i_link_only.api.json)
- [Link plus switch: i2i_repaired.api.json](https://raw.githubusercontent.com/CyberNative-AI/comfy-qwen-preflight/fc84daaf201c2826fb15c4c35e21c97cff748d7d/fixtures/official/exports-comfyui-0.38.0/i2i_repaired.api.json)

If your browser displays JSON instead of downloading it, these commands save the exact files:

```sh
curl -fL 'https://raw.githubusercontent.com/CyberNative-AI/comfy-qwen-preflight/fc84daaf201c2826fb15c4c35e21c97cff748d7d/fixtures/official/exports-comfyui-0.38.0/i2i_link_only.api.json' -o i2i_link_only.api.json
curl -fL 'https://raw.githubusercontent.com/CyberNative-AI/comfy-qwen-preflight/fc84daaf201c2826fb15c4c35e21c97cff748d7d/fixtures/official/exports-comfyui-0.38.0/i2i_repaired.api.json' -o i2i_repaired.api.json
```

1. Open the [workflow checker](https://cybernative-ai.github.io/comfy-qwen-preflight/). Enter **0.38.0** as the ComfyUI version for this example and leave the optional file listing empty.
2. Choose **i2i_link_only.api.json** in the workflow file input. Choosing a file runs the check automatically. The accepted test flags `pe.system-dropped`: **The system prompt is connected, but Generate Text drops it**.
3. Choose **i2i_repaired.api.json**. The accepted repaired-export control has no fail, warning or dormant findings. The scoped clean verdict is **Nothing to fix in what this page can check.** The informational `max_length` note remains; Image Edit's token budget was not measured here.
4. Compare node **459:500**, Generate Text, in the two JSON files. Both already have `"system_prompt": ["459:479", 0]`. Their only changed value is `"use_default_template": false` becoming `true`.

The visible result is a wiring finding that persists after a link-only repair and disappears after the switch is enabled. It is not an image-quality comparison.

## Check your saved workflow

For this affected Image Edit template, connect the PE-I2I system-prompt String node to Generate Text's **system_prompt** input and enable its advanced **use_default_template** widget. Export your workflow again and check that export using your actual ComfyUI version. The two supplied files are API exports; they are inputs to the checker, not instructions to queue a generation.

A clean verdict covers only this checker's inspected rules. It does not prove that models are installed, that the graph will run, that it fits your GPU, or that generated images will improve. The [accepted labeled controls and round-trip exports](https://github.com/CyberNative-AI/comfy-qwen-preflight/blob/fc84daaf201c2826fb15c4c35e21c97cff748d7d/evidence/labeled-report.md) document the scope. Comfy Org's [MIT notice](https://github.com/CyberNative-AI/comfy-qwen-preflight/blob/fc84daaf201c2826fb15c4c35e21c97cff748d7d/fixtures/official/LICENSE.txt) applies to the example material.

If you choose to report a result, did the checker catch the link-only state in a workflow you had saved, and did the two-step repair remove that finding? Email **hello@cybernative.ai** with the outcome, finding title and optional ComfyUI version only. Email shares your sender address. Please omit workflows, prompts, images, screenshots, logs, model listings and paths. Replaying the supplied samples demonstrates the check; it does not count as fixing your own workflow.

Published by CyberNative AI LLC, which maintains the checker. This is an independent demonstration using Comfy Org's public material; no affiliation is implied. Corrections: hello@cybernative.ai.

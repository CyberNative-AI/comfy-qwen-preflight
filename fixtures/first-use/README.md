# First-use fixtures

Public, privacy-safe samples for the browser checker. Do not queue them in ComfyUI: image filenames are placeholders and no model or image files are supplied.

Source: `fixtures/official/exports-comfyui-0.38.0/i2i_repaired.api.json`, already accepted with the checker revision. This is an Export (API) of the Comfy Org Image Edit template in ComfyUI 0.38.0. See `LICENSE.txt` for the retained Comfy Org MIT notice.

Both copies remove node display metadata, replace the user prompt with “Change the blue square to orange.”, replace input-image filenames with `synthetic-placeholder.png`, and set the output prefix to `synthetic-first-use`. The public PE-I2I system prompt is retained. No private workflow, image, log or folder listing is used.

The only differences between the pair are at node `459:500`:

- Broken: `system_prompt` input absent; `use_default_template: false`.
- Corrected: `system_prompt: ["459:479", 0]`; `use_default_template: true`.

Exact inputs: workflow file as text, empty optional model-file listing, ComfyUI version `0.38.0`. The `.expected.json` files hold the full deterministic output of the checker engine (unchanged since `fc84daa`), including slots, findings, pass list and weights-only VRAM plan. They are results of a static check, not GPU runs or image-quality evidence.

Broken: fail 1, warn 0, dormant 0, info 1, pass 3. Finding `pe.no-system` fails. Corrected: fail 0, warn 0, dormant 0, info 1, pass 4. `pe.no-system` disappears and `pe.ok.459:500` passes. Both retain the informational `pe.max-tokens` finding: Image Edit's budget is unmeasured here.

This demonstrates one wiring mistake and its repair. The official templates shipped this wiring in templates package 0.11.70; the fix was released in 0.11.73 (0.11.76 checked). A workflow saved from 0.11.70 keeps the old wiring.

// The labeled set: problems people reported in public threads, rebuilt as edits of the official
// Comfy-Org Qwen Image 2.1 templates (fixtures/official, MIT). Each case names its thread, the exact
// configuration we rebuilt, the rule we expect to fire, and whether ComfyUI already flags it today.
import { readFileSync } from 'node:fs';

const load = name => JSON.parse(readFileSync(new URL(`../fixtures/official/image_qwen_image_2_1_${name}.json`, import.meta.url), 'utf8'));

// Short excerpts of Qwen's system_prompt.txt files (Qwen research licence: we quote the heading and the answer contract only).
export const T2I_SYSTEM_EXCERPT = '# Image Prompt Rewriting Expert\n\nYou turn a user\'s image request into one long English paragraph …\n\n## Output format\n\nReturn one strictly valid JSON object on a single line, nothing before or after:\n\n{"rewritten_prompt": "<the description>", "wh_ratio": "<e.g. 3:2>"}';

const sg = wf => wf.definitions.subgraphs[0];
const inner = (wf, id) => sg(wf).nodes.find(n => n.id === id);
const instance = wf => wf.nodes.find(n => n.type === sg(wf).id);
function setInstance(wf, name, value) {
  const widgetInputs = sg(wf).inputs.filter(i => ['INT', 'FLOAT', 'STRING', 'BOOLEAN', 'COMBO'].includes(i.type));
  const idx = widgetInputs.findIndex(i => i.name === name);
  if (idx < 0) throw new Error(`no subgraph widget ${name}`);
  instance(wf).widgets_values[idx] = value;
}
function unlink(wf, nodeId, inputName) {
  const n = inner(wf, nodeId);
  const inp = n.inputs.find(i => i.name === inputName);
  const id = inp.link;
  inp.link = null;
  sg(wf).links = sg(wf).links.filter(l => l.id !== id);
  for (const m of sg(wf).nodes) for (const o of m.outputs || []) if (o.links) o.links = o.links.filter(x => x !== id);
}
function link(wf, fromId, fromSlot, toId, inputName, type = 'STRING') {
  const to = inner(wf, toId);
  const slot = to.inputs.findIndex(i => i.name === inputName);
  const id = 90000 + sg(wf).links.length;
  sg(wf).links.push({ id, origin_id: fromId, origin_slot: fromSlot, target_id: toId, target_slot: slot, type });
  to.inputs[slot].link = id;
  const out = inner(wf, fromId).outputs[fromSlot];
  out.links = [...(out.links || []), id];
}
// TextGenerate widgets_values: prompt, max_length, sampling_mode, temperature, top_k, top_p, min_p, repetition_penalty, seed, presence_penalty, thinking, use_default_template, mtp
const TG = { max_length: 1, presence_penalty: 9, thinking: 10, use_default_template: 11 };
const setTG = (wf, id, name, v) => { inner(wf, id).widgets_values[TG[name]] = v; };

// Controls: the official templates, repaired so the prompt enhancer is on and gets its system prompt as ComfyUI 0.38.0 expects.
export function t2iRepaired() {
  const wf = load('t2i');
  setInstance(wf, 'switch', true); // PE on
  setTG(wf, 471, 'use_default_template', true);
  setTG(wf, 471, 'presence_penalty', 1.5);
  const sp = inner(wf, 475);
  sp.widgets_values[0] = sp.widgets_values[0].replace(/^<\|im_start\|>system\n/, '').replace(/\n?<\|im_end\|>\s*$/, '');
  return wf;
}
export function editRepaired() {
  const wf = load('image_edit');
  link(wf, 479, 0, 500, 'system_prompt');
  setTG(wf, 500, 'use_default_template', true);
  setTG(wf, 500, 'max_length', 24000);
  return wf;
}

// Minimal UI→API conversion for the API-format control (what Export (API) produces: subgraphs flattened to "outer:inner" ids).
export function toApi(wf) {
  const out = {};
  const s = sg(wf), inst = instance(wf);
  const widgetInputs = s.inputs.filter(i => ['INT', 'FLOAT', 'STRING', 'BOOLEAN', 'COMBO'].includes(i.type));
  const instVal = name => inst.widgets_values[widgetInputs.findIndex(i => i.name === name)];
  const NAMES = {
    UNETLoader: ['unet_name', 'weight_dtype'], CLIPLoader: ['clip_name', 'type', 'device'], VAELoader: ['vae_name'],
    TextEncodeQwenImage21: ['prompt', 'negative_prompt', 'resolution'], PrimitiveStringMultiline: ['value'], ComfySwitchNode: ['switch'],
    QwenImage21Cache: ['device', 'dtype'], EmptyLatentImage: ['width', 'height', 'batch_size'],
    KSampler: ['seed', null, 'steps', 'cfg', 'sampler_name', 'scheduler', 'denoise'],
    TextGenerate: ['prompt', 'max_length', 'sampling_mode', 'sampling_mode.temperature', 'sampling_mode.top_k', 'sampling_mode.top_p', 'sampling_mode.min_p', 'sampling_mode.repetition_penalty', 'sampling_mode.seed', 'sampling_mode.presence_penalty', 'thinking', 'use_default_template', 'mtp'],
  };
  for (const n of s.nodes) {
    if (!NAMES[n.type] && !['VAEDecode', 'PreviewAny'].includes(n.type)) continue;
    const inputs = {};
    (NAMES[n.type] || []).forEach((k, i) => { if (k) inputs[k] = n.widgets_values?.[i]; });
    for (const inp of n.inputs || []) {
      if (inp.link == null) continue;
      const l = s.links.find(x => x.id === inp.link);
      if (l.origin_id === -10) { inputs[inp.name] = instVal(s.inputs[l.origin_slot].name); continue; }
      inputs[inp.name] = [`${inst.id}:${l.origin_id}`, l.origin_slot];
    }
    out[`${inst.id}:${n.id}`] = { class_type: n.type, inputs, _meta: { title: n.title || n.type } };
  }
  return out;
}

const J = wf => JSON.stringify(wf);

export const CONTROLS = [
  { name: 'Official Text to Image template, PE on and wired for 0.38.0', workflow: () => J(t2iRepaired()) },
  { name: 'Official Image Edit template, PE system prompt connected, 24,000-token budget', workflow: () => J(editRepaired()) },
  { name: 'Official Remove Background template, as shipped (no PE)', workflow: () => J(load('background_removal')) },
  { name: 'Text to Image, repaired, exported in API format', workflow: () => J(toApi(t2iRepaired())) },
  { name: 'Text to Image, repaired, with a correct folder listing and ComfyUI 0.38.0', workflow: () => J(t2iRepaired()),
    listing: 'ComfyUI version: 0.38.0\nmodels/diffusion_models/qwen_image_2.1_int8_convrot.safetensors\nmodels/text_encoders/qwen3vl_8b_int8_convrot.safetensors\nmodels/text_encoders/qwen3.5_9b_qwen_image_2.1_pe_t2i.int8_convrot.safetensors\nmodels/vae/qwen_image_2.1_vae_bf16.safetensors' },
];

// type: files | nodes | pe | vram | outside. flaggedToday: what ComfyUI itself shows for this configuration.
export const REPORTED = [
  { id: 'R1', type: 'files', thread: 'Comfy-Org/Qwen-Image-2.1 #4 (hedomn)', report: 'Swapping the 3.5 9B PE in as the text encoder gives garbled images.',
    config: 'PE-T2I file in the text-encoder CLIPLoader', expect: 'files.pe-in-encoder', flaggedToday: 'no: loads and runs, image is garbled',
    workflow: () => { const wf = t2iRepaired(); setInstance(wf, 'clip_name', 'qwen3.5_9b_qwen_image_2.1_pe_t2i.int8_convrot.safetensors'); return J(wf); } },
  { id: 'R2', type: 'pe', thread: 'Comfy-Org/Qwen-Image-2.1 #4 (mcfadyeni, Rkss)', report: 'The PE was not trained to work without its system prompt; ComfyUI does not add it.',
    config: 'PE on, nothing connected to system_prompt, plain user prompt', expect: 'pe.no-system', flaggedToday: 'no: runs, output drifts',
    workflow: () => { const wf = t2iRepaired(); unlink(wf, 471, 'system_prompt'); return J(wf); } },
  { id: 'R3', type: 'pe', thread: 'Comfy-Org/Qwen-Image-2.1 #4 (Rkss)', report: '“Sometimes it just outputs its thinking process and run out of tokens.”',
    config: 'PE with thinking on and the node default max_length 512', expect: 'pe.max-tokens', flaggedToday: 'no: returns truncated thinking',
    workflow: () => { const wf = t2iRepaired(); setInstance(wf, 'thinking', true); setTG(wf, 471, 'max_length', 512); return J(wf); } },
  { id: 'R4', type: 'pe', thread: 'Comfy-Org/Qwen-Image-2.1 #4 (mcfadyeni)', report: 'With the official system prompt the answer is JSON; use JsonExtractString for rewritten_prompt.',
    config: 'Hand-built chat template with the official T2I system prompt, output wired straight to the encoder', expect: 'pe.json-unextracted', flaggedToday: 'no: JSON text becomes the image prompt',
    workflow: () => { const wf = t2iRepaired(); unlink(wf, 471, 'system_prompt'); setInstance(wf, 'prompt', `<|im_start|>system\n${T2I_SYSTEM_EXCERPT}<|im_end|>\n<|im_start|>user\nA red bicycle leaning on a wall<|im_end|>\n<|im_start|>assistant\n<think>\n`); return J(wf); } },
  { id: 'R5', type: 'nodes', thread: 'Comfy-Org/Qwen-Image-2.1 #4 (mcfadyeni, edit)', report: 'System prompt support was only just added in ComfyUI PR #16442.',
    config: 'system_prompt connected, running ComfyUI 0.37.0', expect: 'nodes.version', version: '0.37.0', flaggedToday: 'unclear: the link has no input to attach to',
    workflow: () => J(t2iRepaired()) },
  { id: 'R6', type: 'nodes', thread: 'Comfy-Org/Qwen-Image-2.1 #1 (ironico, IGLXX)', report: 'TextEncodeQwenImage21 and QwenImage21Cache missing on the latest release.',
    config: 'Official template on ComfyUI 0.36.0', expect: 'nodes.version', version: '0.36.0', flaggedToday: 'yes: missing-node warning, without the version to install',
    workflow: () => J(load('background_removal')) },
  { id: 'R7', type: 'files', thread: 'abenzerps/Qwen-Image-2.1-Uncensored-GGUF #33', report: 'The model is not showing up in the UNET loader (a .gguf file).',
    config: 'GGUF in models/diffusion_models, workflow uses the core UNETLoader', expect: 'files.gguf-listing', flaggedToday: 'partly: the file is just absent from the menu',
    listing: 'models/diffusion_models/qwen-image-2.1-UC-Q4_K_M.gguf\nmodels/text_encoders/qwen3vl_8b_int8_convrot.safetensors\nmodels/vae/qwen_image_2.1_vae_bf16.safetensors',
    workflow: () => J(t2iRepaired()) },
  { id: 'R8', type: 'files', thread: 'abenzerps/Qwen-Image-2.1-Uncensored-GGUF #33', report: 'FP8/NVFP4 .safetensors must use the standard UNETLoader, not the GGUF one.',
    config: 'qwen-image-2.1-UC-fp8.safetensors in UnetLoaderGGUF', expect: 'files.safetensors-in-gguf-loader', flaggedToday: 'partly: the file is absent from the menu',
    workflow: () => { const wf = t2iRepaired(); const n = inner(wf, 451); n.type = 'UnetLoaderGGUF'; n.widgets_values = ['qwen-image-2.1-UC-fp8.safetensors']; setInstance(wf, 'unet_name', 'qwen-image-2.1-UC-fp8.safetensors'); return J(wf); } },
  { id: 'R9', type: 'files', thread: 'unsloth/Qwen-Image-2.1-GGUF #5; abenzerps #17, #24, #31', report: '“Unexpected architecture type in GGUF file: ‘qwen_image21’” / “Unknown model architecture!”',
    config: 'qwen-image-2.1-Q4_K_M.gguf in UnetLoaderGGUF', expect: 'files.gguf-arch', flaggedToday: 'at run time: a ValueError with no fix',
    workflow: () => { const wf = t2iRepaired(); const n = inner(wf, 451); n.type = 'UnetLoaderGGUF'; n.widgets_values = ['qwen-image-2.1-Q4_K_M.gguf']; setInstance(wf, 'unet_name', 'qwen-image-2.1-Q4_K_M.gguf'); return J(wf); } },
  { id: 'R10', type: 'files', thread: 'unsloth/Qwen-Image-2.1-GGUF #5 (DevilsAintUs)', report: 'The FP8 VAE linked from a model card was rejected; the official VAE worked.',
    config: 'A repackaged FP8 VAE', expect: 'files.vae', assumption: 'file name assumed: the linked file is no longer listed', flaggedToday: 'yes at run time: “not the right vae”',
    workflow: () => { const wf = t2iRepaired(); setInstance(wf, 'vae_name', 'qwen_image_2.1_vae_fp8.safetensors'); return J(wf); } },
  { id: 'R11', type: 'pe', thread: 'Comfy-Org/Qwen-Image-2.1 #4 (Nadoon)', report: '“For edit just swap the PE to i2i.”',
    config: 'Image Edit workflow running the T2I PE with images connected', expect: 'pe.task', flaggedToday: 'no: runs',
    workflow: () => { const wf = editRepaired(); setInstance(wf, 'clip_name_1', 'qwen3.5_9b_qwen_image_2.1_pe_t2i.int8_convrot.safetensors'); return J(wf); } },
  { id: 'R12', type: 'vram', thread: 'Qwen/Qwen-Image-2.1 #36 (lol104; diagnosis by donaldJJ)', report: '35 minutes per image on a 24 GB machine; BF16 weights total about 33 GB.',
    config: 'BF16 diffusion model and BF16 text encoder on a 24 GB budget', expect: 'vram.no-coresidence-24', flaggedToday: 'no: runs slowly',
    workflow: () => { const wf = t2iRepaired(); setInstance(wf, 'unet_name', 'qwen_image_2.1_bf16.safetensors'); setInstance(wf, 'clip_name', 'qwen3vl_8b_bf16.safetensors'); return J(wf); } },
  // Reported, but the cause is not in the workflow file. The workflow for each is a clean one, so the checker cannot catch them.
  { id: 'M1', type: 'outside', thread: 'Comfy-Org/Qwen-Image-2.1 #6', report: 'Text inside generated images comes out garbled (one user: better with the PE on).', config: 'Clean workflow; cause not in the file', expect: null, flaggedToday: 'no', workflow: () => J(load('t2i')) },
  { id: 'M2', type: 'outside', thread: 'abenzerps/Qwen-Image-2.1-Uncensored-GGUF #22', report: 'Blank images with --use-sage-attention.', config: 'Launch flag, not in the workflow', expect: null, flaggedToday: 'no', workflow: () => J(t2iRepaired()) },
  { id: 'M3', type: 'outside', thread: 'abenzerps/Qwen-Image-2.1-Uncensored-GGUF #22', report: 'FP8 on Apple Silicon (MPS) gives white images.', config: 'Hardware, not in the workflow', expect: null, flaggedToday: 'no', workflow: () => J(t2iRepaired()) },
  { id: 'M4', type: 'outside', thread: 'Comfy-Org/ComfyUI #16498', report: 'Text encoder evicted from VRAM “but doesn’t offload to RAM”.', config: 'Runtime memory policy, not in the workflow', expect: null, flaggedToday: 'n/a', workflow: () => J(t2iRepaired()) },
  { id: 'M5', type: 'outside', thread: 'Comfy-Org/Qwen-Image-2.1 #4 (Rkss)', report: 'The PE node is slow (under 50 tokens/s vs >100 on llama.cpp).', config: 'Runtime speed, not in the workflow', expect: null, flaggedToday: 'n/a', workflow: () => J(t2iRepaired()) },
];

// Rules grounded in source code or Qwen's own docs rather than a thread report. Tested, but not counted toward the stop rule.
export const DOCUMENTED = [
  { id: 'D1', config: 'Official Text to Image template as shipped (PE switched off)', expect: 'pe.system-dropped', status: 'dormant', workflow: () => J(load('t2i')) },
  { id: 'D2', config: 'Official Image Edit template as shipped (PE on, system prompt node unconnected)', expect: 'pe.no-system', status: 'fail', workflow: () => J(load('image_edit')) },
  { id: 'D3', config: 'Text encoder CLIPLoader type set to stable_diffusion', expect: 'files.te-type', status: 'fail', workflow: () => { const wf = t2iRepaired(); inner(wf, 453).widgets_values[1] = 'stable_diffusion'; return J(wf); } },
  { id: 'D4', config: 'Older Qwen2.5-VL-7B text encoder with the 2.1 nodes', expect: 'files.te-old', status: 'fail', workflow: () => { const wf = t2iRepaired(); setInstance(wf, 'clip_name', 'qwen_2.5_vl_7b_fp8_scaled.safetensors'); return J(wf); } },
  { id: 'D5', config: 'Edit system prompt given to the T2I PE', expect: 'pe.prompt-mismatch', status: 'fail', workflow: () => { const wf = t2iRepaired(); inner(wf, 475).widgets_values[0] = '# Edit Prompt Enhancer — General (v2)\n…'; return J(wf); } },
  { id: 'D6', config: 'System prompt text still wrapped in <|im_start|>system … <|im_end|>, default template on', expect: 'pe.double-wrap', status: 'warn', workflow: () => { const wf = load('t2i'); setInstance(wf, 'switch', true); setTG(wf, 471, 'use_default_template', true); setTG(wf, 471, 'presence_penalty', 1.5); return J(wf); } },
  { id: 'D7', config: 'Hand-built chat template with a leading newline', expect: 'pe.leading-space', status: 'fail', workflow: () => { const wf = t2iRepaired(); unlink(wf, 471, 'system_prompt'); setInstance(wf, 'prompt', `\n<|im_start|>system\n${T2I_SYSTEM_EXCERPT}<|im_end|>\n<|im_start|>user\nA cat<|im_end|>\n<|im_start|>assistant\n`); return J(wf); } },
  { id: 'D8', config: 'PE file sitting in models/diffusion_models/', expect: 'files.folder', status: 'fail', workflow: () => J(t2iRepaired()), listing: 'models/diffusion_models/qwen3.5_9b_qwen_image_2.1_pe_t2i.int8_convrot.safetensors\nmodels/diffusion_models/qwen_image_2.1_int8_convrot.safetensors' },
  { id: 'D9', config: 'The 2.1 diffusion model file is a Diffusers shard', expect: 'files.shard', status: 'fail', workflow: () => { const wf = t2iRepaired(); setInstance(wf, 'unet_name', 'diffusion_pytorch_model-00001-of-00002.safetensors'); return J(wf); } },
  { id: 'D10', config: 'Official Image Edit template with only the system prompt node connected (use_default_template still off)', expect: 'pe.system-dropped', status: 'fail', workflow: () => { const wf = load('image_edit'); link(wf, 479, 0, 500, 'system_prompt'); return J(wf); } },
];

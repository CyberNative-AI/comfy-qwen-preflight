// Qwen-Image-2.1 workflow preflight. Pure functions, no network, no storage.
// Every rule names the primary source it rests on (SOURCES below); line numbers refer to the tagged files.
import { CORE_NODES_V038, ADDED_IN } from './core-nodes.js';

export const SOURCES = {
  comfyRepo: { label: 'Comfy-Org/Qwen-Image-2.1: file list and folder map', url: 'https://huggingface.co/Comfy-Org/Qwen-Image-2.1' },
  peT2i: { label: 'Qwen/Qwen-Image-2.1-PE-T2I: system_prompt.txt', url: 'https://huggingface.co/Qwen/Qwen-Image-2.1-PE-T2I/blob/main/system_prompt.txt' },
  peI2i: { label: 'Qwen/Qwen-Image-2.1-PE-I2I: system_prompt.txt', url: 'https://huggingface.co/Qwen/Qwen-Image-2.1-PE-I2I/blob/main/system_prompt.txt' },
  peCore: { label: 'Qwen-Image-2.1 pe_core.py: sampling profiles and answer contract', url: 'https://github.com/QwenLM/Qwen-Image-2.1/blob/main/prompt_rewrite/pe_core.py' },
  textgen: { label: 'ComfyUI v0.38.0 nodes_textgen.py, TextGenerate line 56', url: 'https://github.com/Comfy-Org/ComfyUI/blob/v0.38.0/comfy_extras/nodes_textgen.py#L56' },
  qwen35: { label: 'ComfyUI v0.38.0 qwen35.py, chat template lines 1040–1067', url: 'https://github.com/Comfy-Org/ComfyUI/blob/v0.38.0/comfy/text_encoders/qwen35.py#L1040-L1067' },
  sd: { label: 'ComfyUI v0.38.0 sd.py, text encoder detection lines 1955–1993', url: 'https://github.com/Comfy-Org/ComfyUI/blob/v0.38.0/comfy/sd.py#L1955-L1993' },
  nodesQwen: { label: 'ComfyUI v0.37.0 nodes_qwen.py: TextEncodeQwenImage21, QwenImage21Cache', url: 'https://github.com/Comfy-Org/ComfyUI/blob/v0.37.0/comfy_extras/nodes_qwen.py' },
  pr16400: { label: 'ComfyUI PR #16400: Qwen-Image 2.1 support, merged 2026-09-19', url: 'https://github.com/Comfy-Org/ComfyUI/pull/16400' },
  pr16442: { label: 'ComfyUI PR #16442: TextGenerate system_prompt input, merged 2026-09-22', url: 'https://github.com/Comfy-Org/ComfyUI/pull/16442' },
  releases: { label: 'ComfyUI releases: v0.37.0 2026-09-21, v0.38.0 2026-09-29', url: 'https://github.com/Comfy-Org/ComfyUI/releases' },
  folders: { label: 'ComfyUI v0.38.0 folder_paths.py lines 29–31', url: 'https://github.com/Comfy-Org/ComfyUI/blob/v0.38.0/folder_paths.py#L29-L31' },
  ggufLoader: { label: 'city96/ComfyUI-GGUF loader.py: IMG_ARCH_LIST has no qwen_image21', url: 'https://github.com/city96/ComfyUI-GGUF/blob/main/loader.py#L12' },
  ggufFiles: { label: 'unsloth/Qwen-Image-2.1-GGUF: file list', url: 'https://huggingface.co/unsloth/Qwen-Image-2.1-GGUF' },
  fp8Files: { label: 'unsloth/Qwen-Image-2.1-FP8: file list', url: 'https://huggingface.co/unsloth/Qwen-Image-2.1-FP8' },
  jsonNode: { label: 'ComfyUI v0.38.0 nodes_string.py: JsonExtractString', url: 'https://github.com/Comfy-Org/ComfyUI/blob/v0.38.0/comfy_extras/nodes_string.py#L410' },
  templates: { label: 'Comfy-Org/workflow_templates: Qwen Image 2.1 templates', url: 'https://github.com/Comfy-Org/workflow_templates/tree/main/templates' },
  pr1298: { label: 'Comfy-Org/workflow_templates PR #1298: Qwen Image 2.1 PE settings, merged 2026-09-30', url: 'https://github.com/Comfy-Org/workflow_templates/pull/1298' },
  thread4: { label: 'Comfy-Org/Qwen-Image-2.1 discussion #4', url: 'https://huggingface.co/Comfy-Org/Qwen-Image-2.1/discussions/4' },
  thread1: { label: 'Comfy-Org/Qwen-Image-2.1 discussion #1', url: 'https://huggingface.co/Comfy-Org/Qwen-Image-2.1/discussions/1' },
  ggufThread: { label: 'unsloth/Qwen-Image-2.1-GGUF discussion #5', url: 'https://huggingface.co/unsloth/Qwen-Image-2.1-GGUF/discussions/5' },
};

// Byte sizes are from the Hugging Face file listings read 2026-09-29.
const KNOWN_FILES = {
  'qwen_image_2.1_bf16.safetensors': 14230280616,
  'qwen_image_2.1_int8_convrot.safetensors': 7256783064,
  'qwen_image_2.1_fun_controlnet_union_bf16.safetensors': 7550977992,
  'qwen_image_2.1_fun_controlnet_union_int8_convrot.safetensors': 3779298944,
  'qwen3.5_9b_qwen_image_2.1_pe_i2i.int8_convrot.safetensors': 9471072252,
  'qwen3.5_9b_qwen_image_2.1_pe_t2i.int8_convrot.safetensors': 9471072252,
  'qwen3vl_8b_bf16.safetensors': 17534334616,
  'qwen3vl_8b_int8_convrot.safetensors': 9350798360,
  'qwen3vl_8b_w4a8.safetensors': 6312105364,
  'qwen_image_2.1_vae_bf16.safetensors': 675509688,
  'qwen-image-2.1-f16.gguf': 14230275808, 'qwen-image-2.1-q2_k.gguf': 2466137824, 'qwen-image-2.1-q3_k_m.gguf': 3168290528,
  'qwen-image-2.1-q3_k_s.gguf': 2724742880, 'qwen-image-2.1-q3_k_xl.gguf': 3612493536, 'qwen-image-2.1-q4_k_m.gguf': 4199565024,
  'qwen-image-2.1-q4_k_s.gguf': 3906356960, 'qwen-image-2.1-q5_k_m.gguf': 5390223072, 'qwen-image-2.1-q5_k_s.gguf': 4501948128,
  'qwen-image-2.1-q6_k.gguf': 6271551200, 'qwen-image-2.1-q6_k_xl.gguf': 6718506720, 'qwen-image-2.1-q8_0.gguf': 7640860384,
  'qwen-image-2.1-fp8.safetensors': 7122877560, 'qwen-image-2.1-int8.safetensors': 7258361376,
  'qwen-image-2.1-text_encoder-fp8.safetensors': 9394530592,
};

// Role → where it goes. Folders from the Comfy-Org README; unet/ and clip/ are legacy aliases (folder_paths.py).
export const ROLES = {
  pe: { stage: 'pe', label: 'prompt enhancer (PE)', loader: 'CLIPLoader', field: 'clip_name', folder: 'text_encoders', folders: ['text_encoders', 'clip'], use: 'the clip input of Generate Text (TextGenerate)' },
  te: { stage: 'te', label: 'text encoder (Qwen3-VL-8B)', loader: 'CLIPLoader', field: 'clip_name', folder: 'text_encoders', folders: ['text_encoders', 'clip'], use: 'the clip input of Text Encode Qwen Image 2.1' },
  dit: { stage: 'dit', label: 'diffusion model', loader: 'UNETLoader', field: 'unet_name', folder: 'diffusion_models', folders: ['diffusion_models', 'unet'], use: 'Load Diffusion Model' },
  vae: { stage: 'vae', label: 'VAE', loader: 'VAELoader', field: 'vae_name', folder: 'vae', folders: ['vae'], use: 'Load VAE' },
  controlnet: { stage: null, label: 'ControlNet patch', loader: 'ModelPatchLoader', field: 'name', folder: 'model_patches', folders: ['model_patches'], use: 'Load Model Patch' },
};

const LOADERS = {
  UNETLoader: { field: 'unet_name', kind: 'dit' },
  UnetLoaderGGUF: { field: 'unet_name', kind: 'dit', gguf: true },
  UnetLoaderGGUFAdvanced: { field: 'unet_name', kind: 'dit', gguf: true },
  CLIPLoader: { field: 'clip_name', kind: 'clip' },
  CLIPLoaderGGUF: { field: 'clip_name', kind: 'clip', gguf: true },
  VAELoader: { field: 'vae_name', kind: 'vae' },
  ModelPatchLoader: { field: 'name', kind: 'patch' },
};
const KIND_OF_ROLE = { pe: 'clip', te: 'clip', teOld: 'clip', llm: 'clip', dit: 'dit', ditOld: 'dit', vae: 'vae', vaeOld: 'vae', controlnet: 'patch' };
const LOADER_FOR_KIND = { dit: 'UNETLoader', clip: 'CLIPLoader', vae: 'VAELoader', patch: 'ModelPatchLoader' };

// Widget order per node type, as the UI format stores widgets_values. From each node's schema at v0.38.0.
const WIDGETS = {
  UNETLoader: ['unet_name', 'weight_dtype'], UnetLoaderGGUF: ['unet_name'],
  UnetLoaderGGUFAdvanced: ['unet_name', 'dequant_dtype', 'patch_dtype', 'patch_on_device'],
  CLIPLoader: ['clip_name', 'type', 'device'], CLIPLoaderGGUF: ['clip_name', 'type'],
  DualCLIPLoader: ['clip_name1', 'clip_name2', 'type', 'device'], VAELoader: ['vae_name'], ModelPatchLoader: ['name'],
  TextEncodeQwenImage21: ['prompt', 'negative_prompt', 'resolution'], TextEncodeQwenImageEdit: ['prompt'],
  TextEncodeQwenImageEditPlus: ['prompt'], CLIPTextEncode: ['text'],
  PrimitiveStringMultiline: ['value'], PrimitiveString: ['value'], PrimitiveBoolean: ['value'], PrimitiveInt: ['value'],
  PrimitiveFloat: ['value'], PrimitiveNode: ['value'], StringConcatenate: ['string_a', 'string_b', 'delimiter'],
  JsonExtractString: ['json_string', 'key'], ComfySwitchNode: ['switch'], QwenImage21Cache: ['device', 'dtype'],
  KSampler: ['seed', 'control_after_generate', 'steps', 'cfg', 'sampler_name', 'scheduler', 'denoise'],
};
const SAMPLING_ON = ['temperature', 'top_k', 'top_p', 'min_p', 'repetition_penalty', 'seed', 'presence_penalty'];
const CONTROL_VALUES = new Set(['fixed', 'increment', 'decrement', 'randomize']);
const FRONTEND_ONLY = new Set(['Note', 'MarkdownNote', 'Reroute', 'PrimitiveNode', 'GroupNode', 'Label (rgthree)']);
const ENCODERS = { TextEncodeQwenImage21: ['prompt', 'negative_prompt'], TextEncodeQwenImageEdit: ['prompt'], TextEncodeQwenImageEditPlus: ['prompt'], CLIPTextEncode: ['text'] };
const PE_PROFILE = { // pe_core.py PROFILES
  t2i: { maxTokens: 16256, presencePenalty: 1.5, temperature: 1.0, topP: 0.95, topK: 20 },
  i2i: { maxTokens: 24000, presencePenalty: 0.0, temperature: 1.0, topP: 0.95, topK: 20 },
};
// Measured on the official Text to Image template, ComfyUI 0.38.0, RTX 3090, 2 prompts with fixed seeds, max_length 4096 (2026-09-30):
// no system turn reached the PE; it still finished, with a 22-39% shorter final prompt and no runaway. Too few runs to claim more.
// All four runs (with and without the system prompt) finished under the 4,096 cap, using 834-1,850 tokens for thinking plus the final prompt.
// Below that budget we have no clean run, so a shorter max_length warns; at or above it, a gap to Qwen's figure is a note.
// The Image Edit PE has not been run, so its budget is never called short or safe.
const MEASURED_BUDGET = 4096;
const T2I_USE = '834–1,850';
const WITHOUT_SYSTEM = 'Without it the PE still writes a prompt, but a different one: in our test of the official Text to Image template it came out 22–39% shorter.';

// Signature headings of the two official system prompts (first line of each system_prompt.txt; the template copies keep them).
const PROMPT_FAMILY = { t2i: /Image Prompt Rewriting Expert/i, i2i: /Edit Prompt Enhancer/i };

// ---------------------------------------------------------------- files

export function classifyFile(name) {
  if (typeof name !== 'string' || !name.trim()) return null;
  const base = name.trim().split(/[\\/]/).pop();
  const s = base.toLowerCase();
  const ext = (s.match(/\.([a-z0-9]+)$/) || [])[1] || '';
  if (!['safetensors', 'sft', 'gguf', 'ckpt', 'pt', 'pth', 'bin'].includes(ext)) return null;
  const q21 = /qwen[_-]?image[_-]?2[._]?1/.test(s);
  const out = (role, extra = {}) => ({ name: base, role, ext, gguf: ext === 'gguf', q21, bytes: KNOWN_FILES[s] ?? null, ...extra });
  if (/diffusion_pytorch_model|^model-\d{5}(-of-\d{5})?\.safetensors$/.test(s)) return out('shard');
  if (/pe[_-]?t2i/.test(s)) return out('pe', { task: 't2i' });
  if (/pe[_-]?i2i/.test(s)) return out('pe', { task: 'i2i' });
  if (/qwen[_-]?2[._]?5[_-]?vl|qwen25[_-]?vl/.test(s)) return out('teOld');
  if (/qwen3[_-]?vl[_-]?8b|qwen3-vl-8b/.test(s) || (q21 && /text[_-]?encoder/.test(s))) return out('te');
  if (/qwen3[._]?5/.test(s)) return out('llm');
  if (/vae/.test(s)) return out(q21 ? 'vae' : /qwen[_-]?image/.test(s) ? 'vaeOld' : 'vaeOther');
  if (q21 && /controlnet|model[_-]?patch/.test(s)) return out('controlnet');
  if (q21 && /lora/.test(s)) return out('lora');
  if (q21) return out('dit');
  if (/qwen[_-]?image/.test(s) && !/lora/.test(s)) return out('ditOld');
  return null;
}

// Folder listing / filenames / startup log. Accepts `ls -l`, `dir`, `find`, tree output or bare names.
export function parseListing(text) {
  const files = [];
  let version = null;
  if (typeof text !== 'string' || !text.trim()) return { files, version };
  const v = text.match(/ComfyUI\s+version:?\s*v?(\d+\.\d+\.\d+)/i) || text.match(/^\s*v?(\d+\.\d+\.\d+)\s*$/m);
  if (v) version = v[1];
  let folder = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[│├└─┬┐┌┘┤┴┼📂]/g, ' ').trimEnd();
    const dir = line.match(/(?:^|[\\/\s])(diffusion_models|unet|text_encoders|clip|vae|model_patches|loras|checkpoints)[\\/:]?\s*$/i);
    if (dir && !/\.(safetensors|gguf|sft|ckpt|pt|pth|bin)\b/i.test(line)) { folder = dir[1].toLowerCase(); continue; }
    const m = line.match(/([^\s\\/"'`]+\.(?:safetensors|gguf|sft|ckpt|pt|pth|bin))\b/i);
    if (!m) continue;
    const pathPart = line.slice(0, m.index + m[0].length);
    const inPath = pathPart.match(/(?:^|[\\/\s])(diffusion_models|unet|text_encoders|clip|vae|model_patches|loras|checkpoints)[\\/][^\\/]*$/i);
    const size = line.match(/(?:^|\s)(\d{7,})(?:\s|$)/);
    files.push({ name: m[1], folder: inPath ? inPath[1].toLowerCase() : folder, bytes: size ? Number(size[1]) : null });
  }
  return { files, version };
}

// ---------------------------------------------------------------- workflow parsing

export function parseWorkflow(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) {
    return { error: 'not-json', message: `This is not valid JSON (${String(e.message).replace(/^JSON\.parse: /, '')}).` };
  }
  if (data && typeof data === 'object' && data.workflow && Array.isArray(data.workflow.nodes)) data = data.workflow;
  if (data && Array.isArray(data.nodes)) return parseUi(data);
  if (data && typeof data === 'object' && data.prompt && typeof data.prompt === 'object' && !Array.isArray(data.prompt)) data = data.prompt;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data).filter(([, n]) => n && typeof n === 'object' && typeof n.class_type === 'string');
    if (entries.length) return parseApi(Object.fromEntries(entries));
  }
  return { error: 'not-workflow', message: 'This JSON is not a ComfyUI workflow. Export it from ComfyUI with Workflow › Export, or Export (API).' };
}

function makeGraph(format) {
  const g = { format, nodes: [], byKey: new Map(), edges: [], subgraphs: 0 };
  g.add = n => { g.nodes.push(n); g.byKey.set(n.key, n); return n; };
  return g;
}

function widgetMap(type, values) {
  if (values && typeof values === 'object' && !Array.isArray(values)) return { ...values };
  const out = {};
  if (!Array.isArray(values)) return out;
  if (type === 'TextGenerate') {
    [out.prompt, out.max_length, out.sampling_mode] = values;
    let i = 3;
    if (out.sampling_mode === 'on') {
      for (const name of SAMPLING_ON) {
        if (typeof values[i] === 'boolean' || i >= values.length) break;
        out[name] = values[i++];
        if (name === 'seed' && CONTROL_VALUES.has(values[i])) i++;
      }
    }
    const rest = values.slice(i);
    const bools = rest.filter(v => typeof v === 'boolean');
    if (bools.length > 0) out.thinking = bools[0];
    if (bools.length > 1) out.use_default_template = bools[1];
    const mtp = rest.find(v => typeof v === 'string');
    if (mtp !== undefined) out.mtp = mtp;
    return out;
  }
  const names = WIDGETS[type];
  if (names) names.forEach((name, i) => { if (i < values.length) out[name] = values[i]; });
  else values.forEach((v, i) => { out[`#${i}`] = v; });
  return out;
}

const WIDGET_TYPES = new Set(['INT', 'FLOAT', 'STRING', 'BOOLEAN', 'COMBO']);
const linkObj = l => Array.isArray(l) ? { id: l[0], origin_id: l[1], origin_slot: l[2], target_id: l[3], target_slot: l[4], type: l[5] } : l;

function parseUi(data) {
  const g = makeGraph('ui');
  const defs = new Map((data.definitions?.subgraphs || []).map(d => [d.id, d]));
  const scopes = [];
  const build = (raw, def, parent, instance, prefix, active) => {
    const scope = { raw, def, parent, instance, prefix, nodes: new Map(), links: new Map(), children: new Map() };
    for (const l of raw.links || []) { const o = linkObj(l); if (o) scope.links.set(o.id, o); }
    scopes.push(scope);
    for (const rn of raw.nodes || []) {
      scope.nodes.set(rn.id, rn);
      const on = active && (rn.mode === undefined || rn.mode === 0);
      if (defs.has(rn.type)) {
        g.subgraphs++;
        scope.children.set(rn.id, build(defs.get(rn.type), defs.get(rn.type), scope, rn, `${prefix}${rn.id}:`, on));
        continue;
      }
      g.add({ key: `${prefix}${rn.id}`, id: `${prefix}${rn.id}`, type: rn.type, title: rn.title || null, active: on, scope, raw: rn, widgets: widgetMap(rn.type, rn.widgets_values) });
    }
    return scope;
  };
  build(data, null, null, null, '', true);

  const instanceValue = (scope, name) => {
    const inst = scope.instance;
    const widgetInputs = (scope.def.inputs || []).filter(i => WIDGET_TYPES.has(i.type) || Array.isArray(i.type));
    const idx = widgetInputs.findIndex(i => i.name === name);
    const vals = inst.widgets_values;
    if (vals && !Array.isArray(vals) && typeof vals === 'object') return vals[name];
    return idx >= 0 && Array.isArray(vals) ? vals[idx] : undefined;
  };
  const resolveLink = (scope, linkId, depth = 0) => {
    if (linkId == null || depth > 64) return { kind: 'none' };
    const link = scope.links.get(linkId);
    if (!link) return { kind: 'none' };
    if (link.origin_id === -10) {
      const name = scope.def?.inputs?.[link.origin_slot]?.name;
      const outer = (scope.instance.inputs || []).find(i => i.name === name);
      if (outer && outer.link != null) return resolveLink(scope.parent, outer.link, depth + 1);
      return { kind: 'value', value: instanceValue(scope, name) };
    }
    const rn = scope.nodes.get(link.origin_id);
    if (!rn) return { kind: 'none' };
    if (scope.children.has(rn.id)) {
      const inner = scope.children.get(rn.id);
      const out = inner.def.outputs?.[link.origin_slot];
      const innerLink = out?.linkIds?.[0];
      return resolveLink(inner, innerLink, depth + 1);
    }
    if (rn.type === 'Reroute') return resolveLink(scope, (rn.inputs || [])[0]?.link, depth + 1);
    if (rn.type === 'PrimitiveNode') return { kind: 'value', value: Array.isArray(rn.widgets_values) ? rn.widgets_values[0] : undefined };
    const node = g.byKey.get(`${scope.prefix}${rn.id}`);
    return node ? { kind: 'link', node, slot: link.origin_slot, outName: rn.outputs?.[link.origin_slot]?.name } : { kind: 'none' };
  };
  for (const n of g.nodes) {
    n.inputs = {};
    for (const inp of n.raw.inputs || []) {
      if (inp.link == null) continue;
      const r = resolveLink(n.scope, inp.link);
      n.inputs[inp.name] = r;
      if (r.kind === 'link') g.edges.push({ from: r.node, slot: r.slot, outName: r.outName, to: n, input: inp.name });
    }
  }
  finish(g);
  return g;
}

function parseApi(data) {
  const g = makeGraph('api');
  for (const [id, rn] of Object.entries(data)) {
    const widgets = {};
    for (const [k, v] of Object.entries(rn.inputs || {})) {
      if (isApiLink(v)) continue;
      widgets[k] = v;
      if (k.includes('.')) widgets[k.split('.').pop()] = v;
    }
    if (rn.class_type === 'TextGenerate' && widgets.sampling_mode && typeof widgets.sampling_mode === 'object') {
      Object.assign(widgets, widgets.sampling_mode);
      widgets.sampling_mode = widgets.sampling_mode.sampling_mode ?? 'on';
    }
    g.add({ key: id, id, type: rn.class_type, title: rn._meta?.title || null, active: true, raw: rn, widgets });
  }
  for (const n of g.nodes) {
    n.inputs = {};
    for (const [k, v] of Object.entries(n.raw.inputs || {})) {
      if (!isApiLink(v)) continue;
      const from = g.byKey.get(String(v[0]));
      if (!from) continue;
      const r = { kind: 'link', node: from, slot: v[1] };
      n.inputs[k] = r;
      if (k.includes('.')) n.inputs[k.split('.').pop()] = r;
      g.edges.push({ from, slot: v[1], to: n, input: k.split('.').pop() });
    }
  }
  finish(g);
  return g;
}
const isApiLink = v => Array.isArray(v) && v.length === 2 && (typeof v[0] === 'string' || typeof v[0] === 'number') && Number.isInteger(v[1]);

function finish(g) {
  g.value = (n, name) => {
    const r = n.inputs?.[name];
    if (r && r.kind === 'value') return r.value;
    if (r && r.kind === 'link') return undefined;
    return n.widgets?.[name];
  };
  g.consumers = (n, slot) => g.edges.filter(e => e.from === n && (slot === undefined || e.slot === slot));
  g.origin = (n, name) => { const r = n.inputs?.[name]; return r && r.kind === 'link' ? r : null; };
  g.label = n => `#${n.id} ${n.title && n.title !== n.type ? `“${n.title}” (${n.type})` : n.type}`;
}

// Resolve a STRING input to text where the graph makes that possible.
function stringOf(g, n, name, depth = 0) {
  const r = n.inputs?.[name];
  if (!r) { const v = n.widgets?.[name]; return typeof v === 'string' ? { text: v } : { text: null }; }
  if (r.kind === 'value') return { text: typeof r.value === 'string' ? r.value : null };
  if (r.kind !== 'link' || depth > 16) return { text: null };
  const src = r.node;
  if (/^Primitive(String|StringMultiline|Node)$/.test(src.type)) return stringOf(g, src, 'value', depth + 1);
  if (src.type === 'StringConcatenate') {
    const a = stringOf(g, src, 'string_a', depth + 1), b = stringOf(g, src, 'string_b', depth + 1);
    const d = g.value(src, 'delimiter') ?? '';
    return { text: a.text != null && b.text != null ? a.text + d + b.text : (a.text ?? null), partial: a.text == null || b.text == null };
  }
  return { text: null, from: src };
}

// ---------------------------------------------------------------- checks

const cmpVersion = (a, b) => {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); }
  return 0;
};
const GIB = 1024 ** 3;
export const gib = b => b / GIB;

export function check(workflowText, listingText = '', opts = {}) {
  const g = parseWorkflow(workflowText);
  if (g.error) return { ok: false, error: g.error, message: g.message };
  const listing = parseListing(listingText);
  const version = (opts.version && String(opts.version).match(/\d+\.\d+\.\d+/)?.[0]) || listing.version || null;
  const findings = [];
  const add = f => { findings.push({ status: 'fail', sources: [], ...f }); };
  const passes = [];
  const pass = (id, title, sources = []) => passes.push({ id, status: 'pass', title, sources });

  // Loaders and the files they hold.
  const loads = [];
  for (const n of g.nodes) {
    const L = LOADERS[n.type];
    if (!L) continue;
    const name = g.value(n, L.field);
    loads.push({ node: n, loader: n.type, L, name, file: classifyFile(name) });
  }
  const encoders = g.nodes.filter(n => ENCODERS[n.type]);
  const textGens = g.nodes.filter(n => n.type === 'TextGenerate');
  const isQwen21 = loads.some(l => l.file?.q21 || l.file?.role === 'pe') || g.nodes.some(n => /QwenImage21/.test(n.type)) || listing.files.some(f => classifyFile(f.name)?.q21);
  if (!isQwen21) {
    return { ok: true, format: g.format, notQwen: true, nodeCount: g.nodes.length, findings: [], passes: [], slots: [], vram: null, version, listing };
  }

  // Where does each CLIP loader's output go?
  const clipUse = ld => {
    const seen = new Set(); const uses = { encode: [], generate: [] };
    const walk = (n, depth) => {
      for (const e of g.consumers(n)) {
        if (seen.has(e.to) || depth > 8) continue;
        seen.add(e.to);
        if (ENCODERS[e.to.type] && e.input === 'clip') uses.encode.push(e.to);
        else if (e.to.type === 'TextGenerate' && e.input === 'clip') uses.generate.push(e.to);
        else if (/Lora|Switch|CLIPSetLastLayer/i.test(e.to.type)) walk(e.to, depth + 1);
      }
    };
    walk(ld.node, 0);
    return uses;
  };

  // --- 1. Files in loaders
  let fileProblems = 0;
  for (const ld of loads) {
    const f = ld.file;
    const where = g.label(ld.node);
    if (!ld.name) continue;
    if (!f) continue;
    if (f.role === 'shard') {
      add({ id: 'files.shard', area: 'files', stage: stageOfLoader(ld), node: where, title: `${f.name} is one shard of a Diffusers checkpoint`, detail: 'ComfyUI loaders expect a single-file checkpoint. The Qwen/… repos ship Diffusers shards; the Comfy-Org/Qwen-Image-2.1 repo ships the single files ComfyUI loads.', fix: 'Download the single-file version from Comfy-Org/Qwen-Image-2.1 instead.', sources: ['comfyRepo'] });
      fileProblems++; continue;
    }
    if (f.gguf && !ld.L.gguf) {
      const gl = ld.L.kind === 'clip' ? 'CLIPLoaderGGUF' : 'UnetLoaderGGUF';
      add({ id: 'files.gguf-in-core-loader', area: 'files', stage: stageOfLoader(ld), node: where, title: `${f.name} is a GGUF file in ${ld.loader}`, detail: `${ld.loader} only lists .safetensors-style files, so a GGUF never shows up in its menu.`, fix: `Load it with ${gl} (the ComfyUI-GGUF custom node pack), or pick a .safetensors file here.`, sources: ['folders', 'ggufFiles'] });
      fileProblems++; continue;
    }
    if (!f.gguf && ld.L.gguf) {
      add({ id: 'files.safetensors-in-gguf-loader', area: 'files', stage: stageOfLoader(ld), node: where, title: `${f.name} is not a GGUF file, but ${ld.loader} loads only GGUF`, detail: 'FP8, INT8 and BF16 .safetensors files load with the standard loader, not the GGUF one.', fix: `Use ${LOADER_FOR_KIND[ld.L.kind]} for this file.`, sources: ['comfyRepo'] });
      fileProblems++; continue;
    }
    const kind = KIND_OF_ROLE[f.role];
    if (kind && kind !== ld.L.kind) {
      const role = ROLES[f.role] || ROLES[f.role.replace(/Old$/, '')];
      add({ id: 'files.wrong-loader', area: 'files', stage: stageOfLoader(ld), node: where, title: `${f.name} is a ${role?.label || f.role} in ${ld.loader}`, detail: `${ld.loader} (${ld.L.field}) loads a ${ld.L.kind === 'clip' ? 'text encoder' : ld.L.kind === 'dit' ? 'diffusion model' : ld.L.kind}. This file is ${role?.label || f.role}.`, fix: role ? `Put it in ${role.loader} (${role.field}), from models/${role.folder}/.` : `Load it with ${LOADER_FOR_KIND[kind]}.`, sources: ['comfyRepo'] });
      fileProblems++; continue;
    }
    if (ld.L.kind === 'clip') {
      const uses = clipUse(ld);
      if ((f.role === 'pe' || f.role === 'llm') && uses.encode.length) {
        add({ id: 'files.pe-in-encoder', area: 'files', stage: 'te', node: where, title: f.role === 'pe' ? `The prompt enhancer is in the text-encoder slot` : `${f.name} is a Qwen3.5 language model in the text-encoder slot`,
          detail: `${f.name} feeds ${uses.encode.map(g.label).join(', ')}. ComfyUI loads a Qwen3.5 file as its own model type whatever the loader's type says, so it runs without an error and conditions the image on the wrong model. The result is garbled images.`,
          fix: `Load qwen3vl_8b (int8_convrot, bf16 or w4a8) here with type qwen_image. Use the PE file only in a second CLIPLoader that feeds Generate Text.`, sources: ['comfyRepo', 'sd', 'thread4'] });
        fileProblems++; continue;
      }
      if (f.role === 'te' && uses.generate.length && !uses.encode.length) {
        add({ id: 'files.encoder-as-pe', area: 'files', status: 'warn', stage: 'pe', node: where, title: 'The Qwen3-VL-8B text encoder is running as the prompt enhancer', detail: `${f.name} feeds Generate Text. That runs a general Qwen3-VL model, not the fine-tuned PE that Qwen publishes for this pipeline, and the official system prompts were written for the PE.`, fix: 'For prompt enhancement, load qwen3.5_9b_qwen_image_2.1_pe_t2i (text to image) or _pe_i2i (edit) in this CLIPLoader.', sources: ['comfyRepo', 'peCore'] });
        continue;
      }
      if (f.role === 'te' && uses.encode.length && ld.loader === 'CLIPLoader') {
        const type = g.value(ld.node, 'type');
        if (type && type !== 'qwen_image') {
          add({ id: 'files.te-type', area: 'files', stage: 'te', node: where, title: `The text encoder loader's type is “${type}”, not “qwen_image”`, detail: 'ComfyUI builds the Qwen-Image 2.1 text encoder from Qwen3-VL-8B only when the CLIPLoader type is qwen_image. Any other type loads the same file as a different model’s encoder, with no error.', fix: 'Set type to qwen_image on this CLIPLoader.', sources: ['sd'] });
          fileProblems++; continue;
        }
      }
      if (f.role === 'teOld' && (uses.encode.length || !uses.generate.length)) {
        add({ id: 'files.te-old', area: 'files', stage: 'te', node: where, title: `${f.name} is the older Qwen-Image text encoder`, detail: 'Qwen-Image 2.1 uses Qwen3-VL-8B as its text encoder, not Qwen2.5-VL-7B.', fix: 'Load qwen3vl_8b_int8_convrot.safetensors (or bf16 / w4a8) from Comfy-Org/Qwen-Image-2.1.', sources: ['comfyRepo', 'sd'] });
        fileProblems++; continue;
      }
    }
    if (ld.L.kind === 'vae' && (f.role === 'vaeOld' || f.role === 'vaeOther' || (f.role === 'vae' && f.name.toLowerCase() !== 'qwen_image_2.1_vae_bf16.safetensors'))) {
      const old = f.role === 'vaeOld';
      add({ id: 'files.vae', area: 'files', status: old ? 'fail' : 'warn', stage: 'vae', node: where, title: old ? `${f.name} is the older Qwen-Image VAE` : `${f.name} is not the VAE Comfy-Org ships for Qwen-Image 2.1`,
        detail: old ? 'Qwen-Image 2.1 samples a 64-channel latent (TextEncodeQwenImage21 builds it), which the older VAE cannot decode.' : 'Comfy-Org and Qwen ship one VAE for 2.1, in BF16. One user reported that ComfyUI rejected a repackaged FP8 VAE and the official file fixed it.',
        fix: 'Use qwen_image_2.1_vae_bf16.safetensors from Comfy-Org/Qwen-Image-2.1 (models/vae/).', sources: old ? ['comfyRepo', 'nodesQwen'] : ['comfyRepo', 'ggufThread'] });
      if (old) fileProblems++;
      continue;
    }
    if (ld.L.kind === 'dit' && f.role === 'ditOld' && g.nodes.some(n => /QwenImage21/.test(n.type))) {
      add({ id: 'files.dit-old', area: 'files', status: 'warn', stage: 'dit', node: where, title: `${f.name} looks like an earlier Qwen-Image model`, detail: 'This workflow uses the Qwen-Image 2.1 nodes, but the diffusion model file name has no “2.1”.', fix: 'Use qwen_image_2.1_int8_convrot.safetensors or qwen_image_2.1_bf16.safetensors (or a 2.1 GGUF with the GGUF loader).', sources: ['comfyRepo'] });
      continue;
    }
    if (f.gguf && ld.L.gguf && f.role === 'dit' && f.q21) {
      add({ id: 'files.gguf-arch', area: 'files', status: 'warn', stage: 'dit', node: where, title: 'Check that your GGUF loader knows Qwen-Image 2.1', detail: 'The stock city96/ComfyUI-GGUF loader has no qwen_image21 architecture. Users report “Unexpected architecture type in GGUF file: ‘qwen_image21’” or “Unknown model architecture!” with these files.', fix: 'Update the GGUF node pack to a version whose loader lists qwen_image21. The fixes reported in the threads were an updated fork or a small add-on. Read its code before installing.', sources: ['ggufLoader', 'ggufThread'] });
      continue;
    }
  }
  if (!fileProblems) pass('files.slots', 'Every model file sits in a loader that matches its role', ['comfyRepo']);

  // --- 1b. Folder listing
  if (listing.files.length) {
    const inWorkflow = new Set(loads.map(l => l.file?.name?.toLowerCase()).filter(Boolean));
    let folderProblems = 0;
    for (const lf of listing.files) {
      const f = classifyFile(lf.name);
      if (!f || !lf.folder) continue;
      const role = ROLES[f.role];
      if (f.gguf && f.role === 'dit' ? !['diffusion_models', 'unet'].includes(lf.folder) : role && !role.folders.includes(lf.folder)) {
        add({ id: 'files.folder', area: 'files', stage: role?.stage || null, node: `models/${lf.folder}/`, title: `${f.name} is in models/${lf.folder}/`, detail: `ComfyUI's loader for a ${role?.label || 'diffusion model'} reads models/${(role?.folders || ['diffusion_models', 'unet']).join('/ or models/')}/ only, so the file will not appear in its menu.`, fix: `Move it to models/${role?.folder || 'diffusion_models'}/ and press R (refresh) in ComfyUI.`, sources: ['comfyRepo', 'folders'] });
        folderProblems++;
      }
    }
    const listed = new Set(listing.files.map(f => f.name.toLowerCase()));
    const ggufListed = listing.files.map(f => classifyFile(f.name)).filter(f => f?.gguf && f.role === 'dit' && f.q21);
    const ditLoaders = loads.filter(l => l.L.kind === 'dit');
    if (ggufListed.length && ditLoaders.length && ditLoaders.every(l => !l.L.gguf)) {
      add({ id: 'files.gguf-listing', area: 'files', stage: 'dit', node: ditLoaders.map(l => g.label(l.node)).join(', '), title: `Your ${ggufListed[0].name} will not show up in ${ditLoaders[0].loader}`, detail: `You have a Qwen-Image 2.1 GGUF, but this workflow loads the diffusion model with ${ditLoaders[0].loader}, which lists only .safetensors-style files.`, fix: 'Replace it with Unet Loader (GGUF) from the ComfyUI-GGUF node pack, and read the architecture note that comes with it.', sources: ['folders', 'ggufFiles'] });
      folderProblems++;
    }
    const missing = [...inWorkflow].filter(n => !listed.has(n));
    if (missing.length && listing.files.length >= 2) {
      add({ id: 'files.missing', area: 'files', status: 'warn', stage: null, node: 'your listing', title: `${missing.length === 1 ? 'A file' : `${missing.length} files`} this workflow loads ${missing.length === 1 ? 'is' : 'are'} not in your listing`, detail: missing.join(', '), fix: 'Download the missing files, or pick the file you have in each loader. File names must match exactly.', sources: ['comfyRepo'] });
    }
    if (!folderProblems) pass('files.folders', 'Every listed model file is in the folder its loader reads', ['comfyRepo', 'folders']);
  }

  // --- 2. Nodes and ComfyUI version
  const types = [...new Set(g.nodes.map(n => n.type))];
  const custom = types.filter(t => !CORE_NODES_V038.has(t) && !FRONTEND_ONLY.has(t) && !/^[0-9a-f-]{36}$/.test(t));
  const needs = [];
  for (const t of types) if (ADDED_IN[t]) needs.push({ what: t, version: ADDED_IN[t].replace(/^v/, ''), since: ADDED_IN[t] === 'v0.37.0' ? { date: '2026-09-19', ref: 'pr16400' } : null });
  const sysLinked = textGens.filter(n => n.inputs?.system_prompt?.kind === 'link' || (n.inputs?.system_prompt?.kind === 'value' && n.inputs.system_prompt.value));
  if (sysLinked.length) needs.push({ what: 'the system_prompt input on Generate Text', version: '0.38.0', since: { date: '2026-09-22', ref: 'pr16442' } });
  const required = needs.reduce((m, x) => cmpVersion(x.version, m) > 0 ? x.version : m, '0.0.0');
  if (needs.length) {
    const byVer = v => needs.filter(x => x.version === v).map(x => x.what);
    const list = [...new Set(needs.map(x => x.version))].sort(cmpVersion).map(v => `${byVer(v).join(', ')}: ${v} or later`).join('; ');
    if (version && cmpVersion(version, required) < 0) {
      const short = needs.filter(x => cmpVersion(version, x.version) < 0);
      const git = short.map(x => x.since).filter(Boolean).sort((a, b) => a.date < b.date ? 1 : -1)[0];
      add({ id: 'nodes.version', area: 'nodes', stage: short.some(x => x.what.includes('system_prompt')) ? 'pe' : 'te', node: `ComfyUI ${version}`, title: `ComfyUI ${version} is too old for ${short.map(x => x.what).join(' and ')}`, detail: `Needs: ${list}.${git ? ` A git checkout updated after ${git.date} can still print ${version}: the number changes only at the next release.` : ''} ${short.some(x => x.what.includes('system_prompt')) ? 'On an older build the system prompt link has no input to attach to, so the PE runs without it.' : 'ComfyUI marks these nodes as missing. ComfyUI Manager cannot install them, because they are core nodes.'}`, fix: `Update ComfyUI to ${required} or later (for a git install, run git pull and restart). Desktop and portable builds update when the release reaches them.`, sources: ['releases', 'nodesQwen', ...(git ? [git.ref] : [])] });
    } else if (version) {
      pass('nodes.version', `ComfyUI ${version} has every core node this workflow uses (${list})`, ['releases', 'nodesQwen']);
    } else {
      add({ id: 'nodes.version', area: 'nodes', status: 'info', stage: null, node: 'ComfyUI version', title: `Needs ComfyUI ${required} or later`, detail: `${list}. Your version is on the startup log line “ComfyUI version: …”. Add it above to check it.`, fix: null, sources: ['releases', 'nodesQwen', ...(sysLinked.length ? ['pr16442'] : [])] });
    }
  }
  if (custom.length) {
    add({ id: 'nodes.custom', area: 'nodes', status: 'info', stage: null, node: `${custom.length} custom node type${custom.length > 1 ? 's' : ''}`, title: `Custom nodes: ${custom.join(', ')}`, detail: 'These are not part of ComfyUI itself. ComfyUI Manager can find and install missing custom nodes; this page cannot see which version you have installed.', fix: null, sources: ['releases'] });
  } else {
    pass('nodes.custom', 'No custom nodes: everything is core ComfyUI', ['releases']);
  }

  // --- 3. Prompt enhancer
  const peRuns = [];
  for (const tg of textGens) {
    const clipSrc = g.origin(tg, 'clip');
    const ld = clipSrc && loads.find(l => l.node === clipSrc.node);
    const file = ld?.file;
    if (!file || file.role !== 'pe') continue;
    peRuns.push({ tg, file, ld });
  }
  for (const { tg, file } of peRuns) {
    const task = file.task;
    const prof = PE_PROFILE[task];
    const where = g.label(tg);
    const route = outputRoute(g, tg);
    const dormant = route.state === 'off' || !tg.active;
    const st = s => (dormant && (s === 'fail' || s === 'warn')) ? 'dormant' : s;
    const offNote = dormant ? ` This branch is switched off now${route.switchNode ? ` (${g.label(route.switchNode)} is ${route.switchValue ? 'true' : 'false'})` : ''}; it breaks when you turn it on.` : '';
    const findingsBefore = findings.length;

    // System prompt: via the system_prompt input (v0.38+, default template on) or a raw prompt that starts with <|im_start|>system.
    const useDefault = g.value(tg, 'use_default_template');
    const useDefaultOn = useDefault !== false;
    const sysR = tg.inputs?.system_prompt;
    const sysText = sysR ? stringOf(g, tg, 'system_prompt').text : null;
    const promptText = stringOf(g, tg, 'prompt').text;
    const manual = typeof promptText === 'string' && promptText.startsWith('<|im_start|>system');
    const manualSpace = typeof promptText === 'string' && !manual && /^\s+<\|im_start\|>system/.test(promptText);
    let effective = null;
    if (manual) effective = promptText;
    else if (sysR && useDefaultOn) effective = sysText ?? '(linked text)';

    if (manualSpace) {
      add({ id: 'pe.leading-space', area: 'pe', status: st('fail'), stage: 'pe', node: where, title: 'The hand-built chat template starts with whitespace', detail: `ComfyUI treats the prompt as a raw chat template only when it starts exactly with <|im_start|>. Here it starts with whitespace, so ComfyUI wraps it in a second user turn and the system prompt becomes user text.${offNote}`, fix: 'Delete everything before <|im_start|>system.', sources: ['qwen35', 'thread4'] });
    } else if (sysR && !useDefaultOn && !manual) {
      add({ id: 'pe.system-dropped', area: 'pe', status: st('fail'), stage: 'pe', node: where, title: 'The system prompt is connected, but Generate Text drops it', detail: `use_default_template is off on this node. From v0.38.0 Generate Text passes system_prompt only when use_default_template is on (nodes_textgen.py line 56). The PE gets your prompt with no system prompt. ${WITHOUT_SYSTEM}${offNote}`, fix: `Turn use_default_template on (it is an advanced widget).${sysText && /^\s*<\|im_start\|>system/.test(sysText) ? ' Then delete the leading “<|im_start|>system” line and the trailing “<|im_end|>” from the system prompt text, because ComfyUI adds that wrapper itself.' : ''}`, sources: ['textgen', 'qwen35', task === 't2i' ? 'peT2i' : 'peI2i'] });
    } else if (!effective) {
      add({ id: 'pe.no-system', area: 'pe', status: st('fail'), stage: 'pe', node: where, title: `The ${task === 't2i' ? 'text-to-image' : 'edit'} PE runs without its system prompt`, detail: `Nothing supplies Qwen's system prompt to this Generate Text node. Qwen's own runner refuses to start without it, and the PE was trained with it. ${WITHOUT_SYSTEM}${offNote}`, fix: `Connect a String (Multiline) node holding the ${task === 't2i' ? 'PE-T2I' : 'PE-I2I'} system_prompt.txt to the system_prompt input (ComfyUI 0.38.0+), ${useDefaultOn ? 'with use_default_template on' : 'and turn use_default_template on. It is off here, and connecting the prompt alone still drops it'}. On 0.37, start the prompt with <|im_start|>system, then the system prompt, then <|im_end|>, then the user turn.`, sources: [task === 't2i' ? 'peT2i' : 'peI2i', 'peCore', 'textgen', 'thread4'] });
    } else {
      if (sysR && useDefaultOn && typeof sysText === 'string' && /^\s*<\|im_start\|>system/.test(sysText)) {
        add({ id: 'pe.double-wrap', area: 'pe', status: st('warn'), stage: 'pe', node: where, title: 'The system prompt text carries its own <|im_start|>system wrapper', detail: `Generate Text already wraps system_prompt in <|im_start|>system … <|im_end|>, so this text gets wrapped twice.${offNote}`, fix: 'Delete the leading “<|im_start|>system” line and the trailing “<|im_end|>” from the text.', sources: ['qwen35'] });
      }
      const other = task === 't2i' ? 'i2i' : 't2i';
      if (typeof effective === 'string' && PROMPT_FAMILY[other].test(effective) && !PROMPT_FAMILY[task].test(effective)) {
        add({ id: 'pe.prompt-mismatch', area: 'pe', status: st('fail'), stage: 'pe', node: where, title: `The ${task === 't2i' ? 'edit' : 'text-to-image'} system prompt is paired with the ${task === 't2i' ? 'text-to-image' : 'edit'} PE`, detail: `Each PE has its own system prompt. Qwen's code says they “are not interchangeable”, and a swapped prompt fails silently: fluent output, wrong contract.${offNote}`, fix: `Use system_prompt.txt from Qwen/Qwen-Image-2.1-PE-${task === 't2i' ? 'T2I' : 'I2I'}.`, sources: ['peCore', task === 't2i' ? 'peT2i' : 'peI2i'] });
      }
      if (typeof effective === 'string' && /rewritten_prompt/.test(effective) && route.state !== 'unused' && !route.json) {
        add({ id: 'pe.json-unextracted', area: 'pe', status: st('fail'), stage: 'pe', node: where, title: 'The PE answers in JSON, and the JSON goes straight into the image prompt', detail: `This system prompt asks for {"rewritten_prompt": …, "wh_ratio": …}. Without an extraction step, the braces, keys and ratio become part of your image prompt.${offNote}`, fix: 'Put Extract Text from JSON (JsonExtractString) between Generate Text and the encoder, with key rewritten_prompt.', sources: ['peCore', 'jsonNode', 'thread4'] });
      }
    }

    // Token budget and sampling (pe_core.py PROFILES).
    const maxLen = Number(g.value(tg, 'max_length'));
    const thinking = g.value(tg, 'thinking');
    if (Number.isFinite(maxLen) && maxLen < prof.maxTokens) {
      const title = `max_length is ${maxLen}; Qwen's runner uses ${prof.maxTokens.toLocaleString('en-US')}`;
      if (maxLen < MEASURED_BUDGET) {
        add({ id: 'pe.max-tokens', area: 'pe', status: st('warn'), stage: 'pe', node: where, title, detail: `That is below the 4,096 budget we have measured. In our Text to Image test the enhancer used ${T2I_USE} tokens for its thinking and the final prompt together. When the budget runs out, the answer stops early, inside the thinking or partway through the prompt.${thinking === true ? ' Thinking is on here, which uses more of the budget.' : ''} The node's default is 512.${offNote}`, fix: `Set max_length to at least 4096, or to ${prof.maxTokens} to match Qwen.`, sources: ['peCore', 'textgen', 'thread4'] });
      } else if (task === 't2i') {
        add({ id: 'pe.max-tokens', area: 'pe', status: 'info', stage: 'pe', node: where, title, detail: `In our Text to Image test at 4,096 (ComfyUI 0.38.0, RTX 3090, 2 prompts with fixed seeds), no run reached the cap: thinking plus the final prompt took ${T2I_USE} tokens. If an answer ever stops before the prompt, raise max_length.`, fix: null, sources: ['peCore', 'textgen'] });
      } else {
        add({ id: 'pe.max-tokens', area: 'pe', status: 'info', stage: 'pe', node: where, title, detail: 'Not measured here: we have not run the Image Edit enhancer, so we cannot say whether this budget is ever too short.', fix: null, sources: ['peCore', 'textgen'] });
      }
    }
    const mode = g.value(tg, 'sampling_mode');
    if (mode === 'off') {
      add({ id: 'pe.greedy', area: 'pe', status: st('warn'), stage: 'pe', node: where, title: 'Sampling is off (greedy decoding)', detail: `Qwen's production settings sample at temperature ${prof.temperature}, top_p ${prof.topP}, top_k ${prof.topK}.${offNote}`, fix: `Set sampling mode to on with temperature ${prof.temperature}, top_p ${prof.topP}, top_k ${prof.topK}, presence_penalty ${prof.presencePenalty}.`, sources: ['peCore'] });
    } else if (mode === 'on') {
      const pp = Number(g.value(tg, 'presence_penalty') ?? 0);
      if (Number.isFinite(pp) && Math.abs(pp - prof.presencePenalty) > 1e-6) {
        add({ id: 'pe.presence', area: 'pe', status: 'info', stage: 'pe', node: where, title: `presence_penalty is ${pp}; Qwen's ${task} setting is ${prof.presencePenalty}`, detail: `Qwen’s code notes that a wrong penalty does not fail; it quietly changes the output distribution.${task === 't2i' ? ' The Text to Image template in templates package 0.11.70 uses 0; the fix merged upstream on 2026-09-30 sets 1.5.' : ''}`, fix: null, sources: task === 't2i' ? ['peCore', 'pr1298'] : ['peCore'] });
      }
    }

    // Task fit: t2i takes no images; edit needs at least one (pe_core.py resolve_image_paths).
    const hasImage = !!g.origin(tg, 'image');
    if (task === 't2i' && hasImage) {
      add({ id: 'pe.task', area: 'pe', status: st('fail'), stage: 'pe', node: where, title: 'The text-to-image PE is given an image', detail: `PE-T2I takes no source image. Qwen's runner refuses a T2I case that carries images. For edits, Qwen ships PE-I2I.${offNote}`, fix: 'Load qwen3.5_9b_qwen_image_2.1_pe_i2i in this CLIPLoader and use the PE-I2I system prompt.', sources: ['peCore', 'comfyRepo', 'thread4'] });
    } else if (task === 'i2i' && !hasImage) {
      add({ id: 'pe.task', area: 'pe', status: st('warn'), stage: 'pe', node: where, title: 'The edit PE has no source image', detail: `PE-I2I rewrites an edit instruction against one or more source images. Qwen's runner requires at least one.${offNote}`, fix: 'Connect the source image(s) to Generate Text’s image input, or use PE-T2I for text to image.', sources: ['peCore'] });
    }
    if (route.state === 'unused') {
      add({ id: 'pe.unused', area: 'pe', status: 'info', stage: 'pe', node: where, title: 'The PE’s output is not used for the image', detail: 'Generate Text runs, but its text does not reach the Qwen-Image encoder prompt.', fix: 'Connect generated_text (through Extract Text from JSON when the system prompt asks for JSON) to the prompt of Text Encode Qwen Image 2.1.', sources: ['comfyRepo'] });
    }
    if (findings.length === findingsBefore || findings.slice(findingsBefore).every(f => f.status === 'info')) {
      pass(`pe.ok.${tg.id}`, `${where}: the ${task === 't2i' ? 'text-to-image' : 'edit'} PE gets its system prompt, a ${Number.isFinite(maxLen) ? maxLen.toLocaleString('en-US') : 'set'}-token budget and its matching task`, [task === 't2i' ? 'peT2i' : 'peI2i', 'peCore']);
    }
  }
  if (!peRuns.length) {
    const tgOther = textGens.length;
    add({ id: 'pe.none', area: 'pe', status: 'info', stage: 'pe', node: 'prompt enhancer', title: tgOther ? 'Generate Text is not running a Qwen-Image 2.1 PE' : 'No prompt enhancer in this workflow', detail: 'The PE is optional. Qwen publishes two fine-tuned PE models (T2I and I2I) that rewrite your prompt before encoding; without one, your prompt goes to the encoder as written.', fix: null, sources: ['comfyRepo', 'peT2i'] });
  }

  // --- 4. Slots and VRAM
  const slots = buildSlots(g, loads, peRuns, findings, clipUse);
  const vram = vramPlan(slots, listing);
  const pair = vram.pairs.find(p => p.a.stage === 'te' && p.b.stage === 'dit');
  if (pair && pair.gib >= BUDGETS.at(-1)) {
    add({ id: 'vram.no-coresidence-24', area: 'vram', status: 'info', stage: null, node: `${pair.a.name} + ${pair.b.name}`, title: `The text encoder and diffusion model weights are ${pair.gib.toFixed(1)} GB together: more than a 24 GB card holds`, detail: 'ComfyUI has to move one of them out of VRAM between encoding and sampling, on every prompt change, and weights that do not fit are read back from RAM or disk. Activations come on top of this.', fix: 'On 24 GB or less, the int8_convrot files (8.7 GB + 6.8 GB) let the text encoder and diffusion model stay loaded together on 24 GB.', sources: ['comfyRepo'] });
  }

  const order = { fail: 0, dormant: 1, warn: 2, info: 3 };
  findings.sort((a, b) => order[a.status] - order[b.status]);
  const count = s => findings.filter(f => f.status === s).length;
  return {
    ok: true, format: g.format, nodeCount: g.nodes.length, subgraphs: g.subgraphs, version, listing,
    findings, passes, slots, vram,
    summary: { fail: count('fail'), warn: count('warn'), dormant: count('dormant'), info: count('info'), pass: passes.length },
  };
}

function stageOfLoader(ld) {
  const f = ld.file;
  if (f && KIND_OF_ROLE[f.role]) return ROLES[f.role]?.stage || { clip: 'te', dit: 'dit', vae: 'vae' }[KIND_OF_ROLE[f.role]] || null;
  return { dit: 'dit', clip: 'te', vae: 'vae' }[ld.L.kind] || null;
}

// Follow Generate Text's text downstream: does it reach an encoder prompt, through a switch, through JSON extraction?
function outputRoute(g, tg) {
  let best = { state: 'unused', json: false };
  const walk = (n, slot, json, sw, depth) => {
    for (const e of g.consumers(n, slot)) {
      if (depth > 12) continue;
      const to = e.to;
      if (ENCODERS[to.type] && ENCODERS[to.type].includes(e.input)) {
        const cand = { state: sw ? 'off' : 'on', json, switchNode: sw?.node, switchValue: sw?.value };
        if (best.state === 'unused' || (best.state === 'off' && cand.state === 'on')) best = cand;
        continue;
      }
      if (to.type === 'ComfySwitchNode') {
        const v = g.value(to, 'switch');
        const off = (e.input === 'on_true' && v === false) || (e.input === 'on_false' && v === true);
        walk(to, undefined, json, sw || (off ? { node: to, value: v } : null), depth + 1);
      } else if (to.type === 'JsonExtractString') walk(to, undefined, true, sw, depth + 1);
      else if (/^(PreviewAny|StringConcatenate|StringReplace|RegexReplace|StringTrim)$|^Primitive/.test(to.type)) walk(to, undefined, json, sw, depth + 1);
    }
  };
  walk(tg, 0, false, null, 0);
  return best;
}

function buildSlots(g, loads, peRuns, findings, clipUse) {
  const worst = stage => {
    const fs = findings.filter(f => f.stage === stage);
    for (const s of ['fail', 'dormant', 'warn']) if (fs.some(f => f.status === s)) return s;
    return null;
  };
  const files = pred => loads.filter(pred).map(l => ({ name: l.name, loader: l.loader, node: g.label(l.node), bytes: l.file?.bytes ?? null, file: l.file }));
  const teLoads = files(l => l.L.kind === 'clip' && clipUse(l).encode.length);
  const peLoads = peRuns.length ? peRuns.map(r => ({ name: r.ld.name, loader: r.ld.loader, node: g.label(r.ld.node), bytes: r.file.bytes, file: r.file })) : files(l => l.L.kind === 'clip' && clipUse(l).generate.length && !clipUse(l).encode.length);
  const ditLoads = files(l => l.L.kind === 'dit');
  const vaeLoads = files(l => l.L.kind === 'vae');
  const slot = (stage, label, expect, list, optional = false) => ({ stage, label, expect, files: list, optional, status: worst(stage) || (list.length ? 'pass' : optional ? 'absent' : 'missing') });
  return [
    slot('pe', 'Prompt enhancer', 'qwen3.5_9b_qwen_image_2.1_pe_t2i / _pe_i2i → CLIPLoader → Generate Text', peLoads, true),
    slot('te', 'Text encoder', 'qwen3vl_8b_* → CLIPLoader, type qwen_image → Text Encode Qwen Image 2.1', teLoads),
    slot('dit', 'Diffusion model', 'qwen_image_2.1_* → Load Diffusion Model (GGUF: Unet Loader GGUF)', ditLoads),
    slot('vae', 'VAE', 'qwen_image_2.1_vae_bf16 → Load VAE', vaeLoads),
  ];
}

// Weights only, from the published file sizes. Activations, latents and the KV cache come on top and are not modelled here.
export const BUDGETS = [12, 16, 24];
// Peak job VRAM from a real run (nvidia-smi on the card, 2026-09-30). Everything else stays unmeasured until it is run.
export const MEASURED = [
  { stage: 'pe', task: 't2i', what: 'Text-to-image enhancer (PE-T2I) alone', gpu: 'RTX 3090 24 GB', peakMiB: 10566, tokensPerSec: [16.6, 18.9], comfy: '0.38.0', flags: '--gpu-only' },
];
function vramPlan(slots, listing) {
  const sizeOf = f => f.bytes ?? listing.files.find(x => x.name.toLowerCase() === String(f.name).toLowerCase())?.bytes ?? null;
  // A stage counts when its loader holds a file of the right role; a file in the wrong slot says nothing about memory.
  const fits = { pe: ['pe'], te: ['te'], dit: ['dit'], vae: ['vae', 'vaeOther'] };
  const stages = slots.filter(s => s.files.length && fits[s.stage].includes(s.files[0].file?.role)).map(s => {
    const b = sizeOf(s.files[0]);
    return { stage: s.stage, label: s.label, name: s.files[0].name, task: s.files[0].file?.task ?? null, bytes: b, gib: b ? gib(b) : null, off: s.status === 'dormant' };
  });
  const known = stages.filter(s => s.gib != null);
  const get = st => known.find(s => s.stage === st);
  const pairs = [['pe', 'te'], ['te', 'dit']].map(([a, b]) => get(a) && get(b) ? { a: get(a), b: get(b), gib: get(a).gib + get(b).gib } : null).filter(Boolean);
  const rows = BUDGETS.map(budget => ({
    budget,
    alone: known.map(s => ({ stage: s.stage, fits: s.gib < budget })),
    pairs: pairs.map(p => ({ stages: [p.a.stage, p.b.stage], fits: p.gib < budget, gib: p.gib })),
  }));
  const measured = MEASURED.filter(m => stages.some(s => s.stage === m.stage && s.task === m.task));
  const notMeasured = [];
  if (stages.some(s => s.stage === 'dit')) notMeasured.push('the full graph on a 24 GB card');
  if (stages.some(s => s.stage === 'pe' && s.task === 'i2i')) notMeasured.push('the edit enhancer (PE-I2I)');
  return { stages, unknown: stages.filter(s => s.gib == null).map(s => s.name), pairs, rows, measured, notMeasured };
}

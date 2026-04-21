/**
 * localModelService.ts
 *
 * Wraps llama.rn to provide on-device Hinglish conversion with Gemma 2B.
 * NOTE: llama.rn requires a native build (Expo Dev Client or EAS Build).
 *       This service safely no-ops when the native module is unavailable.
 */

import { modelDownloadService } from './modelDownloadService';

// ─── Types (mirror llama.rn's public API so we don't need @types) ─────────────

interface LlamaContext {
  completion(
    params: {
      prompt: string;
      n_predict: number;
      temperature: number;
      top_p: number;
      repeat_penalty: number;
      stop: string[];
    },
    callback?: (token: { token: string }) => void
  ): Promise<{ text: string }>;
  release(): Promise<void>;
}

type LlamaLibType = {
  initLlama(options: { model: string; n_ctx: number; n_threads: number; n_batch: number }): Promise<LlamaContext>;
};

// ─── Dynamic import guard ─────────────────────────────────────────────────────

let _llamaLib: LlamaLibType | null = null;

function getLlama(): LlamaLibType | null {
  if (_llamaLib) return _llamaLib;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _llamaLib = require('llama.rn') as LlamaLibType;
    return _llamaLib;
  } catch {
    // Native module not available (e.g., running in Expo Go)
    return null;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Max characters per chunk to avoid OOM on low-end devices.
 * Roughly ≈ 400 words per chunk.
 */
const CHUNK_SIZE = 1500;

/** Max tokens to generate per completion */
const MAX_TOKENS = 400;

// ─── State ────────────────────────────────────────────────────────────────────

let _ctx: LlamaContext | null = null;
let _loading = false;

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildHinglishPrompt(text: string): string {
  return `<start_of_turn>user
Convert the following English text into natural Hinglish.

Rules:
1. Use Hindi words WRITTEN IN ENGLISH SCRIPT (Romanized Hindi) — NOT Devanagari.
2. Keep it natural and conversational, like how young Indians actually speak.
3. Maintain the original meaning accurately.
4. Do not translate proper nouns, names, or technical terms.
5. Mix English and Hindi fluidly — do not translate every single word.
6. Output ONLY the converted Hinglish text. No explanations, no labels, no quotes.

English Text:
${text.trim()}
<end_of_turn>
<start_of_turn>model
`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Split long text into chunks at sentence boundaries */
function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > CHUNK_SIZE) {
    // Try to break at a sentence ending near the chunk boundary
    const slice = remaining.slice(0, CHUNK_SIZE);
    const lastPeriod = Math.max(
      slice.lastIndexOf('. '),
      slice.lastIndexOf('! '),
      slice.lastIndexOf('? ')
    );
    const breakAt = lastPeriod > CHUNK_SIZE * 0.5 ? lastPeriod + 2 : CHUNK_SIZE;
    chunks.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const localModelService = {
  /** Returns true if the underlying native module is available */
  isNativeAvailable(): boolean {
    return getLlama() !== null;
  },

  /** Returns true if a model context is currently loaded in memory */
  isModelLoaded(): boolean {
    return _ctx !== null;
  },

  /**
   * Load the GGUF model into memory.
   * Call this once before running inference.
   * Safe to call multiple times — skips if already loaded.
   */
  async loadModel(): Promise<void> {
    if (_ctx) return; // already loaded
    if (_loading) throw new Error('Model is already being loaded.');

    const llama = getLlama();
    if (!llama) {
      throw new Error(
        'Native module not available. Please build the app with Expo Dev Client or EAS Build.'
      );
    }

    const modelPath = modelDownloadService.getModelPath();
    const downloaded = await modelDownloadService.isModelDownloaded();
    if (!downloaded) {
      throw new Error('Model file not found. Please download the model first from the Labs screen.');
    }

    _loading = true;
    try {
      _ctx = await llama.initLlama({
        model: modelPath,
        n_ctx: 2048,    // context window
        n_threads: 4,   // CPU threads — adjust based on device
        n_batch: 512,   // batch size
      });
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('initcontext') || err?.message?.toLowerCase().includes('native')) {
        throw new Error('Native module not available. Please build the app with Expo Dev Client or EAS Build to use Offline AI.');
      }
      throw err;
    } finally {
      _loading = false;
    }
  },

  /**
   * Run Hinglish inference on the given text.
   * Automatically loads model if not loaded.
   * Handles text chunking for long documents.
   * @param text English input text
   * @param onToken Optional streaming callback per token
   */
  async generate(
    text: string,
    onToken?: (partial: string) => void
  ): Promise<string> {
    if (!_ctx) {
      await localModelService.loadModel();
    }

    if (!_ctx) throw new Error('Failed to load model.');

    const chunks = chunkText(text);
    const results: string[] = [];

    for (const chunk of chunks) {
      const prompt = buildHinglishPrompt(chunk);
      const result = await _ctx.completion(
        {
          prompt,
          n_predict: MAX_TOKENS,
          temperature: 0.7,
          top_p: 0.9,
          repeat_penalty: 1.1,
          stop: ['<end_of_turn>', '<start_of_turn>', '\n\n\n'],
        },
        onToken ? (tok) => onToken(tok.token) : undefined
      );

      const output = result.text
        .replace(/<end_of_turn>/g, '')
        .replace(/<start_of_turn>/g, '')
        .trim();

      results.push(output);
    }

    return results.join('\n\n');
  },

  /**
   * Release model from memory.
   * Call when switching to online mode or on app background.
   */
  async releaseModel(): Promise<void> {
    if (_ctx) {
      try {
        await _ctx.release();
      } catch {
        // ignore release errors
      }
      _ctx = null;
    }
  },
};

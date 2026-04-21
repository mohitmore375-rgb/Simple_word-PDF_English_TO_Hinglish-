import * as FileSystem from 'expo-file-system/legacy';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Gemma 2B Instruct Q4_K_M GGUF (~1.5 GB)
 * Source: lmstudio-community on HuggingFace
 */
const MODEL_URL =
  'https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf';

const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
const MODEL_FILENAME = 'gemma-2b-it-q4_k_m.gguf';
const MODEL_PATH = `${MODEL_DIR}${MODEL_FILENAME}`;

/** Approximate expected file size in bytes (~1.5 GB) */
const EXPECTED_SIZE_BYTES = 1_500_000_000;

/** Minimum free storage required before download (bytes) */
const MIN_FREE_SPACE_BYTES = 2_000_000_000; // 2 GB

// Keep a reference to the resumable download so we can pause/cancel
let _activeDownload: FileSystem.DownloadResumable | null = null;

// ─── Service ──────────────────────────────────────────────────────────────────

export const modelDownloadService = {
  /** Full local path to the GGUF model file */
  getModelPath(): string {
    return MODEL_PATH;
  },

  /** Returns true if the model file exists and is fully downloaded (size > 100MB) */
  async isModelDownloaded(): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(MODEL_PATH, { size: true });
      if (!info.exists) return false;
      // Sanity check: must be at least 100 MB to count as a valid model
      return (info.size ?? 0) > 100_000_000;
    } catch {
      return false;
    }
  },

  /** Returns the model file size in bytes, or 0 if not present */
  async getModelSize(): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(MODEL_PATH, { size: true });
      return info.exists ? (info.size ?? 0) : 0;
    } catch {
      return 0;
    }
  },

  /** Format bytes into a human-readable string */
  formatSize(bytes: number): string {
    if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
    return `${bytes} B`;
  },

  /**
   * Download the model from HuggingFace to local storage.
   * @param onProgress Callback with progress percentage (0–100)
   * @throws Error if storage is insufficient or download fails
   */
  async downloadModel(onProgress: (pct: number) => void): Promise<void> {
    // ── Step 1: ensure model directory exists ────────────────────────────────
    const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
    }

    // ── Step 2: check free space ──────────────────────────────────────────────
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      if (freeSpace < MIN_FREE_SPACE_BYTES) {
        throw new Error(
          `Not enough storage. Need at least 2 GB free, but only ${modelDownloadService.formatSize(freeSpace)} available.`
        );
      }
    } catch (e: any) {
      // If the space check itself threw our custom error, re-throw it
      if (e.message?.startsWith('Not enough')) throw e;
      // Otherwise the API may not be available on this platform — continue
    }

    // ── Step 3: create resumable download ────────────────────────────────────
    _activeDownload = FileSystem.createDownloadResumable(
      MODEL_URL,
      MODEL_PATH,
      {},
      (downloadProgress) => {
        const total =
          downloadProgress.totalBytesExpectedToWrite > 0
            ? downloadProgress.totalBytesExpectedToWrite
            : EXPECTED_SIZE_BYTES;
        const pct = Math.min(
          100,
          Math.floor((downloadProgress.totalBytesWritten / total) * 100)
        );
        onProgress(pct);
      }
    );

    try {
      const result = await _activeDownload.downloadAsync();
      _activeDownload = null;
      if (!result || !result.uri) {
        throw new Error('Download completed but no file URI returned.');
      }
      onProgress(100);
    } catch (err: any) {
      _activeDownload = null;
      // Clean up partial file
      try {
        const partial = await FileSystem.getInfoAsync(MODEL_PATH);
        if (partial.exists) await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
      } catch {
        // ignore cleanup errors
      }
      throw new Error(`Download failed: ${err.message}`);
    }
  },

  /** Pause an active download (can be resumed later) */
  async pauseDownload(): Promise<void> {
    if (_activeDownload) {
      await _activeDownload.pauseAsync();
    }
  },

  /** Cancel download and remove partial file */
  async cancelDownload(): Promise<void> {
    if (_activeDownload) {
      try {
        await _activeDownload.cancelAsync();
      } catch {
        // ignore
      }
      _activeDownload = null;
    }
    try {
      await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
    } catch {
      // ignore
    }
  },

  /** Delete the model from device storage */
  async deleteModel(): Promise<void> {
    try {
      await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
    } catch (err: any) {
      throw new Error(`Failed to delete model: ${err.message}`);
    }
  },
};

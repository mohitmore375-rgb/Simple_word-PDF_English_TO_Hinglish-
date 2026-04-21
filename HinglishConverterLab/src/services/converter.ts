import axios, { AxiosError } from 'axios';
import { Platform, NativeModules } from 'react-native';
import { AIMode } from '../context/AIModelContext';
import { localModelService } from './localModelService';
import { storageService } from './storageService';

const getHostAddress = () => {
  if (Platform.OS === 'web') return 'localhost';

  // Fallback IP for physical device testing
  const LOCAL_IP = '10.233.253.139';

  // In development, extract IP from the bundler URL
  if (__DEV__) {
    try {
      const scriptURL = NativeModules.SourceCode.scriptURL;
      if (scriptURL && scriptURL.includes('://')) {
        const address = scriptURL.split('://')[1].split('/')[0].split(':')[0];
        if (address !== 'localhost' && address !== '127.0.0.1') {
          return address;
        }
      }
    } catch (e) {
      // fallback
    }
    return LOCAL_IP;
  }

  return Platform.OS === 'android' ? '10.0.2.2' : LOCAL_IP;
};

const getDefaultBaseUrl = () => `http://${getHostAddress()}:3001`;

const getBaseUrl = async () => {
  const custom = await storageService.getBackendUrl();
  return custom ? `http://${custom}:3001` : getDefaultBaseUrl();
};

export interface ConversionResult {
  result: string;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export const converterService = {
  /**
   * Convert English text to Hinglish.
   * @param text Input English text
   * @param mode 'online' (default) → backend Gemini API | 'offline' → on-device Gemma 2B
   * @param onToken Optional callback for streaming tokens in offline mode
   */
  async convert(
    text: string,
    mode: AIMode = 'online',
    onToken?: (partial: string) => void
  ): Promise<ConversionResult> {
    if (mode === 'offline') {
      return converterService._convertOffline(text, onToken);
    }
    return converterService._convertOnline(text);
  },

  // ── Online: Gemini via backend ──────────────────────────────────────────────
  async _convertOnline(text: string): Promise<ConversionResult> {
    try {
      const baseUrl = await getBaseUrl();
      const response = await axios.post<ConversionResult>(
        `${baseUrl}/convert`,
        { text },
        {
          timeout: 35000,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      return response.data;
    } catch (error) {
      const axErr = error as AxiosError<{ error: string }>;
      if (axErr.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      if (axErr.response?.data?.error) {
        throw new Error(axErr.response.data.error);
      }
      if (axErr.code === 'ECONNREFUSED' || axErr.code === 'ERR_NETWORK') {
        throw new Error('Cannot reach the server. Make sure the backend is running on port 3001.');
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  },

  // ── Offline: Gemma 2B via llama.rn ─────────────────────────────────────────
  async _convertOffline(
    text: string,
    onToken?: (partial: string) => void
  ): Promise<ConversionResult> {
    try {
      // Auto-load the model if it hasn't been loaded yet
      if (!localModelService.isModelLoaded()) {
        await localModelService.loadModel();
      }

      const result = await localModelService.generate(text, onToken);

      if (!result || result.trim().length === 0) {
        throw new Error('Model returned an empty response. Please try again.');
      }

      return {
        result: result.trim(),
        model: 'gemma-2b-it-q4_k_m (offline)',
      };
    } catch (err: any) {
      // Surface friendly error messages
      const msg: string = err.message || 'Offline conversion failed.';

      // If it's a memory or native issue, suggest fallback
      if (
        msg.includes('native module') ||
        msg.includes('not found') ||
        msg.includes('Failed to load')
      ) {
        throw new Error(msg);
      }

      throw new Error(`Offline AI error: ${msg}`);
    }
  },

  async checkHealth(): Promise<boolean> {
    try {
      const baseUrl = await getBaseUrl();
      await axios.get(`${baseUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  },
};

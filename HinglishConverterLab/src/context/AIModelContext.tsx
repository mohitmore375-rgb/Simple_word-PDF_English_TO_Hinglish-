import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AIMode = 'online' | 'offline';

export type ModelStatus =
  | 'not_downloaded'
  | 'downloading'
  | 'downloaded'
  | 'loading'
  | 'loaded'
  | 'error';

export interface AIModelContextType {
  /** 'online' → Gemini API via backend  |  'offline' → Gemma 2B on-device */
  aiMode: AIMode;
  setAIMode: (mode: AIMode) => void;

  /** Current state of the local GGUF model */
  modelStatus: ModelStatus;
  setModelStatus: (status: ModelStatus) => void;

  /** Download progress 0–100 */
  downloadProgress: number;
  setDownloadProgress: (pct: number) => void;

  /** Error message if modelStatus === 'error' */
  modelError: string | null;
  setModelError: (err: string | null) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const AI_MODE_KEY = '@ai_mode_pref';

const AIModelContext = createContext<AIModelContextType>({
  aiMode: 'online',
  setAIMode: () => {},
  modelStatus: 'not_downloaded',
  setModelStatus: () => {},
  downloadProgress: 0,
  setDownloadProgress: () => {},
  modelError: null,
  setModelError: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AIModelProvider = ({ children }: { children: ReactNode }) => {
  const [aiMode, setAIModeState] = useState<AIMode>('online');
  const [modelStatus, setModelStatus] = useState<ModelStatus>('not_downloaded');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [modelError, setModelError] = useState<string | null>(null);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(AI_MODE_KEY).then((val) => {
      if (val === 'online' || val === 'offline') {
        setAIModeState(val);
      }
    });
  }, []);

  const setAIMode = useCallback((mode: AIMode) => {
    setAIModeState(mode);
    AsyncStorage.setItem(AI_MODE_KEY, mode);
    // Reset error when switching modes
    setModelError(null);
  }, []);

  return (
    <AIModelContext.Provider
      value={{
        aiMode,
        setAIMode,
        modelStatus,
        setModelStatus,
        downloadProgress,
        setDownloadProgress,
        modelError,
        setModelError,
      }}
    >
      {children}
    </AIModelContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAIModel = () => useContext(AIModelContext);

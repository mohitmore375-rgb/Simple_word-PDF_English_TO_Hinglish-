import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const OCR_SPACE_API_KEY = 'helloworld'; // Free OCR.space API key for demo

export interface OcrResult {
  text: string;
  fileName: string;
  fileType: string;
}

export const ocrService = {
  async pickDocument(): Promise<OcrResult> {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('CANCELLED');
    }

    const file = result.assets[0];
    const fileName = file.name;
    const fileUri = file.uri;
    const mimeType = file.mimeType || '';

    // For plain text files, read directly
    if (mimeType === 'text/plain') {
      const text = await FileSystem.readAsStringAsync(fileUri);
      return { text: text.trim(), fileName, fileType: 'TXT' };
    }

    // For images and PDFs, use OCR.space API
    if (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf'
    ) {
      const text = await ocrService.extractViaOCRSpace(fileUri, fileName, mimeType);
      const fileType = mimeType === 'application/pdf' ? 'PDF' : 'IMAGE';
      return { text, fileName, fileType };
    }

    // For DOC/DOCX — read as text (best effort, may include markup)
    try {
      const text = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'utf8',
      });
      // Strip common XML/binary artifacts
      const clean = text
        .replace(/<[^>]+>/g, ' ')
        .replace(/[^\x20-\x7E\n\r\t]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (clean.length < 10) throw new Error('Could not extract readable text from this document type.');
      return { text: clean, fileName, fileType: 'DOC' };
    } catch {
      throw new Error('DOCX/DOC text extraction is limited. Please save as TXT for best results.');
    }
  },

  async extractViaOCRSpace(fileUri: string, fileName: string, mimeType: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    const formData = new FormData();
    formData.append('base64Image', `data:${mimeType};base64,${base64}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', mimeType === 'application/pdf' ? 'PDF' : fileName.split('.').pop()?.toUpperCase() || 'JPG');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          apikey: OCR_SPACE_API_KEY,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`OCR service returned error: ${response.status}`);
      }

      const data = await response.json() as {
        IsErroredOnProcessing: boolean;
        ErrorMessage?: string[];
        ParsedResults?: Array<{ ParsedText: string }>;
      };

      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage?.join(', ') || 'OCR processing failed.');
      }

      const text = data.ParsedResults?.map((r) => r.ParsedText).join('\n').trim();
      if (!text || text.length < 3) {
        throw new Error('No readable text found in the file. Please ensure the image is clear.');
      }

      return text;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('OCR request timed out. Please try again.');
      throw err;
    }
  },
};

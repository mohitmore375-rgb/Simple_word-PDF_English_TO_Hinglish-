import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const pdfService = {
  async generateAndShare(options: {
    originalText: string;
    convertedText: string;
    timestamp?: number;
  }): Promise<void> {
    const { originalText, convertedText, timestamp } = options;
    const date = new Date(timestamp || Date.now()).toLocaleString();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Hinglish Conversion - Precision Lab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0b1326;
      color: #E8EAF0;
      padding: 40px;
      min-height: 100vh;
    }
    .header {
      border-left: 4px solid #FF6B00;
      padding-left: 16px;
      margin-bottom: 32px;
    }
    .lab-badge {
      font-size: 11px;
      letter-spacing: 2px;
      color: #FF6B00;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #E8EAF0;
      letter-spacing: -0.8px;
    }
    .meta {
      margin-top: 8px;
      font-size: 12px;
      color: #5A6380;
      letter-spacing: 0.5px;
    }
    .section {
      background: #171f33;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .section-label {
      font-size: 10px;
      letter-spacing: 2px;
      font-weight: 600;
      color: #5A6380;
      text-transform: uppercase;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chip {
      display: inline-block;
      background: #222a3d;
      color: #9BA3B8;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 10px;
      letter-spacing: 1px;
      margin-right: 6px;
    }
    .chip.accent {
      background: #FF6B00;
      color: #fff;
    }
    .text-content {
      font-size: 15px;
      line-height: 1.7;
      color: #E8EAF0;
      white-space: pre-wrap;
    }
    .result-text {
      font-size: 16px;
      line-height: 1.8;
      color: #E8EAF0;
      font-weight: 400;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 11px;
      color: #3A4260;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .divider {
      height: 1px;
      background: rgba(59, 73, 76, 0.3);
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="lab-badge">Engine Output</div>
    <h1>Hinglish Converter Lab</h1>
    <div class="meta">Generated: ${date} &nbsp;|&nbsp; Engine: V2-Neural (Mistral AI)</div>
  </div>

  <div class="section">
    <div class="section-label">
      <span class="chip">ENG</span>
      Original English Text
    </div>
    <div class="text-content">${escapeHtml(originalText)}</div>
  </div>

  <div class="section">
    <div class="section-label">
      <span class="chip accent">HIN</span>
      <span class="chip">RAW_TXT</span>
      Converted Hinglish Output
    </div>
    <div class="result-text">${escapeHtml(convertedText)}</div>
  </div>

  <div class="footer">
    PRECISION LAB &nbsp;|&nbsp; HINGLISH CONVERTER V2-NEURAL &nbsp;|&nbsp; ${new Date().getFullYear()}
  </div>
</body>
</html>`;

    const { uri } = await Print.printToFileAsync({ html, base64: false });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Export Hinglish Conversion',
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device.');
    }
  },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

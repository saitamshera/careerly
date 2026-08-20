const path = require('path');
const { ApiError } = require('./apiError');

function normalizeText(input) {
  return String(input || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract readable text from an uploaded document buffer.
 * Supports: PDF, DOCX, DOC, TXT (up to 5MB).
 */
async function extractTextFromDocument(file) {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new ApiError(400, 'Invalid file buffer');
  }

  const rawOriginalName = String(file.originalname || '');
  const fileName = rawOriginalName.toLowerCase();
  const fileExt = path.extname(fileName).toLowerCase();
  const mimeType = String(file.mimetype || '').toLowerCase();
  const buffer = file.buffer;

  // Enforce 5 MB maximum size limit
  if (file.size > 5 * 1024 * 1024 || buffer.length > 5 * 1024 * 1024) {
    throw new ApiError(400, 'File is too large. Maximum size is 5 MB.');
  }

  let text = '';

  try {
    if (fileExt === '.pdf' || mimeType === 'application/pdf') {
      if (!buffer.toString('ascii', 0, 5).startsWith('%PDF-')) {
        throw new ApiError(400, 'Unable to read this document. Please try another file.');
      }
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      try {
        const parsed = await parser.getText();
        text = parsed?.text || '';
      } finally {
        await parser.destroy();
      }
    } else if (
      fileExt === '.docx' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
        throw new ApiError(400, 'Unable to read this document. Please try another file.');
      }
      const mammothModule = await import('mammoth');
      const mammoth = mammothModule.default?.extractRawText || mammothModule.extractRawText;
      const result = await mammoth({ buffer });
      text = result.value || '';
    } else if (fileExt === '.doc' || mimeType === 'application/msword' || mimeType === 'application/doc') {
      try {
        const mammothModule = await import('mammoth');
        const mammoth = mammothModule.default?.extractRawText || mammothModule.extractRawText;
        const result = await mammoth({ buffer });
        text = result.value || '';
      } catch {
        // Fallback for older .doc binary files: extract clean text character runs
        text = buffer
          .toString('binary')
          .replace(/[^\x20-\x7E\t\r\n]/g, ' ')
          .replace(/\s+/g, ' ');
      }
    } else if (fileExt === '.txt' || mimeType === 'text/plain' || mimeType.startsWith('text/')) {
      text = buffer.toString('utf-8');
    } else {
      throw new ApiError(400, 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, 'Unable to read this document. Please try another file.');
  }

  const normalized = normalizeText(text);
  if (!normalized || normalized.length < 5) {
    throw new ApiError(400, 'Unable to read this document. Please try another file.');
  }

  return normalized;
}

module.exports = {
  extractTextFromDocument,
  normalizeText
};

const { GoogleGenAI } = require('@google/genai');
const { env } = require('../config/env');
const { logger } = require('../config/logger');

let cachedClient = null;

function getGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return cachedClient;
}

function getCandidateModels() {
  return [
    ...new Set([
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      env.GEMINI_MODEL
    ].filter(Boolean))
  ];
}

async function generateWithGemini(options = {}) {
  const { prompt, config = {}, candidateModels = getCandidateModels() } = options;
  const ai = getGeminiClient();

  if (!ai) {
    logger.warn('GEMINI_API_KEY is not set — Gemini call skipped');
    return null;
  }

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config
      });

      return {
        text: response.text,
        model: modelName
      };
    } catch (error) {
      logger.warn(`Gemini generation failed on model ${modelName}:`, {
        message: error?.message || String(error)
      });
    }
  }

  return null;
}

async function generateStructuredJSON(options = {}) {
  const { prompt, schema, candidateModels = getCandidateModels() } = options;

  const result = await generateWithGemini({
    prompt,
    config: {
      responseMimeType: 'application/json'
    },
    candidateModels
  });

  if (!result || !result.text) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.text);
    if (schema) {
      return schema.parse(parsed);
    }
    return parsed;
  } catch (parseError) {
    logger.error('Failed to parse Gemini structured JSON response:', {
      message: parseError?.message || String(parseError),
      rawText: result.text
    });
    return null;
  }
}

module.exports = {
  getGeminiClient,
  getCandidateModels,
  generateWithGemini,
  generateStructuredJSON
};

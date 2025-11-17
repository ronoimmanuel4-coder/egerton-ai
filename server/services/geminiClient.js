const axios = require('axios');

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  return { apiKey, model };
}

async function generateText({ systemPrompt, userMessage, history = [], temperature = 0.7, maxOutputTokens = 512 }) {
  const { apiKey, model } = getGeminiConfig();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [];

  if (systemPrompt) {
    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }],
    });
  }

  history.forEach((msg) => {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  });

  if (userMessage) {
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });
  }

  const { data } = await axios.post(url, {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  });

  const text =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    Array.isArray(data.candidates[0].content.parts)
      ? data.candidates[0].content.parts.map((p) => p.text || '').join('\n')
      : '';

  return (text || '').trim();
}

module.exports = {
  generateText,
};

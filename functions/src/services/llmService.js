import { getGenerativeModel } from '../config/vertexai.js';

/**
 * Invoke LLM (Gemini) with a prompt
 */
export const invokeLLM = async (prompt, options = {}) => {
  const {
    model = 'gemini-1.5-flash',
    temperature = 0.7,
    maxOutputTokens = 1024
  } = options;

  try {
    const generativeModel = getGenerativeModel(model);

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    });

    const response = result.response;
    const text = response.candidates[0]?.content?.parts[0]?.text || '';

    return text;
  } catch (error) {
    console.error('LLM invocation failed:', error);
    throw new Error('Failed to generate response: ' + error.message);
  }
};

/**
 * Chat with context (conversation history)
 */
export const chatWithHistory = async (messages, options = {}) => {
  const {
    model = 'gemini-1.5-flash',
    systemPrompt = '',
    temperature = 0.7,
    maxOutputTokens = 1024
  } = options;

  try {
    const generativeModel = getGenerativeModel(model);

    // Build conversation contents
    const contents = [];

    // Add system prompt as first user message if provided
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `System instructions: ${systemPrompt}\n\nPlease acknowledge and follow these instructions.` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'I understand and will follow these instructions.' }]
      });
    }

    // Add conversation history
    messages.forEach(msg => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    const result = await generativeModel.generateContent({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    });

    const response = result.response;
    const text = response.candidates[0]?.content?.parts[0]?.text || '';

    return text;
  } catch (error) {
    console.error('Chat invocation failed:', error);
    throw new Error('Failed to generate response: ' + error.message);
  }
};

export default {
  invokeLLM,
  chatWithHistory
};

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import * as llmService from '../services/llmService.js';

const router = Router();

/**
 * POST /chat/invoke
 * Invoke LLM with a prompt (for Q&A chatbot)
 */
router.post('/invoke', optionalAuth, async (req, res, next) => {
  try {
    const { prompt, model, temperature, maxOutputTokens } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Create the system-contextualized prompt
    const contextualizedPrompt = `You are a helpful assistant for CommonThread, a volunteer platform connecting volunteers with local businesses and nonprofits.

Answer the following question about volunteering, community service, or how to use the platform. Be friendly, concise, and encouraging.
If the question is about how to volunteer, mention that users can browse businesses in the Explore page, check opportunities in the Opportunities page, and complete their volunteer profile.

Question: ${prompt}`;

    const response = await llmService.invokeLLM(contextualizedPrompt, {
      model,
      temperature,
      maxOutputTokens
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /chat/conversation
 * Chat with conversation history
 */
router.post('/conversation', optionalAuth, async (req, res, next) => {
  try {
    const { messages, systemPrompt, model, temperature, maxOutputTokens } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const defaultSystemPrompt = `You are a helpful assistant for CommonThread, a volunteer platform connecting volunteers with local businesses and nonprofits. Be friendly, concise, and encouraging.`;

    const response = await llmService.chatWithHistory(messages, {
      systemPrompt: systemPrompt || defaultSystemPrompt,
      model,
      temperature,
      maxOutputTokens
    });

    res.json({ response });
  } catch (error) {
    next(error);
  }
});

export default router;

import { VertexAI } from '@google-cloud/vertexai';

const PROJECT_ID = 'community-threads-486622-2c2e0';
const LOCATION = 'us-central1';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

// Get the generative model (Gemini)
export const getGenerativeModel = (modelName = 'gemini-1.5-flash') => {
  return vertexAI.getGenerativeModel({
    model: modelName,
  });
};

export default { vertexAI, getGenerativeModel };

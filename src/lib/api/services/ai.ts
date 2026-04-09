import { post } from '../crud';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: Array<{ role: string; content: string }>;
  document_id?: string;
}

export interface ChatResponse {
  message: string;
  status: number;
  data: {
    message: string;
    document_id?: string;
  };
}

/**
 * Send a chat message to the AI assistant
 * @param message - The user's message
 * @param history - Previous conversation history
 * @param documentId - Optional document ID for document-aware chat
 * @returns The AI's response message
 */
export const sendChatMessage = async (
  message: string,
  history: Array<{ role: string; content: string }> = [],
  documentId?: string
): Promise<string> => {
  try {
    const payload: ChatRequest = { message, history };
    if (documentId) {
      payload.document_id = documentId;
    }
    const result = await post('AI_CHAT', payload);
    return result?.message || 'No response from AI';
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to send chat message');
  }
};

/**
 * Summarize a document using AI
 * @param documentId - The document ID to summarize
 * @returns The AI summary
 */
export const summarizeDocument = async (documentId: string): Promise<any> => {
  try {
    const result = await post('DOCUMENT_SUMMARIZE', {}, { id: documentId });
    return result;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to summarize document');
  }
};

/**
 * Analyze a document using AI
 * @param documentId - The document ID to analyze
 * @returns The AI analysis
 */
export const analyzeDocument = async (documentId: string): Promise<any> => {
  try {
    const result = await post('DOCUMENT_ANALYZE', {}, { id: documentId });
    return result;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to analyze document');
  }
};

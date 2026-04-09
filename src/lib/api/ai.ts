import { post } from './crud';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  message: string;
  status: number;
  data: {
    message: string;
  };
}

/**
 * Send a chat message to the AI assistant
 * @param message - The user's message
 * @param history - Previous conversation history
 * @returns The AI's response message
 */
export const sendChatMessage = async (
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> => {
  try {
    const result = await post('AI_CHAT', { message, history });
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

/**
 * Generate predictive analysis from chart/spreadsheet data
 * @param chartData - The chart or spreadsheet data to analyze
 * @param documentTitle - Title of the document/data source
 * @param metricsContext - Description of what metrics are being analyzed
 * @param analysisContext - Additional context for the analysis
 * @returns The predictive analysis results
 */
export const generatePredictiveAnalysis = async (
  chartData: any,
  documentTitle: string = 'Spreadsheet Data',
  metricsContext: string = 'Document metrics',
  analysisContext?: string
): Promise<any> => {
  try {
    const result = await post('DOCUMENT_PREDICTIVE_ANALYSIS', {
      chart_data: chartData,
      document_title: documentTitle,
      metrics_context: metricsContext,
      analysis_context: analysisContext || '',
    });
    return result;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to generate predictive analysis');
  }
};

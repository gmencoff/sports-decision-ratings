export interface LlmResponse {
  content: Array<{ type: string; text?: string }>;
}

export interface LlmClient {
  createMessage(params: {
    model: string;
    max_tokens: number;
    messages: Array<{ role: string; content: string }>;
  }): Promise<LlmResponse>;
}

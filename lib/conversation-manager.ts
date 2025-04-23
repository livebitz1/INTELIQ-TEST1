import { AIMessage } from "./utils";

// Maximum number of messages to keep in conversation history
const MAX_CONVERSATION_LENGTH = 10;

// Global conversation store
// In a real app, this would be stored in a database per user
const conversationStore = new Map<string, AIMessage[]>();

export class ConversationManager {
  private sessionId: string;
  
  constructor(sessionId: string = "default") {
    this.sessionId = sessionId;
    // Initialize the conversation if it doesn't exist
    if (!conversationStore.has(sessionId)) {
      conversationStore.set(sessionId, []);
    }
  }
  
  // Get all messages in the conversation
  getMessages(): AIMessage[] {
    return conversationStore.get(this.sessionId) || [];
  }
  
  // Get the conversation formatted for OpenAI API
  getFormattedConversation(): { role: string; content: string }[] {
    const messages = this.getMessages();
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }
  
  // Add a new message to the conversation
  addMessage(role: "user" | "assistant", content: string): void {
    const messages = this.getMessages();
    messages.push({ role, content });
    
    // Trim conversation if it gets too long
    if (messages.length > MAX_CONVERSATION_LENGTH) {
      messages.splice(0, messages.length - MAX_CONVERSATION_LENGTH);
    }
    
    conversationStore.set(this.sessionId, messages);
  }
  
  // Clear the conversation history
  clearConversation(): void {
    conversationStore.set(this.sessionId, []);
  }
  
  // Get session ID
  getSessionId(): string {
    return this.sessionId;
  }
}

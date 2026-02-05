export interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

export type InsertConversation = Omit<Conversation, "id">;

export interface Message {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  created_at: string;
}

export type InsertMessage = Omit<Message, "id">;

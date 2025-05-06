import type { ChatId } from "node-telegram-bot-api";

interface TgChatMeta {
  id: ChatId;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  msgId: number;
  date: number;
}

interface SendAllChatsPayload {
  chats: TgChatMeta[];
  message: string;
}

interface ApplicationPayload {
  uid: string;
  chatId: string;
  botname: string;
  application: string;
}

interface BotDataReqBody<P = string> {
  actionType: "send-to-all" | "send-application";
  payload: P;
}

export type {
  TgChatMeta,
  SendAllChatsPayload,
  BotDataReqBody,
  ApplicationPayload,
};

export interface WhatsAppWebhookPayload {
  event: string;
  instance: string;
  data: MessageUpsertData | any; // O 'data' pode variar dependendo do evento
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

export interface MessageUpsertData {
  key: MessageKey;
  pushName: string;
  message: Message;
  messageType: string;
  messageTimestamp: number;
  owner: string;
  source: string;
}

export interface MessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
  participant?: string;
}

export interface Message {
  conversation?: string;
  extendedTextMessage?: {
    text: string;
  };
}

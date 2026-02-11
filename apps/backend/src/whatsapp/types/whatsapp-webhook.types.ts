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
  imageMessage?: {
    url?: string;
    mimetype?: string;
    caption?: string;
    fileSha256?: Uint8Array;
    fileLength?: number;
    height?: number;
    width?: number;
    mediaKey?: Uint8Array;
    fileEncSha256?: Uint8Array;
    directPath?: string;
    jpegThumbnail?: Uint8Array;
    scansSidecar?: Uint8Array;
    firstScanSidecar?: Uint8Array;
    messageContextInfo?: any; // You might want to define a more specific type for this
    isEphemeral?: boolean;
    isViewOnce?: boolean;
  };
}

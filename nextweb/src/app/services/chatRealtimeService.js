import { Client } from "@stomp/stompjs";
import { getStoredToken } from "../utils/storage";

function buildWsUrl() {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).replace(/\/$/, "");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const raw = baseUrl || origin;
  const normalized = raw.replace(/\/api\/?$/, "");
  const wsBase = normalized.replace(/^http/i, (protocol) =>
    protocol.toLowerCase() === "https" ? "wss" : "ws"
  );
  return `${wsBase.replace(/\/$/, "")}/ws`;
}

class ChatRealtimeService {
  constructor() {
    this.client = null;
  }

  subscribeToConversation(conversationId, onEvent) {
    const token = getStoredToken();
    if (!conversationId || !token) {
      return () => {};
    }

    const client = new Client({
      brokerURL: buildWsUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        client.subscribe(`/topic/conversa/${conversationId}`, (message) => {
          if (!message.body) return;
          try {
            onEvent(JSON.parse(message.body));
          } catch {
            // Ignore malformed realtime payloads
          }
        }, {
          Authorization: `Bearer ${token}`,
        });
      },
    });

    this.client = client;
    client.activate();

    return () => {
      if (this.client === client) {
        this.client = null;
      }
      client.deactivate();
    };
  }
}

export const chatRealtimeService = new ChatRealtimeService();

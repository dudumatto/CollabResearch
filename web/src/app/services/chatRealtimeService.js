import { Client } from "@stomp/stompjs";
import { getStoredToken } from "../utils/storage";
import { api } from "./api";

function buildWsUrl() {
  const baseUrl = import.meta.env.DEV ? window.location.origin : api.baseUrl || window.location.origin;
  const normalizedBaseUrl = baseUrl.replace(/\/api\/?$/, "");
  const wsBase = normalizedBaseUrl.replace(/^http/i, (protocol) =>
    protocol.toLowerCase() === "https" ? "wss" : "ws"
  );
  return `${wsBase.replace(/\/$/, "")}/ws`;
}

class ChatRealtimeService {
  constructor() {
    this.client = null;
  }

  subscribeToConversations(conversationIds, onEvent) {
    const token = getStoredToken();
    const uniqueIds = [...new Set((Array.isArray(conversationIds) ? conversationIds : [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id)))];

    if (uniqueIds.length === 0 || !token) {
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
        uniqueIds.forEach((conversationId) => {
          client.subscribe(`/topic/conversa/${conversationId}`, (message) => {
            if (!message.body) return;
            try {
              onEvent(JSON.parse(message.body));
            } catch {
              // Ignore malformed realtime payloads and keep the socket alive.
            }
          }, {
            Authorization: `Bearer ${token}`,
          });
        });
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }

  subscribeToConversation(conversationId, onEvent) {
    return this.subscribeToConversations([conversationId], onEvent);
  }
}

export const chatRealtimeService = new ChatRealtimeService();

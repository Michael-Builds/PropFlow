import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from '../services/data/api-map';
import {
  ConversationDetail,
  ConversationSummary,
  ConversationType,
  MessageItem,
} from '../interfaces/messaging.interface';

@Injectable({ providedIn: 'root' })
export class MessagingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_BASE}/messages`;

  list() {
    return this.http.get<ConversationSummary[]>(this.base);
  }

  get(id: string) {
    return this.http.get<ConversationDetail>(`${this.base}/${id}`);
  }

  create(body: { type: ConversationType; subject?: string; body: string }) {
    return this.http.post<ConversationDetail>(this.base, body);
  }

  send(id: string, body: string) {
    return this.http.post<MessageItem>(`${this.base}/${id}/messages`, { body });
  }

  close(id: string) {
    return this.http.patch<{ ok: boolean }>(`${this.base}/${id}/close`, {});
  }
}

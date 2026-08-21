import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { DataCollection } from '../enums/data-collection.enum';
import { UserStatus } from '../enums/domain.enum';
import { DashboardData } from '../interfaces/dashboard.interface';
import { API_BASE, collectionPath, fromApi, toApi, unwrapItems, type RecordRow } from '../services/data/api-map';

@Injectable({ providedIn: 'root' })
export class DataApiService {
  private readonly http = inject(HttpClient);

  list(name: DataCollection): Observable<RecordRow[]> {
    const params = new HttpParams().set('page', '1').set('pageSize', '100');
    return this.http
      .get<unknown>(collectionPath(name), { params })
      .pipe(map((payload) => unwrapItems(payload).map((row) => fromApi(name, row))));
  }

  getById(name: DataCollection, id: string): Observable<RecordRow> {
    return this.http.get<RecordRow>(`${collectionPath(name)}/${id}`).pipe(map((row) => fromApi(name, row)));
  }

  dashboard(params?: { propertyId?: string; from?: string; to?: string }): Observable<DashboardData> {
    let httpParams = new HttpParams();
    if (params?.propertyId) httpParams = httpParams.set('propertyId', params.propertyId);
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    return this.http.get<DashboardData>(`${API_BASE}/dashboard/overview`, { params: httpParams });
  }

  create(name: DataCollection, payload: RecordRow): Observable<RecordRow> {
    const body = toApi(name, payload);
    const url = name === DataCollection.Invoices ? `${API_BASE}/invoices/generate` : collectionPath(name);
    return this.http.post<RecordRow>(url, body).pipe(map((row) => fromApi(name, row)));
  }

  update(name: DataCollection, id: string, payload: RecordRow): Observable<RecordRow> {
    return this.http
      .patch<RecordRow>(`${collectionPath(name)}/${id}`, toApi(name, payload))
      .pipe(map((row) => fromApi(name, row)));
  }

  remove(name: DataCollection, ids: string[]): Observable<void> {
    const requests = ids.map((id) => {
      if (name === DataCollection.Documents) {
        return this.http.delete(`${collectionPath(name)}/${id}`);
      }
      if (name === DataCollection.Users) {
        return this.http.patch(`${collectionPath(name)}/${id}`, { status: UserStatus.Disabled });
      }
      return of(null);
    });
    return forkJoin(requests).pipe(map(() => undefined));
  }

  markNotificationRead(id: string): Observable<unknown> {
    return this.http.patch(`${API_BASE}/notifications/${id}/read`, {});
  }

  renewLease(id: string, body: { endDate: string; rentAmount?: number; dueDay?: number }): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/leases/${id}/renew`, body);
  }

  terminateLease(id: string, body: { notes?: string } = {}): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/leases/${id}/terminate`, body);
  }

  leaseHistory(id: string): Observable<RecordRow[]> {
    return this.http.get<unknown>(`${API_BASE}/leases/${id}/history`).pipe(map((payload) => unwrapItems(payload)));
  }

  runArrearsReminders(): Observable<{ reminded: number }> {
    return this.http.post<{ reminded: number }>(`${API_BASE}/arrears/reminders/run`, {});
  }

  promiseToPay(
    invoiceId: string,
    body: { promiseToPayAt: string; promisedAmount?: number },
  ): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/arrears/${invoiceId}/promise-to-pay`, body);
  }

  escalateArrears(invoiceId: string, body: { level?: string; notes?: string } = {}): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/arrears/${invoiceId}/escalate`, body);
  }

  paymentReceipt(id: string): Observable<{ id: string; reference: string; contentType: string; body: string }> {
    return this.http.get<{ id: string; reference: string; contentType: string; body: string }>(
      `${API_BASE}/payments/${id}/receipt`,
    );
  }

  importUnits(file: File): Observable<{ created: number; errors: { row: number; message: string }[] }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ created: number; errors: { row: number; message: string }[] }>(
      `${API_BASE}/units/import`,
      form,
    );
  }

  assignTicket(id: string, body: { assigneeUserId?: string; vendorId?: string }): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/tickets/${id}/assign`, body);
  }

  resolveTicket(id: string, body: { notes?: string; costAmount?: number } = {}): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/tickets/${id}/resolve`, body);
  }

  closeTicket(id: string): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/tickets/${id}/close`, {});
  }

  startTicket(id: string): Observable<RecordRow> {
    return this.http.patch<RecordRow>(`${API_BASE}/tickets/${id}`, { status: 'in_progress' });
  }

  listTicketAttachments(id: string): Observable<RecordRow[]> {
    return this.http.get<unknown>(`${API_BASE}/tickets/${id}/attachments`).pipe(map((payload) => unwrapItems(payload)));
  }

  addTicketAttachment(id: string, body: { fileUrl: string; fileName: string }): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/tickets/${id}/attachments`, body);
  }

  createUploadUrl(fileName: string, contentType: string): Observable<{ key: string; uploadUrl: string; fileUrl: string }> {
    return this.http.post<{ key: string; uploadUrl: string; fileUrl: string }>(`${API_BASE}/documents/upload-url`, {
      fileName,
      contentType,
    });
  }

  complianceRules(): Observable<RecordRow[]> {
    return this.http.get<unknown>(`${API_BASE}/compliance/rules`).pipe(map((payload) => unwrapItems(payload)));
  }

  complianceScore(): Observable<RecordRow> {
    return this.http.get<RecordRow>(`${API_BASE}/compliance/score`);
  }

  upsertComplianceRule(body: RecordRow): Observable<RecordRow> {
    return this.http.post<RecordRow>(`${API_BASE}/compliance/rules`, body);
  }

  deleteComplianceRule(id: string): Observable<unknown> {
    return this.http.delete(`${API_BASE}/compliance/rules/${id}`);
  }

  exportPdf(resource: string): Observable<Blob> {
    return this.http.get(`${API_BASE}/exports/pdf/${resource}`, { responseType: 'blob' });
  }
}

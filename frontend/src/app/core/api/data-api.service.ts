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

  dashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${API_BASE}/dashboard/overview`);
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
}

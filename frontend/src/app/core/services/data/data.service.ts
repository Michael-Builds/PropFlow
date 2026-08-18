import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import { DataCollection, FormFieldOption, FormFieldOptionsFrom } from '../../interfaces/data.interface';
import { DashboardData } from '../../interfaces/dashboard.interface';
import { API_BASE, collectionPath, fromApi, toApi, unwrapItems, type RecordRow } from './api-map';

export type { RecordRow };

const LOOKUPS: DataCollection[] = ['properties', 'units', 'tenants', 'leases', 'invoices', 'users'];

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  readonly version = signal(0);
  private readonly cache: Record<DataCollection, RecordRow[]> = emptyCache();

  loadCollection<T = RecordRow>(name: DataCollection): Observable<T[]> {
    const params = new HttpParams().set('page', '1').set('pageSize', '100');
    return this.http.get<unknown>(collectionPath(name), { params }).pipe(
      map((payload) => unwrapItems(payload).map((row) => fromApi(name, row))),
      tap((rows) => {
        this.cache[name] = rows;
        this.version.update((n) => n + 1);
      }),
      map((rows) => rows as T[]),
    );
  }

  dashboard<T = DashboardData>(): Observable<T> {
    return this.http.get<T>(`${API_BASE}/dashboard/overview`);
  }

  loadDashboard<T = DashboardData>(): Observable<T> {
    return this.dashboard<T>();
  }

  related(name: DataCollection, predicate: (row: RecordRow) => boolean): Observable<RecordRow[]> {
    const cached = this.cache[name];
    if (cached.length) {
      return of(cached.filter(predicate).map((row) => ({ ...row })));
    }
    return this.loadCollection(name).pipe(map((rows) => rows.filter(predicate)));
  }

  getById<T = RecordRow>(name: DataCollection, id: string): Observable<T | null> {
    return this.http.get<RecordRow>(`${collectionPath(name)}/${id}`).pipe(
      map((row) => fromApi(name, row) as T),
      catchError(() => of(null)),
    );
  }

  listSync<T = RecordRow>(name: DataCollection): T[] {
    this.version();
    return this.cache[name] as T[];
  }

  findSync<T = RecordRow>(name: DataCollection, id: string): T | null {
    const row = this.cache[name].find((item) => item['id'] === id) ?? null;
    return (row ? { ...row } : null) as T | null;
  }

  create(name: DataCollection, payload: RecordRow): Observable<RecordRow> {
    const body = toApi(name, payload);
    const url = name === 'invoices' ? `${API_BASE}/invoices/generate` : collectionPath(name);
    return this.http.post<RecordRow>(url, body).pipe(
      map((row) => {
        const record = name === 'organizations' && row['organization']
          ? fromApi(name, row['organization'] as RecordRow)
          : fromApi(name, row);
        this.cache[name] = [record, ...this.cache[name]];
        this.version.update((n) => n + 1);
        return record;
      }),
    );
  }

  update(name: DataCollection, id: string, payload: RecordRow): Observable<RecordRow | null> {
    return this.http.patch<RecordRow>(`${collectionPath(name)}/${id}`, toApi(name, payload)).pipe(
      map((row) => {
        const record = fromApi(name, row);
        this.cache[name] = this.cache[name].map((item) => (item['id'] === id ? record : item));
        this.version.update((n) => n + 1);
        return record;
      }),
    );
  }

  remove(name: DataCollection, ids: string[]): Observable<void> {
    const requests = ids.map((id) => {
      if (name === 'documents') {
        return this.http.delete(`${collectionPath(name)}/${id}`);
      }
      if (name === 'users') {
        return this.http.patch(`${collectionPath(name)}/${id}`, { status: 'disabled' });
      }
      return of(null);
    });
    return forkJoin(requests).pipe(
      tap(() => {
        this.cache[name] = this.cache[name].filter((row) => !ids.includes(String(row['id'])));
        this.version.update((n) => n + 1);
      }),
      map(() => undefined),
    );
  }

  prefetchLookups(): void {
    for (const name of LOOKUPS) {
      this.loadCollection(name).subscribe({ error: () => undefined });
    }
  }

  listOptions(sources: FormFieldOptionsFrom | FormFieldOptionsFrom[]): FormFieldOption[] {
    this.version();
    const list = Array.isArray(sources) ? sources : [sources];
    const options: FormFieldOption[] = [];
    const seen = new Set<string>();
    for (const source of list) {
      for (const row of this.cache[source.collection]) {
        const value = String(row[source.valueKey ?? source.labelKey] ?? '').trim();
        const base = String(row[source.labelKey] ?? value).trim();
        if (!value || seen.has(value)) continue;
        seen.add(value);
        options.push({
          label: source.hint ? `${base} · ${source.hint}` : base,
          value,
        });
      }
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }
}

function emptyCache(): Record<DataCollection, RecordRow[]> {
  return {
    properties: [],
    units: [],
    tenants: [],
    leases: [],
    invoices: [],
    payments: [],
    arrears: [],
    tickets: [],
    documents: [],
    notifications: [],
    'audit-logs': [],
    users: [],
    organizations: [],
  };
}

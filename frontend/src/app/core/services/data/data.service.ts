import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DataCollection } from '../../interfaces/data.interface';
import properties from '../../mock/properties.json';
import units from '../../mock/units.json';
import tenants from '../../mock/tenants.json';
import leases from '../../mock/leases.json';
import invoices from '../../mock/invoices.json';
import payments from '../../mock/payments.json';
import arrears from '../../mock/arrears.json';
import tickets from '../../mock/tickets.json';
import documents from '../../mock/documents.json';
import notifications from '../../mock/notifications.json';
import auditLogs from '../../mock/audit-logs.json';
import dashboard from '../../mock/dashboard.json';

export type RecordRow = Record<string, unknown>;

const STORE: Record<DataCollection, RecordRow[]> = {
  properties: structuredClone(properties) as RecordRow[],
  units: structuredClone(units) as RecordRow[],
  tenants: structuredClone(tenants) as RecordRow[],
  leases: structuredClone(leases) as RecordRow[],
  invoices: structuredClone(invoices) as RecordRow[],
  payments: structuredClone(payments) as RecordRow[],
  arrears: structuredClone(arrears) as RecordRow[],
  tickets: structuredClone(tickets) as RecordRow[],
  documents: structuredClone(documents) as RecordRow[],
  notifications: structuredClone(notifications) as RecordRow[],
  'audit-logs': structuredClone(auditLogs) as RecordRow[],
};

const PREFIX: Record<DataCollection, string> = {
  properties: 'prp',
  units: 'unt',
  tenants: 'tnt',
  leases: 'lea',
  invoices: 'inv',
  payments: 'pay',
  arrears: 'arr',
  tickets: 'tck',
  documents: 'doc',
  notifications: 'ntf',
  'audit-logs': 'aud',
};

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly version = signal(0);

  loadCollection<T = RecordRow>(name: DataCollection): Observable<T[]> {
    this.version();
    return of(structuredClone(STORE[name]) as T[]).pipe(delay(160));
  }

  dashboard<T = typeof dashboard>(): Observable<T> {
    return of(structuredClone(dashboard) as T).pipe(delay(160));
  }

  loadDashboard<T = typeof dashboard>(): Observable<T> {
    return this.dashboard<T>();
  }

  related(name: DataCollection, predicate: (row: RecordRow) => boolean): Observable<RecordRow[]> {
    return of(STORE[name].filter(predicate).map((row) => structuredClone(row))).pipe(delay(80));
  }

  getById<T = RecordRow>(name: DataCollection, id: string): Observable<T | null> {
    const row = STORE[name].find((item) => item['id'] === id) ?? null;
    return of(structuredClone(row) as T | null).pipe(delay(80));
  }

  create(name: DataCollection, payload: RecordRow): RecordRow {
    const id = `${PREFIX[name]}_${String(STORE[name].length + 1).padStart(3, '0')}_${Date.now().toString().slice(-4)}`;
    const row = { ...payload, id };
    STORE[name] = [row, ...STORE[name]];
    this.version.update((n) => n + 1);
    return row;
  }

  update(name: DataCollection, id: string, payload: RecordRow): RecordRow | null {
    const index = STORE[name].findIndex((row) => row['id'] === id);
    if (index < 0) return null;
    const row = { ...STORE[name][index], ...payload, id };
    STORE[name] = STORE[name].map((item, i) => (i === index ? row : item));
    this.version.update((n) => n + 1);
    return row;
  }

  remove(name: DataCollection, ids: string[]): void {
    STORE[name] = STORE[name].filter((row) => !ids.includes(String(row['id'])));
    this.version.update((n) => n + 1);
  }
}

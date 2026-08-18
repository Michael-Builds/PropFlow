import { Injectable, inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, catchError, filter, map, of, switchMap, take, throwError } from 'rxjs';
import { DataCollection, FormFieldOption, FormFieldOptionsFrom } from '../../interfaces/data.interface';
import { DashboardData } from '../../interfaces/dashboard.interface';
import { RecordRow } from './api-map';
import { authFeature } from '../../../store/auth/auth.reducer';
import { CollectionsActions } from '../../../store/collections/collections.actions';
import { collectionsFeature } from '../../../store/collections/collections.reducer';
import { collectionEntitySelectors } from '../../../store/collections/collections.state';
import { DashboardActions } from '../../../store/dashboard/dashboard.actions';
import { dashboardFeature } from '../../../store/dashboard/dashboard.reducer';

export type { RecordRow };

const LOOKUPS: DataCollection[] = ['properties', 'units', 'tenants', 'leases', 'invoices', 'users'];

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly records = this.store.selectSignal(collectionsFeature.selectRecords);
  private readonly activeOrgId = this.store.selectSignal(authFeature.selectActiveOrgId);
  private readonly sessionUser = this.store.selectSignal(authFeature.selectUser);
  readonly version = this.store.selectSignal(collectionsFeature.selectVersion);

  loadCollection<T = RecordRow>(name: DataCollection): Observable<T[]> {
    this.store.dispatch(CollectionsActions.load({ name }));
    return this.actions$.pipe(
      ofType(CollectionsActions.loadSuccess, CollectionsActions.loadFailure),
      filter((action) => action.name === name),
      take(1),
      switchMap((action) =>
        action.type === CollectionsActions.loadFailure.type
          ? throwError(() => new Error(action.error))
          : of(action.rows as T[]),
      ),
    );
  }

  dashboard<T = DashboardData>(): Observable<T> {
    this.store.dispatch(DashboardActions.load());
    return this.actions$.pipe(
      ofType(DashboardActions.loadSuccess, DashboardActions.loadFailure),
      take(1),
      switchMap((action) =>
        action.type === DashboardActions.loadFailure.type
          ? throwError(() => new Error(action.error))
          : of(action.data as T),
      ),
    );
  }

  loadDashboard<T = DashboardData>(): Observable<T> {
    return this.dashboard<T>();
  }

  related(name: DataCollection, predicate: (row: RecordRow) => boolean): Observable<RecordRow[]> {
    const cached = this.listSync(name);
    if (cached.length) {
      return of(cached.filter(predicate).map((row) => ({ ...row })));
    }
    return this.loadCollection(name).pipe(map((rows) => rows.filter(predicate)));
  }

  getById<T = RecordRow>(name: DataCollection, id: string): Observable<T | null> {
    this.store.dispatch(CollectionsActions.loadOne({ name, id }));
    return this.actions$.pipe(
      ofType(CollectionsActions.loadOneSuccess, CollectionsActions.loadOneFailure),
      filter((action) => action.name === name && ('id' in action ? action.id === id : String(action.row['id']) === id)),
      take(1),
      map((action) => (action.type === CollectionsActions.loadOneSuccess.type ? (action.row as T) : null)),
      catchError(() => of(null)),
    );
  }

  listSync<T = RecordRow>(name: DataCollection): T[] {
    this.version();
    return collectionEntitySelectors.selectAll(this.records()[name]) as T[];
  }

  findSync<T = RecordRow>(name: DataCollection, id: string): T | null {
    this.version();
    const row = this.records()[name].entities[id] ?? null;
    return (row ? { ...row } : null) as T | null;
  }

  create(name: DataCollection, payload: RecordRow): Observable<RecordRow> {
    this.store.dispatch(CollectionsActions.create({ name, payload }));
    return this.actions$.pipe(
      ofType(CollectionsActions.createSuccess, CollectionsActions.createFailure),
      filter((action) => action.name === name),
      take(1),
      switchMap((action) =>
        action.type === CollectionsActions.createFailure.type
          ? throwError(() => new Error(action.error))
          : of(action.row),
      ),
    );
  }

  update(name: DataCollection, id: string, payload: RecordRow): Observable<RecordRow | null> {
    this.store.dispatch(CollectionsActions.update({ name, id, payload }));
    return this.actions$.pipe(
      ofType(CollectionsActions.updateSuccess, CollectionsActions.updateFailure),
      filter((action) => action.name === name),
      take(1),
      switchMap((action) =>
        action.type === CollectionsActions.updateFailure.type
          ? throwError(() => new Error(action.error))
          : of(action.row),
      ),
    );
  }

  remove(name: DataCollection, ids: string[]): Observable<void> {
    this.store.dispatch(CollectionsActions.remove({ name, ids }));
    return this.actions$.pipe(
      ofType(CollectionsActions.removeSuccess, CollectionsActions.removeFailure),
      filter((action) => action.name === name),
      take(1),
      switchMap((action) =>
        action.type === CollectionsActions.removeFailure.type
          ? throwError(() => new Error(action.error))
          : of(undefined),
      ),
    );
  }

  prefetchLookups(): void {
    if (this.sessionUser()?.role === 'platform_admin' && !this.activeOrgId()) return;
    this.store.dispatch(CollectionsActions.prefetchLookups({ names: LOOKUPS }));
  }

  listOptions(sources: FormFieldOptionsFrom | FormFieldOptionsFrom[]): FormFieldOption[] {
    this.version();
    const list = Array.isArray(sources) ? sources : [sources];
    const options: FormFieldOption[] = [];
    const seen = new Set<string>();
    for (const source of list) {
      for (const row of this.listSync(source.collection)) {
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

  dashboardSnapshot(): DashboardData | null {
    return this.store.selectSignal(dashboardFeature.selectData)();
  }
}

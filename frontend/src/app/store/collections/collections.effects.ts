import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, concatMap, map, mergeMap, of } from 'rxjs';
import { DataApiService } from '../../core/api/data-api.service';
import { httpErrorMessage } from '../../core/api/http-error';
import { DashboardActions } from '../dashboard/dashboard.actions';
import { CollectionsActions } from './collections.actions';

@Injectable()
export class CollectionsEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(DataApiService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionsActions.load),
      concatMap(({ name }) =>
        this.api.list(name).pipe(
          map((rows) => CollectionsActions.loadSuccess({ name, rows })),
          catchError((error) =>
            of(CollectionsActions.loadFailure({ name, error: httpErrorMessage(error, `Could not load ${name}.`) })),
          ),
        ),
      ),
    ),
  );

  prefetch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionsActions.prefetchLookups),
      mergeMap(({ names }) => names.map((name) => CollectionsActions.load({ name }))),
    ),
  );

  loadOne$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionsActions.loadOne),
      mergeMap(({ name, id }) =>
        this.api.getById(name, id).pipe(
          map((row) => CollectionsActions.loadOneSuccess({ name, row })),
          catchError((error) =>
            of(
              CollectionsActions.loadOneFailure({
                name,
                id,
                error: httpErrorMessage(error, 'Record not found.'),
              }),
            ),
          ),
        ),
      ),
    ),
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionsActions.create),
      concatMap(({ name, payload }) =>
        this.api.create(name, payload).pipe(
          map((row) => CollectionsActions.createSuccess({ name, row })),
          catchError((error) =>
            of(CollectionsActions.createFailure({ name, error: httpErrorMessage(error, 'Could not save this record.') })),
          ),
        ),
      ),
    ),
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionsActions.update),
      concatMap(({ name, id, payload }) =>
        this.api.update(name, id, payload).pipe(
          map((row) => CollectionsActions.updateSuccess({ name, row })),
          catchError((error) =>
            of(CollectionsActions.updateFailure({ name, error: httpErrorMessage(error, 'Could not save this record.') })),
          ),
        ),
      ),
    ),
  );

  remove$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionsActions.remove),
      concatMap(({ name, ids }) =>
        this.api.remove(name, ids).pipe(
          map(() => CollectionsActions.removeSuccess({ name, ids })),
          catchError((error) =>
            of(CollectionsActions.removeFailure({ name, error: httpErrorMessage(error, 'Could not remove those records.') })),
          ),
        ),
      ),
    ),
  );

  invalidateDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        CollectionsActions.createSuccess,
        CollectionsActions.updateSuccess,
        CollectionsActions.removeSuccess,
      ),
      map(() => DashboardActions.clear()),
    ),
  );

  markNotificationRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CollectionsActions.markNotificationRead),
      mergeMap(({ id }) =>
        this.api.markNotificationRead(id).pipe(
          map(() => CollectionsActions.markNotificationReadSuccess({ id })),
          catchError(() => of(CollectionsActions.markNotificationReadSuccess({ id }))),
        ),
      ),
    ),
  );
}

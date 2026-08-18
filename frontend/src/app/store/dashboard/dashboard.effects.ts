import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { DataApiService } from '../../core/api/data-api.service';
import { httpErrorMessage } from '../../core/api/http-error';
import { DashboardActions } from './dashboard.actions';

@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(DataApiService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.load),
      switchMap(() =>
        this.api.dashboard().pipe(
          map((data) => DashboardActions.loadSuccess({ data })),
          catchError((error) =>
            of(DashboardActions.loadFailure({ error: httpErrorMessage(error, 'Could not load dashboard.') })),
          ),
        ),
      ),
    ),
  );
}

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { DataCollection } from '../interfaces/data.interface';
import { DataService, RecordRow } from '../services/data/data.service';
import { LoaderService } from '../services/loader/loader.service';
import { ToastService } from '../services/toast/toast.service';

export function loadDetailRecord(options: {
  collection: DataCollection;
  id: string | null;
  listPath: string;
  loadingLabel: string;
  notFoundMessage: string;
  errorMessage: string;
}): Observable<RecordRow | null> | null {
  const data = inject(DataService);
  const loader = inject(LoaderService);
  const toast = inject(ToastService);
  const router = inject(Router);

  if (!options.id) {
    void router.navigateByUrl(options.listPath);
    return null;
  }

  const cached = data.findSync(options.collection, options.id);
  if (!cached) loader.show(options.loadingLabel);
  return data.getById<RecordRow>(options.collection, options.id).pipe(
    finalize(() => loader.hide()),
    tap({
      next: (record) => {
        if (!record) {
          toast.error(options.notFoundMessage);
          void router.navigateByUrl(options.listPath);
        }
      },
      error: () => toast.error(options.errorMessage),
    }),
  );
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, forkJoin, of, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { canReadCollection } from '../../../core/config/access';
import { COLLECTION_PAGES } from '../../../core/config/collections.config';
import { buildCollectionDetail, CollectionDetailModel } from '../../../core/config/detail.config';
import { DataCollection } from '../../../core/enums/data-collection.enum';
import { AuthService } from '../../../core/services/auth/auth.service';
import { DataService, RecordRow } from '../../../core/services/data/data.service';
import { LoaderService } from '../../../core/services/loader/loader.service';
import { ToastService } from '../../../core/services/toast/toast.service';
import { badgeVariantFor } from '../../../core/utils';
import { IconComponent } from '../../../shared/icons/icon.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { DetailActionsComponent } from '../../../shared/ui/detail-actions/detail-actions.component';
import { DetailDocumentsComponent } from '../../../shared/ui/detail-documents/detail-documents.component';
import { DetailFieldsComponent } from '../../../shared/ui/detail-fields/detail-fields.component';
import { DetailNotesComponent } from '../../../shared/ui/detail-notes/detail-notes.component';
import { DetailStatsComponent } from '../../../shared/ui/detail-stats/detail-stats.component';
import { DetailTimelineComponent } from '../../../shared/ui/detail-timeline/detail-timeline.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-collection-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IconComponent,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    DetailFieldsComponent,
    DetailStatsComponent,
    DetailTimelineComponent,
    DetailNotesComponent,
    DetailActionsComponent,
    DetailDocumentsComponent,
  ],
  templateUrl: './collection-detail-page.component.html',
  styleUrl: './collection-detail-page.component.css',
  host: { class: 'block space-y-4' },
})
export class CollectionDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);
  private readonly loader = inject(LoaderService);
  private readonly toast = inject(ToastService);

  readonly collection = signal<DataCollection>(DataCollection.Properties);
  readonly record = signal<RecordRow | null>(null);
  readonly view = signal<CollectionDetailModel | null>(null);

  readonly listPath = computed(() => `/${this.collection()}`);
  readonly config = computed(() => COLLECTION_PAGES[this.collection()]);
  readonly badgeVariant = computed(() => badgeVariantFor(this.view()?.badgeLabel ?? ''));

  constructor() {
    combineLatest([this.route.paramMap, this.route.data])
      .pipe(
        switchMap(([params, data]) => {
          const collection = (data['collection'] as DataCollection) ?? DataCollection.Properties;
          this.collection.set(collection);
          const id = params.get('id');
          const listPath = `/${collection}`;
          if (!id) {
            void this.router.navigateByUrl(listPath);
            return of(null);
          }
          const cached = this.data.findSync(collection, id);
          if (!cached) {
            this.loader.show(`Loading ${COLLECTION_PAGES[collection].title.toLowerCase()}...`);
          }
          return this.data.getById<RecordRow>(collection, id).pipe(
            finalize(() => this.loader.hide()),
            switchMap((record) => {
              if (!record) {
                this.toast.error('Record not found.');
                void this.router.navigateByUrl(listPath);
                return of(null);
              }
              return forkJoin({
                record: of(record),
                units: this.related(DataCollection.Units, (row) => row['propertyId'] === record['id'] || row['id'] === record['unitId']),
                leases: this.related(
                  DataCollection.Leases,
                  (row) =>
                    row['unitId'] === record['id'] ||
                    row['tenantId'] === record['id'] ||
                    row['id'] === record['lease'] ||
                    row['id'] === record['leaseId'],
                ),
                invoices: this.related(
                  DataCollection.Invoices,
                  (row) => row['tenantId'] === record['id'] || row['leaseId'] === record['id'] || row['id'] === record['invoiceId'],
                ),
                payments: this.related(
                  DataCollection.Payments,
                  (row) => row['invoiceId'] === record['id'] || row['tenantId'] === record['id'],
                ),
                tickets: this.related(
                  DataCollection.Tickets,
                  (row) => row['unitId'] === record['id'] || row['propertyId'] === record['id'],
                ),
                documents: this.related(
                  DataCollection.Documents,
                  (row) => row['entityId'] === record['id'] || row['id'] === record['id'],
                ),
              });
            }),
          );
        }),
      )
      .subscribe({
        next: (bundle) => {
          if (!bundle) return;
          this.record.set(bundle.record);
          this.view.set(
            buildCollectionDetail(this.collection(), bundle.record, {
              units: bundle.units,
              leases: bundle.leases,
              invoices: bundle.invoices,
              payments: bundle.payments,
              tickets: bundle.tickets,
              documents: bundle.documents,
            }),
          );
        },
        error: () => this.toast.error('Could not load this record.'),
      });
  }

  private related(name: DataCollection, predicate: (row: RecordRow) => boolean) {
    if (!canReadCollection(this.auth.role(), name)) return of([] as RecordRow[]);
    return this.data.related(name, predicate);
  }
}

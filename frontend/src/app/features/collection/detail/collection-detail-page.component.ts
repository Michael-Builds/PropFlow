import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, forkJoin, of, switchMap } from 'rxjs';
import { COLLECTION_PAGES } from '../../../core/config/collections.config';
import { buildCollectionDetail, CollectionDetailModel } from '../../../core/config/detail.config';
import { DataCollection } from '../../../core/interfaces/data.interface';
import { badgeVariantFor } from '../../../core/utils';
import { loadDetailRecord } from '../../../core/utils/detail-loader';
import { DataService, RecordRow } from '../../../core/services/data/data.service';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { DetailFieldsComponent } from '../../../shared/ui/detail-fields/detail-fields.component';
import { DetailStatsComponent } from '../../../shared/ui/detail-stats/detail-stats.component';
import { DetailTimelineComponent } from '../../../shared/ui/detail-timeline/detail-timeline.component';
import { DetailNotesComponent } from '../../../shared/ui/detail-notes/detail-notes.component';
import { DetailActionsComponent } from '../../../shared/ui/detail-actions/detail-actions.component';
import { DetailDocumentsComponent } from '../../../shared/ui/detail-documents/detail-documents.component';

@Component({
  selector: 'app-collection-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
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
  private readonly data = inject(DataService);

  readonly collection = signal<DataCollection>('properties');
  readonly record = signal<RecordRow | null>(null);
  readonly view = signal<CollectionDetailModel | null>(null);

  readonly listPath = computed(() => `/${this.collection()}`);
  readonly config = computed(() => COLLECTION_PAGES[this.collection()]);
  readonly badgeVariant = computed(() => badgeVariantFor(this.view()?.badgeLabel ?? ''));

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap(() => combineLatest([this.route.paramMap, this.route.data])),
        switchMap(([params, data]) => {
          const collection = (data['collection'] as DataCollection) ?? 'properties';
          this.collection.set(collection);
          const id = params.get('id');
          const stream = loadDetailRecord({
            collection,
            id,
            listPath: `/${collection}`,
            loadingLabel: `Loading ${COLLECTION_PAGES[collection].title.toLowerCase()}...`,
            notFoundMessage: 'Record not found.',
            errorMessage: 'Could not load this record.',
          });
          if (!stream) return of(null);
          return stream.pipe(
            switchMap((record) => {
              if (!record) return of(null);
              return forkJoin({
                record: of(record),
                units: this.data.related('units', (row) => row['propertyId'] === record['id'] || row['id'] === record['unitId']),
                leases: this.data.related(
                  'leases',
                  (row) =>
                    row['unitId'] === record['id'] ||
                    row['tenantId'] === record['id'] ||
                    row['id'] === record['lease'] ||
                    row['id'] === record['leaseId'],
                ),
                invoices: this.data.related(
                  'invoices',
                  (row) => row['tenantId'] === record['id'] || row['leaseId'] === record['id'] || row['id'] === record['invoiceId'],
                ),
                payments: this.data.related(
                  'payments',
                  (row) => row['invoiceId'] === record['id'] || row['tenantId'] === record['id'],
                ),
                tickets: this.data.related(
                  'tickets',
                  (row) => row['unitId'] === record['id'] || row['propertyId'] === record['id'],
                ),
                documents: this.data.related(
                  'documents',
                  (row) => row['entityId'] === record['id'] || row['id'] === record['id'],
                ),
              });
            }),
          );
        }),
      )
      .subscribe((bundle) => {
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
      });
  }
}

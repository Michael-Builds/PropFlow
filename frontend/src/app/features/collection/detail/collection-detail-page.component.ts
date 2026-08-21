import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, forkJoin, of, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DataApiService } from '../../../core/api/data-api.service';
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
import { FormDialogComponent } from '../../../shared/ui/form-dialog/form-dialog.component';
import { InputComponent } from '../../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea.component';

@Component({
  selector: 'app-collection-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
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
    FormDialogComponent,
    InputComponent,
    SelectComponent,
    TextareaComponent,
  ],
  templateUrl: './collection-detail-page.component.html',
  styleUrl: './collection-detail-page.component.css',
  host: { class: 'block space-y-4' },
})
export class CollectionDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  private readonly api = inject(DataApiService);
  private readonly auth = inject(AuthService);
  private readonly loader = inject(LoaderService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly collection = signal<DataCollection>(DataCollection.Properties);
  readonly record = signal<RecordRow | null>(null);
  readonly view = signal<CollectionDetailModel | null>(null);
  readonly history = signal<RecordRow[]>([]);
  readonly attachments = signal<RecordRow[]>([]);
  readonly dialog = signal<'renew' | 'terminate' | 'assign' | 'promise' | 'escalate' | null>(null);

  readonly listPath = computed(() => `/${this.collection()}`);
  readonly config = computed(() => COLLECTION_PAGES[this.collection()]);
  readonly badgeVariant = computed(() => badgeVariantFor(this.view()?.badgeLabel ?? ''));
  readonly vendorOptions = computed(() =>
    this.data.listOptions({ collection: DataCollection.Vendors, labelKey: 'name', valueKey: 'id' }),
  );

  readonly renewForm = this.fb.nonNullable.group({
    endDate: ['', Validators.required],
    rentAmount: [''],
    dueDay: [''],
  });
  readonly terminateForm = this.fb.nonNullable.group({ notes: [''] });
  readonly assignForm = this.fb.nonNullable.group({ vendorId: ['', Validators.required] });
  readonly promiseForm = this.fb.nonNullable.group({
    promiseToPayAt: ['', Validators.required],
    promisedAmount: [''],
  });
  readonly escalateForm = this.fb.nonNullable.group({ notes: [''] });

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
              if (collection === DataCollection.Leases) {
                this.api.leaseHistory(id).subscribe({
                  next: (rows) => this.history.set(rows),
                  error: () => this.history.set([]),
                });
              }
              if (collection === DataCollection.Tickets) {
                this.api.listTicketAttachments(id).subscribe({
                  next: (rows) => this.attachments.set(rows),
                  error: () => this.attachments.set([]),
                });
                this.data.loadCollection(DataCollection.Vendors).subscribe({ error: () => undefined });
              }
              return forkJoin({
                record: of(record),
                units: this.related(DataCollection.Units, (row) => row['propertyId'] === record['id'] || row['id'] === record['unitId'] || row['blockId'] === record['id']),
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
                  (row) =>
                    row['unitId'] === record['id'] ||
                    row['propertyId'] === record['id'] ||
                    row['vendorId'] === record['id'],
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

  reload(): void {
    const id = String(this.record()?.['id'] ?? '');
    if (!id) return;
    this.data.getById(this.collection(), id, { force: true }).subscribe({
      next: (record) => {
        this.record.set(record);
        void this.router.navigateByUrl(`/${this.collection()}/${id}`);
      },
    });
  }

  openRenew(): void {
    const record = this.record();
    if (!record) return;
    this.renewForm.reset({
      endDate: String(record['endDate'] ?? ''),
      rentAmount: String(record['rentAmount'] ?? ''),
      dueDay: String(record['dueDay'] ?? ''),
    });
    this.dialog.set('renew');
  }

  openTerminate(): void {
    this.terminateForm.reset({ notes: '' });
    this.dialog.set('terminate');
  }

  submitDialog(): void {
    const id = String(this.record()?.['id'] ?? '');
    const kind = this.dialog();
    if (!id || !kind) return;

    if (kind === 'renew') {
      const value = this.renewForm.getRawValue();
      this.api
        .renewLease(id, {
          endDate: value.endDate,
          rentAmount: value.rentAmount ? Number(value.rentAmount) : undefined,
          dueDay: value.dueDay ? Number(value.dueDay) : undefined,
        })
        .subscribe({
          next: () => {
            this.toast.success('Lease renewed.');
            this.dialog.set(null);
            this.reload();
          },
          error: () => this.toast.error('Could not renew lease.'),
        });
      return;
    }

    if (kind === 'terminate') {
      this.api.terminateLease(id, { notes: this.terminateForm.value.notes || undefined }).subscribe({
        next: () => {
          this.toast.success('Lease terminated.');
          this.dialog.set(null);
          this.reload();
        },
        error: () => this.toast.error('Could not terminate lease.'),
      });
      return;
    }

    if (kind === 'assign') {
      this.api.assignTicket(id, { vendorId: this.assignForm.value.vendorId || undefined }).subscribe({
        next: () => {
          this.toast.success('Ticket assigned.');
          this.dialog.set(null);
          this.reload();
        },
        error: () => this.toast.error('Could not assign ticket.'),
      });
      return;
    }

    if (kind === 'promise') {
      const invoiceId = String(this.record()?.['invoiceId'] ?? id);
      const value = this.promiseForm.getRawValue();
      this.api
        .promiseToPay(invoiceId, {
          promiseToPayAt: value.promiseToPayAt,
          promisedAmount: value.promisedAmount ? Number(value.promisedAmount) : undefined,
        })
        .subscribe({
          next: () => {
            this.toast.success('Promise recorded.');
            this.dialog.set(null);
            this.reload();
          },
          error: () => this.toast.error('Could not record promise.'),
        });
      return;
    }

    if (kind === 'escalate') {
      const invoiceId = String(this.record()?.['invoiceId'] ?? id);
      this.api.escalateArrears(invoiceId, { notes: this.escalateForm.value.notes || undefined }).subscribe({
        next: () => {
          this.toast.success('Escalated.');
          this.dialog.set(null);
          this.reload();
        },
        error: () => this.toast.error('Could not escalate.'),
      });
    }
  }

  startTicket(): void {
    const id = String(this.record()?.['id'] ?? '');
    this.api.startTicket(id).subscribe({
      next: () => {
        this.toast.success('In progress.');
        this.reload();
      },
      error: () => this.toast.error('Could not update ticket.'),
    });
  }

  resolveTicket(): void {
    const id = String(this.record()?.['id'] ?? '');
    this.api.resolveTicket(id).subscribe({
      next: () => {
        this.toast.success('Resolved.');
        this.reload();
      },
      error: () => this.toast.error('Could not resolve ticket.'),
    });
  }

  closeTicket(): void {
    const id = String(this.record()?.['id'] ?? '');
    this.api.closeTicket(id).subscribe({
      next: () => {
        this.toast.success('Closed.');
        this.reload();
      },
      error: () => this.toast.error('Could not close ticket.'),
    });
  }

  downloadReceipt(): void {
    const id = String(this.record()?.['id'] ?? '');
    this.api.paymentReceipt(id).subscribe({
      next: (receipt) => {
        const blob = new Blob([receipt.body], { type: receipt.contentType || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receipt.reference || id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Could not download receipt.'),
    });
  }

  async onAttach(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const id = String(this.record()?.['id'] ?? '');
    if (!file || !id) return;
    this.api.createUploadUrl(file.name, file.type || 'application/octet-stream').subscribe({
      next: async (presign) => {
        try {
          await fetch(presign.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
          this.api.addTicketAttachment(id, { fileUrl: presign.fileUrl, fileName: file.name }).subscribe({
            next: () => {
              this.toast.success('Attachment added.');
              this.api.listTicketAttachments(id).subscribe({ next: (rows) => this.attachments.set(rows) });
            },
            error: () => this.toast.error('Could not register attachment.'),
          });
        } catch {
          this.toast.error('Upload failed.');
        }
      },
      error: () => this.toast.error('Could not get upload URL.'),
    });
  }

  private related(name: DataCollection, predicate: (row: RecordRow) => boolean) {
    if (!canReadCollection(this.auth.role(), name)) return of([] as RecordRow[]);
    return this.data.related(name, predicate);
  }
}

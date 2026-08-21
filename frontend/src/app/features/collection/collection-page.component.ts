import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  COLLECTION_COLUMNS,
  COLLECTION_FIELDS,
  COLLECTION_FILTERS,
  COLLECTION_PAGES,
} from '../../core/config/collections.config';
import { DataApiService } from '../../core/api/data-api.service';
import {
  AGREEMENT_SOURCE_COLLECTIONS,
  AgreementTemplateId,
  DataCollection,
  TicketStatus,
  UnitStatus,
  UserRoles,
} from '../../core/enums';
import { DataTableColumn, DataTableRowActionEvent } from '../../core/interfaces/data-table.interface';
import { FormField, FormFieldOption } from '../../core/interfaces/data.interface';
import { AuthService } from '../../core/services/auth/auth.service';
import { DataService, RecordRow } from '../../core/services/data/data.service';
import { LoaderService } from '../../core/services/loader/loader.service';
import { ModalService } from '../../core/services/modal/modal.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { prettyLabel } from '../../core/utils';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { DataTableComponent } from '../../shared/ui/data-table/data-table.component';
import { FormDialogComponent } from '../../shared/ui/form-dialog/form-dialog.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../shared/ui/select/select.component';
import { TextareaComponent } from '../../shared/ui/textarea/textarea.component';
import { GenerateAgreementDialogComponent } from '../documents/generate-agreement/generate-agreement-dialog.component';

const GENERATE_COLLECTIONS: readonly DataCollection[] = AGREEMENT_SOURCE_COLLECTIONS;
const BOARD_STATUSES = [
  TicketStatus.Open,
  TicketStatus.Assigned,
  TicketStatus.InProgress,
  TicketStatus.Resolved,
  TicketStatus.Closed,
] as const;

const ENTITY_PATH: Record<string, string> = {
  property: 'properties',
  unit: 'units',
  tenant: 'tenants',
  lease: 'leases',
  ticket: 'tickets',
  invoice: 'invoices',
};

@Component({
  selector: 'app-collection-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    DataTableComponent,
    FormDialogComponent,
    GenerateAgreementDialogComponent,
    InputComponent,
    SelectComponent,
    TextareaComponent,
  ],
  templateUrl: './collection-page.component.html',
  styleUrl: './collection-page.component.css',
})
export class CollectionPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  private readonly api = inject(DataApiService);
  private readonly loader = inject(LoaderService);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  collection: DataCollection = DataCollection.Properties;
  config = COLLECTION_PAGES[DataCollection.Properties];
  columns: DataTableColumn[] = COLLECTION_COLUMNS[DataCollection.Properties];
  filters = COLLECTION_FILTERS[DataCollection.Properties];
  fields: FormField[] = COLLECTION_FIELDS[DataCollection.Properties];
  form: FormGroup = this.fb.group({});

  readonly rows = signal<RecordRow[]>([]);
  readonly loading = signal(false);
  readonly dialogOpen = signal(false);
  readonly saving = signal(false);
  readonly editing = signal<RecordRow | null>(null);
  readonly generateOpen = signal(false);
  readonly generateTemplateId = signal<string | null>(null);
  readonly generateLeaseId = signal<string | null>(null);
  readonly generateTenantId = signal<string | null>(null);
  readonly generateUnitId = signal<string | null>(null);
  readonly ticketView = signal<'table' | 'board'>('table');
  readonly actionDialog = signal<'promise' | 'escalate' | 'assign' | null>(null);
  readonly actionRow = signal<RecordRow | null>(null);
  readonly actionForm = this.fb.nonNullable.group({
    promiseToPayAt: [''],
    promisedAmount: [''],
    notes: [''],
    vendorId: [''],
  });

  readonly boardColumns = computed(() =>
    BOARD_STATUSES.map((status) => ({
      status,
      label: prettyLabel(status),
      rows: this.rows().filter((row) => String(row['status'] ?? '') === status),
    })),
  );

  readonly vendorOptions = computed(() => this.data.listOptions({ collection: DataCollection.Vendors, labelKey: 'name', valueKey: 'id' }));

  constructor() {
    this.route.data.subscribe((data) => {
      this.apply((data['collection'] as DataCollection) ?? DataCollection.Properties);
      this.maybeOpenGenerate(this.route.snapshot.queryParamMap);
    });
    this.route.queryParamMap.subscribe((query) => this.maybeOpenGenerate(query));
  }

  canGenerate(): boolean {
    return this.auth.canAccess(UserRoles.collections) && GENERATE_COLLECTIONS.includes(this.collection);
  }

  openGenerate(): void {
    this.generateTemplateId.set(
      this.collection === DataCollection.Tenants
        ? AgreementTemplateId.TenantInformation
        : AgreementTemplateId.LeaseAgreement,
    );
    this.generateLeaseId.set(null);
    this.generateTenantId.set(null);
    this.generateUnitId.set(null);
    this.generateOpen.set(true);
  }

  closeGenerate(): void {
    this.generateOpen.set(false);
    this.generateTemplateId.set(null);
    this.generateLeaseId.set(null);
    this.generateTenantId.set(null);
    this.generateUnitId.set(null);
    const query = this.route.snapshot.queryParamMap;
    if (query.get('generate') || query.get('leaseId') || query.get('tenantId') || query.get('unitId')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { generate: null, leaseId: null, tenantId: null, unitId: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  onAgreementSaved(): void {
    if (this.collection === DataCollection.Documents) this.refresh();
  }

  refresh(force = false): void {
    if (!force && this.data.isCollectionLoaded(this.collection)) {
      this.rows.set(this.data.listSync(this.collection));
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    if (force || !this.data.isCollectionLoaded(this.collection)) {
      this.loader.show();
    }
    this.data.loadCollection(this.collection, { force }).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
        this.loader.hide();
      },
      error: () => {
        this.loading.set(false);
        this.loader.hide();
        this.toast.error(`Could not load ${this.config.title.toLowerCase()}.`);
      },
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset();
    this.dialogOpen.set(true);
  }

  openDetail(row: RecordRow): void {
    const id = row['id'];
    if (!id) return;
    if (this.collection === DataCollection.Notifications) {
      const entityType = String(row['entityType'] ?? '');
      const entityId = String(row['entityId'] ?? '');
      const path = ENTITY_PATH[entityType];
      if (path && entityId) {
        void this.router.navigate(['/', path, entityId]);
        return;
      }
    }
    void this.router.navigate(['/', this.collection, id]);
  }

  openEdit(row: RecordRow): void {
    if (!this.config.canEdit) {
      this.openDetail(row);
      return;
    }
    this.editing.set(row);
    this.form.reset(row);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.editing.set(null);
  }

  optionsFor(field: FormField): FormFieldOption[] {
    if (field.options?.length) return field.options;
    if (field.optionsFrom) return this.data.listOptions(field.optionsFrom);
    return [];
  }

  isSearchable(field: FormField): boolean {
    return field.searchable === true || !!field.optionsFrom;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue() as RecordRow;
    const current = this.editing();
    const request = current?.['id']
      ? this.data.update(this.collection, String(current['id']), payload)
      : this.data.create(this.collection, payload);
    request.subscribe({
      next: async (created) => {
        this.saving.set(false);
        if (!current && this.collection === DataCollection.Organizations) {
          const email = String(created?.['ownerEmail'] ?? payload['ownerEmail'] ?? '');
          const temp = String(created?.['temporaryPassword'] ?? '');
          await this.modal.confirm({
            title: 'Company created',
            message: temp
              ? `Owner invite sent to ${email}. Temporary password (also emailed):\n\n${temp}\n\nThey must finish onboarding before the workspace unlocks.`
              : `Company created. Owner invite sent to ${email}. They must finish onboarding before the workspace unlocks.`,
            confirmLabel: 'Done',
          });
        } else {
          this.toast.success(current ? 'Record updated.' : 'Record created.');
        }
        this.closeDialog();
        this.refresh(true);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Could not save this record.');
      },
    });
  }

  async onRowAction(event: DataTableRowActionEvent<RecordRow>): Promise<void> {
    if (event.action.id === 'view') {
      this.openDetail(event.row);
      return;
    }
    if (event.action.id === 'edit') {
      this.openEdit(event.row);
      return;
    }
    if (event.action.id === 'delete') {
      await this.deleteRows([event.row]);
      return;
    }
    if (event.action.id === 'receipt') {
      this.downloadReceipt(String(event.row['id']));
      return;
    }
    if (event.action.id === 'promise') {
      this.actionRow.set(event.row);
      this.actionForm.reset({ promiseToPayAt: '', promisedAmount: '', notes: '', vendorId: '' });
      this.actionDialog.set('promise');
      return;
    }
    if (event.action.id === 'escalate') {
      this.actionRow.set(event.row);
      this.actionForm.reset({ promiseToPayAt: '', promisedAmount: '', notes: '', vendorId: '' });
      this.actionDialog.set('escalate');
    }
  }

  async onBulkDelete(rows: RecordRow[]): Promise<void> {
    await this.deleteRows(rows);
  }

  runReminders(): void {
    this.api.runArrearsReminders().subscribe({
      next: (res) => {
        this.toast.success(`Queued ${res.reminded} reminder${res.reminded === 1 ? '' : 's'}.`);
        this.refresh(true);
      },
      error: () => this.toast.error('Could not run reminders.'),
    });
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.api.importUnits(file).subscribe({
      next: (res) => {
        this.toast.success(`Imported ${res.created} unit${res.created === 1 ? '' : 's'}${res.errors.length ? ` (${res.errors.length} errors)` : ''}.`);
        this.refresh(true);
      },
      error: () => this.toast.error('CSV import failed.'),
    });
  }

  async bulkSetMaintenance(rows: RecordRow[]): Promise<void> {
    if (!rows.length) return;
    const ok = await this.modal.confirm({
      title: 'Mark units as maintenance?',
      message: `Set ${rows.length} selected unit(s) to maintenance hold.`,
      confirmLabel: 'Update',
    });
    if (!ok) return;
    forkJoin(
      rows.map((row) =>
        this.data.update(DataCollection.Units, String(row['id']), { status: UnitStatus.Maintenance }),
      ),
    ).subscribe({
      next: () => {
        this.toast.success('Units updated.');
        this.refresh(true);
      },
      error: () => this.toast.error('Could not update units.'),
    });
  }

  submitActionDialog(): void {
    const row = this.actionRow();
    const kind = this.actionDialog();
    if (!row || !kind) return;
    const id = String(row['invoiceId'] ?? row['id']);
    const value = this.actionForm.getRawValue();
    if (kind === 'promise') {
      if (!value.promiseToPayAt) {
        this.toast.error('Promise date is required.');
        return;
      }
      this.api
        .promiseToPay(id, {
          promiseToPayAt: value.promiseToPayAt,
          promisedAmount: value.promisedAmount ? Number(value.promisedAmount) : undefined,
        })
        .subscribe({
          next: () => {
            this.toast.success('Promise to pay recorded.');
            this.actionDialog.set(null);
            this.refresh(true);
          },
          error: () => this.toast.error('Could not record promise.'),
        });
      return;
    }
    if (kind === 'escalate') {
      this.api.escalateArrears(id, { notes: value.notes || undefined }).subscribe({
        next: () => {
          this.toast.success('Arrears escalated.');
          this.actionDialog.set(null);
          this.refresh(true);
        },
        error: () => this.toast.error('Could not escalate.'),
      });
      return;
    }
    if (kind === 'assign') {
      if (!value.vendorId) {
        this.toast.error('Select a vendor.');
        return;
      }
      this.api.assignTicket(String(row['id']), { vendorId: value.vendorId }).subscribe({
        next: () => {
          this.toast.success('Ticket assigned.');
          this.actionDialog.set(null);
          this.refresh(true);
        },
        error: () => this.toast.error('Could not assign ticket.'),
      });
    }
  }

  openAssign(row: RecordRow): void {
    this.actionRow.set(row);
    this.actionForm.reset({ promiseToPayAt: '', promisedAmount: '', notes: '', vendorId: '' });
    this.actionDialog.set('assign');
  }

  startTicket(row: RecordRow): void {
    this.api.startTicket(String(row['id'])).subscribe({
      next: () => {
        this.toast.success('Ticket in progress.');
        this.refresh(true);
      },
      error: () => this.toast.error('Could not start ticket.'),
    });
  }

  resolveTicket(row: RecordRow): void {
    this.api.resolveTicket(String(row['id'])).subscribe({
      next: () => {
        this.toast.success('Ticket resolved.');
        this.refresh(true);
      },
      error: () => this.toast.error('Could not resolve ticket.'),
    });
  }

  closeTicket(row: RecordRow): void {
    this.api.closeTicket(String(row['id'])).subscribe({
      next: () => {
        this.toast.success('Ticket closed.');
        this.refresh(true);
      },
      error: () => this.toast.error('Could not close ticket.'),
    });
  }

  private downloadReceipt(id: string): void {
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

  private apply(collection: DataCollection): void {
    this.collection = collection;
    this.config = COLLECTION_PAGES[collection];
    this.columns = COLLECTION_COLUMNS[collection];
    this.filters = COLLECTION_FILTERS[collection];
    this.fields = COLLECTION_FIELDS[collection];
    this.ticketView.set('table');
    this.closeDialog();
    this.generateOpen.set(false);
    this.actionDialog.set(null);
    this.buildForm();
    this.data.prefetchLookups();
    if (collection === DataCollection.Tickets || collection === DataCollection.Units) {
      this.data.loadCollection(DataCollection.Vendors).subscribe({ error: () => undefined });
    }
    this.refresh();
  }

  private maybeOpenGenerate(query: ParamMap): void {
    if (!this.canGenerate()) return;
    const generate = query.get('generate');
    if (!generate) return;
    this.generateTemplateId.set(generate === '1' ? null : generate);
    this.generateLeaseId.set(query.get('leaseId'));
    this.generateTenantId.set(query.get('tenantId'));
    this.generateUnitId.set(query.get('unitId'));
    this.generateOpen.set(true);
  }

  private async deleteRows(rows: RecordRow[]): Promise<void> {
    if (!this.config.canDelete || !rows.length) return;
    const confirmed = await this.modal.confirm({
      title: `Delete ${rows.length === 1 ? 'record' : `${rows.length} records`}?`,
      message: 'This removes the selected rows from the operator workspace.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    this.data
      .remove(
        this.collection,
        rows.map((row) => String(row['id'])),
      )
      .subscribe({
        next: () => {
          this.toast.success('Records removed.');
          this.refresh(true);
        },
        error: () => this.toast.error('Could not remove those records.'),
      });
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};
    for (const field of this.fields) {
      group[field.key] = this.fb.control('', field.required ? Validators.required : []);
    }
    this.form = this.fb.group(group);
  }
}

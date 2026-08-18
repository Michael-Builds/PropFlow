import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  COLLECTION_COLUMNS,
  COLLECTION_FIELDS,
  COLLECTION_FILTERS,
  COLLECTION_PAGES,
} from '../../core/config/collections.config';
import { DataCollection, FormField, FormFieldOption } from '../../core/interfaces/data.interface';
import { DataTableColumn, DataTableRowActionEvent } from '../../core/interfaces/data-table.interface';
import { AuthService } from '../../core/services/auth/auth.service';
import { DataService, RecordRow } from '../../core/services/data/data.service';
import { LoaderService } from '../../core/services/loader/loader.service';
import { ModalService } from '../../core/services/modal/modal.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { GenerateAgreementDialogComponent } from '../documents/generate-agreement/generate-agreement-dialog.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { DataTableComponent } from '../../shared/ui/data-table/data-table.component';
import { FormDialogComponent } from '../../shared/ui/form-dialog/form-dialog.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../shared/ui/select/select.component';
import { TextareaComponent } from '../../shared/ui/textarea/textarea.component';

const GENERATE_COLLECTIONS: DataCollection[] = ['documents', 'leases', 'tenants', 'units'];

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
  private readonly loader = inject(LoaderService);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(ModalService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  collection: DataCollection = 'properties';
  config = COLLECTION_PAGES.properties;
  columns: DataTableColumn[] = COLLECTION_COLUMNS.properties;
  filters = COLLECTION_FILTERS.properties;
  fields: FormField[] = COLLECTION_FIELDS.properties;
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

  constructor() {
    this.route.data.subscribe((data) => {
      this.apply((data['collection'] as DataCollection) ?? 'properties');
      this.maybeOpenGenerate(this.route.snapshot.queryParamMap);
    });
    this.route.queryParamMap.subscribe((query) => this.maybeOpenGenerate(query));
  }

  canGenerate(): boolean {
    return this.auth.canAccess(['owner', 'manager', 'finance']) && GENERATE_COLLECTIONS.includes(this.collection);
  }

  openGenerate(): void {
    this.generateTemplateId.set(this.collection === 'tenants' ? 'tenant_information' : 'lease_agreement');
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
    if (this.collection === 'documents') this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.loader.show();
    this.data.loadCollection(this.collection).subscribe({
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
      next: () => {
        this.saving.set(false);
        this.toast.success(current ? 'Record updated.' : 'Record created.');
        this.closeDialog();
        this.refresh();
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
    }
  }

  async onBulkDelete(rows: RecordRow[]): Promise<void> {
    await this.deleteRows(rows);
  }

  private apply(collection: DataCollection): void {
    this.collection = collection;
    this.config = COLLECTION_PAGES[collection];
    this.columns = COLLECTION_COLUMNS[collection];
    this.filters = COLLECTION_FILTERS[collection];
    this.fields = COLLECTION_FIELDS[collection];
    this.closeDialog();
    this.generateOpen.set(false);
    this.buildForm();
    this.data.prefetchLookups();
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
    this.data.remove(
      this.collection,
      rows.map((row) => String(row['id'])),
    ).subscribe({
      next: () => {
        this.toast.success('Records removed.');
        this.refresh();
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

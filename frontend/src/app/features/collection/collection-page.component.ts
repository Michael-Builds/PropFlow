import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  COLLECTION_COLUMNS,
  COLLECTION_FIELDS,
  COLLECTION_FILTERS,
  COLLECTION_PAGES,
} from '../../core/config/collections.config';
import { DataCollection, FormField } from '../../core/interfaces/data.interface';
import { DataTableColumn, DataTableRowActionEvent } from '../../core/interfaces/data-table.interface';
import { DataService, RecordRow } from '../../core/services/data/data.service';
import { LoaderService } from '../../core/services/loader/loader.service';
import { ModalService } from '../../core/services/modal/modal.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { DataTableComponent } from '../../shared/ui/data-table/data-table.component';
import { FormDialogComponent } from '../../shared/ui/form-dialog/form-dialog.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../shared/ui/select/select.component';

@Component({
  selector: 'app-collection-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    DataTableComponent,
    FormDialogComponent,
    InputComponent,
    SelectComponent,
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

  constructor() {
    this.route.data.subscribe((data) => {
      this.apply((data['collection'] as DataCollection) ?? 'properties');
    });
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
      this.toast.info(String(row['message'] ?? row['title'] ?? 'Record loaded.'));
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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue() as RecordRow;
    const current = this.editing();
    if (current?.['id']) {
      this.data.update(this.collection, String(current['id']), payload);
      this.toast.success('Record updated.');
    } else {
      this.data.create(this.collection, payload);
      this.toast.success('Record created.');
    }
    this.saving.set(false);
    this.closeDialog();
    this.refresh();
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
    this.buildForm();
    this.refresh();
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
    );
    this.toast.success('Records removed.');
    this.refresh();
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};
    for (const field of this.fields) {
      group[field.key] = this.fb.control('', field.required ? Validators.required : []);
    }
    this.form = this.fb.group(group);
  }
}

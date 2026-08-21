import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { IconComponent } from '../../icons/icon.component';
import { ButtonComponent } from '../button/button.component';
import { LoaderComponent } from '../loader/loader.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { SelectComponent } from '../select/select.component';
import { BadgeComponent } from '../badge/badge.component';
import { SelectOption } from '../../../core/interfaces/select.interface';
import { BadgeVariant } from '../../../core/interfaces/badge.interface';
import {
  DataTableCellType,
  DataTableColumn,
  DataTableFilter,
  DataTableRowAction,
  DataTableRowActionEvent,
} from '../../../core/interfaces/data-table.interface';
import { formatDisplayDate } from '../../../core/utils';
import { RowActionsComponent } from '../row-actions/row-actions.component';
import { downloadDataTableCsv, downloadDataTablePdf } from './data-table.export';

export type {
  DataTableAlign,
  DataTableCellType,
  DataTableColumn,
  DataTableFilterOption,
  DataTableFilter,
  DataTableRowAction,
  DataTableRowActionEvent,
} from '../../../core/interfaces/data-table.interface';

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NgIcon,
    IconComponent,
    ButtonComponent,
    LoaderComponent,
    EmptyStateComponent,
    CheckboxComponent,
    SelectComponent,
    BadgeComponent,
    RowActionsComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
})
export class DataTableComponent<T = any> {
  private readonly exportMenuRoot = viewChild<ElementRef<HTMLElement>>('exportMenuRoot');

  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly data = input.required<T[]>();
  readonly rowIdKey = input('id');
  readonly loading = input(false);
  readonly searchable = input(true);
  readonly searchPlaceholder = input('Search records...');
  readonly filters = input<DataTableFilter[]>([]);
  readonly selectable = input(true);
  readonly exportable = input(true);
  readonly exportFileName = input('propflow-export');
  readonly exportTitle = input('');
  readonly pageSizeOptions = input<number[]>([5, 10, 25, 50]);
  readonly emptyTitle = input('No records found');
  readonly emptyDescription = input('Try adjusting filters or create a new record.');

  readonly rowClick = output<T>();
  readonly selectionChange = output<T[]>();
  readonly bulkDelete = output<T[]>();
  readonly rowAction = output<DataTableRowActionEvent<T>>();

  readonly search = signal('');
  readonly activeFilters = signal<Record<string, string>>({});
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly exportMenuOpen = signal(false);
  readonly exporting = signal(false);

  readonly filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const filters = this.activeFilters();
    let rows = [...this.data()];

    rows = rows.filter((row) => {
      for (const [key, value] of Object.entries(filters)) {
        if (!value) continue;
        const cell = String(this.resolveValue(row, key) ?? '').toLowerCase();
        if (cell !== value.toLowerCase()) return false;
      }
      return true;
    });

    if (q) {
      rows = rows.filter((row) =>
        this.columns().some((col) => {
          if (this.cellType(col) === 'actions') return false;
          return String(this.resolveValue(row, col.key) ?? '')
            .toLowerCase()
            .includes(q);
        }),
      );
    }

    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const av = this.resolveValue(a, key);
        const bv = this.resolveValue(b, key);
        return (
          String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
            numeric: true,
            sensitivity: 'base',
          }) * dir
        );
      });
    }

    return rows;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize())),
  );

  readonly pagedRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  readonly allPageSelected = computed(() => {
    const rows = this.pagedRows();
    if (!rows.length) return false;
    return rows.every((row) => this.selectedIds().has(this.rowId(row)));
  });

  readonly somePageSelected = computed(() => {
    const rows = this.pagedRows();
    if (!rows.length) return false;
    const selected = rows.filter((row) => this.selectedIds().has(this.rowId(row))).length;
    return selected > 0 && selected < rows.length;
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly hasActiveFilters = computed(
    () =>
      !!this.search().trim() ||
      Object.values(this.activeFilters()).some((value) => !!value),
  );

  readonly pageSizeSelectOptions = computed<SelectOption[]>(() =>
    this.pageSizeOptions().map((size) => ({
      label: `${size} / page`,
      value: String(size),
    })),
  );

  filterSelectOptions(filter: DataTableFilter): SelectOption[] {
    return [{ label: 'All', value: '' }, ...filter.options];
  }

  cellType(col: DataTableColumn<T>): DataTableCellType {
    if (col.type) return col.type;
    if (col.key === 'actions') return 'actions';
    return 'text';
  }

  badgeVariantFor(col: DataTableColumn<T>, row: T): BadgeVariant {
    const variant = col.badgeVariant;
    if (typeof variant === 'function') return variant(row);
    return variant ?? 'neutral';
  }

  rowActionsFor(col: DataTableColumn<T>, row: T): readonly DataTableRowAction[] {
    if (col.resolveActions) return col.resolveActions(row);
    return col.actions ?? [];
  }

  onActionPressed(action: DataTableRowAction, row: T, event: Event): void {
    event.stopPropagation();
    this.rowAction.emit({ action, row, event });
  }

  rowId(row: T): string {
    return String(this.readField(row, this.rowIdKey()) ?? '');
  }

  resolveValue(row: T, key: string): unknown {
    const col = this.columns().find((c) => c.key === key);
    if (col?.value) return col.value(row);
    return this.readField(row, key);
  }

  displayValue(row: T, key: string): string {
    const value = this.resolveValue(row, key);
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  dateValue(row: T, key: string): string | number | Date | null {
    const value = this.resolveValue(row, key);
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return String(value);
  }

  formatDate(value: string | number | Date): string {
    return formatDisplayDate(value);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  setFilter(key: string, value: string): void {
    this.activeFilters.update((current) => ({ ...current, [key]: value }));
    this.page.set(1);
  }

  clearFilters(): void {
    this.search.set('');
    this.activeFilters.set({});
    this.page.set(1);
  }

  toggleSort(col: DataTableColumn<T>): void {
    if (!col.sortable) return;
    if (this.sortKey() === col.key) {
      this.sortDir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
  }

  toggleRow(row: T, checked: boolean): void {
    const id = this.rowId(row);
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    this.emitSelection();
  }

  toggleAll(checked: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      for (const row of this.pagedRows()) {
        const id = this.rowId(row);
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
    this.emitSelection();
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.exportMenuOpen.set(false);
    this.emitSelection();
  }

  isSelected(row: T): boolean {
    return this.selectedIds().has(this.rowId(row));
  }

  changePage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.exportMenuOpen()) return;
    const root = this.exportMenuRoot()?.nativeElement;
    if (root && !root.contains(event.target as Node)) {
      this.exportMenuOpen.set(false);
    }
  }

  toggleExportMenu(): void {
    if (this.exporting() || this.selectedCount() === 0) return;
    this.exportMenuOpen.update((open) => !open);
  }

  selectedRows(): T[] {
    return this.filteredRows().filter((row) => this.selectedIds().has(this.rowId(row)));
  }

  async exportSelected(format: 'csv' | 'pdf'): Promise<void> {
    const rows = this.selectedRows();
    if (!rows.length || this.exporting()) return;

    this.exportMenuOpen.set(false);
    this.exporting.set(true);
    const fileBase = this.exportFileName();
    const title = this.exportTitle() || this.prettyExportTitle(fileBase);

    try {
      if (format === 'csv') {
        downloadDataTableCsv(fileBase, this.columns(), rows);
      } else {
        await downloadDataTablePdf(title, this.columns(), rows);
      }
    } finally {
      this.exporting.set(false);
    }
  }

  onBulkDelete(): void {
    const selected = this.selectedRows();
    this.bulkDelete.emit(selected);
  }

  private prettyExportTitle(name: string): string {
    return name
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private readField(row: T, key: string): unknown {
    if (row && typeof row === 'object') {
      return (row as Record<string, unknown>)[key];
    }
    return undefined;
  }

  private emitSelection(): void {
    const selected = this.data().filter((row) => this.selectedIds().has(this.rowId(row)));
    this.selectionChange.emit(selected);
  }
}

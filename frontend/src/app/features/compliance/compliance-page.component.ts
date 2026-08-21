import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataApiService } from '../../core/api/data-api.service';
import { EntityType } from '../../core/enums';
import { ToastService } from '../../core/services/toast/toast.service';
import { prettyLabel } from '../../core/utils';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { FormDialogComponent } from '../../shared/ui/form-dialog/form-dialog.component';
import { InputComponent } from '../../shared/ui/input/input.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SelectComponent } from '../../shared/ui/select/select.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-compliance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    CardComponent,
    FormDialogComponent,
    InputComponent,
    SelectComponent,
    EmptyStateComponent,
  ],
  templateUrl: './compliance-page.component.html',
  host: { class: 'block space-y-4' },
})
export class CompliancePageComponent implements OnInit {
  private readonly api = inject(DataApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly rules = signal<Record<string, unknown>[]>([]);
  readonly score = signal<Record<string, unknown> | null>(null);
  readonly loading = signal(false);
  readonly dialogOpen = signal(false);
  readonly saving = signal(false);

  readonly entityOptions = Object.values(EntityType)
    .filter((v) => v !== EntityType.Ticket)
    .map((value) => ({ label: prettyLabel(value), value }));

  readonly form = this.fb.nonNullable.group({
    entityType: ['tenant' as string, Validators.required],
    docType: ['', Validators.required],
    required: [true],
  });

  readonly scoreLabel = computed(() => {
    const s = this.score();
    if (!s) return '—';
    const value = s['score'] ?? s['percent'] ?? s['complianceScore'];
    return value == null ? '—' : String(value);
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.complianceRules().subscribe({
      next: (rows) => {
        this.rules.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load compliance rules.');
      },
    });
    this.api.complianceScore().subscribe({
      next: (row) => this.score.set(row),
      error: () => undefined,
    });
  }

  openCreate(): void {
    this.form.reset({ entityType: 'tenant', docType: '', required: true });
    this.dialogOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.upsertComplianceRule(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogOpen.set(false);
        this.toast.success('Compliance rule saved.');
        this.reload();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Could not save rule.');
      },
    });
  }

  remove(id: string): void {
    this.api.deleteComplianceRule(id).subscribe({
      next: () => {
        this.toast.success('Rule removed.');
        this.reload();
      },
      error: () => this.toast.error('Could not remove rule.'),
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgreementTemplate, GeneratedAgreement } from '../../../core/interfaces/agreement.interface';
import { ModalService } from '../../../core/services/modal/modal.service';
import { AgreementService } from '../../../core/services/agreements/agreement.service';
import { ToastService } from '../../../core/services/toast/toast.service';
import { formatDisplayDate } from '../../../core/utils';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { TextareaComponent } from '../../../shared/ui/textarea/textarea.component';

@Component({
  selector: 'app-generate-agreement-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent, SelectComponent, TextareaComponent],
  templateUrl: './generate-agreement-dialog.component.html',
  styleUrl: './generate-agreement-dialog.component.css',
  host: {
    class:
      'dialog-enter fixed inset-0 z-9990 flex items-end justify-center p-3 sm:items-center sm:p-4',
    role: 'presentation',
  },
})
export class GenerateAgreementDialogComponent implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly modals = inject(ModalService);
  private readonly agreements = inject(AgreementService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly prefillTemplateId = input<string | null>(null);
  readonly prefillLeaseId = input<string | null>(null);
  readonly prefillTenantId = input<string | null>(null);
  readonly prefillUnitId = input<string | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  readonly templates: AgreementTemplate[] = this.agreements.templates();
  readonly leaseOptions = this.agreements.leaseOptions();
  readonly step = signal<'compose' | 'preview'>('compose');
  readonly agreement = signal<GeneratedAgreement | null>(null);
  readonly downloading = signal(false);
  readonly saving = signal(false);
  readonly savedToVault = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedTemplateId = signal('lease_agreement');

  readonly form = this.fb.nonNullable.group({
    templateId: ['lease_agreement', Validators.required],
    leaseId: [''],
    extraTerms: [''],
  });

  ngOnInit(): void {
    document.body.appendChild(this.host.nativeElement);
    document.body.classList.add('pf-modal-open');
    this.applyPrefill();
  }

  ngOnDestroy(): void {
    this.host.nativeElement.remove();
    if (this.modals.modals().length === 0) {
      document.body.classList.remove('pf-modal-open');
    }
  }

  selectedTemplate(): AgreementTemplate | null {
    return this.templates.find((template) => template.id === this.selectedTemplateId()) ?? null;
  }

  selectTemplate(id: string): void {
    this.form.controls.templateId.setValue(id);
    this.selectedTemplateId.set(id);
    this.error.set(null);
  }

  preview(): void {
    this.error.set(null);
    try {
      const value = this.form.getRawValue();
      const agreement = this.agreements.generate({
        templateId: value.templateId as GeneratedAgreement['templateId'],
        leaseId: value.leaseId || this.prefillLeaseId(),
        tenantId: this.prefillTenantId(),
        unitId: this.prefillUnitId(),
        extraTerms: value.extraTerms,
      });
      this.agreement.set(agreement);
      this.savedToVault.set(false);
      this.step.set('preview');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Could not generate the agreement.');
    }
  }

  back(): void {
    this.step.set('compose');
  }

  async download(): Promise<void> {
    const agreement = this.agreement();
    if (!agreement) return;
    this.downloading.set(true);
    try {
      await this.agreements.download(agreement);
      this.toast.success('Agreement downloaded.');
    } catch {
      this.toast.error('Could not download the PDF.');
    } finally {
      this.downloading.set(false);
    }
  }

  saveToVault(): void {
    const agreement = this.agreement();
    if (!agreement) return;
    this.saving.set(true);
    this.agreements.saveToVault(agreement).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedToVault.set(true);
        this.toast.success('Saved to the document vault.');
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Could not save this agreement.');
      },
    });
  }

  issuedLabel(value: string): string {
    return formatDisplayDate(value);
  }

  private applyPrefill(): void {
    const templateId = this.agreements.resolveTemplateId(this.prefillTemplateId());
    const resolvedLease =
      this.agreements.resolveLease(this.prefillLeaseId(), this.prefillTenantId(), this.prefillUnitId()) ??
      null;
    this.form.patchValue({
      templateId,
      leaseId: resolvedLease ? String(resolvedLease['id']) : '',
      extraTerms: '',
    });
    this.selectedTemplateId.set(templateId);
    if (this.prefillLeaseId() || this.prefillTenantId() || this.prefillUnitId()) {
      this.preview();
    }
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { ModalService } from '../../../core/services/modal/modal.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  templateUrl: './form-dialog.component.html',
  styleUrl: './form-dialog.component.css',
  host: {
    class:
      'dialog-enter fixed inset-0 z-9990 flex items-end justify-center p-3 sm:items-center sm:p-4',
    role: 'presentation',
  },
})
export class FormDialogComponent implements OnInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly modals = inject(ModalService);

  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly saveLabel = input('Save');
  readonly cancelLabel = input('Cancel');
  readonly saving = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly closed = output<void>();
  readonly saved = output<void>();

  ngOnInit(): void {
    document.body.appendChild(this.host.nativeElement);
    document.body.classList.add('pf-modal-open');
  }

  ngOnDestroy(): void {
    this.host.nativeElement.remove();
    if (this.modals.modals().length === 0) {
      document.body.classList.remove('pf-modal-open');
    }
  }

  onBackdrop(): void {
    this.closed.emit();
  }
}

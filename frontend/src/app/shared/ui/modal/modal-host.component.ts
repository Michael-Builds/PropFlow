import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { ModalService } from '../../../core/services/modal/modal.service';
import { ConfirmModalData } from '../../../core/interfaces/modal.interface';
import { IconComponent } from '../../icons/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ButtonComponent],
  templateUrl: './modal-host.component.html',
  styleUrl: './modal-host.component.css',
})
export class ModalHostComponent {
  readonly modalService = inject(ModalService);

  constructor() {
    effect(() => {
      const open = this.modalService.modals().length > 0;
      document.body.classList.toggle('pf-modal-open', open);
    });
  }

  isConfirm(data: unknown): ConfirmModalData | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    const record = data as ConfirmModalData & { __confirm?: boolean };
    return record.__confirm ? record : null;
  }
}

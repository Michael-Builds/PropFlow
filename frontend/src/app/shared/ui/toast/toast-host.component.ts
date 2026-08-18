import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast/toast.service';
import { IconComponent } from '../../icons/icon.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ButtonComponent],
  templateUrl: './toast-host.component.html',
  styleUrl: './toast-host.component.css',
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);
}

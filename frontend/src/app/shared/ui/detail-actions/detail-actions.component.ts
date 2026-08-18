import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { DetailQuickAction } from '../../../core/interfaces/detail.interface';

@Component({
  selector: 'app-detail-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonComponent],
  templateUrl: './detail-actions.component.html',
  styleUrl: './detail-actions.component.css',
  host: { class: 'block' },
})
export class DetailActionsComponent {
  readonly actions = input.required<DetailQuickAction[]>();
}

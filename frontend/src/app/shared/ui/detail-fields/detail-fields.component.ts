import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { DetailField } from '../../../core/interfaces/detail.interface';

@Component({
  selector: 'app-detail-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './detail-fields.component.html',
  styleUrl: './detail-fields.component.css',
  host: { class: 'block' },
})
export class DetailFieldsComponent {
  readonly fields = input.required<DetailField[]>();
}

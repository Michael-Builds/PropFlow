import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailStat } from '../../../core/interfaces/detail.interface';

@Component({
  selector: 'app-detail-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-stats.component.html',
  styleUrl: './detail-stats.component.css',
  host: { class: 'block' },
})
export class DetailStatsComponent {
  readonly stats = input.required<DetailStat[]>();
}

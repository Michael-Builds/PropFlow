import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailTimelineEvent } from '../../../core/interfaces/detail.interface';
import { formatDisplayDate } from '../../../core/utils';

@Component({
  selector: 'app-detail-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-timeline.component.html',
  styleUrl: './detail-timeline.component.css',
  host: { class: 'block' },
})
export class DetailTimelineComponent {
  readonly events = input.required<DetailTimelineEvent[]>();
  readonly emptyLabel = input('No timeline events yet.');

  formatAt(value: string): string {
    return formatDisplayDate(value);
  }
}

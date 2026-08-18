import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailTimelineEvent } from '../../../core/interfaces/detail.interface';

@Component({
  selector: 'app-detail-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './detail-timeline.component.html',
  styleUrl: './detail-timeline.component.css',
  host: { class: 'block' },
})
export class DetailTimelineComponent {
  readonly events = input.required<DetailTimelineEvent[]>();
  readonly emptyLabel = input('No timeline events yet.');
}

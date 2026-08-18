import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailNote } from '../../../core/interfaces/detail.interface';
import { formatDisplayDate } from '../../../core/utils';

@Component({
  selector: 'app-detail-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-notes.component.html',
  styleUrl: './detail-notes.component.css',
  host: { class: 'block' },
})
export class DetailNotesComponent {
  readonly notes = input.required<DetailNote[]>();
  readonly emptyLabel = input('No internal notes.');

  formatAt(value: string): string {
    return formatDisplayDate(value);
  }
}

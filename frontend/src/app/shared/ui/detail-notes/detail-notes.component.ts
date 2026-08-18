import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DetailNote } from '../../../core/interfaces/detail.interface';

@Component({
  selector: 'app-detail-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './detail-notes.component.html',
  styleUrl: './detail-notes.component.css',
  host: { class: 'block' },
})
export class DetailNotesComponent {
  readonly notes = input.required<DetailNote[]>();
  readonly emptyLabel = input('No internal notes.');
}

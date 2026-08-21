import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BadgeComponent } from '../badge/badge.component';
import { BadgeVariant } from '../../../core/interfaces/badge.interface';
import { DetailDocument } from '../../../core/interfaces/detail.interface';
import { formatDisplayDate } from '../../../core/utils';

@Component({
  selector: 'app-detail-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  templateUrl: './detail-documents.component.html',
  styleUrl: './detail-documents.component.css',
  host: { class: 'block' },
})
export class DetailDocumentsComponent {
  readonly documents = input.required<DetailDocument[]>();
  readonly emptyLabel = input('No documents attached.');

  formatDate(value: string | null | undefined): string {
    return formatDisplayDate(value);
  }

  statusVariant(status: string): BadgeVariant {
    const value = status.toLowerCase();
    if (['verified', 'passed', 'approved', 'valid', 'clear'].includes(value)) return 'success';
    if (['pending', 'processing', 'review', 'expiring'].includes(value)) return 'warning';
    if (['rejected', 'failed', 'expired'].includes(value)) return 'danger';
    return 'neutral';
  }
}

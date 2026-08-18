import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { ButtonComponent } from '../button/button.component';
import { ButtonVariant } from '../../../core/interfaces/button.interface';
import { DataTableRowAction } from '../../../core/interfaces/data-table.interface';

type ActionKind =
  | 'view'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'default';

@Component({
  selector: 'app-row-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, ButtonComponent],
  templateUrl: './row-actions.component.html',
  styleUrl: './row-actions.component.css',
})
export class RowActionsComponent {
  readonly actions = input.required<readonly DataTableRowAction[]>();
  readonly disabled = input(false);

  readonly actionSelect = output<{ action: DataTableRowAction; event: MouseEvent }>();

  onSelect(action: DataTableRowAction, event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.actionSelect.emit({ action, event });
  }

  buttonVariant(action: DataTableRowAction): ButtonVariant {
    switch (this.kind(action)) {
      case 'view':
        return 'view';
      case 'edit':
        return 'edit';
      case 'delete':
      case 'reject':
        return 'delete';
      case 'approve':
        return 'approve';
      default:
        return 'icon';
    }
  }

  iconName(action: DataTableRowAction): string {
    switch (this.kind(action)) {
      case 'view':
        return 'heroEye';
      case 'edit':
        return 'heroPencilSquare';
      case 'delete':
        return 'heroTrash';
      case 'reject':
        return 'heroXMark';
      case 'approve':
        return 'heroCheck';
      default:
        return 'heroEllipsisVertical';
    }
  }

  private kind(action: DataTableRowAction): ActionKind {
    const id = action.id.toLowerCase();
    if (id === 'view') return 'view';
    if (id === 'edit' || id.includes('edit')) return 'edit';
    if (id === 'delete' || id.includes('delete')) return 'delete';
    if (id === 'approve' || id.includes('approve')) return 'approve';
    if (id === 'reject' || id.includes('reject')) return 'reject';
    if (action.tone === 'danger') return 'delete';
    return 'default';
  }
}

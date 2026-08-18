import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
}

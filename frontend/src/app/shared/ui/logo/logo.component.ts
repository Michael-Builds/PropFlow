import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.css',
  host: {
    class: 'inline-flex shrink-0 overflow-hidden',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
})
export class LogoComponent {
  readonly size = input(36);
  readonly alt = input('PropFlow');
}

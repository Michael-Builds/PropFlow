import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { NavIconName } from '../../core/interfaces/nav.interface';
import { heroIconName } from '../../core/icons/icon-map';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css',
  host: {
    class: 'inline-flex shrink-0 items-center justify-center',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size()',
  },
})
export class IconComponent {
  readonly name = input.required<NavIconName>();
  readonly size = input(18);
  readonly strokeWidth = input(1.8);

  readonly heroName = computed(() => heroIconName(this.name()));
}

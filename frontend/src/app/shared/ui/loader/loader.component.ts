import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LoaderService } from '../../../core/services/loader/loader.service';
import { LoaderSize } from '../../../core/interfaces/loader.interface';

export type { LoaderSize } from '../../../core/interfaces/loader.interface';

@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
  host: { class: 'contents' },
})
export class LoaderComponent {
  private readonly loaderService = inject(LoaderService);

  /** Inline spinner (e.g. empty states). */
  readonly inline = input(false);
  /** Absolute overlay inside a relative parent (e.g. data table). */
  readonly overlay = input(false);
  /** Label for inline/overlay modes. Global mode uses LoaderService.label(). */
  readonly text = input<string | null>(null);
  readonly size = input<LoaderSize>('md');

  readonly globalLoading = computed(() => this.loaderService.loading());
  readonly globalLabel = computed(() => this.loaderService.label());
}

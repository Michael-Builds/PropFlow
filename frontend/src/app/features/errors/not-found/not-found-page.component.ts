import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonComponent, EmptyStateComponent],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.css',
})
export class NotFoundPageComponent {}

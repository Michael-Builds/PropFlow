import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ThemeService } from './core/services/theme/theme.service';
import { PlatformAvailabilityService } from './core/services/platform-availability/platform-availability.service';
import { LoaderComponent } from './shared/ui/loader/loader.component';
import { ModalHostComponent } from './shared/ui/modal/modal-host.component';
import { ToastHostComponent } from './shared/ui/toast/toast-host.component';
import { PlatformGateComponent } from './shared/ui/platform-gate/platform-gate.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ToastHostComponent,
    ModalHostComponent,
    LoaderComponent,
    PlatformGateComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly availability = inject(PlatformAvailabilityService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly showGate = computed(() => {
    if (!this.availability.loaded() || !this.availability.isGated()) return false;
    const path = this.url() ?? '';
    return !path.startsWith('/auth');
  });

  constructor() {
    inject(ThemeService);
  }
}

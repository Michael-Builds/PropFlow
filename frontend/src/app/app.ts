import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme/theme.service';
import { LoaderComponent } from './shared/ui/loader/loader.component';
import { ModalHostComponent } from './shared/ui/modal/modal-host.component';
import { ToastHostComponent } from './shared/ui/toast/toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent, ModalHostComponent, LoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor() {
    inject(ThemeService);
  }
}

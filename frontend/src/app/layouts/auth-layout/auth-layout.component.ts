import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconComponent } from '../../shared/icons/icon.component';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, IconComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.css',
})
export class AuthLayoutComponent {
  readonly year = new Date().getFullYear();
  readonly brandCopy = {
    eyebrow: 'Property operations',
    headline: ['Leasing, collections,', 'and maintenance in one place.'],
    description: 'Built for landlords and managers who still run portfolios from spreadsheets.',
  };
  readonly highlights = [
    'Portfolio, units, tenants, and leases',
    'Collections, arrears, and receipts',
    'Maintenance SLAs and document vault',
  ];
}

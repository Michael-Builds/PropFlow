import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NAV_SECTIONS } from '../../core/config/nav.config';
import { DataCollection, collectionRoute } from '../../core/enums/data-collection.enum';
import { UserRole, UserRoles } from '../../core/enums/user-role.enum';
import { BadgeVariant } from '../../core/interfaces/badge.interface';
import { TnChartDataset, TnChartType } from '../../core/interfaces/chart.interface';
import { DashboardData } from '../../core/interfaces/dashboard.interface';
import { NavIconName } from '../../core/interfaces/nav.interface';
import { AuthService } from '../../core/services/auth/auth.service';
import { DataService } from '../../core/services/data/data.service';
import { LoaderService } from '../../core/services/loader/loader.service';
import { ModalService } from '../../core/services/modal/modal.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { oddLastGridClass } from '../../core/utils';
import { IconComponent } from '../../shared/icons/icon.component';
import { BadgeComponent } from '../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ChartComponent } from '../../shared/ui/chart/chart.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';

type MetricItem = { label: string; value: string };

type ChartPanel = {
  id: string;
  title: string;
  subtitle: string;
  type: TnChartType;
  labels: string[];
  datasets: TnChartDataset[];
  height: number;
  stacked?: boolean;
  spanClass?: string;
  centerLabel?: string;
};

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NgClass,
    RouterLink,
    PageHeaderComponent,
    CardComponent,
    BadgeComponent,
    ButtonComponent,
    ChartComponent,
    StatCardComponent,
    IconComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
  host: { class: 'block' },
})
export class DashboardPageComponent {
  private readonly data = inject(DataService);
  private readonly loader = inject(LoaderService);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly dashboard = signal<DashboardData | null>(null);
  readonly isPlatformAdmin = computed(() => this.auth.role() === UserRole.PlatformAdmin);
  readonly canManagePortfolio = computed(() => this.auth.canAccess(UserRoles.portfolio));
  readonly canViewAudit = computed(() => this.auth.canAccess(UserRoles.audit));
  readonly companiesPath = collectionRoute(DataCollection.Organizations);
  readonly propertiesPath = collectionRoute(DataCollection.Properties);
  readonly headerTitle = computed(() =>
    this.isPlatformAdmin() ? 'Platform dashboard' : 'Operations dashboard',
  );
  readonly headerDescription = computed(() =>
    this.isPlatformAdmin()
      ? 'Companies, users, and activity across every organisation on PropFlow.'
      : 'Occupancy, collections, arrears, and SLA performance across the live portfolio.',
  );
  readonly quickActions = computed(() => {
    const items = NAV_SECTIONS.flatMap((section) => section.items);
    return (this.dashboard()?.quickActions ?? []).filter((action) => {
      const nav = items.find((item) => item.path === action.path);
      return !nav || this.auth.canAccess(nav.roles);
    });
  });

  readonly pipelineTotal = computed(() => {
    const items = this.dashboard()?.ticketPipeline ?? [];
    return items.reduce((sum, item) => sum + item.count, 0) || 1;
  });

  readonly primaryStats = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    return d.kpis.slice(0, 3).map((kpi) => ({
      label: kpi.label,
      value: kpi.value,
      hint: `${kpi.delta >= 0 ? '+' : ''}${kpi.delta}% · ${kpi.hint}`,
      icon: kpi.icon,
    }));
  });

  readonly secondaryStats = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    return d.kpis.slice(3);
  });

  oddLastClass(index: number, total: number): string {
    return oddLastGridClass(index, total, 'lg');
  }

  readonly postureMetrics = computed<MetricItem[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [
      { label: 'Health score', value: d.posture.score.toFixed(1) },
      { label: 'Collection rate', value: d.kpis[4]?.value ?? '—' },
      { label: 'Open tickets', value: String(d.sla.open) },
      { label: 'SLA on time', value: `${d.sla.onTime}%` },
    ];
  });

  readonly slaMetrics = computed<MetricItem[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [
      { label: 'On time', value: `${d.sla.onTime}%` },
      { label: 'Breached', value: String(d.sla.breached) },
      { label: 'Open queue', value: String(d.sla.open) },
      { label: 'Avg hours', value: `${d.sla.avgHours}h` },
    ];
  });

  readonly occupancyCharts = computed<ChartPanel[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [
      {
        id: 'collections',
        title: 'Collections trend',
        subtitle: 'Due vs collected over six months',
        type: 'area',
        labels: d.collectionTrend.labels,
        datasets: d.collectionTrend.datasets,
        height: 300,
        spanClass: 'min-w-0 max-w-full h-full xl:col-span-2',
      },
      {
        id: 'mix',
        title: 'Unit mix',
        subtitle: 'Occupied, vacant, and maintenance',
        type: 'doughnut',
        labels: d.occupancyMix.labels,
        datasets: [{ data: d.occupancyMix.data, colors: d.occupancyMix.colors }],
        height: 300,
        spanClass: 'min-w-0 max-w-full h-full',
        centerLabel: 'Units',
      },
    ];
  });

  readonly opsCharts = computed<ChartPanel[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [
      {
        id: 'sla',
        title: 'Ticket SLA',
        subtitle: 'On time vs breached by category',
        type: 'bar',
        labels: d.ticketSla.labels,
        datasets: d.ticketSla.datasets,
        height: 280,
        stacked: true,
      },
      {
        id: 'aging',
        title: 'Arrears aging',
        subtitle: 'Outstanding by bucket',
        type: 'bar',
        labels: d.arrearsAging.labels,
        datasets: [{ label: 'Balance', data: d.arrearsAging.data, color: '#c2410c' }],
        height: 280,
      },
    ];
  });

  constructor() {
    const cached = this.data.dashboardSnapshot();
    if (cached) {
      this.dashboard.set(cached);
      return;
    }
    this.load();
  }

  load(force = false): void {
    const hasCache = !!this.data.dashboardSnapshot();
    if (!hasCache || force) {
      this.loader.show(this.isPlatformAdmin() ? 'Loading platform...' : 'Loading portfolio...');
    }
    this.data
      .loadDashboard<DashboardData>({ force })
      .pipe(finalize(() => this.loader.hide()))
      .subscribe({
        next: (payload) => this.dashboard.set(payload),
        error: () => this.toast.error('Could not load dashboard.'),
      });
  }

  iconName(icon: string | undefined): NavIconName {
    return (icon as NavIconName) || 'dashboard';
  }

  statusVariant(status: string): BadgeVariant {
    if (status === 'success' || status === 'healthy' || status === 'secure') return 'success';
    if (status === 'warning' || status === 'watch' || status === 'degraded') return 'warning';
    if (status === 'danger' || status === 'risk' || status === 'down') return 'danger';
    if (status === 'brand') return 'brand';
    return 'info';
  }

  pipelineToneClass(tone: string): string {
    switch (tone) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'danger':
        return 'bg-danger';
      case 'info':
        return 'bg-info';
      default:
        return 'bg-text-muted';
    }
  }

  healthVariant(health: string): BadgeVariant {
    if (health === 'healthy') return 'success';
    if (health === 'watch') return 'warning';
    return 'danger';
  }

  occupancyWidth(value: number): string {
    return `${Math.min(100, Math.max(0, value))}%`;
  }

  async addCompany(): Promise<void> {
    void this.router.navigateByUrl(collectionRoute(DataCollection.Organizations));
  }

  async addProperty(): Promise<void> {
    const ok = await this.modal.confirm({
      title: 'Add a property?',
      message: 'Open the properties workspace to register a building or block.',
      confirmLabel: 'Continue',
    });
    if (ok) {
      void this.router.navigateByUrl(collectionRoute(DataCollection.Properties));
    }
  }
}

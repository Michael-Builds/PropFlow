import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { ApexOptions } from 'apexcharts';
import {
  TnChartDataset,
  TnChartType,
} from '../../../core/interfaces/chart.interface';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { BREAKPOINTS } from '../../../core/utils';

export type { TnChartDataset, TnChartType } from '../../../core/interfaces/chart.interface';

type ApexChartInstance = {
  render: () => Promise<void>;
  destroy: () => void;
  resize?: () => void;
  updateOptions?: (options: ApexOptions, redraw?: boolean, animate?: boolean) => Promise<void>;
};

type ApexChartsCtor = new (el: HTMLElement, options: ApexOptions) => ApexChartInstance;

const DEFAULT_COLORS = ['#0028f2', '#3d5cff', '#19195f', '#0284c7', '#64748b', '#0f9f6e'];
const MUTED = '#8b8b96';
const GRID = '#eef1f8';
const FG = '#1a1a22';
const FONT = 'Figtree, ui-sans-serif, system-ui, sans-serif';

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(value));
}

@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css',
  host: {
    class: 'block h-full min-h-0 w-full min-w-0 max-w-full overflow-hidden',
  },
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('chart');
  private readonly theme = inject(ThemeService);

  readonly type = input<TnChartType>('bar');
  readonly labels = input.required<string[]>();
  readonly datasets = input.required<TnChartDataset[]>();
  readonly height = input(280);
  readonly legend = input(true);
  readonly stacked = input(false);
  readonly centerLabel = input<string | null>(null);

  private chart?: ApexChartInstance;
  private ready = false;
  private renderToken = 0;
  private ApexCharts?: ApexChartsCtor;
  private resizeObserver?: ResizeObserver;
  private resizeFrame = 0;

  constructor() {
    effect(() => {
      this.type();
      this.labels();
      this.datasets();
      this.legend();
      this.stacked();
      this.height();
      this.centerLabel();
      this.theme.theme();
      if (this.ready) {
        void this.render();
      }
    });
  }

  ngAfterViewInit(): void {
    this.ready = true;
    const el = this.host().nativeElement;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleResize());
      this.resizeObserver.observe(el);
    }
    requestAnimationFrame(() => void this.render());
  }

  ngOnDestroy(): void {
    this.renderToken += 1;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (this.resizeFrame) {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = 0;
    }
    this.chart?.destroy();
    this.chart = undefined;
  }

  private scheduleResize(): void {
    if (!this.chart?.resize) return;
    if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = 0;
      this.chart?.resize?.();
    });
  }

  private async ensureApex(): Promise<ApexChartsCtor | null> {
    if (this.ApexCharts) return this.ApexCharts;
    try {
      const mod = await import('apexcharts');
      this.ApexCharts = (mod.default ?? mod) as unknown as ApexChartsCtor;
      return this.ApexCharts;
    } catch {
      return null;
    }
  }

  private hasSeriesData(): boolean {
    const labels = this.labels();
    const datasets = this.datasets();
    if (!labels?.length || !datasets?.length) return false;
    return datasets.some((ds) => Array.isArray(ds.data) && ds.data.length > 0);
  }

  private resolvedHeight(): number {
    const base = this.height();
    const width =
      typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.lg;
    if (width < BREAKPOINTS.sm) return Math.min(base, 220);
    if (width < BREAKPOINTS.md) return Math.min(base, 240);
    return base;
  }

  private async render(): Promise<void> {
    const token = ++this.renderToken;
    const el = this.host().nativeElement;
    const height = this.resolvedHeight();
    el.style.minHeight = `${height}px`;
    el.style.height = `${height}px`;
    el.style.width = '100%';
    el.style.maxWidth = '100%';

    if (!this.hasSeriesData()) {
      this.chart?.destroy();
      this.chart = undefined;
      el.replaceChildren();
      el.classList.add(
        'flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'border',
        'border-dashed',
        'border-border',
        'bg-surface/40',
        'text-sm',
        'text-text-muted',
      );
      el.textContent = 'No chart data available';
      return;
    }

    el.classList.remove(
      'flex',
      'items-center',
      'justify-center',
      'rounded-md',
      'border',
      'border-dashed',
      'border-border',
      'bg-surface/40',
      'text-sm',
      'text-text-muted',
    );

    const ApexCharts = await this.ensureApex();
    if (!ApexCharts || token !== this.renderToken) return;

    this.chart?.destroy();
    this.chart = undefined;
    el.replaceChildren();

    try {
      const options = this.buildOptions(height);
      const chart = new ApexCharts(el, options);
      this.chart = chart;
      await chart.render();
      if (token !== this.renderToken) {
        chart.destroy();
        return;
      }
      this.scheduleResize();
    } catch (err) {
      console.error('[app-chart] render failed', err);
      if (token === this.renderToken) {
        this.chart = undefined;
        el.replaceChildren();
        el.classList.add(
          'flex',
          'items-center',
          'justify-center',
          'text-sm',
          'text-text-muted',
        );
        el.textContent = 'Chart unavailable';
      }
    }
  }

  private buildOptions(height: number): ApexOptions {
    const type = this.type();
    const isDonut = type === 'doughnut' || type === 'pie';
    const isLine = type === 'line' || type === 'area';
    const datasets = this.datasets();
    const labels = this.labels();
    const centerLabel = this.centerLabel();

    const series = isDonut
      ? (datasets[0]?.data ?? []).map((n) => Number(n) || 0)
      : datasets.map((ds) => ({
          name: ds.label ?? 'Series',
          data: ds.data.map((n) => Number(n) || 0),
        }));

    const palette = this.themeColors();
    const colors = isDonut
      ? (datasets[0]?.colors ?? palette.slice(0, labels.length))
      : datasets.map((ds, i) => ds.color ?? palette[i % palette.length]);

    const donutTotal = isDonut
      ? (series as number[]).reduce((sum, n) => sum + n, 0)
      : 0;

    const options: ApexOptions = {
      chart: {
        type: isDonut ? (type === 'pie' ? 'pie' : 'donut') : isLine ? 'area' : 'bar',
        height,
        width: '100%',
        fontFamily: FONT,
        toolbar: { show: false },
        zoom: { enabled: false },
        stacked: this.stacked(),
        animations: { enabled: true, speed: 450 },
        parentHeightOffset: 0,
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
      },
      series,
      colors,
      dataLabels: { enabled: false },
      legend: {
        show: this.legend(),
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
        fontFamily: FONT,
        fontSize: '12px',
        fontWeight: 500,
        labels: { colors: MUTED },
        itemMargin: { horizontal: 10, vertical: 4 },
        markers: { size: 5, offsetX: -3 },
      },
      tooltip: {
        theme: 'light',
        style: {
          fontFamily: FONT,
          fontSize: '12px',
        },
      },
      responsive: [
        {
          breakpoint: BREAKPOINTS.md,
          options: {
            chart: { height: Math.min(height, 240) },
            legend: {
              fontSize: '11px',
              itemMargin: { horizontal: 8, vertical: 4 },
            },
            plotOptions: {
              bar: { columnWidth: '68%', borderRadius: 4 },
              pie: {
                donut: {
                  size: '64%',
                  labels: {
                    value: { fontSize: '18px' },
                    total: { fontSize: '11px' },
                  },
                },
              },
            },
            grid: { padding: { left: 0, right: 4, top: 4, bottom: 0 } },
          },
        },
        {
          breakpoint: BREAKPOINTS.sm,
          options: {
            chart: { height: Math.min(height, 220) },
            legend: {
              fontSize: '10px',
              itemMargin: { horizontal: 6, vertical: 2 },
            },
            xaxis: {
              labels: { rotate: 0, hideOverlappingLabels: true, trim: true },
            },
            plotOptions: {
              bar: { columnWidth: '72%', borderRadius: 3 },
              pie: {
                donut: {
                  size: '60%',
                  labels: {
                    value: { fontSize: '16px' },
                    name: { fontSize: '11px' },
                    total: { fontSize: '10px' },
                  },
                },
              },
            },
          },
        },
      ],
    };

    if (isDonut) {
      options.labels = labels;
      options.stroke = { width: 0 };
      options.plotOptions = {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '12px',
                fontWeight: 500,
                color: MUTED,
              },
              value: {
                show: true,
                fontSize: '22px',
                fontWeight: 700,
                color: FG,
                formatter: (val: string) => formatCount(Number(val)),
              },
              total: {
                show: true,
                label: centerLabel || 'Total',
                fontSize: '12px',
                fontWeight: 600,
                color: MUTED,
                formatter: () => formatCount(donutTotal),
              },
            },
          },
        },
      };
      return options;
    }

    options.stroke = isLine
      ? { curve: 'smooth', width: 2 }
      : { show: true, width: 2, colors: ['transparent'] };

    options.fill = isLine
      ? {
          type: 'gradient',
          gradient: {
            shadeIntensity: 0.4,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [0, 90, 100],
          },
        }
      : { type: 'solid', opacity: 1 };

    options.plotOptions = {
      bar: {
        borderRadius: 6,
        columnWidth: '55%',
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    };

    options.grid = {
      borderColor: GRID,
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { left: 4, right: 8, top: 8, bottom: 0 },
    };

    options.xaxis = {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        hideOverlappingLabels: true,
        trim: true,
        style: {
          colors: MUTED,
          fontSize: '11px',
          fontFamily: FONT,
        },
      },
    };

    options.yaxis = {
      labels: {
        style: {
          colors: MUTED,
          fontSize: '12px',
          fontFamily: FONT,
        },
        formatter: (val: number) => formatCount(val),
      },
    };

    return options;
  }

  private themeColors(): string[] {
    if (typeof document === 'undefined') return DEFAULT_COLORS;
    const style = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
    return [
      read('--pf-brand', DEFAULT_COLORS[0]),
      read('--pf-brand-light', DEFAULT_COLORS[1]),
      read('--pf-navy', DEFAULT_COLORS[2]),
      '#0284c7',
      '#64748b',
      '#0f9f6e',
    ];
  }
}

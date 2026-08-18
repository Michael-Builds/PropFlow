import { NavIconName } from './nav.interface';
import { TnChartDataset } from './chart.interface';

export interface DashboardKpi {
  label: string;
  value: string;
  hint: string;
  delta: number;
  icon: NavIconName;
}

export interface DashboardPosture {
  label: string;
  region: string;
  message: string;
  syncedAt: string;
  score: number;
}

export interface DashboardPipelineStep {
  status: string;
  count: number;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

export interface DashboardPropertyHealth {
  name: string;
  health: 'healthy' | 'watch' | 'risk';
  units: number;
  occupancy: number;
  arrears: string;
}

export interface DashboardActivityItem {
  id: string;
  title: string;
  meta: string;
  time: string;
  status: string;
  icon: NavIconName;
}

export interface DashboardAlert {
  title: string;
  source: string;
  time: string;
  severity: 'warning' | 'danger' | 'info';
}

export interface DashboardQuickAction {
  label: string;
  description: string;
  path: string;
  icon: NavIconName;
}

export interface DashboardData {
  posture: DashboardPosture;
  kpis: DashboardKpi[];
  ticketPipeline: DashboardPipelineStep[];
  collectionTrend: { labels: string[]; datasets: TnChartDataset[] };
  occupancyMix: { labels: string[]; data: number[]; colors: string[] };
  ticketSla: { labels: string[]; datasets: TnChartDataset[] };
  arrearsAging: { labels: string[]; data: number[] };
  properties: DashboardPropertyHealth[];
  sla: { onTime: number; breached: number; open: number; avgHours: number };
  activity: DashboardActivityItem[];
  openAlerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
}

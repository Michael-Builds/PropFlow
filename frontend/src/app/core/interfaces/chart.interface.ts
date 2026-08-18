export type TnChartType = 'line' | 'bar' | 'doughnut' | 'pie' | 'area';

export interface TnChartDataset {
  label?: string;
  data: number[];
  color?: string;
  colors?: string[];
  fill?: boolean;
}

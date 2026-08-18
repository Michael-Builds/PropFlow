import { prettyLabel } from '../utils/format';

export type StringEnum = Record<string, string>;

export function enumValues<T extends StringEnum>(enumeration: T): T[keyof T][] {
  return Object.values(enumeration) as T[keyof T][];
}

export function enumOptions<T extends StringEnum>(
  enumeration: T,
  labels?: Partial<Record<T[keyof T], string>>,
): Array<{ label: string; value: T[keyof T] }> {
  return pickOptions(enumValues(enumeration), labels);
}

export function pickOptions<T extends string>(
  values: readonly T[],
  labels?: Partial<Record<T, string>>,
): Array<{ label: string; value: T }> {
  return values.map((value) => ({
    value,
    label: labels?.[value] ?? prettyLabel(value),
  }));
}

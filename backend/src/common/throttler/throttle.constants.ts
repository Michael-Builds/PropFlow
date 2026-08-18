export const AUTH_THROTTLE = {
  short: { limit: 5, ttl: 10_000, blockDuration: 60_000 },
  medium: { limit: 8, ttl: 60_000, blockDuration: 300_000 },
  long: { limit: 20, ttl: 3_600_000, blockDuration: 3_600_000 },
};

export const THROTTLE_SKIP_ALL = {
  short: true,
  medium: true,
  long: true,
};

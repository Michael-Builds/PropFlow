export function pageArgs(page = 1, pageSize = 25) {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(100, Math.max(1, pageSize));
  return {
    page: safePage,
    pageSize: safeSize,
    skip: (safePage - 1) * safeSize,
    take: safeSize,
  };
}

export function pageResult<T>(page: number, pageSize: number, total: number, items: T[]) {
  return { page, pageSize, total, items };
}

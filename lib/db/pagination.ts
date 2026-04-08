export type PageParams = {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
};

export function getPageParams(searchParams: Record<string, string | string[] | undefined>) {
  const pageRaw = typeof searchParams.page === "string" ? searchParams.page : undefined;
  const pageSizeRaw =
    typeof searchParams.pageSize === "string" ? searchParams.pageSize : undefined;

  const page = Math.max(1, Number(pageRaw ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(pageSizeRaw ?? 50) || 50));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, limit: pageSize } satisfies PageParams;
}


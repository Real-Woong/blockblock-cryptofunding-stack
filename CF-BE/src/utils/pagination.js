export function parsePagination(query, defaults = { page: 1, limit: 20 }) {
  let page = Number(query?.page ?? defaults.page);
  let limit = Number(query?.limit ?? defaults.limit);

  if (!Number.isFinite(page) || page < 1) page = defaults.page;
  if (!Number.isFinite(limit) || limit < 1) limit = defaults.limit;

  // 너무 큰 요청 방지 (원하면 숫자 조절)
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function paginateArray(items, page, limit) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const offset = (safePage - 1) * limit;
  const sliced = items.slice(offset, offset + limit);

  return {
    items: sliced,
    meta: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}
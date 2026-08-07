export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export const buildPagination = (
  options?: PaginationOptions
) => {

  const page = Math.max(
    options?.page ?? 1,
    1
  );

  const limit = Math.max(
    options?.limit ?? 10,
    1
  );

  const offset =
    (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };

};


export const buildPaginationResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
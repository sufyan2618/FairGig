import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "../config/constants.js";

export const parsePagination = (query) => {
  const parsedPage = Number.parseInt(String(query.page ?? DEFAULT_PAGE), 10);
  const parsedLimit = Number.parseInt(String(query.limit ?? DEFAULT_LIMIT), 10);

  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? DEFAULT_PAGE : parsedPage;
  const limit = Number.isNaN(parsedLimit) || parsedLimit < 1
    ? DEFAULT_LIMIT
    : Math.min(parsedLimit, MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

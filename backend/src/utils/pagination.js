const getPagination = (page = 1, limit = 10) => {
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(
        Math.max(parseInt(limit, 10) || 10, 1),
        100
    );

    return {
        page: currentPage,
        limit: perPage,
        skip: (currentPage - 1) * perPage
    };
};

const getPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    };
};

module.exports = {
    getPagination,
    getPaginationMeta
};

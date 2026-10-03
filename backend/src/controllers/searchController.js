const service = require("../services/searchService");
const { successResponse } = require("../utils/response");
const { getEffectivePermissions } = require("../middleware/permissionMiddleware");
const search = async (req, res) => successResponse(res, await service.search(req.query.q, await getEffectivePermissions(req.user)), "Search results fetched successfully");
module.exports = { search };

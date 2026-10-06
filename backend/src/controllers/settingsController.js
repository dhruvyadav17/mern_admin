const service = require("../services/settingsService");
const { successResponse } = require("../utils/response");
const { log: audit } = require("../services/auditService");
const list = async (req, res) => successResponse(res, await service.list(), "Settings fetched successfully");
const update = async (req, res) => { const data = await service.update(req.body); await audit(req, "settings.update", "Setting", null, { keys: Object.keys(req.body) }); return successResponse(res, data, "Settings updated successfully"); };
const publicSettings = async (req, res) => successResponse(res, await service.publicSettings(), "Public settings fetched successfully");
module.exports = { list, update, publicSettings };


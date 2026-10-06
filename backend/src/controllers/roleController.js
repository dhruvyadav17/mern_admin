const roleService = require("../services/roleService"); const { successResponse } = require("../utils/response"); const { log: audit } = require("../services/auditService");
const listRoles=async(req,res)=>successResponse(res,await roleService.listRoles(),"Roles fetched successfully");
const createRole=async(req,res)=>{const role=await roleService.createRole(req.body);await audit(req,"role.create","Role",role._id,{name:role.name});return successResponse(res,role,"Role created successfully",201);};
const updateRole=async(req,res)=>{const role=await roleService.updateRole(req.params.id,req.body);await audit(req,"role.update","Role",role._id,{changes:Object.keys(req.body)});return successResponse(res,role,"Role updated successfully");};
const deleteRole=async(req,res)=>{await roleService.deleteRole(req.params.id);await audit(req,"role.delete","Role",req.params.id);return successResponse(res,null,"Role deleted successfully");};
module.exports={listRoles,createRole,updateRole,deleteRole};


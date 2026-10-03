const express=require("express"); const {protect}=require("../middleware/authMiddleware"); const {requirePermission}=require("../middleware/permissionMiddleware"); const asyncHandler=require("../utils/asyncHandler"); const controller=require("../controllers/roleController"); const validate=require("../middleware/validateMiddleware"); const {createRoleValidation,updateRoleValidation}=require("../validators/accessValidator"); const router=express.Router();
router.get("/",protect,requirePermission("roles.view", "role-permissions.view"),asyncHandler(controller.listRoles));
router.post("/",protect,requirePermission("roles.manage"),createRoleValidation,validate,asyncHandler(controller.createRole));
router.put("/:id",protect,requirePermission("roles.manage"),updateRoleValidation,validate,asyncHandler(controller.updateRole));
router.delete("/:id",protect,requirePermission("roles.manage"),asyncHandler(controller.deleteRole));
module.exports=router;

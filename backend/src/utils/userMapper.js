const toUserResponse=(user,permissions=undefined)=>{if(!user)return null;const roles=user.roles?.length?user.roles:[];return {id:user._id,name:user.name,email:user.email,emailVerifiedAt:user.emailVerifiedAt,role:roles[0],roles,status:user.status,createdAt:user.createdAt,updatedAt:user.updatedAt,permissionOverrides:{allow:user.permissionOverrides?.allow||[],deny:user.permissionOverrides?.deny||[]},...(permissions?{permissions}: {})}};
const toUserListResponse=users=>users.map(toUserResponse);
module.exports={toUserResponse,toUserListResponse};


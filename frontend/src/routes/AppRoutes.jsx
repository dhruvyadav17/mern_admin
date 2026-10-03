import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminLayout from "../components/layout/AdminLayout";
import PermissionRoute from "./PermissionRoute";
const Dashboard=lazy(()=>import("../pages/admin/Dashboard"));
const Users=lazy(()=>import("../pages/admin/Users"));
const UserDetail=lazy(()=>import("../pages/admin/UserDetail"));
const Roles=lazy(()=>import("../pages/admin/Roles"));
const Permissions=lazy(()=>import("../pages/admin/Permissions"));
const RolePermissions=lazy(()=>import("../pages/admin/RolePermissions"));
const UserPermissions=lazy(()=>import("../pages/admin/UserPermissions"));
const AuditLogs=lazy(()=>import("../pages/admin/AuditLogs"));
const Settings=lazy(()=>import("../pages/admin/Settings"));
const Profile=lazy(()=>import("../pages/user/Profile"));
const ChangePassword=lazy(()=>import("../pages/user/ChangePassword"));
const Forbidden=lazy(()=>import("../pages/Forbidden"));
const Login=lazy(()=>import("../pages/auth/Login"));
const ForgotPassword=lazy(()=>import("../pages/auth/ForgotPassword"));
const ResetPassword=lazy(()=>import("../pages/auth/ResetPassword"));
function Protected({children}){const {user,loading}=useAuth();if(loading)return <div className="vh-100 d-flex align-items-center justify-content-center"><div className="spinner-border"/></div>;if(!user)return <Navigate to="/login" replace/>;return children;}
function P({permission,children}){return <PermissionRoute permission={permission}>{children}</PermissionRoute>}
const Shell=({children})=><Suspense fallback={<div className="py-5 text-center"><div className="spinner-border"/></div>}>{children}</Suspense>;
export default function AppRoutes(){return <Shell><Routes><Route path="/login" element={<Login/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/reset-password" element={<ResetPassword/>}/><Route element={<Protected><AdminLayout/></Protected>}><Route path="/" element={<P permission="dashboard.view"><Dashboard/></P>}/><Route path="/profile" element={<P permission="profile.view"><Profile/></P>}/><Route path="/change-password" element={<P permission="password.change"><ChangePassword/></P>}/><Route path="/admin/users" element={<P permission="users.view"><Users/></P>}/><Route path="/admin/users/:id/permissions" element={<P permission="user-permissions.view"><UserPermissions/></P>}/><Route path="/admin/users/:id" element={<P permission="users.view"><UserDetail/></P>}/><Route path="/admin/roles" element={<P permission="roles.view"><Roles/></P>}/><Route path="/admin/permissions" element={<P permission="permissions.view"><Permissions/></P>}/><Route path="/admin/role-permissions" element={<P permission="role-permissions.view"><RolePermissions/></P>}/><Route path="/admin/audit" element={<P permission="audit.view"><AuditLogs/></P>}/><Route path="/admin/settings" element={<P permission="settings.view"><Settings/></P>}/></Route><Route path="/403" element={<Forbidden/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Shell>}

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import PermissionAccessList from "../../components/common/PermissionAccessList";
import { getPermissions, getUserPermissions, updateUserPermission } from "../../services/roleService";
import { usePermission } from "../../context/PermissionContext";

const unique = (items = []) => [...new Set(items.filter(Boolean))];

export default function UserPermissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermission();
  const canManage = can("user-permissions.manage");
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [allow, setAllow] = useState([]);
  const [deny, setDeny] = useState([]);
  const [inherited, setInherited] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [userResponse, permissionResponse] = await Promise.all([getUserPermissions(id), getPermissions()]);
      const data = userResponse.data.data || {};
      setUser(data.user);
      setAllow(unique(data.permissionOverrides?.allow));
      setDeny(unique(data.permissionOverrides?.deny));
      setInherited(unique(data.inheritedPermissions || data.rolePermissions));
      setPermissions(permissionResponse.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => setPage(1), [filter]);

  const toggle = async (permission, enabled) => {
    if (!canManage || saving.has(permission.key)) return;
    const key = permission.key;
    const previousAllow = allow;
    const previousDeny = deny;
    const roleGranted = inherited.includes("*") || inherited.includes(key);

    setAllow(enabled
      ? (roleGranted ? allow.filter((item) => item !== key) : unique([...allow, key]))
      : allow.filter((item) => item !== key));
    setDeny(enabled ? deny.filter((item) => item !== key) : unique([...deny, key]));
    setSaving((current) => new Set(current).add(key));

    try {
      await updateUserPermission(id, key, enabled);
    } catch (error) {
      setAllow(previousAllow);
      setDeny(previousDeny);
      toast.error(error.response?.data?.message || "Unable to update permission", { id: `page-user-permission-${key}` });
    } finally {
      setSaving((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <>
      <PageHeader title="User Permission Matrix" subtitle={user ? `${user.name} · ${user.email}` : "Manage user access"} />
      {user && (
        <div className="user-permission-hero mb-3">
          <div className="user-permission-user">
            <div className="user-permission-avatar"><i className="bi bi-person-fill" /></div>
            <div>
              <div className="fw-bold">{user.name}</div>
              <div className="small text-secondary">{user.email}</div>
              <div className="d-flex flex-wrap gap-2 mt-2">{(user.roles || []).map((role) => <span className="rbac-role-chip" key={role}><i className="bi bi-shield-check me-1" />{role}</span>)}</div>
            </div>
          </div>
          <div className="user-permission-rule"><i className="bi bi-lightning-charge-fill text-primary" /><span><strong>One checkbox = user access.</strong><br /><small>Changes save instantly.</small></span></div>
        </div>
      )}
      {!canManage && <div className="alert alert-warning"><i className="bi bi-eye me-2" />View only.</div>}
      <div className="card shadow-sm">
        <div className="card-header"><strong>Permissions</strong><div className="small text-secondary">Check or uncheck access. No separate Save button.</div></div>
        <div className="card-body"><PermissionAccessList permissions={permissions} allow={allow} deny={deny} inherited={inherited} canManage={canManage} saving={saving} filter={filter} onFilterChange={setFilter} page={page} onPageChange={setPage} loading={loading} onToggle={toggle} /></div>
      </div>
      <div className="mt-3"><button className="btn btn-light" onClick={() => navigate("/admin/users")}><i className="bi bi-arrow-left me-1" />Back to users</button></div>
    </>
  );
}

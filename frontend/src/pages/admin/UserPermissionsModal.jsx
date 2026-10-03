import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/common/Modal";
import PermissionAccessList from "../../components/common/PermissionAccessList";
import { getPermissions, getUserPermissions, updateUserPermission } from "../../services/roleService";
import { usePermission } from "../../context/PermissionContext";

const unique = (items = []) => [...new Set(items.filter(Boolean))];

export default function UserPermissionsModal({ user, open, onClose, onSaved }) {
  const [permissions, setPermissions] = useState([]);
  const [allow, setAllow] = useState([]);
  const [deny, setDeny] = useState([]);
  const [inherited, setInherited] = useState([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(new Set());
  const { can } = usePermission();
  const canManage = can("user-permissions.manage");

  const load = async () => {
    if (!open || !user?.id) return;
    setLoading(true);
    try {
      const [userResponse, permissionResponse] = await Promise.all([
        getUserPermissions(user.id),
        getPermissions()
      ]);
      const data = userResponse.data.data || {};
      setAllow(unique(data.permissionOverrides?.allow));
      setDeny(unique(data.permissionOverrides?.deny));
      setInherited(unique(data.inheritedPermissions || data.rolePermissions));
      setPermissions(permissionResponse.data.data || []);
      setPage(1);
      setFilter("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [open, user?.id]);
  useEffect(() => setPage(1), [filter]);

  const toggle = async (permission, enabled) => {
    if (!canManage || saving.has(permission.key)) return;

    const key = permission.key;
    const previousAllow = allow;
    const previousDeny = deny;
    const roleAlreadyAllows = inherited.includes("*") || inherited.includes(key);

    const nextAllow = enabled
      ? (roleAlreadyAllows ? allow.filter((item) => item !== key) : unique([...allow, key]))
      : allow.filter((item) => item !== key);
    const nextDeny = enabled ? deny.filter((item) => item !== key) : unique([...deny, key]);

    setAllow(nextAllow);
    setDeny(nextDeny);
    setSaving((current) => new Set(current).add(key));

    try {
      await updateUserPermission(user.id, key, enabled);
      onSaved?.();
    } catch (error) {
      setAllow(previousAllow);
      setDeny(previousDeny);
      toast.error(error.response?.data?.message || "Unable to update permission", { id: `user-permission-${key}` });
    } finally {
      setSaving((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  };

  const close = () => {
    if (!saving.size) onClose?.();
  };

  const allowedCount = permissions.filter((permission) => {
    const key = permission.key;
    return !deny.includes(key) && (allow.includes(key) || inherited.includes("*") || inherited.includes(key));
  }).length;

  return (
    <Modal
      open={open}
      title={<>User access <span className="modal-title-separator">·</span> {user?.name || "User"}</>}
      onClose={close}
      size="xl"
      closeDisabled={saving.size > 0}
      footer={(
        <div className="permission-modal-footer-content">
          <div className="small text-secondary">
            <i className="bi bi-lightning-charge-fill text-primary me-1" />
            {saving.size ? "Saving change…" : "Changes are saved automatically."}
          </div>
          <button className="btn btn-light" onClick={close} disabled={saving.size > 0}>Close</button>
        </div>
      )}
    >
      <div className="user-permission-hero">
        <div className="user-permission-user">
          <div className="user-permission-avatar"><i className="bi bi-person-fill" /></div>
          <div className="min-w-0">
            <div className="fw-bold text-truncate">{user?.name || "User"}</div>
            <div className="small text-secondary text-truncate">{user?.email || ""}</div>
          </div>
        </div>
        <div className="user-permission-summary-stats">
          <span><strong>{allowedCount}</strong> allowed</span>
          <span><strong>{permissions.length}</strong> total</span>
        </div>
      </div>

      <div className="user-permission-roles-bar">
        <div>
          <div className="small text-secondary mb-1">Assigned roles</div>
          <div className="d-flex flex-wrap gap-2">
            {(user?.roles || [user?.role]).filter(Boolean).map((role) => (
              <span className="rbac-role-chip" key={role}><i className="bi bi-shield-check me-1" />{role}</span>
            ))}
          </div>
        </div>
        <div className="small text-secondary text-md-end">
          <i className="bi bi-info-circle me-1" />Checked = access. Unchecked = no access.
        </div>
      </div>

      {!canManage && (
        <div className="alert alert-warning permission-view-alert">
          <i className="bi bi-eye me-2" />View only. You need <code>user-permissions.manage</code> to change access.
        </div>
      )}

      <PermissionAccessList
        permissions={permissions}
        allow={allow}
        deny={deny}
        inherited={inherited}
        canManage={canManage}
        saving={saving}
        filter={filter}
        onFilterChange={setFilter}
        page={page}
        onPageChange={setPage}
        loading={loading}
        onToggle={toggle}
      />
    </Modal>
  );
}

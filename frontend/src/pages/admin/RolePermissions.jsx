import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import PermissionToggle from "../../components/common/PermissionToggle";
import {
  getPermissions,
  getRoles,
  updateRolePermissions,
} from "../../services/roleService";

const unique = (items = []) => [...new Set(items.filter(Boolean))];

export default function RolePermissions() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);
      const roleList = rolesResponse.data.data || [];
      setRoles(roleList);
      setPermissions(permissionsResponse.data.data || []);
      const currentId =
        selected && roleList.some((item) => item._id === selected)
          ? selected
          : roleList[0]?._id;
      if (currentId) {
        const current = roleList.find((item) => item._id === currentId);
        setSelected(currentId);
        setChecked(unique(current?.permissions));
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load role permissions",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  const role = roles.find((item) => item._id === selected);

  const inherited = useMemo(() => {
    const result = new Set();
    const visited = new Set();

    const collect = (roleName) => {
      if (!roleName || visited.has(roleName)) return;
      visited.add(roleName);

      const parent = roles.find((item) => item.name === roleName);
      if (!parent) return;

      (parent.permissions || []).forEach((permission) =>
        result.add(permission),
      );
      collect(parent.parentRole);
    };

    collect(role?.parentRole);
    return result;
  }, [role, roles]);

  const grouped = useMemo(
    () =>
      permissions
        .filter((permission) => {
          const query = filter.trim().toLowerCase();
          return (
            !query ||
            `${permission.key} ${permission.label} ${permission.group || ""}`
              .toLowerCase()
              .includes(query)
          );
        })
        .reduce((groups, permission) => {
          const group = permission.group || "Other";
          if (!groups[group]) groups[group] = [];
          groups[group].push(permission);
          return groups;
        }, {}),
    [permissions, filter],
  );

  const choose = (id) => {
    const nextRole = roles.find((item) => item._id === id);
    setSelected(id);
    setChecked(unique(nextRole?.permissions));
    setFilter("");
  };

  const persist = async (permissionKey, enabled) => {
    if (!role || role.isSystem || saving.size > 0) return;

    const previous = checked;
    const next = enabled
      ? unique([...checked, permissionKey])
      : checked.filter((value) => value !== permissionKey);
    setChecked(next);
    setRoles((current) =>
      current.map((item) =>
        item._id === role._id ? { ...item, permissions: next } : item,
      ),
    );
    setSaving((current) => new Set(current).add(permissionKey));

    try {
      await updateRolePermissions(role._id, next);
      toast.success(enabled ? "Permission assigned" : "Permission removed", {
        id: `role-permission-${permissionKey}`,
      });
    } catch (error) {
      setChecked(previous);
      setRoles((current) =>
        current.map((item) =>
          item._id === role._id ? { ...item, permissions: previous } : item,
        ),
      );
      toast.error(
        error.response?.data?.message || "Failed to update permission",
        { id: `role-permission-${permissionKey}` },
      );
    } finally {
      setSaving((current) => {
        const nextSaving = new Set(current);
        nextSaving.delete(permissionKey);
        return nextSaving;
      });
    }
  };

  const toggleGroup = async (items) => {
    if (!role || role.isSystem || saving.size > 0) return;
    const keys = items.map((item) => item.key);
    const allSelected = keys.every((key) => checked.includes(key));
    const next = allSelected
      ? checked.filter((key) => !keys.includes(key))
      : unique([...checked, ...keys]);
    const previous = checked;
    setChecked(next);
    setRoles((current) =>
      current.map((item) =>
        item._id === role._id ? { ...item, permissions: next } : item,
      ),
    );
    setSaving((current) => new Set([...current, ...keys]));
    try {
      await updateRolePermissions(role._id, next);
      toast.success(
        allSelected
          ? "Group permissions removed"
          : "Group permissions assigned",
      );
    } catch (error) {
      setChecked(previous);
      setRoles((current) =>
        current.map((item) =>
          item._id === role._id ? { ...item, permissions: previous } : item,
        ),
      );
      toast.error(
        error.response?.data?.message || "Failed to update permissions",
      );
    } finally {
      setSaving((current) => {
        const result = new Set(current);
        keys.forEach((key) => result.delete(key));
        return result;
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Role Permission Matrix"
        subtitle="Select a role and switch permissions on or off. Every change is saved immediately."
      />
      <div className="row g-4">
        <div className="col-lg-3">
          <div className="card shadow-sm h-100 role-picker-card">
            <div className="card-header role-picker-header">
              <div className="fw-semibold">Roles</div>
              <div className="small text-secondary">Choose a role</div>
            </div>
            <div className="role-picker-list">
              {roles.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  className={`role-picker-item ${selected === item._id ? "active" : ""}`}
                  onClick={() => choose(item._id)}
                >
                  <span className="role-picker-icon">
                    <i
                      className={`bi ${item.isSystem ? "bi-shield-fill-check" : "bi-person-badge"}`}
                    />
                  </span>
                  <span className="min-w-0">
                    <strong className="d-block text-truncate">
                      {item.label}
                    </strong>
                    <span className="small opacity-75 d-block text-truncate">
                      {item.name} ·{" "}
                      {item.permissions?.includes("*")
                        ? "All access"
                        : `${item.permissions?.length || 0} permissions`}
                    </span>
                  </span>
                  <i className="bi bi-chevron-right ms-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="card shadow-sm role-matrix-card">
            <div className="card-header role-matrix-header d-flex align-items-center gap-3 flex-wrap">
              <div className="me-auto min-w-0">
                <div className="d-flex align-items-center gap-2">
                  <h3 className="card-title mb-0">
                    {role?.label || "Select role"}
                  </h3>
                  {role?.isSystem && (
                    <span className="badge text-bg-dark">System</span>
                  )}
                </div>
                <div className="small text-secondary font-monospace">
                  {role?.name || "Choose a role"}
                </div>
              </div>
              <div className="role-auto-save">
                <i className="bi bi-cloud-check me-1" />
                Auto-saved
              </div>
              <div className="input-group role-matrix-search">
                <span className="input-group-text">
                  <i className="bi bi-search" />
                </span>
                <input
                  className="form-control form-control-sm"
                  placeholder="Search permissions"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                />
              </div>
            </div>

            <div className="card-body role-matrix-body">
              {role?.parentRole && (
                <div className="alert alert-info d-flex align-items-start gap-2">
                  <i className="bi bi-diagram-3 mt-1" />
                  <span>
                    Some access may be inherited from{" "}
                    <strong>{role.parentRole}</strong>. Inherited permissions
                    are shown checked and cannot be removed from the child role
                    here.
                  </span>
                </div>
              )}
              {role?.isSystem && (
                <div className="alert alert-warning d-flex align-items-center gap-2">
                  <i className="bi bi-shield-lock-fill" />
                  <span>
                    This system role is protected. Its permissions cannot be
                    changed from the role matrix.
                  </span>
                </div>
              )}

              <div className="rbac-matrix-table role-matrix-clean">
                <div className="rbac-matrix-head role-matrix-clean-head">
                  <span>Permission</span>
                  <span className="text-center">Access</span>
                  <span className="text-end">Status</span>
                </div>
                {loading ? (
                  <div className="text-center py-5 text-secondary">
                    <div className="spinner-border spinner-border-sm me-2" />
                    Loading...
                  </div>
                ) : (
                  Object.entries(grouped).map(([group, items]) => {
                    const allSelected = items.every(
                      (item) =>
                        checked.includes(item.key) ||
                        inherited.has(item.key) ||
                        role?.isSystem ||
                        inherited.has("*"),
                    );
                    return (
                      <section className="rbac-matrix-group" key={group}>
                        <div className="rbac-matrix-group-head">
                          <div>
                            <span className="rbac-group-title">{group}</span>
                            <span className="small text-secondary ms-2">
                              {items.length}
                            </span>
                          </div>
                          {!role?.isSystem && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              disabled={saving.size > 0}
                              onClick={() => toggleGroup(items)}
                            >
                              <i className="bi bi-check2-square me-1" />
                              {allSelected ? "Clear group" : "Allow all"}
                            </button>
                          )}
                        </div>
                        {items.map((permission) => {
                          const inheritedAccess =
                            inherited.has("*") || inherited.has(permission.key);
                          const selectedAccess =
                            role?.isSystem ||
                            checked.includes(permission.key) ||
                            inheritedAccess;
                          const isSaving = saving.has(permission.key);
                          const disabled =
                            role?.isSystem ||
                            inheritedAccess ||
                            saving.size > 0;
                          return (
                            <div
                              className={`rbac-matrix-row role-matrix-clean-row ${selectedAccess ? "is-active" : ""}`}
                              key={permission._id || permission.key}
                            >
                              <div>
                                <div className="rbac-permission-name">
                                  {permission.label}
                                </div>
                                <div className="small text-secondary font-monospace">
                                  {permission.key}
                                </div>
                              </div>
                              <div className="text-center">
                                <PermissionToggle
                                  checked={selectedAccess}
                                  disabled={disabled}
                                  saving={isSaving}
                                  onChange={(enabled) =>
                                    persist(permission.key, enabled)
                                  }
                                  label={`Allow ${permission.label}`}
                                />
                              </div>
                              <div className="text-end">
                                {isSaving ? (
                                  <span className="badge text-bg-light">
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Saving
                                  </span>
                                ) : inheritedAccess ? (
                                  <span className="permission-inherited-pill">
                                    <i className="bi bi-diagram-3 me-1" />
                                    Inherited
                                  </span>
                                ) : (
                                  <span
                                    className={`rbac-effective-badge ${selectedAccess ? "is-allowed" : "is-denied"}`}
                                  >
                                    {selectedAccess ? "Allowed" : "No access"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </section>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

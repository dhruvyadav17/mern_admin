import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import PermissionToggle from "../../components/common/PermissionToggle";
import Modal from "../../components/common/Modal";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRole,
  updateRolePermissions,
} from "../../services/roleService";
import { Can } from "../../context/PermissionContext";

const blank = { name: "", label: "", description: "", parentRole: "" };
const unique = (items = []) => [...new Set(items.filter(Boolean))];

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState(blank);
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);
  const [assignRole, setAssignRole] = useState(null);
  const [checked, setChecked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [savingPermission, setSavingPermission] = useState(false);
  const limit = 8;

  const load = async () => {
    setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        getRoles(),
        getPermissions(),
      ]);
      setRoles(rolesResponse.data.data || []);
      setPermissions(permissionsResponse.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => setPage(1), [search]);

  const filtered = useMemo(
    () =>
      roles.filter(
        (role) =>
          !search ||
          `${role.name} ${role.label} ${role.description || ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [roles, search],
  );
  const rows = filtered.slice((page - 1) * limit, page * limit);
  const grouped = useMemo(
    () =>
      permissions.reduce((groups, permission) => {
        const group = permission.group || "Other";
        (groups[group] ||= []).push(permission);
        return groups;
      }, {}),
    [permissions],
  );

  const openCreate = () => {
    setEdit(null);
    setForm(blank);
    setOpen(true);
  };
  const openEdit = (role) => {
    setEdit(role._id);
    setForm({
      name: role.name,
      label: role.label,
      description: role.description || "",
      parentRole: role.parentRole || "",
    });
    setOpen(true);
  };
  const closeForm = () => {
    setOpen(false);
    setEdit(null);
    setForm(blank);
  };

  const saveRole = async (event) => {
    event?.preventDefault();
    try {
      const payload = { ...form, parentRole: form.parentRole || null };
      if (edit) await updateRole(edit, payload);
      else await createRole(payload);
      toast.success(edit ? "Role updated" : "Role created");
      closeForm();
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const remove = async (role) => {
    if (!window.confirm(`Delete role ${role.label}?`)) return;
    try {
      await deleteRole(role._id);
      toast.success("Role deleted");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Cannot delete role");
    }
  };

  const openPermissions = (role) => {
    setAssignRole(role);
    setChecked(unique(role.permissions));
  };

  const persistPermissionChange = async (next, previous = checked) => {
    if (!assignRole || assignRole.isSystem  || savingPermission) return;
    setChecked(next);
    setRoles((current) =>
      current.map((role) =>
        role._id === assignRole._id ? { ...role, permissions: next } : role,
      ),
    );
    setAssignRole((current) =>
      current ? { ...current, permissions: next } : current,
    );
    setSavingPermission(true);
    try {
      await updateRolePermissions(assignRole._id, next);
      toast.success("Permission updated");
    } catch (error) {
      setChecked(previous);
      setRoles((current) =>
        current.map((role) =>
          role._id === assignRole._id
            ? { ...role, permissions: previous }
            : role,
        ),
      );
      setAssignRole((current) =>
        current ? { ...current, permissions: previous } : current,
      );
      toast.error(
        error.response?.data?.message || "Unable to update permission",
      );
    } finally {
      setSavingPermission(false);
    }
  };

  const togglePermission = (key) => {
    const next = checked.includes(key)
      ? checked.filter((item) => item !== key)
      : unique([...checked, key]);
    persistPermissionChange(next);
  };

  const toggleGroup = (items) => {
    const keys = items.map((item) => item.key);
    const allSelected = keys.every((key) => checked.includes(key));
    const next = allSelected
      ? checked.filter((key) => !keys.includes(key))
      : unique([...checked, ...keys]);
    persistPermissionChange(next);
  };

  return (
    <>
      <PageHeader
        title="Role Management"
        subtitle="Create reusable roles and manage access without leaving the listing."
      />
      <div className="card shadow-sm role-list-card">
        <div className="card-header d-flex flex-wrap gap-2 align-items-center">
          <div className="me-auto">
            <h3 className="card-title mb-0">Roles</h3>
            <div className="small text-secondary">{filtered.length} roles</div>
          </div>
          <div className="input-group role-list-search">
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control form-control-sm"
              placeholder="Search roles"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Can permission="roles.manage">
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" />
              Add Role
            </button>
          </Can>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Role</th>
                <th>Inherits</th>
                <th>Permissions</th>
                <th>Type</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm me-2" />
                    Loading...
                  </td>
                </tr>
              ) : (
                rows.map((role) => (
                  <tr key={role._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="rbac-list-icon">
                          <i
                            className={`bi ${role.isSystem ? "bi-shield-fill-check" : "bi-person-badge"}`}
                          />
                        </span>
                        <div>
                          <strong>{role.label}</strong>
                          <div className="small text-secondary font-monospace">
                            {role.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {role.parentRole ? (
                        <span className="badge rounded-pill text-bg-light">
                          <i className="bi bi-diagram-3 me-1" />
                          {role.parentRole}
                        </span>
                      ) : (
                        <span className="text-secondary">—</span>
                      )}
                    </td>
                    <td>
                      <span className="badge rounded-pill text-bg-light">
                        {role.permissions?.includes("*")
                          ? "All"
                          : role.permissions?.length || 0}
                      </span>
                    </td>
                    <td>
                      {role.isSystem ? (
                        <span className="badge text-bg-dark">System</span>
                      ) : (
                        <span className="badge text-bg-secondary">Custom</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Can permission="role-permissions.manage">
                        <button
                          className="btn btn-sm btn-outline-info me-1"
                          onClick={() => openPermissions(role)}
                          title="Manage permissions"
                        >
                          <i className="bi bi-shield-check" />
                        </button>
                      </Can>
                      <Can permission="roles.manage">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => openEdit(role)}
                          title="Edit role"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        {!role.isSystem && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => remove(role)}
                            title="Delete role"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        )}
                      </Can>
                    </td>
                  </tr>
                ))
              )}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-secondary">
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-body pt-0">
          <Pagination
            page={page}
            totalPages={Math.ceil(filtered.length / limit) || 1}
            total={filtered.length}
            label="roles"
            onChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={open}
        title={edit ? "Edit Role" : "Add Role"}
        onClose={closeForm}
        footer={
          <>
            <button className="btn btn-light" onClick={closeForm}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveRole}>
              {edit ? "Update Role" : "Create Role"}
            </button>
          </>
        }
      >
        <form onSubmit={saveRole}>
          <div className="rbac-form-section">
            <div className="rbac-form-section-title">
              <i className="bi bi-shield me-2" />
              Role details
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Role key</label>
                <input
                  className="form-control"
                  required
                  disabled={Boolean(
                    edit && roles.find((role) => role._id === edit)?.isSystem,
                  )}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. manager"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Display name</label>
                <input
                  className="form-control"
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Manager"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Parent role</label>
                <select
                  className="form-select"
                  value={form.parentRole}
                  onChange={(e) =>
                    setForm({ ...form, parentRole: e.target.value })
                  }
                >
                  <option value="">No parent</option>
                  {roles
                    .filter((role) => role._id !== edit)
                    .map((role) => (
                      <option key={role._id} value={role.name}>
                        {role.label}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Description</label>
                <input
                  className="form-control"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What is this role for?"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(assignRole)}
        title={`Role Permission Assignment · ${assignRole?.label || ""}`}
        onClose={() => setAssignRole(null)}
        size="xl"
        footer={
          <div className="d-flex align-items-center justify-content-between w-100 gap-3">
            <div className="small text-secondary">
              <i
                className={`bi ${savingPermission ? "bi-arrow-repeat spin" : "bi-cloud-check"} me-1`}
              />
              {savingPermission
                ? "Saving change..."
                : "Changes are saved automatically."}
            </div>
            <button
              className="btn btn-light"
              onClick={() => setAssignRole(null)}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="permission-modal-intro">
          <div>
            <div className="fw-semibold">Assign access to this role</div>
            <div className="small text-secondary">
              Check or uncheck a permission. There is no separate Save button.
            </div>
          </div>
          {assignRole?.parentRole && (
            <span className="badge rounded-pill text-bg-light">
              <i className="bi bi-diagram-3 me-1" />
              Parent: {assignRole.parentRole}
            </span>
          )}
        </div>
        {assignRole?.name === "admin" && (
          <div className="alert alert-warning d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock-fill" />
            <span>
              This system role has full access through <code>*</code>. Its
              permissions cannot be changed.
            </span>
          </div>
        )}
        <div className="permission-assignment-list">
          {Object.entries(grouped).map(([group, items]) => {
            const allSelected = items.every(
              (item) =>
                checked.includes(item.key) || assignRole?.name === "admin",
            );
            return (
              <section className="permission-group" key={group}>
                <div className="permission-group-heading">
                  <div>
                    <div className="permission-group-title">{group}</div>
                    <div className="small text-secondary">
                      {items.length} permissions
                    </div>
                  </div>
                  {assignRole?.name !== "admin" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={savingPermission}
                      onClick={() => toggleGroup(items)}
                    >
                      <i className="bi bi-check2-square me-1" />
                      {allSelected ? "Clear group" : "Allow all"}
                    </button>
                  )}
                </div>
                <div className="permission-grid">
                  {items.map((permission) => {
                    const selected =
                      assignRole?.name === "admin" ||
                      checked.includes(permission.key);
                    return (
                      <div
                        className={`permission-card ${selected ? "is-checked" : ""}`}
                        key={permission._id}
                      >
                        <PermissionToggle
                          checked={selected}
                          disabled={assignRole?.name === "admin"}
                          saving={savingPermission}
                          onChange={() => togglePermission(permission.key)}
                          label={`Allow ${permission.label}`}
                        />
                        <span className="permission-card-copy">
                          <strong>{permission.label}</strong>
                          <code>{permission.key}</code>
                        </span>
                        <i className="bi bi-check-circle-fill permission-card-check" />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </Modal>
    </>
  );
}

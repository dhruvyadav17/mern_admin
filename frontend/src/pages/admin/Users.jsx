import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import userService from "../../services/userService";
import { getRoles } from "../../services/roleService";
import { Can, usePermission } from "../../context/PermissionContext";
import { useAuth } from "../../context/AuthContext";
import UserPermissionsModal from "./UserPermissionsModal";

const createBlank = (defaultRole = "user") => ({
  name: "",
  email: "",
  password: "",
  roles: [defaultRole],
  status: "active",
});

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(createBlank());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [permissionUser, setPermissionUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const { can } = usePermission();
  const { user: currentUser } = useAuth();
  const canAssign = can("users.role.assign");
  const canStatus = can("users.status");

  const load = async () => {
    setLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        userService.getUsers({ page, limit: 10, search }),
        canAssign ? getRoles() : Promise.resolve({ data: { data: [] } }),
      ]);
      setUsers(usersResponse.data.data || []);
      setMeta(usersResponse.data.pagination || {});
      setRoles(rolesResponse.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, search, canAssign]);

  const openCreate = () => {
    const defaultRole =
      roles.find((role) => role.name === "user")?.name ||
      roles[0]?.name ||
      "user";
    setEditing(null);
    setRoleFilter("");
    setForm(createBlank(defaultRole));
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user.id);
    setRoleFilter("");
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      roles: user.roles?.length ? [...user.roles] : [user.role],
      status: user.status || "active",
    });
    setFormOpen(true);
  };

  const close = () => {
    setFormOpen(false);
    setEditing(null);
    setRoleFilter("");
    setForm(createBlank());
  };

  const isSelf = Boolean(
    editing && currentUser?.id && String(editing) === String(currentUser.id),
  );

  const submit = async (event) => {
    event?.preventDefault();
    if (saving) return;
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    // Password is deliberately omitted during edit when empty. This makes
    // "Update User" a true partial update and prevents the browser/server
    // from treating an empty password as a new password.
    const password = String(form.password || "").trim();
    if (!editing || password) payload.password = password;

    if (canAssign && !isSelf) {
      payload.roles = [...new Set(form.roles.filter(Boolean))];
    }
    if (canStatus && !isSelf) {
      payload.status = form.status;
    }

    setSaving(true);
    try {
      if (editing) {
        await userService.updateUser(editing, payload);
      } else {
        await userService.createUser(payload);
      }

      close();
      await load();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.debug ||
        error.message ||
        "Unable to save user";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await userService.deleteUser(id);
      toast.success("User deleted");
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const exportUsers = async () => {
    try {
      const response = await userService.exportUsers();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "users.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Export failed");
    }
  };

  const toggleRole = (name) => {
    if (isSelf) return;
    setForm((current) => {
      const has = current.roles.includes(name);
      const next = has
        ? current.roles.filter((role) => role !== name)
        : [...current.roles, name];
      return { ...current, roles: next.length ? next : current.roles };
    });
  };

  const selectedRoleObjects = useMemo(
    () => roles.filter((role) => form.roles.includes(role.name)),
    [roles, form.roles],
  );
  const visibleRoles = useMemo(() => {
    const query = roleFilter.trim().toLowerCase();
    return roles.filter(
      (role) =>
        !query ||
        `${role.name} ${role.label} ${role.description || ""}`
          .toLowerCase()
          .includes(query),
    );
  }, [roles, roleFilter]);

  const columns = [
    {
      key: "name",
      label: "User",
      render: (user) => (
        <div>
          <strong>{user.name}</strong>
          <div className="small text-secondary">{user.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Roles",
      render: (user) => (
        <div className="d-flex flex-wrap gap-1">
          {(user.roles || [user.role]).map((role) => (
            <span className="rbac-role-chip rbac-role-chip-sm" key={role}>
              {role}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (user) => (
        <span
          className={`badge ${user.status === "active" ? "text-bg-success" : user.status === "suspended" ? "text-bg-danger" : "text-bg-secondary"}`}
        >
          {user.status}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (user) => (
        <div className="text-end">
          <Can permission="user-permissions.view">
            <button
              className="btn btn-sm btn-outline-info me-1"
              onClick={() => setPermissionUser(user)}
              title="Manage permissions"
            >
              <i className="bi bi-shield-check" />
            </button>
          </Can>
          <Can permission="users.edit">
            <button
              className="btn btn-sm btn-outline-primary me-1"
              onClick={() => openEdit(user)}
              title="Edit user"
            >
              <i className="bi bi-pencil" />
            </button>
          </Can>
          <Can permission="users.delete">
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => remove(user.id)}
              title="Delete user"
            >
              <i className="bi bi-trash" />
            </button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage users, multiple roles, status and per-user access from one place."
      />
      <div className="card shadow-sm user-list-card">
        <div className="card-header d-flex flex-wrap gap-2 align-items-center">
          <div className="me-auto">
            <h3 className="card-title mb-0">Users</h3>
            <div className="small text-secondary">
              {meta.total || 0} total users
            </div>
          </div>
          <div className="input-group user-list-search">
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control form-control-sm"
              placeholder="Search name or email"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Can permission="users.export">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={exportUsers}
            >
              <i className="bi bi-download me-1" />
              Export
            </button>
          </Can>
          <Can permission="users.create">
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" />
              Add User
            </button>
          </Can>
        </div>
        <DataTable
          columns={columns}
          rows={users}
          loading={loading}
          rowKey="id"
        />
        <div className="card-body pt-0">
          <Pagination
            page={meta.page || 1}
            totalPages={meta.totalPages || 1}
            total={meta.total || 0}
            label="users"
            onChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={formOpen}
        title={editing ? "Edit User" : "Add User"}
        onClose={close}
        size="lg"
        className="user-edit-modal"
        footer={
          <div className="user-edit-footer">
            <div className="small text-secondary">
              <i className="bi bi-info-circle me-1" />
              {isSelf
                ? "Your own role and status are managed separately for safety."
                : "You can assign multiple roles."}
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-light"
                onClick={close}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="user-form"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving && (
                  <span className="spinner-border spinner-border-sm me-2" />
                )}
                {editing ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        }
      >
        <form onSubmit={submit} id="user-form">
          <div className="user-edit-shell">
            <div className="user-edit-hero">
              <div className="user-edit-avatar">
                <i className="bi bi-person-fill" />
              </div>
              <div>
                <h6 className="mb-1">
                  {editing ? "Update account" : "Create account"}
                </h6>
                <p className="mb-0 text-secondary small">
                  Keep account details and access settings clear and separate.
                </p>
              </div>
            </div>

            <div className="user-edit-section">
              <div className="user-edit-section-title">
                <i className="bi bi-person-circle me-2" />
                Account details
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full name</label>
                  <input
                    className="form-control"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Dhruv Yadav"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email address</label>
                  <input
                    className="form-control"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="name@example.com"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    {editing ? "New password" : "Password"}{" "}
                    <small className="text-secondary">
                      {editing ? "(optional)" : ""}
                    </small>
                  </label>
                  <input
                    className="form-control"
                    type="password"
                    required={!editing}
                    minLength={8}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder={
                      editing
                        ? "Leave blank to keep current"
                        : "Minimum 8 characters"
                    }
                  />
                </div>
                {canStatus && (
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      disabled={isSelf}
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {canAssign && (
              <div className="user-edit-section mt-3">
                <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
                  <div>
                    <div className="rbac-form-section-title mb-1">
                      <i className="bi bi-diagram-3 me-2" />
                      Roles & access
                    </div>
                    <div className="small text-secondary">
                      Select one or more roles. Existing roles are automatically
                      selected when editing.
                    </div>
                  </div>
                  <span className="rbac-count-badge">
                    {form.roles.length} selected
                  </span>
                </div>
                {isSelf && (
                  <div className="alert alert-info py-2 small">
                    <i className="bi bi-lock me-2" />
                    Role changes for your own account are disabled here. Use
                    your profile/account settings instead.
                  </div>
                )}
                <div className="input-group mb-3">
                  <span className="input-group-text">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Search roles"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    disabled={isSelf}
                  />
                </div>
                <div className="role-selection-grid">
                  {visibleRoles.map((role) => {
                    const selected = form.roles.includes(role.name);
                    return (
                      <label
                        key={role._id}
                        className={`role-selection-card ${selected ? "is-selected" : ""} ${isSelf ? "is-disabled" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selected}
                          disabled={isSelf}
                          onChange={() => toggleRole(role.name)}
                        />
                        <span className="role-selection-icon">
                          <i
                            className={`bi ${role.isSystem ? "bi-shield-fill-check" : "bi-person-badge"}`}
                          />
                        </span>
                        <span className="min-w-0">
                          <strong className="d-block">{role.label}</strong>
                          <small className="text-secondary d-block font-monospace">
                            {role.name}
                          </small>
                          {role.description && (
                            <small className="text-secondary d-block text-truncate">
                              {role.description}
                            </small>
                          )}
                        </span>
                        {selected && (
                          <i className="bi bi-check-circle-fill ms-auto text-primary" />
                        )}
                      </label>
                    );
                  })}
                </div>
                {!visibleRoles.length && (
                  <div className="empty-rbac-state py-4">
                    No matching roles.
                  </div>
                )}
                {selectedRoleObjects.length > 0 && (
                  <div className="selected-role-summary">
                    <span className="small text-secondary">Selected roles</span>
                    <div className="d-flex flex-wrap gap-2">
                      {selectedRoleObjects.map((role, index) => (
                        <span className="rbac-role-chip" key={role._id}>
                          {index === 0 && (
                            <i className="bi bi-star-fill me-1" />
                          )}
                          {role.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <UserPermissionsModal
        user={permissionUser}
        open={Boolean(permissionUser)}
        onClose={() => setPermissionUser(null)}
        onSaved={load}
      />
    </>
  );
}

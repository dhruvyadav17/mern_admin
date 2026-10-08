import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
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
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
  });
  const [roleFilter, setRoleFilter] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
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

      setSelectedUsers([]);
      setBulkAction("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, search, canAssign]);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;

    let cancelled = false;
    userService
      .getUser(editId)
      .then((response) => {
        if (cancelled) return;
        const user = response.data.data;
        openEdit(user);
        setSearchParams(
          (current) => {
            current.delete("edit");
            return current;
          },
          { replace: true },
        );
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(error.response?.data?.message || "Unable to load user");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams]);

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
      roles: user.roles ? [...user.roles] : [],
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

  const remove = (id) => {
    setConfirm({
      open: true,
      title: "Delete user",
      message: "Are you sure you want to delete this user?",
      action: async () => {
        try {
          await userService.deleteUser(id);
          toast.success("User deleted");
          await load();
        } catch (error) {
          toast.error(error.response?.data?.message || "Delete failed");
        }
      },
    });
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

  const executeBulkAction = async () => {
    setBulkLoading(true);

    try {
      if (bulkAction === "delete") {
        await userService.bulkDelete(selectedUsers);
      } else {
        await userService.bulkStatusAction({
          userIds: selectedUsers,
          action: bulkAction,
        });
      }

      toast.success("Bulk action completed successfully");

      setSelectedUsers([]);
      setBulkAction("");

      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkAction = () => {
    if (!selectedUsers.length || !bulkAction) return;

    if (bulkAction === "delete") {
      setConfirm({
        open: true,
        title: "Delete selected users",
        message: `Are you sure you want to delete ${selectedUsers.length} selected user(s)?`,
        action: executeBulkAction,
      });
      return;
    }

    executeBulkAction();
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

  const selectableUsers = useMemo(
    () =>
      users.filter((user) => String(user.id) !== String(currentUser?.id || "")),
    [users, currentUser?.id],
  );

  const allSelectableSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) => selectedUsers.includes(user.id));

  const columns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          className="form-check-input"
          checked={allSelectableSelected}
          disabled={!selectableUsers.length || bulkLoading}
          onChange={(e) => {
            setSelectedUsers(
              e.target.checked ? selectableUsers.map((user) => user.id) : [],
            );
          }}
        />
      ),
      render: (user) => (
        <input
          type="checkbox"
          className="form-check-input"
          checked={selectedUsers.includes(user.id)}
          disabled={
            bulkLoading || String(user.id) === String(currentUser?.id || "")
          }
          onChange={(e) => {
            setSelectedUsers((current) =>
              e.target.checked
                ? [...new Set([...current, user.id])]
                : current.filter((id) => id !== user.id),
            );
          }}
        />
      ),
    },
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
          {(user.roles || []).map((role) => (
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
            <h3 className="mb-0">Users</h3>
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
          {selectedUsers.length > 0 && (
            <>
              <select
                className="form-select form-select-sm"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                disabled={bulkLoading}
                style={{ width: "170px" }}
              >
                <option value="">Bulk action</option>

                {canStatus && (
                  <>
                    <option value="activate">Activate</option>
                    <option value="deactivate">Deactivate</option>
                    <option value="suspend">Suspend</option>
                  </>
                )}

                <Can permission="users.delete">
                  <option value="delete">Delete</option>
                </Can>
              </select>

              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={!bulkAction || bulkLoading}
                onClick={handleBulkAction}
              >
                {bulkLoading && (
                  <span className="spinner-border spinner-border-sm me-1" />
                )}
                Apply ({selectedUsers.length})
              </button>
            </>
          )}
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
        open={confirm.open}
        title={confirm.title}
        onClose={() =>
          setConfirm({
            open: false,
            title: "",
            message: "",
            action: null,
          })
        }
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                setConfirm({
                  open: false,
                  title: "",
                  message: "",
                  action: null,
                })
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                const action = confirm.action;

                setConfirm({
                  open: false,
                  title: "",
                  message: "",
                  action: null,
                });

                await action?.();
              }}
            >
              Confirm
            </button>
          </>
        }
      >
        <p className="mb-0">{confirm.message}</p>
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

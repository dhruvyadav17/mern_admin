import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { Can } from "../../context/PermissionContext";
import useClientPagination from "../../hooks/useClientPagination";
import useToastError from "../../hooks/useToastError";
import {
  createPermission,
  deletePermission,
  getPermissions,
  updatePermission,
} from "../../services/roleService";

const blank = { key: "", label: "", group: "", description: "" };
const limit = 10;

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const showError = useToastError();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getPermissions();
      setPermissions(response.data.data || []);
    } catch (error) {
      showError(error, "Unable to load permissions");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return permissions;
    return permissions.filter((permission) =>
      `${permission.key} ${permission.label} ${permission.group || ""} ${permission.description || ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [permissions, search]);

  const { page, rows, setPage, totalPages } = useClientPagination(filtered, {
    limit,
  });

  const openCreate = () => {
    setEdit(null);
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (permission) => {
    setEdit(permission);
    setForm({
      key: permission.key || "",
      label: permission.label || "",
      group: permission.group || "",
      description: permission.description || "",
    });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEdit(null);
    setForm(blank);
  };

  const save = async (event) => {
    event?.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        key: form.key.trim().toLowerCase(),
        label: form.label.trim(),
        group: form.group.trim(),
        description: form.description.trim(),
      };
      if (edit) {
        await updatePermission(edit._id, payload);
        toast.success("Permission updated");
      } else {
        await createPermission(payload);
        toast.success("Permission created");
      }
      close();
      await load();
    } catch (error) {
      showError(error, "Unable to save permission");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (permission) => {
    if (!window.confirm(`Delete permission ${permission.key}?`)) return;
    try {
      await deletePermission(permission._id);
      toast.success("Permission deleted");
      await load();
    } catch (error) {
      showError(error, "Unable to delete permission");
    }
  };

  const columns = [
    {
      key: "permission",
      label: "Permission",
      render: (permission) => (
        <div>
          <strong>{permission.label}</strong>
          <div className="small text-secondary font-monospace">{permission.key}</div>
        </div>
      ),
    },
    {
      key: "group",
      label: "Group",
      render: (permission) => (
        <span className="badge rounded-pill text-bg-light">{permission.group || "Other"}</span>
      ),
    },
    {
      key: "scope",
      label: "Scope",
      render: (permission) => (
        <span className="small text-secondary">
          {permission.resource || "general"}.{permission.action || "manage"}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (permission) =>
        permission.isSystem ? (
          <span className="badge text-bg-dark">System</span>
        ) : (
          <span className="badge text-bg-secondary">Custom</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (permission) => (
        <div className="text-end">
          <Can permission="permissions.manage">
            <button
              className="btn btn-sm btn-outline-primary me-1"
              onClick={() => openEdit(permission)}
              title="Edit permission"
            >
              <i className="bi bi-pencil" />
            </button>
            {!permission.isSystem && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => remove(permission)}
                title="Delete permission"
              >
                <i className="bi bi-trash" />
              </button>
            )}
          </Can>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Permission Catalog"
        subtitle="Create and maintain access keys used by roles and user overrides."
      />
      <div className="card shadow-sm">
        <div className="card-header d-flex flex-wrap gap-2 align-items-center">
          <div className="me-auto">
            <h3 className="card-title mb-0">Permissions</h3>
            <div className="small text-secondary">{filtered.length} permissions</div>
          </div>
          <div className="input-group permission-search-box">
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control form-control-sm"
              placeholder="Search permissions"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Can permission="permissions.manage">
            <button className="btn btn-sm btn-primary" onClick={openCreate}>
              <i className="bi bi-plus-lg me-1" />
              Add Permission
            </button>
          </Can>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          empty="No permissions found."
          rowKey="_id"
        />
        <div className="card-body pt-0">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            label="permissions"
            onChange={setPage}
          />
        </div>
      </div>

      <Modal
        open={open}
        title={edit ? "Edit Permission" : "Add Permission"}
        onClose={close}
        footer={
          <>
            <button className="btn btn-light" onClick={close} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}
              {edit ? "Update Permission" : "Create Permission"}
            </button>
          </>
        }
      >
        <form onSubmit={save}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Permission key</label>
              <input
                className="form-control"
                required
                disabled={Boolean(edit?.isSystem)}
                value={form.key}
                onChange={(event) => setForm({ ...form, key: event.target.value })}
                placeholder="users.view"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Display name</label>
              <input
                className="form-control"
                required
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                placeholder="View users"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Group</label>
              <input
                className="form-control"
                required
                value={form.group}
                onChange={(event) => setForm({ ...form, group: event.target.value })}
                placeholder="Users"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Description</label>
              <input
                className="form-control"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="What this permission allows"
              />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}

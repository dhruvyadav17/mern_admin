import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import DataTable from "../../components/common/DataTable";
import FormModal from "../../components/common/FormModal";
import ConfirmModal from "../../components/common/ConfirmModal";
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
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
  });
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

  const remove = (permission) => {
    setConfirm({
      open: true,
      title: "Delete permission",
      message: `Are you sure you want to delete permission "${permission.key}"?`,
      action: async () => {
        try {
          await deletePermission(permission._id);
          toast.success("Permission deleted");
          await load();
        } catch (error) {
          showError(error, "Unable to delete permission");
        }
      },
    });
  };

  const columns = [
    {
      key: "permission",
      label: "Permission",
      render: (permission) => (
        <div>
          <strong>{permission.label}</strong>
          <div className="small text-secondary font-monospace">
            {permission.key}
          </div>
        </div>
      ),
    },
    {
      key: "group",
      label: "Group",
      render: (permission) => (
        <span className="badge rounded-pill text-bg-light">
          {permission.group || "Other"}
        </span>
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
            <div className="small text-secondary">
              {filtered.length} permissions
            </div>
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

      <FormModal
        open={open}
        title={edit ? "Edit permission" : "Add permission"}
        onClose={close}
        onSubmit={save}
        submitLabel={edit ? "Update permission" : "Create permission"}
        size="lg"
      >
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="permission-key">
              Permission key
            </label>
            <input
              id="permission-key"
              className="form-control font-monospace"
              value={form.key}
              onChange={(event) =>
                setForm({ ...form, key: event.target.value.toLowerCase() })
              }
              placeholder="users.view"
              pattern="[a-z0-9]+(?:[._-][a-z0-9]+)*"
              required
              disabled={Boolean(edit?.isSystem)}
              autoFocus
            />
            <div className="form-text">
              Example: users.view or reports.export
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="permission-label">
              Display name
            </label>
            <input
              id="permission-label"
              className="form-control"
              value={form.label}
              onChange={(event) =>
                setForm({ ...form, label: event.target.value })
              }
              placeholder="View users"
              maxLength={100}
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="permission-group">
              Group
            </label>
            <input
              id="permission-group"
              className="form-control"
              value={form.group}
              onChange={(event) =>
                setForm({ ...form, group: event.target.value })
              }
              placeholder="Users"
              maxLength={100}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="permission-description">
              Description
            </label>
            <textarea
              id="permission-description"
              className="form-control"
              rows="4"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Describe what this permission allows."
              maxLength={500}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onClose={() =>
          setConfirm({ open: false, title: "", message: "", action: null })
        }
        onConfirm={async () => {
          const action = confirm.action;
          setConfirm({ open: false, title: "", message: "", action: null });
          await action?.();
        }}
      />
    </>
  );
}

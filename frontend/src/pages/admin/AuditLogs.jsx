import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import { getAuditLogs } from "../../services/auditService";
import { Can } from "../../context/PermissionContext";
export default function AuditLogs() {
  const [items, setItems] = useState([]),
    [pagination, setPagination] = useState({ page: 1, totalPages: 1 }),
    [filters, setFilters] = useState({
      search: "",
      action: "",
      from: "",
      to: "",
    });
  const load = (page = 1) =>
    getAuditLogs({ ...filters, page, limit: 25 })
      .then((r) => {
        setItems(r.data.data);
        setPagination(r.data.pagination);
      })
      .catch((e) =>
        toast.error(e.response?.data?.message || "Unable to load audit logs"),
      );
  useEffect(() => {
    load(1);
  }, [filters.action, filters.from, filters.to]);
  const exportLogs = (format = "csv") => {
    const qs = new URLSearchParams({ ...filters, format }).toString();
    window.open(
      `${import.meta.env.VITE_API_URL || "/api"}/audit-logs/export?${qs}`,
      "_blank",
    );
  };
  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="Search and review administrative and security events."
      />
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-lg-4">
              <input
                className="form-control"
                placeholder="Search action or target ID"
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
              />
            </div>
            <div className="col-lg-2">
              <input
                className="form-control"
                placeholder="Action"
                value={filters.action}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, action: e.target.value }))
                }
              />
            </div>
            <div className="col-lg-2">
              <input
                className="form-control"
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value }))
                }
              />
            </div>
            <div className="col-lg-2">
              <input
                className="form-control"
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, to: e.target.value }))
                }
              />
            </div>
            <div className="col-lg-2 d-flex gap-2">
              <button
                className="btn btn-primary flex-fill"
                onClick={() => load(1)}
              >
                Filter
              </button>
              <Can permission="audit.export">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => exportLogs("csv")}
                  title="Export CSV"
                >
                  <i className="bi bi-download" />
                </button>
              </Can>
            </div>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 audit-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((x) => (
                  <tr key={x._id}>
                    <td className="small">
                      {new Date(x.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {x.actorId?.name || "System"}
                      <div className="small text-secondary">
                        {x.actorId?.email}
                      </div>
                    </td>
                    <td>
                      <span className="badge text-bg-primary">{x.action}</span>
                    </td>
                    <td>
                      {x.targetType}
                      <div className="small text-secondary">
                        {x.targetId || "—"}
                      </div>
                    </td>
                    <td className="small">{x.ip || "—"}</td>
                    <td className="audit-details">
                      <details>
                        <summary>View</summary>
                        <pre className="small mb-0">
                          {JSON.stringify(x.details || {}, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    No audit events found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center">
          <span>
            Page {pagination.page} / {pagination.totalPages} ·{" "}
            {pagination.total} events
          </span>
          <div>
            <button
              className="btn btn-sm btn-outline-secondary me-2"
              disabled={pagination.page <= 1}
              onClick={() => load(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => load(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

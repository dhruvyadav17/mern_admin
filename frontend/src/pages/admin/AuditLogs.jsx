import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import PageHeader from "../../components/common/PageHeader";
import { Can } from "../../context/PermissionContext";
import { getAuditLogs, exportAuditLogs } from "../../services/auditService";

const initialFilters = {
  search: "",
  actorId: "",
  action: "",
  targetType: "",
  targetId: "",
  from: "",
  to: "",
};

const emptyPagination = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1,
};

const AuditLogs = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);

      try {
        const response = await getAuditLogs({
          ...appliedFilters,
          page,
          limit: 25,
        });

        setLogs(response.data.data || []);
        setPagination(response.data.pagination || { ...emptyPagination, page });
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load audit logs",
        );
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFilter = () => {
    setAppliedFilters({ ...filters });
  };

  const handleClear = () => {
    setFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const response = await exportAuditLogs({
        ...appliedFilters,
        format: "csv",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "audit-logs.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to export audit logs",
      );
    } finally {
      setExporting(false);
    }
  };

  const handlePrevious = () => {
    if (pagination.page > 1) {
      load(pagination.page - 1);
    }
  };

  const handleNext = () => {
    if (pagination.page < pagination.totalPages) {
      load(pagination.page + 1);
    }
  };

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="Track administrative and security activity"
      />

      <Can permission="audit.view">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label" htmlFor="audit-search">
                  Search
                </label>
                <input
                  id="audit-search"
                  type="text"
                  className="form-control"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Action / resource / target ID"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label" htmlFor="audit-actor">
                  User ID
                </label>
                <input
                  id="audit-actor"
                  type="text"
                  className="form-control"
                  name="actorId"
                  value={filters.actorId}
                  onChange={handleFilterChange}
                  placeholder="User ID"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label" htmlFor="audit-action">
                  Action
                </label>
                <input
                  id="audit-action"
                  type="text"
                  className="form-control"
                  name="action"
                  value={filters.action}
                  onChange={handleFilterChange}
                  placeholder="e.g. user.update"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label" htmlFor="audit-target-type">
                  Resource
                </label>
                <input
                  id="audit-target-type"
                  type="text"
                  className="form-control"
                  name="targetType"
                  value={filters.targetType}
                  onChange={handleFilterChange}
                  placeholder="User / Role"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="audit-target-id">
                  Target ID
                </label>
                <input
                  id="audit-target-id"
                  type="text"
                  className="form-control"
                  name="targetId"
                  value={filters.targetId}
                  onChange={handleFilterChange}
                  placeholder="Target ID"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label" htmlFor="audit-from">
                  From
                </label>
                <input
                  id="audit-from"
                  type="date"
                  className="form-control"
                  name="from"
                  value={filters.from}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label" htmlFor="audit-to">
                  To
                </label>
                <input
                  id="audit-to"
                  type="date"
                  className="form-control"
                  name="to"
                  value={filters.to}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-md-8 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFilter}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Filter"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </button>

                <Can permission="audit.export">
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={handleExport}
                    disabled={loading || exporting}
                  >
                    {exporting ? "Exporting..." : "Export CSV"}
                  </button>
                </Can>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mt-3">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Target ID</th>
                    <th>IP</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleString()
                            : "-"}
                        </td>

                        <td>
                          <div className="fw-semibold">
                            {log.actorId?.name || "-"}
                          </div>
                          <small className="text-muted">
                            {log.actorId?.email || ""}
                          </small>
                        </td>

                        <td>
                          <span className="badge bg-secondary">
                            {log.action}
                          </span>
                        </td>

                        <td>{log.targetType || "-"}</td>
                        <td>{log.targetId || "-"}</td>
                        <td>{log.ip || "-"}</td>
                        <td>
                          <code>{JSON.stringify(log.details || {})}</code>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-footer d-flex justify-content-between align-items-center">
            <span className="text-muted">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total
            </span>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handlePrevious}
                disabled={loading || pagination.page <= 1}
              >
                Previous
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleNext}
                disabled={
                  loading || pagination.page >= pagination.totalPages
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Can>
    </>
  );
};

export default AuditLogs;

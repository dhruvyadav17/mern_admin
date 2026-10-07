import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { getDashboardStats } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
const cards = [
  ["totalUsers", "Total Users", "bi-people", "primary"],
  ["activeUsers", "Active Users", "bi-person-check", "success"],
  ["inactiveUsers", "Inactive Users", "bi-person-x", "warning"],
  ["suspendedUsers", "Suspended Users", "bi-person-slash", "danger"],
  ["roles", "Roles", "bi-person-badge", "dark"],
  ["permissions", "Permissions", "bi-shield-lock", "secondary"],
];
export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getDashboardStats()
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name || "Admin"}`}
        subtitle="Administration overview and recent activity."
      />
      <div className="row g-3 mb-4">
        {cards.map(([k, l, i, c]) => (
          <div className="col-sm-6 col-xl-4 col-xxl-2" key={k}>
            <div className={`card text-bg-${c} shadow-sm h-100`}>
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <div className="small opacity-75">{l}</div>
                  <div className="display-6 fw-semibold">
                    {loading ? "—" : (stats?.[k] ?? 0)}
                  </div>
                </div>
                <div className="stat-icon">
                  <i className={`bi ${i} fs-3`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row g-4">
        <div className="col-xl-7">
          <div className="card shadow-sm">
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-primary-subtle p-3">
                      <i className="bi bi-shield-check fs-4 text-primary" />
                    </div>

                    <div>
                      <div className="small text-secondary">
                        Active Administrators
                      </div>

                      <div className="fs-3 fw-semibold">
                        {loading ? "—" : (stats?.adminUsers ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-info-subtle p-3">
                      <i className="bi bi-graph-up-arrow fs-4 text-info" />
                    </div>

                    <div>
                      <div className="small text-secondary">
                        New Users · Last 30 Days
                      </div>

                      <div className="fs-3 fw-semibold">
                        {loading
                          ? "—"
                          : (stats?.userGrowth?.reduce(
                              (total, item) => total + item.count,
                              0,
                            ) ?? 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-header d-flex justify-content-between">
              <h3 className="card-title mb-0">User Growth · 30 Days</h3>
              <Link
                to="/admin/users"
                className="btn btn-sm btn-outline-primary"
              >
                Manage Users
              </Link>
            </div>
            <div className="card-body">
              {stats?.userGrowth?.length ? (
                <div className="growth-chart">
                  {stats.userGrowth.map((x) => (
                    <div
                      className="growth-bar"
                      key={x._id}
                      title={`${x._id}: ${x.count}`}
                      style={{
                        height: `${Math.max(8, Math.min(100, x.count * 10))}%`,
                      }}
                    >
                      <span>{x.count}</span>
                      <small>{x._id.slice(5)}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-secondary py-5">
                  No recent user growth data.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-xl-5">
          <div className="card shadow-sm">
            <div className="card-header">
              <h3 className="card-title mb-0">Users by Role</h3>
            </div>
            <div className="card-body">
              {stats?.roleDistribution?.map((x) => (
                <div className="mb-3" key={x._id}>
                  <div className="d-flex justify-content-between">
                    <span>{x._id}</span>
                    <strong>{x.count}</strong>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${Math.round((x.count / Math.max(stats.totalUsers, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header">
              <h3 className="card-title mb-0">Recent Activity</h3>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentActivity?.length ? (
                    stats.recentActivity.map((x) => (
                      <tr key={x._id}>
                        <td>{new Date(x.createdAt).toLocaleString()}</td>
                        <td>{x.actorId?.name || "System"}</td>
                        <td>
                          <span className="badge text-bg-light">
                            {x.action}
                          </span>
                        </td>
                        <td>
                          {x.targetType}{" "}
                          {x.targetId && (
                            <span className="small text-secondary">
                              {x.targetId}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-5">
                        No activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

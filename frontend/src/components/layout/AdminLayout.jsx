import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Can } from "../../context/PermissionContext";
import { globalSearch } from "../../services/searchService";
import toast from "react-hot-toast";
import NotificationBell from "../notifications/NotificationBell";

const NavItem = ({ to, icon, children, permission }) => (
  <Can permission={permission}>
    <li className="nav-item">
      <NavLink
        to={to}
        className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
      >
        <i className={`nav-icon bi ${icon}`} />
        <p>{children}</p>
      </NavLink>
    </li>
  </Can>
);

function SearchResults({ results, go }) {
  if (!results) return null;
  const hasResults =
    results.users?.length ||
    results.roles?.length ||
    results.permissions?.length;
  return (
    <div className="search-results dropdown-menu show shadow">
      {results.users?.length > 0 && (
        <>
          <div className="dropdown-header">Users</div>
          {results.users.map((x) => (
            <button
              className="dropdown-item"
              key={x._id}
              onClick={() => go(`/admin/users/${x._id}`)}
            >
              <i className="bi bi-person me-2" />
              {x.name}
              <span className="small text-secondary ms-2">{x.email}</span>
            </button>
          ))}
        </>
      )}
      {results.roles?.length > 0 && (
        <>
          <div className="dropdown-header">Roles</div>
          {results.roles.map((x) => (
            <button
              className="dropdown-item"
              key={x._id}
              onClick={() => go("/admin/roles")}
            >
              <i className="bi bi-person-badge me-2" />
              {x.label}
            </button>
          ))}
        </>
      )}
      {results.permissions?.length > 0 && (
        <>
          <div className="dropdown-header">Permissions</div>
          {results.permissions.map((x) => (
            <button
              className="dropdown-item"
              key={x._id}
              onClick={() => go("/admin/permissions")}
            >
              <i className="bi bi-shield-lock me-2" />
              {x.key}
            </button>
          ))}
        </>
      )}
      {!hasResults && (
        <div className="dropdown-item-text text-secondary">No results</div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem("admin.sidebar.collapsed") !== "true",
  );
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return undefined;
    }
    const timer = setTimeout(
      () =>
        globalSearch(q)
          .then((r) => setResults(r.data.data))
          .catch(() => {}),
      250,
    );
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    localStorage.setItem(
      "admin.sidebar.collapsed",
      sidebarOpen ? "false" : "true",
    );
  }, [sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const signOut = async () => {
    try {
      await logout();
      toast.success("Logout successful");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Logout failed");
    }
  };
  const go = (path) => {
    setResults(null);
    setQ("");
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div
      className={`admin-shell ${sidebarOpen ? "admin-sidebar-expanded" : "admin-sidebar-collapsed"}`}
    >
      <nav className="admin-header navbar navbar-expand bg-body border-bottom sticky-top">
        <div className="container-fluid">
          <button
            className="btn btn-link nav-link sidebar-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
            onClick={toggleSidebar}
          >
            <i className="bi bi-list fs-4" />
          </button>
          <span className="d-none d-md-inline fw-semibold">Admin Portal</span>
          <div className="global-search position-relative mx-auto d-none d-lg-block">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary" />
            <input
              ref={searchRef}
              className="form-control ps-5"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users, roles, permissions (Ctrl+K)"
            />
            <SearchResults results={results} go={go} />
          </div>

          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <NotificationBell />
            </li>
            <li className="nav-item dropdown">
              <button
                className="btn nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
                type="button"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="header-avatar" />
                ) : (
                  <i className="bi bi-person-circle" />
                )}
                {user?.name}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item-text small text-secondary">
                    {user?.email}
                  </span>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <NavLink className="dropdown-item" to="/profile">
                    <i className="bi bi-person me-2" />
                    Profile
                  </NavLink>
                </li>
                <Can permission="settings.view">
                  <li>
                    <NavLink className="dropdown-item" to="/admin/settings">
                      <i className="bi bi-gear me-2" />
                      Settings
                    </NavLink>
                  </li>
                </Can>
                <Can permission="password.change">
                  <li>
                    <NavLink className="dropdown-item" to="/change-password">
                      <i className="bi bi-key me-2" />
                      Change password
                    </NavLink>
                  </li>
                </Can>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={signOut}
                  >
                    <i className="bi bi-box-arrow-right me-2" />
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>

      <aside className="admin-sidebar bg-dark shadow" data-bs-theme="dark">
        <div className="admin-sidebar-brand">
          <NavLink
            to="/"
            className="brand-link text-decoration-none"
            onClick={() => setSidebarOpen(false)}
          >
            <i className="bi bi-grid-1x2-fill me-2" />
            <span className="brand-text fw-light">MERN Admin</span>
          </NavLink>
        </div>
        <div className="admin-sidebar-wrapper">
          <nav>
            <ul className="nav admin-sidebar-menu flex-column" role="menu">
              <li className="nav-header">MAIN</li>
              <NavItem
                to="/"
                icon="bi-speedometer2"
                permission="dashboard.view"
              >
                Dashboard
              </NavItem>
              <li className="nav-header">USER & ACCESS</li>
              <NavItem
                to="/admin/users"
                icon="bi-people"
                permission="users.view"
              >
                Users
              </NavItem>
              <NavItem
                to="/admin/roles"
                icon="bi-person-badge"
                permission="roles.view"
              >
                Roles
              </NavItem>
              <NavItem
                to="/admin/permissions"
                icon="bi-shield-lock"
                permission="permissions.view"
              >
                Permissions
              </NavItem>
              <NavItem
                to="/admin/role-permissions"
                icon="bi-diagram-3"
                permission="role-permissions.view"
              >
                Role Permissions
              </NavItem>
              <NavItem
                to="/admin/audit"
                icon="bi-journal-text"
                permission="audit.view"
              >
                Audit Logs
              </NavItem>
              <li className="nav-header">SYSTEM</li>
              <NavItem
                to="/admin/settings"
                icon="bi-gear"
                permission="settings.view"
              >
                Settings
              </NavItem>
              <li className="nav-header">ACCOUNT</li>
              <NavItem to="/profile" icon="bi-person" permission="profile.view">
                My Profile
              </NavItem>
              <NavItem
                to="/change-password"
                icon="bi-key"
                permission="password.change"
              >
                Change Password
              </NavItem>
            </ul>
          </nav>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          <div className="admin-content-container">
            <div className="breadcrumb-line small text-secondary d-none d-md-flex align-items-center gap-2">
              <i className="bi bi-house-door" /> Home <span>/</span>{" "}
              {location.pathname.replace(/^\//, "").replaceAll("/", " / ")}
            </div>
            <Outlet />
          </div>
        </div>
      </main>
      <footer className="admin-footer">
        <strong>MERN Admin Portal</strong>
        <span className="float-end d-none d-md-inline">
          Dynamic RBAC · AdminLTE 4
        </span>
      </footer>
      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

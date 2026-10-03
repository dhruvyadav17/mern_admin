import { useMemo } from "react";
import Pagination from "./Pagination";
import PermissionToggle from "./PermissionToggle";

const unique = (items = []) => [...new Set(items.filter(Boolean))];

export default function PermissionAccessList({
  permissions = [],
  allow = [],
  deny = [],
  inherited = [],
  canManage = false,
  saving = new Set(),
  filter = "",
  onFilterChange,
  page = 1,
  onPageChange,
  limit = 12,
  loading = false,
  onToggle,
  emptyText = "No permissions found."
}) {
  const normalizedAllow = useMemo(() => unique(allow), [allow]);
  const normalizedDeny = useMemo(() => unique(deny), [deny]);
  const normalizedInherited = useMemo(() => unique(inherited), [inherited]);
  const hasWildcard = normalizedInherited.includes("*");

  const filtered = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return permissions.filter((permission) =>
      !query || `${permission.key} ${permission.label} ${permission.group || ""}`.toLowerCase().includes(query)
    );
  }, [permissions, filter]);

  const rows = filtered.slice((page - 1) * limit, page * limit);
  const isAllowed = (key) => !normalizedDeny.includes(key) && (normalizedAllow.includes(key) || hasWildcard || normalizedInherited.includes(key));

  return (
    <>
      <div className="permission-toolbar user-permission-toolbar">
        <div className="input-group permission-search-box">
          <span className="input-group-text"><i className="bi bi-search" /></span>
          <input className="form-control" placeholder="Search permission, key or group" value={filter} onChange={(event) => onFilterChange?.(event.target.value)} />
        </div>
        <span className="rbac-count-badge"><i className="bi bi-shield-check me-1" />{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="empty-rbac-state"><div className="spinner-border spinner-border-sm me-2" />Loading permissions…</div>
      ) : (
        <>
          <div className="user-permission-list user-permission-list-clean">
            <div className="user-permission-list-head user-permission-list-head-clean">
              <span>Permission</span>
              <span className="text-center">Access</span>
            </div>
            {rows.map((permission) => {
              const checked = isAllowed(permission.key);
              const inheritedByRole = hasWildcard || normalizedInherited.includes(permission.key);
              const direct = normalizedAllow.includes(permission.key) && !inheritedByRole;
              const explicitlyDenied = normalizedDeny.includes(permission.key);
              const isSaving = saving.has(permission.key);

              return (
                <div className={`user-permission-row user-permission-row-clean ${checked ? "is-allowed" : ""} ${isSaving ? "is-saving" : ""}`} key={permission._id || permission.key}>
                  <div className="permission-row-copy">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <strong>{permission.label}</strong>
                      {inheritedByRole && <span className="permission-inherited-pill"><i className="bi bi-diagram-3 me-1" />Role access</span>}
                      {direct && <span className="permission-direct-pill">Direct</span>}
                      {explicitlyDenied && <span className="permission-denied-pill">Explicitly blocked</span>}
                    </div>
                    <code>{permission.key}</code>
                    {permission.group && <span className="permission-row-group">{permission.group}</span>}
                  </div>
                  <div className="permission-access-cell">
                    {isSaving ? (
                      <span className="permission-saving-state"><span className="spinner-border spinner-border-sm" />Saving</span>
                    ) : (
                      <PermissionToggle
                        checked={checked}
                        disabled={!canManage}
                        onChange={(enabled) => onToggle?.(permission, enabled)}
                        label={`${checked ? "Remove" : "Allow"} ${permission.label}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            {!rows.length && <div className="empty-rbac-state">{emptyText}</div>}
          </div>
          <Pagination page={page} totalPages={Math.ceil(filtered.length / limit) || 1} total={filtered.length} label="permissions" onChange={onPageChange} />
        </>
      )}
    </>
  );
}

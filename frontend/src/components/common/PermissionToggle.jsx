export default function PermissionToggle({ checked, disabled = false, saving = false, onChange, label }) {
  return (
    <label className={`permission-toggle ${checked ? "is-checked" : ""} ${disabled || saving ? "is-disabled" : ""}`} title={label || (checked ? "Remove access" : "Allow access")}>
      <input type="checkbox" checked={checked} disabled={disabled || saving} onChange={(event) => onChange?.(event.target.checked)} aria-label={label} />
      <span className="permission-toggle-track"><span className="permission-toggle-thumb" /></span>
      {saving && <span className="permission-toggle-saving" aria-hidden="true"><span className="spinner-border spinner-border-sm" /></span>}
    </label>
  );
}


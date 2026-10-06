import { useEffect, useId } from "react";

export default function Modal({ open, title, onClose, children, footer, size = "lg", closeDisabled = false, className = "" }) {
  const titleId = useId().replace(/:/g, "");

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !closeDisabled) onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeDisabled, onClose]);

  if (!open) return null;

  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !closeDisabled) onClose?.();
      }}
    >
      <div className={`modal-dialog modal-dialog-centered admin-modal-dialog modal-${size} ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-content admin-modal-content">
          <div className="modal-header admin-modal-header">
            <div className="min-w-0">
              <h5 className="modal-title text-truncate" id={titleId}>{title}</h5>
            </div>
            <button type="button" className="btn-close flex-shrink-0" onClick={onClose} disabled={closeDisabled} aria-label="Close" />
          </div>
          <div className="modal-body admin-modal-body">{children}</div>
          {footer && <div className="modal-footer admin-modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}


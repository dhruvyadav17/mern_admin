import { useId } from "react";
import Modal from "./Modal";

export default function FormModal({
  open,
  title,
  onClose,
  onSubmit,
  saving = false,
  submitLabel = "Save",
  size = "lg",
  children,
  className = "",
  submitDisabled = false,
}) {
  const formId = `admin-form-modal-${useId().replace(/:/g, "")}`;

  return (
    <Modal
      open={open}
      title={title}
      onClose={saving ? undefined : onClose}
      size={size}
      closeDisabled={saving}
      className={className}
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button
            type="button"
            className="btn btn-light"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className="btn btn-primary"
            disabled={saving || submitDisabled}
          >
            {saving && (
              <span className="spinner-border spinner-border-sm me-1" />
            )}
            {saving ? "Saving..." : submitLabel}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit}>
        {children}
      </form>
    </Modal>
  );
}

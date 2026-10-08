import Modal from "./Modal";

export default function ConfirmModal({
  open,
  title = "Confirm action",
  message,
  onClose,
  onConfirm,
  loading = false,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? undefined : onClose}
      size="sm"
      closeDisabled={loading}
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <button
            type="button"
            className="btn btn-light"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && (
              <span className="spinner-border spinner-border-sm me-1" />
            )}
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="mb-0">{message}</p>
    </Modal>
  );
}

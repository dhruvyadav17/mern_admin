import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import { Can } from "../../context/PermissionContext";
export default function Profile() {
  const { user, fetchUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", avatar: null });
  const [saving, setSaving] = useState(false);

  const MAX_AVATAR_BYTES = 512 * 1024;
  const fileInputRef = useRef(null);
  const ACCEPTED_AVATAR_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  const [avatarError, setAvatarError] = useState("");
  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Only JPEG, PNG, GIF or WebP images are allowed.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Avatar must be 512 KB or smaller.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setAvatarError("");

      setForm((current) => ({
        ...current,
        avatar: reader.result,
      }));
    };

    reader.onerror = () => {
      setAvatarError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };
  const removeAvatar = () => {
    setAvatarError("");

    setForm((current) => ({
      ...current,
      avatar: null,
    }));
  };
  useEffect(() => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar || null,
    });

    setAvatarError("");
  }, [user]);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile(form);
      await fetchUser();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Update your own profile information."
      />

      <div className="card shadow-sm">
        <form onSubmit={save}>
          <div className="card-body">
            <div className="profile-avatar-section mb-4">
              <div className="profile-avatar-preview">
                {form.avatar ? (
                  <img src={form.avatar} alt="Profile avatar" />
                ) : (
                  <i className="bi bi-person-fill" />
                )}
              </div>

              <div className="profile-avatar-content">
                <h5 className="mb-1">Profile photo</h5>

                <p className="small text-secondary mb-2">
                  JPEG, PNG, GIF or WebP · maximum 512 KB
                </p>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <i className="bi bi-camera me-1" />
                    {form.avatar ? "Change photo" : "Upload photo"}
                  </button>

                  {form.avatar && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={removeAvatar}
                      disabled={saving}
                    >
                      <i className="bi bi-trash me-1" />
                      Remove
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_AVATAR_TYPES.join(",")}
                  className="d-none"
                  onChange={handleAvatarChange}
                />

                {avatarError && (
                  <div className="text-danger small mt-2">{avatarError}</div>
                )}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  disabled
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="col-12">
                <div className="alert alert-light border mb-0">
                  Roles:{" "}
                  {(user?.roles || [user?.role]).filter(Boolean).join(", ")} ·
                  Status: {user?.status}
                </div>
              </div>
            </div>
          </div>
          <div className="card-footer">
            <Can permission="profile.update">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </Can>
          </div>
        </form>
      </div>
    </>
  );
}

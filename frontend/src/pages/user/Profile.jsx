import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import { Can } from "../../context/PermissionContext";
export default function Profile() {
  const { user, fetchUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  useEffect(
    () => setForm({ name: user?.name || "", email: user?.email || "" }),
    [user],
  );
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

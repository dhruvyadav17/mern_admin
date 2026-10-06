import { useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/common/PageHeader";
import authService from "../../services/authService";

export default function ChangePassword() {
    const [form, setForm] = useState({ currentPassword: "", password: "", confirmPassword: "" });
    const save = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
        try { await authService.changePassword({ currentPassword: form.currentPassword, password: form.password }); toast.success("Password changed. Please login again."); window.location.replace("/login"); }
        catch (e) { toast.error(e.response?.data?.message || "Unable to change password"); }
    };
    return <><PageHeader title="Change Password" subtitle="Verify your current password before setting a new one." /><div className="card shadow-sm col-lg-6"><form onSubmit={save}><div className="card-body"><label className="form-label">Current password</label><input className="form-control mb-3" type="password" autoComplete="current-password" required value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} /><label className="form-label">New password</label><input className="form-control mb-3" type="password" minLength="8" required autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><label className="form-label">Confirm new password</label><input className="form-control" type="password" minLength="8" required autoComplete="new-password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></div><div className="card-footer"><button className="btn btn-primary">Update password</button></div></form></div></>;
}


"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";

type Profile = {
  userId: number;
  fullName: string;
  phoneNumber: string;
  createdAt: string;
  totalTransactions: number;
};

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Profile>("/api/users/me");
        setProfile(res.data);
      } catch {
        toast.error("Failed to load profile");
      }
    };
    if (user) load();
  }, [user]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setSaving(true);

    try {
      await api.put("/api/users/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success("Password changed — please log in again");
      logout();
      router.replace("/login");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to change password";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <Link href="/dashboard" className="back-link">
            ← Dashboard
          </Link>
          <h1>Profile & Settings</h1>
          <p className="muted">Manage your account details</p>
        </div>
      </header>

      <section className="profile-layout">
        {/* Info card */}
        <article className="panel">
          <div className="panel-head">
            <h2>Account info</h2>
          </div>

          <div className="profile-info">
            <div className="avatar-circle">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>

            <div className="info-rows">
              <div className="info-row">
                <span>Full name</span>
                <strong>{profile?.fullName || user.fullName}</strong>
              </div>
              <div className="info-row">
                <span>Phone number</span>
                <strong>{profile?.phoneNumber || "—"}</strong>
              </div>
              <div className="info-row">
                <span>Member since</span>
                <strong>
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : "—"}
                </strong>
              </div>
              <div className="info-row">
                <span>Total transactions</span>
                <strong>{profile?.totalTransactions ?? "—"}</strong>
              </div>
            </div>
          </div>
        </article>

        {/* Change password */}
        <article className="panel">
          <div className="panel-head">
            <h2>Change password</h2>
          </div>

          <form className="form-stack" onSubmit={handleChangePassword}>
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </label>

            <label className="field">
              <span>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </label>

            <label className="field">
              <span>Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </label>

            <button className="primary-btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Update password"}
            </button>
          </form>
        </article>

        {/* Danger zone */}
        <article className="panel danger-zone">
          <div className="panel-head">
            <h2>Session</h2>
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>
            Logging out will clear your session from this device.
          </p>
          <button
            className="danger-btn"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Log out
          </button>
        </article>
      </section>
    </main>
  );
}
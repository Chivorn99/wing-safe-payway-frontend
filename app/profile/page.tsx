"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import NavBar from "@/app/components/NavBar";
import { api } from "@/lib/api";

type Profile = {
  userId: number;
  fullName: string;
  phoneNumber: string;
  createdAt: string;
  totalTransactions: number;
  profileImage: string | null;
};

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

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
        setEditName(res.data.fullName);
        setEditPhone(res.data.phoneNumber);
      } catch {
        toast.error("Failed to load profile");
      }
    };
    if (user) load();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!editPhone.trim() || editPhone.length < 9) {
      toast.error("Enter a valid phone number");
      return;
    }

    setSavingInfo(true);
    try {
      const res = await api.put<Profile>("/api/users/me", {
        fullName: editName.trim(),
        phoneNumber: editPhone.trim(),
      });
      setProfile(res.data);
      setEditingInfo(false);

      // If phone number changed, need to re-login
      if (res.data.phoneNumber !== profile?.phoneNumber) {
        toast.success("Profile updated! Please log in with your new phone number");
        logout();
        router.replace("/login");
      } else {
        toast.success("Profile updated! ✨");
      }
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Compress and convert to base64
    const base64 = await compressAndConvert(file, 200, 0.8);

    try {
      const res = await api.put<Profile>("/api/users/me", {
        profileImage: base64,
      });
      setProfile(res.data);
      toast.success("Profile picture updated! 📸");
    } catch {
      toast.error("Failed to update picture");
    }
  };

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

      toast.success("Password changed! 🔐 Please log in again");
      logout();
      router.replace("/login");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to change password";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <NavBar />
      <main className="app-shell">
        <header className="topbar">
          <div>
            <Link href="/dashboard" className="back-link">
              ← Dashboard
            </Link>
            <h1>👤 Profile & Settings</h1>
            <p className="muted">Manage your account details</p>
          </div>
        </header>

        <section className="profile-layout">
          {/* Info card */}
          <article className="panel">
            <div className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>🪪 Account info</h2>
              {!editingInfo && (
                <button
                  className="ghost-btn"
                  style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                  onClick={() => setEditingInfo(true)}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            <div className="profile-info">
              <div
                className="avatar-circle"
                style={{
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  backgroundImage: profile?.profileImage
                    ? `url(${profile.profileImage})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: profile?.profileImage ? "transparent" : undefined,
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change photo"
              >
                {!profile?.profileImage &&
                  user.fullName?.charAt(0).toUpperCase()}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    fontSize: "0.6rem",
                    textAlign: "center",
                    padding: "2px 0",
                  }}
                >
                  📷
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />

              {!editingInfo ? (
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
              ) : (
                <form className="form-stack" onSubmit={handleUpdateProfile} style={{ flex: 1 }}>
                  <label className="field">
                    <span>Full name</span>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your name"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Phone number</span>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. 0961234567"
                      required
                    />
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="primary-btn"
                      type="submit"
                      disabled={savingInfo}
                      style={{ flex: 1 }}
                    >
                      {savingInfo ? "Saving..." : "💾 Save"}
                    </button>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => {
                        setEditingInfo(false);
                        setEditName(profile?.fullName || "");
                        setEditPhone(profile?.phoneNumber || "");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </article>

          {/* Change password */}
          <article className="panel">
            <div className="panel-head">
              <h2>🔐 Change password</h2>
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
                {saving ? "Saving..." : "🔄 Update password"}
              </button>
            </form>
          </article>

          {/* Danger zone */}
          <article className="panel danger-zone">
            <div className="panel-head">
              <h2>🚪 Session</h2>
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
    </>
  );
}

/** Compress image and convert to base64 data URL */
function compressAndConvert(
  file: File,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = URL.createObjectURL(file);
  });
}
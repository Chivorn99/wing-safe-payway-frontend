"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { getApiErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await login(phoneNumber, password);
      toast.success("Welcome back! 🎉");
      router.replace("/dashboard");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-decor">
        <div className="auth-decor-content">
          <div className="auth-decor-emoji">💸</div>
          <h2>Take control of your money</h2>
          <p>Track spending, scan receipts, and build smarter financial habits.</p>
        </div>
      </div>

      <div className="auth-form-side">
        <section className="auth-card">
          <div className="brand-badge">✨ WingView</div>
          <h1>Welcome back</h1>
          <p className="muted">Sign in to your account to continue.</p>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Phone number</span>
              <input
                type="text"
                placeholder="012345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18,
                    color: "#9ca3af",
                    padding: 4,
                  }}
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <p className="auth-footer">
            No account yet? <Link href="/register">Create one</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
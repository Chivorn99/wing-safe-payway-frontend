"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
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
      await register(fullName, phoneNumber, password);
      toast.success("Registration successful");
      router.replace("/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-badge">WingView</div>
        <h1>Create account</h1>
        <p className="muted">Register as a normal user.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </label>

          <label className="field">
            <span>Phone number</span>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="012345678"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              required
            />
          </label>

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
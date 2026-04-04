"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import NavBar from "@/app/components/NavBar";
import { api, createTransaction, type TransactionDTO } from "@/lib/api";

/** Resize & compress image client-side before uploading */
function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          resolve(
            blob
              ? new File([blob], file.name, { type: "image/jpeg" })
              : file
          );
        },
        "image/jpeg",
        quality
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

type Mode = "manual" | "upload";

const blank: TransactionDTO = {
  recipientName: "",
  bankName: "",
  amount: 0,
  currency: "USD",
  category: "OTHER",
  riskLevel: "SAFE",
  paymentContext: "MERCHANT",
  status: "PAID",
  note: "",
};

const MODE_CONFIG: Record<Mode, { icon: string; label: string }> = {
  manual: { icon: "✏️", label: "Manual" },
  upload: { icon: "📎", label: "Upload" },
};


export default function ScanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("manual");
  const [form, setForm] = useState<TransactionDTO>({ ...blank });
  const [previewUrl, setPreviewUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);



  const runOcr = useCallback(async (file: File) => {
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setScanning(true);

    try {
      // Compress image client-side before uploading (5MB → ~100KB)
      const compressed = await compressImage(file, 1000, 0.7);

      const formData = new FormData();
      formData.append("image", compressed);

      const res = await api.post("/api/receipts/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data;
      setForm({
        recipientName: data.recipientName || "",
        bankName: data.bankName || "",
        amount: Number(data.amount) || 0,
        currency: data.currency || "USD",
        category: data.category || "OTHER",
        riskLevel: data.riskLevel || "SAFE",
        paymentContext: data.paymentContext || "MERCHANT",
        status: data.status || "PAID",
        note: data.note || "",
      });

      toast.success("Receipt scanned! ✨ Review and correct before saving");
    } catch {
      toast.error("OCR failed. Fill in fields manually.");
    } finally {
      setScanning(false);
    }
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await runOcr(file);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTransaction(form);
      toast.success("Transaction saved! 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Object &&
        "response" in err &&
        err.response instanceof Object &&
        "data" in err.response &&
        err.response.data instanceof Object &&
        "message" in err.response.data
          ? String(err.response.data.message)
          : "Failed to save";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <NavBar />
      <main className="app-shell">
        <header className="topbar">
          <div>
            <button
              className="back-link-btn"
              onClick={() => router.push("/dashboard")}
            >
              ← Back
            </button>
            <h1>📸 Add transaction</h1>
            <p className="muted">Manual entry or upload a receipt.</p>
          </div>
        </header>

        <section className="mode-switch">
          {(["manual", "upload"] as Mode[]).map((m) => (
            <button
              key={m}
              className={`mode-btn${mode === m ? " active" : ""}`}
              onClick={() => {
                setMode(m);
                if (m === "manual") {
                  setForm({ ...blank });
                  setPreviewUrl("");
                }
              }}
            >
              {MODE_CONFIG[m].icon} {MODE_CONFIG[m].label}
            </button>
          ))}
        </section>

        <section className="scan-layout">
          <article className="panel">
            {mode === "upload" && (
              <div className="capture-panel">
                <h2>Upload receipt image</h2>
                <label className="upload-dropzone">
                  <div className="upload-dropzone-icon">📤</div>
                  <span>Choose file or drag here</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    hidden
                  />
                </label>
                {scanning && <p className="muted">🔍 Scanning receipt...</p>}
                {previewUrl && (
                  <Image
                    src={previewUrl}
                    alt="Receipt preview"
                    className="receipt-preview"
                    width={500}
                    height={500}
                  />
                )}
              </div>
            )}



            {mode === "manual" && (
              <div className="capture-panel">
                <h2>✏️ Manual entry</h2>
                <p className="muted">Fill in the transaction details in the form.</p>
              </div>
            )}
          </article>

          <article className="panel form-panel">
            <h2>
              {mode === "manual"
                ? "Transaction details"
                : "Review & correct OCR result"}
            </h2>

            <form className="form-stack" onSubmit={handleSubmit}>
              <div className="field-row">
                <label className="field">
                  <span>Recipient name</span>
                  <input
                    type="text"
                    value={form.recipientName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, recipientName: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Bank name</span>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, bankName: e.target.value }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span>Amount</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: Number(e.target.value) }))
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Currency</span>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        currency: e.target.value.toUpperCase(),
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span>Category</span>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        category: e.target.value as TransactionDTO["category"],
                      }))
                    }
                  >
                    {[
                      "FOOD",
                      "SHOPPING",
                      "TRANSPORT",
                      "UTILITIES",
                      "HEALTH",
                      "EDUCATION",
                      "ENTERTAINMENT",
                      "TRANSFER",
                      "OTHER",
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Payment context</span>
                  <select
                    value={form.paymentContext}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        paymentContext: e.target
                          .value as TransactionDTO["paymentContext"],
                      }))
                    }
                  >
                    {["MERCHANT", "WINGSHOP", "P2P", "BILLPAY"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        status: e.target.value as TransactionDTO["status"],
                      }))
                    }
                  >
                    {["PAID", "VERIFIED", "BLOCKED"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Risk level</span>
                  <select
                    value={form.riskLevel}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        riskLevel: e.target.value as TransactionDTO["riskLevel"],
                      }))
                    }
                  >
                    {["SAFE", "WARNING", "HIGH_RISK"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Note</span>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, note: e.target.value }))
                  }
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setForm({ ...blank });
                    setPreviewUrl("");
                  }}
                >
                  Reset
                </button>
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={submitting || scanning}
                >
                  {submitting ? "Saving..." : "💾 Save transaction"}
                </button>
              </div>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}

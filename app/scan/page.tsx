"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { api, createTransaction, type TransactionDTO } from "@/lib/api";

type Mode = "manual" | "upload" | "camera";

const blank: TransactionDTO = {
  recipientName: "",
  bankName: "",
  amount: 0,
  currency: "USD",
  category: "OTHER",
  riskLevel: "LOW",
  paymentContext: "MERCHANT",
  status: "PAID",
  note: "",
};

export default function ScanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("manual");
  const [form, setForm] = useState<TransactionDTO>({ ...blank });
  const [previewUrl, setPreviewUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (mode !== "camera") stopCamera();
    return () => stopCamera();
  }, [mode]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      toast.error("Cannot access camera");
    }
  };

  const runOcr = useCallback(async (file: File) => {
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setScanning(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

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
        riskLevel: data.riskLevel || "LOW",
        paymentContext: data.paymentContext || "MERCHANT",
        status: data.status || "PAID",
        note: data.note || "",
      });

      toast.success("Receipt scanned — review and correct before saving");
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

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return toast.error("Capture failed");
      const file = new File([blob], `receipt-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      stopCamera();
      await runOcr(file);
    }, "image/jpeg", 0.92);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createTransaction(form);
      toast.success("Transaction saved");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Object && "response" in err && err.response instanceof Object && "data" in err.response && err.response.data instanceof Object && "message" in err.response.data ? String(err.response.data.message) : "Failed to save";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <button className="back-link-btn" onClick={() => router.push("/dashboard")}>
            ← Back
          </button>
          <h1>Add transaction</h1>
          <p className="muted">Manual entry, upload receipt, or use camera.</p>
        </div>
      </header>

      <section className="mode-switch">
        {(["manual", "upload", "camera"] as Mode[]).map((m) => (
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
            {m === "manual" ? "✏️ Manual" : m === "upload" ? "📎 Upload" : "📷 Camera"}
          </button>
        ))}
      </section>

      <section className="scan-layout">
        <article className="panel">
          {mode === "upload" && (
            <div className="capture-panel">
              <h2>Upload receipt image</h2>
              <label className="upload-dropzone">
                <span>Choose file or drag here</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  hidden
                />
              </label>
              {scanning && <p className="muted">Scanning receipt...</p>}
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

          {mode === "camera" && (
            <div className="capture-panel">
              <h2>Camera capture</h2>
              {!cameraOn ? (
                <button className="primary-btn" onClick={startCamera}>
                  Open camera
                </button>
              ) : (
                <>
                  <video ref={videoRef} className="camera-preview" playsInline />
                  <div className="camera-actions">
                    <button className="primary-btn" onClick={capturePhoto}>
                      Capture
                    </button>
                    <button className="ghost-btn" onClick={stopCamera}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {scanning && <p className="muted">Scanning receipt...</p>}
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Captured receipt"
                  className="receipt-preview"
                  width={500}
                  height={500}
                />
              )}
              <canvas ref={canvasRef} hidden />
            </div>
          )}

          {mode === "manual" && (
            <div className="capture-panel">
              <h2>Manual entry</h2>
              <p className="muted">
                Fill in the transaction details below.
              </p>
            </div>
          )}
        </article>

        <article className="panel form-panel">
          <h2>
            {mode === "manual"
              ? "Transaction details"
              : "Review and correct OCR result"}
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
                  {["FOOD","SHOPPING","TRANSPORT","UTILITIES","HEALTH","EDUCATION","ENTERTAINMENT","TRANSFER","OTHER"].map(
                    (c) => <option key={c} value={c}>{c}</option>
                  )}
                </select>
              </label>
              <label className="field">
                <span>Payment context</span>
                <select
                  value={form.paymentContext}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      paymentContext: e.target.value as TransactionDTO["paymentContext"],
                    }))
                  }
                >
                  {["MERCHANT","WINGSHOP","P2P","BILLPAY"].map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                  {["PAID","VERIFIED","BLOCKED"].map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                  {["LOW","MEDIUM","HIGH"].map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                {submitting ? "Saving..." : "Save transaction"}
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
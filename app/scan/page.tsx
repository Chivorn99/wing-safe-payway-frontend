"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Camera,
  FileImage,
  PencilLine,
  RefreshCcw,
  Save,
  Upload,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { apiClient, type ReceiptDraft } from "@/lib/api";

type Mode = "manual" | "upload" | "camera";

const emptyDraft: ReceiptDraft = {
  merchantName: "",
  totalAmount: "",
  transactionDate: "",
  category: "OTHER",
  note: "",
  paymentMethod: "CASH",
  source: "manual",
  lineItems: [],
};

export default function ScanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const initialMode = (params.get("mode") as Mode) || "manual";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [draft, setDraft] = useState<ReceiptDraft>({ ...emptyDraft });
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const hasReceiptData = useMemo(
    () => Boolean(draft.merchantName || draft.totalAmount || previewUrl),
    [draft, previewUrl],
  );

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch {
      toast.error("Unable to access camera");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const applyDraft = (
    data: ReceiptDraft,
    source: "manual" | "upload" | "camera",
  ) => {
    setDraft({
      merchantName: data.merchantName || "",
      totalAmount: data.totalAmount ?? "",
      transactionDate: data.transactionDate || "",
      category: data.category || "OTHER",
      note: data.note || "",
      paymentMethod: data.paymentMethod || "CASH",
      source,
      imageUrl: data.imageUrl,
      lineItems: data.lineItems || [],
    });
  };

  const onUploadFile = async (file: File, source: "upload" | "camera") => {
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setScanning(true);

    try {
      const scanned = await apiClient.scanReceipt(file, source);
      applyDraft(scanned, source);
      toast.success("Receipt scanned. Review and correct before saving.");
    } catch (error: unknown) {
      setDraft((prev) => ({ ...prev, source }));
      const message =
        error instanceof Error && "response" in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(message || "OCR scan failed");
    } finally {
      setScanning(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadFile(file, "upload");
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          toast.error("Failed to capture image");
          return;
        }

        const file = new File([blob], `receipt-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        await onUploadFile(file, "camera");
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  const onManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (draft.source === "manual") {
        await apiClient.saveManualTransaction(draft);
      } else {
        await apiClient.saveReceiptTransaction(draft);
      }

      toast.success("Transaction saved");
      router.push("/dashboard");
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : undefined;
      toast.error(message || "Failed to save transaction");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <Link href="/dashboard" className="back-link">
            ← Back to dashboard
          </Link>
          <h1>Add transaction</h1>
          <p className="muted">
            Manual input, upload receipt, or capture from camera.
          </p>
        </div>
      </header>

      <section className="mode-switch">
        <button
          className={mode === "manual" ? "mode-btn active" : "mode-btn"}
          onClick={() => {
            setMode("manual");
            setDraft({ ...emptyDraft, source: "manual" });
            setPreviewUrl("");
          }}
        >
          <PencilLine size={18} />
          Manual
        </button>

        <button
          className={mode === "upload" ? "mode-btn active" : "mode-btn"}
          onClick={() => setMode("upload")}
        >
          <FileImage size={18} />
          Upload
        </button>

        <button
          className={mode === "camera" ? "mode-btn active" : "mode-btn"}
          onClick={() => setMode("camera")}
        >
          <Camera size={18} />
          Camera
        </button>
      </section>

      <section className="scan-layout">
        <article className="panel">
          {mode === "manual" && (
            <div className="capture-panel">
              <h2>Manual entry</h2>
              <p className="muted">
                Enter transaction details directly without a receipt image.
              </p>
            </div>
          )}

          {mode === "upload" && (
            <div className="capture-panel">
              <h2>Upload receipt</h2>
              <label className="upload-dropzone">
                <Upload size={22} />
                <span>Select receipt image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  hidden
                />
              </label>
            </div>
          )}

          {mode === "camera" && (
            <div className="capture-panel">
              <h2>Take photo</h2>

              {!cameraReady ? (
                <button className="primary-btn" onClick={startCamera}>
                  Open camera
                </button>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="camera-preview"
                    playsInline
                  />
                  <div className="camera-actions">
                    <button className="primary-btn" onClick={captureFromCamera}>
                      Capture
                    </button>
                    <button className="ghost-btn" onClick={stopCamera}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          )}

          {previewUrl && (
            <div className="preview-block">
              <h3>Receipt preview</h3>
              <Image
                src={previewUrl}
                alt="Receipt preview"
                className="receipt-preview"
                width={500}
                height={500}
                style={{ width: "auto", height: "auto" }}
              />
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2>Review and correct</h2>
            {scanning && <span className="status-chip">Scanning...</span>}
          </div>

          {!hasReceiptData && mode !== "manual" ? (
            <p className="muted">
              Upload or capture a receipt first, then OCR will auto-fill this
              form.
            </p>
          ) : (
            <form className="form-stack" onSubmit={onManualSubmit}>
              <label className="field">
                <span>Merchant name</span>
                <input
                  type="text"
                  value={draft.merchantName}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, merchantName: e.target.value }))
                  }
                  placeholder="Store or merchant"
                  required
                />
              </label>

              <div className="field-row">
                <label className="field">
                  <span>Total amount</span>
                  <input
                    type="number"
                    step="0.01"
                    value={draft.totalAmount}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        totalAmount:
                          e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    placeholder="0.00"
                    required
                  />
                </label>

                <label className="field">
                  <span>Date</span>
                  <input
                    type="date"
                    value={draft.transactionDate}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        transactionDate: e.target.value,
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
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    <option value="FOOD">Food</option>
                    <option value="GROCERIES">Groceries</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="SHOPPING">Shopping</option>
                    <option value="BILLS">Bills</option>
                    <option value="HEALTH">Health</option>
                    <option value="ENTERTAINMENT">Entertainment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label className="field">
                  <span>Payment method</span>
                  <select
                    value={draft.paymentMethod}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, paymentMethod: e.target.value }))
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="QR">QR</option>
                    <option value="EWALLET">E-wallet</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Note</span>
                <textarea
                  rows={4}
                  value={draft.note}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder="Optional note or OCR correction details"
                />
              </label>

              {draft.lineItems?.length ? (
                <div className="line-items">
                  <h3>Detected line items</h3>
                  {draft.lineItems.map((item, index) => (
                    <div className="line-item" key={`${item.name}-${index}`}>
                      <span>{item.name}</span>
                      <span>
                        {item.quantity ? `x${item.quantity} ` : ""}
                        {typeof item.price === "number"
                          ? `$${item.price.toFixed(2)}`
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="form-actions">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setDraft({ ...emptyDraft, source: mode });
                    setPreviewUrl("");
                  }}
                >
                  <RefreshCcw size={18} />
                  Reset
                </button>

                <button
                  className="primary-btn"
                  type="submit"
                  disabled={submitting}
                >
                  <Save size={18} />
                  {submitting ? "Saving..." : "Save transaction"}
                </button>
              </div>
            </form>
          )}
        </article>
      </section>
    </main>
  );
}

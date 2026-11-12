"use client";
import { useReportWebVitals } from "next/web-vitals";
const report: Parameters<typeof useReportWebVitals>[0] = metric => {
  const endpoint = process.env.NEXT_PUBLIC_RUM_ENDPOINT;
  if (!endpoint || !["LCP", "INP", "CLS"].includes(metric.name)) return;
  const body = JSON.stringify({ id: metric.id, name: metric.name, value: metric.value, device: matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop", version: process.env.NEXT_PUBLIC_RELEASE || "unknown" });
  const payload = new Blob([body], { type: "text/plain" });
  if (!navigator.sendBeacon?.(endpoint, payload)) void fetch(endpoint, { method: "POST", body: payload, keepalive: true }).catch(() => {});
};
export function WebVitals() { useReportWebVitals(report); return null; }

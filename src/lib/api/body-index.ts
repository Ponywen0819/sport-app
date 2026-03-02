import type { BodyIndex, CreateBodyIndexInput } from "@/lib/notion/mappers/body-index-mapper";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export function getLatestBodyIndex(): Promise<BodyIndex | null> {
  return apiFetch("/api/notion/body-index");
}

export function getBodyIndexByDate(date: string): Promise<BodyIndex | null> {
  return apiFetch(`/api/notion/body-index?date=${date}`);
}

export function addBodyIndex(data: CreateBodyIndexInput): Promise<{ id: string }> {
  return apiFetch("/api/notion/body-index", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

import { randomUUID } from "crypto";

export function newId(prefix = "id"): string {
  return `${prefix}_${randomUUID().slice(0, 12)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

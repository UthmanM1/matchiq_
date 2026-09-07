import { Vendor } from "@/types";
import { VendorDataAdapter } from "./VendorDataAdapter";

/**
 * ExternalApiAdapter (stub)
 * -------------------------
 * Reference shape for wiring MATCHIQ to a licensed, authorised third-party
 * vendor/software directory API (e.g. a G2- or Capterra-style data
 * partnership) once one is contracted. Not wired up or enabled in this
 * portfolio build — no such agreement exists — but the interface shows
 * exactly where real data would slot in without touching ScoringService,
 * ComparisonService, or any page component.
 */
export class ExternalApiAdapter implements VendorDataAdapter {
  readonly sourceName = "external-api";
  readonly isDemoData = false;

  constructor(private readonly baseUrl: string, private readonly apiKey: string) {}

  async listVendors(): Promise<Vendor[]> {
    const res = await fetch(`${this.baseUrl}/vendors`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`ExternalApiAdapter: upstream returned ${res.status}`);
    const data = await res.json();
    return data.vendors as Vendor[];
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const res = await fetch(`${this.baseUrl}/vendors/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      cache: "no-store",
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error(`ExternalApiAdapter: upstream returned ${res.status}`);
    return (await res.json()) as Vendor;
  }
}

import { Vendor } from "@/types";
import { VendorDataAdapter } from "./VendorDataAdapter";

/**
 * CsvVendorAdapter (stub)
 * ------------------------
 * Lets an organisation bring its own vendor shortlist research as a CSV
 * export (e.g. from a procurement team's spreadsheet) instead of using the
 * built-in catalogue. Column mapping is intentionally explicit so bad data
 * fails fast rather than silently producing wrong scores.
 */
export class CsvVendorAdapter implements VendorDataAdapter {
  readonly sourceName = "csv-import";
  readonly isDemoData = false;

  constructor(private readonly rows: Record<string, string>[]) {}

  private parseRow(row: Record<string, string>): Vendor {
    const splitList = (v?: string) => (v ? v.split("|").map((s) => s.trim()).filter(Boolean) : []);
    return {
      id: row.id,
      name: row.name,
      category: row.category as Vendor["category"],
      description: row.description ?? "",
      pricingModel: (row.pricingModel as Vendor["pricingModel"]) ?? "flat",
      startingPrice: Number(row.startingPrice ?? 0),
      currency: row.currency ?? "GBP",
      rating: Number(row.rating ?? 4),
      reviewCount: Number(row.reviewCount ?? 0),
      companySize: row.companySize ?? "11-50",
      features: splitList(row.features),
      integrations: splitList(row.integrations),
      securityFeatures: splitList(row.securityFeatures),
      implementationTime: row.implementationTime ?? "Unknown",
      implementationDays: Number(row.implementationDays ?? 30),
      supportLevel: (row.supportLevel as Vendor["supportLevel"]) ?? "business_hours",
      deploymentType: (row.deploymentType as Vendor["deploymentType"]) ?? "cloud",
      website: row.website ?? "",
      logo: row.name?.slice(0, 2).toUpperCase() ?? "??",
      isDemoData: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async listVendors(): Promise<Vendor[]> {
    return this.rows.map((r) => this.parseRow(r));
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const row = this.rows.find((r) => r.id === id);
    return row ? this.parseRow(row) : undefined;
  }
}

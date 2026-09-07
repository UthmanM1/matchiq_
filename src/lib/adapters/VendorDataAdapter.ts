import { Vendor } from "@/types";

/**
 * VendorDataAdapter
 * -----------------
 * Every vendor-sourcing strategy (static demo catalogue, a live vendor API,
 * a CSV import from a client's own research) implements this contract.
 * Nothing above this layer — services, API routes, or pages — needs to
 * change when the underlying vendor data source changes.
 */
export interface VendorDataAdapter {
  readonly sourceName: string;
  readonly isDemoData: boolean;
  listVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
}

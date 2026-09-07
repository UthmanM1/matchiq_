import { Vendor } from "@/types";
import { VendorDataAdapter } from "./VendorDataAdapter";
import { db } from "@/lib/store/db";

/** Ships with MATCHIQ: a synthetic, clearly-labelled vendor catalogue held in memory. */
export class StaticDemoAdapter implements VendorDataAdapter {
  readonly sourceName = "static-demo-catalogue";
  readonly isDemoData = true;

  async listVendors(): Promise<Vendor[]> {
    return db.vendors;
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    return db.vendors.find((v) => v.id === id);
  }
}

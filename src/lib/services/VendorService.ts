import { Vendor, VendorCategory } from "@/types";
import { StaticDemoAdapter } from "@/lib/adapters";
import { VendorDataAdapter } from "@/lib/adapters/VendorDataAdapter";

// Swap this line for a different VendorDataAdapter implementation (see
// /src/lib/adapters) to point MATCHIQ at a real vendor data source. No
// downstream code needs to change.
const adapter: VendorDataAdapter = new StaticDemoAdapter();

export interface VendorFilters {
  category?: VendorCategory | "All";
  maxPrice?: number;
  companySize?: string;
  deploymentType?: string;
  minRating?: number;
  feature?: string;
  search?: string;
}

export const VendorService = {
  adapterName: adapter.sourceName,
  isDemoData: adapter.isDemoData,

  async list(filters: VendorFilters = {}): Promise<Vendor[]> {
    let vendors = await adapter.listVendors();
    if (filters.category && filters.category !== "All") vendors = vendors.filter((v) => v.category === filters.category);
    if (filters.maxPrice) vendors = vendors.filter((v) => v.startingPrice <= filters.maxPrice!);
    if (filters.companySize) vendors = vendors.filter((v) => v.companySize === filters.companySize);
    if (filters.deploymentType) vendors = vendors.filter((v) => v.deploymentType === filters.deploymentType);
    if (filters.minRating) vendors = vendors.filter((v) => v.rating >= filters.minRating!);
    if (filters.feature) vendors = vendors.filter((v) => v.features.some((f) => f.toLowerCase().includes(filters.feature!.toLowerCase())));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      vendors = vendors.filter((v) => v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
    }
    return vendors;
  },

  async get(id: string): Promise<Vendor | undefined> {
    return adapter.getVendor(id);
  },

  async byCategory(category: VendorCategory): Promise<Vendor[]> {
    const all = await adapter.listVendors();
    return all.filter((v) => v.category === category);
  },
};

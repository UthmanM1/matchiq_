"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

export function AnalyticsCharts({
  categories,
  vendors,
}: {
  categories: [string, number][];
  vendors: { vendorId: string; vendor: string; count: number }[];
}) {
  const categoryData = categories.map(([name, count]) => ({ name, count }));
  const vendorData = vendors.map((v) => ({ name: v.vendor, count: v.count }));

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900 mb-4">Most evaluated categories</p>
          {categoryData.length === 0 ? (
            <p className="text-xs text-slate-400">No decisions yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" fill="#5b5bd6" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-slate-900 mb-4">Most selected vendors</p>
          {vendorData.length === 0 ? (
            <p className="text-xs text-slate-400">No decisions finalised yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendorData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" fill="#14213d" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

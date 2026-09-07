"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Loader2, Printer } from "lucide-react";

export function GenerateReportButton({ decisionId, hasReport }: { decisionId: string; hasReport: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/decisions/${decisionId}/report`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      setError((await res.json()).error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 flex-wrap no-print">
      <Button size="sm" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileBarChart className="h-3.5 w-3.5" />}
        {hasReport ? "Regenerate report" : "Generate decision report"}
      </Button>
      {hasReport && (
        <>
          <a href={`/api/decisions/${decisionId}/report/pdf`}>
            <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5" /> Download PDF</Button>
          </a>
          <Button size="sm" variant="ghost" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</Button>
        </>
      )}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { DecisionStatus } from "@/types";

const CONFIG: Record<DecisionStatus, { label: string; variant: "muted" | "info" | "warning" | "success" | "default" }> = {
  draft: { label: "Draft", variant: "muted" },
  researching: { label: "Researching", variant: "info" },
  shortlisted: { label: "Shortlisted", variant: "warning" },
  final_review: { label: "Final review", variant: "default" },
  decided: { label: "Decided", variant: "success" },
};

export function StatusBadge({ status }: { status: DecisionStatus }) {
  const cfg = CONFIG[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export const STATUS_SEQUENCE: DecisionStatus[] = ["draft", "researching", "shortlisted", "final_review", "decided"];

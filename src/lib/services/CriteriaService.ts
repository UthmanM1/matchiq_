import { CriteriaImportance, DecisionCriterion } from "@/types";
import { db, newId, nowIso } from "@/lib/store/db";
import { AnalyticsService } from "./AnalyticsService";

const DEFAULT_TEMPLATE: { name: string; weight: number; importance: CriteriaImportance }[] = [
  { name: "Price", weight: 20, importance: "important" },
  { name: "Automation", weight: 25, importance: "important" },
  { name: "Ease of use", weight: 20, importance: "important" },
  { name: "Integrations", weight: 15, importance: "important" },
  { name: "Reporting", weight: 20, importance: "optional" },
];

function normalise(decisionId: string) {
  const list = db.criteria.filter((c) => c.decisionId === decisionId);
  const total = list.reduce((s, c) => s + c.weight, 0);
  if (total === 0) return;
  for (const c of list) {
    c.weight = Math.round((c.weight / total) * 1000) / 10; // one decimal place, sums to ~100
  }
}

export const CriteriaService = {
  seedDefaults(decisionId: string, organisationId: string, userId: string) {
    DEFAULT_TEMPLATE.forEach((t, i) => {
      db.criteria.push({
        id: newId("crit"),
        decisionId,
        name: t.name,
        weight: t.weight,
        importance: t.importance,
        order: i,
      });
    });
    AnalyticsService.track(organisationId, userId, "criteria_created", { decisionId, count: DEFAULT_TEMPLATE.length });
    return CriteriaService.list(decisionId);
  },

  list(decisionId: string): DecisionCriterion[] {
    return db.criteria.filter((c) => c.decisionId === decisionId).sort((a, b) => a.order - b.order);
  },

  add(decisionId: string, organisationId: string, userId: string, name: string, weight: number, importance: CriteriaImportance) {
    const order = db.criteria.filter((c) => c.decisionId === decisionId).length;
    const criterion: DecisionCriterion = { id: newId("crit"), decisionId, name, weight, importance, order };
    db.criteria.push(criterion);
    normalise(decisionId);
    AnalyticsService.track(organisationId, userId, "criteria_created", { decisionId, name });
    return CriteriaService.list(decisionId);
  },

  remove(decisionId: string, criterionId: string) {
    const idx = db.criteria.findIndex((c) => c.id === criterionId);
    if (idx >= 0) db.criteria.splice(idx, 1);
    normalise(decisionId);
    return CriteriaService.list(decisionId);
  },

  updateWeight(decisionId: string, organisationId: string, userId: string, criterionId: string, weight: number) {
    const criterion = db.criteria.find((c) => c.id === criterionId);
    if (!criterion) return CriteriaService.list(decisionId);
    criterion.weight = weight;
    normalise(decisionId);
    AnalyticsService.track(organisationId, userId, "criteria_weight_changed", { decisionId, criterionId, weight });
    return CriteriaService.list(decisionId);
  },

  updateImportance(decisionId: string, criterionId: string, importance: CriteriaImportance) {
    const criterion = db.criteria.find((c) => c.id === criterionId);
    if (criterion) criterion.importance = importance;
    return CriteriaService.list(decisionId);
  },
};

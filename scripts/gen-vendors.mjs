// Deterministic generator for the synthetic MATCHIQ vendor catalogue.
// Run with `node scripts/gen-vendors.mjs` — writes src/lib/demo-data/vendors.ts
// All vendor names below are invented for demo purposes only.

import { writeFileSync } from "fs";

const CATEGORIES = {
  CRM: {
    features: [
      "Pipeline management", "Email automation", "Contact management", "Deal forecasting",
      "Slack integration", "Custom reporting", "Lead scoring", "Mobile app", "Workflow builder",
      "Territory management", "Quote generation", "Marketing automation sync",
    ],
    integrations: ["Slack", "Gmail", "Outlook", "Zapier", "Stripe", "Mailchimp", "HubSpot", "Zoom", "DocuSign"],
    security: ["SSO", "2FA", "Role-based access", "Field-level encryption", "SOC 2 Type II"],
    vendors: [
      "Pipestream", "Northbridge CRM", "Corelead", "Vantropy", "Fieldnote CRM", "Trailmark",
      "Loopwell", "Cadence CRM", "Brightfunnel",
    ],
  },
  "Project Management": {
    features: [
      "Kanban boards", "Gantt charts", "Time tracking", "Resource planning", "Sprint planning",
      "Task automation", "Custom workflows", "Portfolio dashboards", "Slack integration",
      "Client portals", "File versioning", "Dependency mapping",
    ],
    integrations: ["Slack", "GitHub", "Google Drive", "Jira", "Figma", "Zapier", "Microsoft Teams"],
    security: ["SSO", "2FA", "Audit logs", "SOC 2 Type II", "Granular permissions"],
    vendors: [
      "Taskframe", "Milestone Flow", "Orbitwork", "Ganttly", "Sprintvine", "Clearpath PM",
      "Basecamp Rivals", "Worklane", "Flowcadence",
    ],
  },
  Accounting: {
    features: [
      "Invoicing", "Expense tracking", "Payroll integration", "Multi-currency", "Bank reconciliation",
      "Tax reporting", "Custom reporting", "Budgeting tools", "Approval workflows", "Audit trail",
    ],
    integrations: ["Stripe", "PayPal", "Xero", "Slack", "Zapier", "Salesforce", "Shopify"],
    security: ["SOC 2 Type II", "2FA", "Encrypted storage", "Role-based access"],
    vendors: [
      "Ledgerly", "Balance Sheet Co", "Fiscalio", "Numeris", "ClearBooks Plus", "Vaultra Finance",
      "Countly", "Marginwise",
    ],
  },
  HR: {
    features: [
      "Applicant tracking", "Onboarding workflows", "Performance reviews", "Payroll",
      "Time-off management", "Benefits administration", "Org charts", "Employee self-service",
      "Compliance tracking", "Custom reporting",
    ],
    integrations: ["Slack", "Google Workspace", "Microsoft Teams", "Zapier", "DocuSign"],
    security: ["SSO", "2FA", "SOC 2 Type II", "GDPR tooling", "Role-based access"],
    vendors: [
      "Peoplecraft", "Rosterly", "Talentbridge HR", "Onboardio", "Humanstack", "Culture OS",
      "Teamwell HR",
    ],
  },
  "Marketing Automation": {
    features: [
      "Email campaigns", "Landing page builder", "Lead scoring", "A/B testing", "Marketing automation",
      "Social scheduling", "Analytics dashboards", "CRM sync", "Segmentation", "Reporting",
    ],
    integrations: ["Slack", "Salesforce", "HubSpot", "Zapier", "Google Analytics", "Meta Ads"],
    security: ["SSO", "2FA", "SOC 2 Type II", "GDPR tooling"],
    vendors: [
      "Signalreach", "Campaignhaus", "Fluxmail", "Growloop", "Beaconwave", "Audiencia",
      "Nudge Marketing",
    ],
  },
  "Customer Support": {
    features: [
      "Shared inbox", "Live chat", "Ticketing", "Knowledge base", "Automation rules", "SLA management",
      "Reporting", "Slack integration", "Chatbot builder", "CSAT surveys",
    ],
    integrations: ["Slack", "Zendesk-compatible", "Zapier", "Shopify", "Intercom-compatible", "WhatsApp"],
    security: ["SSO", "2FA", "SOC 2 Type II", "Data residency options"],
    vendors: [
      "Deskhaven", "Replywave", "Supportframe", "Helmsman Support", "Ticketflow", "Concierge Desk",
    ],
  },
  Analytics: {
    features: [
      "Custom dashboards", "Real-time reporting", "Cohort analysis", "Funnel tracking",
      "Data warehouse sync", "Alerts", "A/B testing", "Attribution modelling", "Export tooling",
    ],
    integrations: ["Slack", "Snowflake", "BigQuery", "Zapier", "Segment-compatible", "Looker-compatible"],
    security: ["SSO", "2FA", "SOC 2 Type II", "Data encryption at rest"],
    vendors: [
      "Metricforge", "Datavane", "Clearlens Analytics", "Pulsegrid", "Insightloop", "Northstar Metrics",
    ],
  },
  Cybersecurity: {
    features: [
      "Endpoint protection", "Threat detection", "Vulnerability scanning", "SIEM", "Access management",
      "Phishing simulation", "Compliance reporting", "Incident response", "Network monitoring",
    ],
    integrations: ["Slack", "Microsoft Teams", "Splunk-compatible", "Zapier", "PagerDuty"],
    security: ["SOC 2 Type II", "ISO 27001 aligned", "Zero-trust architecture", "2FA", "SSO"],
    vendors: [
      "Sentrywall", "Vigilnet", "Ironclad Security", "Threadbare Defence", "Cipherline", "Watchtower Sec",
    ],
  },
  Communication: {
    features: [
      "Team chat", "Video conferencing", "Screen sharing", "Voice calls", "Channels",
      "File sharing", "Integrations marketplace", "Threaded conversations", "Custom workflows",
    ],
    integrations: ["Google Calendar", "Zapier", "GitHub", "Salesforce", "Notion-compatible"],
    security: ["SSO", "2FA", "SOC 2 Type II", "E2E encryption option"],
    vendors: [
      "Chorusline", "Signalroom", "Huddlewire", "Talknest", "Relaycomm",
    ],
  },
  "Document Management": {
    features: [
      "Version control", "E-signature", "Secure sharing", "OCR search", "Custom permissions",
      "Audit trail", "Workflow automation", "Template library", "Retention policies",
    ],
    integrations: ["Google Drive", "Microsoft 365", "Slack", "Zapier", "DocuSign-compatible"],
    security: ["SSO", "2FA", "SOC 2 Type II", "Encrypted at rest", "Watermarking"],
    vendors: [
      "Archivio", "Vaultpage", "Clauseworks", "Filestream Docs", "Recordkeep",
    ],
  },
};

const SUPPORT_LEVELS = ["self_serve", "business_hours", "24_7", "dedicated_csm"];
const DEPLOYMENTS = ["cloud", "cloud", "cloud", "hybrid", "on_premise"];
const PRICING_MODELS = ["per_seat", "flat", "usage_based", "tiered"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "200+"];

// simple deterministic PRNG (mulberry32) so the catalogue is reproducible
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260907);
function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}
function pickOne(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function range(min, max) {
  return Math.round(min + rand() * (max - min));
}

let idCounter = 1;
const vendors = [];

for (const [category, def] of Object.entries(CATEGORIES)) {
  for (const name of def.vendors) {
    const id = `v${String(idCounter).padStart(3, "0")}`;
    idCounter++;
    const featureCount = range(6, def.features.length);
    const features = pick(def.features, featureCount);
    const integrationCount = range(3, Math.min(6, def.integrations.length));
    const integrations = pick(def.integrations, integrationCount);
    const securityCount = range(2, def.security.length);
    const securityFeatures = pick(def.security, securityCount);
    const implementationDays = range(3, 60);
    const rating = Math.round((3.4 + rand() * 1.5) * 10) / 10;
    const startingPrice = category === "Accounting" || category === "HR"
      ? range(15, 60)
      : category === "Cybersecurity"
      ? range(40, 220)
      : range(9, 150);

    vendors.push({
      id,
      name,
      category,
      description: `${name} is a ${category.toLowerCase()} platform built for growing teams that need ${features[0].toLowerCase()} and ${features[1] ? features[1].toLowerCase() : "reliable support"}.`,
      pricingModel: pickOne(PRICING_MODELS),
      startingPrice,
      currency: "GBP",
      rating,
      reviewCount: range(38, 2400),
      companySize: pickOne(COMPANY_SIZES),
      features,
      integrations,
      securityFeatures,
      implementationTime: implementationDays <= 7 ? "Under 1 week" : implementationDays <= 21 ? "1-3 weeks" : implementationDays <= 45 ? "3-6 weeks" : "6+ weeks",
      implementationDays,
      supportLevel: pickOne(SUPPORT_LEVELS),
      deploymentType: pickOne(DEPLOYMENTS),
      website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`,
      logo: name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
      isDemoData: true,
      createdAt: "2026-01-14T09:00:00.000Z",
      updatedAt: "2026-08-02T09:00:00.000Z",
    });
  }
}

const header = `// AUTO-GENERATED by scripts/gen-vendors.mjs — do not hand-edit.
// This is a synthetic, clearly-labelled demo vendor catalogue.
// No real vendor partnerships, pricing agreements or certifications are implied.
import { Vendor } from "@/types";

export const DEMO_VENDORS: Vendor[] = `;

writeFileSync(
  new URL("../src/lib/demo-data/vendors.ts", import.meta.url),
  header + JSON.stringify(vendors, null, 2) + ";\n"
);

console.log(`Generated ${vendors.length} vendors.`);

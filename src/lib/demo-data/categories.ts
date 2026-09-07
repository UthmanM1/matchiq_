import { VendorCategory } from "@/types";

export const CATEGORY_KEYWORDS: Record<VendorCategory, string[]> = {
  CRM: ["crm", "pipeline", "sales pipeline", "customer relationship", "lead management", "deal tracking"],
  "Project Management": ["project management", "task management", "kanban", "sprint", "gantt", "pm tool"],
  Accounting: ["accounting", "bookkeeping", "invoicing", "invoice", "payroll", "finance software", "financial reporting"],
  HR: ["hr", "human resources", "applicant tracking", "recruiting", "onboarding staff", "people ops"],
  "Marketing Automation": ["marketing automation", "email marketing", "campaign", "landing page", "lead generation"],
  "Customer Support": ["customer support", "helpdesk", "help desk", "ticketing", "live chat", "customer service"],
  Analytics: ["analytics", "dashboard", "reporting tool", "business intelligence", "bi tool", "data visualisation"],
  Cybersecurity: ["security software", "cybersecurity", "endpoint protection", "threat detection", "vulnerability"],
  Communication: ["team chat", "communication tool", "video conferencing", "internal comms", "messaging platform"],
  "Document Management": ["document management", "e-signature", "esignature", "file storage", "contract management"],
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_KEYWORDS) as VendorCategory[];

export const FEATURE_KEYWORDS = [
  "pipeline management", "email automation", "reporting", "slack integration", "onboarding",
  "automation", "automated workflows", "workflow automation", "invoicing", "expense tracking",
  "payroll", "time tracking", "kanban boards", "gantt charts", "applicant tracking",
  "performance reviews", "live chat", "ticketing", "knowledge base", "custom dashboards",
  "cohort analysis", "endpoint protection", "threat detection", "video conferencing",
  "e-signature", "document versioning", "lead scoring", "mobile app", "multi-currency",
  "benefits administration", "sla management", "real-time reporting", "vulnerability scanning",
  "screen sharing", "contract management",
];

export const PRIORITY_KEYWORDS = [
  "ease of adoption", "ease of use", "automation", "reporting", "integrations",
  "security", "cost", "scalability", "support", "implementation speed", "onboarding",
];

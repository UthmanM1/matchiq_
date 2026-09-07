import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MATCHIQ — AI-Powered Software Decision Intelligence",
    template: "%s · MATCHIQ",
  },
  description:
    "MATCHIQ turns a plain-English software requirement into a weighted, explainable vendor recommendation, built for B2B buying teams who need to defend their decision.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "MATCHIQ — AI-Powered Software Decision Intelligence",
    description:
      "Describe what you need. MATCHIQ scores structured vendor data against your weighted criteria and generates a defensible decision report.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col text-slate-900"
        style={{
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}

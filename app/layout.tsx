import type { Metadata } from "next";
import "./globals.css";
import SISCHeader from "@/components/SISCHeader";

export const metadata: Metadata = {
  title: "Land Optimizer — Plan Your Specialty Recreation Facility | Specialty Insurance SC",
  description: "AI-powered site layout tool for paintball, airsoft, archery, and family entertainment facilities. Generate an optimized field layout, parking plan, and cost estimate in minutes — free from Specialty Insurance SC.",
  keywords: "paintball field design, trampoline park layout, airsoft arena planning, facility design, land use optimization, specialty insurance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0a0a] text-[#e0e0e0]">
        <SISCHeader />
        {children}
      </body>
    </html>
  );
}

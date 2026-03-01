import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Land Use Optimizer - Design Your Specialty Recreation Facility",
  description: "AI-powered land use optimization for paintball fields, trampoline parks, airsoft arenas, and family entertainment centers. Design your facility in 5 minutes.",
  keywords: "paintball field design, trampoline park layout, airsoft arena planning, facility design, land use optimization, specialty insurance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { personal } from "@/data/personal";

export const metadata: Metadata = {
  title: `${personal.name} — ${personal.headlineTiny}`,
  description: `${personal.supportingStatement} Explore my engineering portfolio aboard an interactive aircraft, or use Recruiter Mode for quick access to projects, research, skills and experience.`,
  keywords: [
    "Harshil Jadawala",
    "mechanical engineering",
    "aerospace",
    "portfolio",
    "York University",
    "CAD",
    "prototyping",
  ],
  authors: [{ name: personal.name }],
  openGraph: {
    title: `${personal.name} — Interactive Aerospace Portfolio`,
    description: personal.supportingLine,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  width: "device-width",
  initialScale: 1,
  // lets the 3D scene and HUD extend into notch/home-indicator areas,
  // which the overlays pad back out with env(safe-area-inset-*)
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/* touch-manipulation removes the 300ms double-tap-zoom delay on HUD
          buttons without disabling pinch-zoom for accessibility */}
      <body className="min-h-screen touch-manipulation bg-graphite-950 text-alu-100 antialiased">
        {children}
      </body>
    </html>
  );
}

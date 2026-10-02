import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#f2f4f7",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: {
    default: "Fuhrparkverwaltung",
    template: "%s · Fuhrparkverwaltung",
  },
  description: "Fahrzeuge, Fahrer:innen und Termine an einem Ort",
  // Interne App: nicht in Suchmaschinen auftauchen.
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Fuhrpark",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

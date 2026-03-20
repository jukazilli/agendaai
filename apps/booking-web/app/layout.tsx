import type { Metadata } from "next";
import "@agendaai/ui/foundations.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgendaAI Booking",
  description: "Base fundacional do fluxo publico de agendamento."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

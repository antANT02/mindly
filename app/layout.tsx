import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindLy — Biblioteca e Workspace de Estudos",
  description:
    "Organização de disciplinas, tarefas individuais e grupos de estudo colaborativos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-[#070512] font-sans text-[#F4F1FA] antialiased selection:bg-[#7E49C7] selection:text-[#F4F1FA]">
        {children}
      </body>
    </html>
  );
}
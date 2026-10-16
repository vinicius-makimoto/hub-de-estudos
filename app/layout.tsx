import type { Metadata } from "next";
import { BackToTop } from "@/components/back-to-top";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hub de Estudos",
  description: "Seus cursos, matérias e progresso em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}<BackToTop /></body>
    </html>
  );
}

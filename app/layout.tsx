import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hub de Estudos",
  description: "Seus cursos, matérias e progresso em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

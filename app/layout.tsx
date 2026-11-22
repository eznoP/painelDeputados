import type { Metadata } from "next";

import "./globals.css";

// define os metadados da página
export const metadata: Metadata = {
  title: "Painel de Deputados",
  description: "Consulta de deputados federais, despesas e lista de acompanhados.",
};

// monta a estrutura base de todas as páginas
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

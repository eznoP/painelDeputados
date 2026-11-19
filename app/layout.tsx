import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Painel de Deputados Federais",
  description: "Consulta de deputados, despesas da cota parlamentar e lista de acompanhados.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}

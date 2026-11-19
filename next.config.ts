import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 e um modulo nativo: precisa rodar no servidor, sem bundling.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;

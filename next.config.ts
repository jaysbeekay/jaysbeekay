import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // ssh2 (used by the SFTP backup destination) ships a non-ESM asset that
  // Turbopack can't bundle into server chunks — load it natively instead.
  serverExternalPackages: ["ssh2", "ssh2-sftp-client"],
};

export default nextConfig;

import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Turbopack menebak akar proyek dari berkas lockfile terdekat dengan mencari
   * ke ATAS dari folder proyek. Di mesin pengembang di sini ada
   * `/Users/reno/package-lock.json`, sehingga tebakannya jatuh ke folder home —
   * dan setiap build mencetak peringatan bahwa lockfile itu diabaikan karena
   * berada di luar repositori.
   *
   * Menyetel `root` ke folder proyek sendiri membuat batasnya eksplisit:
   * peringatan hilang, dan Turbopack berhenti menonton berkas di luar proyek.
   */
  turbopack: {
    root: path.join(__dirname, "."),
  },
};

export default nextConfig;

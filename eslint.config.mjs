import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // `.kilo/worktrees/*` berisi SALINAN UTUH repo ini. Tanpa baris ini ESLint
    // ikut memeriksa salinan itu, sehingga kode yang sudah diperbaiki di
    // sumbernya tetap dilaporkan bermasalah dari berkas kembarannya yang
    // tertinggal — peringatan yang tidak bisa diperbaiki dari sini dan
    // menyamarkan peringatan asli.
    ".kilo/**",
  ]),
]);

export default eslintConfig;

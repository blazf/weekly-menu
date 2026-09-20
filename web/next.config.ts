import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native module — keep it out of the server bundle.
  serverExternalPackages: ["better-sqlite3"],
  // The repo root holds recipes/ and web/; pin the root so Turbopack doesn't
  // guess from a parent lockfile.
  turbopack: { root: path.resolve(process.cwd()) },
  // NOTE: recipes/*.md are read from disk at runtime (see src/lib/recipes.ts),
  // deliberately not bundled — that's what lets an agent add a recipe by
  // dropping a file in, with no rebuild.
};

export default nextConfig;

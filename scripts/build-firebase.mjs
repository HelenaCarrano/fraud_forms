import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, BUILD_TARGET: "firebase" },
});
process.exit(result.status ?? 1);

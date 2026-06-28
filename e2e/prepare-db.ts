import { execSync } from "child_process";
import fs from "fs";
import { DATA_DIR, UPLOADS_DIR, DATABASE_URL } from "./env";

// Runs before every e2e suite invocation, outside of Playwright's own
// lifecycle, so there's no ambiguity about ordering relative to webServer:
// the DB is fully migrated before `playwright test` ever spawns the app.
fs.rmSync(DATA_DIR, { recursive: true, force: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL },
});

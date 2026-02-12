import fetch from "node-fetch";
import fs from "fs";
import { execSync } from "child_process";

const URL = process.env.URL || "https://housemanship.mdcn.gov.ng/main/dashboard";
const FILE = "status.json";

// --- helper to fetch site and measure latency ---
async function checkSite() {
  const startTime = Date.now();

  let status = "DOWN";
  let code = 0;
  let latency = 0;

  try {
    const res = await fetch(URL, { timeout: 15000 });
    latency = Date.now() - startTime;
    code = res.status;
    if (res.ok) status = "UP";
  } catch (err) {
    latency = Date.now() - startTime;
    console.error("Fetch failed:", err.message);
  }

  const checkedAt = new Date().toISOString();
  console.log(`Checked: ${status} | code=${code} | latency=${latency}ms | time=${checkedAt}`);

  // --- Load existing history or create empty array ---
  let history = [];
  if (fs.existsSync(FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(FILE, "utf-8"));
    } catch {
      console.warn("status.json corrupted, creating new one");
      history = [];
    }
  }

  // --- Add new record ---
  history.push({ checkedAt, status, code, latency });

  // Keep last 100 records
  if (history.length > 100) history = history.slice(history.length - 100);

  fs.writeFileSync(FILE, JSON.stringify(history, null, 2));
  console.log("status.json written successfully.");

  // --- Open GitHub Issue if site is DOWN ---
  if (status === "DOWN") {
    try {
      const title = "🚨 MDCN Dashboard is DOWN";
      const body = `The site ${URL} is unreachable.\nTime: ${checkedAt}\nStatus code: ${code}\nLatency: ${latency}ms`;
      execSync(`gh issue create --title "${title}" --body "${body}"`, { stdio: "inherit" });
      console.log("GitHub Issue created for downtime.");
    } catch (err) {
      console.error("Failed to create GitHub Issue:", err.message);
    }
  }

  // --- Commit JSON back to repo ---
  try {
    execSync("git config user.name 'github-actions'");
    execSync("git config user.email 'github-actions@github.com'");
    execSync(`git add ${FILE}`);
    execSync(`git commit -m "Update status.json" || echo "No changes to commit"`);
    execSync("git push origin HEAD");
    console.log("status.json committed and pushed to repo.");
  } catch (err) {
    console.error("Failed to commit status.json:", err.message);
  }
}

// --- Run ---
checkSite();

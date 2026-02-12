import fetch from "node-fetch";
import sqlite3 from "sqlite3";
import { execSync } from "child_process";

const URL = "https://housemanship.mdcn.gov.ng/main/dashboard";
const DB_FILE = "status.db";

const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT,
      code INTEGER,
      checked_at TEXT
    )
  `);
});

async function checkSite() {
  let status = "DOWN";
  let code = 0;

  try {
    const res = await fetch(URL, { timeout: 15000 });
    code = res.status;
    if (res.ok) status = "UP";
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }

  const time = new Date().toISOString();

  db.run(
    "INSERT INTO checks (status, code, checked_at) VALUES (?, ?, ?)",
    [status, code, time]
  );

  console.log(`Checked: ${status} (${code}) at ${time}`);

  if (status === "DOWN") {
    createGitHubIssue(time, code);
  }
}

function createGitHubIssue(time, code) {
  const title = "🚨 MDCN Dashboard is DOWN";
  const body = `The site ${URL} was unreachable.\n\nTime: ${time}\nStatus code: ${code}`;

  execSync(`gh issue create --title "${title}" --body "${body}"`, {
    stdio: "inherit",
  });
}

checkSite();

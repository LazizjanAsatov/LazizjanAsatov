// Fetches the last year's contribution calendar from GitHub and writes tools/activity.json.
// The numbers are the same ones a visitor sees on the profile's contribution graph.
//   GITHUB_TOKEN=... node tools/activity.mjs [login]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const login = process.argv[2] || process.env.GITHUB_REPOSITORY_OWNER || 'LazizjanAsatov';
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) { console.error('Set GITHUB_TOKEN (any token that can read public data).'); process.exit(1); }

const query = 'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}';
const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-activity' },
  body: JSON.stringify({ query, variables: { login } }),
});
const json = await res.json().catch(() => ({}));
const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
if (!res.ok || json.errors || !cal) {
  // Leave the existing activity.json untouched so a failed run never blanks the profile.
  console.error('GitHub API error', res.status, JSON.stringify(json.errors || json).slice(0, 300));
  process.exit(1);
}

const days = cal.weeks.flatMap((w) => w.contributionDays);
const active = days.filter((d) => d.contributionCount > 0);
const data = {
  total: cal.totalContributions,
  activeDays: active.length,
  lastActive: active.length ? active[active.length - 1].date : null,
  weeks: cal.weeks.map((w) => w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0)),
};
fs.writeFileSync(path.join(HERE, 'activity.json'), JSON.stringify(data) + '\n');
console.log(`${login}: ${data.total} contributions on ${data.activeDays} days, most recent ${data.lastActive}`);

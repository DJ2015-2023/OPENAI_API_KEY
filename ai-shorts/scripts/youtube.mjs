#!/usr/bin/env node
// YouTube Data API helpers. Credentials come from environment secrets only:
//   YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN   (see SETUP.md)
//   YT_PRIVACY = private | unlisted | public           (default: private)
//
//   node scripts/youtube.mjs check                      verify credentials, print the channel name
//   node scripts/youtube.mjs recent                     titles of the last 30 uploads (to avoid repeats)
//   node scripts/youtube.mjs upload episodes/<id> --approved
//   node scripts/youtube.mjs stats                      how the last 15 uploads performed (feeds the next picks)
//   node scripts/youtube.mjs engage                     post each public Short's question as the first comment
//
// Upload refuses to run without --approved (the human said "publish") and
// refuses to upload the same episode twice.
import { appendFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [cmd, target] = process.argv.slice(2);
const API = 'https://www.googleapis.com/youtube/v3';

function need(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing environment secret ${name}. See ai-shorts/SETUP.md.`);
    process.exit(2);
  }
  return v;
}

async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: need('YT_CLIENT_ID'),
      client_secret: need('YT_CLIENT_SECRET'),
      refresh_token: need('YT_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`token refresh failed (${res.status}): ${j.error} ${j.error_description ?? ''}`);
  return j.access_token;
}

async function api(token, path, init = {}) {
  const res = await fetch(path.startsWith('http') ? path : `${API}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path.split('?')[0]} → ${res.status}: ${await res.text()}`);
  return res;
}

async function channel(token) {
  const j = await (await api(token, 'channels?part=snippet,contentDetails&mine=true')).json();
  if (!j.items?.length) throw new Error('no YouTube channel on this Google account');
  return j.items[0];
}

async function check() {
  const token = await accessToken();
  const ch = await channel(token);
  console.log(`OK: connected to channel "${ch.snippet.title}" (${ch.id}). Uploads will be ${process.env.YT_PRIVACY ?? 'private'}.`);
}

async function recent() {
  const token = await accessToken();
  const ch = await channel(token);
  const pl = ch.contentDetails.relatedPlaylists.uploads;
  const j = await (await api(token, `playlistItems?part=snippet&maxResults=30&playlistId=${pl}`)).json();
  const items = (j.items ?? []).map((it) => ({ publishedAt: it.snippet.publishedAt, title: it.snippet.title, description: it.snippet.description }));
  if (process.argv.includes('--json')) return console.log(JSON.stringify(items));
  for (const it of items) {
    const style = /Style ID: (\S+)/.exec(it.description ?? '')?.[1];
    console.log(`${it.publishedAt.slice(0, 10)}  ${it.title}${style ? `   [${style}]` : ''}`);
  }
}

async function upload(dir) {
  if (!process.argv.includes('--approved')) {
    console.error('Refusing to upload: pass --approved only after the channel owner approved this video.');
    process.exit(3);
  }
  const ep = resolve(dir);
  const build = join(ep, 'build');
  const video = join(build, 'video.mp4');
  const meta = JSON.parse(readFileSync(join(build, 'youtube.json'), 'utf8'));
  const done = join(build, 'upload.json');
  if (existsSync(done)) {
    console.error(`Already uploaded: ${JSON.parse(readFileSync(done, 'utf8')).url}`);
    process.exit(4);
  }
  const privacy = process.env.YT_PRIVACY ?? 'private';
  const token = await accessToken();
  const size = statSync(video).size;

  const init = await api(token, 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) },
    body: JSON.stringify({
      snippet: { title: meta.title, description: meta.description, tags: meta.tags, categoryId: '28', defaultLanguage: 'en', defaultAudioLanguage: 'en' },
      status: { privacyStatus: privacy, selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
    }),
  });
  const location = init.headers.get('location');
  console.log(`uploading ${(size / 1e6).toFixed(1)} MB…`);
  const res = await api(token, location, { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(size) }, body: readFileSync(video) });
  const v = await res.json();
  const out = { videoId: v.id, url: `https://youtube.com/shorts/${v.id}`, privacy: v.status?.privacyStatus ?? privacy, uploadedAt: new Date().toISOString(), title: meta.title };
  writeFileSync(done, JSON.stringify(out, null, 1));
  appendFileSync(join(ROOT, 'published.jsonl'), JSON.stringify({ id: JSON.parse(readFileSync(join(ep, 'episode.json'), 'utf8')).id, ...out }) + '\n');
  console.log(`Uploaded (${out.privacy}): ${out.url}`);
}

async function uploads(token, n) {
  const ch = await channel(token);
  const pl = ch.contentDetails.relatedPlaylists.uploads;
  const j = await (await api(token, `playlistItems?part=snippet,status&maxResults=${n}&playlistId=${pl}`)).json();
  return { ch, items: j.items ?? [] };
}

async function stats() {
  const token = await accessToken();
  const { items } = await uploads(token, 15);
  if (!items.length) return console.log('No uploads yet.');
  const ids = items.map((it) => it.snippet.resourceId.videoId);
  const v = await (await api(token, `videos?part=statistics,status,contentDetails&id=${ids.join(',')}`)).json();
  const byId = Object.fromEntries((v.items ?? []).map((x) => [x.id, x]));
  // Retention needs the YouTube Analytics API (yt-analytics.readonly scope); optional.
  let retention = {};
  try {
    const today = new Date().toISOString().slice(0, 10);
    const r = await (await api(token, `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2020-01-01&endDate=${today}&metrics=views,averageViewDuration,averageViewPercentage,subscribersGained&dimensions=video&filters=video==${ids.join(',')}&maxResults=50&sort=-views`)).json();
    for (const row of r.rows ?? []) retention[row[0]] = { avgSec: row[2], avgPct: row[3], subs: row[4] };
  } catch (e) {
    console.log('(no retention data: enable YouTube Analytics API and the yt-analytics.readonly scope; see SETUP.md)');
  }
  console.log('date        status    views  likes  comm  avg%   subs  title');
  for (const it of items) {
    const id = it.snippet.resourceId.videoId;
    const x = byId[id];
    const st = x?.statistics ?? {};
    const r = retention[id];
    const pct = r ? `${Math.round(r.avgPct)}%` : '-';
    console.log(
      `${it.snippet.publishedAt.slice(0, 10)}  ${(x?.status?.privacyStatus ?? '?').padEnd(8)} ${String(st.viewCount ?? 0).padStart(6)} ${String(st.likeCount ?? 0).padStart(6)} ${String(st.commentCount ?? 0).padStart(5)}  ${pct.padStart(4)}  ${String(r?.subs ?? '-').padStart(5)}  ${it.snippet.title}`,
    );
  }
}

async function engage() {
  const token = await accessToken();
  const { ch, items } = await uploads(token, 15);
  for (const it of items) {
    const id = it.snippet.resourceId.videoId;
    if (it.status?.privacyStatus !== 'public') continue; // private videos can't take comments
    const q = /^Question: (.+)$/m.exec(it.snippet.description ?? '')?.[1];
    if (!q) continue;
    const threads = await (await api(token, `commentThreads?part=snippet&videoId=${id}&maxResults=50`)).json();
    if ((threads.items ?? []).some((c) => c.snippet.topLevelComment.snippet.authorChannelId?.value === ch.id)) continue;
    try {
      await api(token, 'commentThreads?part=snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippet: { videoId: id, topLevelComment: { snippet: { textOriginal: q } } } }),
      });
      console.log(`commented on ${it.snippet.title}: ${q}`);
    } catch (e) {
      console.log(`could not comment on ${it.snippet.title} (needs the youtube.force-ssl scope; see SETUP.md): ${e.message.slice(0, 120)}`);
      return;
    }
  }
}

const cmds = { check, recent, stats, engage, upload: () => upload(target) };
if (!cmds[cmd]) {
  console.error('usage: node scripts/youtube.mjs check | recent | stats | engage | upload episodes/<id> --approved');
  process.exit(1);
}
cmds[cmd]().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

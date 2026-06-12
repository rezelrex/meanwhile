import { put, list } from "@vercel/blob";

const STATE_PATH = "state/meanwhile.json";
const EMPTY = { posts: [], stamps: [] };

async function readState() {
  try {
    const { blobs } = await list({ prefix: STATE_PATH, token: process.env.BLOB_READ_WRITE_TOKEN });
    if (!blobs || blobs.length === 0) return { ...EMPTY };
    const res = await fetch(blobs[0].url + "?t=" + Date.now());
    if (!res.ok) return { ...EMPTY };
    const data = await res.json();
    return { posts: data.posts || [], stamps: data.stamps || [] };
  } catch {
    return { ...EMPTY };
  }
}

async function writeState(state) {
  await put(STATE_PATH, JSON.stringify(state), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

function apply(s, type, p) {
  s.posts = s.posts || [];
  s.stamps = s.stamps || [];
  const findPost = (id) => s.posts.find((x) => x.id === id);

  if (type === "addPost") s.posts.unshift(p);
  else if (type === "delPost") s.posts = s.posts.filter((x) => x.id !== p.id);
  else if (type === "heart") {
    const post = findPost(p.id);
    if (post) {
      post.hearts = post.hearts || [];
      const i = post.hearts.indexOf(p.name);
      if (i >= 0) post.hearts.splice(i, 1);
      else post.hearts.push(p.name);
    }
  } else if (type === "addComment") {
    const post = findPost(p.id);
    if (post) { post.comments = post.comments || []; post.comments.push(p.comment); }
  } else if (type === "delComment") {
    const post = findPost(p.id);
    if (post) post.comments = (post.comments || []).filter((c) => c.id !== p.cid);
  } else if (type === "addStamp") s.stamps.push(p);
  else if (type === "delStamp") s.stamps = s.stamps.filter((x) => x.id !== p.id);

  if (s.posts.length > 500) s.posts = s.posts.slice(0, 500);
  if (s.stamps.length > 300) s.stamps = s.stamps.slice(-300);
  s.posts.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return s;
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-room");

  if (req.method === "OPTIONS") return res.status(200).end();

  const required = process.env.ROOM_PASSPHRASE;
  if (required && req.headers["x-room"] !== required) {
    return res.status(401).json({ error: "passphrase required" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "Blob storage not configured. Connect a Vercel Blob store in your project dashboard." });
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json(await readState());
    }
    if (req.method === "POST") {
      const body = await parseBody(req);
      const { type, payload } = body;
      if (!type) return res.status(400).json({ error: "missing type" });
      const state = await readState();
      apply(state, type, payload);
      await writeState(state);
      return res.status(200).json(state);
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error("state error:", e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

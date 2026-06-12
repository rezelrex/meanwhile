const { put, list } = require("@vercel/blob");

const STATE_PATH = "state/meanwhile.json";
const EMPTY = { posts: [], stamps: [] };

module.exports.config = { api: { bodyParser: false } };

function getToken() { return process.env.BLOB_READ_WRITE_TOKEN; }

async function readState() {
  const token = getToken();
  if (!token) return { ...EMPTY };
  try {
    const { blobs } = await list({ prefix: STATE_PATH, token });
    if (!blobs || blobs.length === 0) return { ...EMPTY };
    const res = await fetch(blobs[0].url + "?t=" + Date.now());
    if (!res.ok) return { ...EMPTY };
    const data = await res.json();
    return {
      posts: Array.isArray(data.posts) ? data.posts : [],
      stamps: Array.isArray(data.stamps) ? data.stamps : [],
    };
  } catch (e) {
    console.error("readState:", e && e.message);
    return { ...EMPTY };
  }
}

async function writeState(state) {
  const token = getToken();
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN not set.");
  await put(STATE_PATH, JSON.stringify(state), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

function apply(s, type, p) {
  s.posts = s.posts || [];
  s.stamps = s.stamps || [];
  const findPost = (id) => s.posts.find((x) => x.id === id);

  if (type === "addPost") {
    if (!s.posts.find((x) => x.id === p.id)) s.posts.unshift(p);
  } else if (type === "delPost") {
    s.posts = s.posts.filter((x) => x.id !== p.id);
  } else if (type === "heart") {
    const post = findPost(p.id);
    if (post) {
      post.hearts = post.hearts || [];
      const i = post.hearts.indexOf(p.name);
      if (i >= 0) post.hearts.splice(i, 1);
      else post.hearts.push(p.name);
    }
  } else if (type === "addComment") {
    const post = findPost(p.id);
    if (post) {
      post.comments = post.comments || [];
      if (!post.comments.find((c) => c.id === p.comment.id))
        post.comments.push(p.comment);
    }
  } else if (type === "delComment") {
    const post = findPost(p.id);
    if (post) post.comments = (post.comments || []).filter((c) => c.id !== p.cid);
  } else if (type === "addStamp") {
    if (!s.stamps.find((x) => x.id === p.id)) s.stamps.push(p);
  } else if (type === "delStamp") {
    s.stamps = s.stamps.filter((x) => x.id !== p.id);
  }

  if (s.posts.length > 500) s.posts = s.posts.slice(0, 500);
  if (s.stamps.length > 300) s.stamps = s.stamps.slice(-300);
  s.posts.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return s;
}

async function readBody(req) {
  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on("data", (c) => chunks.push(c));
    req.on("end", resolve);
    req.on("error", reject);
  });
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-room");
  if (req.method === "OPTIONS") return res.status(200).end();

  const required = process.env.ROOM_PASSPHRASE;
  if (required && req.headers["x-room"] !== required)
    return res.status(401).json({ error: "passphrase required" });

  try {
    if (req.method === "GET") {
      return res.status(200).json(await readState());
    }
    if (req.method === "POST") {
      const { type, payload } = await readBody(req);
      if (!type) return res.status(400).json({ error: "missing type" });
      const state = await readState();
      apply(state, type, payload);
      await writeState(state);
      // Return only a success flag — frontend uses its own local state
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    console.error("state error:", e && e.message);
    return res.status(500).json({ error: (e && e.message) || String(e) });
  }
};

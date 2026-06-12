import { put } from "@vercel/blob";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-filename, x-room");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const required = process.env.ROOM_PASSPHRASE;
  if (required && req.headers["x-room"] !== required) {
    return res.status(401).json({ error: "passphrase required" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "Blob storage not configured. Connect a Vercel Blob store in your project dashboard." });
  }

  try {
    const filename = (req.headers["x-filename"] || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const contentType = req.headers["content-type"]?.split(";")[0]?.trim() || "application/octet-stream";

    // Collect the raw body chunks
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return res.status(400).json({ error: "Empty file received" });
    }

    const blob = await put(`media/${filename}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error("upload error:", e);
    return res.status(500).json({ error: e?.message || String(e) });
  }
}

import { put } from "@vercel/blob";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method not allowed" });
  }

  const required = process.env.ROOM_PASSPHRASE;
  if (required && req.headers["x-room"] !== required) {
    return res.status(401).json({ error: "passphrase required" });
  }

  try {
    const filename = req.headers["x-filename"] || `upload-${Date.now()}`;
    const contentType = req.headers["content-type"] || "application/octet-stream";

    // Stream the raw body directly to Blob
    const blob = await put(`media/${filename}`, req, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });

    return res.status(200).json({ url: blob.url });
  } catch (e) {
    console.error("upload error", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}

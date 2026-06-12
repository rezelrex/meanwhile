import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Plus, Heart, X, MapPin, Trash2, Camera, Loader2, Moon, Send, Sticker, Check, Lock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ *
 * Meanwhile — a soft little window for two.
 * Photos & clips, notes, your own mascot you can stick anywhere, and a
 * cat that swoons when you leave a heart. Saved to a shared backend, so
 * it persists forever and syncs between both of you.
 * ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Caveat:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap');

.mw-root{
  --bg:#F3E1DC; --ink:#3E2A33; --muted:#9A7C84; --line:rgba(62,42,51,.12);
  --rose:#C76B82; --rose-deep:#a8536b; --amber:#E7A766; --sage:#8DA06A;
  --lilac:#9E8FB0; --peach:#D79A6A; --card:#FFF8F4; --pink:#E58AA0;
  font-family:'Nunito',system-ui,sans-serif; color:var(--ink); min-height:100vh; width:100%; overflow-x:hidden;
  background:
    radial-gradient(520px 440px at 88% 12%, rgba(199,107,130,.26), transparent 70%),
    radial-gradient(480px 460px at 5% 26%, rgba(231,167,102,.24), transparent 70%),
    radial-gradient(600px 520px at 94% 64%, rgba(158,143,176,.24), transparent 72%),
    radial-gradient(540px 500px at 4% 82%, rgba(141,160,106,.22), transparent 72%),
    radial-gradient(420px 360px at 60% 100%, rgba(229,138,160,.2), transparent 72%),
    radial-gradient(900px 360px at 50% -120px, rgba(231,167,102,.3), transparent 70%),
    linear-gradient(180deg, #EAD0CF 0%, var(--bg) 26%, #F3E6DC 100%);
}
.mw-root *{ box-sizing:border-box; }

.mw-head{ position:sticky; top:0; z-index:50; backdrop-filter:blur(8px);
  background:linear-gradient(180deg, rgba(243,225,220,.95), rgba(243,225,220,.78)); }
.mw-head-in{ max-width:600px; margin:0 auto; padding:16px 22px 14px; display:flex; align-items:center; gap:12px; }
.mw-mark{ width:42px; height:42px; border-radius:50%; display:grid; place-items:center; flex:none; color:#fff;
  background:radial-gradient(circle at 35% 30%, #f6c98e, var(--amber) 70%); box-shadow:0 0 16px rgba(231,167,102,.6); }
.mw-word{ margin-right:auto; min-width:0; }
.mw-word b{ font-family:'Cormorant Garamond',serif; font-weight:600; font-size:30px; line-height:.95; letter-spacing:.5px; display:block; }
.mw-word small{ font-family:'Caveat',cursive; font-weight:600; font-size:16px; color:var(--muted); display:block; margin-top:1px;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mw-btn{ font-family:'Nunito'; font-weight:800; font-size:13.5px; cursor:pointer; border:none;
  display:inline-flex; align-items:center; gap:7px; padding:10px 16px; border-radius:999px; white-space:nowrap;
  background:var(--rose); color:#fff; box-shadow:0 3px 0 var(--rose-deep), 0 8px 18px rgba(199,107,130,.3);
  transition:transform .12s, box-shadow .12s; }
.mw-btn:hover{ transform:translateY(-1px); box-shadow:0 4px 0 var(--rose-deep), 0 11px 22px rgba(199,107,130,.34); }
.mw-btn:active{ transform:translateY(2px); box-shadow:0 1px 0 var(--rose-deep); }
.mw-btn:focus-visible{ outline:3px solid var(--lilac); outline-offset:3px; }
.mw-btn:disabled{ opacity:.5; cursor:default; transform:none; box-shadow:0 3px 0 var(--rose-deep); }
.mw-lights{ height:7px; background:repeating-linear-gradient(90deg,
  transparent 0 26px, var(--amber) 26px 30px, transparent 30px 56px);
  filter:drop-shadow(0 0 4px rgba(231,167,102,.8)); opacity:.8; }

.mw-subbar{ max-width:600px; margin:0 auto; padding:12px 22px 0; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.mw-me{ font-family:'Caveat',cursive; font-weight:700; font-size:18px; display:inline-flex; align-items:center; gap:7px;
  background:var(--card); border:1px solid var(--line); padding:3px 12px 3px 5px; border-radius:999px; box-shadow:0 1px 3px rgba(0,0,0,.05); }
.mw-me svg{ display:block; }
.mw-link{ background:none; border:none; cursor:pointer; color:var(--rose); font-weight:700; font-size:12.5px; text-decoration:underline; padding:4px; }
.mw-stickbtn{ margin-left:auto; font-family:'Nunito'; font-weight:800; font-size:12.5px; cursor:pointer;
  display:inline-flex; align-items:center; gap:6px; padding:7px 13px; border-radius:999px; border:1.5px solid var(--rose); color:var(--rose); background:transparent; }
.mw-stickbtn:hover{ background:rgba(199,107,130,.08); }
.mw-stickbtn[data-on="1"]{ background:var(--rose); color:#fff; border-color:var(--rose); }
.mw-link:focus-visible, .mw-stickbtn:focus-visible{ outline:2px solid var(--lilac); outline-offset:2px; }

.mw-feed{ position:relative; z-index:1; max-width:600px; margin:0 auto; padding:26px 18px 90px; display:flex; flex-direction:column; gap:30px; }
.mw-card{ position:relative; background:var(--card); border-radius:20px; overflow:hidden;
  box-shadow:0 14px 34px rgba(110,70,70,.16); border:1px solid rgba(255,255,255,.6);
  animation:mw-rise .55s cubic-bezier(.2,.8,.25,1) backwards; }
@keyframes mw-rise{ from{ opacity:0; transform:translateY(18px); } }
.mw-photo{ position:relative; line-height:0; background:#d9c3bd; }
.mw-photo img, .mw-photo video{ display:block; width:100%; height:auto; max-height:600px; object-fit:cover; }
.mw-photo video{ background:#000; }
.mw-photo::after{ content:""; position:absolute; inset:0; pointer-events:none; mix-blend-mode:multiply;
  background:radial-gradient(125% 100% at 50% 38%, transparent 52%, rgba(62,42,51,.26)); }
.mw-photo::before{ content:""; position:absolute; inset:0; pointer-events:none; opacity:.06; mix-blend-mode:overlay;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.mw-body{ padding:16px 18px 6px; }
.mw-cap{ font-family:'Caveat',cursive; font-weight:600; font-size:23px; line-height:1.2; color:var(--ink); margin:0 0 8px; }
.mw-row{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.mw-sign{ font-family:'Caveat',cursive; font-weight:700; font-size:19px; display:inline-flex; align-items:center; gap:7px; }
.mw-dot{ width:11px; height:11px; border-radius:50%; display:inline-block; flex:none; }
.mw-where{ display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--muted); }
.mw-when{ font-size:11.5px; font-weight:700; color:var(--muted); }
.mw-heart{ margin-left:auto; cursor:pointer; border:none; background:none; padding:6px 8px; border-radius:9px;
  display:inline-flex; align-items:center; gap:5px; color:var(--muted); font-weight:800; font-size:13px; }
.mw-heart[data-on="1"]{ color:var(--rose); }
.mw-heart:hover{ background:rgba(199,107,130,.08); }
.mw-heart:focus-visible, .mw-cdel:focus-visible, .mw-trash:focus-visible, .mw-csend:focus-visible{ outline:2px solid var(--lilac); outline-offset:2px; }
.mw-trash{ cursor:pointer; border:none; background:none; color:#c4adb1; padding:6px 8px; border-radius:9px; }
.mw-trash:hover{ color:var(--rose); background:rgba(199,107,130,.08); }

.mw-react{ position:absolute; left:50%; top:44%; transform:translate(-50%,-50%); z-index:6; pointer-events:none; }
.mw-rc{ animation:mw-pop .42s cubic-bezier(.2,1.5,.4,1), mw-rfade .4s ease 1.25s forwards; filter:drop-shadow(0 4px 8px rgba(0,0,0,.2)); }
@keyframes mw-pop{ from{ transform:scale(0) rotate(-14deg); } to{ transform:scale(1) rotate(0); } }
@keyframes mw-rfade{ to{ opacity:0; transform:scale(.82); } }
.mw-rh{ position:absolute; font-size:15px; color:var(--pink); animation:mw-up 1.5s ease-out forwards; }
@keyframes mw-up{ 0%{ opacity:0; transform:translateY(8px) scale(.6); } 25%{ opacity:1; } 100%{ opacity:0; transform:translateY(-40px) scale(1.1); } }

.mw-notes{ border-top:1px dashed var(--line); margin-top:12px; padding:12px 0 16px; }
.mw-note{ display:flex; gap:8px; align-items:baseline; padding:4px 0; }
.mw-cn{ font-family:'Caveat',cursive; font-weight:700; font-size:17px; flex:none; }
.mw-ct{ font-size:14px; line-height:1.4; color:#5a4750; word-break:break-word; }
.mw-cw{ margin-left:auto; font-size:10.5px; color:var(--muted); flex:none; padding-left:6px; }
.mw-cdel{ border:none; background:none; cursor:pointer; color:#c9b3b8; padding:0 2px; line-height:1; flex:none; }
.mw-cdel:hover{ color:var(--rose); }
.mw-cbox{ display:flex; align-items:center; gap:8px; margin-top:8px; }
.mw-cinput{ flex:1; min-width:0; font-family:'Nunito'; font-size:14px; color:var(--ink); background:#fff;
  border:1.5px solid var(--line); border-radius:999px; padding:9px 15px; }
.mw-cinput:focus{ outline:none; border-color:var(--rose); box-shadow:0 0 0 3px rgba(199,107,130,.16); }
.mw-csend{ flex:none; width:40px; height:40px; border-radius:50%; border:none; cursor:pointer; display:grid; place-items:center;
  background:var(--rose); color:#fff; box-shadow:0 2px 8px rgba(199,107,130,.35); }
.mw-csend:disabled{ opacity:.4; cursor:default; }

.mw-empty{ position:relative; z-index:1; max-width:430px; margin:60px auto; text-align:center; padding:42px 30px; background:var(--card);
  border-radius:20px; box-shadow:0 12px 30px rgba(110,70,70,.14); }
.mw-empty h2{ font-family:'Cormorant Garamond',serif; font-weight:600; font-size:27px; margin:14px 0 6px; }
.mw-empty p{ color:var(--muted); margin:0 0 20px; }
.mw-load{ position:relative; z-index:1; display:flex; gap:10px; align-items:center; justify-content:center; color:var(--muted);
  font-family:'Caveat',cursive; font-size:21px; font-weight:700; padding:90px 0; }
.mw-spin{ animation:mw-rot 1s linear infinite; } @keyframes mw-rot{ to{ transform:rotate(360deg); } }

.mw-decor{ position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.mw-stk{ position:absolute; transform-origin:center; transform:rotate(var(--r,0deg)) scale(var(--sc,1)); }
.mw-stk-i{ display:block; animation:mw-float var(--d,7s) ease-in-out infinite; }
@keyframes mw-float{ 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-9px); } }
.mw-pn{ display:inline-block; font-size:15px; font-weight:600; line-height:1.1;
  background:rgba(255,253,248,.92); padding:5px 11px; border-radius:3px;
  box-shadow:0 2px 7px rgba(80,50,55,.12); white-space:nowrap; }

.mw-stamps{ position:fixed; inset:0; z-index:40; pointer-events:none; }
.mw-stamps[data-edit="1"]{ z-index:42; }
.mw-stamp{ position:absolute; transform:translate(-50%,-50%) scale(var(--ssc,1)); filter:drop-shadow(0 3px 6px rgba(80,50,55,.25)); }
.mw-stamp-x{ position:absolute; top:-8px; right:-8px; width:22px; height:22px; border-radius:50%; border:none; cursor:pointer;
  background:var(--rose); color:#fff; display:grid; place-items:center; pointer-events:auto; box-shadow:0 2px 5px rgba(0,0,0,.3); }
.mw-capture{ position:fixed; inset:0; z-index:41; cursor:crosshair; }
.mw-pastebar{ position:fixed; left:50%; bottom:18px; transform:translateX(-50%); z-index:60; pointer-events:auto;
  display:flex; align-items:center; gap:12px; max-width:calc(100vw - 24px);
  background:var(--ink); color:#fff; padding:10px 12px 10px 18px; border-radius:999px; box-shadow:0 10px 30px rgba(0,0,0,.35);
  font-weight:700; font-size:13.5px; }
.mw-pastebar b{ font-family:'Caveat',cursive; font-weight:700; font-size:18px; }
.mw-pastedone{ border:none; cursor:pointer; background:#fff; color:var(--ink); font-family:'Nunito'; font-weight:800; font-size:13px;
  padding:7px 14px; border-radius:999px; }

.mw-overlay{ position:fixed; inset:0; z-index:100; display:grid; place-items:center; padding:18px;
  background:rgba(50,30,38,.5); backdrop-filter:blur(3px); animation:mw-fade .2s ease; }
@keyframes mw-fade{ from{ opacity:0; } }
.mw-modal{ width:100%; max-width:440px; max-height:90vh; overflow:auto; background:var(--card); padding:26px; border-radius:22px;
  box-shadow:0 24px 60px rgba(40,20,28,.4); position:relative; animation:mw-pop2 .25s cubic-bezier(.2,.9,.3,1); }
@keyframes mw-pop2{ from{ opacity:0; transform:translateY(12px) scale(.97); } }
.mw-modal h2{ font-family:'Cormorant Garamond',serif; font-weight:600; font-size:27px; margin:0 0 2px; }
.mw-kicker{ font-family:'Caveat',cursive; font-weight:700; font-size:18px; color:var(--rose); margin-bottom:10px; }
.mw-x{ position:absolute; top:14px; right:14px; border:none; background:none; cursor:pointer; color:var(--muted); padding:6px; border-radius:9px; }
.mw-x:hover{ background:rgba(0,0,0,.06); color:var(--ink); }
.mw-label{ display:block; font-weight:800; font-size:12px; letter-spacing:.3px; text-transform:uppercase; color:var(--muted); margin:16px 0 8px; }
.mw-input, .mw-textarea{ width:100%; font-family:'Nunito'; font-size:15px; color:var(--ink); background:#fff;
  border:1.5px solid var(--line); border-radius:12px; padding:11px 13px; }
.mw-input:focus, .mw-textarea:focus{ outline:none; border-color:var(--rose); box-shadow:0 0 0 3px rgba(199,107,130,.16); }
.mw-textarea{ resize:vertical; min-height:60px; }
.mw-drop{ border:2.5px dashed var(--line); border-radius:14px; padding:24px; text-align:center; cursor:pointer;
  color:var(--muted); transition:.15s; background:rgba(255,255,255,.5); }
.mw-drop:hover{ border-color:var(--rose); color:var(--rose); background:rgba(199,107,130,.05); }
.mw-drop[data-has="1"]{ padding:0; border-style:solid; overflow:hidden; }
.mw-drop img, .mw-drop video{ display:block; width:100%; max-height:240px; object-fit:cover; }
.mw-err{ color:var(--rose); font-size:13px; font-weight:700; margin-top:10px; }
.mw-full{ width:100%; justify-content:center; margin-top:22px; }
.mw-note-foot{ text-align:center; font-family:'Caveat',cursive; font-weight:600; font-size:17px; color:var(--muted); padding:0 20px 46px; }

.mw-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.mw-buddy{ cursor:pointer; border:2px solid var(--line); border-radius:14px; padding:8px; background:#fff; display:grid; place-items:center; }
.mw-buddy[data-on="1"]{ border-color:var(--rose); box-shadow:0 0 0 3px rgba(199,107,130,.16); }
.mw-swatches{ display:flex; gap:9px; flex-wrap:wrap; }
.mw-sw{ width:30px; height:30px; border-radius:50%; cursor:pointer; border:2px solid #fff; box-shadow:0 0 0 1px var(--line); position:relative; }
.mw-sw[data-on="1"]{ box-shadow:0 0 0 3px var(--ink); }
.mw-sw svg{ position:absolute; inset:0; margin:auto; color:#fff; }
.mw-lockicon{ width:46px; height:46px; border-radius:50%; display:grid; place-items:center; background:rgba(199,107,130,.14); color:var(--rose); margin-bottom:10px; }

@media (prefers-reduced-motion: reduce){
  .mw-card, .mw-overlay, .mw-modal, .mw-stk-i, .mw-rc, .mw-rh{ animation:none; }
}
@media(max-width:600px){
  .mw-head-in{ padding:13px 14px 12px; gap:9px; }
  .mw-word b{ font-size:24px; }
  .mw-word small{ font-size:14px; }
  .mw-mark{ width:38px; height:38px; }
  .mw-btn{ padding:9px 13px; font-size:13px; }
  .mw-subbar{ padding:11px 14px 0; }
  .mw-feed{ padding:18px 12px 96px; gap:24px; }
  .mw-body{ padding:14px 15px 6px; }
  .mw-cap{ font-size:21px; }
  .mw-stk{ --sc:.68; }
  .mw-stamp{ --ssc:.78; }
  .mw-modal{ padding:22px; }
  .mw-grid{ gap:8px; }
}
`;

const COLORS = ["#C76B82", "#8DA06A", "#D79A6A", "#9E8FB0"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MASCOTS = ["cat", "bunny", "bear", "fox", "puppy", "sleepy"];
const MASCOT_COLORS = ["#E8956F", "#C76B82", "#8DA06A", "#9E8FB0", "#D9A648", "#7FA7C9"];

function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function colorFor(name) { return COLORS[hashStr(name || "") % COLORS.length]; }
function uid(n = 5) { return `${Date.now()}-${Math.random().toString(36).slice(2, 2 + n)}`; }
function safe(s) { return (s || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40); }
function when(ts) {
  const d = new Date(ts), now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  let hr = d.getHours(); const ap = hr >= 12 ? "PM" : "AM"; hr = hr % 12 || 12;
  const t = `${hr}:${String(d.getMinutes()).padStart(2, "0")} ${ap}`;
  return sameDay ? t : `${MONTHS[d.getMonth()]} ${d.getDate()} · ${t}`;
}

/* ---- local profile (who am I on this device) ---- */
function loadProfile() { try { return JSON.parse(localStorage.getItem("mw:profile") || "null"); } catch { return null; } }
function saveProfileLS(p) {
  try {
    const prev = JSON.parse(localStorage.getItem("mw:mynames") || "[]");
    const next = [...new Set([...prev, p.name])];
    localStorage.setItem("mw:mynames", JSON.stringify(next));
    localStorage.setItem("mw:profile", JSON.stringify(p));
  } catch {}
}
function loadMyNames() { try { return new Set(JSON.parse(localStorage.getItem("mw:mynames") || "[]")); } catch { return new Set(); } }
function getRoom() { try { return localStorage.getItem("mw:room") || ""; } catch { return ""; } }
function setRoom(v) { try { localStorage.setItem("mw:room", v); } catch {} }

/* ---- Supabase client (anon key is safe to expose — RLS controls access) ---- */
function getSB() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in environment");
  return createClient(url, key);
}

/* ---- shared backend ---- */
async function getState() {
  const sb = getSB();
  const { data, error } = await sb.from("meanwhile_state").select("*").eq("id", 1).single();
  if (error && error.code !== "PGRST116") throw error;
  return data ? { posts: data.posts || [], stamps: data.stamps || [] } : { posts: [], stamps: [] };
}

async function sendOp(type, payload) {
  const res = await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-room": getRoom() },
    body: JSON.stringify({ type, payload }),
  });
  if (res.status === 401) { const e = new Error("locked"); e.code = 401; throw e; }
  if (!res.ok) throw new Error("request failed");
  return res.json();
}

/* ---- media ---- */
function readDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
}
function shrinkImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.width, h = img.height;
        const max = 1600, scale = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", 0.85));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error("decode"));
    img.src = dataUrl;
  });
}
async function uploadMedia(file, onProgress) {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) throw new Error("Pick a photo or a video.");

  const sb = getSB();
  const ext = isVideo ? (file.name.split(".").pop() || "mp4") : "jpg";
  const path = `media/${uid()}-${safe(file.name || "upload")}.${ext}`;

  let uploadFile = file;
  let contentType = file.type || "application/octet-stream";

  if (isImage) {
    try {
      const dataUrl = await shrinkImage(await readDataURL(file));
      uploadFile = await (await fetch(dataUrl)).blob();
      contentType = "image/jpeg";
    } catch {}
  }

  onProgress && onProgress({ percentage: 10 });

  const { data, error } = await sb.storage
    .from("meanwhile-media")
    .upload(path, uploadFile, { contentType, upsert: false });

  if (error) throw new Error(error.message || "Upload failed");

  onProgress && onProgress({ percentage: 100 });

  const { data: { publicUrl } } = sb.storage.from("meanwhile-media").getPublicUrl(data.path);
  return { mediaType: isVideo ? "video" : "image", media: publicUrl };
}

/* ---- doodle shapes ---- */
const SVGShape = ({ t, c, w }) => {
  const s = { width: w, height: "auto", display: "block" };
  if (t === "heart") return (<svg viewBox="0 0 24 24" fill={c} style={s}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>);
  if (t === "star") return (<svg viewBox="0 0 24 24" fill={c} style={s}><path d="M12 0c.8 6.4 4.8 10.4 12 12-7.2 1.6-11.2 5.6-12 12-.8-6.4-4.8-10.4-12-12C7.2 10.4 11.2 6.4 12 0z" /></svg>);
  if (t === "swirl") return (<svg viewBox="0 0 40 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" style={s}><path d="M2 13c4-10 11-10 14 0s10 10 14 0" /></svg>);
  if (t === "cat") return (
    <svg viewBox="0 0 48 48" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M13 17 L9 5 L20 12" /><path d="M35 17 L39 5 L28 12" /><circle cx="24" cy="28" r="13" />
      <circle cx="19" cy="26" r="1.5" fill={c} stroke="none" /><circle cx="29" cy="26" r="1.5" fill={c} stroke="none" />
      <path d="M24 29 q-2.5 2.5 -5 1.4" /><path d="M24 29 q2.5 2.5 5 1.4" />
    </svg>
  );
  return null;
};

function MascotShape({ id, c, size }) {
  const s = { width: size, height: size, display: "block" };
  const ears = {
    cat: <><path d="M12 16 L8 4 L20 11 Z" fill={c} /><path d="M36 16 L40 4 L28 11 Z" fill={c} /></>,
    sleepy: <><path d="M12 16 L8 4 L20 11 Z" fill={c} /><path d="M36 16 L40 4 L28 11 Z" fill={c} /></>,
    fox: <><path d="M11 17 L5 3 L22 12 Z" fill={c} /><path d="M37 17 L43 3 L26 12 Z" fill={c} /></>,
    bear: <><circle cx="13" cy="13" r="6.5" fill={c} /><circle cx="35" cy="13" r="6.5" fill={c} /></>,
    bunny: <><ellipse cx="17" cy="9" rx="4.2" ry="11" fill={c} /><ellipse cx="31" cy="9" rx="4.2" ry="11" fill={c} /></>,
    puppy: <><ellipse cx="9" cy="23" rx="5" ry="9.5" fill={c} /><ellipse cx="39" cy="23" rx="5" ry="9.5" fill={c} /></>,
  }[id] || null;
  const sleepy = id === "sleepy";
  return (
    <svg viewBox="0 0 48 48" style={s}>
      {ears}
      <circle cx="24" cy="28" r="14" fill={c} />
      {sleepy
        ? <><path d="M16 26 q3 3 6 0" stroke="#3E2A33" strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M26 26 q3 3 6 0" stroke="#3E2A33" strokeWidth="2" fill="none" strokeLinecap="round" /></>
        : <><circle cx="19" cy="27" r="2.2" fill="#3E2A33" /><circle cx="29" cy="27" r="2.2" fill="#3E2A33" /></>}
      <circle cx="15" cy="31.5" r="2.6" fill="#ff9bb0" opacity=".8" />
      <circle cx="33" cy="31.5" r="2.6" fill="#ff9bb0" opacity=".8" />
      <path d="M21.5 31.5 q2.5 2.4 5 0" stroke="#3E2A33" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ReactionCat() {
  return (
    <div className="mw-react" aria-hidden="true">
      <div className="mw-rc">
        <svg viewBox="0 0 64 64" width="92" height="92">
          <path d="M16 22 L11 8 L26 16 Z" fill="#E8956F" /><path d="M48 22 L53 8 L38 16 Z" fill="#E8956F" />
          <circle cx="32" cy="38" r="19" fill="#E8956F" />
          <circle cx="25" cy="37" r="3.2" fill="#3E2A33" /><circle cx="39" cy="37" r="3.2" fill="#3E2A33" />
          <circle cx="24" cy="36" r="1" fill="#fff" /><circle cx="38" cy="36" r="1" fill="#fff" />
          <circle cx="20" cy="42" r="3.6" fill="#ff9bb0" opacity=".85" /><circle cx="44" cy="42" r="3.6" fill="#ff9bb0" opacity=".85" />
          <path d="M29 43 q3 3 6 0" stroke="#3E2A33" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M32 12 c1.4-2.4 5-1.2 5 1.2 0 2.2-3 3.8-5 5.6-2-1.8-5-3.4-5-5.6 0-2.4 3.6-3.6 5-1.2z" fill="#E54B6D" />
        </svg>
      </div>
      <span className="mw-rh" style={{ left: "4px", top: "16px", animationDelay: "0s" }}>♥</span>
      <span className="mw-rh" style={{ left: "78px", top: "20px", animationDelay: ".2s" }}>♥</span>
      <span className="mw-rh" style={{ left: "40px", top: "0px", animationDelay: ".35s", fontSize: "12px" }}>♥</span>
    </div>
  );
}

const SERIF = "'Cormorant Garamond', serif";
const HAND = "'Caveat', cursive";
const STICKERS = [
  { t: "heart", top: "6%", left: "5%", r: -16, w: 36, c: "#E58AA0", o: .75 },
  { t: "note", top: "4%", left: "63%", r: 5, c: "#3E2A33", o: .6, text: "you are my favorite person", font: SERIF },
  { t: "star", top: "11%", left: "90%", r: 10, w: 30, c: "#E7A766", o: .75 },
  { t: "cat", top: "20%", left: "3%", r: -10, w: 56, c: "#C76B82", o: .55 },
  { t: "heart", top: "27%", left: "93%", r: 14, w: 26, c: "#C76B82", o: .6 },
  { t: "note", top: "33%", left: "84%", r: -8, c: "#C76B82", o: .62, text: "stay ♡", font: HAND },
  { t: "swirl", top: "40%", left: "2%", r: 0, w: 50, c: "#9E8FB0", o: .55 },
  { t: "star", top: "49%", left: "9%", r: -14, w: 24, c: "#E7A766", o: .6 },
  { t: "heart", top: "47%", left: "50%", r: 0, w: 18, c: "#E58AA0", o: .3 },
  { t: "cat", top: "56%", left: "91%", r: 12, w: 52, c: "#8DA06A", o: .5 },
  { t: "note", top: "61%", left: "4%", r: 7, c: "#9E8FB0", o: .58, text: "in another life ✦", font: SERIF },
  { t: "heart", top: "67%", left: "88%", r: -16, w: 30, c: "#C76B82", o: .6 },
  { t: "star", top: "74%", left: "6%", r: 8, w: 28, c: "#D79A6A", o: .62 },
  { t: "note", top: "78%", left: "82%", r: 9, c: "#3E2A33", o: .55, text: "thinking of you", font: SERIF },
  { t: "swirl", top: "85%", left: "11%", r: 5, w: 48, c: "#C76B82", o: .5 },
  { t: "heart", top: "88%", left: "76%", r: -14, w: 28, c: "#E58AA0", o: .6 },
  { t: "note", top: "92%", left: "6%", r: -5, c: "#C76B82", o: .6, text: "luv u ♡", font: HAND },
  { t: "star", top: "94%", left: "92%", r: -10, w: 26, c: "#E7A766", o: .6 },
  { t: "heart", top: "3%", left: "35%", r: 12, w: 20, c: "#E7A766", o: .5 },
  { t: "swirl", top: "16%", left: "70%", r: -8, w: 44, c: "#8DA06A", o: .5 },
  { t: "star", top: "36%", left: "60%", r: 14, w: 20, c: "#E58AA0", o: .45 },
  { t: "cat", top: "80%", left: "44%", r: -6, w: 40, c: "#D79A6A", o: .4 },
  { t: "heart", top: "58%", left: "20%", r: 10, w: 22, c: "#C76B82", o: .42 },
  { t: "note", top: "24%", left: "44%", r: -6, c: "#9E8FB0", o: .5, text: "promise? ♡", font: HAND },
  { t: "star", top: "67%", left: "62%", r: -12, w: 22, c: "#E7A766", o: .5 },
  { t: "heart", top: "14%", left: "20%", r: 18, w: 24, c: "#E58AA0", o: .5 },
];

function Decor() {
  return (
    <div className="mw-decor" aria-hidden="true">
      {STICKERS.map((s, i) => (
        <div key={i} className="mw-stk" style={{ top: s.top, left: s.left, "--r": `${s.r}deg` }}>
          <div className="mw-stk-i" style={{ opacity: s.o, "--d": `${6 + (i % 5)}s`, animationDelay: `${(i % 7) * 0.4}s` }}>
            {s.t === "note"
              ? <span className="mw-pn" style={{ color: s.c, fontFamily: s.font }}>{s.text}</span>
              : <SVGShape t={s.t} c={s.c} w={s.w} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState(loadProfile());
  const [posts, setPosts] = useState([]);
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  // pendingRef counts in-flight ops; lastOpAt tracks when we last wrote
  // so the poll never overwrites local state with stale server data.
  const pendingRef = useRef(0);
  const lastOpAt = useRef(0);
  const STALE_MS = 4000; // ignore poll results for 4 s after any write

  const applyState = useCallback((s) => {
    setPosts((s.posts || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)));
    setStamps(s.stamps || []);
  }, []);

  const refresh = useCallback(async () => {
    // Don't let a background poll clobber state while a write is in flight
    // or for a few seconds after one completes.
    if (pendingRef.current > 0) return;
    if (Date.now() - lastOpAt.current < STALE_MS) return;
    try { applyState(await getState()); setLocked(false); }
    catch (e) { if (e.code === 401) setLocked(true); }
  }, [applyState]);

  useEffect(() => {
    (async () => { await refresh(); setLoading(false); })();
    const iv = setInterval(refresh, 6000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(iv); window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  const op = useCallback(async (type, payload) => {
    pendingRef.current += 1;
    lastOpAt.current = Date.now();
    try { applyState(await sendOp(type, payload)); lastOpAt.current = Date.now(); }
    catch (e) { if (e.code === 401) setLocked(true); }
    finally { pendingRef.current = Math.max(0, pendingRef.current - 1); }
  }, [applyState]);

  const saveProfile = useCallback((p) => {
    const prof = { name: p.name.trim().slice(0, 22), mascot: p.mascot, color: p.color };
    if (!prof.name) return;
    setMe(prof); saveProfileLS(prof); setEditing(false);
  }, []);

  const addPost = useCallback((data) => {
    const post = { ...data, id: uid(), author: me.name, ts: Date.now(), hearts: [], comments: [] };
    setPosts((p) => [post, ...p]); setComposing(false); op("addPost", post);
  }, [me, op]);

  const toggleHeart = useCallback((post) => {
    const has = post.hearts.includes(me.name);
    const hearts = has ? post.hearts.filter((h) => h !== me.name) : [...post.hearts, me.name];
    setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, hearts } : x)));
    op("heart", { id: post.id, name: me.name });
  }, [me, op]);

  const addComment = useCallback((post, text) => {
    const comment = { id: uid(3), author: me.name, text, ts: Date.now() };
    setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, comments: [...(x.comments || []), comment] } : x)));
    op("addComment", { id: post.id, comment });
  }, [me, op]);

  const removeComment = useCallback((post, cid) => {
    setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, comments: (x.comments || []).filter((c) => c.id !== cid) } : x)));
    op("delComment", { id: post.id, cid });
  }, [op]);

  const removePost = useCallback((post) => {
    if (!window.confirm("Take this down? This can't be undone.")) return;
    setPosts((p) => p.filter((x) => x.id !== post.id)); op("delPost", { id: post.id });
  }, [op]);

  const placeStamp = useCallback((e) => {
    const stamp = { id: uid(), author: me.name, mascot: me.mascot, color: me.color,
      x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 };
    setStamps((s) => [...s, stamp]); op("addStamp", stamp);
  }, [me, op]);

  const removeStamp = useCallback((id) => {
    setStamps((s) => s.filter((x) => x.id !== id)); op("delStamp", { id });
  }, [op]);

  const other = useMemo(() => {
    // Exclude every name this device has ever used (handles renames cleanly).
    const myNames = loadMyNames();
    if (me?.name) myNames.add(me.name);
    const names = new Set();
    posts.forEach((p) => { names.add(p.author); (p.comments || []).forEach((c) => names.add(c.author)); });
    stamps.forEach((s) => names.add(s.author));
    myNames.forEach((n) => names.delete(n));
    return [...names][0] || null;
  }, [posts, stamps, me]);

  if (locked) return (<div className="mw-root"><style>{CSS}</style><RoomGate onUnlock={() => { setLocked(false); refresh(); }} /></div>);

  return (
    <div className="mw-root">
      <style>{CSS}</style>
      <Decor />

      <header className="mw-head">
        <div className="mw-head-in">
          <div className="mw-mark"><Moon size={20} strokeWidth={1.8} /></div>
          <div className="mw-word">
            <b>Meanwhile</b>
            <small>{me && other ? `${me.name} & ${other}` : "what you're up to, what I'm up to"}</small>
          </div>
          {me && <button className="mw-btn" onClick={() => setComposing(true)}><Plus size={17} strokeWidth={2.6} /> Share</button>}
        </div>
        <div className="mw-lights" />
        {me && (
          <div className="mw-subbar">
            <span className="mw-me"><MascotShape id={me.mascot} c={me.color} size={26} /> {me.name}</span>
            <button className="mw-link" onClick={() => setEditing(true)}>edit</button>
            <button className="mw-stickbtn" data-on={pasteMode ? 1 : 0} onClick={() => setPasteMode((v) => !v)}>
              <Sticker size={15} strokeWidth={2.2} /> {pasteMode ? "Done sticking" : "Stick your buddy"}
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <div className="mw-load"><Loader2 className="mw-spin" size={20} /> Lighting the candles…</div>
      ) : !me ? null : posts.length === 0 ? (
        <div className="mw-empty">
          <Camera size={32} strokeWidth={1.6} style={{ color: "var(--rose)" }} />
          <h2>It's quiet in here</h2>
          <p>Share a little something — tell them what you're up to right now.</p>
          <button className="mw-btn" onClick={() => setComposing(true)}><Plus size={17} strokeWidth={2.6} /> Share the first moment</button>
        </div>
      ) : (
        <main className="mw-feed">
          {posts.map((p) => (
            <Entry key={p.id} post={p} me={me.name}
              onHeart={() => toggleHeart(p)} onRemove={() => removePost(p)}
              onComment={(t) => addComment(p, t)} onRemoveComment={(cid) => removeComment(p, cid)} />
          ))}
        </main>
      )}

      {!loading && me && posts.length > 0 && <p className="mw-note-foot">just the two of you, here ♡</p>}

      {me && (
        <div className="mw-stamps" data-edit={pasteMode ? 1 : 0} aria-hidden="true">
          {stamps.map((s) => (
            <div key={s.id} className="mw-stamp" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
              <MascotShape id={s.mascot} c={s.color} size={56} />
              {pasteMode && s.author === me.name && (
                <button className="mw-stamp-x" onClick={(e) => { e.stopPropagation(); removeStamp(s.id); }} aria-label="Remove sticker"><X size={13} /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {pasteMode && me && <div className="mw-capture" onClick={placeStamp} />}
      {pasteMode && me && (
        <div className="mw-pastebar">
          <span>Tap anywhere to stick <b>{me.name}'s buddy</b></span>
          <button className="mw-pastedone" onClick={() => setPasteMode(false)}>Done</button>
        </div>
      )}

      {(!me || editing) && !loading && (
        <ProfileModal initial={me} canClose={!!me} onClose={() => setEditing(false)} onSave={saveProfile} />
      )}

      {composing && <Composer onClose={() => setComposing(false)} onSubmit={addPost} />}
    </div>
  );
}

function RoomGate({ onUnlock }) {
  const [val, setVal] = useState("");
  const go = () => { if (!val.trim()) return; setRoom(val.trim()); onUnlock(); };
  return (
    <div className="mw-overlay" style={{ position: "fixed" }}>
      <div className="mw-modal">
        <div className="mw-lockicon"><Lock size={22} /></div>
        <div className="mw-kicker">just for the two of you</div>
        <h2>Enter your passphrase</h2>
        <input className="mw-input" autoFocus type="password" placeholder="your shared passphrase" style={{ marginTop: 14 }}
          value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(); }} />
        <button className="mw-btn mw-full" onClick={go} disabled={!val.trim()}>Open the window</button>
      </div>
    </div>
  );
}

function Entry({ post, me, onHeart, onRemove, onComment, onRemoveComment }) {
  const [draft, setDraft] = useState("");
  const [react, setReact] = useState(0);
  const liked = post.hearts.includes(me);
  const comments = post.comments || [];
  const send = () => { const t = draft.trim().slice(0, 280); if (!t) return; onComment(t); setDraft(""); };
  const heart = () => { const was = liked; onHeart(); if (!was) { setReact(Date.now()); setTimeout(() => setReact(0), 1700); } };

  return (
    <article className="mw-card">
      <div className="mw-photo">
        {post.mediaType === "video"
          ? <video src={post.media} controls playsInline preload="metadata" />
          : <img src={post.media} alt={post.caption || `From ${post.author}`} loading="lazy" />}
        {react ? <ReactionCat key={react} /> : null}
      </div>
      <div className="mw-body">
        {post.caption && <p className="mw-cap">{post.caption}</p>}
        <div className="mw-row">
          <span className="mw-sign"><span className="mw-dot" style={{ background: colorFor(post.author) }} /> {post.author}</span>
          {post.location && <span className="mw-where"><MapPin size={12} strokeWidth={2.5} /> {post.location}</span>}
          <span className="mw-when">· {when(post.ts)}</span>
          <button className="mw-heart" data-on={liked ? 1 : 0} onClick={heart} aria-label={liked ? "Take back your heart" : "Leave a heart"}>
            <Heart size={16} fill={liked ? "currentColor" : "none"} strokeWidth={2.2} />
            {post.hearts.length > 0 && post.hearts.length}
          </button>
          {post.author === me && <button className="mw-trash" onClick={onRemove} aria-label="Take down"><Trash2 size={15} /></button>}
        </div>

        <div className="mw-notes">
          {comments.map((c) => (
            <div key={c.id} className="mw-note">
              <span className="mw-cn" style={{ color: colorFor(c.author) }}>{c.author}</span>
              <span className="mw-ct">{c.text}</span>
              <span className="mw-cw">{when(c.ts)}</span>
              {c.author === me && <button className="mw-cdel" onClick={() => onRemoveComment(c.id)} aria-label="Delete note"><X size={12} /></button>}
            </div>
          ))}
          <div className="mw-cbox">
            <input className="mw-cinput" placeholder="leave a note…" maxLength={280}
              value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
            <button className="mw-csend" onClick={send} disabled={!draft.trim()} aria-label="Send note"><Send size={16} strokeWidth={2.2} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProfileModal({ initial, canClose, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [mascot, setMascot] = useState(initial?.mascot || MASCOTS[0]);
  const [color, setColor] = useState(initial?.color || MASCOT_COLORS[0]);
  return (
    <div className="mw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && canClose) onClose(); }}>
      <div className="mw-modal">
        {canClose && <button className="mw-x" onClick={onClose} aria-label="Close"><X size={18} /></button>}
        <div className="mw-kicker">just so they know it's you</div>
        <h2>{initial ? "Your profile" : "Hi there"}</h2>
        <label className="mw-label">What should they call you?</label>
        <input className="mw-input" autoFocus maxLength={22} placeholder="your name" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="mw-label">Pick your buddy</label>
        <div className="mw-grid">
          {MASCOTS.map((m) => (
            <button key={m} className="mw-buddy" data-on={mascot === m ? 1 : 0} onClick={() => setMascot(m)} aria-label={`Buddy ${m}`}>
              <MascotShape id={m} c={color} size={50} />
            </button>
          ))}
        </div>
        <label className="mw-label">Their color</label>
        <div className="mw-swatches">
          {MASCOT_COLORS.map((c) => (
            <button key={c} className="mw-sw" data-on={color === c ? 1 : 0} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Color ${c}`}>
              {color === c && <Check size={16} strokeWidth={3} />}
            </button>
          ))}
        </div>
        <button className="mw-btn mw-full" onClick={() => onSave({ name, mascot, color })} disabled={!name.trim()}>
          {initial ? "Save" : "Step inside"}
        </button>
      </div>
    </div>
  );
}

function Composer({ onClose, onSubmit }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [kind, setKind] = useState(null);
  const [location, setLocation] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    setErr("");
    if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) { setErr("Pick a photo or a video."); return; }
    setFile(f); setKind(f.type.startsWith("video/") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file) { setErr("Add a photo or video first."); return; }
    setBusy(true); setErr("");
    try {
      const media = await uploadMedia(file, (p) => setPct(Math.round((p.percentage || 0))));
      onSubmit({ ...media, location: location.trim().slice(0, 40), caption: caption.trim().slice(0, 200) });
    } catch (e) {
      setErr("Upload failed — check your connection and try again."); setBusy(false);
    }
  };

  return (
    <div className="mw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="mw-modal">
        {!busy && <button className="mw-x" onClick={onClose} aria-label="Close"><X size={18} /></button>}
        <div className="mw-kicker">a little moment</div>
        <h2>Share with them</h2>

        <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        <div className="mw-drop" data-has={preview ? 1 : 0} role="button" tabIndex={0}
          onClick={() => !busy && fileRef.current?.click()}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !busy) { e.preventDefault(); fileRef.current?.click(); } }}>
          {preview
            ? (kind === "video" ? <video src={preview} muted controls playsInline /> : <img src={preview} alt="Preview" />)
            : <><Camera size={26} strokeWidth={1.6} style={{ display: "block", margin: "0 auto 8px" }} />Tap to add a photo or video</>}
        </div>

        <label className="mw-label">What are you up to? (optional)</label>
        <textarea className="mw-textarea" placeholder="golden hour on the walk home, thinking of you" maxLength={200}
          value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} />

        <label className="mw-label">Where are you? (optional)</label>
        <input className="mw-input" placeholder="the park" maxLength={40}
          value={location} onChange={(e) => setLocation(e.target.value)} disabled={busy} />

        {err && <p className="mw-err">{err}</p>}
        <button className="mw-btn mw-full" onClick={submit} disabled={busy}>
          {busy ? <><Loader2 className="mw-spin" size={17} /> {pct ? `Sending ${pct}%` : "Sending…"}</> : <><Send size={17} strokeWidth={2.2} /> Send it</>}
        </button>
      </div>
    </div>
  );
}

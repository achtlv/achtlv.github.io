function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
    catch { return { ok: res.ok, status: res.status, data: null, text }; }
  } catch (e) {
    return { ok: false, status: 0, data: null, error: String(e.message || e) };
  } finally { clearTimeout(timer); }
}

export async function handleCacheGet(key) {
  const safeKey = String(key || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeKey) return json({ ok: false, msg: "无效 key" });
  try {
    const res = await fetch("https://textdb.online/" + encodeURIComponent(safeKey), { headers: { "User-Agent": UA } });
    if (!res.ok) return json({ ok: false, msg: "HTTP " + res.status });
    let val = (await res.text());
    if (val.indexOf('{"v":2') === 0) {
      try {
        const o = JSON.parse(val);
        if (o && o.v === 2 && o.n > 1) {
          const parts = [];
          for (let i = 0; i < o.n; i++) {
            const r2 = await fetch("https://textdb.online/" + encodeURIComponent(safeKey + "_c" + i), { headers: { "User-Agent": UA } });
            if (!r2.ok) return json({ ok: false, msg: "分片缺失" });
            parts.push(await r2.text());
          }
          val = parts.join("");
        }
      } catch (e) {}
    }
    return json({ ok: true, value: val });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

export async function handleCacheSet(key, value) {
  if (!key || value == null) return json({ ok: false, msg: "缺少参数" });
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeKey) return json({ ok: false, msg: "无效 key" });
  const val = String(value);
  const CHUNK = 1500;
  async function putOne(k, v) {
    const url = "https://textdb.online/update/?key=" + encodeURIComponent(k) + "&value=" + encodeURIComponent(String(v));
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    return res.ok;
  }
  try {
    if (val.length <= CHUNK) {
      return json({ ok: !!(await putOne(safeKey, val)) });
    }
    const n = Math.ceil(val.length / CHUNK);
    if (!(await putOne(safeKey, JSON.stringify({ v: 2, n: n })))) return json({ ok: false, msg: "meta fail" });
    for (let i = 0; i < n; i++) {
      if (!(await putOne(safeKey + "_c" + i, val.substring(i * CHUNK, (i + 1) * CHUNK))))
        return json({ ok: false, msg: "chunk " + i });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

export async function handleSearchKg(word) {
  const q = String(word || "").trim();
  if (!q) return json({ code: 400, msg: "空关键词" }, 400);
  try {
    const url = "https://songsearch.kugou.com/song_search_v2?keyword=" + encodeURIComponent(q) + "&page=1&pagesize=5&userid=-1&clientver=&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0";
    const r = await fetchJson(url, { headers: { "User-Agent": UA } });
    const lists = (r.data && r.data.data && r.data.data.lists) || [];
    const songs = (lists || []).slice(0, 5).map((it) => {
      let pic = "";
      if (it.Image) pic = String(it.Image).replace("{size}", "400");
      if (pic && /stdmusic\/\d+\//.test(pic)) pic = pic.replace(/stdmusic\/\d+\//, "stdmusic/400/");
      const hash = (it.FileHash || it.HQFileHash || "").toLowerCase();
      return {
        id: "kg" + hash,
        name: it.SongName || it.OriSongName || "",
        artist: it.SingerName || "",
        pic,
        source: "kg",
      };
    }).filter((s) => s.id && s.id.length > 4);
    const first = songs[0] || null;
    if (first) {
      return json({
        code: 200,
        id: first.id,
        name: first.name,
        artist: first.artist,
        pic: first.pic || "",
        duration: first.duration || 0,
        source: "kg",
        data: { songs },
      });
    }
    return json({ code: 404, msg: "未找到酷狗歌曲" });
  } catch (e) {
    return json({ code: 500, msg: String(e.message || e) }, 500);
  }
}

export async function handleGetSongLyric(id) {
  return json({ code: 200, data: { lrc: { lyric: "" }, tlyric: { lyric: "" }, romalrc: { lyric: "" } } });
}
export async function handleGetSongUrl() { return json({ code: 404, msg: "client-side" }, 404); }
export async function handleGetSongInfo() { return json({ code: 404, msg: "client-side" }, 404); }
export async function handleDownload() { return json({ code: 404 }, 404); }
export async function handleOfficialResolve() { return json({ code: 404 }, 404); }
export async function proxy() { return new Response("not found", { status: 404 }); }



export async function handleKgLyric(hash) {
  const h = String(hash || "").toLowerCase().replace(/[^a-f0-9]/g, "");
  if (h.length !== 32) return json({ code: 400, msg: "无效 hash" }, 400);
  const tryUrls = [
    "https://m.kugou.com/app/i/krc.php?cmd=100&hash=" + encodeURIComponent(h) + "&timelength=999999&d=0.1",
    "http://m.kugou.com/app/i/krc.php?cmd=100&hash=" + encodeURIComponent(h) + "&timelength=999999&d=0.1",
  ];
  for (let i = 0; i < tryUrls.length; i++) {
    try {
      const r = await fetchJson(tryUrls[i], {
        headers: { "User-Agent": UA, "Referer": "https://www.kugou.com/", "Accept": "*/*" },
      }, 12000);
      let raw = "";
      if (r.text && String(r.text).trim()) raw = r.text;
      else if (typeof r.data === "string") raw = r.data;
      else if (r.data && r.data.lyric) raw = String(r.data.lyric);
      // 去掉 BOM
      raw = String(raw || "").replace(/^\uFEFF/, "");
      if (raw && /\[\d{1,2}:\d{2}/.test(raw)) {
        return json({ code: 200, data: { lyric: raw, lrc: { lyric: raw } } });
      }
      if (raw && raw.length > 20 && raw.indexOf("[") >= 0) {
        return json({ code: 200, data: { lyric: raw, lrc: { lyric: raw } } });
      }
    } catch (e) {}
  }
  return json({ code: 404, msg: "暂无歌词" });
}


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
  let h = String(hash || "").toLowerCase().replace(/^kg/, "").replace(/[^a-f0-9]/g, "");
  if (h.length !== 32) return json({ code: 400, msg: "无效 hash: " + String(hash) }, 400);
  const headers = { "User-Agent": UA, "Referer": "https://www.kugou.com/", "Accept": "*/*" };
  const krcUrls = [
    "https://m.kugou.com/app/i/krc.php?cmd=100&hash=" + encodeURIComponent(h) + "&timelength=999999&d=0.1",
    "https://m3ws.kugou.com/app/i/krc.php?cmd=100&hash=" + encodeURIComponent(h) + "&timelength=999999&d=0.1",
  ];
  for (let i = 0; i < krcUrls.length; i++) {
    try {
      const r = await fetchJson(krcUrls[i], { headers }, 12000);
      let raw = "";
      if (r.text && String(r.text).trim()) raw = r.text;
      else if (typeof r.data === "string") raw = r.data;
      raw = String(raw || "").replace(/^\uFEFF/, "");
      if (raw && (/\[\d{1,2}:\d{2}/.test(raw) || (raw.indexOf("[") >= 0 && raw.length > 30))) {
        return json({ code: 200, data: { lyric: raw, lrc: { lyric: raw } } });
      }
    } catch (e) {}
  }
  try {
    const searchUrl = "https://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=&duration=&hash=" + encodeURIComponent(h);
    const sr = await fetchJson(searchUrl, { headers }, 12000);
    const candidates = (sr.data && sr.data.candidates) || [];
    if (candidates && candidates[0]) {
      const c0 = candidates[0];
      const id = c0.id || c0.Id;
      const accesskey = c0.accesskey || c0.AccessKey;
      if (id && accesskey) {
        const dl = "https://lyrics.kugou.com/download?ver=1&client=pc&id=" + encodeURIComponent(id) +
          "&accesskey=" + encodeURIComponent(accesskey) + "&fmt=lrc&charset=utf8";
        const dr = await fetchJson(dl, { headers }, 12000);
        let content = (dr.data && (dr.data.content || dr.data.lyric)) || "";
        if (content && typeof content === "string") {
          try {
            if (!/\[\d{1,2}:\d{2}/.test(content) && content.length > 40) {
              const decoded = atob(content);
              const bytes = Uint8Array.from(decoded, c => c.charCodeAt(0));
              content = new TextDecoder("utf-8").decode(bytes);
            }
          } catch (e) {}
          content = String(content || "").replace(/^\uFEFF/, "");
          if (content && content.length > 10) {
            return json({ code: 200, data: { lyric: content, lrc: { lyric: content } } });
          }
        }
      }
    }
  } catch (e) {}
  return json({ code: 404, msg: "暂无歌词" });
}




export async function handleCheckAudio(url) {
  let u = String(url || "").trim();
  if (!u) return json({ ok: false, msg: "缺少 url" }, 400);
  if (u.indexOf("//") === 0) u = "https:" + u;
  if (/^http:\/\//i.test(u)) u = u.replace(/^http:\/\//i, "https://");
  if (!/^https?:\/\//i.test(u)) return json({ ok: false, msg: "无效链接" }, 400);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    let res;
    try {
      res = await fetch(u, {
        method: "GET",
        headers: {
          "User-Agent": UA,
          "Range": "bytes=0-1023",
          "Referer": "https://www.bilibili.com/",
        },
        signal: ctrl.signal,
        redirect: "follow",
      });
    } catch (e) {
      // retry without range
      res = await fetch(u, {
        method: "HEAD",
        headers: { "User-Agent": UA, "Referer": "https://www.bilibili.com/" },
        signal: ctrl.signal,
        redirect: "follow",
      });
    }
    clearTimeout(timer);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const ok = res.ok || res.status === 206 || res.status === 200;
    // infer format
    let format = "";
    const path = u.split("?")[0].toLowerCase();
    const m = path.match(/\.([a-z0-9]+)$/);
    if (m) format = m[1];
    if (!format && ct) {
      if (ct.indexOf("mpegurl") >= 0 || ct.indexOf("m3u8") >= 0) format = "m3u8";
      else if (ct.indexOf("mp4") >= 0) format = "mp4";
      else if (ct.indexOf("mpeg") >= 0 || ct.indexOf("mp3") >= 0) format = "mp3";
      else if (ct.indexOf("flac") >= 0) format = "flac";
      else if (ct.indexOf("ogg") >= 0) format = "ogg";
      else if (ct.indexOf("webm") >= 0) format = "webm";
      else if (ct.indexOf("aac") >= 0) format = "aac";
    }
    // bilibili m4s
    if (!format && /bilivideo\.com|\.m4s/i.test(u)) format = "m4s";
    // soft ok: if status weird but bilibili/media extension
    const softOk = ok || /bilivideo\.com|\.m4s|\.m4a|\.mp3|\.flac|\.mp4|\.m3u8/i.test(u);
    let name = "外部音源";
    try {
      const segs = path.split("/");
      const last = segs[segs.length - 1] || "";
      if (last && last.length < 80) name = decodeURIComponent(last);
    } catch (e) {}
    return json({
      ok: !!softOk,
      url: u,
      format: format || "",
      contentType: ct,
      status: res.status,
      name: name,
    });
  } catch (e) {
    // still allow known media URLs
    const soft = /bilivideo\.com|\.m4s(?:\?|$)|\.m4a(?:\?|$)|\.mp3(?:\?|$)|\.flac(?:\?|$)|\.mp4(?:\?|$)/i.test(u);
    if (soft) {
      let format = "m4s";
      const path = u.split("?")[0].toLowerCase();
      const m = path.match(/\.([a-z0-9]+)$/);
      if (m) format = m[1];
      return json({ ok: true, url: u, format, name: "外部音源", soft: true });
    }
    return json({ ok: false, msg: String(e.message || e) });
  }
}

export async function handleProxyFetch(body) {
  const url = String((body && body.url) || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) return json({ ok: false, msg: "无效 url" }, 400);
  const method = (body && body.method) || "GET";
  const headers = Object.assign({ "User-Agent": UA }, (body && body.headers) || {});
  try {
    const r = await fetchJson(url, { method, headers, body: body.body }, body.timeoutMs || 15000);
    return json({
      ok: r.ok,
      status: r.status,
      data: r.data,
      text: r.text || (typeof r.data === "string" ? r.data : null),
    });
  } catch (e) {
    return json({ ok: false, status: 0, msg: String(e.message || e) });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
const UA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
function upgradeNeteaseUrl(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(/^http:\/\/(([a-z0-9.-]+)\.music\.126\.net)\//i, "https://$1/");
}
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
function qualitiesForLevel(level) {
  const lv = String(level || "").toLowerCase();
  if (lv === "lossless" || lv === "flac") return ["flac"];
  if (lv === "exhigh" || lv === "320k") return ["320k"];
  if (lv === "standard" || lv === "128k") return ["128k"];
  return ["320k"];
}
export async function handleGetSongUrl(id, level = "exhigh") {
  const songId = String(id || "").trim();
  if (!songId) return json({ code: 400, msg: "无效歌曲 ID" }, 400);
  if (/^kg[a-fA-F0-9]{32}$/i.test(songId) || (songId.startsWith("kg") && songId.length > 10)) {
    const hash = songId.slice(2).toLowerCase().replace(/[^a-f0-9]/g, "");
    if (hash.length !== 32) return json({ code: 400, msg: "无效酷狗 hash" }, 400);
    const qualities = qualitiesForLevel(level);
    for (const q of qualities) {
      try {
        const r = await fetchJson(
          "https://yy.zddyr.top/lx/api/?source=kg&quality=" +
            encodeURIComponent(q) +
            "&songmid=" +
            encodeURIComponent(hash) +
            "&mainHash=" +
            encodeURIComponent(hash) +
            "&hash=" +
            encodeURIComponent(hash)
        );
        const u = (r.data && r.data.url) || "";
        if (u) return json({ code: 200, data: { url: u, expi: 1200, level: q } });
      } catch (e) {}
    }
    return json({ code: 404, msg: "酷狗暂无可用音源" }, 404);
  }
  if (!/^\d+$/.test(songId)) return json({ code: 400, msg: "无效歌曲 ID" }, 400);
  const qualities = qualitiesForLevel(level);
  const backends = [
    async (q) => {
      const r = await fetchJson(
        "https://yy.zddyr.top/lx/api/?source=wy&songmid=" +
          encodeURIComponent(songId) +
          "&quality=" +
          encodeURIComponent(q)
      );
      return (r.data && (r.data.url || (r.data.data && r.data.data.url))) || "";
    },
    async (q) => {
      const br = q === "flac" ? "740" : q === "320k" ? "320" : "128";
      const r = await fetchJson(
        "https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=" +
          encodeURIComponent(songId) +
          "&br=" +
          br
      );
      return (r.data && r.data.url) || "";
    },
    async (q) => {
      const r = await fetchJson("https://c.wwwweb.top/music/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "wy", musicId: songId, quality: q }),
      });
      return r.data && Number(r.data.code) === 200 ? r.data.url || "" : "";
    },
    async (q) => {
      const qq = q === "flac" ? "320k" : q;
      const r = await fetchJson(
        "https://lxmusicapi.onrender.com/url/wy/" + encodeURIComponent(songId) + "/" + encodeURIComponent(qq),
        {
          headers: {
            "X-Request-Key": "share-v3",
            "User-Agent": "lx-music-desktop/2.10.0",
          },
        }
      );
      return r.data && Number(r.data.code) === 0 ? r.data.url || "" : "";
    },
    async (q) => {
      const r = await fetchJson("https://oiapi.net/api/Music_163?id=" + encodeURIComponent(songId));
      const u = r.data && r.data.data && r.data.data[0] ? r.data.data[0].url : "";
      return u || "";
    },
  ];
  for (const q of qualities) {
    for (const fn of backends) {
      try {
        let u = await fn(q);
        if (u) {
          u = String(u).replace(/^http:\/\/(([a-z0-9.-]+)\.music\.126\.net)\//i, "https://$1/");
          if (/^https?:\/\//i.test(u)) {
            return json({
              code: 200,
              data: {
                url: u,
                expi: 1200,
                level: q,
                br: q === "flac" ? 999000 : q === "320k" ? 320000 : 128000,
              },
            });
          }
        }
      } catch (e) {}
    }
  }
  return json({ code: 404, msg: "暂无可用音源" }, 404);
}
export async function handleGetSongInfo(id) {
  const songId = String(id || "").trim();
  if (!songId || !/^\d+$/.test(songId)) return json({ code: 400, msg: "无效歌曲 ID" }, 400);
  try {
    const r = await fetchJson("https://api.paugram.com/netease/?id=" + encodeURIComponent(songId));
    const d = r.data;
    if (d && (d.title || d.cover)) {
      return json({ code: 200, data: { songs: [{ id: Number(songId) || songId, name: d.title || "", ar: [{ name: d.artist || "" }], al: { picUrl: d.cover || "" }, dt: 0 }] } });
    }
  } catch (e) {}
  return json({ code: 200, data: { songs: [{ id: Number(songId) || songId, name: "", ar: [{ name: "" }], al: { picUrl: "" }, dt: 0 }] } });
}
export async function handleGetSongLyric(id) {
  const songId = String(id || "").trim();
  if (!songId) return json({ code: 400, msg: "无效歌曲 ID" }, 400);

  function stripMeta(text) {
    if (!text) return "";
    return String(text)
      .split(/\r?\n/)
      .filter((line) => {
        const t = line.trim();
        if (!t) return true;
        if (/^\[\d{1,2}:\d{2}/.test(t)) return true;
        if (/^\[[a-zA-Z$][^\]]*:/.test(t)) return false;
        return true;
      })
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n+$/, "");
  }

  // 酷狗歌词 + 翻译
  if (/^kg/i.test(songId) || /^[a-fA-F0-9]{32}$/.test(songId)) {
    let hash = /^kg/i.test(songId) ? songId.slice(2) : songId;
    hash = String(hash).toLowerCase().replace(/[^a-f0-9]/g, "");
    if (hash.length !== 32)
      return json({ code: 200, data: { lrc: { lyric: "" }, tlyric: { lyric: "" }, romalrc: { lyric: "" } } });
    try {
      const searchRes = await fetch(
        "https://krcs.kugou.com/search?ver=1&man=yes&client=mobi&hash=" + encodeURIComponent(hash),
        { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" }
      );
      const searchData = await searchRes.json();
      const list = (searchData && searchData.candidates) || [];
      if (!list.length)
        return json({ code: 200, data: { lrc: { lyric: "" }, tlyric: { lyric: "" }, romalrc: { lyric: "" } } });

      async function dlLyric(cand) {
        if (!cand || !cand.id || !cand.accesskey) return "";
        const dl = await fetch(
          "https://krcs.kugou.com/download?ver=1&client=pc&id=" +
            encodeURIComponent(cand.id) +
            "&accesskey=" +
            encodeURIComponent(cand.accesskey) +
            "&fmt=lrc&charset=utf8",
          { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" }
        );
        const dlData = await dl.json();
        if (!dlData || !dlData.content) return "";
        try {
          return Buffer.from(String(dlData.content), "base64").toString("utf8");
        } catch (e) {
          return String(dlData.content);
        }
      }

      const mainCand = list[0];
      let main = stripMeta(await dlLyric(mainCand));
      let trans = "";
      // 找带翻译的候选：transuid!=0 或 product_from 含翻译
      let transCand = list.find(
        (c) =>
          (c.transuid && String(c.transuid) !== "0") ||
          (c.product_from && /译|trans/i.test(String(c.product_from)))
      );
      if (transCand && transCand.id !== mainCand.id) {
        trans = stripMeta(await dlLyric(transCand));
      } else if (mainCand.transuid && String(mainCand.transuid) !== "0") {
        // 有些接口用同一 accesskey 下发翻译轨，再试一次带 language
        try {
          const dl2 = await fetch(
            "https://krcs.kugou.com/download?ver=1&client=pc&id=" +
              encodeURIComponent(mainCand.transuid) +
              "&accesskey=" +
              encodeURIComponent(mainCand.accesskey) +
              "&fmt=lrc&charset=utf8",
            { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" }
          );
          const d2 = await dl2.json();
          if (d2 && d2.content) {
            try {
              trans = stripMeta(Buffer.from(String(d2.content), "base64").toString("utf8"));
            } catch (e) {
              trans = stripMeta(String(d2.content));
            }
          }
        } catch (e) {}
      }
      // 正文内嵌翻译：日文后紧跟中文行且无时间轴时不强拆，交给前端显示 main
      return json({
        code: 200,
        data: { lrc: { lyric: main || "" }, tlyric: { lyric: trans || "" }, romalrc: { lyric: "" } },
      });
    } catch (e) {
      return json({ code: 200, data: { lrc: { lyric: "" }, tlyric: { lyric: "" }, romalrc: { lyric: "" } } });
    }
  }

  if (!/^\d+$/.test(songId)) return json({ code: 400, msg: "无效歌曲 ID" }, 400);
  try {
    const r = await fetchJson("https://api.vkeys.cn/v2/music/netease/lyric?id=" + encodeURIComponent(songId));
    const d = r.data && r.data.data;
    if (d && (d.lrc || d.trans || d.roma)) {
      return json({
        code: 200,
        data: {
          lrc: { lyric: stripMeta(d.lrc || "") },
          tlyric: { lyric: stripMeta(d.trans || "") },
          romalrc: { lyric: stripMeta(d.roma || "") },
        },
      });
    }
  } catch (e) {}
  try {
    const r = await fetchJson(
      "https://music-api.gdstudio.xyz/api.php?types=lyric&source=netease&id=" + encodeURIComponent(songId)
    );
    if (r.data && r.data.lyric) {
      return json({
        code: 200,
        data: {
          lrc: { lyric: stripMeta(r.data.lyric || "") },
          tlyric: { lyric: stripMeta(r.data.tlyric || r.data.trans || "") },
          romalrc: { lyric: "" },
        },
      });
    }
  } catch (e) {}
  return json({ code: 200, data: { lrc: { lyric: "" }, tlyric: { lyric: "" }, romalrc: { lyric: "" } } });
}
export async function proxy(endpoint, body) {
  if (endpoint === "getSongUrl") return handleGetSongUrl(body.id, body.level || "exhigh");
  if (endpoint === "getSongInfo") return handleGetSongInfo(body.id);
  if (endpoint === "getSongLyric") return handleGetSongLyric(body.id);
  return json({ code: 404, msg: "未知接口" }, 404);
}
export async function handleCacheGet(key) {
  const safeKey = String(key || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeKey) return json({ ok: false, msg: "无效 key" });
  try {
    const res = await fetch("https://textdb.online/" + encodeURIComponent(safeKey), {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    if (!res.ok) return json({ ok: false, msg: "HTTP " + res.status });
    let val = (await res.text()).trim();
    // 分片
    if (val.indexOf('{"v":2') === 0) {
      try {
        const o = JSON.parse(val);
        if (o && o.v === 2 && o.n > 1) {
          const parts = [];
          for (let i = 0; i < o.n; i++) {
            const r2 = await fetch("https://textdb.online/" + encodeURIComponent(safeKey + "_c" + i), {
              headers: { "User-Agent": UA },
              redirect: "follow",
            });
            if (!r2.ok) return json({ ok: false, msg: "分片 " + i + " 缺失" });
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
  const CHUNK = 1500; // textdb GET URL 安全长度
  async function putOne(k, v) {
    const url =
      "https://textdb.online/update/?key=" +
      encodeURIComponent(k) +
      "&value=" +
      encodeURIComponent(String(v));
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    return res.ok || res.status === 200 || res.status === 201 || res.status === 204;
  }
  try {
    if (val.length <= CHUNK) {
      const ok = await putOne(safeKey, val);
      return json({ ok: !!ok });
    }
    const n = Math.ceil(val.length / CHUNK);
    const metaOk = await putOne(safeKey, JSON.stringify({ v: 2, n: n }));
    if (!metaOk) return json({ ok: false, msg: "元数据写入失败" });
    for (let i = 0; i < n; i++) {
      const part = val.substring(i * CHUNK, (i + 1) * CHUNK);
      const ok = await putOne(safeKey + "_c" + i, part);
      if (!ok) return json({ ok: false, msg: "分片 " + i + " 写入失败" });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}
export async function handleSearch(word) {
  if (!word) return json({ code: 400, msg: "缺少搜索关键词" }, 400);
  const res = await fetch("https://api.vkeys.cn/v2/music/netease?word=" + encodeURIComponent(word));
  const data = await res.json();
  const d = data && data.data;
  let item = null;
  if (Array.isArray(d)) item = d[0];
  else if (d && Array.isArray(d.list)) item = d.list[0];
  else if (d && (d.id || d.songId)) item = d;
  if (!item) return json({ code: 404, msg: "未找到歌曲" }, 404);
  const id = item.id || item.songId;
  const name = item.name || item.song || item.title || word;
  let artist = item.singer || item.artist || "";
  if (Array.isArray(artist)) artist = artist.map((a) => (a && a.name ? a.name : a)).filter(Boolean).join(" / ");
  return json({ code: 200, id: String(id), name, artist: String(artist), pic: item.cover || item.pic || item.picUrl || "" });
}
function extractIdFromUrl(input) {
  const s = String(input || "");
  let m = s.match(/[?&]id=(\d+)/) || s.match(/song\/(\d+)/);
  if (m) return m[1];
  if (/^\d+$/.test(s.trim())) return s.trim();
  return "";
}

export async function handleSearchKg(word) {
  if (!word) return json({ code: 400, msg: "缺少搜索关键词" }, 400);
  const UA2 =
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
  function pick(lists) {
    if (!lists || !lists[0]) return null;
    const it = lists[0];
    const hash = String(it.FileHash || it.fileHash || it.hash || "").toLowerCase().replace(/[^a-f0-9]/g, "");
    if (!/^[a-f0-9]{32}$/.test(hash)) return null;
    let pic = "";
    if (it.Image) pic = String(it.Image).replace("{size}", "400");
    else if (it.TransParam && it.TransParam.union_cover) pic = String(it.TransParam.union_cover).replace("{size}", "400");
    else if (it.trans_param && it.trans_param.union_cover) pic = String(it.trans_param.union_cover).replace("{size}", "400");
    return {
      code: 200,
      id: "kg" + hash,
      name: it.SongName || it.songname || it.filename || word,
      artist: it.SingerName || it.singername || "未知歌手",
      pic,
      duration: it.Duration || it.duration || 0,
      source: "kg",
      hash,
      hqHash: String(it.HQFileHash || "").toLowerCase(),
      sqHash: String(it.SQFileHash || "").toLowerCase(),
    };
  }
  try {
    const url1 =
      "https://songsearch.kugou.com/song_search_v2?keyword=" +
      encodeURIComponent(String(word)) +
      "&page=1&pagesize=5&userid=-1&clientver=&platform=WebFilter";
    const res1 = await fetch(url1, { headers: { "User-Agent": UA2 }, redirect: "follow" });
    const data1 = await res1.json();
    const got1 = pick((data1 && data1.data && data1.data.lists) || []);
    if (got1) return json(got1);
  } catch (e) {}
  try {
    const url2 =
      "http://mobilecdn.kugou.com/api/v3/search/song?format=json&keyword=" +
      encodeURIComponent(String(word)) +
      "&page=1&pagesize=3";
    const res2 = await fetch(url2, { headers: { "User-Agent": UA2 }, redirect: "follow" });
    const data2 = await res2.json();
    const info = (data2 && data2.data && data2.data.info) || [];
    if (info[0] && info[0].hash) {
      const hash = String(info[0].hash).toLowerCase();
      return json({
        code: 200,
        id: "kg" + hash,
        name: info[0].songname || word,
        artist: info[0].singername || "未知歌手",
        pic: "",
        duration: info[0].duration || 0,
        source: "kg",
        hash,
      });
    }
  } catch (e) {}
  return json({ code: 404, msg: "未找到酷狗歌曲" }, 404);
}

export async function handleResolve(rawUrl) {
  if (!rawUrl) return json({ code: 400, msg: "缺少链接" }, 400);
  let id = extractIdFromUrl(rawUrl);
  if (id) return json({ code: 200, id });
  try {
    const res = await fetch(String(rawUrl), { redirect: "follow", headers: { "User-Agent": UA } });
    id = extractIdFromUrl(res.url || "");
    if (id) return json({ code: 200, id });
    id = extractIdFromUrl(await res.text());
    if (id) return json({ code: 200, id });
  } catch (e) { return json({ code: 500, msg: String(e.message || e) }, 500); }
  return json({ code: 404, msg: "无法提取歌曲 ID" }, 404);
}
export async function handleCheckAudio(url) {
  if (!url || !/^https?:\/\//i.test(url)) return json({ ok: false, msg: "无效链接" });
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-2047", "User-Agent": UA }, redirect: "follow" });
    try { if (res.body) { const r = res.body.getReader(); await r.read(); await r.cancel(); } } catch (e) {}
    const ct = (res.headers.get("Content-Type") || "").toLowerCase();
    let format = "";
    if (ct.indexOf("mpeg") !== -1 || ct.indexOf("mp3") !== -1) format = "mp3";
    else if (ct.indexOf("flac") !== -1) format = "flac";
    else if (ct.indexOf("mp4") !== -1 || ct.indexOf("m4a") !== -1) format = "m4a";
    return json({ ok: res.ok || res.status === 206, format, url: res.url || url, status: res.status, contentType: ct });
  } catch (e) { return json({ ok: false, msg: String(e.message || e) }); }
}
export async function handleDownload(targetUrl, name, req) {
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) return json({ ok: false, msg: "无效下载链接" }, 400);
  const headers = { "User-Agent": UA };
  const range = req && req.headers && req.headers.get("Range");
  if (range) headers["Range"] = range;
  const res = await fetch(targetUrl, { headers, redirect: "follow" });
  const respHeaders = new Headers();
  for (const h of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const v = res.headers.get(h); if (v) respHeaders.set(h, v);
  }
  respHeaders.set("Access-Control-Allow-Origin", "*");
  let fname = String(name || "download").replace(/[\r\n"\\]/g, "_");
  respHeaders.set("Content-Disposition", 'attachment; filename="' + fname.replace(/[^\x20-\x7E]/g, "_") + '"');
  return new Response(res.body, { status: res.status, headers: respHeaders });
}
export async function handleOfficialResolve(id) {
  const songId = String(id || "").trim();
  if (!songId || !/^\d+$/.test(songId)) return json({ ok: false, msg: "无效歌曲 ID" });
  const resolveUrl = "https://ebnr.xiyang6666.top/resolve/https://music.163.com/song?id=" + encodeURIComponent(songId);
  try {
    const res = await fetch(resolveUrl, { redirect: "manual", headers: { "User-Agent": UA } });
    let audioUrl = res.headers.get("Location") || "";
    if (!audioUrl && res.ok) {
      try { const data = await res.json(); audioUrl = data.url || (data.data && data.data.url) || ""; } catch (e) {}
    }
    if (!audioUrl) audioUrl = resolveUrl;
    return json({ ok: true, url: upgradeNeteaseUrl(audioUrl), expi: 1200, level: "official" });
  } catch (e) { return json({ ok: false, msg: String(e.message || e) }); }
}

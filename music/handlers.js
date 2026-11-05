// ==================== 基础工具 ====================
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    try {
      return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch {
      return { ok: res.ok, status: res.status, data: null, text };
    }
  } catch (e) {
    return { ok: false, status: 0, data: null, error: String(e.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

function pickUrl(obj) {
  if (!obj) return "";
  if (typeof obj === "string" && /^https?:\/\//i.test(obj)) return obj;
  return (
    obj.url ||
    (obj.data && obj.data.url) ||
    (Array.isArray(obj.data) && obj.data[0] && obj.data[0].url) ||
    ""
  );
}

/** 把网易 CDN 的 http 升级为 https，避免 HTTPS 页面混合内容被拦截导致一直加载 */
function upgradeNeteaseUrl(url) {
  if (!url || typeof url !== "string") return url;
  return url.replace(
    /^http:\/\/(([a-z0-9.-]+)\.music\.126\.net)\//i,
    "https://$1/"
  );
}

// ==================== 墨澜风格网易云多后端 ====================
const WY_URL_BACKENDS = [
  {
    name: "ikun(c.wwwweb.top)",
    fetch: async (id, quality) => {
      const r = await fetchJson("https://c.wwwweb.top/music/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "lx-music-request/2.9.0",
        },
        body: JSON.stringify({ source: "wy", musicId: String(id), quality }),
      });
      if (r.data && Number(r.data.code) === 200 && r.data.url) return r.data.url;
      throw new Error((r.data && r.data.message) || "ikun 无结果");
    },
  },
  {
    name: "星海(yy.zddyr.top)",
    fetch: async (id, quality) => {
      const url =
        "https://yy.zddyr.top/lx/api/?source=wy&songmid=" +
        encodeURIComponent(id) +
        "&quality=" +
        encodeURIComponent(quality);
      const r = await fetchJson(url, {
        method: "GET",
        headers: { "User-Agent": "lx-music-desktop/2.10.1" },
      });
      const u = pickUrl(r.data);
      if (u) return u;
      throw new Error((r.data && (r.data.msg || r.data.message)) || "星海 无结果");
    },
  },
];

/**
 * 严格按前端 level 映射音质：
 * - lossless → flac（下载「无损」）
 * - exhigh   → 320k（播放/下载「极高」）
 * - standard → 128k（播放/下载「标准」）
 */
function qualitiesForLevel(level) {
  const lv = String(level || "").toLowerCase();
  if (lv === "lossless" || lv === "flac" || lv === "hires") return ["flac"];
  if (lv === "exhigh" || lv === "320k" || lv === "higher") return ["320k"];
  if (lv === "standard" || lv === "128k") return ["128k"];
  // 未知 level：只给可播的 320k，避免误返回超大 flac
  return ["320k"];
}

/**
 * 获取播放/下载链接
 * 返回结构兼容前端 extractUrl / extractExpi
 */
export async function handleGetSongUrl(id, level = "exhigh") {
  const songId = String(id || "").trim();
  if (!songId || !/^\d+$/.test(songId)) {
    return json({ code: 400, msg: "无效歌曲 ID" }, 400);
  }

  const qualities = qualitiesForLevel(level);
  const errors = [];

  for (const q of qualities) {
    for (const backend of WY_URL_BACKENDS) {
      try {
        let url = await backend.fetch(songId, q);
        url = upgradeNeteaseUrl(url);
        if (url && /^https?:\/\//i.test(url)) {
          return json({
            code: 200,
            data: {
              url,
              expi: 1200,
              level: q,
              br: q === "flac" ? 999000 : q === "320k" ? 320000 : 128000,
            },
          });
        }
      } catch (e) {
        errors.push(backend.name + "/" + q + ": " + (e.message || e));
      }
    }
  }

  return json(
    {
      code: 404,
      msg: "暂无可用音源",
      debug: errors.slice(0, 6),
    },
    404
  );
}

/**
 * 歌曲信息：官方接口优先
 */
export async function handleGetSongInfo(id) {
  const songId = String(id || "").trim();
  if (!songId || !/^\d+$/.test(songId)) {
    return json({ code: 400, msg: "无效歌曲 ID" }, 400);
  }

  try {
    const r = await fetchJson(
      "https://music.163.com/api/song/detail?ids=[" + songId + "]",
      {
        method: "GET",
        headers: { "User-Agent": UA, Referer: "https://music.163.com/" },
      }
    );
    const songs = r.data && r.data.songs;
    if (Array.isArray(songs) && songs[0] && songs[0].name) {
      return json({ code: 200, data: { songs: [songs[0]] } });
    }
  } catch (e) {}

  try {
    const r = await fetchJson(
      "https://interface.music.163.com/api/song/detail?ids=[" + songId + "]",
      {
        method: "GET",
        headers: { "User-Agent": UA, Referer: "https://music.163.com/" },
      }
    );
    const songs = r.data && r.data.songs;
    if (Array.isArray(songs) && songs[0] && songs[0].name) {
      return json({ code: 200, data: { songs: [songs[0]] } });
    }
  } catch (e) {}

  return json({
    code: 200,
    data: {
      songs: [
        {
          id: Number(songId) || songId,
          name: "",
          ar: [{ name: "" }],
          al: { picUrl: "" },
          dt: 0,
        },
      ],
    },
  });
}

/**
 * 歌词：官方优先，vkeys 备用
 */
export async function handleGetSongLyric(id) {
  const songId = String(id || "").trim();
  if (!songId || !/^\d+$/.test(songId)) {
    return json({ code: 400, msg: "无效歌曲 ID" }, 400);
  }

  try {
    const r = await fetchJson(
      "https://music.163.com/api/song/lyric?id=" +
        songId +
        "&lv=1&tv=1&rv=1&yv=1",
      {
        method: "GET",
        headers: { "User-Agent": UA, Referer: "https://music.163.com/" },
      }
    );
    if (r.data && (r.data.lrc || r.data.tlyric || r.data.romalrc)) {
      return json({ code: 200, data: r.data });
    }
  } catch (e) {}

  try {
    const r = await fetchJson(
      "https://api.vkeys.cn/v2/music/netease/lyric?id=" +
        encodeURIComponent(songId),
      { method: "GET", headers: { "User-Agent": UA } }
    );
    const d = r.data && r.data.data;
    if (d && (d.lrc || d.trans || d.roma)) {
      return json({
        code: 200,
        data: {
          lrc: { lyric: d.lrc || "" },
          tlyric: { lyric: d.trans || "" },
          romalrc: { lyric: d.roma || "" },
        },
      });
    }
  } catch (e) {}

  return json({
    code: 200,
    data: {
      lrc: { lyric: "" },
      tlyric: { lyric: "" },
      romalrc: { lyric: "" },
    },
  });
}

// 兼容旧 proxy 调用
export async function proxy(endpoint, body) {
  if (endpoint === "getSongUrl") {
    return handleGetSongUrl(body.id, body.level || "exhigh");
  }
  if (endpoint === "getSongInfo") {
    return handleGetSongInfo(body.id);
  }
  if (endpoint === "getSongLyric") {
    return handleGetSongLyric(body.id);
  }
  return json({ code: 404, msg: "未知接口: " + endpoint }, 404);
}

// ==================== 缓存（textdb） ====================
export async function handleCacheGet(key) {
  if (!key) return json({ ok: false, msg: "缺少 key" });
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeKey) return json({ ok: false, msg: "无效 key" });
  try {
    const res = await fetch("https://textdb.online/" + safeKey, {
      method: "GET",
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    if (!res.ok) return json({ ok: false, msg: "HTTP " + res.status });
    const text = await res.text();
    return json({ ok: true, value: text.trim() });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

export async function handleCacheSet(key, value) {
  if (!key || value === undefined || value === null)
    return json({ ok: false, msg: "缺少参数" });
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeKey) return json({ ok: false, msg: "无效 key" });
  const val = String(value);
  try {
    const url =
      "https://textdb.online/update/?key=" +
      encodeURIComponent(safeKey) +
      "&value=" +
      encodeURIComponent(val);
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch (e) {}
    const check = await fetch("https://textdb.online/" + safeKey, {
      method: "GET",
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    const got = (await check.text()).trim();
    const ok =
      got === val.trim() ||
      got.indexOf(val.trim().slice(0, Math.min(80, val.length))) === 0;
    if (!ok) {
      return json({
        ok: false,
        msg: "写入校验失败",
        debug: (bodyText || "").slice(0, 120),
      });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

// ==================== 搜索（保持原逻辑，vkeys） ====================
export async function handleSearch(word) {
  if (!word) return json({ code: 400, msg: "缺少搜索关键词" }, 400);

  const res = await fetch(
    "https://api.vkeys.cn/v2/music/netease?word=" + encodeURIComponent(word)
  );
  const data = await res.json();

  const d = data && data.data;
  let item = null;
  if (Array.isArray(d)) item = d[0];
  else if (d && Array.isArray(d.list)) item = d.list[0];
  else if (d && Array.isArray(d.songs)) item = d.songs[0];
  else if (d && (d.id || d.songId)) item = d;
  else if (d && d.data && (d.data.id || d.data.songId)) item = d.data;

  if (!item) return json({ code: 404, msg: "未找到歌曲" }, 404);

  const id = item.id || item.songId || item.song_id;
  const name = item.name || item.song || item.title || item.songName || word;

  let artist = item.singer || item.artist || item.artists || item.ar || "";
  if (Array.isArray(artist)) {
    artist = artist
      .map((a) => (a && a.name ? a.name : a))
      .filter(Boolean)
      .join(" / ");
  } else if (artist && typeof artist === "object") {
    artist = artist.name || "";
  }

  const pic =
    item.cover ||
    item.pic ||
    item.picUrl ||
    item.picture ||
    item.coverUrl ||
    (item.al && item.al.picUrl) ||
    (item.album && item.album.picUrl) ||
    "";

  return json({
    code: 200,
    id: String(id),
    name,
    artist: String(artist),
    pic,
  });
}

// ==================== 链接解析 / 音频检测 / 下载 / 官方解析 ====================
function extractUrlFromText(text) {
  const m = String(text || "").match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0] : "";
}

function extractIdFromUrl(input) {
  const s = String(input || "");
  let m = s.match(/[?&]id=(\d+)/);
  if (m) return m[1];
  m = s.match(/song\/(\d+)/);
  if (m) return m[1];
  m = s.match(/music\.163\.com\/#\/song\?id=(\d+)/);
  if (m) return m[1];
  m = s.match(/y\.music\.163\.com\/m\/song\?id=(\d+)/);
  if (m) return m[1];
  m = s.match(/163cn\.tv\/[^\s]*?id=(\d+)/);
  if (m) return m[1];
  if (/^\d+$/.test(s.trim())) return s.trim();
  return "";
}

function getFormatFromUrl(urlLower) {
  const u = String(urlLower || "").split("?")[0];
  const ext = u.split(".").pop() || "";
  const map = {
    mp3: "mp3",
    m4a: "m4a",
    aac: "aac",
    flac: "flac",
    wav: "wav",
    ogg: "ogg",
    opus: "opus",
    wma: "wma",
    weba: "weba",
    mka: "mka",
    aiff: "aiff",
    mp4: "mp4",
    m4v: "m4v",
    flv: "flv",
    wmv: "wmv",
    mkv: "mkv",
    webm: "webm",
    mov: "mov",
    avi: "avi",
    ts: "ts",
    "3gp": "3gp",
    "3g2": "3g2",
    ogv: "ogv",
    mpg: "mpg",
    vob: "vob",
    m3u8: "m3u8",
  };
  return map[ext] || "";
}

export async function handleResolve(rawUrl) {
  if (!rawUrl) return json({ code: 400, msg: "缺少链接" }, 400);

  const link = extractUrlFromText(rawUrl) || String(rawUrl);

  let id = extractIdFromUrl(link);
  if (id) return json({ code: 200, id });

  try {
    const res = await fetch(link, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": UA },
    });
    const location = res.headers.get("Location");
    if (location) {
      id = extractIdFromUrl(location);
      if (id) return json({ code: 200, id });
    }
    try {
      if (res.body) await res.body.cancel();
    } catch (e) {}
  } catch (e) {}

  try {
    const res = await fetch(link, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": UA },
    });
    id = extractIdFromUrl(res.url || "");
    if (id) {
      try {
        if (res.body) await res.body.cancel();
      } catch (e) {}
      return json({ code: 200, id });
    }
    const finalUrl = String(res.url || "").toLowerCase();
    const isNetease =
      finalUrl.indexOf("music.163.com") !== -1 ||
      finalUrl.indexOf("163cn.tv") !== -1 ||
      finalUrl.indexOf("y.music.163.com") !== -1;
    if (isNetease) {
      try {
        const text = await res.text();
        id = extractIdFromUrl(text);
        if (id) return json({ code: 200, id });
      } catch (e) {}
    } else {
      try {
        if (res.body) await res.body.cancel();
      } catch (e) {}
    }
  } catch (e) {
    return json({ code: 500, msg: "链接解析失败: " + e.message }, 500);
  }

  return json({ code: 404, msg: "无法从链接中提取歌曲 ID" }, 404);
}

export async function handleCheckAudio(url) {
  if (!url) return json({ ok: false, msg: "缺少链接" });
  const u = String(url).toLowerCase();
  if (u.indexOf("http://") !== 0 && u.indexOf("https://") !== 0) {
    return json({ ok: false, msg: "无效链接" });
  }

  try {
    const urlLower0 = String(url).toLowerCase();
    const reqHeaders = {
      Range: "bytes=0-2047",
      "User-Agent": UA,
    };
    if (
      urlLower0.indexOf("bilivideo.com") !== -1 ||
      urlLower0.indexOf("bilibili.com") !== -1 ||
      urlLower0.indexOf("hdslb.com") !== -1
    ) {
      reqHeaders["Referer"] = "https://www.bilibili.com/";
      reqHeaders["Origin"] = "https://www.bilibili.com";
    }
    const res = await fetch(url, {
      method: "GET",
      headers: reqHeaders,
      redirect: "follow",
    });

    try {
      if (res.body) {
        const reader = res.body.getReader();
        await reader.read();
        try {
          await reader.cancel();
        } catch (e) {}
      }
    } catch (e) {}

    const rawCt = res.headers.get("Content-Type") || "";
    const ct = rawCt.toLowerCase().split(";")[0].trim();
    const finalUrl = res.url || url;
    const urlLower = finalUrl.toLowerCase();

    const CT_MAP = {
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/x-mp3": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/m4a": "m4a",
      "audio/aac": "aac",
      "audio/x-aac": "aac",
      "audio/aacp": "aac",
      "audio/flac": "flac",
      "audio/x-flac": "flac",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/wave": "wav",
      "audio/vnd.wave": "wav",
      "audio/ogg": "ogg",
      "application/ogg": "ogg",
      "application/x-ogg": "ogg",
      "audio/opus": "opus",
      "audio/x-opus+ogg": "opus",
      "audio/x-ms-wma": "wma",
      "audio/wma": "wma",
      "audio/webm": "weba",
      "audio/x-matroska": "mka",
      "audio/aiff": "aiff",
      "audio/x-aiff": "aiff",
      "video/mp4": "mp4",
      "video/x-m4v": "m4v",
      "video/x-flv": "flv",
      "video/flv": "flv",
      "video/x-ms-wmv": "wmv",
      "video/wmv": "wmv",
      "video/x-ms-asf": "wmv",
      "video/x-matroska": "mkv",
      "video/webm": "webm",
      "video/quicktime": "mov",
      "video/x-msvideo": "avi",
      "video/avi": "avi",
      "video/mp2t": "ts",
      "video/3gpp": "3gp",
      "video/3gpp2": "3g2",
      "video/ogg": "ogv",
      "video/mpeg": "mpg",
      "video/x-ms-vob": "vob",
      "application/vnd.apple.mpegurl": "m3u8",
      "application/x-mpegurl": "m3u8",
      "application/mpegurl": "m3u8",
      "audio/mpegurl": "m3u8",
      "audio/x-mpegurl": "m3u8",
      "application/vnd.apple.mpegurl.audio": "m3u8",
    };

    const extFormat = getFormatFromUrl(urlLower);
    let format = CT_MAP[ct] || "";

    if (!format) {
      const isGeneric =
        !ct ||
        ct === "application/octet-stream" ||
        ct === "binary/octet-stream" ||
        ct === "application/download" ||
        ct === "application/force-download" ||
        ct === "application/x-download";
      if (isGeneric && extFormat) format = extFormat;
    }
    if (
      !format &&
      (ct.indexOf("audio/") === 0 || ct.indexOf("video/") === 0) &&
      extFormat
    ) {
      format = extFormat;
    }
    if (!format && res.ok) format = extFormat || "unknown";

    const ok = res.ok || res.status === 206;
    let name = "";
    try {
      const cd = res.headers.get("Content-Disposition") || "";
      const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
      if (m) name = decodeURIComponent(m[1].replace(/["']$/, ""));
    } catch (e) {}

    return json({
      ok,
      format: format || "",
      url: finalUrl,
      name,
      status: res.status,
      contentType: rawCt,
    });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

export async function handleDownload(targetUrl, name, req) {
  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return json({ ok: false, msg: "无效下载链接" }, 400);
  }

  const range = req && req.headers ? req.headers.get("Range") : null;
  const headers = { "User-Agent": UA };
  if (range) headers["Range"] = range;

  const urlLower = targetUrl.toLowerCase();
  if (
    urlLower.indexOf("bilivideo.com") !== -1 ||
    urlLower.indexOf("bilibili.com") !== -1 ||
    urlLower.indexOf("hdslb.com") !== -1
  ) {
    headers["Referer"] = "https://www.bilibili.com/";
    headers["Origin"] = "https://www.bilibili.com";
  }

  const res = await fetch(targetUrl, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  const respHeaders = new Headers();
  const pass = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ];
  for (const h of pass) {
    const v = res.headers.get(h);
    if (v) respHeaders.set(h, v);
  }
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Expose-Headers", "*");

  let fname = String(name || "").trim();
  if (!fname) {
    try {
      const uo = new URL(res.url || targetUrl);
      const segs = uo.pathname.split("/");
      fname = decodeURIComponent(segs[segs.length - 1] || "") || "download";
    } catch (e) {
      fname = "download";
    }
  }
  fname = fname.replace(/[\r\n"\\]/g, "_");
  const asciiFallback = fname.replace(/[^\x20-\x7E]/g, "_");
  respHeaders.set(
    "Content-Disposition",
    'attachment; filename="' +
      asciiFallback +
      "\"; filename*=UTF-8''" +
      encodeURIComponent(fname)
  );

  return new Response(res.body, {
    status: res.status,
    headers: respHeaders,
  });
}

export async function handleOfficialResolve(id) {
  const songId = String(id || "").trim();
  if (!songId || !/^\d+$/.test(songId)) {
    return json({ ok: false, msg: "无效歌曲 ID" });
  }
  const resolveUrl =
    "https://ebnr.xiyang6666.top/resolve/https://music.163.com/song?id=" +
    encodeURIComponent(songId);
  try {
    const res = await fetch(resolveUrl, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": UA },
    });
    let audioUrl = "";
    if (res.status >= 300 && res.status < 400) {
      audioUrl =
        res.headers.get("Location") || res.headers.get("location") || "";
    } else if (res.ok) {
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.indexOf("json") !== -1) {
        try {
          const data = await res.json();
          audioUrl = data.url || data.data?.url || data.audio || "";
        } catch (e) {}
      } else if (ct.indexOf("audio") !== -1 || ct.indexOf("mpeg") !== -1) {
        audioUrl = resolveUrl;
      } else {
        audioUrl = res.headers.get("Location") || "";
      }
    }
    if (!audioUrl || !/^https?:\/\//i.test(audioUrl)) {
      audioUrl = resolveUrl;
    }
    audioUrl = upgradeNeteaseUrl(audioUrl);
    return json({ ok: true, url: audioUrl, expi: 1200, level: "official" });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

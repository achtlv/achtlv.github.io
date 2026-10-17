import { HTML } from './frontend.js';
import { handleIcon, MANIFEST_JSON, SW_CODE } from './assets.js';
import { RESOLVER_SCRIPT } from './resolver.js';
import { STATE_SCRIPT } from './frontend-js-state.js';
import { UTILS_SCRIPT } from './frontend-js-utils.js';
import { LYRIC_SCRIPT } from './frontend-js-lyric.js';
import { PLAYER_SCRIPT } from './frontend-js-player.js';
import {
  handleSearch,
  handleResolve,
  handleCheckAudio,
  handleCacheGet,
  handleCacheSet,
  handleDownload,
  proxy,
} from './handlers.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Range",
        },
      });
    }

    // ==================== 页面与资源路由 ====================
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    if (url.pathname === "/manifest.json") {
      return new Response(JSON.stringify(MANIFEST_JSON), {
        headers: {
          "Content-Type": "application/manifest+json;charset=UTF-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    if (url.pathname === "/sw.js") {
      return new Response(SW_CODE, {
        headers: {
          "Content-Type": "application/javascript;charset=UTF-8",
          "Cache-Control": "no-cache",
          "Service-Worker-Allowed": "/",
        },
      });
    }

    if (url.pathname === "/icon.png") {
      return await handleIcon();
    }

    // ==================== 前端模块化 JS 路由 ====================
    if (url.pathname === "/resolver.js") {
      return new Response(RESOLVER_SCRIPT, {
        headers: { "Content-Type": "application/javascript;charset=UTF-8", "Cache-Control": "no-cache" },
      });
    }

    if (url.pathname === "/frontend-js-state.js") {
      return new Response(STATE_SCRIPT, {
        headers: { "Content-Type": "application/javascript;charset=UTF-8", "Cache-Control": "no-cache" },
      });
    }

    if (url.pathname === "/frontend-js-utils.js") {
      return new Response(UTILS_SCRIPT, {
        headers: { "Content-Type": "application/javascript;charset=UTF-8", "Cache-Control": "no-cache" },
      });
    }

    if (url.pathname === "/frontend-js-lyric.js") {
      return new Response(LYRIC_SCRIPT, {
        headers: { "Content-Type": "application/javascript;charset=UTF-8", "Cache-Control": "no-cache" },
      });
    }

    if (url.pathname === "/frontend-js-player.js") {
      return new Response(PLAYER_SCRIPT, {
        headers: { "Content-Type": "application/javascript;charset=UTF-8", "Cache-Control": "no-cache" },
      });
    }

    // ==================== API 路由 ====================
    if (url.pathname === "/api/download") {
      return await handleDownload(
        url.searchParams.get("u") || "",
        url.searchParams.get("name") || "",
        request
      );
    }

    if (request.method !== "POST") {
      return new Response("Not Found", { status: 404 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (e) {}

    const action = url.pathname.replace(/^\/api\//, "");
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";

    try {
      if (action === "search") return await handleSearch(body.word || "");
      if (action === "resolve") return await handleResolve(body.url || "");
      if (action === "checkAudio") return await handleCheckAudio(body.url || "");
      if (action === "cacheGet") return await handleCacheGet(body.key || "");
      if (action === "cacheSet") return await handleCacheSet(body.key || "", body.value || "");

      if (action === "getSongInfo") {
        return await proxy("getSongInfo", { id: body.id, timestamp: Date.now(), ip });
      }
      if (action === "getSongUrl") {
        return await proxy("getSongUrl", {
          id: body.id,
          level: body.level || "exhigh",
          timestamp: Date.now(),
          ip,
        });
      }
      if (action === "getSongLyric") {
        return await proxy("getSongLyric", { id: body.id, timestamp: Date.now(), ip });
      }
    } catch (e) {
      return new Response(JSON.stringify({ code: 500, msg: e.message || "Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
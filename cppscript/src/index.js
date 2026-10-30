// index.js
import { fail, HttpError } from './errors.js';
import { parse } from './parser.js';
import { Interpreter } from './interpreter.js';
import { resolveInput, InputStream } from './input.js';

/** 文档 HTML：优先 env.DOCS_URL，否则 GitHub raw */
const DEFAULT_DOCS_URL =
  'https://raw.githubusercontent.com/achtlv/achtlv.github.io/main/cppscript/index.html';

const THEME_CSS = `
:root {
  color-scheme: light dark;
  --bg: #f6f8fb;
  --panel: #ffffff;
  --text: #1a2332;
  --muted: #5a6a82;
  --accent: #2563eb;
  --code-bg: #eef2f7;
  --border: #d0d7e2;
  --ok: #15803d;
  --err: #b91c1c;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f1419;
    --panel: #1a2332;
    --text: #e7ecf3;
    --muted: #8b9bb4;
    --accent: #3d8bfd;
    --code-bg: #0b1220;
    --border: #2a3548;
    --ok: #3dd68c;
    --err: #f87171;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.55;
}
.wrap { max-width: 920px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }
header {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 1rem;
  margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);
}
header h1 { font-size: 1.15rem; margin: 0; font-weight: 650; }
header .meta { color: var(--muted); font-size: 0.85rem; }
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 0.85rem;
}
.card h2 { font-size: 0.8rem; margin: 0 0 0.5rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.card pre, .out {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.88rem;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--code-bg);
  border-radius: 8px;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--border);
  min-height: 1.5em;
}
a { color: var(--accent); }
.badge {
  display: inline-block; font-size: 0.75rem; padding: 0.15rem 0.5rem;
  border-radius: 999px; border: 1px solid var(--border); color: var(--muted);
}
.badge.ok { color: var(--ok); border-color: var(--ok); }
.badge.err { color: var(--err); border-color: var(--err); }
.foot { margin-top: 1rem; color: var(--muted); font-size: 0.8rem; }
`.trim();

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function runPageShell({ title, statusLabel, statusClass, ruleUrl, inputPreview, bodyHtml, redirectUrl }) {
  const redirectScript = redirectUrl
    ? `<script>setTimeout(function(){ location.replace(${JSON.stringify(redirectUrl)}); }, 800);</script>`
    : '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>${escapeHtml(title)}</title>
<style>${THEME_CSS}</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>CppScript</h1>
    <span class="badge ${statusClass || ''}">${escapeHtml(statusLabel || '')}</span>
    <span class="meta">主题随系统自动切换（prefers-color-scheme）</span>
  </header>
  <div class="card">
    <h2>规则 ?url=</h2>
    <pre>${escapeHtml(ruleUrl || '')}</pre>
  </div>
  ${
    inputPreview != null && inputPreview !== ''
      ? `<div class="card"><h2>输入</h2><pre>${escapeHtml(inputPreview)}</pre></div>`
      : ''
  }
  <div class="card">
    <h2>输出</h2>
    <pre class="out" id="out">${bodyHtml || ''}</pre>
  </div>
  ${
    redirectUrl
      ? `<div class="card"><h2>即将跳转</h2><pre><a href="${escapeHtml(redirectUrl)}">${escapeHtml(redirectUrl)}</a></pre></div>`
      : ''
  }
  <p class="foot"><a href="/">文档</a> · CppScript v14.2</p>
</div>
${redirectScript}
</body>
</html>`;
}

async function serveDocs(env) {
  const docsUrl = (env && env.DOCS_URL) || DEFAULT_DOCS_URL;
  try {
    const res = await fetch(docsUrl, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      let html = await res.text();
      if (!/color-scheme/i.test(html.slice(0, 800))) {
        html = html.replace(
          /<head[^>]*>/i,
          (m) => `${m}\n<meta name="color-scheme" content="light dark" />`,
        );
      }
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }
  } catch {
    // fall through
  }
  const fallback = `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="color-scheme" content="light dark"/>
<title>CppScript</title><style>${THEME_CSS}</style></head><body>
<div class="wrap"><header><h1>CppScript v14.2</h1></header>
<div class="card"><h2>用法</h2>
<pre>/?url=&lt;规则文件URL&gt;&amp;key=...&amp;in=...</pre></div>
<p class="foot">文档加载失败，请检查 DOCS_URL 或仓库 index.html</p>
</div></body></html>`;
  return new Response(fallback, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ruleUrl = url.searchParams.get('url');

    // 无 ?url=：直接显示文档 HTML（自动夜间模式）
    if (!ruleUrl && (url.pathname === '/' || url.pathname === '/index.html')) {
      return serveDocs(env);
    }

    try {
      if (!ruleUrl) fail(400, 'missing ?url=', 'E41');

      let ruleText;
      try {
        const ruleRes = await fetch(ruleUrl, { signal: AbortSignal.timeout(10000) });
        if (!ruleRes.ok) fail(502, `rule fetch failed: ${ruleRes.status}`);
        ruleText = await ruleRes.text();
      } catch (e) {
        if (e instanceof HttpError) throw e;
        fail(502, `rule fetch error: ${e.message}`);
      }
      if (ruleText.length > 100 * 1024) fail(502, 'rule exceeds 100KB');

      const ast = parse(ruleText);
      const inputText = await resolveInput(request, url, env);
      const inputStream = new InputStream(inputText);

      return await executeAndRespond(ast, {
        url,
        env,
        inputStream,
        ruleUrl,
        inputPreview: inputText.length > 4000 ? inputText.slice(0, 4000) + '\n…' : inputText,
      });
    } catch (e) {
      if (e instanceof HttpError) {
        const page = runPageShell({
          title: `CppScript · ${e.code || e.status}`,
          statusLabel: `错误 ${e.code || e.status}`,
          statusClass: 'err',
          ruleUrl: ruleUrl || '',
          bodyHtml: escapeHtml(e.message),
        });
        return new Response(page, {
          status: e.status || 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      const page = runPageShell({
        title: 'CppScript · error',
        statusLabel: '内部错误',
        statusClass: 'err',
        ruleUrl: ruleUrl || '',
        bodyHtml: escapeHtml(e.message || String(e)),
      });
      return new Response(page, {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  },
};

/**
 * 双路响应：
 * - 从未 out → buffer：若 return URL 则 HTML 提示后自动跳转；否则 HTML 渲染输出
 * - 调用过 out → 流式：HTML 壳 + 实时推送（转义）
 */
function executeAndRespond(ast, ctx) {
  return new Promise((resolve, reject) => {
    let streamActivated = false;
    let streamController = null;
    const enc = new TextEncoder();

    const interp = new Interpreter(ast, {
      ...ctx,
      onChunk: (delta) => {
        if (!streamActivated) {
          streamActivated = true;
          let ctrl;
          const stream = new ReadableStream({
            start(c) {
              ctrl = c;
              const head = runPageShell({
                title: 'CppScript · running',
                statusLabel: '流式输出',
                statusClass: 'ok',
                ruleUrl: ctx.ruleUrl,
                inputPreview: ctx.inputPreview,
                bodyHtml: '',
              });
              const marker = '<pre class="out" id="out">';
              const idx = head.indexOf(marker);
              const prefix = idx >= 0 ? head.slice(0, idx + marker.length) : head;
              ctrl.enqueue(enc.encode(prefix));
              streamController = ctrl;
              streamController._suffix =
                idx >= 0 ? head.slice(idx + marker.length) : '\n</body></html>';
            },
          });
          streamController = ctrl;
          resolve({ streamActivated: true, stream });
        }
        try {
          streamController.enqueue(enc.encode(escapeHtml(delta)));
        } catch {
          // 客户端断开
        }
      },
    });

    (async () => {
      try {
        const result = await interp.run();

        if (streamActivated) {
          if (result.redirect) {
            try {
              streamController.enqueue(
                enc.encode(escapeHtml(`\n[E47: cannot redirect after out()]\n`)),
              );
            } catch {}
          }
          try {
            streamController.enqueue(enc.encode(streamController._suffix || ''));
          } catch {}
          try {
            streamController.close();
          } catch {}
        } else {
          resolve({
            streamActivated: false,
            result,
            output: interp.output,
          });
        }
      } catch (e) {
        if (streamActivated) {
          try {
            streamController.enqueue(
              enc.encode(escapeHtml(`\n[error: ${e.message || e}]\n`)),
            );
            streamController.enqueue(enc.encode(streamController._suffix || ''));
          } catch {}
          try {
            streamController.close();
          } catch {}
        } else {
          reject(e);
        }
      }
    })();
  }).then((r) => {
    if (r.streamActivated) {
      return new Response(r.stream, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // buffer：返回 URL → HTML 展示后自动跳转
    if (r.result.redirect) {
      const page = runPageShell({
        title: 'CppScript · redirect',
        statusLabel: `跳转 ${r.result.status || 302}`,
        statusClass: 'ok',
        ruleUrl: ctx.ruleUrl,
        inputPreview: ctx.inputPreview,
        bodyHtml: escapeHtml(r.output || '(无 body 输出)'),
        redirectUrl: r.result.url,
      });
      return new Response(page, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          Location: r.result.url,
        },
      });
    }

    // 纯输出：HTML 渲染
    const page = runPageShell({
      title: 'CppScript · result',
      statusLabel: `完成 ${r.result.status || 200}`,
      statusClass: 'ok',
      ruleUrl: ctx.ruleUrl,
      inputPreview: ctx.inputPreview,
      bodyHtml: escapeHtml(r.output || ''),
    });
    return new Response(page, {
      status: r.result.status || 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });
}

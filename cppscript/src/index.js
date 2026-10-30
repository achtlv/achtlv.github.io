// index.js
import { fail, HttpError } from './errors.js';
import { parse } from './parser.js';
import { Interpreter } from './interpreter.js';
import { resolveInput, InputStream } from './input.js';

// 文档见同目录 index.html（CppScript v14.2 语法规范）

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(
        'CppScript v14.2 — see index.html for the full language reference.\nUsage: /?url=<rule-file-url>&key=...&in=...\n',
        { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
      );
    }

    try {
      // 参数：?url=（不要求 .txt，只要是文本）
      const ruleUrl = url.searchParams.get('url');
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

      // 输入流：?in=
      const inputText = await resolveInput(request, url, env);
      const inputStream = new InputStream(inputText);

      return await executeAndRespond(ast, { url, env, inputStream });
    } catch (e) {
      if (e instanceof HttpError) {
        return new Response(e.message, {
          status: e.status,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      return new Response(`internal error: ${e.message}`, { status: 500 });
    }
  },
};

/**
 * 双路响应：
 * - 脚本从未调用 out → buffer 模式（302 / 200 + body）
 * - 脚本调用过 out → 流式模式（Response 立即 200，out 实时推送）
 */
function executeAndRespond(ast, ctx) {
  return new Promise((resolve, reject) => {
    let streamActivated = false;
    let streamController = null;

    const interp = new Interpreter(ast, {
      ...ctx,
      onChunk: (delta) => {
        if (!streamActivated) {
          streamActivated = true;
          let ctrl;
          const stream = new ReadableStream({
            start(c) { ctrl = c; },
          });
          streamController = ctrl;
          resolve({ streamActivated: true, stream });
        }
        try {
          streamController.enqueue(new TextEncoder().encode(delta));
        } catch {
          // 客户端断开，忽略
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
                new TextEncoder().encode(`\n[E47: cannot redirect after out()]\n`)
              );
            } catch {}
          }
          try { streamController.close(); } catch {}
        } else {
          resolve({ streamActivated: false, result, output: interp.output });
        }
      } catch (e) {
        if (streamActivated) {
          try {
            streamController.enqueue(
              new TextEncoder().encode(`\n[error: ${e.message || e}]\n`)
            );
          } catch {}
          try { streamController.close(); } catch {}
        } else {
          reject(e);
        }
      }
    })();
  }).then((r) => {
    if (r.streamActivated) {
      return new Response(r.stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (r.result.redirect) {
      const headers = { Location: r.result.url };
      for (const [k, v] of Object.entries(r.result.headers || {})) {
        if (k.toLowerCase() !== 'content-type') headers[k] = v;
      }
      return new Response(null, {
        status: r.result.status || 302,
        headers,
      });
    }

    return new Response(r.output, {
      status: r.result.status || 200,
      headers: r.result.headers || { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  });
}
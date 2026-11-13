// input.js
import { fail } from './errors.js';
import { assertSafeUrl } from './sandbox.js';

/**
 * 输入流来源（优先级）：
 * 1. ?in= 参数（URL 或文本）
 * 2. POST/PUT/PATCH body
 * 3. 空
 */
export async function resolveInput(request, url, env) {
  const inParam = url.searchParams.get('in');

  if (inParam !== null) {
    if (/^https?:\/\//i.test(inParam)) {
      assertSafeUrl(inParam, env);
      let res;
      try {
        res = await fetch(inParam, {
          headers: { 'User-Agent': 'CppScript/14' },
          signal: AbortSignal.timeout(10000),
        });
      } catch (e) {
        fail(502, `in fetch error: ${e.message}`, 'E50');
      }
      if (!res.ok) fail(502, `in fetch failed: ${res.status}`, 'E50');
      const text = await res.text();
      if (text.length > 1024 * 1024) fail(502, 'in exceeds 1MB', 'E51');
      return text;
    }
    if (inParam.length > 1024 * 1024) fail(502, 'in exceeds 1MB', 'E51');
    return inParam;
  }

  const m = request.method.toUpperCase();
  if (m === 'POST' || m === 'PUT' || m === 'PATCH') {
    const text = await request.text();
    if (text.length > 1024 * 1024) fail(502, 'body exceeds 1MB', 'E51');
    return text;
  }

  return '';
}

/** 预填文本的输入流（Worker / 本地预置 in）——方法均为 async，便于统一 await */
export class InputStream {
  constructor(text = '') {
    this.text = String(text ?? '');
    this.pos = 0;
  }

  async getchar() {
    if (this.pos >= this.text.length) return -1;
    const cp = this.text.codePointAt(this.pos);
    this.pos += cp > 0xffff ? 2 : 1;
    return cp;
  }

  async readToken() {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) this.pos++;
    if (this.pos >= this.text.length) return null;
    const start = this.pos;
    while (this.pos < this.text.length && !/\s/.test(this.text[this.pos])) this.pos++;
    return this.text.slice(start, this.pos);
  }
}

/**
 * 交互式输入流：行缓冲
 * - pushLine(line)：追加一行（自动补 \\n），唤醒等待中的 getchar/readToken
 * - finish()：标记 EOF
 * - 无数据时 await，直到有行或完成
 */
export class InteractiveInputStream {
  constructor(initial = '') {
    this.buf = String(initial ?? '');
    this.pos = 0;
    this.eof = false;
    this._resolvers = [];
  }

  pushLine(line) {
    const s = String(line ?? '');
    this.buf += s.endsWith('\n') ? s : s + '\n';
    this._wake();
  }

  /** 直接追加原始文本（可不含换行） */
  pushText(text) {
    this.buf += String(text ?? '');
    this._wake();
  }

  finish() {
    this.eof = true;
    this._wake();
  }

  _wake() {
    const rs = this._resolvers.splice(0);
    for (const r of rs) r();
  }

  _wait() {
    return new Promise((resolve) => this._resolvers.push(resolve));
  }

  async getchar() {
    while (this.pos >= this.buf.length) {
      if (this.eof) return -1;
      await this._wait();
    }
    const cp = this.buf.codePointAt(this.pos);
    this.pos += cp > 0xffff ? 2 : 1;
    return cp;
  }

  async readToken() {
    for (;;) {
      while (this.pos < this.buf.length && /\s/.test(this.buf[this.pos])) this.pos++;
      if (this.pos < this.buf.length) break;
      if (this.eof) return null;
      await this._wait();
    }
    const start = this.pos;
    while (this.pos < this.buf.length && !/\s/.test(this.buf[this.pos])) this.pos++;
    // 若 token 被截断在缓冲区末尾且尚未 EOF，继续等更多字符
    if (this.pos >= this.buf.length && !this.eof) {
      // 已读到空白或内容；若最后一个字符不是空白且可能还会续写，仍返回当前 token
      // 行模式：pushLine 已带 \\n，token 完整
    }
    return this.buf.slice(start, this.pos);
  }
}

// GitHub Release 加速下载 Worker
// 许可证: AGPL-3.0

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. 根路径重定向到 README
    if (url.pathname === '/') {
      return Response.redirect(
        'https://markdownreader.mutantcat.org/?url=https://v6.gh-proxy.org/https://raw.githubusercontent.com/achtlv/achtlv.github.io/main/gr.md',
        302
      );
    }

    // 2. 解析路径：/<作者>/<仓库>/[选择器]
    const parts = url.pathname.split('/').filter(p => p.length > 0);

    if (parts.length < 2) {
      return new Response('README详见https://markdownreader.mutantcat.org/?url=https://v6.gh-proxy.org/https://raw.githubusercontent.com/achtlv/achtlv.github.io/main/gr.md', { status: 400 });
    }

    const owner = parts[0];
    const repo = parts[1];
    let selector = parts[2] || '1';

    // 3. 验证 GitHub Token
    const GITHUB_TOKEN = env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      return new Response('服务器未配置 GitHub Token', { status: 500 });
    }

    try {
      // 4. 调用 GitHub API 获取最新 Release
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Cloudflare-Worker',
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${GITHUB_TOKEN}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          return new Response('GitHub Token 无效或已过期', { status: 500 });
        }
        if (response.status === 403) {
          return new Response('API 速率限制已达上限', { status: 429 });
        }
        return new Response(`GitHub API 错误：${response.status}`, { status: 502 });
      }

      const data = await response.json();
      const assets = data.assets.map(asset => asset.browser_download_url);

      if (assets.length === 0) {
        return new Response('该 release 没有 assets', { status: 404 });
      }

      // 5. 根据选择器匹配Assets
      let targetUrl = null;
      const isNumeric = /^\d+$/.test(selector);

      if (isNumeric) {
        // 数字索引模式
        const index = parseInt(selector, 10);
        if (index < 1) {
          return new Response('索引必须为正整数', { status: 400 });
        }
        if (index > assets.length) {
          return new Response(`索引 ${index} 超出范围，共 ${assets.length} 个Assets`, { status: 404 });
        }
        targetUrl = assets[index - 1];
      } else {
        // 关键词匹配模式（区分大小写）
        const keyword = selector;
        const matched = assets.find(url => {
          const fileName = url.split('/').pop();
          return fileName.includes(keyword);
        });
        if (!matched) {
          return new Response(`未找到文件名包含 "${selector}" 的Assets`, { status: 404 });
        }
        targetUrl = matched;
      }

      // 6. 拼接加速域名并重定向
      const proxyUrl = `https://d.achtlv.ccwu.cc/${targetUrl}`;
      return Response.redirect(proxyUrl, 302);

    } catch (err) {
      return new Response(`服务器内部错误：${err.message}`, { status: 500 });
    }
  }
};
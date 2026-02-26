const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, '../../w/sqz/sqz.txt');
const htmlPath = path.join(__dirname, '../../w/sqz/sqz.html');

const text = fs.readFileSync(txtPath, 'utf8');
const lines = text.split('\n');

let html = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>锁情咒 正文</title>
    <style>
        body { font-family: 'Georgia', serif; line-height: 1.8; max-width: 800px; margin: 0 auto; padding: 20px; background: #fafafa; color: #333; }
        h1 { text-align: center; color: #2c3e50; border-bottom: 2px solid #007bff; padding-bottom: 10px; font-size: 2rem; }
        .chapter-title { font-size: 1.8em; font-weight: bold; margin: 1.5em 0 1em; color: #007bff; text-align: center; border-top: 1px dashed #ccc; padding-top: 1em; }
        .novel-paragraph { margin: 0.8em 0; text-indent: 2em; text-align: justify; }
        .back-to-top { display: block; text-align: right; margin-top: 2rem; font-size: 0.9rem; }
        .back-to-top a { color: #007bff; text-decoration: none; }
        @media (max-width: 600px) { body { padding: 15px; } h1 { font-size: 1.6rem; } .chapter-title { font-size: 1.5em; } }
    </style>
</head>
<body>
    <h1>淫奇抄 之 锁情咒</h1>
`;

const chapterRegex = /^第[零一二三四五六七八九十百千万]+章$/;

lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && chapterRegex.test(trimmed)) {
        const titleId = 'chapter-' + trimmed;
        html += `    <div class="chapter-title" id="${titleId}">${line}</div>\n`;
    } else {
        if (line.trim() === '') {
            html += '    <p style="margin:0.5em 0;">&nbsp;</p>\n';
        } else {
            html += `    <p class="novel-paragraph">${line}</p>\n`;
        }
    }
});

html += `    <div class="back-to-top">
        <a href="#">↑ 返回顶部</a>
    </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('sqz.html generated successfully!');

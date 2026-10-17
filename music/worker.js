const UPSTREAM = "https://nextmusic.toubiec.cn";

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#F7FBF1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#11140F" media="(prefers-color-scheme: dark)">
<title>音乐播放器</title>
<link rel="icon" type="image/png" href="https://img.icons8.com/?size=100&id=59862&format=png&color=000000">
<link rel="apple-touch-icon" href="https://img.icons8.com/?size=100&id=59862&format=png&color=000000">
<link rel="preconnect" href="https://fonts.font.im" crossorigin>
<link rel="stylesheet" href="https://fonts.font.im/css2?family=Roboto:wght@400;500;700&display=swap">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
:root{
--primary:#386A20;--on-primary:#FFFFFF;--primary-container:#B7F397;--on-primary-container:#042100;
--surface:#F7FBF1;--surface-container:#ECEFE5;--surface-container-high:#E6E9DF;--surface-container-highest:#E0E4DA;
--on-surface:#191D17;--on-surface-variant:#43483E;--outline:#73796D;--outline-variant:#C3C8BA;
--scrim:rgba(0,0,0,.35);--shadow:rgba(56,106,32,.22);--shadow-2:rgba(56,106,32,.35);
--hover:rgba(56,106,32,.08);--active:rgba(56,106,32,.14);
--danger:#B3261E;--on-danger:#FFFFFF;
}
@media (prefers-color-scheme: dark){
:root{
--primary:#9CD67D;--on-primary:#0A3900;--primary-container:#215200;--on-primary-container:#B7F397;
--surface:#11140F;--surface-container:#1D211A;--surface-container-high:#272B24;--surface-container-highest:#32362E;
--on-surface:#E1E4DA;--on-surface-variant:#C3C8BA;--outline:#8D9386;--outline-variant:#43483E;
--scrim:rgba(0,0,0,.6);--shadow:rgba(0,0,0,.4);--shadow-2:rgba(0,0,0,.55);
--hover:rgba(225,228,218,.08);--active:rgba(225,228,218,.14);
--danger:#F2B8B5;--on-danger:#601410;
}
}
html,body{height:100%}
body{
font-family:'Roboto','Google Sans',-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
background:var(--surface);color:var(--on-surface);overflow:hidden;
-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
transition:background-color .3s,color .3s;
}
.app{height:100dvh;display:flex;flex-direction:column;max-width:520px;margin:0 auto;
padding:env(safe-area-inset-top) 16px env(safe-area-inset-bottom);width:100%}

header{position:relative;padding:22px 46px 10px;flex-shrink:0;text-align:center}
.meta{min-width:0;display:flex;flex-direction:column;align-items:center}
.meta h1{font-size:20px;font-weight:500;line-height:1.3;white-space:nowrap;overflow:hidden;
text-overflow:ellipsis;color:var(--on-surface);max-width:100%}
.meta p{font-size:13px;color:var(--on-surface-variant);white-space:nowrap;overflow:hidden;
text-overflow:ellipsis;margin-top:2px;display:flex;align-items:center;gap:8px;justify-content:center;max-width:100%}
.meta p .artist-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
#shareBtn{position:absolute;top:18px;right:0}
.badge{display:inline-block;padding:1px 8px;border-radius:9px;font-size:11px;font-weight:500;
background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);
vertical-align:middle;line-height:1.5;flex-shrink:0;white-space:nowrap}
.badge.ext{background:color-mix(in srgb,var(--outline) 22%,transparent);color:var(--on-surface-variant)}
.retry-btn{width:20px;height:20px;border-radius:50%;border:none;padding:0;
background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);
display:flex;align-items:center;justify-content:center;cursor:pointer;
flex-shrink:0;transition:background .18s,transform .15s}
.retry-btn:hover{background:color-mix(in srgb,var(--primary) 25%,transparent)}
.retry-btn:active{transform:scale(.92)}
.retry-btn:disabled{cursor:default;opacity:.7}
.retry-btn svg{width:12px;height:12px;fill:currentColor;pointer-events:none}
.retry-btn.spinning svg{animation:retry-spin .8s linear infinite}
@keyframes retry-spin{to{transform:rotate(360deg)}}

.dlg-retry{width:32px;height:32px;border-radius:50%;border:none;padding:0;
background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary);
display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;
transition:background .18s,transform .15s}
.dlg-retry:hover{background:color-mix(in srgb,var(--primary) 25%,transparent)}
.dlg-retry:active{transform:scale(.92)}
.dlg-retry:disabled{cursor:default;opacity:.7}
.dlg-retry svg{width:17px;height:17px;fill:currentColor;pointer-events:none}
.dlg-retry.spinning svg{animation:retry-spin .8s linear infinite}
.dialog-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:16px}
.dialog-head h2{margin-bottom:0}

.icon-btn{width:40px;height:40px;border:none;border-radius:50%;background:transparent;
color:var(--on-surface-variant);display:flex;align-items:center;justify-content:center;
cursor:pointer;transition:background .18s,color .18s;flex-shrink:0}
.icon-btn:hover{background:var(--hover);color:var(--on-surface)}
.icon-btn:active{background:var(--active)}
.icon-btn svg{width:22px;height:22px;fill:currentColor;pointer-events:none}
.icon-btn:disabled{opacity:.4;cursor:default;pointer-events:none}
.icon-btn.active{background:color-mix(in srgb,var(--primary) 18%,transparent);color:var(--primary)}

#stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;
position:relative;overflow:hidden;padding:8px 0}
.empty-add{display:none;flex-direction:row;align-items:center;justify-content:center;gap:8px;
padding:10px 22px;border:1px dashed var(--outline-variant);border-radius:20px;
background:transparent;color:var(--on-surface-variant);cursor:pointer;font-size:14px;
font-family:inherit;transition:all .2s;max-height:100%}
.empty-add:hover,.empty-add:active{border-color:var(--primary);color:var(--primary);
background:color-mix(in srgb,var(--primary) 8%,transparent)}
.empty-add svg{width:20px;height:20px;fill:currentColor}

.cover-box{display:none;height:100%;max-height:340px;aspect-ratio:1;max-width:100%;
border-radius:28px;overflow:hidden;position:relative;cursor:pointer;
background:linear-gradient(135deg,var(--primary-container),var(--surface-container-highest));
transition:transform .3s}
.cover-box img{width:100%;height:100%;object-fit:cover;display:block}
.cover-fallback{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
color:var(--on-primary-container)}
.cover-fallback svg{width:80px;height:80px;fill:currentColor;opacity:.55}
.cover-loading{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
background:linear-gradient(135deg,var(--primary-container),var(--surface-container-highest))}
.cover-loading-spinner{width:38px;height:38px;border-radius:50%;
border:3px solid color-mix(in srgb,var(--primary) 25%,transparent);
border-top-color:var(--primary);animation:spin .8s linear infinite}

.lyric-box{display:none;width:100%;height:100%;overflow-y:auto;padding:4px 8px;
scrollbar-width:none;border-radius:20px;position:relative}
.lyric-box::-webkit-scrollbar{display:none}
.lyric-toolbar{position:absolute;top:6px;right:6px;display:flex;gap:6px;z-index:3}
.chip{padding:4px 12px;border-radius:12px;border:1px solid var(--outline-variant);
background:var(--surface-container-high);color:var(--on-surface-variant);
font-size:12px;font-family:inherit;cursor:pointer;transition:all .18s;font-weight:500}
.chip:hover{border-color:var(--outline)}
.chip.on{border-color:var(--primary);background:color-mix(in srgb,var(--primary) 18%,transparent);
color:var(--primary)}
.chip.hidden{display:none}

.lyric-box #lyricText{font-family:inherit;font-size:15px;line-height:1.75;
color:var(--on-surface-variant);text-align:center;padding:40px 8px 40px}
.lyric-box .line{padding:6px 0;transition:color .3s;white-space:pre-wrap;word-break:break-word}
.lyric-box .line-main{font-size:15px;line-height:1.6}
.lyric-box .line.loading .line-main{color:var(--on-surface-variant);font-style:italic;opacity:.7}
.lyric-box .line-trans{font-size:13.5px;line-height:1.6;margin-top:2px;
color:var(--on-surface-variant);opacity:.72}
.lyric-box .line-roma{font-size:13px;line-height:1.6;margin-top:2px;
color:var(--on-surface-variant);opacity:.6;font-style:italic}
.lyric-box .line.current .line-main{color:var(--primary);font-weight:600;font-size:16px}
.lyric-box .line.current .line-trans{color:var(--primary);opacity:.78}
.lyric-box .line.current .line-roma{color:var(--primary);opacity:.68}

.progress-row{display:flex;align-items:center;gap:10px;padding:6px 4px;flex-shrink:0}
.progress-row span{font-size:12px;color:var(--on-surface-variant);
font-variant-numeric:tabular-nums;min-width:38px}
.progress-row span:first-child{text-align:left}
.progress-row span:last-child{text-align:right}
input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:6px;border-radius:3px;
background:var(--outline-variant);outline:none;cursor:pointer;border:none;transition:background .2s}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;
background:var(--primary);cursor:pointer;border:none;transition:box-shadow .2s,transform .15s}
input[type=range]:active::-webkit-slider-thumb{box-shadow:0 0 0 8px color-mix(in srgb,var(--primary) 20%,transparent);
transform:scale(1.1)}
input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:var(--primary);
border:none;cursor:pointer;transition:box-shadow .2s}

.controls{display:flex;align-items:center;justify-content:center;gap:20px;padding:10px 0 6px;flex-shrink:0}
.controls .icon-btn{width:54px;height:54px}
.controls .icon-btn svg{width:32px;height:32px}
.controls .icon-btn:disabled{opacity:.3;cursor:default}
.controls .icon-btn:disabled:hover{background:transparent;color:var(--on-surface-variant)}
.play-btn{width:70px;height:70px;border:none;border-radius:50%;background:var(--primary);
color:var(--on-primary);display:flex;align-items:center;justify-content:center;cursor:pointer;
transition:transform .15s,box-shadow .25s,background .3s;
box-shadow:0 4px 16px var(--shadow)}
@media (hover:hover){
.play-btn:hover{box-shadow:0 6px 26px var(--shadow-2)}
}
.play-btn:active{transform:scale(.93)}
.play-btn svg{width:34px;height:34px;fill:currentColor;pointer-events:none}

footer{display:flex;align-items:center;justify-content:space-between;gap:6px;
padding:6px 0 14px;flex-shrink:0}
.text-btn{display:flex;align-items:center;gap:6px;height:40px;padding:0 12px;border:none;
border-radius:20px;background:transparent;color:var(--on-surface-variant);font-size:13px;
font-family:inherit;cursor:pointer;transition:background .18s,color .18s;white-space:nowrap}
.text-btn:hover{background:var(--hover);color:var(--on-surface)}
.text-btn:active{background:var(--active)}
.text-btn svg{width:19px;height:19px;fill:currentColor;pointer-events:none}
.text-btn.danger{color:var(--danger)}
.text-btn.danger:hover{background:color-mix(in srgb,var(--danger) 12%,transparent)}

.scrim{position:fixed;inset:0;background:var(--scrim);display:none;align-items:center;
justify-content:center;z-index:100;padding:20px;
backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:fadeIn .2s}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.scrim.show{display:flex}
.scrim.bottom{align-items:flex-end;padding:0}

.dialog{background:var(--surface-container-high);border-radius:28px;padding:24px;width:100%;
max-width:440px;animation:pop .22s cubic-bezier(.2,.8,.2,1);
box-shadow:0 16px 48px var(--shadow-2);max-height:calc(100dvh - 40px);overflow-y:auto}
@keyframes pop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
.dialog h2{font-size:18px;font-weight:500;margin-bottom:16px;color:var(--on-surface)}
.dialog .dialog-text{font-size:14px;color:var(--on-surface-variant);line-height:1.6;word-break:break-all}

.input-row{display:flex;gap:8px;align-items:center}
.input-row input{flex:1;height:48px;padding:0 18px;border-radius:24px;
border:1px solid var(--outline);background:transparent;color:var(--on-surface);
font-size:15px;font-family:inherit;outline:none;transition:border-color .2s,background .2s;min-width:0}
.input-row input:focus{border-color:var(--primary);
background:color-mix(in srgb,var(--primary) 5%,transparent)}
.input-row input::placeholder{color:var(--on-surface-variant)}

.filled-icon{width:48px;height:48px;border-radius:50%;border:none;background:var(--primary);
color:var(--on-primary);display:flex;align-items:center;justify-content:center;cursor:pointer;
flex-shrink:0;transition:box-shadow .2s,opacity .2s,transform .15s}
@media (hover:hover){
.filled-icon:hover{box-shadow:0 0 0 6px color-mix(in srgb,var(--primary) 15%,transparent)}
}
.filled-icon:active{transform:scale(.94)}
.filled-icon:disabled{opacity:.5;cursor:default;box-shadow:none}
.filled-icon svg{width:22px;height:22px;fill:currentColor;pointer-events:none}

.hint{font-size:12px;color:var(--on-surface-variant);margin-top:10px;line-height:1.5}
.found{background:var(--surface-container-highest);border-radius:16px;padding:14px 16px;margin-bottom:4px}
.found-name{font-size:15px;color:var(--on-surface);word-break:break-all}
.found-artist{font-size:13px;color:var(--on-surface-variant);margin-top:5px;word-break:break-all}
.found-meta{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px}
.meta-tag{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11.5px;
font-weight:500;line-height:1.6;white-space:nowrap}
.meta-tag.q{background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary)}
.meta-tag.ext{background:color-mix(in srgb,var(--outline) 22%,transparent);color:var(--on-surface-variant)}
.meta-tag.vid{background:color-mix(in srgb,#7E5700 22%,transparent);color:#7E5700}
@media (prefers-color-scheme: dark){
.meta-tag.vid{background:color-mix(in srgb,#E8C87A 22%,transparent);color:#E8C87A}
}
.meta-tag.warn{background:color-mix(in srgb,#B3261E 18%,transparent);color:var(--danger)}

.dlg-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;flex-wrap:wrap}
.filled-btn{height:40px;padding:0 24px;border-radius:20px;border:none;background:var(--primary);
color:var(--on-primary);font-size:14px;font-weight:500;font-family:inherit;cursor:pointer;
transition:box-shadow .2s,transform .15s}
@media (hover:hover){
.filled-btn:hover{box-shadow:0 0 0 4px color-mix(in srgb,var(--primary) 15%,transparent)}
}
.filled-btn:active{transform:scale(.97)}
.filled-btn.danger{background:var(--danger);color:var(--on-danger)}
.filled-btn.block{display:flex;align-items:center;justify-content:center;width:100%;height:48px;
padding:0 16px;border-radius:16px;font-size:15px}

.sheet{background:var(--surface-container-high);width:100%;max-width:520px;
border-radius:28px 28px 0 0;max-height:75dvh;display:flex;flex-direction:column;
animation:slideUp .26s cubic-bezier(.2,.8,.2,1);padding-bottom:env(safe-area-inset-bottom);
box-shadow:0 -8px 40px var(--shadow-2)}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheet-head{display:flex;align-items:center;justify-content:space-between;
padding:18px 12px 10px 18px;flex-shrink:0;gap:8px}
.sheet-head h2{font-size:16px;font-weight:500;color:var(--on-surface);flex:1;min-width:0;
white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sheet-head .head-actions{display:flex;gap:2px;flex-shrink:0}
.sheet-head .head-actions .icon-btn{width:38px;height:38px}
.sheet-head .head-actions .icon-btn svg{width:20px;height:20px}
.sheet-list{overflow-y:auto;padding:0 8px 16px;flex:1;scrollbar-width:thin}
.sheet-list::-webkit-scrollbar{width:6px}
.sheet-list::-webkit-scrollbar-thumb{background:var(--outline-variant);border-radius:3px}
.sheet-empty{text-align:center;color:var(--on-surface-variant);font-size:14px;padding:40px 0}
.song-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;
cursor:pointer;transition:background .15s}
.song-row:hover{background:var(--hover)}
.song-row.playing{background:color-mix(in srgb,var(--primary) 12%,transparent)}
.song-row-info{flex:1;min-width:0}
.song-row-name{font-size:14px;color:var(--on-surface);white-space:nowrap;
overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px}
.song-row-name .name-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.song-row.playing .song-row-name{color:var(--primary);font-weight:500}
.song-row-name .ext-tag{font-size:10px;padding:1px 6px;border-radius:6px;
background:color-mix(in srgb,var(--outline) 22%,transparent);color:var(--on-surface-variant);
font-weight:500;flex-shrink:0;text-transform:uppercase}
.song-row-name .ext-tag.vid{background:color-mix(in srgb,#7E5700 22%,transparent);color:#7E5700}
@media (prefers-color-scheme: dark){
.song-row-name .ext-tag.vid{background:color-mix(in srgb,#E8C87A 22%,transparent);color:#E8C87A}
}
.song-row-artist{font-size:12px;color:var(--on-surface-variant);white-space:nowrap;
overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.song-row-actions{display:flex;gap:2px;flex-shrink:0}
.song-row-move{width:32px;height:32px;border-radius:50%;border:none;background:transparent;
color:var(--on-surface-variant);display:flex;align-items:center;justify-content:center;
cursor:pointer;transition:all .18s;flex-shrink:0}
.song-row-move:hover{background:color-mix(in srgb,var(--primary) 15%,transparent);color:var(--primary)}
.song-row-move:disabled{opacity:.25;cursor:default;background:transparent;color:var(--on-surface-variant)}
.song-row-move svg{width:16px;height:16px;fill:currentColor;pointer-events:none}
.song-row-del{width:36px;height:36px;border-radius:50%;border:none;background:transparent;
color:var(--on-surface-variant);display:flex;align-items:center;justify-content:center;
cursor:pointer;flex-shrink:0;transition:all .18s}
.song-row-del:hover{background:color-mix(in srgb,var(--primary) 18%,transparent);color:var(--primary)}
.song-row-del svg{width:18px;height:18px;fill:currentColor;pointer-events:none}
.song-row-rename{width:36px;height:36px;border-radius:50%;border:none;background:transparent;
color:var(--on-surface-variant);display:flex;align-items:center;justify-content:center;
cursor:pointer;flex-shrink:0;transition:all .18s}
.song-row-rename:hover{background:color-mix(in srgb,var(--primary) 18%,transparent);color:var(--primary)}
.song-row-rename svg{width:18px;height:18px;fill:currentColor;pointer-events:none}

.toast{position:fixed;bottom:110px;left:50%;transform:translateX(-50%) translateY(20px);
background:var(--surface-container-highest);color:var(--on-surface);padding:12px 20px;
border-radius:12px;font-size:14px;opacity:0;transition:all .3s cubic-bezier(.2,.8,.2,1);
pointer-events:none;z-index:200;box-shadow:0 6px 20px var(--shadow-2);max-width:88vw;text-align:center}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

.import-toolbar{display:flex;align-items:center;gap:10px;margin-top:10px}
.file-name{font-size:12px;color:var(--on-surface-variant);flex:1;min-width:0;
overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.import-mode{display:flex;gap:8px;margin-top:12px}
.import-mode label{flex:1;display:flex;align-items:center;gap:8px;padding:8px 12px;
border-radius:14px;border:1px solid var(--outline-variant);cursor:pointer;font-size:13px;
color:var(--on-surface-variant);transition:all .18s;user-select:none}
.import-mode label:hover{border-color:var(--outline)}
.import-mode label:has(input:checked){border-color:var(--primary);
background:color-mix(in srgb,var(--primary) 10%,transparent);color:var(--primary);font-weight:500}
.import-mode input[type=radio]{accent-color:var(--primary);margin:0;width:16px;height:16px}

.share-menu{display:flex;flex-direction:column;gap:8px;margin-top:8px}

.quality-loading{text-align:center;color:var(--on-surface-variant);font-size:13px;
padding:24px 0;display:flex;flex-direction:column;align-items:center;gap:12px}
.quality-spinner{width:26px;height:26px;border-radius:50%;
border:3px solid var(--outline-variant);border-top-color:var(--primary);
animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.quality-list{display:flex;flex-direction:column;gap:8px;margin-top:8px}
.quality-item{display:flex;align-items:center;justify-content:space-between;gap:10px;
padding:14px 18px;border-radius:16px;border:1px solid var(--outline-variant);
background:transparent;color:var(--on-surface);font-size:15px;font-family:inherit;
cursor:pointer;transition:all .18s;text-align:left;width:100%}
.quality-item:hover:not(:disabled){border-color:var(--primary);
background:color-mix(in srgb,var(--primary) 8%,transparent)}
.quality-item:active:not(:disabled){transform:scale(.99)}
.quality-item:disabled{opacity:.38;cursor:not-allowed}
.quality-item.current{border-color:var(--primary);
background:color-mix(in srgb,var(--primary) 10%,transparent)}
.quality-label{font-weight:500}
.quality-tag{font-size:11px;padding:2px 8px;border-radius:8px;
background:color-mix(in srgb,var(--primary) 20%,transparent);color:var(--primary);font-weight:500}
.quality-tag.unavailable{background:color-mix(in srgb,var(--outline) 22%,transparent);
color:var(--on-surface-variant)}

@media (min-width:640px){
body{display:flex;align-items:center;justify-content:center;padding:32px;
background:radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--primary) 8%,var(--surface)) 0%,var(--surface) 60%)}
.app{
height:min(calc(100dvh - 64px),860px);
max-width:600px;
background:var(--surface-container);
border-radius:32px;
padding:24px 32px 20px;
box-shadow:0 12px 48px var(--shadow-2);
border:1px solid var(--outline-variant);
margin:0;
}
header{padding:4px 46px 10px}
.meta h1{font-size:22px}
.meta p{font-size:13.5px}
#shareBtn{top:0}
.cover-box{max-height:400px;border-radius:24px}
.controls{gap:24px;padding:14px 0 8px}
.controls .icon-btn{width:58px;height:58px}
.controls .icon-btn svg{width:34px;height:34px}
.play-btn{width:76px;height:76px}
.play-btn svg{width:36px;height:36px}
footer{padding:8px 0 6px}
.toast{bottom:40px}
.sheet{max-width:600px;border-radius:28px;margin:0 auto}
.scrim.bottom{align-items:center;padding:32px}
}

@media (max-width:360px){
.meta h1{font-size:17px}
.controls{gap:14px}
.controls .icon-btn{width:48px;height:48px}
.controls .icon-btn svg{width:28px;height:28px}
.play-btn{width:62px;height:62px}
.play-btn svg{width:30px;height:30px}
.text-btn{padding:0 8px;font-size:12px}
.text-btn svg{width:17px;height:17px}
.sheet-head .head-actions .icon-btn{width:34px;height:34px}
.song-row-move{width:28px;height:28px}
}
</style>
</head>
<body>
<div class="app">
<header>
<button class="icon-btn" id="shareBtn" title="分享" aria-label="分享"></button>
<div class="meta">
<h1 id="title">未在播放</h1>
<p><span class="artist-text" id="artist">—</span><span class="badge" id="qualityBadge" style="display:none"></span><button class="retry-btn" id="retryBtn" style="display:none" aria-label="重新检测音源"></button></p>
</div>
</header>

<div id="stage">
<button class="empty-add" id="emptyAdd" aria-label="添加歌曲">
<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
<span>添加歌曲</span>
</button>
<div class="cover-box" id="coverBox">
<img id="coverImg" alt="">
<div class="cover-fallback" id="coverFallback">
<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
</div>
<div class="cover-loading" id="coverLoading">
<div class="cover-loading-spinner"></div>
</div>
</div>
<div class="lyric-box" id="lyricBox">
<div class="lyric-toolbar" id="lyricToolbar">
<button class="chip hidden" id="transBtn">翻译</button>
<button class="chip hidden" id="romaBtn">发音</button>
</div>
<div id="lyricText"></div>
</div>
</div>

<div class="progress-row">
<span id="curTime">0:00</span>
<input type="range" id="seek" min="0" max="1000" value="0" step="1" aria-label="播放进度">
<span id="durTime">0:00</span>
</div>

<div class="controls">
<button class="icon-btn" id="prevBtn" disabled aria-label="上一首"></button>
<button class="play-btn" id="playBtn" aria-label="播放/暂停"></button>
<button class="icon-btn" id="nextBtn" disabled aria-label="下一首"></button>
</div>

<footer>
<button class="text-btn" id="modeBtn"></button>
<button class="text-btn" id="downloadBtn"></button>
<button class="text-btn" id="listBtn"></button>
</footer>
</div>

<div class="scrim" id="addScrim">
<div class="dialog">
<div id="addStage1">
<h2>添加歌曲</h2>
<div class="input-row">
<input id="addInput" placeholder="歌曲 ID / 链接 / 歌名" autocomplete="off" enterkeyhint="go">
<button class="filled-icon" id="addGo" aria-label="确认"></button>
</div>
<p class="hint">支持歌曲 ID、网易云链接（含短链）、第三方音频/视频直链（MP3 / M4A / FLAC / M3U8 / MP4 / FLV / WMV 等）或歌名搜索。多个链接会优先取网易云，其次按顺序取第一个可用音源。</p>
</div>
<div id="addStage2" style="display:none">
<h2>已找到歌曲</h2>
<div class="found">
<div class="found-name" id="foundName"></div>
<div class="found-artist" id="foundArtist"></div>
<div class="found-meta" id="foundMeta"></div>
</div>
<p class="hint" id="addHint">是否将此歌曲加入播放列表？</p>
<div class="dlg-actions">
<button class="text-btn" id="addCancel">取消</button>
<button class="filled-btn" id="addConfirm">确认</button>
</div>
</div>
</div>
</div>

<div class="scrim" id="clearScrim">
<div class="dialog">
<h2>清空播放列表</h2>
<p class="dialog-text">将删除播放列表中的所有歌曲，此操作无法撤销。</p>
<div class="dlg-actions">
<button class="text-btn" id="clearCancel">取消</button>
<button class="filled-btn danger" id="clearConfirm">确认清空</button>
</div>
</div>
</div>

<div class="scrim" id="renameScrim">
<div class="dialog">
<h2>重命名</h2>
<div class="input-row">
<input id="renameInput" placeholder="输入新名称" autocomplete="off" maxlength="100" enterkeyhint="done">
<button class="filled-icon" id="renameGo" aria-label="确认"></button>
</div>
<div class="dlg-actions">
<button class="text-btn" id="renameCancel">取消</button>
<button class="filled-btn" id="renameConfirm">确认</button>
</div>
</div>
</div>

<div class="scrim" id="shareScrim">
<div class="dialog">
<h2>分享歌曲</h2>
<p class="dialog-text" id="shareSongName">—</p>
<div class="share-menu">
<button class="filled-btn block" id="shareCopyLink">复制分享链接</button>
<button class="filled-btn block" id="shareSystem">系统分享</button>
<button class="text-btn block" id="shareCancel" style="justify-content:center">取消</button>
</div>
</div>
</div>

<div class="scrim" id="downloadScrim">
<div class="dialog">
<div class="dialog-head">
<h2>选择下载音质</h2>
<button class="dlg-retry" id="downloadRetryBtn" aria-label="重新检测音质"></button>
</div>
<p class="dialog-text" id="downloadSongName">—</p>
<div id="qualityList"></div>
<div class="dlg-actions">
<button class="text-btn" id="downloadCancel">取消</button>
</div>
</div>
</div>

<div class="scrim" id="exportScrim">
<div class="dialog">
<h2>网络导出</h2>
<div class="input-row">
<input id="exportKey" readonly placeholder="正在上传...">
<button class="filled-icon" id="exportCopy" aria-label="复制密钥" disabled></button>
</div>
<p class="hint" id="exportHint">正在将歌单上传到网络...</p>
<div class="dlg-actions">
<button class="text-btn" id="exportDownload">下载 .txt</button>
<button class="filled-btn" id="exportClose">关闭</button>
</div>
</div>
</div>

<div class="scrim" id="importScrim">
<div class="dialog">
<h2>导入播放列表</h2>
<div class="input-row">
<input id="importKey" placeholder="密钥 / GZIP / 明文歌单" autocomplete="off" maxlength="8000">
<button class="filled-icon" id="importGo" aria-label="获取"></button>
</div>
<input type="file" id="importFile" accept=".txt,text/plain" style="display:none">
<div class="import-toolbar">
<button class="text-btn" id="importPickFile">选择 .txt 文件</button>
<span class="file-name" id="importFileName"></span>
</div>
<div class="import-mode">
<label><input type="radio" name="importMode" value="merge" checked>合并到原列表</label>
<label><input type="radio" name="importMode" value="replace">覆盖原列表</label>
</div>
<p class="hint" id="importHint"></p>
<div class="dlg-actions">
<button class="text-btn" id="importCancel">取消</button>
<button class="filled-btn" id="importConfirm">确认导入</button>
</div>
</div>
</div>

<div class="scrim bottom" id="listScrim">
<div class="sheet">
<div class="sheet-head">
<h2 id="sheetTitle">播放列表</h2>
<div class="head-actions">
<button class="icon-btn" id="sheetEdit" aria-label="编辑顺序" title="编辑顺序"></button>
<button class="icon-btn" id="sheetImport" aria-label="导入列表" title="导入列表"></button>
<button class="icon-btn" id="sheetExport" aria-label="导出列表" title="导出列表"></button>
<button class="icon-btn" id="sheetClear" aria-label="清空列表" title="清空列表"></button>
<button class="icon-btn" id="sheetAdd" aria-label="添加歌曲" title="添加歌曲"></button>
</div>
</div>
<div class="sheet-list" id="sheetList"></div>
</div>
</div>

<script>
(function(){
'use strict';
var $=function(id){return document.getElementById(id)};
var LF=String.fromCharCode(10);
var CR=String.fromCharCode(13);
var BS=String.fromCharCode(92);

var DEFAULT_ICON='https://img.icons8.com/?size=100&id=59862&format=png&color=000000';
var SITE_TITLE='音乐播放器';

var ICON={
play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
pause:'<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
prev:'<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>',
next:'<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
shuffle:'<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
repeat:'<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
repeatOne:'<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>',
list:'<svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>',
download:'<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
share:'<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>',
add:'<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
del:'<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
clearAll:'<svg viewBox="0 0 24 24"><path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z"/></svg>',
exportIco:'<svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>',
importIco:'<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
arrow:'<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
arrowUp:'<svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>',
arrowDown:'<svg viewBox="0 0 24 24"><path d="M12 16l6-6-1.41-1.41L12 13.17l-4.59-4.58L6 10z"/></svg>',
edit:'<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
check:'<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
refresh:'<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
copy:'<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'
};

var state={
playlist:[],current:-1,playing:false,mode:'order',
showLyric:false,lyric:'',audioUrl:'',quality:'',
lyricTrans:'',lyricRoma:'',
transEnabled:true,romaEnabled:false,
lyricLoading:false,
retrying:false,
lyricLines:[],lyricHasTime:false,lyricCurrent:-1,lyricUserScrolled:false,
editingOrder:false,
_lastLyricKey:null,_lastMediaKey:null,_lyricScrollTimer:null
};

var audio=document.createElement('video');
audio.style.position='absolute';
audio.style.left='-9999px';
audio.style.top='0';
audio.style.width='1px';
audio.style.height='1px';
audio.style.opacity='0';
audio.style.pointerEvents='none';
audio.setAttribute('playsinline','');
audio.setAttribute('webkit-playsinline','');
audio.preload='metadata';
if(document.body)document.body.appendChild(audio);
else document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(audio)});

var playToken=0,isSeeking=false,pendingSong=null;
var refreshToken=0;
var refreshingUrl=false;

var LEVELS=['exhigh','standard'];
var OFFICIAL_PREFIX='https://ebnr.xiyang6666.top/resolve/https://music.163.com/song?id=';
var COOKIE_NAME='m3_playlist';
var COOKIE_MAX=3800;
var HLS_CDN='https://fastly.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
var FLV_CDN='https://fastly.jsdelivr.net/npm/flv.js@1.6.2/dist/flv.min.js';

var QUALITY_LABEL={exhigh:'极高',standard:'标准',official:'官方',lossless:'无损'};
var QUALITY_RANK={lossless:4,exhigh:3,standard:2,official:1};
var MAX_PLAY_RANK=3;
var DETECT_TIMES=3;
var PRELOAD_DELAY=5000;
var PRELOAD_RETRY=10000;
var URL_SAFETY_BUFFER=60;
var DEFAULT_EXPI=1200;
var COVER_LYRIC_TTL_MS=7*24*3600*1000;

var AUDIO_FORMATS=['mp3','m4a','aac','flac','wav','ogg','opus','wma','weba','oga','mka','aiff','aif','ape','alac','amr','3ga'];
var VIDEO_FORMATS=['m3u8','mp4','flv','wmv','mkv','webm','mov','avi','m4v','ts','3gp','3g2','ogv','mpg','mpeg','m2ts','f4v','rm','rmvb','asf'];

var DOWNLOAD_LEVELS=[
{key:'lossless',label:'无损'},
{key:'exhigh',label:'极高'},
{key:'standard',label:'标准'},
{key:'official',label:'官方'}
];
var NETEASE_HOSTS=['music.163.com','163cn.tv','y.music.163.com','music.126.net','music.163.cn'];

var hlsInstance=null;
var hlsLoading=null;
var flvInstance=null;
var flvLoading=null;

var ALL_SCRIMS=['addScrim','clearScrim','renameScrim','shareScrim','downloadScrim','exportScrim','importScrim','listScrim'];

$('shareBtn').innerHTML=ICON.share;
$('prevBtn').innerHTML=ICON.prev;
$('nextBtn').innerHTML=ICON.next;
$('addGo').innerHTML=ICON.arrow;
$('sheetAdd').innerHTML=ICON.add;
$('sheetClear').innerHTML=ICON.clearAll;
$('sheetExport').innerHTML=ICON.exportIco;
$('sheetImport').innerHTML=ICON.importIco;
$('sheetEdit').innerHTML=ICON.edit;
$('retryBtn').innerHTML=ICON.refresh;
$('downloadRetryBtn').innerHTML=ICON.refresh;
$('exportCopy').innerHTML=ICON.copy;
$('importGo').innerHTML=ICON.arrow;
$('renameGo').innerHTML=ICON.check;

function closeOtherScrims(exceptId){
for(var i=0;i<ALL_SCRIMS.length;i++){
if(ALL_SCRIMS[i]===exceptId)continue;
var el=$(ALL_SCRIMS[i]);
if(el)el.classList.remove('show');
}
}

// ==================== 基础工具 ====================
function isAllDigits(s){
if(!s)return false;
for(var i=0;i<s.length;i++){
var c=s.charCodeAt(i);
if(c<48||c>57)return false;
}
return true;
}
function isSongId(s){
if(!s)return false;
var str=String(s);
return str.length>=5&&isAllDigits(str);
}
function isHttpUrl(u){
if(!u)return false;
var s=String(u).toLowerCase();
return s.indexOf('http://')===0||s.indexOf('https://')===0;
}
function isNeteaseUrl(u){
if(!u)return false;
var s=String(u).toLowerCase();
for(var i=0;i<NETEASE_HOSTS.length;i++){
if(s.indexOf(NETEASE_HOSTS[i])!==-1)return true;
}
return false;
}

// 生成 15 字符分享密钥（字母数字 + URL-safe 符号 - _）
function genShareKey(){
var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
var key='';
var t=Date.now();
var r1=Math.floor(Math.random()*16777216);
var r2=Math.floor(Math.random()*16777216);
var s=t;
for(var i=0;i<8;i++){
key+=chars.charAt(s%64);
s=Math.floor(s/64);
}
var s2=r1*16777216+r2;
for(var j=0;j<7;j++){
key+=chars.charAt(s2%64);
s2=Math.floor(s2/64);
}
var shift=r1%15;
if(shift>0){
key=key.substring(shift)+key.substring(0,shift);
}
return key;
}

// 判断输入内容类型：
// 1. 以 #GZIP 开头且长度 > 15 → 'gzip'
// 2. 长度恰好 15 且不含 '|' → 'key'
// 3. 其他 → 'plain'
function detectImportType(val){
var s=String(val||'').trim();
if(!s)return 'empty';
if(s.indexOf('#GZIP')===0&&s.length>15)return 'gzip';
if(s.length===15&&s.indexOf('|')===-1)return 'key';
return 'plain';
}

// 不再把逗号/分号当 URL 终止符（B 站等 CDN 的 URL 参数里合法含逗号）
// 只在空格、Tab、换行、引号、尖括号处终止
function extractAllUrlsFromText(text){
var urls=[];
var seen={};
if(!text)return urls;
var t=String(text);
var i=0;
while(i<t.length){
var httpIdx=t.indexOf('http://',i);
var httpsIdx=t.indexOf('https://',i);
var start=-1;
if(httpIdx===-1&&httpsIdx===-1)break;
if(httpIdx===-1)start=httpsIdx;
else if(httpsIdx===-1)start=httpIdx;
else start=Math.min(httpIdx,httpsIdx);

var s=t.substring(start);
var end=s.length;
for(var k=0;k<s.length;k++){
var c=s.charCodeAt(k);
// 终止符：空格、Tab、换行、双引号、单引号、<、>
if(c===32||c===9||c===10||c===13||c===34||c===39||c===60||c===62){end=k;break}
}
var url=s.substring(0,end);
// 尾部只剥离明显不是 URL 字符的包裹标点（括号、方括号、花括号、感叹号）
while(url.length>0){
var last=url.charCodeAt(url.length-1);
if(last===41||last===93||last===125||last===33){url=url.substring(0,url.length-1);}
else break;
}
if(url&&isHttpUrl(url)&&!seen[url]){
seen[url]=true;
urls.push(url);
}
i=start+end;
if(end===0)i++;
}
return urls;
}

function getFormatFromUrl(u){
if(!u)return '';
var s=String(u).toLowerCase();
var qi=s.indexOf('?');if(qi!==-1)s=s.substring(0,qi);
var hi=s.indexOf('#');if(hi!==-1)s=s.substring(0,hi);
var all=AUDIO_FORMATS.concat(VIDEO_FORMATS);
for(var i=0;i<all.length;i++){
var ext=all[i];
var needLen=ext.length+1;
if(s.length>=needLen){
var tail=s.substring(s.length-needLen);
if(tail==='.'+ext)return ext;
}
}
return '';
}
function isHlsFormat(url,format){
if(format==='m3u8')return true;
if(!url)return false;
return String(url).toLowerCase().indexOf('.m3u8')!==-1;
}
function isFlvFormat(url,format){
if(format==='flv')return true;
if(!url)return false;
return String(url).toLowerCase().indexOf('.flv')!==-1;
}
function isVideoFormat(fmt){
if(!fmt)return false;
var f=String(fmt).toLowerCase();
for(var i=0;i<VIDEO_FORMATS.length;i++){
if(VIDEO_FORMATS[i]===f)return true;
}
return false;
}
function safeFileName(s){
if(!s)return 'song';
var bad=BS+'/:*?"<>|';
var out='';
for(var i=0;i<s.length;i++){
var c=s.charAt(i);
if(bad.indexOf(c)!==-1)out+='_';
else out+=c;
}
return out;
}
function stripExtension(s){
if(!s)return '';
var idx=s.lastIndexOf('.');
if(idx>0)return s.substring(0,idx);
return s;
}
function replaceDashes(s){
if(!s)return '';
var out='';
var prevWasDash=false;
for(var i=0;i<s.length;i++){
var c=s.charAt(i);
if(c==='-'||c==='_'){
if(!prevWasDash){out+=' ';prevWasDash=true}
}else{out+=c;prevWasDash=false;}
}
return out.trim();
}
function post(path,body){
return fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()});
}
function fmt(s){
s=Math.floor(s||0);if(!isFinite(s)||s<0)s=0;
return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
function toast(msg){
var t=document.createElement('div');
t.className='toast';t.textContent=msg;
document.body.appendChild(t);
requestAnimationFrame(function(){t.classList.add('show')});
setTimeout(function(){
t.classList.remove('show');
setTimeout(function(){t.remove()},320);
},2200);
}
function extractUrl(r){
if(!r)return '';
if(r.data&&r.data.url)return r.data.url;
if(r.data&&r.data[0]&&r.data[0].url)return r.data[0].url;
return r.url||'';
}
function extractExpi(r){
if(r&&r.data&&typeof r.data.expi==='number')return r.data.expi;
return 0;
}

function qualityRank(q){
if(!q||q==='unavailable'||q==='external')return 0;
var r=QUALITY_RANK[q];
return (r===undefined)?0:r;
}

// ==================== 编码检测 ====================
function normalizeCodec(c){
if(!c)return '';
return String(c).trim();
}

function isCodecSupported(mime,codec,useMse){
if(!codec)return true;
var type=mime+'; codecs="'+codec+'"';
if(useMse&&window.MediaSource&&MediaSource.isTypeSupported){
if(MediaSource.isTypeSupported(type))return true;
}
try{
var testEl=document.createElement('video');
var result=testEl.canPlayType(type);
return result==='probably'||result==='maybe';
}catch(e){
return false;
}
}

// ==================== textdb 缓存封装（全部通过 Worker 中转） ====================
async function cacheGetRaw(key){
try{
var r=await post('/api/cacheGet',{key:key});
if(r&&r.ok&&r.value)return r.value;
}catch(e){}
return '';
}

async function cacheSetRaw(key,value){
if(!key||!value)return false;
try{
var r=await post('/api/cacheSet',{key:key,value:value});
return !!(r&&r.ok);
}catch(e){}
return false;
}

function cacheEncodeValue(expireAt,url){
return String(expireAt)+'|'+encodeURIComponent(url);
}

function cacheDecodeValue(text){
if(!text)return null;
var idx=text.indexOf('|');
if(idx===-1)return null;
var exp=parseInt(text.substring(0,idx),10);
if(!isFinite(exp)||exp<=0)return null;
var encoded=text.substring(idx+1);
var url='';
try{
url=decodeURIComponent(encoded);
}catch(e){
url=encoded;
}
if(!url||!isHttpUrl(url))return null;
return {expireAt:exp,url:url};
}

async function getCachedAudioUrl(id,level,minRemainSec){
if(level==='official')return null;
if(level==='external')return null;
var key=level+String(id);
var text=await cacheGetRaw(key);
var data=cacheDecodeValue(text);
if(!data)return null;
var remainSec=(data.expireAt-Date.now())/1000;
if(remainSec<minRemainSec)return null;
return data;
}

async function saveAudioUrlToCache(id,level,url,expi){
if(level==='official')return;
if(level==='external')return;
if(!url)return;
var expireAt=Date.now()+(expi||DEFAULT_EXPI)*1000;
var key=level+String(id);
var value=cacheEncodeValue(expireAt,url);
await cacheSetRaw(key,value);
}

async function getCachedCover(id){
var key='cover'+String(id);
var text=await cacheGetRaw(key);
var data=cacheDecodeValue(text);
if(!data)return '';
if(data.expireAt<Date.now())return '';
return data.url;
}

async function saveCoverToCache(id,picUrl){
if(!picUrl)return;
var key='cover'+String(id);
var expireAt=Date.now()+COVER_LYRIC_TTL_MS;
var value=cacheEncodeValue(expireAt,picUrl);
await cacheSetRaw(key,value);
}

async function getCachedLyric(id){
var key='lyric'+String(id);
var text=await cacheGetRaw(key);
if(!text)return null;
var idx=text.indexOf('|');
if(idx===-1)return null;
var exp=parseInt(text.substring(0,idx),10);
if(!isFinite(exp)||exp<Date.now())return null;
var jsonStr='';
try{
jsonStr=decodeURIComponent(text.substring(idx+1));
}catch(e){
return null;
}
try{
var obj=JSON.parse(jsonStr);
return {
main:String(obj.l||''),
trans:String(obj.t||''),
roma:String(obj.r||'')
};
}catch(e){
return null;
}
}

async function saveLyricToCache(id,main,trans,roma){
var key='lyric'+String(id);
var expireAt=Date.now()+COVER_LYRIC_TTL_MS;
var obj={l:main||'',t:trans||'',r:roma||''};
var jsonStr=JSON.stringify(obj);
var value=String(expireAt)+'|'+encodeURIComponent(jsonStr);
await cacheSetRaw(key,value);
}

// ==================== Media Session ====================
function updateMediaSessionMetadata(){
if(!('mediaSession' in navigator))return;
try{
var song=state.playlist[state.current];
if(!song){
navigator.mediaSession.metadata=new MediaMetadata({
title:SITE_TITLE,
artist:'',
album:'',
artwork:[{src:DEFAULT_ICON,sizes:'96x96',type:'image/png'}]
});
return;
}
var artwork=[];
if(song.pic){
artwork.push({src:song.pic,sizes:'512x512',type:'image/jpeg'});
artwork.push({src:song.pic,sizes:'256x256',type:'image/jpeg'});
artwork.push({src:song.pic,sizes:'192x192',type:'image/jpeg'});
artwork.push({src:song.pic,sizes:'96x96',type:'image/jpeg'});
}else{
artwork.push({src:DEFAULT_ICON,sizes:'96x96',type:'image/png'});
}
navigator.mediaSession.metadata=new MediaMetadata({
title:song.name||'未知歌曲',
artist:song.artist||'未知歌手',
album:SITE_TITLE,
artwork:artwork
});
}catch(e){}
}

function updateMediaSessionPlaybackState(){
if(!('mediaSession' in navigator))return;
try{
navigator.mediaSession.playbackState=state.playing?'playing':'paused';
}catch(e){}
}

function setupMediaSession(){
if(!('mediaSession' in navigator))return;
try{
navigator.mediaSession.setActionHandler('play',function(){togglePlay()});
navigator.mediaSession.setActionHandler('pause',function(){togglePlay()});
navigator.mediaSession.setActionHandler('previoustrack',function(){prevSong()});
navigator.mediaSession.setActionHandler('nexttrack',function(){nextSong()});
navigator.mediaSession.setActionHandler('stop',function(){
try{audio.pause();audio.currentTime=0;}catch(e){}
});
try{navigator.mediaSession.setActionHandler('seekbackward',function(d){
var t=audio.currentTime-(d&&d.seekOffset?d.seekOffset:10);
audio.currentTime=Math.max(0,t);
});}catch(e){}
try{navigator.mediaSession.setActionHandler('seekforward',function(d){
var t=audio.currentTime+(d&&d.seekOffset?d.seekOffset:10);
if(audio.duration)audio.currentTime=Math.min(audio.duration,t);
});}catch(e){}
try{navigator.mediaSession.setActionHandler('seekto',function(d){
if(d&&d.seekTime!==undefined)audio.currentTime=d.seekTime;
});}catch(e){}
}catch(e){}
updateMediaSessionMetadata();
}

// ==================== 官方接口探测（第三方代理） ====================
function probeOfficialLocal(id){
return Promise.resolve(OFFICIAL_PREFIX+encodeURIComponent(String(id)));
}

// ==================== 音频源控制 ====================
function stopAudio(){
try{audio.pause()}catch(e){}
if(hlsInstance){try{hlsInstance.destroy()}catch(e){}hlsInstance=null}
if(flvInstance){try{flvInstance.destroy()}catch(e){}flvInstance=null}
try{
audio.removeAttribute('src');
audio.load();
}catch(e){}
}

function resetProgressUI(){
try{$('seek').value='0';}catch(e){}
updateSeekBg(0);
$('curTime').textContent='0:00';
$('durTime').textContent='0:00';
}

// ==================== 封面缓存 ====================
var coverCache={};

function preloadCover(url){
if(!url)return;
var entry=coverCache[url];
if(entry&&(entry.state==='loading'||entry.state==='loaded'))return;
entry={state:'loading',img:null};
coverCache[url]=entry;
var img=new Image();
entry.img=img;
img.onload=function(){
entry.state='loaded';
var song=state.playlist[state.current];
if(song&&song.pic===url){
updateCoverDisplay();
scheduleMediaSessionUpdate();
}
};
img.onerror=function(){
entry.state='error';
var song=state.playlist[state.current];
if(song&&song.pic===url)updateCoverDisplay();
};
img.src=url;
}

function updateCoverDisplay(){
var song=state.playlist[state.current];
var imgEl=$('coverImg');
var fbEl=$('coverFallback');
var ldEl=$('coverLoading');
if(!song||!song.pic){
if(imgEl.getAttribute('src'))imgEl.removeAttribute('src');
imgEl.style.display='none';
ldEl.style.display='none';
if(song){
fbEl.style.display='flex';
}else{
fbEl.style.display='none';
}
return;
}
var pic=song.pic;
var entry=coverCache[pic];
if(!entry){
preloadCover(pic);
entry=coverCache[pic];
}
if(entry&&entry.state==='loaded'){
if(imgEl.getAttribute('src')!==pic)imgEl.src=pic;
imgEl.style.display='block';
ldEl.style.display='none';
fbEl.style.display='none';
}else if(entry&&entry.state==='error'){
if(imgEl.getAttribute('src'))imgEl.removeAttribute('src');
imgEl.style.display='none';
ldEl.style.display='none';
fbEl.style.display='flex';
}else{
if(imgEl.getAttribute('src'))imgEl.removeAttribute('src');
imgEl.style.display='none';
ldEl.style.display='flex';
fbEl.style.display='none';
}
}

// ==================== URL 过期检查 ====================
function shouldRefreshUrl(entry,song){
if(!entry||!entry.urlExpireAt)return false;
var now=Date.now();
var durSec=0;
if(song&&song.duration&&song.duration>0)durSec=song.duration;
if(durSec>0){
var deadline=entry.urlExpireAt-(durSec+URL_SAFETY_BUFFER)*1000;
return now>=deadline;
}
return now>=entry.urlExpireAt-15*60*1000;
}

function shouldRefreshUrlResume(entry,remainingSec){
if(!entry||!entry.urlExpireAt)return false;
if(!remainingSec||remainingSec<=0)return false;
var now=Date.now();
var deadline=entry.urlExpireAt-(remainingSec+URL_SAFETY_BUFFER)*1000;
return now>=deadline;
}

// ==================== 预加载系统 ====================
var preloadCache={};
var preloadTimers={};

function getPreloadEntry(id){
if(!id)return null;
if(!preloadCache[id]){
preloadCache[id]={
pic:'',lyric:'',lyricTrans:'',lyricRoma:'',
url:'',quality:'',urlExpireAt:0,
picDone:false,lyricDone:false,urlDone:false
};
}
return preloadCache[id];
}

async function preloadSongPic(song){
if(!song||!song.id)return;
var entry=getPreloadEntry(song.id);
if(!entry||entry.picDone)return;

if(song.pic){
entry.pic=song.pic;
entry.picDone=true;
preloadCover(song.pic);
return;
}

try{
var cachedPic=await getCachedCover(song.id);
if(cachedPic){
entry.pic=cachedPic;
entry.picDone=true;
song.pic=cachedPic;
preloadCover(cachedPic);
var cur0=state.playlist[state.current];
if(cur0===song)render();
return;
}
}catch(e){}

try{
var info=await post('/api/getSongInfo',{id:song.id});
var m=extractInfo(info);
if(m.pic){
entry.pic=m.pic;
entry.picDone=true;
song.pic=m.pic;
if(!song.duration&&m.duration>0)song.duration=m.duration;
preloadCover(m.pic);
await saveCoverToCache(song.id,m.pic);
var cur=state.playlist[state.current];
if(cur===song)render();
return;
}
}catch(e){}

try{
var sr=await post('/api/search',{word:song.name||''});
if(sr&&sr.pic){
entry.pic=sr.pic;
entry.picDone=true;
song.pic=sr.pic;
preloadCover(sr.pic);
await saveCoverToCache(song.id,sr.pic);
var cur2=state.playlist[state.current];
if(cur2===song)render();
return;
}
}catch(e){}

schedulePreloadRetry(song,'pic');
}

async function preloadSongLyric(song){
if(!song||!song.id)return;
var entry=getPreloadEntry(song.id);
if(!entry||entry.lyricDone)return;

if(song.external){
entry.lyricDone=true;
return;
}

try{
var cached=await getCachedLyric(song.id);
if(cached){
entry.lyric=cached.main;
entry.lyricTrans=cached.trans;
entry.lyricRoma=cached.roma;
entry.lyricDone=true;
var cur0=state.playlist[state.current];
if(cur0===song){
state.lyric=cached.main||'暂无歌词';
state.lyricTrans=cached.trans;
state.lyricRoma=cached.roma;
state.lyricLoading=false;
state._lastLyricKey=null;
render();
}
return;
}
}catch(e){}

try{
var lr=await post('/api/getSongLyric',{id:song.id});
var m=extractLyricMulti(lr);
entry.lyric=m.main||'';
entry.lyricTrans=m.trans||'';
entry.lyricRoma=m.roma||'';
entry.lyricDone=true;

await saveLyricToCache(song.id,entry.lyric,entry.lyricTrans,entry.lyricRoma);

var cur=state.playlist[state.current];
if(cur===song){
state.lyric=entry.lyric||'暂无歌词';
state.lyricTrans=entry.lyricTrans;
state.lyricRoma=entry.lyricRoma;
state.lyricLoading=false;
state._lastLyricKey=null;
render();
}
return;
}catch(e){}

schedulePreloadRetry(song,'lyric');
}

async function preloadSongUrl(song){
if(!song||!song.id)return;
var entry=getPreloadEntry(song.id);
if(!entry)return;

if(song.external){
entry.url=song.url;
entry.quality='external';
entry.urlExpireAt=0;
entry.urlDone=true;
return;
}

if(entry.urlDone)return;
if(entry.quality==='exhigh'){
entry.urlDone=true;
return;
}

var dur=song.duration&&song.duration>0?song.duration:360;
var needRemain=dur+URL_SAFETY_BUFFER;

for(var k=0;k<LEVELS.length;k++){
var lv=LEVELS[k];
var cached=await getCachedAudioUrl(song.id,lv,needRemain);
if(cached){
entry.url=cached.url;
entry.quality=lv;
entry.urlExpireAt=cached.expireAt;
if(lv==='exhigh'){
entry.urlDone=true;
return;
}
break;
}
}

for(var i=0;i<3;i++){
try{
var r=await fetchPlayUrlOnce(song.id);
if(r&&r.url&&isHttpUrl(r.url)){
if(!entry.quality||qualityRank(r.level)>=qualityRank(entry.quality)){
entry.url=r.url;
entry.quality=r.level;
entry.urlExpireAt=Date.now()+(r.expi||DEFAULT_EXPI)*1000;
await saveAudioUrlToCache(song.id,r.level,r.url,r.expi);
}
if(entry.quality==='exhigh'){
entry.urlDone=true;
return;
}
}
}catch(e){}
}

schedulePreloadRetry(song,'url');
}

function schedulePreloadRetry(song,type){
if(!song||!song.id)return;
if(!preloadTimers[song.id])preloadTimers[song.id]={pic:null,lyric:null,url:null};
var t=preloadTimers[song.id];
if(t[type])return;
t[type]=setTimeout(function(){
t[type]=null;
if(state.playlist.indexOf(song)===-1)return;
if(type==='pic')preloadSongPic(song);
else if(type==='lyric')preloadSongLyric(song);
else preloadSongUrl(song);
},PRELOAD_RETRY);
}

function triggerPreloadNeighbors(){
var len=state.playlist.length;
var curIdx=state.current;
if(curIdx<0||len<1)return;
var scheduledIdx=curIdx;
setTimeout(function(){
if(state.current!==scheduledIdx)return;
var curSong=state.playlist[curIdx];
if(!curSong)return;
var prevIdx=(curIdx-1+len)%len;
var nextIdx=(curIdx+1)%len;
var targets=[];
var prevSong=state.playlist[prevIdx];
var nextSong=state.playlist[nextIdx];
if(prevSong&&prevSong!==curSong)targets.push(prevSong);
if(nextSong&&nextSong!==curSong&&nextSong!==prevSong)targets.push(nextSong);
for(var i=0;i<targets.length;i++){
preloadSongPic(targets[i]);
preloadSongLyric(targets[i]);
preloadSongUrl(targets[i]);
}
},PRELOAD_DELAY);
}

// ==================== gzip ====================
function bytesToBase64(bytes){
var bin='';
var chunk=0x8000;
for(var i=0;i<bytes.length;i+=chunk){
var sub=bytes.subarray(i,i+chunk);
bin+=String.fromCharCode.apply(null,sub);
}
return btoa(bin);
}
function base64ToBytes(b64){
var bin=atob(b64);
var bytes=new Uint8Array(bin.length);
for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
return bytes;
}
async function gzipCompress(text){
if(typeof CompressionStream==='undefined')return null;
try{
var cs=new CompressionStream('gzip');
var writer=cs.writable.getWriter();
writer.write(new TextEncoder().encode(text));
writer.close();
var chunks=[];
var reader=cs.readable.getReader();
while(true){
var r=await reader.read();
if(r.done)break;
chunks.push(r.value);
}
var total=0;
for(var i=0;i<chunks.length;i++)total+=chunks[i].length;
var all=new Uint8Array(total);
var off=0;
for(var i=0;i<chunks.length;i++){all.set(chunks[i],off);off+=chunks[i].length;}
return bytesToBase64(all);
}catch(e){return null;}
}
async function gzipDecompress(b64){
if(typeof DecompressionStream==='undefined')return null;
try{
var bytes=base64ToBytes(b64);
var ds=new DecompressionStream('gzip');
var writer=ds.writable.getWriter();
writer.write(bytes);
writer.close();
var chunks=[];
var reader=ds.readable.getReader();
while(true){
var r=await reader.read();
if(r.done)break;
chunks.push(r.value);
}
var total=0;
for(var i=0;i<chunks.length;i++)total+=chunks[i].length;
var all=new Uint8Array(total);
var off=0;
for(var i=0;i<chunks.length;i++){all.set(chunks[i],off);off+=chunks[i].length;}
return new TextDecoder().decode(all);
}catch(e){return null;}
}
async function decodeImportText(text){
text=String(text||'').trim();
if(!text)return null;
if(text.indexOf('#GZIP')===0){
var b64=text.substring(6).trim();
var decoded=await gzipDecompress(b64);
return decoded;
}
return text;
}

// ==================== 歌词解析 ====================
function parseRichLyric(raw){
if(!raw||typeof raw!=='string')return '';
if(raw.indexOf('{"t":')===-1&&raw.indexOf('"c":[')===-1)return raw;

var lines=raw.split(LF);
var credits=[];
var lyrics=[];

for(var i=0;i<lines.length;i++){
var line=lines[i];
var trimmed=line.split(CR).join('').trim();
if(!trimmed)continue;

if(trimmed.charAt(0)==='{'&&trimmed.indexOf('"c"')!==-1){
try{
var obj=JSON.parse(trimmed);
if(obj&&Array.isArray(obj.c)){
var text='';
for(var j=0;j<obj.c.length;j++){
if(obj.c[j]&&typeof obj.c[j].tx==='string'){
text+=obj.c[j].tx;
}
}
text=text.trim();
if(text&&credits.indexOf(text)===-1)credits.push(text);
}
}catch(e){}
continue;
}
lyrics.push(line.split(CR).join(''));
}

var out='';
if(credits.length){
out+=credits.join(LF);
if(lyrics.length)out+=LF+LF;
}
out+=lyrics.join(LF);
return out;
}

function parseTimeTagContent(content){
if(!content)return null;
var colon=content.indexOf(':');
if(colon===-1)return null;
var minStr=content.substring(0,colon);
var rest=content.substring(colon+1);
if(!isAllDigits(minStr))return null;
var dot=rest.indexOf('.');
var secStr=dot===-1?rest:rest.substring(0,dot);
var msStr=dot===-1?'':rest.substring(dot+1);
if(!isAllDigits(secStr))return null;
if(msStr&&!isAllDigits(msStr))return null;
var min=parseInt(minStr,10);
var sec=parseInt(secStr,10);
var ms=0;
if(msStr){
var m3=msStr;
while(m3.length<3)m3+='0';
m3=m3.substring(0,3);
ms=parseInt(m3,10);
}
return min*60+sec+ms/1000;
}

function stripTimeTags(line){
var tags=[];
var j=0;
while(j<line.length){
var lb=line.indexOf('[',j);
if(lb===-1)break;
var rb=line.indexOf(']',lb);
if(rb===-1)break;
var content=line.substring(lb+1,rb);
var t=parseTimeTagContent(content);
if(t===null){j=rb+1;continue;}
tags.push({time:t,start:lb,end:rb+1});
j=rb+1;
}
var pure=line;
if(tags.length){
for(var k=tags.length-1;k>=0;k--){
pure=pure.substring(0,tags[k].start)+pure.substring(tags[k].end);
}
pure=pure.trim();
}
return {tags:tags,pure:pure};
}

function parseLyricLines(text){
var rawLines=String(text||'').split(LF);
var result=[];
var hasTime=false;
var anyMultiTag=false;
for(var i=0;i<rawLines.length;i++){
var line=rawLines[i].split(CR).join('');
if(!line)continue;
var parsed=stripTimeTags(line);
if(!parsed.pure)continue;
if(parsed.tags.length===0){
result.push({time:null,text:parsed.pure});
}else{
hasTime=true;
if(parsed.tags.length>1)anyMultiTag=true;
for(var k=0;k<parsed.tags.length;k++){
result.push({time:parsed.tags[k].time,text:parsed.pure});
}
}
}
if(hasTime&&anyMultiTag){
result.sort(function(a,b){
var ta=a.time===null?-1:a.time;
var tb=b.time===null?-1:b.time;
return ta-tb;
});
}
return {lines:result,hasTime:hasTime};
}

function pickLyricField(obj,keys){
if(!obj||typeof obj!=='object')return '';
for(var i=0;i<keys.length;i++){
var v=obj[keys[i]];
if(!v)continue;
if(typeof v==='string'&&v.trim())return v;
if(typeof v==='object'&&typeof v.lyric==='string'&&v.lyric.trim())return v.lyric;
}
return '';
}

function extractLyricMulti(r){
if(!r)return {main:'',trans:'',roma:''};
if(typeof r==='string')return {main:parseRichLyric(r),trans:'',roma:''};

var candidates=[r,r.data,r.result,r.data&&r.data.data,r.result&&r.result.data];
var main='',trans='',roma='';
for(var i=0;i<candidates.length;i++){
var c=candidates[i];
if(!c||typeof c!=='object')continue;
if(!main)main=pickLyricField(c,['lrc','lyric','lyrics','lrcText']);
if(!trans)trans=pickLyricField(c,['tlyric','translation','trans']);
if(!roma)roma=pickLyricField(c,['romalrc','roma','romaji','klyric']);
}
if(!main){
var legacy=[
r.lyric,r.lyrics,r.lrcText,r.lrc,
r.data&&r.data.lyric,r.data&&r.data.lyrics,r.data&&r.data.lrcText,r.data&&r.data.lrc,
r.data&&r.data.data&&r.data.data.lyric,
r.data&&r.data.data&&r.data.data.lrc,
r.result&&r.result.lyric,
r.result&&r.result.lrc
];
for(var i=0;i<legacy.length;i++){
var v=legacy[i];
if(!v)continue;
if(typeof v==='string'&&v.trim()){main=v;break;}
if(typeof v==='object'&&typeof v.lyric==='string'&&v.lyric.trim()){main=v.lyric;break;}
}
}
return {main:parseRichLyric(main),trans:parseRichLyric(trans),roma:parseRichLyric(roma)};
}

function attachText(mainLines,otherLines,key){
for(var i=0;i<mainLines.length;i++)mainLines[i][key]='';
if(!otherLines.length)return;
var sorted=[];
for(var i=0;i<otherLines.length;i++){
if(otherLines[i].time!==null)sorted.push(otherLines[i]);
}
sorted.sort(function(a,b){return a.time-b.time});
if(!sorted.length)return;
for(var i=0;i<mainLines.length;i++){
var m=mainLines[i];
if(m.time===null)continue;
var best=null,bestDiff=0.35;
for(var j=0;j<sorted.length;j++){
var t=sorted[j].time;
if(t>m.time+0.35)break;
var d=Math.abs(t-m.time);
if(d<bestDiff){bestDiff=d;best=sorted[j];}
}
if(best)m[key]=best.text;
}
}

function buildLyricView(){
var parsed=parseLyricLines(state.lyric||'');
var mainLines=parsed.lines;
var transLines=state.lyricTrans?parseLyricLines(state.lyricTrans).lines:[];
var romaLines=state.lyricRoma?parseLyricLines(state.lyricRoma).lines:[];

attachText(mainLines,transLines,'trans');
attachText(mainLines,romaLines,'roma');

state.lyricLines=mainLines;
state.lyricHasTime=parsed.hasTime;
state.lyricCurrent=-1;
state.lyricUserScrolled=false;

var box=$('lyricText');
box.innerHTML='';
if(!mainLines.length){
var d=document.createElement('div');
d.className='line';
if(state.lyricLoading)d.className+=' loading';
var dm=document.createElement('div');
dm.className='line-main';
if(state.lyricLoading){
dm.textContent='正在加载歌词...';
}else{
dm.textContent=state.lyric||'暂无歌词';
}
d.appendChild(dm);
box.appendChild(d);
updateLyricToolbar();
return;
}

for(var i=0;i<mainLines.length;i++){
var line=mainLines[i];
var el=document.createElement('div');
el.className='line';
el.setAttribute('data-i',String(i));

var mainEl=document.createElement('div');
mainEl.className='line-main';
mainEl.textContent=line.text;
el.appendChild(mainEl);

if(line.trans&&state.transEnabled){
var te=document.createElement('div');
te.className='line-trans';
te.textContent=line.trans;
el.appendChild(te);
}
if(line.roma&&state.romaEnabled){
var re=document.createElement('div');
re.className='line-roma';
re.textContent=line.roma;
el.appendChild(re);
}
box.appendChild(el);
}
updateLyricToolbar();
}

function updateLyricToolbar(){
var hasTrans=!!(state.lyricTrans&&state.lyricTrans.trim());
var hasRoma=!!(state.lyricRoma&&state.lyricRoma.trim());
var tb=$('transBtn');
var rb=$('romaBtn');
if(hasTrans)tb.classList.remove('hidden');else tb.classList.add('hidden');
if(hasRoma)rb.classList.remove('hidden');else rb.classList.add('hidden');
if(hasTrans&&state.transEnabled)tb.classList.add('on');else tb.classList.remove('on');
if(hasRoma&&state.romaEnabled)rb.classList.add('on');else rb.classList.remove('on');
}

function updateLyricScroll(force){
if(!state.lyricHasTime)return;
if(!state.lyricLines.length)return;
var t=audio.currentTime||0;
var cur=-1;
for(var i=0;i<state.lyricLines.length;i++){
var lt=state.lyricLines[i].time;
if(lt===null)continue;
if(lt<=t)cur=i;
else break;
}
if(cur===state.lyricCurrent&&!force)return;
state.lyricCurrent=cur;

var box=$('lyricText');
var lines=box.children;
for(var i=0;i<lines.length;i++){
if(i===cur)lines[i].classList.add('current');
else lines[i].classList.remove('current');
}
if(cur<0)return;
if(state.lyricUserScrolled)return;
var el=lines[cur];
if(!el)return;
var outer=$('lyricBox');
var outerRect=outer.getBoundingClientRect();
var elRect=el.getBoundingClientRect();
var target=outer.scrollTop+(elRect.top-outerRect.top)-outer.clientHeight/2+el.clientHeight/2;
if(target<0)target=0;
try{outer.scrollTo({top:target,behavior:'smooth'})}
catch(e){outer.scrollTop=target}
}

function markLyricUserScrolled(){
state.lyricUserScrolled=true;
if(state._lyricScrollTimer)clearTimeout(state._lyricScrollTimer);
state._lyricScrollTimer=setTimeout(function(){state.lyricUserScrolled=false},4000);
}

// ==================== 其他解析工具 ====================
function extractInfo(data){
var d=data&&data.data?data.data:data;
var song=(d&&d.songs&&d.songs[0])||(Array.isArray(d)?d[0]:null)||(d&&d.song)||d||{};
var name=song.name||song.songName||song.title||'';
var artists=song.ar||song.artists||song.singer||song.artist||[];
var artist='';
if(Array.isArray(artists)){artist=artists.map(function(a){return a&&a.name?a.name:a}).filter(Boolean).join(' / ')}
else if(artists&&typeof artists==='object'){artist=artists.name||''}
else if(typeof artists==='string'){artist=artists}
var pic=(song.al&&song.al.picUrl)||(song.album&&song.album.picUrl)||song.picUrl||song.pic||song.cover||song.picimg||'';
var duration=0;
if(typeof song.dt==='number'&&song.dt>0)duration=song.dt/1000;
else if(typeof song.duration==='number'&&song.duration>0)duration=song.duration/1000;
else if(typeof song.duration==='string'&&song.duration.length>0){
var parts=song.duration.split(':');
if(parts.length===2){
var mm=parseInt(parts[0],10);
var ss=parseInt(parts[1],10);
if(isFinite(mm)&&isFinite(ss))duration=mm*60+ss;
}
}
return {name:name,artist:artist,pic:pic,duration:duration};
}
function uid(){return 'ext_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function getQualityText(song,quality){
if(!quality)return '';
if(quality==='external'){
var fm=song&&song.format?song.format.toUpperCase():'';
return fm?'外部音源 · '+fm:'外部音源';
}
if(quality==='unavailable')return '不可用';
return QUALITY_LABEL[quality]||'';
}

// ==================== 去重工具 ====================
// URL 规范化：协议无关、尾斜杠无关、主机名大小写无关、IDN 自动转 punycode
function normalizeUrlForKey(u){
if(!u)return '';
var s=String(u).trim();
if(!s)return '';
var low=s.toLowerCase();
if(low.indexOf('http://')!==0&&low.indexOf('https://')!==0){
s='https://'+s;
}
try{
var uo=new URL(s);
var host=(uo.hostname||'').toLowerCase();
var port=uo.port||'';
var path=uo.pathname||'/';
while(path.length>1&&path.charAt(path.length-1)==='/')path=path.substring(0,path.length-1);
if(path==='/')path='';
var search=uo.search||'';
var key=host;
if(port)key+=':'+port;
key+=path+search;
return key;
}catch(e){
var m=s.replace(/^[a-zA-Z]+:\/\//,'');
var cut=m.indexOf('/');
if(cut!==-1)m=m.substring(0,cut);
return m.toLowerCase();
}
}

// 一首歌可能对应多个去重键（外部音源同时看 srcUrl 和 url）
function getSongDedupKeys(song){
var keys=[];
if(!song)return keys;
if(song.external){
var u1=normalizeUrlForKey(song.url||'');
if(u1)keys.push('ext:'+u1);
var u2=normalizeUrlForKey(song.srcUrl||'');
if(u2&&u2!==u1)keys.push('ext:'+u2);
}else{
if(song.id)keys.push('id:'+String(song.id));
}
return keys;
}

// 目标歌曲与列表内任一歌曲有任一 key 相同 → 重复
function isDuplicateSong(song,list){
var k=getSongDedupKeys(song);
if(!k.length)return false;
var seen={};
for(var i=0;i<list.length;i++){
var lk=getSongDedupKeys(list[i]);
for(var j=0;j<lk.length;j++)seen[lk[j]]=true;
}
for(var i=0;i<k.length;i++){
if(seen[k[i]])return true;
}
return false;
}

function addKeysToSeen(seen,song){
var keys=getSongDedupKeys(song);
for(var i=0;i<keys.length;i++)seen[keys[i]]=true;
}

function hasAnyKeyInSeen(seen,song){
var keys=getSongDedupKeys(song);
for(var i=0;i<keys.length;i++){
if(seen[keys[i]])return true;
}
return false;
}

// ==================== HLS / FLV 加载 ====================
function loadHlsJs(){
if(window.Hls)return Promise.resolve();
if(hlsLoading)return hlsLoading;
hlsLoading=new Promise(function(resolve,reject){
var s=document.createElement('script');
s.src=HLS_CDN;
s.onload=function(){resolve()};
s.onerror=function(){hlsLoading=null;reject(new Error('hls.js 加载失败'))};
document.head.appendChild(s);
});
return hlsLoading;
}

function loadFlvJs(){
if(window.flvjs)return Promise.resolve();
if(flvLoading)return flvLoading;
flvLoading=new Promise(function(resolve,reject){
var s=document.createElement('script');
s.src=FLV_CDN;
s.onload=function(){resolve()};
s.onerror=function(){flvLoading=null;reject(new Error('flv.js 加载失败'))};
document.head.appendChild(s);
});
return flvLoading;
}

// ==================== 带编码检测的媒体加载 ====================

function loadPlainMedia(url){
return new Promise(function(resolve,reject){
var settled=false;
var timer=null;
function onLoaded(){
if(settled)return;
settled=true;
cleanup();
audio.play().catch(function(){});
resolve();
}
function onError(){
if(settled)return;
settled=true;
var err=audio.error;
cleanup();
var msg='无法播放该音源';
if(err){
if(err.code===4)msg='浏览器不支持该视频/音频编码';
else if(err.code===3)msg='解码失败（编码不支持）';
else if(err.code===2)msg='网络错误，无法加载';
else if(err.code===1)msg='播放被中止';
}
reject(new Error(msg));
}
function cleanup(){
if(timer)clearTimeout(timer);
audio.removeEventListener('loadedmetadata',onLoaded);
audio.removeEventListener('error',onError);
}
audio.addEventListener('loadedmetadata',onLoaded);
audio.addEventListener('error',onError);
timer=setTimeout(function(){
if(settled)return;
settled=true;
cleanup();
reject(new Error('加载超时'));
},15000);

if(hlsInstance){try{hlsInstance.destroy()}catch(e){}hlsInstance=null}
if(flvInstance){try{flvInstance.destroy()}catch(e){}flvInstance=null}
try{
audio.src=url;
audio.load();
}catch(e){
cleanup();
reject(new Error('设置音源失败'));
}
});
}

function loadHlsWithCodecCheck(url){
if(window.Hls)return loadHlsWithCodecCheckInner(url);
return loadHlsJs().then(function(){return loadHlsWithCodecCheckInner(url)});
}

function loadHlsWithCodecCheckInner(url){
if(!window.Hls||!Hls.isSupported()){
return Promise.reject(new Error('浏览器不支持 HLS 播放'));
}
return new Promise(function(resolve,reject){
var h=new Hls({enableWorker:true,lowLatencyMode:false});
var settled=false;
var timer=null;

function fail(msg){
if(settled)return;
settled=true;
if(timer)clearTimeout(timer);
try{h.destroy()}catch(e){}
reject(new Error(msg));
}

h.on(Hls.Events.MANIFEST_PARSED,function(event,data){
if(settled)return;
var levels=(data&&data.levels)||[];
var unsupported='';
for(var i=0;i<levels.length;i++){
var lv=levels[i];
var vCodec=normalizeCodec(lv.videoCodec);
var aCodec=normalizeCodec(lv.audioCodec);
if(vCodec&&!isCodecSupported('video/mp4',vCodec,true)){
unsupported=vCodec;
break;
}
if(aCodec&&!isCodecSupported('audio/mp4',aCodec,true)){
unsupported=aCodec;
break;
}
}
if(unsupported){
fail('浏览器不支持该视频编码：'+unsupported);
return;
}
settled=true;
if(timer)clearTimeout(timer);
if(hlsInstance){try{hlsInstance.destroy()}catch(e){}}
hlsInstance=h;
h.attachMedia(audio);
audio.play().catch(function(){});
resolve();
});

h.on(Hls.Events.ERROR,function(e,data){
if(settled)return;
if(data&&data.fatal){
fail('HLS 加载失败：'+(data.details||'未知错误'));
}
});

timer=setTimeout(function(){
if(!settled)fail('HLS 加载超时');
},15000);

try{
h.loadSource(url);
}catch(e){
fail('HLS 加载失败：'+e.message);
}
});
}

function loadFlvWithCheck(url){
if(window.flvjs)return loadFlvWithCheckInner(url);
return loadFlvJs().then(function(){return loadFlvWithCheckInner(url)});
}

function loadFlvWithCheckInner(url){
if(!window.flvjs||!flvjs.isSupported()){
return Promise.reject(new Error('浏览器不支持 FLV 播放'));
}
return new Promise(function(resolve,reject){
var settled=false;
var timer=null;

function fail(msg){
if(settled)return;
settled=true;
if(timer)clearTimeout(timer);
try{if(flvInstance)flvInstance.destroy()}catch(e){}
flvInstance=null;
reject(new Error(msg));
}

if(flvInstance){try{flvInstance.destroy()}catch(e){}}
flvInstance=flvjs.createPlayer({
type:'flv',
url:url,
isLive:false,
hasAudio:true,
hasVideo:false,
stashInitialSize:256
},{
enableWorker:true,
enableStashBuffer:false
});

flvInstance.on(flvjs.Events.ERROR,function(errType,errDetail){
if(settled)return;
var msg='FLV 播放失败';
if(errDetail)msg+='：'+errDetail;
else if(errType)msg+='：'+errType;
msg+='（可能是不支持的编码）';
fail(msg);
});

timer=setTimeout(function(){
if(!settled)fail('FLV 加载超时');
},15000);

try{
flvInstance.attachMediaElement(audio);
flvInstance.load();
flvInstance.play().catch(function(){});
setTimeout(function(){
if(settled)return;
settled=true;
if(timer)clearTimeout(timer);
resolve();
},800);
}catch(e){
fail('FLV 初始化失败：'+e.message);
}
});
}

// ==================== 设置音频源（带编码检测） ====================
async function setAudioSource(url,format){
if(isFlvFormat(url,format)){
if(audio.canPlayType('video/x-flv')){
return loadPlainMedia(url);
}
return loadFlvWithCheck(url);
}

if(isHlsFormat(url,format)){
if(audio.canPlayType('application/vnd.apple.mpegurl')){
return loadPlainMedia(url);
}
return loadHlsWithCodecCheck(url);
}

return loadPlainMedia(url);
}

// ==================== Cookie ====================
function setCookieRaw(name,value){
var exp=new Date(Date.now()+365*864e5).toUTCString();
document.cookie=name+'='+value+'; expires='+exp+'; path=/; SameSite=Lax';
}
function getCookieRaw(name){
var parts=document.cookie.split(';');
for(var i=0;i<parts.length;i++){
var p=parts[i].trim();
if(p.indexOf(name+'=')===0)return p.substring(name.length+1);
}
return null;
}
function savePlaylist(){
var data=state.playlist.map(function(s){
var obj={id:s.id,name:s.name||'',artist:s.artist||''};
if(s.external){obj.ext=true;obj.url=s.url||'';obj.srcUrl=s.srcUrl||'';obj.format=s.format||'';}
return obj;
});
while(data.length>0){
var encoded=encodeURIComponent(JSON.stringify(data));
if(encoded.length<=COOKIE_MAX){break}
data.pop();
}
try{setCookieRaw(COOKIE_NAME,encodeURIComponent(JSON.stringify(data)))}catch(e){}
}
function restorePlaylist(){
var raw=getCookieRaw(COOKIE_NAME);
if(!raw)return;
try{
var list=JSON.parse(decodeURIComponent(raw));
if(!Array.isArray(list))return;
state.playlist=list.map(function(s){
var obj={id:String(s.id||''),name:s.name||'未知歌曲',artist:s.artist||'未知歌手',pic:'',duration:0};
if(s.ext){obj.external=true;obj.url=String(s.url||'');obj.srcUrl=String(s.srcUrl||'');obj.format=String(s.format||'');}
return obj;
}).filter(function(s){
if(!s.id)return false;
if(s.external&&!s.url)return false;
return true;
});
}catch(e){state.playlist=[]}
}
function clearPlaylistCookie(){
document.cookie=COOKIE_NAME+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
}

// ==================== 导入 / 导出 ====================
function exportListText(){
return state.playlist.map(function(s){
var name=(s.name||'').split('|').join(' ');
var artist=(s.artist||'').split('|').join(' ');
if(s.external){
return (s.url||'')+'|'+name+'|'+artist+'|'+(s.srcUrl||'');
}
return s.id+'|'+name+'|'+artist;
}).join(LF);
}
function parseListText(text){
var lines=String(text||'').split(LF);
var out=[];
var seen={};
for(var i=0;i<lines.length;i++){
var line=lines[i].split(CR).join('').trim();
if(!line)continue;
if(line.charAt(0)==='#')continue;
var parts=line.split('|');
var key=(parts[0]||'').trim();
if(!key)continue;

var item=null;
if(isSongId(key)){
item={id:key,name:(parts[1]||'').trim()||'未知歌曲',artist:(parts[2]||'').trim()||'未知歌手',pic:'',duration:0};
}else if(isHttpUrl(key)){
var srcUrl=(parts[3]||'').trim();
if(!isHttpUrl(srcUrl))srcUrl='';
item={id:uid(),name:(parts[1]||'').trim()||'外部音源',artist:(parts[2]||'').trim()||'外部音源',pic:'',external:true,url:key,srcUrl:srcUrl,format:getFormatFromUrl(key)};
}
if(!item)continue;

if(hasAnyKeyInSeen(seen,item))continue;
addKeysToSeen(seen,item);
out.push(item);
}
return out;
}
function applyImport(imported,mode){
if(!imported.length)return 0;
if(mode==='replace'){state.playlist=imported.slice();return imported.length;}
var seen={};
state.playlist.forEach(function(s){addKeysToSeen(seen,s)});
var added=0;
imported.forEach(function(s){
if(hasAnyKeyInSeen(seen,s))return;
state.playlist.push(s);
addKeysToSeen(seen,s);
added++;
});
return added;
}

// ==================== 播放链接检测 ====================
async function fetchPlayUrlOnce(id){
for(var i=0;i<LEVELS.length;i++){
try{
var r=await post('/api/getSongUrl',{id:id,level:LEVELS[i]});
var url=extractUrl(r);
if(url&&isHttpUrl(url)){return {url:url,level:LEVELS[i],expi:extractExpi(r)};}
}catch(e){}
}
var officialUrl=await probeOfficialLocal(id);
if(officialUrl){
return {url:officialUrl,level:'official',expi:0};
}
return null;
}

async function tryGetLevelWithCache(id,level,minRemainSec){
if(level!=='official'){
var cached=await getCachedAudioUrl(id,level,minRemainSec);
if(cached){
var expi=Math.max(1,Math.floor((cached.expireAt-Date.now())/1000));
return {url:cached.url,level:level,expi:expi,fromCache:true};
}
}
for(var i=0;i<DETECT_TIMES;i++){
try{
var r=await fetchPlayUrlLevelOnce(id,level);
if(r&&r.url){
if(level!=='official'){
await saveAudioUrlToCache(id,level,r.url,r.expi);
}
return {url:r.url,level:level,expi:r.expi};
}
}catch(e){}
}
return null;
}

async function fetchPlayUrl(id,durationHint){
var durSec=(durationHint&&durationHint>0)?durationHint:360;
var needRemain=durSec+URL_SAFETY_BUFFER;

var r1=await tryGetLevelWithCache(id,'exhigh',needRemain);
if(r1)return r1;

var r2=await tryGetLevelWithCache(id,'standard',needRemain);
if(r2)return r2;

var officialUrl=await probeOfficialLocal(id);
if(officialUrl){
return {url:officialUrl,level:'official',expi:0};
}

throw new Error('暂无可用音源');
}

async function fetchPlayUrlLevelOnce(id,level){
if(level==='official'){
var officialUrl=await probeOfficialLocal(id);
if(officialUrl){
return {url:officialUrl,expi:0};
}
return null;
}
try{
var r=await post('/api/getSongUrl',{id:id,level:level});
var url=extractUrl(r);
if(url&&isHttpUrl(url)){
return {url:url,expi:extractExpi(r)};
}
}catch(e){}
return null;
}

async function fetchPlayUrlLevel(id,level,minRemainSec){
if(level==='official')return '';
if(typeof minRemainSec!=='number')minRemainSec=300;

var cached=await getCachedAudioUrl(id,level,minRemainSec);
if(cached)return cached.url;

for(var attempt=0;attempt<DETECT_TIMES;attempt++){
var r=await fetchPlayUrlLevelOnce(id,level);
if(r&&r.url){
await saveAudioUrlToCache(id,level,r.url,r.expi);
return r.url;
}
}
return '';
}

// ==================== 解析输入 ====================
async function fetchMetaById(id){
var idStr=String(id);
var name='',artist='',pic='',duration=0;

for(var i=0;i<state.playlist.length;i++){
var s=state.playlist[i];
if(s.id===idStr&&!s.external){
if(s.name&&s.name!=='未知歌曲')name=s.name;
if(s.artist&&s.artist!=='未知歌手')artist=s.artist;
if(s.pic)pic=s.pic;
if(s.duration&&s.duration>0)duration=s.duration;
break;
}
}

if(!pic){
try{
var cachedPic=await getCachedCover(idStr);
if(cachedPic)pic=cachedPic;
}catch(e){}
}

if(!name||!artist||!pic){
try{
var info=await post('/api/getSongInfo',{id:idStr});
var m=extractInfo(info);
if(!name&&m.name)name=m.name;
if(!artist&&m.artist)artist=m.artist;
if(!pic&&m.pic){
pic=m.pic;
await saveCoverToCache(idStr,m.pic);
}
if(!duration&&m.duration>0)duration=m.duration;
}catch(e){}
}

if((!pic||!name)&&name){
try{
var r=await post('/api/search',{word:name});
if(r&&r.id&&r.id===idStr){
if(!pic&&r.pic){
pic=r.pic;
await saveCoverToCache(idStr,r.pic);
}
if(!artist&&r.artist)artist=r.artist;
}
}catch(e){}
}

return {id:idStr,name:name||'未知歌曲',artist:artist||'未知歌手',pic:pic||'',duration:duration};
}

async function detectNeteaseQualityOnce(id,durationHint){
var durSec=(durationHint&&durationHint>0)?durationHint:0;
var minExpi=durSec>0?(durSec+URL_SAFETY_BUFFER):0;
for(var i=0;i<LEVELS.length;i++){
try{
var r=await post('/api/getSongUrl',{id:id,level:LEVELS[i]});
var url=extractUrl(r);
if(url&&isHttpUrl(url)){
var expi=extractExpi(r)||DEFAULT_EXPI;
if(minExpi>0&&expi<minExpi)continue;
await saveAudioUrlToCache(id,LEVELS[i],url,expi);
return LEVELS[i];
}
}catch(e){}
}
var officialUrl=await probeOfficialLocal(id);
if(officialUrl)return 'official';
return '';
}

async function detectNeteaseQuality(id,durationHint){
var hasDuration=(durationHint&&durationHint>0);
var durSec=hasDuration?durationHint:0;
var needRemain=hasDuration?(durSec+URL_SAFETY_BUFFER):300;

for(var i=0;i<LEVELS.length;i++){
var lv=LEVELS[i];
var cached=await getCachedAudioUrl(id,lv,needRemain);
if(cached)return lv;
}

var best='';
for(var attempt=0;attempt<DETECT_TIMES;attempt++){
var q=await detectNeteaseQualityOnce(id,durSec);
if(q&&qualityRank(q)>qualityRank(best))best=q;
if(best&&qualityRank(best)>=MAX_PLAY_RANK)break;
}
return best;
}

async function tryNeteaseLink(url){
var r=await post('/api/resolve',{url:url});
if(r&&r.id){
var m=await fetchMetaById(r.id);
var q=await detectNeteaseQuality(r.id,m.duration);
if(q){
m.quality=q;
return m;
}
}
return null;
}

async function tryThirdPartyLink(url){
var check=await post('/api/checkAudio',{url:url});
if(check&&check.ok){
var fmt=check.format||getFormatFromUrl(url);
return {
id:uid(),
name:check.name||'外部音源',
artist:isVideoFormat(fmt)?'视频音源':'外部音源',
pic:'',
external:true,
url:check.url||url,
srcUrl:url,
format:fmt,
quality:'external'
};
}
return null;
}

async function resolveInput(text){
text=(text||'').trim();
if(!text)throw new Error('请输入内容');

if(isSongId(text)){
var meta=await fetchMetaById(text);
var q=await detectNeteaseQuality(text,meta.duration);
if(!q)throw new Error('该歌曲暂无可用音源');
meta.quality=q;
return meta;
}

var urls=extractAllUrlsFromText(text);
if(urls.length>0){
for(var i=0;i<urls.length;i++){
if(!isNeteaseUrl(urls[i]))continue;
try{
var nm=await tryNeteaseLink(urls[i]);
if(nm)return nm;
}catch(e){}
}
for(var j=0;j<urls.length;j++){
if(isNeteaseUrl(urls[j]))continue;
try{
var em=await tryThirdPartyLink(urls[j]);
if(em)return em;
}catch(e){}
}
}

var rs=await post('/api/search',{word:text});
if(rs&&rs.id){
var meta3={id:String(rs.id),name:rs.name||text,artist:rs.artist||'未知歌手',pic:rs.pic||'',duration:0};
var q3=await detectNeteaseQuality(meta3.id,meta3.duration);
if(!q3)throw new Error('该歌曲暂无可用音源');
meta3.quality=q3;
return meta3;
}
throw new Error((rs&&rs.msg)||(urls.length?'所有链接均不可用，且未搜索到歌曲':'未找到歌曲'));
}

// ==================== 分享链接 ====================
function buildShareLink(song){
if(!song)return '';
var base=location.origin+location.pathname;
var val='';
if(song.external){val=song.url||'';}
else{val=song.id||'';}
return base+'?add='+encodeURIComponent(val);
}

// ==================== 重新检测音源（只升不降） ====================
async function retryQuality(){
var song=state.playlist[state.current];
if(!song||song.external)return;
if(state.retrying)return;
state.retrying=true;
render();
var q='';
try{
q=await detectNeteaseQuality(song.id,song.duration);
}catch(e){
q='';
}
state.retrying=false;

var curRank=qualityRank(state.quality);
var newRank=qualityRank(q);

if(q&&newRank>curRank){
state.quality=q;
toast('已找到更高音质：'+(QUALITY_LABEL[q]||q));
var pos=0;
try{pos=audio.currentTime||0;}catch(e){}
playIndex(state.current,q,pos);
return;
}
if(q&&newRank===curRank){
toast('当前已是最优音源');
}else if(q){
toast('当前音源已是最优，保持现有音质');
}else{
if(curRank>0){
toast('新检测无可用音源，保持当前音质');
}else{
state.quality='unavailable';
toast('仍然没有可用音源');
}
}
render();
}

// ==================== 渲染 ====================
function scheduleMediaSessionUpdate(){
var song=state.playlist[state.current];
var key=state.current+'|'+(song?(song.id||''):'')+'|'+(song?(song.name||''):'')+'|'+(song?(song.artist||''):'')+'|'+(song?(song.pic||''):'');
if(state._lastMediaKey===key)return;
state._lastMediaKey=key;
updateMediaSessionMetadata();
}

function render(){
var song=state.playlist[state.current];
var hasSongs=state.playlist.length>0;

$('title').textContent=song?(song.name||'未知歌曲'):'未在播放';
$('artist').textContent=song?(song.artist||'未知歌手'):'—';

var qlabel=song?getQualityText(song,state.quality):'';
if(qlabel){
$('qualityBadge').textContent=qlabel;
var extCls=(state.quality==='external'||state.quality==='unavailable')?' ext':'';
$('qualityBadge').className='badge'+extCls;
$('qualityBadge').style.display='inline-block';
}else{
$('qualityBadge').style.display='none';
}

var showRetry=!!(song&&!song.external);
if(showRetry){
$('retryBtn').style.display='flex';
if(state.retrying)$('retryBtn').classList.add('spinning');
else $('retryBtn').classList.remove('spinning');
$('retryBtn').disabled=!!state.retrying;
}else{
$('retryBtn').style.display='none';
}

$('emptyAdd').style.display=hasSongs?'none':'flex';
$('coverBox').style.display=(hasSongs&&!state.showLyric)?'block':'none';
$('lyricBox').style.display=(hasSongs&&state.showLyric)?'block':'none';

updateCoverDisplay();
scheduleMediaSessionUpdate();

var lyrKey=(state.lyricLoading?'L':'l')+'|'+(state.lyric||'')+'|'+
(state.lyricTrans||'')+'|'+(state.lyricRoma||'')+'|'+
(state.transEnabled?'T':'t')+'|'+(state.romaEnabled?'R':'r');
if(state._lastLyricKey!==lyrKey){
state._lastLyricKey=lyrKey;
buildLyricView();
}
if(state.showLyric){
setTimeout(function(){updateLyricScroll(true)},30);
}

$('playBtn').innerHTML=state.playing?ICON.pause:ICON.play;
$('prevBtn').disabled=!hasSongs;
$('nextBtn').disabled=!hasSongs;

var modeIcon=state.mode==='single'?ICON.repeatOne:(state.mode==='shuffle'?ICON.shuffle:ICON.repeat);
var modeText=state.mode==='single'?'单曲循环':(state.mode==='shuffle'?'随机播放':'顺序播放');
$('modeBtn').innerHTML=modeIcon+'<span>'+modeText+'</span>';

$('downloadBtn').innerHTML=ICON.download+'<span>下载</span>';
$('listBtn').innerHTML=ICON.list+'<span>列表'+(hasSongs?' ('+state.playlist.length+')':'')+'</span>';

$('sheetClear').disabled=!hasSongs;
$('sheetExport').disabled=!hasSongs;
$('sheetEdit').disabled=!hasSongs;
$('sheetTitle').textContent='播放列表'+(hasSongs?' ('+state.playlist.length+')':'');

renderList();
}

function renderList(){
var box=$('sheetList');
if(!state.playlist.length){
box.innerHTML='<div class="sheet-empty">播放列表为空</div>';
return;
}
var html='';
state.playlist.forEach(function(s,i){
var playing=i===state.current?' playing':'';
var tag='';
if(s.external){
var fm=s.format?s.format.toUpperCase():'外部';
var isVid=isVideoFormat(s.format);
tag='<span class="ext-tag'+(isVid?' vid':'')+'">'+(isVid?'▶ '+fm:fm)+'</span>';
}
html+='<div class="song-row'+playing+'" data-i="'+i+'">'+
'<div class="song-row-info">'+
'<div class="song-row-name"><span class="name-text">'+(s.name||'未知歌曲')+'</span>'+tag+'</div>'+
'<div class="song-row-artist">'+(s.artist||'未知歌手')+'</div>'+
'</div>';
if(state.editingOrder){
html+='<div class="song-row-actions">'+
'<button class="song-row-move" data-up="'+i+'" '+(i===0?'disabled':'')+' aria-label="上移">'+ICON.arrowUp+'</button>'+
'<button class="song-row-move" data-down="'+i+'" '+(i===state.playlist.length-1?'disabled':'')+' aria-label="下移">'+ICON.arrowDown+'</button>'+
'</div>';
}
if(s.external){
html+='<button class="song-row-rename" data-rename="'+i+'" aria-label="重命名">'+ICON.edit+'</button>';
}
html+='<button class="song-row-del" data-del="'+i+'" aria-label="删除">'+ICON.del+'</button>'+
'</div>';
});
box.innerHTML=html;
}

// ==================== 改名 ====================
var renamingIndex=-1;

function openRename(idx){
if(idx<0||idx>=state.playlist.length)return;
var song=state.playlist[idx];
if(!song||!song.external)return;
renamingIndex=idx;
$('renameInput').value=song.name||'';
closeOtherScrims('renameScrim');
$('renameScrim').classList.add('show');
setTimeout(function(){
$('renameInput').focus();
try{$('renameInput').select()}catch(e){}
},120);
}

function closeRename(){
$('renameScrim').classList.remove('show');
$('renameInput').blur();
renamingIndex=-1;
}

function confirmRename(){
if(renamingIndex<0||renamingIndex>=state.playlist.length){closeRename();return}
var newName=$('renameInput').value.trim();
if(!newName){toast('名称不能为空');return}
var song=state.playlist[renamingIndex];
if(!song){closeRename();return}
song.name=newName;
savePlaylist();
closeRename();
render();
toast('已重命名');
}

// ==================== 播放 ====================
async function playIndex(i,forcedQuality,startPos){
if(i<0||i>=state.playlist.length)return;
var token=++playToken;

stopAudio();
resetProgressUI();

state.current=i;
state.showLyric=false;
state.audioUrl='';state.quality='';
state.playing=true;

var song=state.playlist[i];
var pe=preloadCache[song.id];

if(pe&&pe.url&&pe.quality&&!song.external){
if(shouldRefreshUrl(pe,song)){
pe.url='';
pe.quality='';
pe.urlDone=false;
pe.urlExpireAt=0;
}
}

if(pe&&pe.lyricDone){
state.lyric=pe.lyric||'暂无歌词';
state.lyricTrans=pe.lyricTrans||'';
state.lyricRoma=pe.lyricRoma||'';
state.lyricLoading=false;
state._lastLyricKey=null;
}else{
state.lyric='';state.lyricTrans='';state.lyricRoma='';
state.lyricLoading=true;
state._lastLyricKey=null;
}

if(pe&&pe.pic&&!song.pic){
song.pic=pe.pic;
preloadCover(pe.pic);
}

render();

var result;
try{
if(song.external){
result={url:song.url,level:'external',expi:0};
}else if(forcedQuality){
var u=await fetchPlayUrlLevel(song.id,forcedQuality,(song.duration||360)+URL_SAFETY_BUFFER);
if(!u)throw new Error('音源加载失败');
result={url:u,level:forcedQuality,expi:0};
}else if(pe&&pe.url&&isHttpUrl(pe.url)&&pe.quality){
result={url:pe.url,level:pe.quality,expi:0};
}else{
result=await fetchPlayUrl(song.id,song.duration);
}
if(token!==playToken)return;
state.audioUrl=result.url;
state.quality=result.level;
if(!song.external&&result.level!=='external'){
var e2=getPreloadEntry(song.id);
if(e2&&(!e2.quality||qualityRank(result.level)>=qualityRank(e2.quality))){
e2.url=result.url;
e2.quality=result.level;
e2.urlExpireAt=Date.now()+((result.expi||DEFAULT_EXPI)*1000);
}
}
render();
await setAudioSource(result.url,song.format);
if(startPos&&startPos>0){
try{audio.currentTime=startPos;}catch(e){}
}
}catch(e){
if(token!==playToken)return;
state.playing=false;
state.lyricLoading=false;
state.quality='unavailable';
toast(e.message||'播放失败');
render();
return;
}

if(token!==playToken)return;
render();

if(song.external){
if(!state.lyric||state.lyricLoading){
state.lyric=isVideoFormat(song.format)?'视频音源，暂无歌词':'外部音源，暂无歌词';
state.lyricLoading=false;
render();
}
}else if(state.lyricLoading||!state.lyric){
var cachedLyric=null;
try{cachedLyric=await getCachedLyric(song.id);}catch(e){}
if(cachedLyric){
state.lyric=cachedLyric.main||'暂无歌词';
state.lyricTrans=cachedLyric.trans||'';
state.lyricRoma=cachedLyric.roma||'';
state.lyricLoading=false;
var eC=getPreloadEntry(song.id);
if(eC){
eC.lyric=state.lyric;
eC.lyricTrans=state.lyricTrans;
eC.lyricRoma=state.lyricRoma;
eC.lyricDone=true;
}
render();
}else{
try{
var lr=await post('/api/getSongLyric',{id:song.id});
if(token!==playToken)return;
var m=extractLyricMulti(lr);
state.lyric=m.main||'暂无歌词';
state.lyricTrans=m.trans||'';
state.lyricRoma=m.roma||'';
state.lyricLoading=false;
var e3=getPreloadEntry(song.id);
if(e3){
e3.lyric=state.lyric;
e3.lyricTrans=state.lyricTrans;
e3.lyricRoma=state.lyricRoma;
e3.lyricDone=true;
}
await saveLyricToCache(song.id,state.lyric,state.lyricTrans,state.lyricRoma);
render();
}catch(e){
if(token!==playToken)return;
state.lyric='暂无歌词';
state.lyricTrans='';state.lyricRoma='';
state.lyricLoading=false;
render();
}
}
}

if(!song.pic&&!song.external){
var cachedPic='';
try{cachedPic=await getCachedCover(song.id);}catch(e){}
if(cachedPic){
song.pic=cachedPic;
preloadCover(cachedPic);
var eCp=getPreloadEntry(song.id);
if(eCp){eCp.pic=cachedPic;eCp.picDone=true;}
render();
}else{
try{
var sr=await post('/api/search',{word:song.name});
if(token!==playToken)return;
if(sr&&sr.pic){
song.pic=sr.pic;
preloadCover(sr.pic);
var e4=getPreloadEntry(song.id);
if(e4){e4.pic=sr.pic;e4.picDone=true;}
await saveCoverToCache(song.id,sr.pic);
render();
}
}catch(e){}
}
}

if(token!==playToken)return;
triggerPreloadNeighbors();
}

function nextSong(){
if(!state.playlist.length)return;
var n=state.current;
if(state.mode==='shuffle'){
if(state.playlist.length===1){n=0}
else{do{n=Math.floor(Math.random()*state.playlist.length)}while(n===state.current)}
}else{n=(state.current+1)%state.playlist.length;}
playIndex(n);
}
function prevSong(){
if(!state.playlist.length)return;
var n=state.current;
if(state.mode==='shuffle'){
if(state.playlist.length===1){n=0}
else{do{n=Math.floor(Math.random()*state.playlist.length)}while(n===state.current)}
}else{n=(state.current-1+state.playlist.length)%state.playlist.length;}
playIndex(n);
}

async function resumeWithRefresh(pos){
var song=state.playlist[state.current];
if(!song)return;
var myToken=++refreshToken;
refreshingUrl=true;
render();
var fresh;
try{fresh=await fetchPlayUrl(song.id,song.duration);}catch(e){fresh=null;}

if(myToken!==refreshToken){
refreshingUrl=false;
return;
}
refreshingUrl=false;

if(!fresh||!fresh.url){
render();
audio.play().catch(function(){});
return;
}
var entry=getPreloadEntry(song.id);
if(entry&&fresh.level!=='external'){
entry.url=fresh.url;
entry.quality=fresh.level;
entry.urlExpireAt=Date.now()+((fresh.expi||DEFAULT_EXPI)*1000);
}
state.audioUrl=fresh.url;
state.quality=fresh.level;
render();

try{
await setAudioSource(fresh.url,song.format);
}catch(e){
toast(e.message||'重新获取后播放失败');
return;
}

try{audio.currentTime=pos;}catch(e){}
audio.play().catch(function(){});
}

async function togglePlay(){
if(!state.playlist.length){openAdd();return}
if(state.current<0){playIndex(0);return}

if(refreshingUrl){
refreshToken++;
refreshingUrl=false;
state.playing=false;
render();
toast('已取消重新获取');
return;
}

if(state.playing){audio.pause();return;}

var song=state.playlist[state.current];
var pe=song&&preloadCache[song.id];
if(song&&!song.external&&pe&&pe.urlExpireAt){
var dur=audio.duration||0;
var cur=audio.currentTime||0;
var remaining=(isFinite(dur)&&dur>0)?(dur-cur):0;
if(remaining>0&&shouldRefreshUrlResume(pe,remaining)){
toast('链接已过期，正在重新获取');
await resumeWithRefresh(cur);
return;
}
}
audio.play().catch(function(){});
}

// ==================== 进度条 ====================
function updateSeekBg(pct){
$('seek').style.background='linear-gradient(to right, var(--primary) '+pct+'%, var(--outline-variant) '+pct+'%)';
}
$('seek').addEventListener('input',function(){
isSeeking=true;
var pct=parseFloat(this.value)/10;
updateSeekBg(pct);
if(audio.duration&&isFinite(audio.duration)){
var t=(parseFloat(this.value)/1000)*audio.duration;
audio.currentTime=t;
$('curTime').textContent=fmt(t);
}
});
$('seek').addEventListener('change',function(){isSeeking=false});
$('seek').addEventListener('pointerup',function(){isSeeking=false});
$('seek').addEventListener('touchend',function(){isSeeking=false});

function onTimeUpdate(){
var d=audio.duration||0;
var c=audio.currentTime||0;
if(d>0&&isFinite(d)){
if(!isSeeking){
var pct=(c/d)*100;
$('seek').value=String(Math.round(pct*10));
updateSeekBg(pct);
}
$('durTime').textContent=fmt(d);
}
$('curTime').textContent=fmt(c);
if(state.showLyric&&state.lyricHasTime)updateLyricScroll(false);
if('mediaSession' in navigator&&d>0&&isFinite(d)){
try{
navigator.mediaSession.setPositionState({
duration:d,
playbackRate:audio.playbackRate||1,
position:Math.min(c,d)
});
}catch(e){}
}
}
audio.addEventListener('timeupdate',onTimeUpdate);
audio.addEventListener('loadedmetadata',function(){
var song=state.playlist[state.current];
if(song&&!song.external&&isFinite(audio.duration)&&audio.duration>0){
song.duration=audio.duration;
}
onTimeUpdate();
});
audio.addEventListener('durationchange',onTimeUpdate);
audio.addEventListener('play',function(){
state.playing=true;
render();
updateMediaSessionPlaybackState();
});
audio.addEventListener('pause',function(){
state.playing=false;
render();
updateMediaSessionPlaybackState();
});
audio.addEventListener('ended',function(){
if(state.mode==='single'){
audio.currentTime=0;
audio.play().catch(function(){});
}else{nextSong();}
});

// ==================== 事件绑定 ====================
$('playBtn').addEventListener('click',togglePlay);
$('prevBtn').addEventListener('click',prevSong);
$('nextBtn').addEventListener('click',nextSong);

$('modeBtn').addEventListener('click',function(){
var order=['order','single','shuffle'];
var i=order.indexOf(state.mode);
state.mode=order[(i+1)%3];
toast(state.mode==='single'?'单曲循环':(state.mode==='shuffle'?'随机播放':'顺序播放'));
render();
});

$('coverBox').addEventListener('click',function(){
if(!state.playlist.length)return;
state.showLyric=true;
render();
});
$('lyricBox').addEventListener('click',function(e){
if(e.target.closest&&e.target.closest('#lyricToolbar'))return;
state.showLyric=false;render();
});
$('lyricBox').addEventListener('wheel',markLyricUserScrolled,{passive:true});
$('lyricBox').addEventListener('touchmove',markLyricUserScrolled,{passive:true});

$('transBtn').addEventListener('click',function(e){
e.stopPropagation();
state.transEnabled=!state.transEnabled;
state._lastLyricKey=null;
render();
});
$('romaBtn').addEventListener('click',function(e){
e.stopPropagation();
state.romaEnabled=!state.romaEnabled;
state._lastLyricKey=null;
render();
});

$('retryBtn').addEventListener('click',function(e){
e.stopPropagation();
retryQuality();
});

// ==================== 改名事件 ====================
$('renameCancel').addEventListener('click',closeRename);
$('renameConfirm').addEventListener('click',confirmRename);
$('renameGo').addEventListener('click',confirmRename);
$('renameScrim').addEventListener('click',function(e){if(e.target===this)closeRename()});
$('renameInput').addEventListener('keydown',function(e){
if(e.key==='Enter'){e.preventDefault();confirmRename()}
});

// ==================== 分享菜单 ====================
$('shareBtn').addEventListener('click',function(){
var song=state.playlist[state.current];
if(!song){toast('没有可分享的歌曲');return}
$('shareSongName').textContent=(song.name||'未知歌曲')+' - '+(song.artist||'');
closeOtherScrims('shareScrim');
$('shareScrim').classList.add('show');
});
$('shareCancel').addEventListener('click',function(){$('shareScrim').classList.remove('show')});
$('shareScrim').addEventListener('click',function(e){if(e.target===this)this.classList.remove('show')});

$('shareCopyLink').addEventListener('click',async function(){
var song=state.playlist[state.current];
if(!song)return;
var link=buildShareLink(song);
try{
await navigator.clipboard.writeText(link);
toast('分享链接已复制');
}catch(e){
var ta=document.createElement('textarea');
ta.value=link;
ta.style.position='fixed';
ta.style.left='-9999px';
document.body.appendChild(ta);
ta.select();
try{document.execCommand('copy');toast('分享链接已复制');}
catch(e2){toast('复制失败');}
ta.remove();
}
$('shareScrim').classList.remove('show');
});

$('shareSystem').addEventListener('click',async function(){
var song=state.playlist[state.current];
if(!song)return;
if(!navigator.share){
toast('当前浏览器不支持系统分享');
return;
}
var link=buildShareLink(song);
try{
await navigator.share({
title:song.name||SITE_TITLE,
text:(song.name||'')+' - '+(song.artist||''),
url:link
});
$('shareScrim').classList.remove('show');
}catch(e){
if(e&&e.name==='AbortError'){$('shareScrim').classList.remove('show')}
}
});

// ==================== 下载 ====================
var pendingDownloadSong=null;
var downloadDetectToken=0;

async function checkVipNeeded(id){
try{
var r=await post('/api/getSongInfo',{id:String(id)});
if(!r)return true;

var d=r.data!==undefined?r.data:r;
if(d&&typeof d==='object'&&d.data&&typeof d.data==='object'){
d=d.data;
}

if(d&&typeof d==='object'){
var isFree=(d.free===true);
var hasCopyright=(typeof d.copyright==='number'&&d.copyright!==0);
if(isFree&&hasCopyright){
return false;
}
}
}catch(e){}
return true;
}

async function checkAllLevels(id){
var levels=['lossless','exhigh','standard'];
var tasks=levels.map(function(lv){
return tryGetLevelWithCache(id,lv,300).then(function(r){
return {key:lv,ok:!!(r&&r.url)};
});
});
var rs=await Promise.all(tasks);

var result={lossless:false,exhigh:false,standard:false,official:false};
for(var i=0;i<rs.length;i++){
if(rs[i].ok)result[rs[i].key]=true;
}

try{
var vipNeeded=await checkVipNeeded(id);
result.official=!vipNeeded;
}catch(e){
result.official=false;
}

return result;
}

async function runQualityDetection(song){
var token=++downloadDetectToken;
var listEl=$('qualityList');
var btn=$('downloadRetryBtn');
listEl.innerHTML='<div class="quality-loading"><div class="quality-spinner"></div><div>正在检测可用音质...</div></div>';
btn.disabled=true;
btn.classList.add('spinning');

var availability=await checkAllLevels(song.id);

if(token!==downloadDetectToken)return;
if(!$('downloadScrim').classList.contains('show'))return;
if(pendingDownloadSong!==song)return;

btn.disabled=false;
btn.classList.remove('spinning');

var currentIsThisSong=(state.current>=0&&state.playlist[state.current]===song);
var currentQuality=currentIsThisSong?state.quality:'';
if(currentQuality&&availability[currentQuality]!==undefined){
availability[currentQuality]=true;
}

renderDownloadQualityList(availability,song,currentQuality);
}

function openDownloadDialog(song){
pendingDownloadSong=song;
$('downloadSongName').textContent=(song.name||'未知歌曲')+' - '+(song.artist||'');
closeOtherScrims('downloadScrim');
$('downloadScrim').classList.add('show');
runQualityDetection(song);
}

function renderDownloadQualityList(availability,song,currentQuality){
var listEl=$('qualityList');
var anyAvailable=false;
for(var i=0;i<DOWNLOAD_LEVELS.length;i++){
if(availability[DOWNLOAD_LEVELS[i].key]){anyAvailable=true;break}
}
if(!anyAvailable){
listEl.innerHTML='<div class="quality-loading">没有可用音质</div>';
return;
}

var html='<div class="quality-list">';
for(var i=0;i<DOWNLOAD_LEVELS.length;i++){
var lv=DOWNLOAD_LEVELS[i];
var isCurrent=lv.key===currentQuality;
var avail=availability[lv.key]||isCurrent;
var cls='quality-item';
if(!avail)cls+=' disabled';
if(isCurrent)cls+=' current';
var dis=avail?'':' disabled';
html+='<button class="'+cls+'" data-level="'+lv.key+'"'+dis+'>';
html+='<span class="quality-label">'+lv.label+'</span>';
if(isCurrent){
html+='<span class="quality-tag">当前</span>';
}else if(!avail){
html+='<span class="quality-tag unavailable">不可用</span>';
}
html+='</button>';
}
html+='</div>';
listEl.innerHTML=html;

var buttons=listEl.querySelectorAll('.quality-item');
for(var j=0;j<buttons.length;j++){
buttons[j].addEventListener('click',function(){
if(this.disabled)return;
var level=this.getAttribute('data-level');
$('downloadScrim').classList.remove('show');
doDownload(pendingDownloadSong,level);
});
}
}

async function doDownload(song,level){
if(!song)return;
toast('获取下载链接...');
var url='';
try{
url=await fetchPlayUrlLevel(song.id,level,300);
}catch(e){}
if(!url){
if(level==='official'){
url=await probeOfficialLocal(song.id);
}
if(!url){
toast('该音质不可用');
return;
}
}

try{
var res=await fetch(url);
var blob=await res.blob();
var ct=(blob.type||'').toLowerCase();
if(ct.indexOf('text/')===0||ct.indexOf('application/json')!==-1){
toast('该音质不是音频文件');
return;
}
var a=document.createElement('a');
a.href=URL.createObjectURL(blob);
var ext='.mp3';
if(level==='lossless')ext='.flac';
var fm=getFormatFromUrl(url);
if(fm)ext='.'+fm;
var fname=safeFileName((song.name||'song')+' - '+(song.artist||''))+ext;
a.download=fname;
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(function(){URL.revokeObjectURL(a.href)},3000);
toast('开始下载');
}catch(e){
window.open(url,'_blank');
toast('已在新窗口打开');
}
}

$('downloadCancel').addEventListener('click',function(){
pendingDownloadSong=null;
downloadDetectToken++;
$('downloadScrim').classList.remove('show');
});
$('downloadScrim').addEventListener('click',function(e){
if(e.target===this){
pendingDownloadSong=null;
downloadDetectToken++;
this.classList.remove('show');
}
});
$('downloadRetryBtn').addEventListener('click',function(){
if(!pendingDownloadSong)return;
runQualityDetection(pendingDownloadSong);
});

$('downloadBtn').addEventListener('click',async function(){
var song=state.playlist[state.current];
if(!song){toast('没有可下载的歌曲');return}
if(song.external){
if(isHlsFormat(song.url,song.format)){
toast('M3U8 流媒体暂不支持下载');
return;
}
if(isFlvFormat(song.url,song.format)){
toast('FLV 流媒体暂不支持下载');
return;
}
var url=song.url;
try{
var res=await fetch(url);
var blob=await res.blob();
var a=document.createElement('a');
a.href=URL.createObjectURL(blob);
var ext='.mp3';
var fm=song.format||'';
if(!fm)fm=getFormatFromUrl(url);
if(fm)ext='.'+fm;
var fname=safeFileName((song.name||'song')+' - '+(song.artist||''))+ext;
a.download=fname;
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(function(){URL.revokeObjectURL(a.href)},3000);
toast('开始下载');
}catch(e){
window.open(url,'_blank');
toast('已在新窗口打开');
}
return;
}
openDownloadDialog(song);
});

// ==================== 添加歌曲弹窗 ====================
function openAdd(){
closeOtherScrims('addScrim');
$('addStage1').style.display='block';
$('addStage2').style.display='none';
$('addInput').value='';
$('addGo').disabled=false;
$('addScrim').classList.add('show');
setTimeout(function(){$('addInput').focus()},120);
}
function closeAdd(){
$('addScrim').classList.remove('show');
$('addInput').blur();
}
$('emptyAdd').addEventListener('click',openAdd);
$('listBtn').addEventListener('click',function(){
closeOtherScrims('listScrim');
$('listScrim').classList.add('show');
});
$('sheetAdd').addEventListener('click',function(){
$('listScrim').classList.remove('show');
setTimeout(openAdd,180);
});
$('addScrim').addEventListener('click',function(e){if(e.target===this)closeAdd()});
$('listScrim').addEventListener('click',function(e){if(e.target===this)this.classList.remove('show')});

function showSongConfirm(song,fromUrl){
pendingSong=song;
if(fromUrl)song._fromUrl=true;
$('addStage1').style.display='none';
$('addStage2').style.display='block';
$('foundName').textContent=song.name;
if(song.external){
$('foundArtist').textContent=isVideoFormat(song.format)?'视频音源':'外部音源';
}else{
$('foundArtist').textContent=song.artist+'  ·  ID: '+song.id;
}
var metaHtml='';
if(song.external){
var f=song.format?song.format.toUpperCase():'未知';
if(isVideoFormat(song.format)){
metaHtml+='<span class="meta-tag vid">视频音源</span>';
metaHtml+='<span class="meta-tag vid">'+f+'</span>';
}else{
metaHtml+='<span class="meta-tag ext">外部音源</span>';
metaHtml+='<span class="meta-tag q">'+f+'</span>';
}
}else{
var q=song.quality||'official';
var qlabel=QUALITY_LABEL[q]||'官方';
var cls=q==='official'?'meta-tag ext':'meta-tag q';
metaHtml+='<span class="'+cls+'">网易云</span>';
metaHtml+='<span class="meta-tag q">'+qlabel+'</span>';
}
$('foundMeta').innerHTML=metaHtml;
$('addHint').textContent=fromUrl?'来自分享链接，是否添加到列表并播放？':'是否将此歌曲加入播放列表？';
closeOtherScrims('addScrim');
$('addScrim').classList.add('show');
}

async function doResolve(){
var text=$('addInput').value.trim();
if(!text)return;
$('addGo').disabled=true;
$('addGo').innerHTML='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
try{
var song=await resolveInput(text);
showSongConfirm(song,false);
}catch(e){
toast(e.message||'解析失败');
}
$('addGo').disabled=false;
$('addGo').innerHTML=ICON.arrow;
}
$('addGo').addEventListener('click',doResolve);
$('addInput').addEventListener('keydown',function(e){
if(e.key==='Enter'){e.preventDefault();doResolve()}
});
$('addCancel').addEventListener('click',function(){
pendingSong=null;
$('addStage2').style.display='none';
$('addStage1').style.display='block';
$('addHint').textContent='是否将此歌曲加入播放列表？';
setTimeout(function(){$('addInput').focus()},100);
});
$('addConfirm').addEventListener('click',function(){
if(!pendingSong)return;
var toAdd=pendingSong;
var fromUrl=toAdd._fromUrl===true;
delete toAdd._fromUrl;

if(isDuplicateSong(toAdd,state.playlist)){
toast('歌曲已在播放列表中');
pendingSong=null;
closeAdd();
$('addHint').textContent='是否将此歌曲加入播放列表？';
return;
}

state.playlist.unshift(toAdd);
var wasEmpty=state.playlist.length===1;
if(state.current>=0)state.current++;
savePlaylist();
toast('已加入播放列表');
pendingSong=null;
closeAdd();
$('addHint').textContent='是否将此歌曲加入播放列表？';
if(fromUrl||wasEmpty){
playIndex(0);
}else{
render();
}
});

// ==================== 清空列表 ====================
$('sheetClear').addEventListener('click',function(){
if(!state.playlist.length){toast('播放列表已为空');return}
closeOtherScrims('clearScrim');
$('clearScrim').classList.add('show');
});
$('clearCancel').addEventListener('click',function(){$('clearScrim').classList.remove('show')});
$('clearScrim').addEventListener('click',function(e){if(e.target===this)this.classList.remove('show')});
$('clearConfirm').addEventListener('click',function(){
state.playlist=[];
state.current=-1;
state.playing=false;
state.lyric='';state.lyricTrans='';state.lyricRoma='';
state.lyricLoading=false;
state.audioUrl='';state.quality='';
state.retrying=false;
state.editingOrder=false;
$('sheetEdit').innerHTML=ICON.edit;
$('sheetEdit').classList.remove('active');
stopAudio();
resetProgressUI();
clearPlaylistCookie();
preloadCache={};
preloadTimers={};
state._lastMediaKey=null;
render();
updateMediaSessionMetadata();
updateMediaSessionPlaybackState();
$('clearScrim').classList.remove('show');
$('listScrim').classList.remove('show');
toast('播放列表已清空');
});

// ==================== 编辑顺序 ====================
$('sheetEdit').addEventListener('click',function(){
state.editingOrder=!state.editingOrder;
$('sheetEdit').innerHTML=state.editingOrder?ICON.check:ICON.edit;
if(state.editingOrder)$('sheetEdit').classList.add('active');
else $('sheetEdit').classList.remove('active');
render();
});

// ==================== 网络导出 ====================
var exportGenerating=false;
$('sheetExport').addEventListener('click',async function(){
if(!state.playlist.length){toast('播放列表为空');return}
$('listScrim').classList.remove('show');
if(exportGenerating)return;
exportGenerating=true;

$('exportKey').value='';
$('exportKey').placeholder='正在上传...';
$('exportCopy').disabled=true;
$('exportHint').textContent='正在将歌单上传到网络...';
closeOtherScrims('exportScrim');
$('exportScrim').classList.add('show');

var raw=exportListText();
var compressed=await gzipCompress(raw);
var toUpload=raw;
if(compressed&&('#GZIP:'+compressed).length<raw.length){
toUpload='#GZIP:'+compressed;
}

var key=genShareKey();
var ok=await cacheSetRaw(key,toUpload);

var verifyOk=false;
if(ok){
var verify=await cacheGetRaw(key);
if(verify&&verify===toUpload)verifyOk=true;
}

exportGenerating=false;

if(verifyOk){
$('exportKey').value=key;
$('exportKey').placeholder='';
$('exportCopy').disabled=false;
$('exportHint').textContent='已上传 '+state.playlist.length+' 首歌曲，可复制 15 位密钥分享';
}else{
$('exportKey').value='';
$('exportKey').placeholder='上传失败';
$('exportCopy').disabled=true;
$('exportHint').textContent='上传失败，请检查网络后重试';
}
});
$('exportClose').addEventListener('click',function(){$('exportScrim').classList.remove('show')});
$('exportScrim').addEventListener('click',function(e){if(e.target===this)this.classList.remove('show')});
$('exportCopy').addEventListener('click',async function(){
var key=$('exportKey').value;
if(!key||detectImportType(key)!=='key'){toast('请等待上传完成');return}
try{
await navigator.clipboard.writeText(key);
toast('密钥已复制');
}catch(e){
var ta=document.createElement('textarea');
ta.value=key;
ta.style.position='fixed';
ta.style.left='-9999px';
document.body.appendChild(ta);
ta.select();
try{document.execCommand('copy');toast('密钥已复制');}
catch(e2){toast('复制失败');}
ta.remove();
}
});

// txt 导出：始终用 gzip 压缩，不考虑变长变短
$('exportDownload').addEventListener('click',async function(){
if(!state.playlist.length){toast('播放列表为空');return}
var raw=exportListText();
var compressed=await gzipCompress(raw);
var text=compressed?('#GZIP:'+compressed):raw;
try{
var blob=new Blob([text],{type:'text/plain;charset=utf-8'});
var a=document.createElement('a');
a.href=URL.createObjectURL(blob);
var d=new Date();
var stamp=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
a.download='playlist_'+stamp+'.txt';
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(function(){URL.revokeObjectURL(a.href)},3000);
toast('已开始下载');
}catch(e){toast('下载失败')}
});

// ==================== 导入 ====================
$('sheetImport').addEventListener('click',function(){
$('listScrim').classList.remove('show');
$('importKey').value='';
$('importFile').value='';
$('importFileName').textContent='';
$('importHint').textContent='';
closeOtherScrims('importScrim');
$('importScrim').classList.add('show');
setTimeout(function(){$('importKey').focus()},120);
});
$('importCancel').addEventListener('click',function(){$('importScrim').classList.remove('show')});
$('importScrim').addEventListener('click',function(e){if(e.target===this)this.classList.remove('show')});
$('importPickFile').addEventListener('click',function(){$('importFile').click()});

// 统一解析：按 detectImportType 判断
async function resolveImportText(val){
val=String(val||'').trim();
if(!val)return '';
var type=detectImportType(val);
if(type==='key'){
var raw=await cacheGetRaw(val);
if(!raw)return '';
return (await decodeImportText(raw))||'';
}
return (await decodeImportText(val))||'';
}

// 公共：拉取预览
async function previewImport(val){
val=String(val||'').trim();
if(!val)return false;
var type=detectImportType(val);
$('importHint').textContent='正在解析...';
var text=await resolveImportText(val);
if(!text){
$('importHint').textContent='';
if(type==='key'){toast('未找到该密钥对应的歌单');}
else{toast('无法解析输入内容');}
return false;
}
var imported=parseListText(text);
if(!imported.length){
$('importHint').textContent='';
toast('未解析到有效歌曲');
return false;
}
$('importHint').textContent='已找到 '+imported.length+' 首歌曲，点击"确认导入"';
return true;
}

$('importGo').addEventListener('click',function(){
previewImport($('importKey').value);
});

$('importKey').addEventListener('keydown',function(e){
if(e.key==='Enter'){e.preventDefault();$('importGo').click()}
});

$('importFile').addEventListener('change',function(){
var file=this.files&&this.files[0];
if(!file)return;
var reader=new FileReader();
reader.onload=function(e){
var text=String(e.target.result||'').trim();
$('importKey').value=text;
$('importFileName').textContent=file.name;
var type=detectImportType(text);
if(type==='key'){$('importHint').textContent='已读取密钥，点击"确认导入"';}
else if(type==='gzip'){$('importHint').textContent='已读取压缩歌单，点击"确认导入"';}
else if(type==='plain'){$('importHint').textContent='已读取明文歌单，点击"确认导入"';}
else{$('importHint').textContent='';}
};
reader.onerror=function(){toast('读取文件失败')};
reader.readAsText(file,'utf-8');
});

$('importConfirm').addEventListener('click',async function(){
var val=$('importKey').value.trim();
if(!val){toast('请输入密钥、歌单文本或选择文件');return}
var type=detectImportType(val);
$('importHint').textContent='正在解析...';
var text=await resolveImportText(val);
if(!text){
$('importHint').textContent='';
if(type==='key'){toast('未找到该密钥对应的歌单');}
else{toast('无法解析输入内容');}
return;
}
var imported=parseListText(text);
if(!imported.length){
$('importHint').textContent='';
toast('歌单内容为空');
return;
}
var mode='merge';
var radios=document.getElementsByName('importMode');
for(var i=0;i<radios.length;i++){if(radios[i].checked){mode=radios[i].value;break}}

var added=applyImport(imported,mode);
var after=state.playlist.length;

if(mode==='replace'){
state.current=-1;
state.playing=false;
state.audioUrl='';state.quality='';
state.lyric='';state.lyricTrans='';state.lyricRoma='';
state.lyricLoading=false;
state.retrying=false;
state.editingOrder=false;
$('sheetEdit').innerHTML=ICON.edit;
$('sheetEdit').classList.remove('active');
stopAudio();
resetProgressUI();
state._lastMediaKey=null;
updateMediaSessionMetadata();
updateMediaSessionPlaybackState();
}

savePlaylist();
render();
$('importScrim').classList.remove('show');
$('listScrim').classList.remove('show');

if(mode==='replace'){
toast('已覆盖为 '+after+' 首歌曲');
}else{
toast('新增 '+added+' 首，共 '+after+' 首');
}
});

// ==================== 列表交互 ====================
$('sheetList').addEventListener('click',function(e){
var renameBtn=e.target.closest('[data-rename]');
if(renameBtn){
e.stopPropagation();
var ridx=parseInt(renameBtn.getAttribute('data-rename'),10);
openRename(ridx);
return;
}

var del=e.target.closest('[data-del]');
if(del){
e.stopPropagation();
var idx=parseInt(del.getAttribute('data-del'),10);
var removed=state.playlist[idx];
if(removed&&removed.id){
delete preloadCache[removed.id];
if(preloadTimers[removed.id]){
var pt=preloadTimers[removed.id];
if(pt.pic)clearTimeout(pt.pic);
if(pt.lyric)clearTimeout(pt.lyric);
if(pt.url)clearTimeout(pt.url);
delete preloadTimers[removed.id];
}
}
state.playlist.splice(idx,1);
if(state.playlist.length===0){
state.current=-1;state.playing=false;
state.lyric='';state.lyricTrans='';state.lyricRoma='';
state.lyricLoading=false;
state.audioUrl='';state.quality='';
state.retrying=false;
state.editingOrder=false;
$('sheetEdit').innerHTML=ICON.edit;
$('sheetEdit').classList.remove('active');
stopAudio();
resetProgressUI();
clearPlaylistCookie();
state._lastMediaKey=null;
updateMediaSessionMetadata();
updateMediaSessionPlaybackState();
}else if(idx===state.current){
if(idx>=state.playlist.length)state.current=state.playlist.length-1;
savePlaylist();
playIndex(state.current);
}else{
if(idx<state.current)state.current--;
savePlaylist();
}
render();
return;
}

var up=e.target.closest('[data-up]');
if(up){
e.stopPropagation();
var i=parseInt(up.getAttribute('data-up'),10);
if(i>0){
var tmp=state.playlist[i-1];
state.playlist[i-1]=state.playlist[i];
state.playlist[i]=tmp;
if(state.current===i)state.current=i-1;
else if(state.current===i-1)state.current=i;
savePlaylist();
render();
}
return;
}

var down=e.target.closest('[data-down]');
if(down){
e.stopPropagation();
var i2=parseInt(down.getAttribute('data-down'),10);
if(i2<state.playlist.length-1){
var tmp2=state.playlist[i2+1];
state.playlist[i2+1]=state.playlist[i2];
state.playlist[i2]=tmp2;
if(state.current===i2)state.current=i2+1;
else if(state.current===i2+1)state.current=i2;
savePlaylist();
render();
}
return;
}

if(state.editingOrder)return;

var row=e.target.closest('.song-row');
if(row){
var ri=parseInt(row.getAttribute('data-i'),10);
if(ri===state.current){togglePlay()}else{playIndex(ri)}
$('listScrim').classList.remove('show');
}
});

// ==================== URL 参数处理（add / key） ====================
async function handleUrlParams(){
var params=null;
try{params=new URLSearchParams(location.search)}catch(e){return}
if(!params)return;

var keyValue=params.get('key');
var addValue=params.get('add');
if(!keyValue&&!addValue)return;

try{history.replaceState(null,'',location.pathname)}catch(e){}

if(keyValue){
await handleKeyFromUrl(String(keyValue).trim());
return;
}

if(addValue){
toast('正在解析分享内容...');
try{
var song=await resolveInput(addValue);
showSongConfirm(song,true);
}catch(e){
toast('解析失败: '+(e.message||'未知错误'));
}
}
}

async function handleKeyFromUrl(key){
if(!key)return;
if(detectImportType(key)!=='key'){
toast('链接中的密钥格式不正确');
return;
}

$('listScrim').classList.remove('show');
$('importKey').value=key;
$('importFile').value='';
$('importFileName').textContent='';
$('importHint').textContent='正在获取歌单...';
closeOtherScrims('importScrim');
$('importScrim').classList.add('show');

var text=await resolveImportText(key);
if(!text){
$('importHint').textContent='';
toast('未找到该密钥对应的歌单');
return;
}
var imported=parseListText(text);
if(!imported.length){
$('importHint').textContent='';
toast('未解析到有效歌曲');
return;
}
$('importHint').textContent='来自分享链接，已找到 '+imported.length+' 首歌曲，选择导入方式后点击"确认导入"';
}

// ==================== 音频设备变化自动暂停 ====================
(function setupDeviceWatcher(){
if(!navigator.mediaDevices)return;
var lastSig=null;
var initialized=false;
var lastPauseAt=0;

function getSig(devices){
var ids=[];
for(var i=0;i<devices.length;i++){
var d=devices[i];
if(d.kind==='audiooutput'||d.kind==='audioinput'){
ids.push(d.deviceId||d.label||String(i));
}
}
ids.sort();
return ids.length+':'+ids.join(',');
}

async function check(){
try{
var devices=await navigator.mediaDevices.enumerateDevices();
var sig=getSig(devices);
if(!initialized){initialized=true;lastSig=sig;return;}
if(sig===lastSig)return;
lastSig=sig;
var now=Date.now();
if(now-lastPauseAt<800)return;
lastPauseAt=now;
if(audio&&!audio.paused){
audio.pause();
toast('音频设备变化，已暂停播放');
}
}catch(e){}
}

if(navigator.mediaDevices.addEventListener){
navigator.mediaDevices.addEventListener('devicechange',check);
}else if(navigator.mediaDevices.ondevicechange!==undefined){
navigator.mediaDevices.ondevicechange=check;
}

setInterval(check,1500);
check();
})();

// ==================== 启动 ====================
updateSeekBg(0);
setupMediaSession();
restorePlaylist();
render();
setTimeout(handleUrlParams,300);
})();
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
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
      return json({ code: 500, msg: e.message || "Server Error" }, 500);
    }

    return new Response("Not Found", { status: 404 });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function proxy(endpoint, body) {
  const res = await fetch(`${UPSTREAM}/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return json(data, res.status);
}

// ==================== textdb 缓存中转 ====================
async function handleCacheGet(key) {
  if (!key) return json({ ok: false, msg: "缺少 key" });
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeKey) return json({ ok: false, msg: "无效 key" });
  try {
    const res = await fetch("https://textdb.online/" + safeKey, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
      redirect: "follow",
    });
    if (!res.ok) return json({ ok: false, msg: "HTTP " + res.status });
    const text = await res.text();
    return json({ ok: true, value: text.trim() });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

async function handleCacheSet(key, value) {
  if (!key || !value) return json({ ok: false, msg: "缺少参数" });
  const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeKey) return json({ ok: false, msg: "无效 key" });
  try {
    const url =
      "https://textdb.online/update/?key=" +
      encodeURIComponent(safeKey) +
      "&value=" +
      encodeURIComponent(String(value));
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
      redirect: "follow",
    });
    try {
      await res.text();
    } catch (e) {}
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, msg: String(e.message || e) });
  }
}

function extractUrlFromText(text) {
  if (!text) return null;
  const t = String(text);
  const idx1 = t.indexOf("http://");
  const idx2 = t.indexOf("https://");
  let start = -1;
  if (idx1 === -1 && idx2 === -1) return null;
  if (idx1 === -1) start = idx2;
  else if (idx2 === -1) start = idx1;
  else start = Math.min(idx1, idx2);
  const s = t.substring(start);
  let end = s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 32 || c === 9 || c === 10 || c === 13) {
      end = i;
      break;
    }
  }
  return s.substring(0, end);
}

function extractIdFromUrl(url) {
  if (!url) return null;
  const s = String(url);
  const keys = ["?id=", "&id=", "song?id="];
  for (let i = 0; i < keys.length; i++) {
    const idx = s.indexOf(keys[i]);
    if (idx === -1) continue;
    const start = idx + keys[i].length;
    let end = start;
    while (end < s.length) {
      const c = s.charCodeAt(end);
      if (c < 48 || c > 57) break;
      end++;
    }
    const num = s.substring(start, end);
    if (num.length >= 5) return num;
  }
  const idx2 = s.indexOf("/song/");
  if (idx2 !== -1) {
    const start2 = idx2 + 6;
    let end2 = start2;
    while (end2 < s.length) {
      const c = s.charCodeAt(end2);
      if (c < 48 || c > 57) break;
      end2++;
    }
    const num2 = s.substring(start2, end2);
    if (num2.length >= 5) return num2;
  }
  return null;
}

function getFormatFromUrl(url) {
  if (!url) return "";
  let s = String(url).toLowerCase();
  const qi = s.indexOf("?");
  if (qi !== -1) s = s.substring(0, qi);
  const hi = s.indexOf("#");
  if (hi !== -1) s = s.substring(0, hi);
  const exts = [
    "mp3","m4a","aac","flac","wav","ogg","opus","wma","weba","oga","mka","aiff","aif","ape","alac","amr","3ga",
    "m3u8","mp4","flv","wmv","mkv","webm","mov","avi","m4v","ts","3gp","3g2","ogv","mpg","mpeg","m2ts","f4v","rm","rmvb","asf"
  ];
  for (let i = 0; i < exts.length; i++) {
    const ext = exts[i];
    const needLen = ext.length + 1;
    if (s.length >= needLen) {
      const tail = s.substring(s.length - needLen);
      if (tail === "." + ext) return ext;
    }
  }
  return "";
}

function stripExtension(s) {
  if (!s) return "";
  const idx = s.lastIndexOf(".");
  if (idx > 0) return s.substring(0, idx);
  return s;
}

function replaceDashes(s) {
  if (!s) return "";
  let out = "";
  let prevWasDash = false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    if (c === "-" || c === "_") {
      if (!prevWasDash) {
        out += " ";
        prevWasDash = true;
      }
    } else {
      out += c;
      prevWasDash = false;
    }
  }
  return out.trim();
}

async function handleSearch(word) {
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
    artist = artist.map((a) => (a && a.name ? a.name : a)).filter(Boolean).join(" / ");
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

  return json({ code: 200, id: String(id), name, artist: String(artist), pic });
}

async function handleResolve(rawUrl) {
  if (!rawUrl) return json({ code: 400, msg: "缺少链接" }, 400);

  const link = extractUrlFromText(rawUrl) || String(rawUrl);

  let id = extractIdFromUrl(link);
  if (id) return json({ code: 200, id });

  const UA =
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

  // 第一跳：manual 拿 Location（快路径）
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
    try { if (res.body) await res.body.cancel(); } catch (e) {}
  } catch (e) {}

  // 第二跳：follow 从最终 URL 提取（兜底多跳）
  try {
    const res = await fetch(link, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": UA },
    });
    id = extractIdFromUrl(res.url || "");
    if (id) {
      try { if (res.body) await res.body.cancel(); } catch (e) {}
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
      try { if (res.body) await res.body.cancel(); } catch (e) {}
    }
  } catch (e) {
    return json({ code: 500, msg: "链接解析失败: " + e.message }, 500);
  }

  return json({ code: 404, msg: "无法从链接中提取歌曲 ID" }, 404);
}

async function handleCheckAudio(url) {
  if (!url) return json({ ok: false, msg: "缺少链接" });
  const u = String(url).toLowerCase();
  if (u.indexOf("http://") !== 0 && u.indexOf("https://") !== 0) {
    return json({ ok: false, msg: "无效链接" });
  }

  try {
    const urlLower0 = String(url).toLowerCase();
    const reqHeaders = {
      Range: "bytes=0-2047",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    };
    // B 站 CDN 防盗链：必须带 Referer，否则返回 HTML 页面
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

    // 只读 2KB 后取消，避免把整个大文件读进内存
    try {
      if (res.body) {
        const reader = res.body.getReader();
        await reader.read();
        try { await reader.cancel(); } catch (e) {}
      }
    } catch (e) {}

    const rawCt = res.headers.get("Content-Type") || "";
    const ct = rawCt.toLowerCase().split(";")[0].trim();
    const finalUrl = res.url || url;
    const urlLower = finalUrl.toLowerCase();

    const CT_MAP = {
      "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/x-mp3": "mp3",
      "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/m4a": "m4a",
      "audio/aac": "aac", "audio/x-aac": "aac", "audio/aacp": "aac",
      "audio/flac": "flac", "audio/x-flac": "flac",
      "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/vnd.wave": "wav",
      "audio/ogg": "ogg", "application/ogg": "ogg", "application/x-ogg": "ogg",
      "audio/opus": "opus", "audio/x-opus+ogg": "opus",
      "audio/x-ms-wma": "wma", "audio/wma": "wma",
      "audio/webm": "weba", "audio/x-matroska": "mka",
      "audio/aiff": "aiff", "audio/x-aiff": "aiff",
      "video/mp4": "mp4", "video/x-m4v": "m4v",
      "video/x-flv": "flv", "video/flv": "flv",
      "video/x-ms-wmv": "wmv", "video/wmv": "wmv", "video/x-ms-asf": "wmv",
      "video/x-matroska": "mkv",
      "video/webm": "webm",
      "video/quicktime": "mov",
      "video/x-msvideo": "avi", "video/avi": "avi",
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
    if (!format && (ct.indexOf("audio/") === 0 || ct.indexOf("video/") === 0) && extFormat) {
      format = extFormat;
    }
    if (!format && urlLower.indexOf(".m3u8") !== -1) format = "m3u8";
    if (!format && urlLower.indexOf(".flv") !== -1) format = "flv";
    if (!format && ct.indexOf("audio/") === 0) format = "audio";
    if (!format && ct.indexOf("video/") === 0) format = "video";
    // 兜底：扩展名明确且非 HTML 页面，视为可用（B 站等 CDN 可能返回自定义 MIME）
    if (!format && extFormat && ct.indexOf("text/html") === -1) {
      format = extFormat;
    }

    if (!format) {
      return json({ ok: false, msg: "不是音频或视频文件 (" + (rawCt || "未知类型") + ")" });
    }

    let name = "";
    try {
      const u2 = new URL(finalUrl);
      const segments = u2.pathname.split("/");
      const last = decodeURIComponent(segments[segments.length - 1] || "");
      name = replaceDashes(stripExtension(last)).trim();
    } catch (e) {}
    if (!name) name = "外部音源";
    if (name.length > 60) name = name.slice(0, 60);

    return json({ ok: true, name, contentType: ct, url: finalUrl, format });
  } catch (e) {
    return json({ ok: false, msg: "请求失败: " + e.message });
  }
}
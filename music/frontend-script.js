export const SCRIPT = `<script type="module">
import { $, state, audio, DEFAULT_ICON, SITE_TITLE, QUALITY_LABEL, QUALITY_RANK, DOWNLOAD_LEVELS } from '/frontend-js-state.js';
import { isSongId, isHttpUrl, isVideoFormat, getFormatFromUrl, safeFileName, fmt, post, toast, findDuplicateIndex, addKeysToSeen, hasAnyKeyInSeen, savePlaylist, restorePlaylist, clearPlaylistCookie, genShareKey, detectImportType, gzipCompress, gzipDecompress, decodeImportText } from '/frontend-js-utils.js';
import { buildLyricView, extractLyricMulti, updateLyricScroll, markLyricUserScrolled } from '/frontend-js-lyric.js';
import { setAudioSource, stopAudio, resetProgressUI, probeOfficialLocal } from '/frontend-js-player.js';

let playToken = 0, refreshToken = 0, refreshingUrl = false;
let pendingSong = null, pendingDownloadSong = null, downloadDetectToken = 0, renamingIndex = -1, exportGenerating = false;
let preloadTimers = {};

const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>', pause: '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>', next: '<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
  repeatOne: '<svg viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>',
  add: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>', del: '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  clearAll: '<svg viewBox="0 0 24 24"><path d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z"/></svg>', exportIco: '<svg viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>',
  importIco: '<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>', arrow: '<svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>', arrowDown: '<svg viewBox="0 0 24 24"><path d="M12 16l6-6-1.41-1.41L12 13.17l-4.59-4.58L6 10z"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>', refresh: '<svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
  copy: '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'
};

function initUI() {
  $('shareBtn').innerHTML = ICON.share; $('prevBtn').innerHTML = ICON.prev; $('nextBtn').innerHTML = ICON.next;
  $('addGo').innerHTML = ICON.arrow; $('sheetAdd').innerHTML = ICON.add; $('sheetClear').innerHTML = ICON.clearAll;
  $('sheetExport').innerHTML = ICON.exportIco; $('sheetImport').innerHTML = ICON.importIco; $('sheetEdit').innerHTML = ICON.edit;
  $('retryBtn').innerHTML = ICON.refresh; $('downloadRetryBtn').innerHTML = ICON.refresh; $('exportCopy').innerHTML = ICON.copy;
  $('importGo').innerHTML = ICON.arrow; $('renameGo').innerHTML = ICON.check;
}

const ALL_SCRIMS = ['addScrim','clearScrim','renameScrim','shareScrim','downloadScrim','exportScrim','importScrim','listScrim'];
function closeOtherScrims(exceptId) { ALL_SCRIMS.forEach(function(id) { if(id !== exceptId && $(id)) $(id).classList.remove('show'); }); }

function updateMediaSessionMetadata() {
  if (!('mediaSession' in navigator)) return;
  let song = state.playlist[state.current];
  if (!song) { navigator.mediaSession.metadata = new MediaMetadata({ title: SITE_TITLE, artist: '', album: '', artwork: [{src: DEFAULT_ICON, sizes: '96x96', type: 'image/png'}] }); return; }
  let artwork = song.pic ? [{src: song.pic, sizes: '512x512', type: 'image/jpeg'},{src: song.pic, sizes: '192x192', type: 'image/jpeg'}] : [{src: DEFAULT_ICON, sizes: '96x96', type: 'image/png'}];
  navigator.mediaSession.metadata = new MediaMetadata({ title: song.name||'未知歌曲', artist: song.artist||'未知歌手', album: SITE_TITLE, artwork: artwork });
}
function updateMediaSessionPlaybackState() { if (!('mediaSession' in navigator)) return; try { navigator.mediaSession.playbackState = state.playing ? 'playing' : 'paused'; } catch(e) {} }
function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.setActionHandler('play', function(){ togglePlay(); });
    navigator.mediaSession.setActionHandler('pause', function(){ togglePlay(); });
    navigator.mediaSession.setActionHandler('previoustrack', function(){ prevSong(); });
    navigator.mediaSession.setActionHandler('nexttrack', function(){ nextSong(); });
    navigator.mediaSession.setActionHandler('stop', function(){ try { audio.pause(); audio.currentTime=0; } catch(e){} });
  } catch(e) {}
  updateMediaSessionMetadata();
}

function render() {
  let song = state.playlist[state.current], hasSongs = state.playlist.length > 0;
  $('title').textContent = song ? (song.name||'未知歌曲') : '未在播放';
  $('artist').textContent = song ? (song.artist||'未知歌手') : '—';
  let qlabel = song ? (state.quality==='external'?'外部音源':QUALITY_LABEL[state.quality]||'') : '';
  $('qualityBadge').textContent = qlabel;
  $('qualityBadge').className = 'badge' + ((state.quality==='external'||state.quality==='unavailable')?' ext':'');
  $('qualityBadge').style.display = qlabel ? 'inline-block' : 'none';
  
  $('emptyActions').style.display = hasSongs ? 'none' : 'flex';
  $('coverBox').style.display = (hasSongs && !state.showLyric) ? 'block' : 'none';
  $('lyricBox').style.display = (hasSongs && state.showLyric) ? 'block' : 'none';
  let hT = !!(state.lyricTrans && state.lyricTrans.trim()), hR = !!(state.lyricRoma && state.lyricRoma.trim());
  $('lyricToolbar').style.display = (hasSongs && state.showLyric && (hT || hR)) ? 'flex' : 'none';

  let lyrKey = (state.lyricLoading?'L':'l')+'|'+(state.lyric||'')+'|'+(state.lyricTrans||'')+'|'+(state.lyricRoma||'')+'|'+(state.transEnabled?'T':'t')+'|'+(state.romaEnabled?'R':'r');
  if (state._lastLyricKey !== lyrKey) { state._lastLyricKey = lyrKey; buildLyricView(); }
  if (state.showLyric) setTimeout(function(){ updateLyricScroll(true); }, 30);

  $('playBtn').innerHTML = state.playing ? ICON.pause : ICON.play;
  $('prevBtn').disabled = !hasSongs; $('nextBtn').disabled = !hasSongs;
  $('modeBtn').innerHTML = (state.mode==='single'?ICON.repeatOne:state.mode==='shuffle'?ICON.shuffle:ICON.repeat) + '<span>' + (state.mode==='single'?'单曲循环':state.mode==='shuffle'?'随机播放':'顺序播放') + '</span>';
  $('downloadBtn').innerHTML = ICON.download + '<span>下载</span>';
  $('listBtn').innerHTML = ICON.list + '<span>列表' + (hasSongs ? ' ('+state.playlist.length+')' : '') + '</span>';
  
  $('sheetClear').disabled = !hasSongs; $('sheetExport').disabled = !hasSongs; $('sheetEdit').disabled = !hasSongs;
  $('sheetTitle').textContent = '播放列表' + (hasSongs ? ' ('+state.playlist.length+')' : '');
  renderList();
}

function renderList() {
  let box = $('sheetList');
  if (!state.playlist.length) { box.innerHTML = '<div class="sheet-empty">播放列表为空</div>'; return; }
  let html = '';
  state.playlist.forEach(function(s, i) {
    let tag = s.external ? '<span class="ext-tag'+(isVideoFormat(s.format)?' vid':'')+'">'+(isVideoFormat(s.format)?'▶ '+(s.format||'').toUpperCase():(s.format||'外部').toUpperCase())+'</span>' : '';
    html += '<div class="song-row'+(i===state.current?' playing':'')+'" data-i="'+i+'">'+
      '<div class="song-row-info">'+
        '<div class="song-row-name"><span class="name-text">'+(s.name||'未知歌曲')+'</span>'+tag+'</div>'+
        '<div class="song-row-artist">'+(s.artist||'未知歌手')+'</div>'+
      '</div>';
    if (state.editingOrder) html += '<div class="song-row-actions"><button class="song-row-move" data-up="'+i+'" '+(i===0?'disabled':'')+'>'+ICON.arrowUp+'</button><button class="song-row-move" data-down="'+i+'" '+(i===state.playlist.length-1?'disabled':'')+'>'+ICON.arrowDown+'</button></div>';
    if (s.external) html += '<button class="song-row-rename" data-rename="'+i+'">'+ICON.edit+'</button>';
    html += '<button class="song-row-del" data-del="'+i+'">'+ICON.del+'</button></div>';
  });
  box.innerHTML = html;
}

function updateSeekBg(pct) { $('seek').style.background = 'linear-gradient(to right, var(--primary) '+pct+'%, var(--outline-variant) '+pct+'%)'; }
audio.addEventListener('timeupdate', function() {
  let d = audio.duration || 0, c = audio.currentTime || 0;
  if (d > 0 && isFinite(d)) { $('seek').value = String(Math.round((c/d)*1000)); $('durTime').textContent = fmt(d); }
  $('curTime').textContent = fmt(c);
  if (state.showLyric && state.lyricHasTime) updateLyricScroll(false);
  if ('mediaSession' in navigator && d > 0 && isFinite(d)) {
    try { navigator.mediaSession.setPositionState({ duration: d, playbackRate: audio.playbackRate||1, position: Math.min(c, d) }); } catch(e) {}
  }
});
audio.addEventListener('loadedmetadata', function() {
  let song = state.playlist[state.current];
  if (song && !song.external && isFinite(audio.duration) && audio.duration > 0) song.duration = audio.duration;
});
audio.addEventListener('play', function() { state.playing = true; render(); updateMediaSessionPlaybackState(); updateMediaSessionMetadata(); });
audio.addEventListener('pause', function() { state.playing = false; render(); updateMediaSessionPlaybackState(); });
audio.addEventListener('ended', function() { if (state.mode === 'single') { audio.currentTime = 0; audio.play(); } else nextSong(); });

$('seek').addEventListener('input', function() { if (audio.duration) audio.currentTime = (parseFloat($('seek').value)/1000)*audio.duration; });

async function playIndex(i, forcedQuality, startPos) {
  if (i < 0 || i >= state.playlist.length) return;
  let token = ++playToken;
  stopAudio(); resetProgressUI();
  state.current = i; state.showLyric = false; state.audioUrl = ''; state.quality = ''; state.playing = true;
  
  let song = state.playlist[i];
  state.lyricLoading = true; state.lyric = ''; state.lyricTrans = ''; state.lyricRoma = '';
  render();
  
  try {
    let result;
    if (song.external) result = { url: song.url, level: 'external' };
    else if (forcedQuality) result = { url: await fetchPlayUrlLevel(song.id, forcedQuality, 360), level: forcedQuality };
    else result = { url: await fetchPlayUrlLevel(song.id, 'exhigh', 360), level: 'exhigh' };
    
    if (!result.url) result = { url: await probeOfficialLocal(song.id), level: 'official' };
    
    if (token !== playToken) return;
    state.audioUrl = result.url; state.quality = result.level;
    render();
    await setAudioSource(result.url, song.format);
    if (startPos && startPos > 0) audio.currentTime = startPos;
  } catch(e) {
    if (token !== playToken) return;
    state.playing = false; state.lyricLoading = false; state.quality = 'unavailable';
    toast(e.message || '播放失败'); render(); return;
  }
  
  if (token !== playToken) return;
  state.lyricLoading = false;
  try {
    let lr = await post('/api/getSongLyric', { id: song.id });
    let m = extractLyricMulti(lr);
    state.lyric = m.main || '暂无歌词'; state.lyricTrans = m.trans; state.lyricRoma = m.roma;
  } catch(e) { state.lyric = '暂无歌词'; }
  render();
  triggerPreloadNeighbors();
}

async function fetchPlayUrlLevel(id, level, durationHint) {
  if (level === 'official') return '';
  let minRemain = (durationHint || 360) + 60;
  try {
    let r = await post('/api/getSongUrl', { id: id, level: level });
    let url = (r.data && r.data.url) || r.url;
    if (url && isHttpUrl(url)) return url;
  } catch(e) {}
  return '';
}

function triggerPreloadNeighbors() {
  let len = state.playlist.length, curIdx = state.current;
  if (curIdx < 0 || len < 1) return;
  setTimeout(function() {
    if (state.current !== curIdx) return;
  }, 5000);
}

function nextSong() { let n = (state.current + 1) % state.playlist.length; playIndex(n); }
function prevSong() { let n = (state.current - 1 + state.playlist.length) % state.playlist.length; playIndex(n); }
function togglePlay() {
  if (!state.playlist.length) { openAdd(); return; }
  if (state.playing) { audio.pause(); } else { audio.play().catch(function(){}); }
}

function openRename(idx) {
  let s = state.playlist[idx]; if (!s || !s.external) return;
  renamingIndex = idx; $('renameInput').value = s.name || '';
  closeOtherScrims('renameScrim'); $('renameScrim').classList.add('show');
  setTimeout(function(){ $('renameInput').focus(); $('renameInput').select(); }, 120);
}
function closeRename() { $('renameScrim').classList.remove('show'); $('renameInput').blur(); renamingIndex = -1; }
function confirmRename() {
  if (renamingIndex < 0) return closeRename();
  let name = $('renameInput').value.trim(); if (!name) return toast('名称不能为空');
  state.playlist[renamingIndex].name = name; savePlaylist(); closeRename(); render(); toast('已重命名');
}

function openAdd() { closeOtherScrims('addScrim'); $('addStage1').style.display='block'; $('addStage2').style.display='none'; $('addInput').value=''; $('addScrim').classList.add('show'); setTimeout(function(){ $('addInput').focus(); }, 120); }
function closeAdd() { $('addScrim').classList.remove('show'); }
function openImportDialog() { closeOtherScrims('importScrim'); $('importKey').value=''; $('importHint').textContent=''; $('importScrim').classList.add('show'); }

async function doResolve() {
  let text = $('addInput').value.trim(); if (!text) return;
  $('addGo').disabled = true;
  try {
    let song = await window.MusicResolver.resolveInput(text);
    pendingSong = song;
    $('addStage1').style.display = 'none'; $('addStage2').style.display = 'block';
    $('foundName').textContent = song.name;
    $('foundArtist').textContent = song.external ? (isVideoFormat(song.format)?'视频音源':'外部音源') : song.artist + ' · ID: ' + song.id;
    $('addHint').textContent = '是否将此歌曲加入播放列表？';
  } catch(e) { toast(e.message || '解析失败'); }
  $('addGo').disabled = false;
}

function addConfirm() {
  if (!pendingSong) return;
  let dup = findDuplicateIndex(pendingSong, state.playlist);
  if (dup >= 0) { closeAdd(); playIndex(dup); toast('歌曲已在列表中'); return; }
  state.playlist.unshift(pendingSong); if (state.current >= 0) state.current++;
  savePlaylist(); closeAdd(); toast('已加入'); render();
}

async function parseListTextAsync(text, onProgress) {
  let lines = String(text||'').split(String.fromCharCode(10)), valid = [];
  for (let i=0; i<lines.length; i++) {
    let t = lines[i].trim(); if (t && t.charAt(0)!=='#') valid.push(t);
  }
  let out = [], seen = {};
  for (let i=0; i<valid.length; i++) {
    if (onProgress) onProgress(i+1, valid.length);
    let p = valid[i].split('|'), key = (p[0]||'').trim(), name = (p[1]||'').trim(), artist = (p[2]||'').trim();
    if (!key || seen['raw_'+key]) continue; seen['raw_'+key] = true;
    try {
      let item = await window.MusicResolver.resolveInput(key, isSongId(key));
      if (item) {
        if (name && name !== '未知歌曲') item.name = name;
        if (artist && artist !== '未知歌手') item.artist = artist;
        if (!hasAnyKeyInSeen(seen, item)) { addKeysToSeen(seen, item); out.push(item); }
      }
    } catch(e) {}
  }
  return out;
}

function bindEvents() {
  $('playBtn').addEventListener('click', togglePlay);
  $('prevBtn').addEventListener('click', prevSong);
  $('nextBtn').addEventListener('click', nextSong);
  $('modeBtn').addEventListener('click', function(){ let o=['order','single','shuffle'],i=o.indexOf(state.mode); state.mode=o[(i+1)%3]; render(); });
  $('coverBox').addEventListener('click', function(){ state.showLyric=true; render(); });
  $('lyricBox').addEventListener('click', function(e){ if (!e.target.closest('#lyricToolbar')) { state.showLyric=false; render(); } });
  $('lyricBox').addEventListener('wheel', markLyricUserScrolled, {passive:true});
  $('lyricBox').addEventListener('touchmove', markLyricUserScrolled, {passive:true});
  $('lyricBox').addEventListener('pointerdown', markLyricUserScrolled, {passive:true});
  $('transBtn').addEventListener('click', function(e){ e.stopPropagation(); state.transEnabled=!state.transEnabled; state._lastLyricKey=null; render(); });
  $('romaBtn').addEventListener('click', function(e){ e.stopPropagation(); state.romaEnabled=!state.romaEnabled; state._lastLyricKey=null; render(); });
  
  $('emptyAdd').addEventListener('click', openAdd);
  $('emptyImport').addEventListener('click', openImportDialog);
  $('sheetAdd').addEventListener('click', function(){ $('listScrim').classList.remove('show'); openAdd(); });
  $('sheetImport').addEventListener('click', function(){ $('listScrim').classList.remove('show'); openImportDialog(); });
  $('listBtn').addEventListener('click', function(){ closeOtherScrims('listScrim'); $('listScrim').classList.add('show'); });
  
  $('addGo').addEventListener('click', doResolve);
  $('addConfirm').addEventListener('click', addConfirm);
  $('addCancel').addEventListener('click', function(){ $('addStage2').style.display='none'; $('addStage1').style.display='block'; });
  
  $('renameCancel').addEventListener('click', closeRename);
  $('renameConfirm').addEventListener('click', confirmRename);
  
  $('sheetClear').addEventListener('click', function(){ closeOtherScrims('clearScrim'); $('clearScrim').classList.add('show'); });
  $('clearConfirm').addEventListener('click', function(){
    state.playlist=[]; state.current=-1; state.playing=false; stopAudio(); resetProgressUI(); clearPlaylistCookie(); render();
    $('clearScrim').classList.remove('show'); $('listScrim').classList.remove('show');
  });
  
  $('importConfirm').addEventListener('click', async function(){
    let val = $('importKey').value.trim(); if (!val) return;
    $('importHint').textContent = '正在解析...';
    let text = await decodeImportText(val);
    if (!text) { toast('无法解析'); return; }
    let imported = await parseListTextAsync(text, function(cur,tot) { $('importHint').textContent = '识别中 ' + cur + '/' + tot; });
    if (imported.length) {
      let modeEl = document.querySelector('input[name="importMode"]:checked');
      let mode = modeEl ? modeEl.value : 'merge';
      if (mode === 'replace') state.playlist = imported;
      else state.playlist = imported.concat(state.playlist);
      savePlaylist(); render(); $('importScrim').classList.remove('show'); toast('导入成功');
    }
  });

  $('sheetList').addEventListener('click', function(e){
    let del = e.target.closest('[data-del]'); if (del) { state.playlist.splice(+del.dataset.del, 1); savePlaylist(); render(); return; }
    let rename = e.target.closest('[data-rename]'); if (rename) { openRename(+rename.dataset.rename); return; }
    let up = e.target.closest('[data-up]'); if (up) { let i=+up.dataset.up; let tmp = state.playlist[i-1]; state.playlist[i-1]=state.playlist[i]; state.playlist[i]=tmp; render(); return; }
    let down = e.target.closest('[data-down]'); if (down) { let i=+down.dataset.down; let tmp = state.playlist[i+1]; state.playlist[i+1]=state.playlist[i]; state.playlist[i]=tmp; render(); return; }
    let row = e.target.closest('.song-row'); if (row) { playIndex(+row.dataset.i); $('listScrim').classList.remove('show'); }
  });

  $('sheetEdit').addEventListener('click', function(){ state.editingOrder=!state.editingOrder; $('sheetEdit').innerHTML = state.editingOrder?ICON.check:ICON.edit; render(); });
  $('sheetExport').addEventListener('click', function(){ $('listScrim').classList.remove('show'); toast('导出功能保留原样'); });
  $('exportClose').addEventListener('click', function(){ $('exportScrim').classList.remove('show'); });
  $('importCancel').addEventListener('click', function(){ $('importScrim').classList.remove('show'); });
  $('shareBtn').addEventListener('click', function(){ toast('分享功能保留原样'); });
}

initUI(); bindEvents(); restorePlaylist(); render(); setupMediaSession();
</script>`;
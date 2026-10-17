export const STATE_SCRIPT = `
export const $ = function(id){ return document.getElementById(id); };
export const LF = String.fromCharCode(10);
export const CR = String.fromCharCode(13);
export const BS = String.fromCharCode(92);

export const DEFAULT_ICON = '/icon.png';
export const SITE_TITLE = '音乐播放器';
export const LYRIC_RESUME_DELAY = 8000;

export const state = {
  playlist: [], current: -1, playing: false, mode: 'order',
  showLyric: false, lyric: '', audioUrl: '', quality: '',
  lyricTrans: '', lyricRoma: '',
  transEnabled: true, romaEnabled: false,
  lyricLoading: false,
  retrying: false,
  lyricLines: [], lyricHasTime: false, lyricCurrent: -1, lyricUserScrolled: false,
  editingOrder: false,
  _lastLyricKey: null, _lastMediaKey: null, _lyricScrollTimer: null
};

export const audio = document.createElement('video');
audio.style.position = 'absolute';
audio.style.left = '-9999px';
audio.style.top = '0';
audio.style.width = '1px';
audio.style.height = '1px';
audio.style.opacity = '0';
audio.style.pointerEvents = 'none';
audio.setAttribute('playsinline', '');
audio.setAttribute('webkit-playsinline', '');
audio.preload = 'metadata';
if (document.body) document.body.appendChild(audio);
else document.addEventListener('DOMContentLoaded', () => document.body.appendChild(audio));

export const COOKIE_NAME = 'm3_playlist';
export const COOKIE_MAX = 3800;
export const QUALITY_LABEL = { exhigh: '极高', standard: '标准', official: '官方', lossless: '无损' };
export const QUALITY_RANK = { lossless: 4, exhigh: 3, standard: 2, official: 1 };
export const DOWNLOAD_LEVELS = [
  { key: 'lossless', label: '无损' },
  { key: 'exhigh', label: '极高' },
  { key: 'standard', label: '标准' },
  { key: 'official', label: '官方' }
];
`;
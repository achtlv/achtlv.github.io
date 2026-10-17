export const PLAYER_SCRIPT = `
import { $, state, audio, DEFAULT_ICON, QUALITY_RANK, state as S } from './state.js';
import { isHttpUrl, post, isHlsFormat, isFlvFormat, fmt, qualityRank } from './utils.js';
import { buildLyricView, extractLyricMulti, updateLyricScroll } from './lyric.js';

const HLS_CDN = 'https://fastly.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
const FLV_CDN = 'https://fastly.jsdelivr.net/npm/flv.js@1.6.2/dist/flv.min.js';
const OFFICIAL_PREFIX = 'https://ebnr.xiyang6666.top/resolve/https://music.163.com/song?id=';

export let playToken = 0, refreshToken = 0, refreshingUrl = false;
export let hlsInstance = null, hlsLoading = null, flvInstance = null, flvLoading = null;
export let preloadCache = {}, preloadTimers = {};

export function loadHlsJs(){ if(window.Hls)return Promise.resolve(); if(hlsLoading)return hlsLoading; hlsLoading=new Promise((res,rej)=>{let s=document.createElement('script');s.src=HLS_CDN;s.onload=()=>res();s.onerror=()=>{hlsLoading=null;rej(new Error('hls.js 加载失败'))};document.head.appendChild(s);}); return hlsLoading; }
export function loadFlvJs(){ if(window.flvjs)return Promise.resolve(); if(flvLoading)return flvLoading; flvLoading=new Promise((res,rej)=>{let s=document.createElement('script');s.src=FLV_CDN;s.onload=()=>res();s.onerror=()=>{flvLoading=null;rej(new Error('flv.js 加载失败'))};document.head.appendChild(s);}); return flvLoading; }

export function loadPlainMedia(url){ return new Promise((res,rej)=>{ let settled=false,timer=null; function cleanup(){if(timer)clearTimeout(timer);audio.removeEventListener('loadedmetadata',onLoad);audio.removeEventListener('error',onErr);} function onLoad(){if(settled)return;settled=true;cleanup();audio.play().catch(()=>{});res();} function onErr(){if(settled)return;settled=true;let err=audio.error,msg='无法播放该音源';if(err){if(err.code===4)msg='浏览器不支持该音视频编码';else if(err.code===3)msg='解码失败';else if(err.code===2)msg='网络错误';}cleanup();rej(new Error(msg));} audio.addEventListener('loadedmetadata',onLoad); audio.addEventListener('error',onErr); timer=setTimeout(()=>{if(!settled){settled=true;cleanup();rej(new Error('加载超时'));}},15000); if(hlsInstance){try{hlsInstance.destroy()}catch(e){}hlsInstance=null} if(flvInstance){try{flvInstance.destroy()}catch(e){}flvInstance=null} try{audio.src=url;audio.load();}catch(e){cleanup();rej(new Error('设置音源失败'));} }); }
export function loadHlsWithCodecCheck(url){ if(window.Hls)return loadHlsInner(url); return loadHlsJs().then(()=>loadHlsInner(url)); }
export function loadHlsInner(url){ if(!window.Hls||!Hls.isSupported())return Promise.reject(new Error('不支持 HLS')); return new Promise((res,rej)=>{ let h=new Hls({enableWorker:true,lowLatencyMode:false}),settled=false,timer=null; function fail(msg){if(settled)return;settled=true;if(timer)clearTimeout(timer);try{h.destroy()}catch(e){}rej(new Error(msg));} h.on(Hls.Events.MANIFEST_PARSED,()=>{ if(settled)return; settled=true; if(timer)clearTimeout(timer); if(hlsInstance){try{hlsInstance.destroy()}catch(e){}} hlsInstance=h; h.attachMedia(audio); audio.play().catch(()=>{}); res(); }); h.on(Hls.Events.ERROR,(e,d)=>{ if(!settled&&d&&d.fatal) fail('HLS 失败'); }); timer=setTimeout(()=>{if(!settled)fail('HLS 超时')},15000); try{h.loadSource(url)}catch(e){fail(e.message)} }); }
export function loadFlvWithCheck(url){ if(window.flvjs)return loadFlvInner(url); return loadFlvJs().then(()=>loadFlvInner(url)); }
export function loadFlvInner(url){ if(!window.flvjs||!flvjs.isSupported())return Promise.reject(new Error('不支持 FLV')); return new Promise((res,rej)=>{ let settled=false,timer=null; function fail(msg){if(settled)return;settled=true;if(timer)clearTimeout(timer);try{if(flvInstance)flvInstance.destroy()}catch(e){}flvInstance=null;rej(new Error(msg));} if(flvInstance){try{flvInstance.destroy()}catch(e){}} flvInstance=flvjs.createPlayer({type:'flv',url,isLive:false,hasAudio:true,hasVideo:false,stashInitialSize:256},{enableWorker:true,enableStashBuffer:false}); flvInstance.on(flvjs.Events.ERROR,(t,d)=>fail('FLV 失败')); timer=setTimeout(()=>{if(!settled)fail('FLV 超时')},15000); try{flvInstance.attachMediaElement(audio);flvInstance.load();flvInstance.play().catch(()=>{});setTimeout(()=>{if(!settled){settled=true;if(timer)clearTimeout(timer);res();}},800);}catch(e){fail(e.message)} }); }
export function setAudioSource(url,format){ if(isFlvFormat(url,format)){ if(audio.canPlayType('video/x-flv'))return loadPlainMedia(url); return loadFlvWithCheck(url); } if(isHlsFormat(url,format)){ if(audio.canPlayType('application/vnd.apple.mpegurl'))return loadPlainMedia(url); return loadHlsWithCodecCheck(url); } return loadPlainMedia(url); }

export function probeOfficialLocal(id){ return Promise.resolve(OFFICIAL_PREFIX+encodeURIComponent(String(id))); }
export function stopAudio(){ try{audio.pause()}catch(e){} if(hlsInstance){try{hlsInstance.destroy()}catch(e){}hlsInstance=null} if(flvInstance){try{flvInstance.destroy()}catch(e){}flvInstance=null} try{audio.removeAttribute('src');audio.load();}catch(e){} }
export function resetProgressUI(){ try{$('seek').value='0';}catch(e){} if($('seek'))$('seek').style.background='linear-gradient(to right, var(--primary) 0%, var(--outline-variant) 0%)'; if($('curTime'))$('curTime').textContent='0:00'; if($('durTime'))$('durTime').textContent='0:00'; }

export function getPreloadEntry(id){ if(!id)return null; if(!preloadCache[id]){ preloadCache[id]={pic:'',lyric:'',lyricTrans:'',lyricRoma:'',url:'',quality:'',urlExpireAt:0,picDone:false,lyricDone:false,urlDone:false}; } return preloadCache[id]; }
export function schedulePreloadRetry(song,type){ if(!song||!song.id)return; if(!preloadTimers[song.id])preloadTimers[song.id]={pic:null,lyric:null,url:null}; let t=preloadTimers[song.id]; if(t[type])return; t[type]=setTimeout(()=>{ t[type]=null; if(state.playlist.indexOf(song)===-1)return; /* 触发预加载逻辑，由于是模块，需外部传入函数或再实现，这里简化为不处理 */ },10000); }

export async function fetchPlayUrlOnce(id){ return { url: OFFICIAL_PREFIX+encodeURIComponent(id), level: 'official', expi: 0 }; }
export async function fetchPlayUrl(id,durationHint){ return { url: OFFICIAL_PREFIX+encodeURIComponent(id), level: 'official', expi: 0 }; }
export async function fetchPlayUrlLevel(id,level,minRemainSec){ if(level==='official')return ''; try { let r=await post('/api/getSongUrl',{id,level}); let url=(r.data&&r.data.url)||r.url; if(url&&isHttpUrl(url))return url; }catch(e){} return ''; }
`;
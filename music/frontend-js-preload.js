export const PRELOAD_SCRIPT = String.raw`// ==================== URL 过期检查 ====================
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
song.pic=(typeof ensureHttps==='function'?ensureHttps(song.pic):song.pic);
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

// 仅用 ID 取封面（getSongInfo），禁止按歌名搜索以免封面错乱
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
if(cached&&(cached.main||cached.trans||cached.roma)){
entry.lyric=cached.main||'';
entry.lyricTrans=cached.trans||'';
entry.lyricRoma=cached.roma||'';
// 有原文即可先展示；若无翻译稍后仍可再请求补全
var hasMain=!!(cached.main&&String(cached.main).trim());
if(hasMain){
entry.lyricDone=true;
}
var cur0=state.playlist[state.current];
if(cur0===song||(cur0&&String(cur0.id)===String(song.id))){
state.lyric=cached.main||'暂无歌词';
state.lyricTrans=cached.trans||'';
if(state.lyricTrans&&String(state.lyricTrans).trim()&&!state._transUserSet)state.transEnabled=true;
state.lyricRoma=cached.roma||'';
state.lyricLoading=!hasMain;
state._lastLyricKey=null;
render();
}
if(hasMain&&cached.trans)return;
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
if(state.lyricTrans&&String(state.lyricTrans).trim()&&!state._transUserSet)state.transEnabled=true;
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
entry.url=song.url;entry.quality='external';entry.urlExpireAt=0;entry.urlDone=true;return;
}
if(entry.urlDone&&entry.quality==='exhigh')return;
var dur=song.duration&&song.duration>0?song.duration:360;
var needRemain=dur+(typeof URL_SAFETY_BUFFER==='number'?URL_SAFETY_BUFFER:30);
try{
// 并发链路在 tryGetLevelWithCache / localGetSongUrl 内部；结果会写入本地+textdb
var r=null;
if(typeof fetchPlayUrl==='function')r=await fetchPlayUrl(song.id,dur);
else if(typeof tryGetLevelWithCache==='function')r=await tryGetLevelWithCache(song.id,'exhigh',needRemain);
if(r&&r.url){
entry.url=(typeof ensureHttps==='function'?ensureHttps(r.url):r.url);
entry.quality=r.level||'exhigh';
entry.urlExpireAt=Date.now()+((r.expi||DEFAULT_EXPI||1200)*1000);
entry.urlDone=true;
// 再异步把 standard 也预热进缓存（不阻塞）
if(typeof tryGetLevelWithCache==='function'){
tryGetLevelWithCache(song.id,'standard',needRemain).catch(function(){});
tryGetLevelWithCache(song.id,'lossless',needRemain).catch(function(){});
}
}
}catch(e){}
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
var curSong=state.playlist[curIdx];
// 当前歌曲：立刻取封面+歌词（不等人点播放）
if(curSong){
try{preloadSongPic(curSong);}catch(e){}
try{preloadSongLyric(curSong);}catch(e){}
}
var scheduledIdx=curIdx;
setTimeout(function(){
if(state.current!==scheduledIdx)return;
var curSong2=state.playlist[curIdx];
if(!curSong2)return;
var prevIdx=(curIdx-1+len)%len;
var nextIdx=(curIdx+1)%len;
var targets=[];
var prevSong=state.playlist[prevIdx];
var nextSong=state.playlist[nextIdx];
if(prevSong&&prevSong!==curSong2)targets.push(prevSong);
if(nextSong&&nextSong!==curSong2&&nextSong!==prevSong)targets.push(nextSong);
for(var i=0;i<targets.length;i++){
preloadSongPic(targets[i]);
preloadSongLyric(targets[i]);
preloadSongUrl(targets[i]);
}
},PRELOAD_DELAY);
}

`;

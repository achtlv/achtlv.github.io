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
if(!entry)return;
function isRealLyric(t){
if(!t||!String(t).trim())return false;
var s=String(t).trim();
if(s==='暂无歌词'||s==='外部音源，暂无歌词'||s==='视频音源，暂无歌词')return false;
if(s.indexOf('\ufffd')!==-1)return false;
return true;
}
function applyToState(main,trans,roma){
var cur=state.playlist[state.current];
if(!cur||String(cur.id)!==String(song.id))return;
// 禁止用空结果覆盖已有有效歌词（并发失败会把歌词闪成「暂无歌词」）
if(!isRealLyric(main)){
if(isRealLyric(state.lyric))return;
state.lyric='暂无歌词';
state.lyricTrans='';
state.lyricRoma='';
}else{
state.lyric=main;
if(trans)state.lyricTrans=trans;
if(roma)state.lyricRoma=roma;
}
if(state.lyricTrans&&String(state.lyricTrans).trim()&&!state._transUserSet)state.transEnabled=true;
state.lyricLoading=false;
state._lastLyricKey=null;
try{render();}catch(e){}
}
// 已有主歌词：先上屏；若缺翻译/罗马音仍继续请求以便合并
if(entry.lyricDone&&isRealLyric(entry.lyric)){
var curX=state.playlist[state.current];
if(curX&&String(curX.id)===String(song.id)){
if(state.lyricLoading||!isRealLyric(state.lyric))applyToState(entry.lyric,entry.lyricTrans||'',entry.lyricRoma||'');
}
// 翻译和罗马音都有了才完全跳过
if(entry.lyricTrans&&String(entry.lyricTrans).trim()&&entry.lyricRoma&&String(entry.lyricRoma).trim())return;
}
if(song.external){
entry.lyricDone=true;
entry.lyric='外部音源，暂无歌词';
applyToState(entry.lyric,'','');
return;
}
// 本地缓存
try{
var cached=await getCachedLyric(song.id);
if(cached&&isRealLyric(cached.main)){
entry.lyric=cached.main||'';
if(cached.trans)entry.lyricTrans=cached.trans;
if(cached.roma)entry.lyricRoma=cached.roma;
entry.lyricDone=true;
applyToState(entry.lyric,entry.lyricTrans||'',entry.lyricRoma||'');
// 已有翻译+罗马音才跳过网络
if(entry.lyricTrans&&entry.lyricRoma)return;
}
}catch(e){}
// 网络
try{
var lr=await post('/api/getSongLyric',{id:song.id});
var m=(typeof extractLyricMulti==='function')?extractLyricMulti(lr):{main:'',trans:'',roma:''};
var main=m.main||'';
var trans=m.trans||'';
var roma=m.roma||'';
if(isRealLyric(main)||isRealLyric(entry.lyric)){
// 合并：网络有更好的主词/翻译/罗马音则升级
if(isRealLyric(main))entry.lyric=main;
if(trans&&String(trans).trim())entry.lyricTrans=trans;
if(roma&&String(roma).trim())entry.lyricRoma=roma;
entry.lyricDone=!!isRealLyric(entry.lyric);
try{if(typeof saveLyricToCache==='function')await saveLyricToCache(song.id,entry.lyric,entry.lyricTrans||'',entry.lyricRoma||'');}catch(e){}
applyToState(entry.lyric,entry.lyricTrans||'',entry.lyricRoma||'');
}else{
// 失败不永久占住：允许下次再拉
entry.lyricDone=false;
entry.lyric='';
applyToState('暂无歌词','','');
}
}catch(e){
entry.lyricDone=false;
applyToState('暂无歌词','','');
}
}




async function preloadSongUrl(song){
if(!song||!song.id)return;
var entry=getPreloadEntry(song.id);
if(!entry)return;
if(song.external){
entry.url=song.url;entry.quality='external';entry.urlExpireAt=0;entry.urlDone=true;return;
}
if(entry.urlDone&&entry.quality==='exhigh'&&entry.url)return;
var dur=song.duration&&song.duration>0?song.duration:360;
var needRemain=dur+(typeof URL_SAFETY_BUFFER==='number'?URL_SAFETY_BUFFER:30);
// 本地已有极高且未过期：不再发请求
try{
var locUrl=null;
if(typeof getLocalAudioUrlOnly==='function')locUrl=getLocalAudioUrlOnly(song.id,'exhigh',5);
else if(typeof getCachedAudioUrl==='function')locUrl=await getCachedAudioUrl(song.id,'exhigh',5);
if(locUrl){
entry.url=(typeof ensureHttps==='function'?ensureHttps(locUrl):locUrl);
entry.quality='exhigh';
entry.urlExpireAt=Date.now()+20*60*1000;
entry.urlDone=true;
return;
}
}catch(e){}
// 内存 preload 缓存
if(entry.url&&entry.quality==='exhigh'&&entry.urlExpireAt&&entry.urlExpireAt>Date.now()+5000){
entry.urlDone=true;
return;
}
try{
var r=null;
if(typeof fetchPlayUrl==='function')r=await fetchPlayUrl(song.id,dur);
else if(typeof tryGetLevelWithCache==='function')r=await tryGetLevelWithCache(song.id,'exhigh',needRemain);
if(r&&r.url){
entry.url=(typeof ensureHttps==='function'?ensureHttps(r.url):r.url);
entry.quality=r.level||'exhigh';
entry.urlExpireAt=Date.now()+((r.expi||DEFAULT_EXPI||1200)*1000);
entry.urlDone=true;
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
if(curSong){
try{preloadSongPic(curSong);}catch(e){}
try{preloadSongLyric(curSong);}catch(e){}
}
var scheduledIdx=curIdx;
setTimeout(function(){
if(state.current!==scheduledIdx)return;
var curSong2=state.playlist[curIdx];
if(!curSong2)return;
var targets=[];
var seen={};
function addIdx(idx){
if(idx==null||idx<0||idx>=len)return;
if(idx===curIdx)return;
if(seen[idx])return;
seen[idx]=true;
var s=state.playlist[idx];
if(s)targets.push(s);
}
if(state.mode==='shuffle'&&state.shuffleOrder&&state.shuffleOrder.length){
var sp=(typeof state.shufflePos==='number'?state.shufflePos:0);
if(sp<0)sp=0;
var sn=state.shuffleOrder.length;
var nextId=state.shuffleOrder[(sp+1)%sn];
var prevId=state.shuffleOrder[(sp-1+sn)%sn];
function idToIdx(id){for(var ii=0;ii<len;ii++){if(state.playlist[ii]&&String(state.playlist[ii].id)===String(id))return ii;}return -1;}
addIdx(idToIdx(nextId));
addIdx(idToIdx(prevId));
}
// 原列表下一首、上一首
addIdx((curIdx+1)%len);
addIdx((curIdx-1+len)%len);
for(var i=0;i<targets.length;i++){
try{preloadSongPic(targets[i]);}catch(e){}
try{preloadSongLyric(targets[i]);}catch(e){}
try{preloadSongUrl(targets[i]);}catch(e){}
}
},80);
}


`;

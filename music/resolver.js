export const RESOLVER_SCRIPT = `
(function(){
'use strict';
var LF=String.fromCharCode(10);
var CR=String.fromCharCode(13);

var URL_SAFETY_BUFFER=60;
var DEFAULT_EXPI=1200;
var COVER_LYRIC_TTL_MS=7*24*3600*1000;
var NETEASE_HOSTS=['music.163.com','163cn.tv','y.music.163.com','music.126.net','music.163.cn'];
var VIDEO_FORMATS=['m3u8','mp4','flv','wmv','mkv','webm','mov','avi','m4v','ts','3gp','3g2','ogv','mpg','mpeg','m2ts','f4v','rm','rmvb','asf'];
var AUDIO_FORMATS=['mp3','m4a','aac','flac','wav','ogg','opus','wma','weba','oga','mka','aiff','aif','ape','alac','amr','3ga'];
var QUALITY_RANK={lossless:4,exhigh:3,standard:2,official:1};
var MAX_PLAY_RANK=3;
var DETECT_TIMES=3;
var LEVELS=['exhigh','standard'];

function post(path,body){
return fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()});
}
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
function isVideoFormat(fmt){
if(!fmt)return false;
var f=String(fmt).toLowerCase();
for(var i=0;i<VIDEO_FORMATS.length;i++){
if(VIDEO_FORMATS[i]===f)return true;
}
return false;
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
function uid(){return 'ext_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)}
function qualityRank(q){
if(!q||q==='unavailable'||q==='external')return 0;
var r=QUALITY_RANK[q];
return (r===undefined)?0:r;
}
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
if(c===32||c===9||c===10||c===13||c===34||c===39||c===60||c===62){end=k;break}
}
var url=s.substring(0,end);
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

// ==================== textdb 缓存 ====================
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
function cacheEncodeValue(expireAt,url){ return String(expireAt)+'|'+encodeURIComponent(url); }
function cacheDecodeValue(text){
if(!text)return null;
var idx=text.indexOf('|');
if(idx===-1)return null;
var exp=parseInt(text.substring(0,idx),10);
if(!isFinite(exp)||exp<=0)return null;
var encoded=text.substring(idx+1);
var url='';
try{ url=decodeURIComponent(encoded); }catch(e){ url=encoded; }
if(!url||!isHttpUrl(url))return null;
return {expireAt:exp,url:url};
}
async function getCachedAudioUrl(id,level,minRemainSec){
if(level==='official'||level==='external')return null;
var key=level+String(id);
var text=await cacheGetRaw(key);
var data=cacheDecodeValue(text);
if(!data)return null;
var remainSec=(data.expireAt-Date.now())/1000;
if(remainSec<minRemainSec)return null;
return data;
}
async function saveAudioUrlToCache(id,level,url,expi){
if(level==='official'||level==='external')return;
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

// ==================== 第三方封面 ====================
async function extractCoverFromUrl(url){
if(!url||!window.jsmediatags)return '';
var low=String(url).toLowerCase();
if(low.indexOf('.m3u8')!==-1||low.indexOf('.flv')!==-1||low.indexOf('.mp4')!==-1||low.indexOf('.ts')!==-1)return '';
var blob=null;
try{
var res=await fetch(url,{headers:{Range:'bytes=0-1572864'}});
if(!res.ok)return '';
blob=await res.blob();
}catch(e){return '';}
return new Promise(function(resolve){
try{
jsmediatags.read(blob,{
onSuccess:function(tag){
var pic=tag&&tag.tags&&tag.tags.picture;
if(!pic||!pic.data)return resolve('');
try{
var bytes=pic.data;
var bin='';
var CHUNK=0x8000;
for(var i=0;i<bytes.length;i+=CHUNK){
var sub=bytes.subarray(i,i+CHUNK);
bin+=String.fromCharCode.apply(null,sub);
}
resolve('data:'+(pic.format||'image/jpeg')+';base64,'+btoa(bin));
}catch(e){resolve('');}
},
onError:function(){resolve('');}
});
}catch(e){resolve('');}
});
}

// ==================== 网易云 ====================
var OFFICIAL_PREFIX='https://ebnr.xiyang6666.top/resolve/https://music.163.com/song?id=';
function probeOfficialLocal(id){ return Promise.resolve(OFFICIAL_PREFIX+encodeURIComponent(String(id))); }

async function fetchMetaById(id){
var idStr=String(id);
var name='',artist='',pic='',duration=0;
if(!pic){
try{
var cachedPic=await getCachedCover(idStr);
if(cachedPic)pic=cachedPic;
}catch(e){}
}
if(!name||!artist||!pic){
try{
var info=await post('/api/getSongInfo',{id:idStr});
var d=info&&info.data?info.data:info;
var song=(d&&d.songs&&d.songs[0])||(Array.isArray(d)?d[0]:null)||(d&&d.song)||d||{};
name=song.name||song.songName||song.title||'';
var artists=song.ar||song.artists||song.singer||song.artist||[];
artist=Array.isArray(artists)?artists.map(function(a){return a&&a.name?a.name:a}).filter(Boolean).join(' / '):(artists.name||artists||'');
pic=(song.al&&song.al.picUrl)||(song.album&&song.album.picUrl)||song.picUrl||song.pic||song.cover||song.picimg||pic;
if(typeof song.dt==='number'&&song.dt>0)duration=song.dt/1000;
else if(typeof song.duration==='number'&&song.duration>0)duration=song.duration/1000;
if(pic) await saveCoverToCache(idStr,pic);
}catch(e){}
}
if((!pic||!name)&&name){
try{
var r=await post('/api/search',{word:name});
if(r&&r.id&&r.id===idStr){
if(!pic&&r.pic) { pic=r.pic; await saveCoverToCache(idStr,r.pic); }
if(!artist&&r.artist) artist=r.artist;
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
var url=(r&&r.data&&r.data.url)||(r&&r.data&&r.data[0]&&r.data[0].url)||(r&&r.url)||'';
if(url&&isHttpUrl(url)){
var expi=(r&&r.data&&r.data.expi)||DEFAULT_EXPI;
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

// ==================== 第三方 ====================
async function tryThirdPartyLink(url){
var check=await post('/api/checkAudio',{url:url});
if(check&&check.ok){
var fmt=check.format||getFormatFromUrl(url);
var pic='';
try{ pic=await extractCoverFromUrl(check.url||url); }catch(e){ pic=''; }
return {
id:uid(),
name:check.name||'外部音源',
artist:isVideoFormat(fmt)?'视频音源':'外部音源',
pic:pic,
external:true,
url:check.url||url,
srcUrl:url,
format:fmt,
quality:'external'
};
}
return null;
}

// ==================== 统一入口 ====================
async function resolveInput(text, fastMode){
text=(text||'').trim();
if(!text)throw new Error('请输入内容');

if(isSongId(text)){
var meta=await fetchMetaById(text);
if(fastMode){
  meta.quality='official';
  return meta;
}
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
if(fastMode){
  meta3.quality='official';
  return meta3;
}
var q3=await detectNeteaseQuality(meta3.id,meta3.duration);
if(!q3)throw new Error('该歌曲暂无可用音源');
meta3.quality=q3;
return meta3;
}
throw new Error((rs&&rs.msg)||(urls.length?'所有链接均不可用，且未搜索到歌曲':'未找到歌曲'));
}

window.MusicResolver = {
  resolveInput: resolveInput
};
})();
`;
export const RESOLVE_SCRIPT = String.raw`// ==================== 播放链接检测 ====================
async function fetchPlayUrlOnce(id){
for(var i=0;i<LEVELS.length;i++){
try{
var r=await post('/api/getSongUrl',{id:id,level:LEVELS[i]});
var url=extractUrl(r);
if(url&&isHttpUrl(url)){return {url:url,level:LEVELS[i],expi:extractExpi(r)};}
}catch(e){}
}
var off=await probeOfficialLocal(id);
if(off&&off.url){
return {url:off.url,level:'official',expi:off.expi||0,fromCache:!!off.fromCache};
}
return null;
}


async function fetchPlayUrlFresh(id){
for(var i=0;i<LEVELS.length;i++){
try{
var r=await post('/api/getSongUrl',{id:id,level:LEVELS[i]});
var url=extractUrl(r);
if(url&&isHttpUrl(url)){
var expi=extractExpi(r);
if(LEVELS[i]!=='official'){
try{await saveAudioUrlToCache(id,LEVELS[i],url,expi);}catch(e){}
}
return {url:url,level:LEVELS[i],expi:expi};
}
}catch(e){}
}
var off=await probeOfficialLocal(id);
if(off&&off.url){
return {url:off.url,level:'official',expi:off.expi||0,fromCache:!!off.fromCache};
}
return null;
}

async function tryGetLevelWithCache(id,level,minRemainSec){
// 1) 仅本地
var local=await getLocalAudioUrlOnly(id,level,minRemainSec);
if(local){
var expiL=Math.max(1,Math.floor((local.expireAt-Date.now())/1000));
try{if(typeof logAction==='function')logAction('取链命中本地',level+' id='+id);}catch(e){}
return {url:upgradeMediaUrl(local.url),level:level,expi:expiL,fromCache:true,fromLocal:true};
}
// 2) TextDB（再回填本地）
var remote=await getTextdbAudioUrlOnly(id,level,minRemainSec);
if(remote&&remote.url){
var expiR=Math.max(1,Math.floor((remote.expireAt-Date.now())/1000));
try{await saveAudioUrlToCache(id,level,remote.url,expiR);}catch(e){}
try{if(typeof logAction==='function')logAction('取链命中TextDB',level+' id='+id);}catch(e){}
return {url:upgradeMediaUrl(remote.url),level:level,expi:expiR,fromCache:true};
}
// 3) 解析 API（一次）
try{
var r=await fetchPlayUrlLevelOnce(id,level);
if(r&&r.url){
try{await saveAudioUrlToCache(id,level,r.url,r.expi||DEFAULT_EXPI);}catch(e){}
try{if(typeof logAction==='function')logAction('取链命中API',level+' id='+id);}catch(e){}
return {url:upgradeMediaUrl(r.url),level:level,expi:r.expi||DEFAULT_EXPI};
}
}catch(e){}
return null;
}

async function fetchPlayUrl(id,durationHint){
var durSec=(durationHint&&durationHint>0)?durationHint:360;
var needRemain=durSec+URL_SAFETY_BUFFER;

// 播放只考虑：极高 > 标准 > 官方（不含无损）
// 1) 优先整条链路冲极高：本地 → API(各源一次) → TextDB；任一步拿到极高立即返回
var hi=await tryGetLevelWithCache(id,'exhigh',needRemain);
if(hi&&hi.url){
hi.url=upgradeMediaUrl(hi.url);
return hi;
}

// 2) 没有极高：用已有音质里最高的（先本地/TextDB 标准，再 API 标准，最后官方）
var stdLocal=await getLocalAudioUrlOnly(id,'standard',needRemain);
if(stdLocal&&stdLocal.url){
return {
url:upgradeMediaUrl(stdLocal.url),
level:'standard',
expi:Math.max(1,Math.floor((stdLocal.expireAt-Date.now())/1000)),
fromCache:true,
fromLocal:true
};
}
var stdDb=await getTextdbAudioUrlOnly(id,'standard',needRemain);
if(stdDb&&stdDb.url){
return {
url:upgradeMediaUrl(stdDb.url),
level:'standard',
expi:Math.max(1,Math.floor((stdDb.expireAt-Date.now())/1000)),
fromCache:true
};
}
// 标准：API 一次（tryGet 内会再扫本地/API/TextDB，本地与 TextDB 已空则主要打 API）
var std=await tryGetLevelWithCache(id,'standard',needRemain);
if(std&&std.url){
std.url=upgradeMediaUrl(std.url);
return std;
}

var off=await probeOfficialLocal(id);
if(off&&off.url){
return {url:upgradeMediaUrl(off.url),level:'official',expi:off.expi||0,fromCache:!!off.fromCache};
}

throw new Error('暂无可用音源');
}

async function fetchPlayUrlLevelOnce(id,level){
if(level==='official'){
var off=await probeOfficialLocal(id);
if(off&&off.url){
return {url:off.url,expi:off.expi||0,fromCache:!!off.fromCache};
}
return null;
}
try{
var r=await post('/api/getSongUrl',{id:id,level:level});
var url=extractUrl(r);
if(url&&isHttpUrl(url)){
var expi=extractExpi(r)||DEFAULT_EXPI;
var rq='';
try{rq=String((r.data&&r.data.respQuality)||'');}catch(e){}
// 仅当接口明确表示落成 128k 时不当作极高
if(level==='exhigh'&&(/^(128k|128|lq)$/i.test(rq))){
try{await maybeCacheSideStandard(id,url,expi);}catch(e){}
return null;
}
return {url:url,expi:expi};
}
}catch(e){}
return null;
}

async function fetchPlayUrlLevel(id,level,minRemainSec){
if(level==='official')return '';
if(typeof minRemainSec!=='number')minRemainSec=300;
var got=await tryGetLevelWithCache(id,level,minRemainSec);
return got&&got.url?got.url:'';
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

if((!name||!artist||!pic)&&!/^kg/i.test(idStr)){
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
var off=await probeOfficialLocal(id, (minExpi||URL_SAFETY_BUFFER||60));
if(off&&off.url){
try{await saveAudioUrlToCache(id,'official',off.url,off.expi||DEFAULT_EXPI);}catch(e){}
return 'official';
}
return '';
}

async function detectNeteaseQuality(id,durationHint){
var hasDuration=(durationHint&&durationHint>0);
var durSec=hasDuration?durationHint:0;
var needRemain=hasDuration?(durSec+URL_SAFETY_BUFFER):300;

// 与播放一致：优先确认极高（本地→API→TextDB），没有再退标准/官方
var hi=await tryGetLevelWithCache(id,'exhigh',needRemain);
if(hi&&hi.url)return 'exhigh';
var std=await getLocalAudioUrlOnly(id,'standard',needRemain);
if(std&&std.url)return 'standard';
var std2=await getTextdbAudioUrlOnly(id,'standard',needRemain);
if(std2&&std2.url)return 'standard';
var std3=await tryGetLevelWithCache(id,'standard',needRemain);
if(std3&&std3.url)return 'standard';
var off=await probeOfficialLocal(id,needRemain);
if(off&&off.url)return 'official';
return '';
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
var pic='';
try{
pic=await extractCoverFromUrl(check.url||url);
}catch(e){pic='';}
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

async function resolveInput(text){
text=(text||'').trim();
if(!text)throw new Error('请输入内容');
var src=(typeof ADD_SOURCE!=='undefined'?ADD_SOURCE:'wy');

// 第三方源模式：只解析直链
if(src==='ext'){
var urlsE=extractAllUrlsFromText(text);
if(!urlsE.length)throw new Error('请输入音频/视频直链');
for(var je=0;je<urlsE.length;je++){
try{
var eme=await tryThirdPartyLink(urlsE[je]);
if(eme)return eme;
}catch(e){}
}
throw new Error('直链不可用');
}

// 酷狗模式
if(src==='kg'){
if(isKgId(text)){
var kid=normalizeKgId(text);
var metaK={id:kid,name:'酷狗歌曲',artist:'',pic:'',duration:0,source:'kg'};
var qk=await detectNeteaseQuality(kid,0);
if(!qk)throw new Error('该酷狗歌曲暂无可用音源');
metaK.quality=qk;
return metaK;
}
var rsk=await localSearchKg(text);
if(rsk&&rsk.id){
var meta4={id:String(rsk.id),name:rsk.name||text,artist:rsk.artist||'未知歌手',pic:rsk.pic||'',duration:rsk.duration||0,source:'kg'};
if(meta4.pic){try{await saveCoverToCache(meta4.id,meta4.pic);}catch(e){}}
var q4=await detectNeteaseQuality(meta4.id,meta4.duration);
if(!q4)throw new Error('该酷狗歌曲暂无可用音源');
meta4.quality=q4;
return meta4;
}
throw new Error((rsk&&rsk.msg)||'未找到酷狗歌曲');
}

// 默认网易云
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
// 网易模式下不再自动匹配第三方直链
}

var rs=await post('/api/search',{word:text});
if(rs&&rs.id){
var meta3={id:String(rs.id),name:rs.name||text,artist:rs.artist||'未知歌手',pic:rs.pic||'',duration:0};
var q3=await detectNeteaseQuality(meta3.id,meta3.duration);
if(!q3)throw new Error('该歌曲暂无可用音源');
meta3.quality=q3;
return meta3;
}
throw new Error((rs&&rs.msg)||(urls.length?'网易云链接不可用，且未搜索到歌曲':'未找到歌曲'));
}

`;

export const UTILS_SCRIPT = String.raw`// ==================== 基础工具 ====================
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
function isKgId(s){
if(!s)return false;
var str=String(s);
if(str.indexOf('kg')===0&&str.length>=34)return true;
return /^[a-fA-F0-9]{32}$/.test(str);
}
function normalizeKgId(s){
var str=String(s||'');
if(str.indexOf('kg')===0)return str;
if(/^[a-fA-F0-9]{32}$/.test(str))return 'kg'+str.toLowerCase();
return str;
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

function detectImportType(val){
var s=String(val||'').trim();
if(!s)return 'empty';
if(s.indexOf('#GZIP')===0&&s.length>15)return 'gzip';
// 密钥：无换行、无 |、较短纯字母数字（兼容 15 位旧密钥与 pl 开头新密钥）
if(s.indexOf('|')===-1&&s.indexOf('\n')===-1&&s.indexOf(' ')===-1&&s.length>=8&&s.length<=40&&/^[a-zA-Z0-9_-]+$/.test(s))return 'key';
return 'plain';
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

function getApiOrigin(){
try{
if(typeof location!=='undefined'&&location.origin&&/^https?:/i.test(location.origin)&&location.protocol!=='file:'){
return location.origin;
}
}catch(e){}
return 'https://music.achtlv.kdns.fr';
}
function toAbsoluteApiUrl(path){
if(!path)return getApiOrigin();
var s=String(path);
if(/^https?:\/\//i.test(s))return s;
if(s.charAt(0)!=='/')s='/'+s;
return getApiOrigin()+s;
}
// ==================== 浏览器直连（尽量不走 Worker） ====================
function upgradeNeteaseUrl(url){
if(!url||typeof url!=='string')return url;
return url.replace(/^http:\/\/(([a-z0-9.-]+)\.music\.126\.net)\//i,'https://$1/');
}
function upgradeMediaUrl(url){
if(!url||typeof url!=='string')return url;
var u=String(url).trim();
u=upgradeNeteaseUrl(u);
// HTTPS 页面禁止 http 媒体：常见音频 CDN 一律升 https
if(/^http:\/\//i.test(u)){
if(/music\.126\.net|music\.163\.|netease|kugou\.com|qqmusic|gtimg|myqcloud|kuwo|tencentmusic|vod\./i.test(u)){
u=u.replace(/^http:\/\//i,'https://');
}
}
return u;
}
function qualitiesForLevel(level){
var lv=String(level||'').toLowerCase();
if(lv==='lossless'||lv==='flac'||lv==='hires')return ['flac'];
if(lv==='exhigh'||lv==='320k'||lv==='higher')return ['320k'];
if(lv==='standard'||lv==='128k')return ['128k'];
return ['320k'];
}
function localFetchJson(url,options,timeoutMs){
options=options||{};
timeoutMs=timeoutMs||12000;
var ctrl=typeof AbortController!=='undefined'?new AbortController():null;
var timer=null;
var opts={method:options.method||'GET',headers:options.headers||{}};
if(ctrl)opts.signal=ctrl.signal;
if(options.body!==undefined)opts.body=options.body;
return new Promise(function(resolve){
if(ctrl)timer=setTimeout(function(){try{ctrl.abort();}catch(e){}},timeoutMs);
fetch(url,opts).then(function(r){
return r.text().then(function(t){
var data=null;
try{data=JSON.parse(t);}catch(e){}
resolve({ok:r.ok,status:r.status,data:data,text:t});
});
}).catch(function(e){
resolve({ok:false,status:0,data:null,error:String(e&&e.message||e)});
}).then(function(v){if(timer)clearTimeout(timer);return v;});
});
}

async function maybeCacheSideStandard(id,url,expi){
if(!id||!url)return;
var ttl=typeof expi==='number'&&expi>0?expi:(DEFAULT_EXPI||1200);
if(ttl>(DEFAULT_EXPI||1200))ttl=DEFAULT_EXPI||1200;
var expireAt=Date.now()+ttl*1000;
try{
if(typeof getLocalAudioUrlOnly==='function'){
var local=await getLocalAudioUrlOnly(String(id),'standard',0);
if(local&&local.expireAt&&local.expireAt>=expireAt)return;
}
}catch(e){}
try{
if(typeof saveAudioUrlToCache==='function'){
var u=url;
if(typeof upgradeMediaUrl==='function')u=upgradeMediaUrl(u);
else if(typeof upgradeNeteaseUrl==='function')u=upgradeNeteaseUrl(u);
await saveAudioUrlToCache(String(id),'standard',u,ttl);
}
}catch(e){}
}

async function localGetSongUrl(id,level){
var songId=String(id||'').trim();
if(!songId)return {code:400,msg:'无效歌曲 ID'};
// 酷狗：id 形如 kg + hash
if(/^kg[a-fA-F0-9]{32}$/i.test(songId)||(songId.indexOf('kg')===0&&songId.length>10)){
return localGetKgSongUrl(songId,level);
}
if(!/^\d+$/.test(songId))return {code:400,msg:'无效歌曲 ID'};
var qualities=qualitiesForLevel(level);
var errors=[];
var backends=[
{name:'星海',run:async function(q){
var url='https://yy.zddyr.top/lx/api/?source=wy&songmid='+encodeURIComponent(songId)+'&quality='+encodeURIComponent(q);
var r=await localFetchJson(url,{method:'GET'});
var u=(r.data&&(r.data.url||(r.data.data&&r.data.data.url)))||'';
if(u)return {url:u,quality:(r.data&&r.data.quality)||q,expi:(r.data&&r.data.expi)||0};
throw new Error((r.data&&(r.data.msg||r.data.message))||'星海无结果');
}},
{name:'GD',run:async function(q){
var br=q==='flac'?'740':(q==='320k'?'320':'128');
var url='https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id='+encodeURIComponent(songId)+'&br='+br;
var r=await localFetchJson(url,{method:'GET'});
var u=(r.data&&r.data.url)||'';
var gotBr=(r.data&&r.data.br)||0;
var gq=q;
if(gotBr&&gotBr>0&&gotBr<=160)gq='128k';
else if(gotBr&&gotBr<=400)gq='320k';
if(u)return {url:u,quality:gq,expi:0};
throw new Error('GD无结果');
}},
{name:'ikun',run:async function(q){
var r=await localFetchJson('https://c.wwwweb.top/music/url',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({source:'wy',musicId:songId,quality:q})
});
if(r.data&&Number(r.data.code)===200&&r.data.url)return {url:r.data.url,quality:r.data.quality||q,expi:0};
throw new Error((r.data&&r.data.message)||'ikun无结果');
}},
{name:'Huibq',run:async function(q){
if(q==='flac')q='320k';
var url='https://lxmusicapi.onrender.com/url/wy/'+encodeURIComponent(songId)+'/'+encodeURIComponent(q);
var r=await localFetchJson(url,{method:'GET',headers:{'X-Request-Key':'share-v3','User-Agent':'lx-music-desktop/2.10.0'}});
if(r.data&&Number(r.data.code)===0&&r.data.url){
var rq=(r.data.extra&&r.data.extra.quality&&r.data.extra.quality.result)||q;
return {url:r.data.url,quality:rq,expi:0};
}
throw new Error((r.data&&r.data.msg)||'Huibq无结果');
}},
{name:'oiapi',run:async function(q){
var r=await localFetchJson('https://oiapi.net/api/Music_163?id='+encodeURIComponent(songId),{method:'GET'});
var u='';
if(r.data&&r.data.data&&r.data.data[0])u=r.data.data[0].url||'';
if(u)return {url:u,quality:q,expi:0};
throw new Error('oiapi无结果');
}}
];
for(var qi=0;qi<qualities.length;qi++){
var q=qualities[qi];
try{backends.sort(function(a,b){if(a.name==='GD')return -1;if(b.name==='GD')return 1;return 0;});}catch(e){}
for(var bi=0;bi<backends.length;bi++){
try{
var got=await backends[bi].run(q);
var url=got&&got.url?got.url:got;
var gotQ=(got&&got.quality)?String(got.quality):q;
url=upgradeNeteaseUrl(url);
if(url&&/^https?:\/\//i.test(url)){
var ttl=DEFAULT_EXPI||1200;
// 请求极高过程中若实际拿到标准，写入标准缓存（比本地更晚才覆盖）
var gq=gotQ.toLowerCase();
// 仅当明确返回 128k 时侧写标准缓存，并继续冲更高；不要因字段名含糊就丢弃可用链接
if((q==='320k'||q==='flac')&&(gq==='128k'||gq==='128'||gq==='lq')){
try{await maybeCacheSideStandard(songId,url,ttl);}catch(e){}
errors.push(backends[bi].name+'/'+q+': got 128k, continue');
continue;
}
// 内部统一用 exhigh/standard，避免和 LEVELS 对不上
var outLevel=q;
if(q==='320k'||q==='higher')outLevel='exhigh';
else if(q==='128k'||q==='l')outLevel='standard';
else if(q==='flac'||q==='hires')outLevel='lossless';
return {code:200,data:{url:url,expi:ttl,level:outLevel,br:q==='flac'?999000:(q==='320k'?320000:128000),respQuality:gotQ}};
}
}catch(e){errors.push(backends[bi].name+'/'+q+': '+(e.message||e));}
}
}
return {code:404,msg:'暂无可用音源',debug:errors.slice(0,8)};
}
async function localGetKgSongUrl(id,level){
var raw=String(id||'');
var hash=raw.indexOf('kg')===0?raw.substring(2):raw;
hash=String(hash).toLowerCase().replace(/[^a-f0-9]/g,'');
if(hash.length!==32)return {code:400,msg:'无效酷狗 hash'};
var qualities=qualitiesForLevel(level);
var errors=[];
for(var qi=0;qi<qualities.length;qi++){
var q=qualities[qi];
try{
var url='https://yy.zddyr.top/lx/api/?source=kg&quality='+encodeURIComponent(q)+
'&songmid='+encodeURIComponent(hash)+'&mainHash='+encodeURIComponent(hash)+'&hash='+encodeURIComponent(hash);
var r=await localFetchJson(url,{method:'GET'});
var u=(r.data&&r.data.url)||'';
if(u&&/^https?:\/\//i.test(u)){
var outL=q;if(q==='320k')outL='exhigh';else if(q==='128k')outL='standard';
return {code:200,data:{url:u,expi:DEFAULT_EXPI||1200,level:outL,br:q==='flac'?999000:(q==='320k'?320000:128000)}};
}
errors.push('星海kg/'+q+':'+(r.data&&(r.data.msg||r.data.message)||'无结果'));
}catch(e){errors.push('星海kg/'+q+':'+(e.message||e));}
}
return {code:404,msg:'酷狗暂无可用音源',debug:errors.slice(0,6)};
}
async function localSearchKg(word){
if(!word)return {code:400,msg:'缺少搜索关键词'};
function pickFromLists(lists){
if(!lists||!lists[0])return null;
var it=lists[0];
var hash=String(it.FileHash||it.fileHash||it.hash||'').toLowerCase().replace(/[^a-f0-9]/g,'');
if(hash.length!==32)return null;
var pic='';
if(it.Image)pic=String(it.Image).replace('{size}','400');
if(pic&&/stdmusic\/\d+\//.test(pic))pic=pic.replace(/stdmusic\/\d+\//,'stdmusic/400/');
if(pic&&/\/150\//.test(pic))pic=pic.replace(/\/150\//,'/400/');
else if(it.TransParam&&it.TransParam.union_cover)pic=String(it.TransParam.union_cover).replace('{size}','400');
else if(it.trans_param&&it.trans_param.union_cover)pic=String(it.trans_param.union_cover).replace('{size}','400');
return {
code:200,
id:'kg'+hash,
name:it.SongName||it.songname||it.filename||word,
artist:it.SingerName||it.singername||'未知歌手',
pic:pic,
duration:it.Duration||it.duration||0,
source:'kg',
hash:hash,
hqHash:String(it.HQFileHash||'').toLowerCase(),
sqHash:String(it.SQFileHash||'').toLowerCase()
};
}
// 优先 Worker 代理（避免浏览器 CORS）
try{
var url=toAbsoluteApiUrl('/api/searchKg');
var res=await fetch(url,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({word:String(word)})
});
var data=await res.json();
if(data&&Number(data.code)===200&&data.id)return data;
}catch(e){}
// 直连兜底
try{
var r=await localFetchJson('https://songsearch.kugou.com/song_search_v2?keyword='+encodeURIComponent(word)+'&page=1&pagesize=5&userid=-1&clientver=&platform=WebFilter',{
method:'GET',
headers:{'User-Agent':'Mozilla/5.0'}
});
var lists=(r.data&&r.data.data&&r.data.data.lists)||[];
var got=pickFromLists(lists);
if(got)return got;
}catch(e){}
return {code:404,msg:'未找到酷狗歌曲'};
}
async function localSearch(word){
if(!word)return {code:400,msg:'缺少搜索关键词'};
var r=await localFetchJson('https://api.vkeys.cn/v2/music/netease?word='+encodeURIComponent(word),{method:'GET'});
var data=r.data||{};
var d=data.data;
var item=null;
if(Array.isArray(d))item=d[0];
else if(d&&Array.isArray(d.list))item=d.list[0];
else if(d&&Array.isArray(d.songs))item=d.songs[0];
else if(d&&(d.id||d.songId))item=d;
else if(d&&d.data&&(d.data.id||d.data.songId))item=d.data;
if(!item)return {code:404,msg:'未找到歌曲'};
var id=item.id||item.songId||item.song_id;
var name=item.name||item.song||item.title||item.songName||word;
var artist=item.singer||item.artist||item.artists||item.ar||'';
if(Array.isArray(artist))artist=artist.map(function(a){return a&&a.name?a.name:a}).filter(Boolean).join(' / ');
else if(artist&&typeof artist==='object')artist=artist.name||'';
var pic=item.cover||item.pic||item.picUrl||item.picture||item.coverUrl||(item.al&&item.al.picUrl)||(item.album&&item.album.picUrl)||'';
return {code:200,id:String(id),name:name,artist:String(artist),pic:pic};
}
var _songInfoMem={};
async function localGetSongInfo(id){
var songId=String(id||'').trim();
if(!songId||!/^\d+$/.test(songId))return {code:400,msg:'无效歌曲 ID'};
if(_songInfoMem[songId])return _songInfoMem[songId];
try{
var r=await localFetchJson('https://api.paugram.com/netease/?id='+encodeURIComponent(songId),{method:'GET'},10000);
var d=r.data;
if(d&&(d.title||d.name||d.cover||d.artist)){
var name=d.title||d.name||'';
var artist=d.artist||d.singer||'';
var pic=d.cover||d.pic||d.picUrl||'';
if(pic&&/music\.126\.net/i.test(pic)){
// 强制高清，覆盖已有小图 param
pic=pic.replace(/([?&])param=[^&]*/g,'').replace(/\?&/,'?').replace(/[?&]$/,'');
pic=pic+(pic.indexOf('?')===-1?'?':'&')+'param=500y500';
}
var out={code:200,data:{songs:[{id:Number(songId)||songId,name:name,ar:[{name:artist}],al:{picUrl:pic},dt:0}]}};
_songInfoMem[songId]=out;
return out;
}
}catch(e){}
try{
var r2=await localFetchJson('https://api.injahow.cn/meting/?server=netease&type=song&id='+encodeURIComponent(songId),{method:'GET'},10000);
var arr=r2.data;
var item=Array.isArray(arr)?arr[0]:arr;
if(item&&(item.name||item.pic||item.artist)){
var out2={code:200,data:{songs:[{id:Number(songId)||songId,name:item.name||'',ar:[{name:item.artist||''}],al:{picUrl:item.pic||''},dt:0}]}};
_songInfoMem[songId]=out2;
return out2;
}
}catch(e){}
var empty={code:200,data:{songs:[{id:Number(songId)||songId,name:'',ar:[{name:''}],al:{picUrl:''},dt:0}]}};
_songInfoMem[songId]=empty;
return empty;
}
async function localGetSongLyric(id){
var songId=String(id||'').trim();
if(!songId)return {code:400,msg:'无效歌曲 ID'};
// 酷狗歌词：走 Worker 代理（krcs 有 CORS）
if(/^kg/i.test(songId)||/^[a-fA-F0-9]{32}$/.test(songId)){
var hash=songId.indexOf('kg')===0?songId.substring(2):songId;
hash=String(hash).toLowerCase().replace(/[^a-f0-9]/g,'');
if(hash.length===32){
try{
var url=toAbsoluteApiUrl('/api/getSongLyric');
var res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'kg'+hash})});
var data=await res.json();
if(data&&data.code===200)return data;
}catch(e){}
}
return {code:200,data:{lrc:{lyric:''},tlyric:{lyric:''},romalrc:{lyric:''}}};
}
if(!/^\d+$/.test(songId))return {code:400,msg:'无效歌曲 ID'};
// 优先 vkeys：同时有原文/翻译/音译
try{
var r=await localFetchJson('https://api.vkeys.cn/v2/music/netease/lyric?id='+encodeURIComponent(songId),{method:'GET'});
var d=r.data&&r.data.data;
if(d&&(d.lrc||d.trans||d.roma)){
return {code:200,data:{
lrc:{lyric:d.lrc||''},
tlyric:{lyric:d.trans||''},
romalrc:{lyric:d.roma||''}
}};
}
}catch(e){}
// 备用 GD Studio 歌词
try{
var rg=await localFetchJson('https://music-api.gdstudio.xyz/api.php?types=lyric&source=netease&id='+encodeURIComponent(songId),{method:'GET'});
if(rg.data&&rg.data.lyric){
return {code:200,data:{
lrc:{lyric:rg.data.lyric||''},
tlyric:{lyric:rg.data.tlyric||rg.data.trans||''},
romalrc:{lyric:''}
}};
}
}catch(e){}
// 备用 paugram：翻译在 sub_lyric
try{
var r0=await localFetchJson('https://api.paugram.com/netease/?id='+encodeURIComponent(songId),{method:'GET'},10000);
var d0=r0.data;
if(d0&&(d0.lyric||d0.sub_lyric)){
return {code:200,data:{
lrc:{lyric:d0.lyric||''},
tlyric:{lyric:d0.sub_lyric||d0.tlyric||d0.trans||''},
romalrc:{lyric:''}
}};
}
}catch(e){}
return {code:200,data:{lrc:{lyric:''},tlyric:{lyric:''},romalrc:{lyric:''}}};
}
async function textdbPutOne(safeKey,val){
// 浏览器直连 textdb（不走 Worker）
var v=String(val);
var url='https://textdb.online/update/?key='+encodeURIComponent(safeKey)+'&value='+encodeURIComponent(v);
try{
var r=await localFetchJson(url,{method:'GET'},30000);
if(r.status===0)return {ok:false,msg:r.error||'网络错误(CORS/超时)'};
if(!r.ok)return {ok:false,msg:'HTTP '+r.status};
// textdb 成功: {status:1,...}
if(r.data&&typeof r.data==='object'&&r.data.status!=null&&Number(r.data.status)!==1){
return {ok:false,msg:'textdb status='+r.data.status};
}
return {ok:true};
}catch(e){return {ok:false,msg:String(e.message||e)};}
}
async function textdbGetOne(safeKey){
try{
var r=await localFetchJson('https://textdb.online/'+encodeURIComponent(safeKey),{method:'GET'},20000);
if(r.status===0)return {ok:false,msg:r.error||'网络错误'};
if(!r.ok)return {ok:false,msg:'HTTP '+r.status};
var val=r.text!=null?String(r.text):'';
// 空内容也算成功读到（可能未写入）
return {ok:true,value:val};
}catch(e){return {ok:false,msg:String(e.message||e)};}
}
async function localCacheGet(key){
if(!key)return {ok:false,msg:'缺少 key'};
var safeKey=String(key).replace(/[^a-zA-Z0-9_-]/g,'');
if(!safeKey)return {ok:false,msg:'无效 key'};
var meta=await textdbGetOne(safeKey);
if(!meta.ok)return meta;
var val=String(meta.value||'').trim();
if(val.indexOf('{"v":2')===0){
try{
var o=JSON.parse(val);
if(o&&o.v===2&&o.n>1){
var parts=[];
for(var i=0;i<o.n;i++){
var p=await textdbGetOne(safeKey+'_c'+i);
if(!p.ok||p.value==null)return {ok:false,msg:'分片 '+i+' 缺失'};
parts.push(String(p.value));
}
return {ok:true,value:parts.join('')};
}
}catch(e){}
}
return {ok:true,value:val};
}
async function localCacheSet(key,value){
if(!key||value===undefined||value===null)return {ok:false,msg:'缺少参数'};
var safeKey=String(key).replace(/[^a-zA-Z0-9_-]/g,'');
if(!safeKey)return {ok:false,msg:'无效 key'};
var val=String(value);
// 浏览器直连：分片约 1500 字符，避免 URL 过长
var CHUNK=1500;
if(val.length<=CHUNK){
return await textdbPutOne(safeKey,val);
}
var n=Math.ceil(val.length/CHUNK);
var rm=await textdbPutOne(safeKey,JSON.stringify({v:2,n:n}));
if(!rm.ok)return rm;
for(var i=0;i<n;i++){
var part=val.substring(i*CHUNK,(i+1)*CHUNK);
var rp=await textdbPutOne(safeKey+'_c'+i,part);
if(!rp.ok)return {ok:false,msg:'分片 '+i+' 上传失败:'+(rp.msg||'')};
}
return {ok:true};
}
function post(path,body){
body=body||{};
var p=String(path||'');
if(p==='/api/getSongUrl'||p==='getSongUrl')return localGetSongUrl(body.id,body.level||'exhigh');
if(p==='/api/search'||p==='search')return localSearch(body.word||'');
if(p==='/api/getSongLyric'||p==='getSongLyric')return localGetSongLyric(body.id);
if(p==='/api/getSongInfo'||p==='getSongInfo')return localGetSongInfo(body.id);
if(p==='/api/cacheGet'||p==='cacheGet')return localCacheGet(body.key||'');
if(p==='/api/cacheSet'||p==='cacheSet')return localCacheSet(body.key||'',body.value);
var url=toAbsoluteApiUrl(path);
return fetch(url,{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify(body||{})
}).then(function(r){
if(!r.ok){
return r.text().then(function(t){
try{return JSON.parse(t);}catch(e){return {ok:false,msg:'HTTP '+r.status};}
});
}
return r.json();
}).catch(function(err){
var msg=(err&&err.message)?String(err.message):'网络错误';
if(/Only HTTP/i.test(msg)||/Failed to fetch/i.test(msg)||/NetworkError/i.test(msg)){
msg='网络请求失败，请检查应用是否允许访问 https://music.achtlv.kdns.fr';
}
return Promise.reject(new Error(msg));
});
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
var m=s;
var ml=m.toLowerCase();
if(ml.indexOf('http://')===0)m=m.substring(7);
else if(ml.indexOf('https://')===0)m=m.substring(8);
var cut=m.indexOf('/');
if(cut!==-1)m=m.substring(0,cut);
return m.toLowerCase();
}
}

function getSongDedupKeys(song){
var keys=[];
if(!song)return keys;
if(song.external){
var u1=normalizeUrlForKey(song.url||'');
if(u1)keys.push('ext:'+u1);
var u2=normalizeUrlForKey(song.srcUrl||'');
if(u2&&u2!==u1)keys.push('ext:'+u2);
}else if(song.id){
var id=String(song.id);
// 不同平台不算重复：网易数字 ID vs 酷狗 kg+hash
if(/^kg/i.test(id))keys.push('kg:'+id.toLowerCase());
else if(/^[a-fA-F0-9]{32}$/.test(id))keys.push('kg:kg'+id.toLowerCase());
else keys.push('wy:'+id);
}
return keys;
}

function findDuplicateIndex(song,list){
var toKeys=getSongDedupKeys(song);
if(!toKeys.length)return -1;
var toSet={};
for(var a=0;a<toKeys.length;a++)toSet[toKeys[a]]=true;
for(var i=0;i<list.length;i++){
var lk=getSongDedupKeys(list[i]);
for(var j=0;j<lk.length;j++){
if(toSet[lk[j]])return i;
}
}
return -1;
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
try{
var data=state.playlist.map(function(s){
var obj={id:s.id,name:s.name||'',artist:s.artist||''};
if(s.external){obj.ext=true;obj.url=s.url||'';obj.srcUrl=s.srcUrl||'';obj.format=s.format||'';}
if(s.pic)obj.pic=s.pic;
if(s.source)obj.source=s.source;
return obj;
});
var lastId='';
try{
if(state.current>=0&&state.playlist[state.current])lastId=String(state.playlist[state.current].id||'');
}catch(e){}
var payload=JSON.stringify({v:1,list:data,current:state.current,lastId:lastId});
localStorage.setItem(COOKIE_NAME,payload);
try{localStorage.setItem(COOKIE_NAME+'_bak',payload);}catch(e3){}
try{
var encoded=encodeURIComponent(JSON.stringify(data));
if(encoded.length<=COOKIE_MAX)setCookieRaw(COOKIE_NAME,encoded);
}catch(e2){}
}catch(e){
console.error('savePlaylist',e);
try{if(typeof logError==='function')logError('保存播放列表失败',e);}catch(e4){}
}
}
function restorePlaylist(){
try{
var raw=localStorage.getItem(COOKIE_NAME);
if(!raw){try{raw=localStorage.getItem(COOKIE_NAME+'_bak');}catch(e){}}
if(raw){
try{
var obj=JSON.parse(raw);
var list=Array.isArray(obj)?obj:(obj&&obj.list);
if(Array.isArray(list)&&list.length>=0){
state.playlist=list.map(function(s){
var o={id:String(s.id||''),name:s.name||'未知歌曲',artist:s.artist||'未知歌手',pic:s.pic||'',duration:0};
if(s.ext){o.external=true;o.url=String(s.url||'');o.srcUrl=String(s.srcUrl||'');o.format=String(s.format||'');}
return o;
}).filter(function(s){return !!s.id&&(!s.external||!!s.url);});
// 恢复上次播放的歌曲（优先 lastId，其次 current 索引），不自动播放
var restored=-1;
if(obj&&obj.lastId){
var lid=String(obj.lastId);
for(var ri=0;ri<state.playlist.length;ri++){
if(String(state.playlist[ri].id)===lid){restored=ri;break;}
}
}
if(restored<0&&obj&&typeof obj.current==='number'&&obj.current>=0&&obj.current<state.playlist.length){
restored=obj.current;
}
if(restored>=0)state.current=restored;
else state.current=state.playlist.length?0:-1;
state.playing=false;
state.audioUrl='';
state.quality='';
state.showLyric=false;
return;
}
}catch(e1){}
}
raw=getCookieRaw(COOKIE_NAME);
if(!raw)return;
try{
var list2=JSON.parse(decodeURIComponent(raw));
if(!Array.isArray(list2))return;
state.playlist=list2.map(function(s){
var o={id:String(s.id||''),name:s.name||'未知歌曲',artist:s.artist||'未知歌手',pic:'',duration:0};
if(s.ext){o.external=true;o.url=String(s.url||'');o.srcUrl=String(s.srcUrl||'');o.format=String(s.format||'');}
return o;
}).filter(function(s){return !!s.id&&(!s.external||!!s.url);});
// cookie 无 current：默认第 0 首
state.current=state.playlist.length?0:-1;
}catch(e2){}
}catch(e){console.error('restorePlaylist',e);}
}
function clearPlaylistCookie(){
document.cookie=COOKIE_NAME+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
}

// ==================== 导入 / 导出 ====================
function exportListText(){
return state.playlist.map(function(s){
var name=(s.name||'').split('|').join(' ');
var artist=(s.artist||'').split('|').join(' ');
var pic=(s.pic||'').split('|').join(' ');
if(s.external){
return (s.url||'')+'|'+name+'|'+artist+'|'+(s.srcUrl||'')+(pic?'|'+pic:'');
}
// id|name|artist|pic
return s.id+'|'+name+'|'+artist+(pic?'|'+pic:'');
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
var pic=(parts[3]||'').trim();
if(isSongId(key)){
item={id:key,name:(parts[1]||'').trim()||'未知歌曲',artist:(parts[2]||'').trim()||'未知歌手',pic:pic||'',duration:0,source:'wy'};
}else if(typeof isKgId==='function'&&isKgId(key)){
var kid=typeof normalizeKgId==='function'?normalizeKgId(key):key;
item={id:kid,name:(parts[1]||'').trim()||'未知歌曲',artist:(parts[2]||'').trim()||'未知歌手',pic:pic||'',duration:0,source:'kg'};
}else if(isHttpUrl(key)){
var srcUrl=(parts[3]||'').trim();
if(pic&&isHttpUrl(pic)&&!isHttpUrl(srcUrl)){/* parts[3] may be pic for netease export */}
if(!isHttpUrl(srcUrl))srcUrl=(parts[4]||'').trim();
if(!isHttpUrl(srcUrl))srcUrl='';
// export format: url|name|artist|srcUrl  OR  id|name|artist|pic
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
if(mode==='new'){
if(typeof pushListHistory==='function')pushListHistory();
state.playlist=imported.slice();
state.current=-1;
return imported.length;
}
if(mode==='replace'){
state.playlist=imported.slice();
state.current=-1;
return imported.length;
}
var seen={};
state.playlist.forEach(function(s){addKeysToSeen(seen,s)});
var added=[];
imported.forEach(function(s){
if(hasAnyKeyInSeen(seen,s))return;
added.push(s);
addKeysToSeen(seen,s);
});
if(added.length===0)return 0;
var oldCurrent=state.current;
state.playlist=added.concat(state.playlist);
if(oldCurrent>=0)state.current=oldCurrent+added.length;
return added.length;
}


// EARLY_RESTORE: 不依赖 app.js，脚本加载后立即恢复列表，避免 app 异常导致“数据全无”
try{
if(typeof restorePlaylist==='function')restorePlaylist();
}catch(e){}
`;

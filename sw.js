/* sw.js — 诗词图谱的离线缓存层（Service Worker）
 * 目的：手机上一次加载后，把整份 poemgraph.html(含 11.6MB 内嵌音频)持久存到本地，
 *       下次访问秒开、且可完全离线；朗读不再等下载。
 * 只在 http(s) 下由页面注册；直接用 file:// 打开 HTML 时不启用，App 仍是自包含单文件。
 * 策略：对 poemgraph.html 用「缓存优先」——命中即刻返回(秒开)，同时后台带 ETag 做条件校验，
 *       服务器未变返回 304(极小)、变了才下载新版并通知页面弹「刷新」提示。
 *       带查询串(?v=…)的请求一律放行走网络，方便开发期取最新代码、不被缓存挡住。
 */
const CACHE = 'poemgraph-cache-v1';
const CORE = './poemgraph.html';

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.add(CORE); }).catch(function(){}));
});

self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    var keys = await caches.keys();
    await Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    await self.clients.claim();
  })());
});

async function revalidate(cache, cached){
  try{
    var headers = {};
    var et = cached.headers.get('ETag');
    if(et) headers['If-None-Match'] = et;
    // no-store：绕过 HTTP 缓存，自己用 Cache 里存的 ETag 做条件请求，未变则 304(便宜)、不重复下载 12.9MB
    var res = await fetch(CORE, { headers: headers, cache: 'no-store' });
    if(res && res.status === 200 && res.ok){
      await cache.put(CORE, res.clone());
      var cs = await self.clients.matchAll();
      cs.forEach(function(c){ c.postMessage({ type: 'pg-updated' }); });
    }
    // 304 或其它：保持现有缓存，不打扰用户
  }catch(err){ /* 离线：忽略，继续用缓存 */ }
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(url.search) return;                          // 带 ?v=… 的开发/调试请求：放行走网络，不缓存
  if(!/poemgraph\.html$/.test(url.pathname) && req.mode !== 'navigate') return;
  if(req.mode === 'navigate' && !/poemgraph\.html$/.test(url.pathname)) return; // 只接管 poemgraph.html

  e.respondWith((async function(){
    var cache = await caches.open(CACHE);
    var cached = await cache.match(CORE);
    if(cached){
      e.waitUntil(revalidate(cache, cached));     // 缓存优先：立刻返回，后台校验更新
      return cached;
    }
    try{                                          // 首访：无缓存，走网络并存入(不提示"新版本")
      var res = await fetch(req);
      if(res && res.ok) await cache.put(CORE, res.clone());
      return res;
    }catch(err){
      return new Response('离线且无缓存', { status: 503 });
    }
  })());
});

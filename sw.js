/* sw.js — 诗词图谱的离线缓存层（Service Worker）
 * 目的：访问过 poemgraph.html 后，把整份 HTML(含 11.6MB 内嵌音频)持久存到本地，
 *       后续访问秒开、且可完全离线；朗读不再等下载。
 * 只在 http(s) 下由页面注册；直接用 file:// 打开 HTML 时不启用，App 仍是自包含单文件。
 * 策略：对 poemgraph.html 用「缓存秒开 + 后台校验 + 自动刷新」——有缓存时立即返回，
 *       同时用 ETag/Last-Modified 向服务器条件请求；未变 304 极小，变了才下载新版并刷新页面。
 *       install 阶段不主动预缓存 12.9MB HTML，避免手机首访刚打开又后台重复下载。
 *       带查询串(?v=…)的请求一律放行走网络，方便开发期取最新代码、不被缓存挡住。
 *
 * 2026-07-11 扩 v5：新增 /accounts.json 走 stale-while-revalidate——有缓存 0ms 返回 + 后台异步更新。
 *       大陆访问 Render 美国节点 100-200ms 让冷启动 boot() 校验拖慢首屏；SWR 让登录态立即可用，
 *       撤销账号延迟 ≤2-3s 内下次访问即可生效；离线也用旧缓存保留登录态。
 */
const CACHE = 'poemgraph-cache-v8';
const ACC_CACHE = 'pg-acc-cache-v1';
const CORE = './poemgraph.html';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    var keys = await caches.keys();
    var oldKeys = keys.filter(function(k){ return k !== CACHE; });
    var hadOldPoemCache = oldKeys.some(function(k){ return /^poemgraph-cache-/.test(k); });
    await Promise.all(oldKeys.map(function(k){ return caches.delete(k); }));
    await self.clients.claim();
    if(hadOldPoemCache){
      var cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      cs.forEach(function(c){
        try{
          var u = new URL(c.url);
          if(u.origin === self.location.origin && /poemgraph\.html$/.test(u.pathname)) c.navigate(c.url);
        }catch(err){}
      });
    }
  })());
});

async function revalidateAndRefresh(cache, cached){
  try{
    var headers = {};
    var et = cached.headers.get('ETag');
    var lm = cached.headers.get('Last-Modified');
    if(et) headers['If-None-Match'] = et;
    if(lm) headers['If-Modified-Since'] = lm;
    // no-store：绕过 HTTP 缓存，自己用 Cache 里存的 ETag/Last-Modified 做条件请求。
    var res = await fetch(CORE, { headers: headers, cache: 'no-store' });
    if(res && res.status === 304) return;
    if(res && res.status === 200 && res.ok){
      var newEt = res.headers.get('ETag');
      var newLm = res.headers.get('Last-Modified');
      var changed = (et && newEt && et !== newEt) || (lm && newLm && lm !== newLm);
      if(!et && !lm && !newEt && !newLm){
        try{ changed = (await cached.clone().text()) !== (await res.clone().text()); }catch(err){ changed = false; }
      }
      await cache.put(CORE, res.clone());
      if(changed){
        var cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        cs.forEach(function(c){
          try{
            var u = new URL(c.url);
            if(u.origin === self.location.origin && /poemgraph\.html$/.test(u.pathname)) c.navigate(c.url);
          }catch(err){}
        });
      }
      return res;
    }
  }catch(err){ /* 离线：保持缓存 */ }
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  /* ── accounts.json 走 stale-while-revalidate ──
   * 只对同源（同 SW scope）的 accounts.json 生效；跨源走原有逻辑不入缓存。
   * 有缓存立即 0ms 返回 + 后台 fetch 更新；无缓存（首次）走网络。
   * 网络失败（离线）→ 返回旧缓存（如果有），没有就返回空 accounts 503，让 page 端保留登录态。
   */
  if(url.origin === self.location.origin && /\/accounts\.json$/.test(url.pathname)){
    e.respondWith((async function(){
      var cache = await caches.open(ACC_CACHE);
      var cached = await cache.match(req);
      var networkFetch = (async function(){
        try{
          var res = await fetch(req, { cache: 'no-store' });
          if(res && res.ok) await cache.put(req, res.clone());
          else if(res && res.status === 404) await cache.delete(req);   // 服务端没了就别再喂旧
        }catch(_){ /* 离线：保留旧缓存，不动 */ }
      })();
      if(cached){
        e.waitUntil(networkFetch);   // 后台更新；不阻塞返回 cached
        return cached;                // 0ms 返回旧数据
      }
      /* 首次访问：无缓存，必须等网络 */
      await networkFetch;
      var fresh = await cache.match(req);
      return fresh || new Response('{"accounts":[]}', {
        status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    })());
    return;
  }

  /* ── poemgraph.html 原有接管逻辑（保持不变） ── */
  if(url.origin !== self.location.origin) return;
  if(url.search) return;                          // 带 ?v=… 的开发/调试请求：放行走网络，不缓存
  if(!/poemgraph\.html$/.test(url.pathname) && req.mode !== 'navigate') return;
  if(req.mode === 'navigate' && !/poemgraph\.html$/.test(url.pathname)) return; // 只接管 poemgraph.html

  e.respondWith((async function(){
    var cache = await caches.open(CACHE);
    var cached = await cache.match(CORE);
    if(cached){
      e.waitUntil(revalidateAndRefresh(cache, cached));
      return cached;
    }
    try{                                          // 首访：无缓存，走网络并存入
      var res = await fetch(req);
      if(res && res.ok) await cache.put(CORE, res.clone());
      return res;
    }catch(err){
      return new Response('离线且无缓存', { status: 503 });
    }
  })());
});

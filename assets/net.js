/* Ati Oyun — online oda altyapısı.
   Odayı açan cihaz "ev sahibi"dir: oyunun gerçek durumu onda tutulur, diğerleri hamlelerini ona yollar,
   o da herkese güncel görünümü gönderir. Bağlantı PeerJS (WebRTC) ile cihazdan cihaza kurulur. */
const Ati = (() => {
  const PFX = 'atioyun-v1-';
  const store = {
    get(k) { try { return localStorage.getItem(k) } catch (e) { return null } },
    set(k, v) { try { localStorage.setItem(k, v) } catch (e) {} }
  };
  /* Sekme başına kimlik: aynı tarayıcıda iki sekme iki ayrı oyuncu olur, sayfa yenilenince aynı kalır. */
  function myId() {
    let id = null;
    try { id = sessionStorage.getItem('ati_pid') } catch (e) {}
    if (!id) { id = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('ati_pid', id) } catch (e) {} }
    return id;
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function newCode() {
    const a = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
    return Array.from({ length: 4 }, () => a[Math.floor(Math.random() * a.length)]).join('');
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Kopyalandı') }
    catch (e) { window.prompt('Kopyala:', text) }
  }

  /* opts: {game, title, el, logic:{create,join,leave,act,view}, render(view, ctx)} */
  function start(opts) {
    const el = opts.el, me = myId();
    let mode = null, peer = null, conns = new Map(), state = null, code = null, sendAct = null, queue = Promise.resolve();

    function lobby(err) {
      const saved = store.get('ati_name') || '';
      const hashCode = (location.hash || '').replace('#', '').toUpperCase().slice(0, 4);
      el.innerHTML = `<section class="panel">
        <div class="field"><label class="label" for="nm">Adın</label>
          <input id="nm" maxlength="16" value="${esc(saved)}" placeholder="Adını yaz"></div>
        <div class="grid2">
          <div class="panel" style="padding:16px">
            <h3>Oda aç</h3><p class="muted">Kod oluşur, arkadaşlarına gönderirsin.</p>
            <button class="btn" id="host">Yeni oda aç</button></div>
          <div class="panel" style="padding:16px">
            <h3>Odaya katıl</h3><p class="muted">Arkadaşının verdiği 4 haneli kodu yaz.</p>
            <div class="row"><input id="code" class="code" maxlength="4" value="${esc(hashCode)}" placeholder="KOD" aria-label="Oda kodu">
            <button class="btn" id="join">Katıl</button></div></div>
        </div>
        ${err ? `<p class="err">${esc(err)}</p>` : ''}
      </section>`;
      const nm = el.querySelector('#nm');
      const getName = () => { const n = nm.value.trim(); if (!n) { nm.focus(); return null } store.set('ati_name', n); return n };
      el.querySelector('#host').onclick = () => { const n = getName(); if (n) host(n) };
      el.querySelector('#join').onclick = () => {
        const n = getName(); const c = el.querySelector('#code').value.trim().toUpperCase();
        if (!n) return; if (c.length !== 4) { el.querySelector('#code').focus(); return }
        join(n, c);
      };
    }
    function waiting(msg) { el.innerHTML = `<section class="panel"><p class="muted">${esc(msg)}</p></section>` }

    function ctx() {
      return {
        me, isHost: mode === 'host', code, esc, copy, toast,
        link: location.origin + location.pathname + '#' + code,
        act: a => mode === 'host' ? hostAct(me, a) : sendAct && sendAct(a)
      };
    }
    function draw(view) { opts.render(view, ctx()) }

    /* ---------- ev sahibi ---------- */
    function broadcast() {
      draw(opts.logic.view(state, me));
      for (const [pid, c] of conns) if (c.open) c.send({ t: 'state', s: opts.logic.view(state, pid) });
    }
    function hostAct(pid, a) {
      queue = queue.then(async () => {
        try { state = await opts.logic.act(state, pid, a) } catch (e) { console.error(e) }
        broadcast();
      });
    }
    function host(name, tries = 0) {
      waiting('Oda açılıyor...');
      code = newCode();
      peer = new Peer(PFX + opts.game + '-' + code, { debug: 0 });
      peer.on('open', () => {
        mode = 'host';
        state = opts.logic.create(me, name);
        location.hash = code;
        broadcast();
      });
      peer.on('error', e => {
        if (e.type === 'unavailable-id' && tries < 5) { peer.destroy(); host(name, tries + 1); return }
        if (mode !== 'host') lobby('Oda açılamadı (' + e.type + '). İnternet bağlantını kontrol edip tekrar dene.');
        else console.warn(e);
      });
      peer.on('disconnected', () => { try { peer.reconnect() } catch (e) {} });
      peer.on('connection', conn => {
        conn.on('data', m => {
          if (!m || typeof m !== 'object') return;
          if (m.t === 'hello' && typeof m.pid === 'string') {
            conn._pid = m.pid.slice(0, 20);
            conns.set(conn._pid, conn);
            hostAct(conn._pid, { __join: String(m.name || 'Oyuncu').slice(0, 16) });
          } else if (m.t === 'act' && conn._pid) hostAct(conn._pid, m.a);
        });
        conn.on('close', () => {
          if (conn._pid && conns.get(conn._pid) === conn) { conns.delete(conn._pid); hostAct(conn._pid, { __leave: true }) }
        });
      });
    }

    /* ---------- katılan ---------- */
    function join(name, c) {
      waiting('Odaya bağlanılıyor...');
      code = c;
      peer = new Peer({ debug: 0 });
      let opened = false;
      const fail = msg => { if (!opened) { try { peer.destroy() } catch (e) {} lobby(msg) } };
      const timer = setTimeout(() => fail('Odaya ulaşılamadı. Kod doğru mu, oda açık mı?'), 15000);
      peer.on('open', () => {
        const conn = peer.connect(PFX + opts.game + '-' + c, { reliable: true });
        conn.on('open', () => {
          opened = true; clearTimeout(timer); mode = 'client'; location.hash = c;
          sendAct = a => conn.send({ t: 'act', a });
          conn.send({ t: 'hello', pid: me, name });
        });
        conn.on('data', m => { if (m && m.t === 'state') draw(m.s) });
        conn.on('close', () => { if (opened) el.insertAdjacentHTML('afterbegin', `<section class="panel"><p class="err">Ev sahibiyle bağlantı koptu. Sayfayı yenileyip aynı kodla tekrar katıl.</p></section>`) });
      });
      peer.on('error', e => {
        clearTimeout(timer);
        if (e.type === 'peer-unavailable') fail('Bu kodla açık bir oda yok.');
        else fail('Bağlantı kurulamadı (' + e.type + ').');
      });
    }

    if (typeof Peer === 'undefined') { el.innerHTML = '<section class="panel"><p class="err">Bağlantı kütüphanesi yüklenemedi. İnternetini kontrol edip sayfayı yenile.</p></section>'; return }
    lobby();
  }

  /* Ortak oyuncu yönetimi: her oyunun logic'i bunu kullanır. */
  function handleMeta(s, pid, a, onJoinNew, max) {
    if (a && a.__join) {
      const p = s.players.find(p => p.id === pid);
      if (p) { p.online = true; p.name = a.__join }
      else if (s.phase === 'lobby' && !(max && s.players.length >= max)) { s.players.push({ id: pid, name: a.__join, online: true, score: 0 }); onJoinNew && onJoinNew(pid) }
      else s.watchers = (s.watchers || []).concat([{ id: pid, name: a.__join }]);
      return true;
    }
    if (a && a.__leave) {
      const p = s.players.find(p => p.id === pid); if (p) p.online = false;
      return true;
    }
    return false;
  }

  function playersHtml(view, ctx) {
    return view.players.map(p => `<span class="pill"><span class="dot ${p.online ? '' : 'off'}"></span>${ctx.esc(p.name)}${p.id === ctx.me ? ' (sen)' : ''}${p.id === view.hostId ? ' · ev sahibi' : ''}</span>`).join('');
  }
  function shareHtml(ctx) {
    return `<div class="row"><span class="label">Oda kodu</span><span class="codebig">${ctx.esc(ctx.code)}</span>
      <button class="btn ghost small" data-copy="link">Davet linkini kopyala</button></div>`;
  }
  function wireShare(el, ctx) { el.querySelectorAll('[data-copy="link"]').forEach(b => b.onclick = () => ctx.copy(ctx.link)) }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }

  return { start, handleMeta, playersHtml, shareHtml, wireShare, shuffle, esc };
})();

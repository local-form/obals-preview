// Obal's Inn · "Neon on Broad" · 2026-11-08
const q = (s, r = document) => r.querySelector(s), qa = (s, r = document) => [...r.querySelectorAll(s)];

// ---- hours (America/New_York): Mon 5pm-2am, Tue-Sun 11am-2am. Minutes from midnight; close = next day 2am.
const OPEN = { 0: 660, 1: 1020, 2: 660, 3: 660, 4: 660, 5: 660, 6: 660 }, CLOSE = 26 * 60;
function nyNow() {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value;
  return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), min: +g('hour') * 60 + +g('minute'), sec: +g('second') };
}
// Is the bar open, and how many minutes until 2am close (or until it opens)?
function barState(n = nyNow()) {
  const prev = (n.day + 6) % 7;
  if (n.min < CLOSE - 1440) return { open: true, left: CLOSE - 1440 - n.min, night: prev };      // after midnight, last night's shift
  if (n.min >= OPEN[n.day]) return { open: true, left: CLOSE - n.min, night: n.day };
  return { open: false, opensIn: OPEN[n.day] - n.min, opensAt: OPEN[n.day], night: n.day };
}
// Kitchen hours from their Instagram bio (2026-11-08). Monday isn't listed: null = "call".
const KITCHEN = { 0: [660, 1200], 1: null, 2: [660, 1320], 3: [660, 1320], 4: [660, 1320], 5: [660, 1440], 6: [660, 1440] };
function kitchenState(n = nyNow()) {
  const k = KITCHEN[n.day];
  if (!k) return { known: false };
  if (n.min >= k[0] && n.min < k[1]) return { known: true, open: true, until: k[1] };
  return { known: true, open: false, opensAt: n.min < k[0] ? k[0] : null };
}
const fmtClock = m => { m %= 1440; const h = Math.floor(m / 60), mm = m % 60; return (h % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h < 12 ? ' am' : ' pm'); };
const fmtLeft = m => { const h = Math.floor(m / 60), mm = m % 60; return h ? `${h}h ${String(mm).padStart(2, '0')}m` : `${mm} min`; };

// ---- hero: light the sign once fonts are in (so tubes never flash in the fallback face)
(function hero() {
  const hero = q('.hero'); if (!hero) return;
  const s = barState(), k = kitchenState(), txt = q('#hero-status-text');
  hero.classList.toggle('is-open', s.open);
  hero.classList.toggle('is-kitchen', s.open && k.open);
  const light = () => hero.classList.add('is-lit');
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve()).then(() => requestAnimationFrame(light));
})();

// ---- the "Are we open?" board + hero chip. Text only changes once a minute, and only while the tab is visible.
(function board() {
  const big = q('#b-big'), line = q('#b-line'), left = q('#b-left'), kit = q('#b-kitchen'), wrap = q('.board'), chip = q('#hero-status-text');
  const kTxt = k => !k.known ? 'Mondays: call' : k.open ? `open till ${fmtClock(k.until).replace('12 am', 'midnight')}` : k.opensAt ? `opens ${fmtClock(k.opensAt)}` : 'closed for tonight';
  function paint() {
    const n = nyNow(), s = barState(n), k = kitchenState(n);
    qa('.week tr[data-day]').forEach(r => r.classList.toggle('is-today', +r.dataset.day === s.night));
    if (big) {
      wrap.classList.toggle('is-open', s.open);
      big.textContent = s.open ? 'Open' : 'Closed';
      line.textContent = s.open ? 'till 2 am tonight' : `opens ${fmtClock(s.opensAt)} today`;
      left.textContent = s.open ? `in ${fmtLeft(s.left)}` : `opens in ${fmtLeft(s.opensIn)}`;
      kit.textContent = kTxt(k);
    }
    q('.hero')?.classList.toggle('is-kitchen', s.open && !!k.open);
    if (chip) chip.textContent = s.open ? `Open till 2 am (${fmtLeft(s.left)} left) · kitchen ${!k.known ? 'hours: call' : k.open ? 'till ' + fmtClock(k.until).replace('12 am', 'midnight') : 'closed'}` : `Closed now · opens ${fmtClock(s.opensAt)}`;
    return n;
  }
  let t;
  function tick() { clearTimeout(t); const n = paint(); if (!document.hidden) t = setTimeout(tick, (60 - n.sec) * 1000 + 50); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); else clearTimeout(t); });
  tick();
})();

// ---- reveal on scroll (house standard)
(() => {
  const els = qa('[data-reveal]');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-visible')); return; }
  const n = new Map();
  els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', i * .08 + 's'); n.set(p, i + 1); });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
  setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
})();

// ---- Bring the crew: builds the request as you go, sends nothing
(function crew() {
  const f = q('#crew-form'); if (!f) return;
  const g = q('#guests'), day = q('#day'), ticket = q('#crew-ticket'), hint = q('#day-hint'), err = q('#crew-err'), done = q('#crew-done');
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  day.min = today.toISOString().slice(0, 10);
  const val = name => (f.querySelector(`input[name="${name}"]:checked`) || {}).value || '';
  const clamp = v => Math.max(2, Math.min(60, Math.round(+v || 2)));
  const dayLabel = () => day.value ? new Date(day.value + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '';
  function sum() {
    const parts = [`Party of ${clamp(g.value)}`, dayLabel() || 'pick a night', val('time'), val('occasion')].filter(Boolean);
    ticket.textContent = parts.join(' · ');
    const isMon = day.value && new Date(day.value + 'T12:00').getDay() === 1;
    hint.hidden = !(isMon && val('time') === 'afternoon');
    hint.textContent = 'Heads up: on Mondays Obal’s opens at 5 pm.';
    return parts;
  }
  qa('[data-step]', f).forEach(b => b.addEventListener('click', () => { g.value = clamp(+g.value + +b.dataset.step); sum(); }));
  g.addEventListener('change', () => { g.value = clamp(g.value); sum(); });
  f.addEventListener('input', sum); f.addEventListener('change', sum);
  f.addEventListener('submit', e => {
    e.preventDefault();
    const name = f.elements.name.value.trim(), phone = f.elements.phone.value.trim();
    const miss = [!day.value && 'a night', !name && 'your name', !phone && 'a phone number'].filter(Boolean);
    if (miss.length) { err.textContent = 'Add ' + miss.join(', ') + '.'; err.hidden = false; return; }
    err.hidden = true;
    const b = document.createElement('b'), p = document.createElement('span'), c = document.createElement('a');
    b.textContent = `${sum().join(' · ')}, for ${name}.`;
    p.textContent = 'Preview only: nothing was sent. On the real site this goes to Obal’s, and they call you to confirm the table. To lock it in now, call ';
    c.href = 'tel:+19734291943'; c.textContent = '(973) 429-1943'; p.append(c, '.');
    done.replaceChildren(b, p); done.hidden = false; done.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  sum();
})();

// ---- header turns solid after the hero
(function header() {
  const top = q('.top'), hero = q('.hero'); if (!top || !hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => top.classList.toggle('is-solid', !e.isIntersecting), { rootMargin: '-72px 0px 0px 0px' }).observe(hero);
})();

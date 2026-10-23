const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const toggle=q('.menu-toggle'),mobileNav=q('#mobile-nav');
function setInert(v){qa('main,.site-footer,.mobile-actions').forEach(el=>el.inert=v);}
function closeNav(){if(!toggle)return;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');mobileNav.hidden=true;document.documentElement.classList.remove('nav-open');setInert(false);}
if(toggle){toggle.addEventListener('click',()=>{const o=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!o));toggle.setAttribute('aria-label',o?'Open navigation':'Close navigation');mobileNav.hidden=o;document.documentElement.classList.toggle('nav-open',!o);setInert(!o);});
  qa('a',mobileNav).forEach(a=>a.addEventListener('click',closeNav));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeNav();toggle.focus();}});
  matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)closeNav();});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header')&&!mobileNav.hidden)closeNav();});}
qa('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
if('IntersectionObserver'in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');obs.unobserve(e.target);}}),{threshold:.1});
  qa('.tile,.review-grid figure,.event-list div,.drinks-photos figure,.stats div,[data-reveal]').forEach(el=>{el.classList.add('reveal');obs.observe(el);});}
// open/closed status (America/New_York). Mon 5pm-2am, Tue-Sun 11am-2am
(function(){
  const open={0:660,1:1020,2:660,3:660,4:660,5:660,6:660},END=26*60;
  const fmt=m=>{m=m%1440;const h=Math.floor(m/60),mm=m%60;return(h%12||12)+(mm?':'+String(mm).padStart(2,'0'):'')+(h<12?' am':' pm');};
  const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()),g=t=>p.find(x=>x.type===t).value;
  const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday')),now=+g('hour')*60+ +g('minute');
  const st=q('#open-status'),txt=q('#open-text');
  qa('[data-hours] [data-days],.event-list [data-days]').forEach(r=>{if(+r.dataset.days===day)r.classList.add('is-today');});
  if(!st)return;
  const prevDay=(day+6)%7;
  if(now<END-1440){st.classList.add('is-open');txt.textContent='Open now · until 2 am';return;}
  if(now>=open[day]){st.classList.add('is-open');txt.textContent='Open now · until 2 am';return;}
  st.classList.add('is-closed');txt.textContent='Closed now · opens '+fmt(open[day])+' today';
})();
(function(){const bar=q('.mobile-actions'),cta=q('.hero .action-row');if(!bar||!cta)return;document.documentElement.classList.add('has-bar');
  if('IntersectionObserver'in window){new IntersectionObserver(([e])=>bar.classList.toggle('is-shown',!e.isIntersecting&&e.boundingClientRect.top<0),{threshold:0}).observe(cta);}else bar.classList.add('is-shown');})();

// reveal-failsafe: never leave content hidden if the scroll observer doesn't fire
setTimeout(()=>document.querySelectorAll('.reveal:not(.is-visible)').forEach(el=>{const r=el.getBoundingClientRect();if(r.top<innerHeight*1.5)el.classList.add('is-visible');}),1500);
addEventListener('scroll',()=>document.querySelectorAll('.reveal:not(.is-visible)').forEach(el=>{if(el.getBoundingClientRect().top<innerHeight)el.classList.add('is-visible');}),{passive:true});

// stagger siblings by .08s (standard)
(()=>{const n=new Map();document.querySelectorAll('.reveal').forEach(e=>{const p=e.parentElement,i=n.get(p)||0;e.style.setProperty('--d',i*.08+'s');n.set(p,i+1);});})(); /* h2[data-reveal] */

// Local Form request form (shared across previews): reads the request back and sends nothing.
document.querySelectorAll('form[data-lf-request]').forEach(form => {
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  form.querySelectorAll('input[type=date]').forEach(d => d.min = today.toISOString().slice(0, 10));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const parts = [...form.querySelectorAll('[data-sum]')].map(el => {
      if (el.type === 'radio') return el.checked ? el.value : '';
      let v = el.value.trim(); if (!v) return '';
      if (el.type === 'date') v = new Date(v + 'T00:00').toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});
      return el.dataset.sum.replace('%', v);
    }).filter(Boolean);
    const name = (form.elements.name?.value || '').trim(), done = form.querySelector('.lf-done'), b = document.createElement('b'), p = document.createElement('span');
    b.textContent = `Your request: ${parts.join(' · ')}${name ? ` (for ${name})` : ''}`;
    p.textContent = form.dataset.lfConfirm;
    done.replaceChildren(b, p); done.hidden = false; done.scrollIntoView({block: 'nearest', behavior: 'smooth'});
  });
});

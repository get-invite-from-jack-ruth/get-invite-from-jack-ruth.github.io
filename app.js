(() => {
'use strict';
const c=window.INVITATION, app=document.getElementById('invitation-app'), $=id=>document.getElementById(id);
const create=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const icon=cls=>{const i=create('i',undefined,cls);i.setAttribute('aria-hidden','true');return i;};
const reduced=false;
const key=c.storageKey+'-review';
const read=(name,fallback)=>{try{return JSON.parse(localStorage.getItem(key+name))??fallback;}catch{return fallback;}};
const write=(name,value)=>{try{localStorage.setItem(key+name,JSON.stringify(value));return true;}catch{return false;}};
app.dataset.motionMode='on';
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,2500);}
app.dataset.theme='romantic';
document.querySelector('meta[name="theme-color"]').content='#fff8f0';
// A small, fixed number of background hearts; CSS handles the slow movement.
function softHearts(host,count) {
 const layer=create('div',undefined,'ambient-hearts');layer.setAttribute('aria-hidden','true');
 for(let i=0;i<count;i++) {
  const heart=icon('fa-regular fa-heart ambient-heart');
  const random=(min,max)=>min+Math.random()*(max-min);
  heart.style.left=(i%2?random(72,88):random(8,24))+'%';
  heart.style.top=(14+i*(66/count)+random(-4,4))+'%';
  for(const [name,value] of Object.entries({'--heart-size':random(44,64)+'px','--drift-x':random(-18,18)+'px','--drift-y':random(-26,26)+'px','--drift-x2':random(-14,14)+'px','--drift-y2':random(-22,22)+'px','--drift-turn':random(-8,8)+'deg','--drift-time':random(20,30)+'s','--drift-delay':-random(0,30)+'s'}))heart.style.setProperty(name,value);
  layer.append(heart);
 }
 host.prepend(layer);
}
softHearts(document.querySelector('.invitation-column'),4);
softHearts($('welcome'),3);
const guest=new URLSearchParams(location.search).get('to')?.trim().slice(0,120)||c.defaultGuest;
document.title=`Undangan Pernikahan ${c.couple}`;
document.querySelectorAll('[data-couple]').forEach(e=>e.textContent=c.couple);
document.querySelectorAll('[data-monogram]').forEach(e=>e.textContent=c.groom.short.charAt(0)+' & '+c.bride.short.charAt(0));
document.querySelectorAll('[data-date]').forEach(e=>e.textContent=c.dateLabel);
document.querySelectorAll('[data-cover]').forEach(e=>e.src=c.cover);
document.querySelectorAll('[data-background]').forEach(e=>e.src=c.background);
app.style.setProperty('--couple-background',`url("${c.background}")`);
$('guest-name').textContent=guest;$('wish-name').value=guest===c.defaultGuest?'':guest;
for(const [id,value] of Object.entries({'intro-line':c.introLine,'greeting':c.greeting,'event-intro':c.eventIntro,'quote-title':c.quoteTitle,'gift-heading':c.giftTitle,'gift-intro':c.giftIntro,'closing-text':c.closingText,'venue-address':c.events[0].address}))$(id).textContent=value;
for(const who of ['groom','bride']){const d=c[who];$(who+'-photo').src=d.photo;$(who+'-photo').style.objectPosition=d.position;for(const field of ['name','order','father','mother'])$(who+'-'+field).textContent=d[field]||'';}
$('story-video').poster=c.cover;
const lazyMedia=[];
function whenNearby(element,load){lazyMedia.push({element,load});}
function motion(n,direction,duration){n.dataset.motion=direction;n.style.setProperty('--motion-duration',duration+'ms');return n;}
document.querySelectorAll('[data-duration]').forEach(e=>e.style.setProperty('--motion-duration',e.dataset.duration+'ms'));
// Original separator geometry: curves authored independently as smooth cubic segments.
const wavePaths={
 rise:'M0 162 C105 128 205 90 300 110 C405 125 490 181 590 165 C690 156 775 95 870 95 C970 95 1080 169 1170 154 C1270 140 1360 50 1440 0 L1440 320 L0 320 Z',
 fall:'M0 192 C95 166 155 144 250 150 C335 154 425 183 505 161 C600 144 659 124 735 129 C830 132 895 180 975 203 C1100 254 1175 239 1260 192 C1335 160 1390 119 1440 97 L1440 0 L0 0 Z',
 valley:'M0 96 C155 153 220 183 385 190 C535 203 565 125 710 154 C850 182 970 260 1105 215 C1210 172 1290 109 1440 96 L1440 320 L0 320 Z',
 'fall-valley':'M0 96 C155 153 220 183 385 190 C535 203 565 125 710 154 C850 182 970 260 1105 215 C1210 172 1290 109 1440 96 L1440 0 L0 0 Z'
};
document.querySelectorAll('[data-wave]').forEach(e=>{const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 1440 320');path.setAttribute('fill','currentColor');path.setAttribute('d',wavePaths[e.dataset.wave]);svg.append(path);const gold=document.createElementNS(ns,'path');gold.setAttribute('d',wavePaths[e.dataset.wave].split(' L1440')[0]);gold.setAttribute('class','gold-wave');gold.setAttribute('aria-hidden','true');svg.append(gold);e.append(svg);});
c.quotes.forEach(q=>{const n=motion(create('div',undefined,'quote-card'),'down',2000);n.append(create('p',q.text),create('cite',q.source));$('quotes').append(n);});
c.story.forEach((s,i)=>{const item=create('article',undefined,'story-entry'),content=create('div',undefined,'story-copy');content.append(create('h3',s.title),create('p',(s.year?s.year+'. ':'')+s.text));item.append(create('span',String(i+1),'story-number'),content);$('story-list').append(item);});
$('story-list').closest('.story-container').classList.add('covered');
$('story-toggle').onclick=()=>{const curtain=$('story-curtain');curtain.style.opacity='0';curtain.style.pointerEvents='none';$('story-list').closest('.story-container').classList.remove('covered');setTimeout(()=>curtain.hidden=true,c.motion.fade);};
c.events.forEach((e,i)=>{const n=motion(create('div',undefined,'event-card'),i%2?'left':'right',1500);n.append(create('h2',e.name,'script'),create('p',e.dateLabel),create('p',`Pukul ${e.time}`),create('p',e.venue),create('p',e.address));$('events').append(n);});
$('map-link').href=c.events[0].map;
const photoPanel=create('div',undefined,'photo-load-panel'),photoLabel=create('p'),photoRetry=create('button','Coba Lagi','button outline small');
photoPanel.setAttribute('role','status');photoRetry.type='button';photoPanel.append(photoLabel,photoRetry);$('photo-dialog').append(photoPanel);
let modalPhotoUrl='',modalBusy=false;
async function loadFullPhoto(){
 if(modalBusy)return;modalBusy=true;let hadFailure=!photoRetry.hidden;
 try{await window.loadInvitationImage($('full-photo'),modalPhotoUrl,{onState(state){
  const ready=state==='ready';if(state==='failed')hadFailure=true;
  $('full-photo').hidden=!ready;photoPanel.hidden=ready;photoRetry.hidden=ready||!hadFailure;
  photoRetry.disabled=state==='loading';photoRetry.textContent=state==='loading'?'Memuat…':'Coba Lagi';
  photoLabel.textContent=state==='failed'?'Foto belum berhasil dimuat.':'Memuat foto…';
 }});}catch{}finally{modalBusy=false;}
}
photoRetry.onclick=loadFullPhoto;
const fullPhoto=url=>{
 if(modalBusy)return;modalPhotoUrl=url;photoRetry.hidden=true;
 $('photo-open').href=url;$('photo-download').href=url;$('photo-dialog').showModal();loadFullPhoto();
};
document.querySelectorAll('[data-show-cover]').forEach(b=>b.onclick=()=>fullPhoto(c.coverFull||c.cover));
document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>fullPhoto(c[b.dataset.person].photo));
$('close-photo').onclick=()=>$('photo-dialog').close();$('photo-dialog').onclick=e=>{if(e.target===$('photo-dialog'))$('photo-dialog').close();};
const carouselControllers=[];

let initialPhotosReady=false;
function carousel(container,images,group){
 const track=container.querySelector('.carousel-track'),dots=container.querySelector('.carousel-dots');
 let index=0,timer=null,paused=false,canRun=false;const dotButtons=[],slides=[];let near=false;
 function loadNearbySlides(){if(!near)return;slides[index]?.load();slides[(index+1)%images.length]?.load();}
 function sync(){loadNearbySlides();track.style.transform=`translateX(${-index*100}%)`;dotButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
 function move(delta){index=(index+delta+images.length)%images.length;sync();}
 function reset(){clearInterval(timer);if(canRun&&!paused&&!reduced&&images.length>1)timer=setInterval(()=>{
  // Never leave a loading/error panel or advance automatically to an unready photo.
  loadNearbySlides();if(slides[index].state==='ready'&&slides[(index+1)%images.length].state==='ready')move(1);
 },c.motion.galleryInterval);}
 images.forEach((url,i)=>{
  const item=create('div',undefined,'carousel-item'),b=create('button'),image=create('img');
  const panel=create('div',undefined,'gallery-load-panel'),label=create('p','Memuat foto…'),retry=create('button','Coba Lagi','button outline small');
  const slide={state:'idle',busy:false,hadFailure:false};slides.push(slide);panel.setAttribute('role','status');retry.type='button';retry.hidden=true;
  retry.setAttribute('aria-label',`Coba lagi foto ${group+1}.${i+1}`);panel.append(label,retry);
  b.type='button';b.hidden=true;b.setAttribute('aria-label',`Perbesar foto ${group+1}.${i+1}`);
  image.alt=`Foto Jack dan Ruth ${group+1}.${i+1}`;image.style.objectPosition='50% 50%';b.append(image);
  b.onclick=()=>fullPhoto(image.currentSrc||image.src);item.append(b,panel);track.append(item);
  async function load(){
   if(slide.busy||slide.state==='ready')return;slide.busy=true;
   try{await window.loadInvitationImage(image,url,{onState(state){
    slide.state=state;const ready=state==='ready';b.hidden=!ready;panel.hidden=ready;
    if(state==='failed')slide.hadFailure=true;
    retry.hidden=ready||!slide.hadFailure;retry.disabled=state==='loading';retry.textContent=state==='loading'?'Memuat…':'Coba Lagi';
    label.textContent=state==='failed'?'Foto belum berhasil dimuat.':'Memuat foto…';
    item.setAttribute('aria-busy',String(state==='loading'));
   }});}catch{}finally{slide.busy=false;reset();}
  }
  retry.onclick=load;slide.load=()=>{if(slide.state==='idle')load();};
  const dot=create('button');dot.type='button';dot.setAttribute('aria-label',`Slide ${i+1}`);dot.onclick=()=>{index=i;sync();reset();};dotButtons.push(dot);dots.append(dot);
 });
 container.querySelector('.carousel-prev').onclick=()=>{move(-1);reset();};container.querySelector('.carousel-next').onclick=()=>{move(1);reset();};
 container.addEventListener('mouseenter',()=>{paused=true;reset();});container.addEventListener('mouseleave',()=>{paused=false;reset();});container.addEventListener('focusin',()=>{paused=true;reset();});container.addEventListener('focusout',()=>{paused=false;reset();});
 let touchX=0;container.addEventListener('touchstart',e=>touchX=e.changedTouches[0].clientX,{passive:true});container.addEventListener('touchend',e=>{const diff=e.changedTouches[0].clientX-touchX;if(Math.abs(diff)>40){move(diff>0?-1:1);reset();}},{passive:true});
 whenNearby(container,()=>{near=true;loadNearbySlides();});
 sync();return {start(){canRun=true;reset();},pause(){canRun=false;clearInterval(timer);}};
}
c.galleryGroups.forEach((images,i)=>carouselControllers.push(carousel($(i?'carousel-two':'carousel-one'),images,i)));
// Fetch video metadata only near its section; its body streams when played.
const videoPanel=create('div',undefined,'video-load-panel'),videoLabel=create('p'),videoRetry=create('button','Coba Lagi','button outline small');
videoPanel.hidden=true;videoPanel.setAttribute('role','status');videoRetry.type='button';videoRetry.hidden=true;
videoPanel.append(videoLabel,videoRetry);$('story-video').after(videoPanel);let videoHadFailure=false;
const videoLoader=window.createInvitationVideoLoader($('story-video'),c.video,{onState(state){
 const ready=state==='ready';if(state==='failed')videoHadFailure=true;
 videoPanel.hidden=ready;$('story-video').hidden=state==='failed'||(videoHadFailure&&!ready);
 videoLabel.textContent=state==='failed'?'Video belum berhasil dimuat.':'Memuat video…';
 videoRetry.hidden=ready||!videoHadFailure;videoRetry.disabled=state==='loading';videoRetry.textContent=state==='loading'?'Memuat…':'Coba Lagi';
}});
videoRetry.onclick=()=>videoLoader.retry();whenNearby($('story-video'),()=>videoLoader.prepare());
function startLazyMedia(){
 if(startLazyMedia.started)return;startLazyMedia.started=true;
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const task=lazyMedia.find(t=>t.element===entry.target);task?.load();observer.unobserve(entry.target);}},{rootMargin:'600px 0px'});
  lazyMedia.forEach(task=>observer.observe(task.element));
 }else{lazyMedia.forEach(task=>task.load());}
}
// Bank details are visible immediately; copy controls remain available.
function giftCard(title,holder,cls){const card=motion(create('article',undefined,'gift-card'),'up',2500),head=create('div',undefined,'gift-title');head.append(icon(cls),create('p',title));const row=create('div',undefined,'gift-summary'),owner=create('p');owner.append(icon('fa-regular fa-user'),document.createTextNode(' '+holder));row.append(owner);const details=create('div',undefined,'gift-details');card.append(head,row,details);$('gift-list').append(card);return details;}
async function copyText(text,b){try{await navigator.clipboard.writeText(text);toast('Berhasil disalin');}catch{toast('Salin manual: '+text);}}
function accountLine(number){const row=create('div',undefined,'gift-account'),p=create('p');p.append(icon('fa-solid fa-credit-card'),document.createTextNode(' '+number));const b=create('button',undefined,'button outline small copy-button');b.type='button';b.setAttribute('aria-label','Salin '+number);b.append(icon('fa-solid fa-copy'));b.onclick=()=>copyText(number,b);row.append(p,b);return row;}
const transfer=giftCard('Transfer',c.couple,'fa-solid fa-money-bill-transfer');c.gifts.forEach((g,i)=>{if(i){const hr=create('hr');transfer.append(hr);}transfer.append(create('p',g.bank+' · '+g.holder),accountLine(g.number));});
if(!c.gifts.length)transfer.append(create('p','Informasi rekening akan ditambahkan.'));
function countdown(){let seconds=Math.max(0,Math.floor((new Date(c.date).getTime()-Date.now())/1000));for(const [id,unit] of [['days',86400],['hours',3600],['minutes',60],['seconds',1]]){$(id).textContent=String(Math.floor(seconds/unit)).padStart(2,'0');seconds%=unit;}}countdown();setInterval(countdown,1000);
$('calendar').onclick=()=>{const date=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),start=new Date(c.date),end=new Date(start.getTime()+3*3600000),params=new URLSearchParams({action:'TEMPLATE',text:'Pernikahan '+c.couple,dates:date(start)+'/'+date(end),details:c.greeting,location:c.events[0].address});window.open('https://calendar.google.com/calendar/render?'+params.toString(),'_blank','noopener,noreferrer');};
window.initInvitationWishes({c,create,$,icon});
const soundtrack=window.createInvitationSoundtrack(c);
// Crossfade desktop photos every 6 s; each slide zooms over 10 s.
const desktopFrames=c.desktopImages.map((src,i)=>{const layer=create('div',undefined,'desktop-slide'),image=create('img');image.src=src;image.alt='Latar Jack dan Ruth';image.style.objectPosition=['50% 50%','30% 45%','70% 45%'][i%3];layer.append(image);$('desktop-slides').append(layer);return layer;});let desktopIndex=0,desktopTimer=null;
function startDesktop(){clearInterval(desktopTimer);if(window.innerWidth<576)return;desktopFrames.forEach((f,i)=>f.classList.toggle('is-active',i===desktopIndex));if(!reduced)desktopTimer=setInterval(()=>{desktopFrames[desktopIndex].classList.remove('is-active');desktopIndex=(desktopIndex+1)%desktopFrames.length;desktopFrames[desktopIndex].classList.add('is-active');},c.motion.desktopInterval);}
let opened=false;window.addEventListener('resize',()=>{if(opened)startDesktop();});
// Scroll animation follows observed direction and duration, and repeats on re-entry.
const animatedNodes=Array.from(document.querySelectorAll('[data-motion]'));let scrollQueued=false;
function updateMotion(){scrollQueued=false;if(!opened)return;const height=innerHeight;for(const n of animatedNodes){const r=n.getBoundingClientRect();n.classList.toggle('motion-visible',reduced||r.top<height-80);}
 const links=Array.from(document.querySelectorAll('.bottom-nav a'));let current=links[0];for(const a of links){const r=document.querySelector(a.hash).getBoundingClientRect();if(r.top<height*.25)current=a;}links.forEach(a=>a.classList.toggle('active',a===current));
 const surfaces=Array.from(document.querySelectorAll('main>section'));const top=surfaces.find(s=>{const r=s.getBoundingClientRect();return r.top<=4&&r.bottom>4;});if(top)document.querySelector('meta[name="theme-color"]').content=top.classList.contains('base')?'#fff8f0':'#f8e7e3';}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateMotion);}},{passive:true});
document.querySelectorAll('.bottom-nav a,.scroll-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const section=document.querySelector(a.hash);section.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}));
$('open-invitation').onclick=()=>{if(opened||!initialPhotosReady)return;opened=true;$('open-invitation').disabled=true;$('invitation-layout').hidden=false;document.body.style.overflowY='';window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>{app.classList.add('opened');$('welcome').classList.add('leaving');requestAnimationFrame(updateMotion);});setTimeout(()=>{$('welcome').hidden=true;},c.motion.fade);requestAnimationFrame(()=>{startDesktop();carouselControllers.forEach(x=>x.start());startLazyMedia();updateMotion();});soundtrack.start();};
// The opening gate waits for every non-gallery photo, including hidden profiles.
document.body.style.overflowY='hidden';$('open-invitation').disabled=true;
const initialImages=Array.from(document.querySelectorAll('#welcome img,.desktop-slide img,#home img,#groom-photo,#bride-photo'));
const initialStates=initialImages.map(()=>({ready:false,busy:false}));
function openingProgress(){
 const count=initialStates.filter(s=>s.ready).length,percent=Math.round(count/initialStates.length*100);
 $('load-meter').style.width=percent+'%';
 $('load-label').textContent='';
 if(count===initialStates.length&&!initialPhotosReady){
  initialPhotosReady=true;$('retry-opening').hidden=true;$('load-label').textContent='';$('open-invitation').disabled=false;
  setTimeout(()=>{$('opening-loader').style.opacity='0';setTimeout(()=>$('opening-loader').hidden=true,c.motion.fade);},200);

 }
}
async function loadOpeningPhotos(){
 $('retry-opening').hidden=true;
 await Promise.all(initialImages.map(async(image,i)=>{
  const state=initialStates[i];if(state.ready||state.busy)return;state.busy=true;
  const url=image.dataset.originalSrc||(image.dataset.originalSrc=image.getAttribute('src'));
  try{
   const src=await window.loadInvitationImage(image,url);state.ready=true;
   if(url===c.background)app.style.setProperty('--couple-background',`url("${src}")`);
   openingProgress();
  }catch{}finally{state.busy=false;}
 }));
 if(!initialPhotosReady){$('load-label').textContent='';$('retry-opening').hidden=false;}
}
$('retry-opening').onclick=loadOpeningPhotos;loadOpeningPhotos();
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(desktopTimer);carouselControllers.forEach(x=>x.pause());}else if(opened){startDesktop();carouselControllers.forEach(x=>x.start());}});
})();

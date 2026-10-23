/* Shared wishes: no guest message is published before administrator approval. */
(() => {
'use strict';
window.initInvitationWishes=({c,create,$,icon})=>{
 const base=c.backend.replace(/\/$/,'');let expanded=false,canReply=false,rows=[],busy=false,replyParent='',pending=null,lastSubmitted='',listBusy=false,lastRows='';
 const localRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
 const localWrite=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
 const uuid=prefix=>prefix+crypto.randomUUID().replaceAll('-','');
 const submit=$('wish-form').querySelector('[type="submit"]');
 const feedback=$('status');
 const networkMessage='Belum dapat terhubung. Periksa internet lalu coba lagi; isian kamu tetap tersimpan.';
 const errors={SUBMIT_WISH_FIRST:'Kirim ucapan utama terlebih dahulu dengan nama yang sama sebelum membalas.',TOO_MANY_REQUESTS:'Terlalu banyak pengiriman. Tunggu sebentar lalu coba lagi.',PARENT_UNAVAILABLE:'Ucapan yang dibalas tidak lagi tersedia.',INVALID_INPUT:'Periksa kembali nama, presensi, dan ucapan.',REQUEST_ID_CONFLICT:'Isi pengiriman berbeda. Muat ulang halaman sebelum mencoba lagi.'};
 async function api(path,body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});
 const data=await r.json();if(!r.ok)throw Object.assign(new Error(errors[data.error]||networkMessage),{code:data.error});return data;
 }catch(error){if(!error.code)error.message=networkMessage;throw error;}finally{clearTimeout(timer);}}
 const cancelReply=create('button','Batalkan balasan','button outline small');cancelReply.type='button';cancelReply.hidden=true;$('wish-message').before(cancelReply);
 cancelReply.onclick=()=>{replyParent='';cancelReply.hidden=true;};
 const honeypot=create('input');honeypot.name='website';honeypot.tabIndex=-1;honeypot.autocomplete='off';honeypot.setAttribute('aria-hidden','true');honeypot.style.display='none';$('wish-form').append(honeypot);
 const listRetry=create('button','Coba Lagi','button outline small');listRetry.type='button';listRetry.hidden=true;$('wish-list').before(listRetry);listRetry.onclick=()=>load();
 $('demo-notice').hidden=true;
 const openedReplies=new Set();
 const more=create('button','Tampilkan ucapan lainnya','button outline small');more.type='button';more.hidden=true;
 $('wish-list').after(more);$('wish-pagination').hidden=true;
 $('wish-list').classList.add('compact-wishes');
 $('wish-list').setAttribute('tabindex','0');$('wish-list').setAttribute('aria-label','Daftar ucapan dan doa');
 const replyNotice=create('dialog',undefined,'reply-notice');
 replyNotice.setAttribute('role','alertdialog');replyNotice.setAttribute('aria-modal','true');replyNotice.setAttribute('aria-describedby','reply-notice-message');
 const replyNoticeMessage=create('p','Kirim ucapan terlebih dahulu untuk dapat membalas.');replyNoticeMessage.id='reply-notice-message';
 const replyNoticeOk=create('button','OK','button outline');replyNoticeOk.type='button';
 replyNotice.append(replyNoticeMessage,replyNoticeOk);$('wish-form').after(replyNotice);
 replyNoticeOk.onclick=()=>replyNotice.close();
 const showReplyNotice=()=>{if(!replyNotice.open)replyNotice.showModal();replyNoticeOk.focus();};
 more.onclick=()=>{expanded=!expanded;render();};
 function card(w,reply=false){
  const item=create('article',undefined,reply?'reply-box':'wish-card'),head=create('div',undefined,'wish-head');head.append(create('strong',w.name));item.append(head,create('p',w.message));
  if(!reply){
   const actions=create('div',undefined,'wish-actions');
   if(w.id.startsWith('live_')){
    const button=create('button','Reply');button.type='button';button.title='Balas ucapan ini';
    button.onclick=()=>{if(!canReply){showReplyNotice();return;}replyParent=w.id;cancelReply.textContent='Batalkan balasan untuk '+w.name;cancelReply.hidden=false;$('wish-message').focus();};actions.append(button);
   }
   const like=create('button');like.type='button';const key='jack-ruth-like-'+w.id;let liked=localRead(key,false);
   const paint=()=>{like.replaceChildren(icon(liked?'fa-solid fa-heart':'fa-regular fa-heart'),document.createTextNode(liked?' 1':' 0'));};paint();like.onclick=()=>{liked=!liked;localWrite(key,liked);paint();};actions.append(like);item.append(actions);
   const replies=rows.filter(r=>r.parentId===w.id);
   if(replies.length){const details=create('details',undefined,'wish-replies');details.open=openedReplies.has(w.id);details.append(create('summary',`Lihat balasan (${replies.length})`));replies.forEach(r=>details.append(card(r,true)));details.addEventListener('toggle',()=>{details.open?openedReplies.add(w.id):openedReplies.delete(w.id);});item.append(details);}
  }return item;
 }
 function render(){
  const roots=rows.filter(w=>!w.parentId),scrollTop=$('wish-list').scrollTop;
  $('wish-list').classList.toggle('is-expanded',expanded);$('wish-list').replaceChildren(...(expanded?roots:roots.slice(0,4)).map(w=>card(w)));$('wish-list').scrollTop=scrollTop;
  more.hidden=roots.length<=4;more.textContent=expanded?'Tampilkan lebih sedikit':'Tampilkan ucapan lainnya';more.setAttribute('aria-expanded',String(expanded));
  $('wish-pagination').hidden=true;
 }
 let eligibilityRequest=0;
 async function checkReplyEligibility(){
  const turn=++eligibilityRequest,name=$('wish-name').value.trim();
  const guestId=localRead('jack-ruth-guest-'+name.toLocaleLowerCase('id'),null);let allowed=false;
  if(name.length>=2&&guestId){try{allowed=(await api('/api/guest-status',{name,guestId})).canReply===true;}catch{}}
  if(turn!==eligibilityRequest)return;
  if(canReply!==allowed){canReply=allowed;if(!allowed){replyParent='';cancelReply.hidden=true;}render();}
 }
 $('wish-name').addEventListener('input',()=>{eligibilityRequest++;if(canReply){canReply=false;replyParent='';cancelReply.hidden=true;render();}});
 $('wish-name').addEventListener('change',checkReplyEligibility);
 async function load(){
  if(listBusy||document.hidden)return;listBusy=true;listRetry.hidden=true;
  try{
   const data=await api('/api/wishes');
   const approved=data.wishes.filter(w=>w.status==='approved').sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
   const ids=new Set(approved.map(w=>w.id));
   const next=[...approved,...c.demoWishes.filter(w=>!ids.has(w.id)).map(w=>({...w,parentId:''}))];
   const signature=JSON.stringify(next);
   if(signature!==lastRows){rows=next;lastRows=signature;render();}
   if(lastSubmitted&&approved.some(w=>w.id===lastSubmitted)){
    feedback.textContent='Ucapan kamu sudah disetujui dan tampil di undangan. Presensi sudah dicatat.';lastSubmitted='';
   }
  }catch(error){
   if(!rows.length){rows=c.demoWishes.map(w=>({...w,parentId:''}));render();}
   listRetry.hidden=false;
  }finally{listBusy=false;}
 }
 function refreshVisible(){
  if(document.hidden)return;
  const rect=$('comment').getBoundingClientRect();
  if(lastSubmitted||(rect.bottom>0&&rect.top<window.innerHeight))load();
 }
 // Poll only while the page is visible and wishes are relevant to the visitor.
 setInterval(refreshVisible,10000);
 document.addEventListener('visibilitychange',refreshVisible);
 window.addEventListener('online',refreshVisible);
 const lastAuthor=localRead('jack-ruth-last-author',null);if(lastAuthor&&!$('wish-name').value){$('wish-name').value=lastAuthor.name;$('wish-presence').value=lastAuthor.presence;}
 const draftKey='jack-ruth-unsent-v1';const saved=localRead(draftKey,null);
 if(saved?.requestId&&saved?.guestId){pending=saved;$('wish-name').value=saved.name;$('wish-message').value=saved.message;$('wish-presence').value=saved.presence;replyParent=saved.parentId||'';if(replyParent){cancelReply.hidden=false;cancelReply.textContent='Batalkan balasan';}feedback.textContent='Ada pengiriman yang belum terkonfirmasi. Klik Kirim untuk mencoba ulang.';}
 $('wish-form').onsubmit=async event=>{event.preventDefault();if(busy)return;
 const name=$('wish-name').value.trim(),message=$('wish-message').value.trim(),presence=$('wish-presence').value;
 if(replyParent&&!canReply){showReplyNotice();return;}
 if(name.length<2||!message||!['Datang','Berhalangan'].includes(presence)){feedback.textContent='Isi nama, presensi, dan ucapan terlebih dahulu.';return;}
 const guestKey='jack-ruth-guest-'+name.toLocaleLowerCase('id');let guestId=localRead(guestKey,null);if(!guestId){guestId=uuid('guest_');localWrite(guestKey,guestId);}
 const payload={name,message,presence,guestId,parentId:replyParent,website:honeypot.value};
 if(!pending||JSON.stringify({...pending,requestId:undefined})!==JSON.stringify({...payload,requestId:undefined}))pending={...payload,requestId:uuid('live_')};
 localWrite(draftKey,pending);lastSubmitted='';busy=true;submit.disabled=true;submit.textContent='Mengirim…';feedback.textContent='';
 try{const wasReply=Boolean(pending.parentId);const accepted=await api('/api/submit',pending);if(!wasReply)localWrite('jack-ruth-last-author',{name,presence});lastSubmitted=accepted.id;pending=null;localWrite(draftKey,null);$('wish-message').value='';replyParent='';cancelReply.hidden=true;feedback.textContent='Ucapan berhasil diterima dan menunggu persetujuan admin. Presensi sudah dicatat.';checkReplyEligibility();load();}
 catch(error){if(error.code==='SUBMIT_WISH_FIRST')showReplyNotice();else feedback.textContent=error.message;}
 finally{busy=false;submit.disabled=false;submit.textContent='Kirim';}};
 $('dismiss-notice').onclick=()=>{$('demo-notice').hidden=true;};$('sticker-toggle').onclick=()=>{$('sticker-picker').hidden=!$('sticker-picker').hidden;};
 ['💐','❤️','💍','🎉','🥰','🙏'].forEach(t=>{const button=create('button',t);button.type='button';button.onclick=()=>{$('wish-message').value+=t;$('sticker-picker').hidden=true;};$('sticker-picker').append(button);});
 checkReplyEligibility();load();
};
})();

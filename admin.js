(() => {
'use strict';
const $=id=>document.getElementById(id),base=window.INVITATION.backend.replace(/\/$/,''),config=window.FIREBASE_WEB;
let deleting=false,deleteTarget=null,deletePlan=null,planGeneration=0;
let session=null,data={submissions:[],rsvps:[]},refreshing=null,generation=0;
const text=(tag,value)=>{const e=document.createElement(tag);e.textContent=value;return e;};
const status=message=>{$('admin-status').textContent=message;};
async function fetchJSON(url,options={}){const response=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok)throw Object.assign(new Error(result.error?.message||result.error||'Permintaan gagal'),{status:response.status});return result;}
async function token(){if(!session)throw new Error('Silakan login.');if(Date.now()<session.until)return session.idToken;
 if(!refreshing){const old=session;refreshing=fetchJSON(`https://securetoken.googleapis.com/v1/token?key=${config.apiKey}`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:old.refreshToken})}).then(result=>{if(session!==old)throw new Error('Sesi sudah ditutup.');session={idToken:result.id_token,refreshToken:result.refresh_token,until:Date.now()+(Number(result.expires_in)-60)*1000};return session.idToken;}).finally(()=>refreshing=null);}return refreshing;}
async function api(path,body){const idToken=await token();return fetchJSON(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+idToken,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});}
function render(){const pending=data.submissions.filter(x=>x.status==='pending').length,attend=data.rsvps.filter(x=>x.attendance==='attending').length;
 $('summary').replaceChildren(...[['Menunggu',pending],['Disetujui',data.submissions.filter(x=>x.status==='approved').length],['Datang',attend],['Berhalangan',data.rsvps.filter(x=>x.attendance==='not_attending').length]].map(([label,n])=>{const box=text('div',label);box.append(text('b',n));return box;}));
 renderWishes();
 $('attendance').replaceChildren(...data.rsvps.sort((a,b)=>a.name.localeCompare(b.name,'id')).map(row=>{const tr=text('tr','');tr.append(text('td',row.name),text('td',row.attendance==='attending'?'Datang':row.attendance==='not_attending'?'Berhalangan':'Belum pasti'),text('td',row.updatedAt?new Date(row.updatedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}):''));return tr;}));}
 function wishCard(w,isReply=false,context=false){
 const box=text('article','');box.className='wish'+(isReply?' wish-reply':'');box.dataset.submissionId=w.id;
 const row=text('div','');row.className='wish-row';const copy=text('div','');copy.className='wish-copy';
 copy.append(text('strong',w.name),text('p',w.message));
 const labels={pending:'Menunggu',approved:'Disetujui',rejected:'Ditolak'};
 const meta=text('small',`${isReply?'Balasan · ':''}${labels[w.status]||w.status} · ${w.presence||''}${context?' · Ucapan induk':''}`);copy.append(meta);
 const remove=text('button','Hapus');remove.type='button';remove.className='danger delete-wish';remove.setAttribute('aria-label',`Hapus ${isReply?'balasan':'ucapan'} dari ${w.name}`);remove.onclick=()=>openDelete(w);
 row.append(copy,remove);box.append(row);
 if(w.status==='pending'){
  const actions=text('div','');actions.className='actions';
  for(const [action,label] of [['approve','Setujui'],['reject','Tolak']]){const button=text('button',label);button.type='button';button.onclick=async()=>{actions.querySelectorAll('button').forEach(b=>b.disabled=true);try{await api('/api/admin/moderate',{id:w.id,action});status('Moderasi tersimpan.');await load();}catch(error){status('Belum berhasil: '+error.message);actions.querySelectorAll('button').forEach(b=>b.disabled=false);}};actions.append(button);}
  if(w.notificationState!=='sent'){const retry=text('button','Kirim ulang notifikasi Telegram');retry.type='button';retry.onclick=async()=>{retry.disabled=true;try{await api('/api/admin/notify',{id:w.id});status('Permintaan notifikasi diproses.');await load();}catch(error){status('Notifikasi belum berhasil: '+error.message);}finally{retry.disabled=false;}};actions.append(retry);}
  box.append(actions);
 }
 return box;
 }
 function renderWishes(){
 const filter=$('filter').value,all=[...data.submissions].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
 const byId=new Map(all.map(w=>[w.id,w])),selected=all.filter(w=>filter==='all'||w.status===filter),visible=new Set(selected.map(w=>w.id));
 // Keep a reply beside its parent even when only the reply matches the status filter.
 for(const w of selected){let parent=byId.get(w.parentId);const seen=new Set();while(parent&&!seen.has(parent.id)){seen.add(parent.id);visible.add(parent.id);parent=byId.get(parent.parentId);}}
 const shown=all.filter(w=>visible.has(w.id)),emitted=new Set(),children=new Map();
 for(const w of shown){if(w.parentId){if(!children.has(w.parentId))children.set(w.parentId,[]);children.get(w.parentId).push(w);}}
 function thread(w){if(emitted.has(w.id))return null;emitted.add(w.id);const box=wishCard(w,Boolean(w.parentId),filter!=='all'&&w.status!==filter);const replies=(children.get(w.id)||[]).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));if(replies.length){const group=text('div','');group.className='admin-replies';for(const r of replies){const node=thread(r);if(node)group.append(node);}box.append(group);}return box;}
 const nodes=[];for(const w of shown.filter(w=>!w.parentId||!visible.has(w.parentId))){const node=thread(w);if(node)nodes.push(node);}for(const w of shown){const node=thread(w);if(node)nodes.push(node);}
 $('admin-wishes').replaceChildren(...nodes);
 if(!selected.length)$('admin-wishes').textContent='Belum ada ucapan pada status ini. Klik Lihat semua ucapan untuk membuka seluruh kiriman.';
 const roots=all.filter(w=>!w.parentId).length;$('wish-count').textContent=filter==='all'?`${roots} ucapan utama · ${all.length-roots} balasan`:`${selected.length} kiriman sesuai filter`;
 $('view-all-wishes').setAttribute('aria-pressed',String(filter==='all'));
 }
 $('view-all-wishes').onclick=async()=>{$('filter').value='all';renderWishes();const button=$('view-all-wishes');button.disabled=true;try{await load();status('Semua ucapan dan balasan ditampilkan. Pilih Hapus di samping kiriman yang ingin dihapus.');}catch(error){status('Belum dapat memperbarui daftar: '+error.message);}finally{button.disabled=false;}};
 function deleteBody(){return {...deleteTarget,removeAttendance:$('delete-attendance').checked};}
 function updateDeleteButton(){$('delete-confirm').disabled=deleting||!deletePlan||(deleteTarget?.scope==='all'&&$('delete-phrase').value!=='HAPUS SEMUA');}
 async function previewDelete(){const turn=++planGeneration;deletePlan=null;updateDeleteButton();$('delete-counts').textContent='Menghitung data terkait…';
 try{const plan=await api('/api/admin/delete-plan',deleteBody());if(turn!==planGeneration||!deleteTarget)return;deletePlan=plan;$('delete-counts').textContent=`Akan dihapus: ${plan.submissions} kiriman (termasuk balasan), ${plan.publicWishes} salinan publik, dan ${plan.attendance} presensi.`;}
 catch(error){if(turn===planGeneration)$('delete-counts').textContent=error.status===404?'Perbarui kode Worker terlebih dahulu untuk mengaktifkan penghapusan.':'Gagal menghitung: '+error.message;}
 updateDeleteButton();}
 function openDelete(w){if(deleting)return;deleteTarget=w?{id:w.id}:{scope:'all'};deletePlan=null;$('delete-attendance').checked=false;$('delete-phrase').value='';$('delete-status').textContent='';$('delete-title').textContent=w?(w.parentId?'Hapus balasan ini?':'Hapus ucapan ini?'):'Hapus semua ucapan?';$('delete-description').textContent=w?(w.parentId?`Balasan dari ${w.name} akan dihapus. Ucapan utama tetap disimpan.`:`Ucapan dari ${w.name} beserta seluruh balasannya akan dihapus dari admin dan undangan.`):'Semua ucapan tamu dan balasannya di seluruh status akan dihapus. Contoh Sahabat dan Keluarga tetap tersedia.';$('delete-phrase-label').hidden=Boolean(w);$('delete-dialog').showModal();previewDelete();}
 $('clear-wishes').onclick=()=>openDelete(null);$('delete-attendance').onchange=previewDelete;$('delete-phrase').oninput=updateDeleteButton;
 $('delete-cancel').onclick=()=>{if(!deleting){planGeneration++;deleteTarget=null;$('delete-dialog').close();}};
 $('delete-dialog').addEventListener('cancel',event=>{if(deleting)event.preventDefault();else{planGeneration++;deleteTarget=null;}});
 $('delete-form').onsubmit=async event=>{event.preventDefault();if(deleting||!deletePlan||!deleteTarget)return;if(deleteTarget.scope==='all'&&$('delete-phrase').value!=='HAPUS SEMUA')return;
 deleting=true;$('delete-cancel').disabled=true;$('delete-attendance').disabled=true;$('delete-phrase').disabled=true;updateDeleteButton();$('delete-status').textContent='Menghapus…';
 try{const result=await api('/api/admin/delete',{...deleteBody(),fingerprint:deletePlan.fingerprint,confirmation:deleteTarget.scope==='all'?'HAPUS SEMUA':'HAPUS'});$('delete-dialog').close();deleteTarget=null;status(`${result.deleted} kiriman dan ${result.attendanceDeleted} presensi dihapus.`);await load();}
 catch(error){$('delete-status').textContent='Penghapusan belum selesai. Muat ulang data sebelum mencoba kembali. '+(error.message==='DATA_CHANGED_REFRESH'?'Data berubah sejak konfirmasi.':error.message);deletePlan=null;}
 finally{deleting=false;$('delete-cancel').disabled=false;$('delete-attendance').disabled=false;$('delete-phrase').disabled=false;updateDeleteButton();}};
 async function load(){const current=generation;const result=await api('/api/admin/data');if(!session||current!==generation)return;data=result;$('panel').hidden=false;$('login').hidden=true;render();}
 $('login').onsubmit=async event=>{event.preventDefault();const button=$('login').querySelector('button');button.disabled=true;status('Memeriksa login…');const current=generation;
 try{const password=$('password').value;const result=await fetchJSON(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value.trim(),password,returnSecureToken:true})});$('password').value='';if(current!==generation)return;session={idToken:result.idToken,refreshToken:result.refreshToken,until:Date.now()+(Number(result.expiresIn)-60)*1000};await load();status('Login berhasil.');}
 catch{session=null;status('Login belum berhasil. Periksa akun admin dan koneksi backend.');}finally{$('password').value='';button.disabled=false;}};
 $('refresh').onclick=()=>load().then(()=>status('Data diperbarui.')).catch(error=>status('Gagal memuat: '+error.message));$('filter').onchange=render;
 $('logout').onclick=()=>{generation++;session=null;data={submissions:[],rsvps:[]};$('panel').hidden=true;$('login').hidden=false;$('admin-wishes').replaceChildren();$('attendance').replaceChildren();status('Sesi ditutup.');};
 function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function csv(value){let s=String(value??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
 $('export-csv').onclick=()=>{const rows=[['Nama','Presensi','Diperbarui (UTC)'],...data.rsvps.map(x=>[x.name,x.attendance==='attending'?'Datang':x.attendance==='not_attending'?'Berhalangan':'Belum pasti',x.updatedAt])];download('presensi-jack-ruth.csv','\uFEFF'+rows.map(row=>row.map(csv).join(',')).join('\r\n'),'text/csv;charset=utf-8');};
 $('export-json').onclick=()=>download('cadangan-jack-ruth.json',JSON.stringify({exportedAt:new Date().toISOString(),...data},null,2),'application/json');
})();

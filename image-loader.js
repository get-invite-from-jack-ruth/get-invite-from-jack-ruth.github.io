(() => {
'use strict';
// Resolve only after the browser has downloaded and decoded a usable image.
function attempt(image,url,timeout){
 return new Promise((resolve,reject)=>{
  let finished=false;
  const cleanup=()=>{clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);};
  function finish(error){if(finished)return;finished=true;cleanup();error?reject(error):resolve(image.src);}
  function failed(){finish(new Error('Foto gagal dimuat'));}
  async function loaded(){
   if(!image.naturalWidth)return failed();
   try{if(image.decode)await image.decode();if(image.naturalWidth)finish();else failed();}catch{failed();}
  }
  const timer=setTimeout(()=>finish(new Error('Pemuatan foto terlalu lama')),timeout);
  image.addEventListener('load',loaded);image.addEventListener('error',failed);
  image.loading='eager';image.src=url;
  if(image.complete&&image.naturalWidth)loaded();
 });
}
window.loadInvitationImage=async function(image,url,{retries=2,timeout=30000,onState=()=>{}}={}){
 onState('loading');
 for(let n=0;n<=retries;n++){
  const request=n?url+(url.includes('?')?'&':'?')+'image-retry='+Date.now()+'-'+n:url;
  try{const src=await attempt(image,request,timeout);onState('ready');return src;}
  catch(error){image.removeAttribute('src');if(n===retries){onState('failed');throw error;}}
 }
};
})();

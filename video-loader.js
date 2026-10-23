(() => {
'use strict';
window.createInvitationVideoLoader=function(video,url,{onState=()=>{},timeout=30000}={}){
 let started=false,retries=0,timer=null,retryTimer=null,failed=false,position=0,resume=false,restoring=false;
 function clear(){clearTimeout(timer);clearTimeout(retryTimer);timer=retryTimer=null;}
 function watch(){clearTimeout(timer);timer=setTimeout(fail,timeout);}
 function request(){
  clear();failed=false;restoring=true;onState('loading');
  video.preload='metadata';video.src=retries?url+(url.includes('?')?'&':'?')+'video-retry='+Date.now()+'-'+retries:url;
  watch();video.load();
 }
 function fail(){
  if(!started||failed)return;
  clear();failed=true;position=Number.isFinite(video.currentTime)?video.currentTime:position;
  resume=resume||!video.paused;video.pause();
  if(retries<2){retries++;onState('loading');retryTimer=setTimeout(request,700);}
  else{onState('failed');}
 }
 video.addEventListener('error',fail);
 video.addEventListener('loadedmetadata',()=>{
  if(failed)return;
  clearTimeout(timer);timer=null;
  if(position>0){try{video.currentTime=Math.min(position,Math.max(0,video.duration-.1));}catch{}}
  if(resume){resume=false;video.play().catch(()=>{clearTimeout(timer);timer=null;restoring=false;onState('ready');});watch();}
  else{restoring=false;onState('ready');}
 });
 const ready=()=>{if(!failed){clearTimeout(timer);timer=null;restoring=false;onState('ready');}};
 video.addEventListener('canplay',ready);video.addEventListener('playing',ready);
 video.addEventListener('waiting',()=>{if(started&&!failed&&!video.paused){onState('loading');watch();}});
 video.addEventListener('stalled',()=>{if(started&&!failed&&!video.paused){onState('loading');watch();}});
 video.addEventListener('pause',()=>{if(!failed&&!restoring){clearTimeout(timer);timer=null;onState('ready');}});
 video.addEventListener('ended',()=>{resume=false;position=0;ready();});
 return {
  prepare(){if(started)return;started=true;request();},
  retry(){if(!failed)return;retries=0;request();}
 };
};
})();

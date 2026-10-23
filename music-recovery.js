(() => {
'use strict';
window.createInvitationMusicRecovery=function(music,getContext,onStatus=()=>{}){
 let active=false,pending=false,timer=null,stallTimer=null,attempts=0,reloads=0,lastTime=0,restoreTime=null,boundContext=null,needsGesture=false;
 const visible=()=>!document.hidden;
 function clearRetry(){clearTimeout(timer);timer=null;}
 function clearStall(){clearTimeout(stallTimer);stallTimer=null;}
 function schedule(){
  if(!active||!visible()||needsGesture||timer)return;
  if(attempts>=3){onStatus('failed');return;}
  timer=setTimeout(()=>{timer=null;attempts++;recover();},1000*Math.pow(2,attempts));
 }
 function blocked(error){
  if(error?.name==='NotAllowedError'){needsGesture=true;clearRetry();onStatus('gesture');}
  else if(error?.name!=='AbortError'){schedule();}
 }
 function watchStall(){
  if(!active||!visible()||stallTimer)return;
  stallTimer=setTimeout(()=>{stallTimer=null;reload();},15000);
 }
 function reload(){
  if(!active||!visible())return;
  if(reloads>=2){clearRetry();onStatus('failed');return;}
  reloads++;restoreTime=music.ended?0:lastTime;pending=false;clearRetry();clearStall();onStatus('loading');
  music.load();watchStall();
 }
 function recover(){
  if(!active||!visible()||pending)return;
  const context=getContext();
  if(context&&context!==boundContext){boundContext=context;context.addEventListener?.('statechange',()=>{
   if(context.state==='running'){if(music.paused)recover();else onStatus('ready');}
   else schedule();
  });}
  // Call both inside a user gesture when available; do not await resume before play.
  if(context&&context.state!=='running'){
   try{const resumed=context.resume();resumed?.catch(blocked);}catch(error){blocked(error);}
  }
  music.loop=true;
  if(music.error){reload();return;}
  if(music.paused||music.ended){
   pending=true;
   try{Promise.resolve(music.play()).then(()=>{pending=false;if(!context||context.state==='running')onStatus('ready');},error=>{pending=false;blocked(error);});}
   catch(error){pending=false;blocked(error);}
  }
 }
 function gesture(){
  if(!active||!visible())return;
  if(needsGesture||music.paused||getContext()?.state!=='running'){
   needsGesture=false;attempts=0;clearRetry();recover();
  }
 }
 function ready(){
  const context=getContext();if(context&&context.state!=='running')return;
  clearStall();clearRetry();attempts=0;reloads=0;needsGesture=false;
  onStatus('ready');
 }
 music.addEventListener('playing',ready);
 music.addEventListener('timeupdate',()=>{
  if(Number.isFinite(music.currentTime)&&music.currentTime!==lastTime){lastTime=music.currentTime;ready();}
 });
 music.addEventListener('pause',schedule);
 music.addEventListener('ended',()=>{lastTime=0;try{music.currentTime=0;}catch{}recover();});
 for(const event of ['waiting','stalled'])music.addEventListener(event,watchStall);
 music.addEventListener('error',()=>{clearStall();reload();});
 music.addEventListener('loadedmetadata',()=>{
  if(restoreTime!==null){try{music.currentTime=Number.isFinite(music.duration)?Math.min(restoreTime,Math.max(0,music.duration-.1)):restoreTime;}catch{}restoreTime=null;}
  recover();
 });
 music.addEventListener('canplay',()=>{clearStall();recover();});
 document.addEventListener('visibilitychange',()=>{
  if(visible()){attempts=0;recover();}
  else{clearRetry();clearStall();}
 });
 window.addEventListener('pageshow',()=>{if(active){attempts=0;recover();}});
 window.addEventListener('online',()=>{if(active){attempts=0;reloads=0;needsGesture=false;recover();}});
 for(const event of ['pointerdown','keydown'])document.addEventListener(event,gesture,{passive:true});
 return {
  start(){active=true;recover();},
  retry(){if(!active)return;attempts=0;reloads=0;needsGesture=false;pending=false;clearRetry();clearStall();recover();}
 };
};
})();

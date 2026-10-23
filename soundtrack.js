(() => {
'use strict';
window.createInvitationSoundtrack = function(config) {
  const music = new Audio(config.music), voice = new Audio(config.voice);
  const video = document.getElementById('story-video');
  music.loop = true; voice.loop = false;
  music.preload = 'auto'; voice.preload = 'auto';
  const options = config.audio;
  voice.volume = Math.min(1, options.voiceVolume);
  let started = false, unfinished = true, videoActive = false, resumeVoice = false;
  let videoGain, videoFrame = 0;
  function updateVideoVolume() {
    const time = Number(video.currentTime) || 0;
    const remaining = Number.isFinite(video.duration) ? Math.max(0, video.duration-time) : 1;
    const t = Math.max(0, Math.min(1, time, remaining));
    const level = .05 + .35 * t*t*(3-2*t);
    if(videoGain) videoGain.gain.value = level; else video.volume = level;
  }
  function animateVideoVolume() {
    updateVideoVolume();
    videoFrame = requestAnimationFrame(animateVideoVolume);
  }
  updateVideoVolume();
  video.addEventListener('playing', () => { cancelAnimationFrame(videoFrame); animateVideoVolume(); });
  for(const event of ['pause','ended','waiting','error']) video.addEventListener(event, () => { cancelAnimationFrame(videoFrame); updateVideoVolume(); });
  for(const event of ['play','timeupdate','seeking','seeked','loadedmetadata']) video.addEventListener(event, updateVideoVolume);
  let context, gain, fadeFrame = 0, voiceRequest = false, delayPassed = false, voicePrimed = false;
  function currentVolume() { return gain ? gain.gain.value : music.volume; }
  function setVolume(value) { if(gain) gain.gain.value = value; else music.volume = value; }
  function fadeTo(target, immediate = false) {
    cancelAnimationFrame(fadeFrame);
    if(immediate) { setVolume(target); return; }
    const initial = currentVolume(), start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / options.fadeDuration);
      const smooth = t*t*(3-2*t);
      setVolume(initial + (target-initial)*smooth);
      if(t<1) fadeFrame = requestAnimationFrame(step);
    }
    fadeFrame = requestAnimationFrame(step);
  }
  function update(immediate = false) {
    fadeTo(videoActive ? options.videoBackgroundVolume : unfinished ? options.voiceBackgroundVolume : options.musicVolume, immediate);
  }
  function voiceFailed() { unfinished = false; resumeVoice = false; update(); }
  function playVoice() {
    if(!unfinished || voiceRequest || !delayPassed || !voicePrimed || videoActive) return;
    voiceRequest = true;
    voice.play().then(() => {
      voiceRequest = false;
      if(videoActive) { resumeVoice = true; voice.pause(); }
    }).catch(() => { voiceRequest = false; voiceFailed(); });
  }
  voice.addEventListener('ended', () => { unfinished = false; resumeVoice = false; update(); });
  voice.addEventListener('error', voiceFailed);
  video.addEventListener('play', () => {
    videoActive = true;
    if(started && unfinished) { resumeVoice = true; voice.pause(); }
    update();
  });
  function restoreAfterVideo() {
    if(!videoActive) return;
    videoActive = false;
    if(resumeVoice && unfinished) { resumeVoice = false; playVoice(); }
    update();
  }
  video.addEventListener('pause', restoreAfterVideo);
  video.addEventListener('ended', restoreAfterVideo);
  video.addEventListener('error', restoreAfterVideo);
  // Visible only if automatic recovery cannot continue playback.
  const retryMusic=document.createElement('button');
  retryMusic.type='button';retryMusic.className='button music-retry';retryMusic.hidden=true;
  retryMusic.setAttribute('aria-label','Coba putar musik kembali');
  document.getElementById('invitation-app').append(retryMusic);
  const recovery=window.createInvitationMusicRecovery(music,()=>context,status=>{
    retryMusic.hidden=status==='ready';
    retryMusic.disabled=status==='loading';
    retryMusic.textContent=status==='loading'?'Memuat musik…':'Coba Putar Musik';
  });
  retryMusic.onclick=()=>recovery.retry();
  return {
    start() {
      if(started) return;
      started = true;
      // GainNode provides volume fading on mobile browsers that ignore media.volume.
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if(AudioContext) {
        try {
          context = new AudioContext();
          gain = context.createGain();
          context.createMediaElementSource(music).connect(gain);
          const voiceGain = context.createGain();
          voiceGain.gain.value = options.voiceVolume;
          context.createMediaElementSource(voice).connect(voiceGain);
          const master = context.createGain();
          master.gain.value = options.masterGain || 1;
          gain.connect(master);
          voiceGain.connect(master);
          master.connect(context.destination);
          // Independent video gain also works on mobile browsers ignoring media.volume.
          videoGain = context.createGain();
          context.createMediaElementSource(video).connect(videoGain);
          videoGain.connect(context.destination);
          video.volume = 1;
          updateVideoVolume();
          voice.volume = 1;
          music.volume = 1;
          context.resume().catch(() => {});
        } catch { gain = null; }
      }
      update(true);
      // Prime narration silently inside the user gesture, then delay its audible start.
      recovery.start();
      voice.muted = true;
      voice.play().then(() => {
        voice.pause();
        voice.currentTime = 0;
        voice.muted = false;
        voicePrimed = true;
        playVoice();
      }).catch(voiceFailed);
      setTimeout(() => { delayPassed = true; playVoice(); }, options.voiceDelay);
    }
  };
};
})();

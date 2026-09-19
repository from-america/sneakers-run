import { Game, FixedClock, STEP, PLAYER_X, SHAPES } from './simulation.js?v=14';
import { LEVELS } from './routes.js?v=11';
import { Assets, Renderer } from './renderer.js?v=16';
import { readSave, writeSave, recordResult, SAVE_KEY, validBinding } from './save.js?v=7';
import { Input, keyLabel } from './input.js?v=7';
import { Audio } from './audio.js?v=11';

const $ = id => document.getElementById(id);
const app = $('app');
function animateCoinFavicon() {
  const link = $('favicon');
  if (!link || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const fallback = 'assets/runtime/coin-favicon-a.png';
  const frames = ['assets/runtime/coin-favicon-a.png', 'assets/runtime/coin-favicon-b.png'];
  let frame = 0, timer = 0, failed = false;
  const restore = () => {
    if (failed) return;
    failed = true;
    if (timer) clearInterval(timer);
    link.href = fallback;
  };
  link.addEventListener('error', restore);
  link.href = frames[0];
  timer = window.setInterval(() => {
    if (document.hidden || failed) return;
    frame = (frame + 1) % frames.length;
    link.href = frames[frame];
  }, 520);
}
animateCoinFavicon();
let storage;
try { storage = localStorage; } catch { storage = { getItem:()=>null, setItem:()=>{throw Error('unavailable');} }; }
if (window.desktop) {
  try {
    const contents = await window.desktop.readSave();
    if (contents) storage.setItem(SAVE_KEY, contents);
  } catch { $('saveNotice').hidden = false; }
}
let save = readSave(storage);
const settings = save.settings;
settings.reducedMotion ||= matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const testing = params.get('test') === '1';
const TITLE_MUSIC = 'assets/music/sneakers-run-lite.mp3';
const INTRO_DIALOGUE = 'assets/audio/intro-dialogue.mp3';
const INTRO_DURATION = 9.99;
const INTRO_CAPTIONS = [
  [0, 1.05, 'SUIT 1', 'THERE!'],
  [1.05, 2.35, 'SUIT 2', 'HEY! THOSE ARE OURS!'],
  [2.35, 3.7, 'SNEAKERS', 'OH, NO.'],
  [3.7, 5.5, 'SNEAKERS', 'RUN!'],
  [5.5, 7.3, 'SUIT 1', 'COME BACK HERE!'],
  [7.3, INTRO_DURATION, 'SUIT 2', 'GET HIM!'],
];
const game = new Game({stage:save.unlocked, difficulty:settings.difficulty});
const clock = new FixedClock(game), assets = new Assets(), renderer = new Renderer($('game'), assets);
renderer.settings = settings; renderer.debug = testing;
const sound = new Audio($('music'), settings, $('dialogue'));
sound.setTrack(TITLE_MUSIC);sound.setDialogue(INTRO_DIALOGUE);
sound.muted = settings.muted;
$('muteButton').setAttribute('aria-pressed', String(sound.muted));
$('muteButton').setAttribute('aria-label', sound.muted ? 'Unmute all audio' : 'Mute all audio');
$('muteLabel').textContent = sound.muted ? 'OFF' : 'ON';
let ready=false, screen='loading', settingsReturn='home', binding=null, request=0, countIn=0, feedbackTime=0;
let lastFrame=performance.now(), cosmetic=0, hudTime=0, introTime=0, frozen=false, resultRecorded=false;
let previousScore=0, previousCoins=0;
const timings=[],frameIntervals=[],frameWork=[];
let lastGameplayFrame=0;
document.addEventListener('pointerdown',()=>{if(screen==='home')sound.play();},{passive:true});
const panels = { home:'homePanel', loading:'homePanel', paused:'pausePanel', result:'resultPanel', settings:'settingsPanel', error:'errorPanel' };
const menuControls = () => [...(document.getElementById(panels[screen]) || app).querySelectorAll('button:not(:disabled),select,input,a'),
  ...(['home','paused','result'].includes(screen)?[$('muteButton'),$('fullscreenButton'),...(window.desktop?[$('quitButton')]:[])]:[])].filter(e=>e.checkVisibility());

function persist() {
  save.settings=settings;
  const success=writeSave(storage, save);
  $('saveNotice').hidden=success;
  if(window.desktop)window.desktop.writeSave(JSON.stringify(save)).then(ok=>{$('saveNotice').hidden=ok&&success;}).catch(()=>{$('saveNotice').hidden=false;});
}
function announce(text){$('announcer').textContent=text;}
function introCaption(time){
  const line=INTRO_CAPTIONS.find(([start,end])=>time>=start&&time<end);
  if(!line){$('introDialogue').hidden=true;return;}
  $('introDialogue').hidden=false;setText('introSpeaker',line[2]);setText('introLine',line[3]);
}
function focusFirst(){menuControls()[0]?.focus({preventScroll:true});}
function show(next, focus=true){
  screen=next;app.dataset.screen=next;
  const titleScreen=next==='home'||next==='loading';
  $('masthead').hidden=titleScreen;
  $('scoreboard').hidden=!['running','countdown'].includes(next);
  $('controlDeck').hidden=!['running','countdown'].includes(next);
  for(const id of new Set(Object.values(panels)))$(id).hidden=panels[next]!==id;
  $('pauseButton').disabled=!['running','countdown'].includes(next);
  $('jumpButton').disabled=next!=='running';$('rollButton').disabled=next!=='running';
  $('cue').hidden=true;delete $('cue').dataset.move;$('feedback').hidden=true;$('feedback').dataset.kind='neutral';$('power').hidden=true;
  $('introDialogue').hidden=next!=='intro';
  $('countdown').hidden=next!=='countdown';
  renderer.resize();renderer.draw(game,0,1,cosmetic);
  // Commit focus with the panel change so a following controller edge cannot
  // act on the previous panel or be overwritten by a delayed focus callback.
  if(focus&&next!=='running'&&next!=='countdown')focusFirst();
  if(next==='running')document.activeElement?.blur();
}
function setText(id,value){if($(id).textContent!==String(value))$(id).textContent=String(value);}
function pulse(id,className='hud-pop'){
  const element=$(id);if(!element||settings.reducedMotion)return;
  element.classList.remove(className);void element.offsetWidth;element.classList.add(className);
}
function labels(){
  const pad=input.source==='gamepad', touch=input.source==='touch';
  setText('jumpKey',pad?'A':touch?'↑':keyLabel(settings.jumpKey).toUpperCase());
  setText('rollKey',pad?'B':touch?'↓':keyLabel(settings.rollKey).toUpperCase());
  setText('bindJump',`Jump: ${keyLabel(settings.jumpKey)}`);setText('bindRoll',`Roll: ${keyLabel(settings.rollKey)}`);
  document.querySelector('#controlHelp div:nth-child(1)>span').textContent=`${keyLabel(settings.jumpKey)} / ↑ / W · controller A`;
  document.querySelector('#controlHelp div:nth-child(2)>span').textContent=`${keyLabel(settings.rollKey)} / S · controller B`;
  $('jumpButton').setAttribute('aria-label',pad?'Jump. Press A again in the air for a double jump.':touch?'Jump. Tap again in the air for a double jump.':'Jump. Press again in the air for a double jump.');
  $('rollButton').setAttribute('aria-label',pad?'Roll. Hold B to stay low.':touch?'Roll. Hold to stay low.':'Roll. Hold to stay low.');
  app.dataset.source=input.source;
}
function navigate(direction,horizontal=false){
  const controls=menuControls(), active=document.activeElement;
  // Controller can operate every setting without mouse or keyboard.
  if(horizontal&&active?.type==='range'){active.value=Number(active.value)+direction*10;active.dispatchEvent(new Event('input'));return;}
  if(horizontal&&active?.tagName==='SELECT'){active.selectedIndex=Math.max(0,Math.min(active.options.length-1,active.selectedIndex+direction));active.dispatchEvent(new Event('change'));return;}
  const index=controls.indexOf(active);controls[(index+direction+controls.length)%controls.length]?.focus();
}
function feedback(text,kind='neutral',meta='',duration=1.35){
  const labels={neutral:'MOVE',reward:'CLEAN',near:'CLOSE CALL',stomp:'STOMP',coin:'COIN',power:'POWER',hit:'DANGER'};
  setText('feedbackLabel',labels[kind]||kind.toUpperCase());setText('feedbackText',text);setText('feedbackMeta',meta);
  $('feedback').dataset.kind=kind;feedbackTime=duration;$('feedback').hidden=false;pulse('feedback','feedback-pop');
}
async function fullscreen(){
  try{
    if(window.desktop){const full=await window.desktop.fullscreen();$('fullscreenButton').setAttribute('aria-label',full?'Exit fullscreen':'Enter fullscreen');}
    else if(document.fullscreenElement)await document.exitFullscreen();
    else await app.requestFullscreen();
  }catch{announce('Fullscreen is unavailable in this browser.');}
}
function pause(reason='Paused'){
  const disconnected=reason==='Controller disconnected';
  if(screen==='countdown'){countIn=0;show('paused');}
  else if(screen==='paused'&&disconnected){/* keep the pause panel, but explain the new reason */}
  else if(screen==='running'&&game.pause())show('paused');
  else return;
  setText('pauseReason',disconnected?'Controller disconnected':'PAUSED');setText('pauseTitle',disconnected?'Controller paused':'Take five');setText('pauseCopy',disconnected?'Reconnect your controller, then resume when ready.':'Your run is frozen. Resume when you’re ready.');
  input.clear();clock.reset();sound.pause();announce(disconnected?'Controller disconnected. Reconnect and resume when ready.':'Run paused.');
}
function resume(){
  if(game.phase!=='paused')return;input.clear();countIn=1.2;setText('countdown','3');show('countdown',false);
}
function home(){
  request++;countIn=0;binding=null;input.clear();clock.reset();sound.pause();sound.setTrack(TITLE_MUSIC);renderer.effects=[];
  game.phase='ready';game.player.action='run';game.player.y=0;show('home');
  setText('startButton','Start');
  renderLevels();
  hud();
}
async function start(stage=save.unlocked, mode='story', retry=false){
  if(!ready)return;
  const ticket=++request;input.clear();sound.prime();sound.pause();countIn=0;frozen=true;
  game.phase='ready';show('loading',false);$('startButton').disabled=true;setText('startButton','Loading…');
  try{
    await assets.prepareGameplay();await assets.scene(stage);if(ticket!==request)return;
    const seed=retry?game.seed:Number(params.get('seed'))||crypto.getRandomValues(new Uint32Array(1))[0];
    game.reset({stage,mode,difficulty:settings.difficulty,seed});game.drainEvents();previousScore=0;previousCoins=0;
    sound.setTrack(LEVELS[stage].music);
    assets.retain(stage);if(!assets.lowMemory&&stage+1<LEVELS.length)assets.scene(stage+1).catch(()=>{});
    renderer.warmTextures();
    // Let texture uploads complete behind Loading before starting simulation.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(ticket!==request)return;
    clock.reset();renderer.effects=[];resultRecorded=false;feedbackTime=0;
    timings.length=0;frameIntervals.length=0;frameWork.length=0;lastGameplayFrame=0;
    const opening=stage===0&&mode==='story'&&!testing;
    introTime=0;introCaption(0);renderer.chaserIntroDone=false;frozen=testing||opening;renderer.cutscene=opening?{elapsed:0}:null;game.phase=opening?'paused':'running';
    show(opening?'intro':'running',false);$('startButton').disabled=false;lastFrame=performance.now();if(opening)sound.playDialogue();else sound.play();hud();
    announce(`${mode==='story'?LEVELS[stage].name:'Endless run'}. Jump and roll to avoid obstacles.`);
    if(document.hidden)pause();
  }catch{if(ticket!==request)return;show('error');$('startButton').disabled=false;}
}
function retry(){if(['paused','result'].includes(screen))start(game.stage,game.mode,true);}
function back(){
  if(screen==='settings'){binding=null;$('bindNotice').hidden=true;show(settingsReturn);}
  else if(screen==='paused')resume();
}
function updateUnlockControl(){
  const button=$('unlockAllButton');
  if(!button)return;
  const unlocked=save.unlocked>=LEVELS.length-1;
  button.disabled=unlocked;
  button.textContent='Unlock all levels';
  button.setAttribute('aria-label','Unlock all levels');
}
function unlockAll(){
  if(save.unlocked>=LEVELS.length-1)return;
  save.unlocked=LEVELS.length-1;persist();updateUnlockControl();renderLevels();
}
function settingsOpen(){settingsReturn=screen==='paused'?'paused':'home';updateUnlockControl();show('settings');}
function result(){
  if(resultRecorded)return;resultRecorded=true;sound.pause();input.clear();clock.reset();
  save=recordResult(save,game);save.settings=settings;persist();
  const clear=game.phase==='cleared',final=clear&&game.stage===LEVELS.length-1,endless=game.mode==='endless';
  setText('resultEyebrow',endless?'Endless run':clear?'Level complete':'Game over');
  $('resultTitle').textContent=final?'You win':clear?'Level complete':'Game over';
  $('resultPanel').dataset.outcome=endless?'endless':clear?'clear':'gameover';
  setText('resultCopy',endless?`${Math.floor(game.world/10).toLocaleString()} m. Best: ${(save.endless[game.difficulty]?.meters||0).toLocaleString()} m.`:
    clear?(final?'You cleared all 10 levels.':'The next level is unlocked.'):
    game.deathReason==='low clearance'?'Low clearance. Hold Roll to stay under the beam.':`You hit the ${game.deathReason}. Watch the cue, then jump or roll.`);
  setText('resultScore',game.score.toLocaleString());setText('resultCoins',game.coins);setText('resultStreak',game.bestStreak);
  $('objectives').replaceChildren();
  if(!endless)for(const [i,text] of ['Clear the block','Collect 40 coins','Finish without a hit'].entries()){
    const li=document.createElement('li');li.textContent=text;li.className=game.stars()[i]?'earned':'';$('objectives').append(li);
  }
  setText('resultPrimary',final?'Main menu':clear?'Next level':'Play again');
  $('resultRetry').hidden=!clear;show('result');hud();announce(clear?'Level complete.':'Game over. Ready to retry.');
}
function renderLevels(){
  $('levelList').replaceChildren();
  LEVELS.forEach((level,index)=>{
    const button=document.createElement('button');button.className='level-card';button.disabled=index>save.unlocked;
    button.setAttribute('aria-label',`Block ${index+1}: ${level.name}${button.disabled?', locked':''}`);
    const number=document.createElement('span');number.className='level-number';number.textContent=String(index+1).padStart(2,'0');
    const title=document.createElement('span');title.className='level-copy';const name=document.createElement('strong'),place=document.createElement('small');name.textContent=level.name;place.textContent=level.place;title.append(name,place);
    button.append(number,title);
    if(button.disabled){const status=document.createElement('span');status.className='level-state locked';const lock=document.createElement('span');lock.className='lock-icon';lock.setAttribute('aria-hidden','true');status.append(lock,document.createTextNode('LOCKED'));button.append(status);}
    button.addEventListener('click',()=>start(index));$('levelList').append(button);
  });
}
function hud(){
  const endless=game.mode==='endless';
  setText('chapterNumber',endless?'∞':`${String(game.stage+1).padStart(2,'0')} / 10`);setText('chapterName',endless?'Endless run':LEVELS[game.stage].name);
  setText('score',String(game.score).padStart(6,'0'));setText('coins',game.coins);
  setText('lives',Array.from({length:game.maxLives},(_,i)=>i<game.lives?'●':'○').join(' '));setText('livesLabel',`${game.lives} ${game.lives===1?'CHANCE':'CHANCES'}`);
  $('chances').setAttribute('aria-label',`${game.lives} of ${game.maxLives} chances remaining`);
  const percent=endless?0:Math.min(100,game.world/game.playLength*100);
  $('progressFill').style.transform=`scaleX(${percent/100})`;$('progress').setAttribute('aria-valuenow',String(Math.floor(percent)));
  $('progress').setAttribute('aria-valuetext',endless?`${Math.floor(game.world/10)} meters`:`${Math.floor(percent)} percent`);
  setText('controlTitle',screen==='running'?(endless?`${Math.floor(game.world/10)} m`:`${LEVELS[game.stage].place} · ${Math.floor(percent)}%`):'Get ready');
  const sourceTip=input.source==='touch'?'Tap Jump · hold Roll.':input.source==='gamepad'?'A jump · B roll · Menu pauses.':'Jump, roll, or stomp what’s ahead.';
  setText('controlSubtitle',screen==='running'?(game.streak>=3?`${game.streak} clean streak · ${sourceTip}`:sourceTip):'Jump and roll to avoid obstacles.');
  $('streakBadge').hidden=screen!=='running'||game.streak<1;setText('streakCount',game.streak);$('streakBadge').setAttribute('aria-label',`${game.streak} clean escape streak`);
  if(game.score!==previousScore){pulse('score');previousScore=game.score;}
  if(game.coins!==previousCoins){pulse('coins');previousCoins=game.coins;}
  const e=game.upcoming(),eta=e?(e.x-game.world-PLAYER_X)/game.speed:Infinity;
  $('cue').hidden=screen!=='running'||!settings.cues||!e||eta>1.7;
  if(!$('cue').hidden){
    const shape=SHAPES[e.type],timed=shape.timed,roll=shape.move==='roll'||(timed&&!e.floorPhase),move=shape.enemy?'stomp':roll?'roll':'jump',action=shape.enemy?'STOMP':roll?'STAY LOW':shape.move==='climb'?'CLIMB':'JUMP';
    const hint=input.source==='gamepad'?(roll?'Hold B':'A · press twice for height'):input.source==='touch'?(roll?'Hold ROLL':'Tap JUMP'):(roll?`${keyLabel(settings.rollKey)} · hold to roll`:`${keyLabel(settings.jumpKey)} / ↑`);
    setText('cueSymbol',shape.enemy?'↓':roll?'↓':'↑');setText('cueAction',action);setText('cueHint',hint);setText('cueTime',eta<=.45?'NOW':`${eta.toFixed(1)}s`);$('cue').dataset.move=move;$('cue').setAttribute('aria-label',`${action}. ${hint}. ${eta<=.45?'Now':`In ${eta.toFixed(1)} seconds`}.`);
  }
  $('power').hidden=screen!=='running'||(!game.shield&&!game.magnet);
  setText('power',[game.rush>0?`RUSH · ${Math.ceil(game.rush)}s`:'',game.shield?'SHIELD · ONE SAVE':'',game.magnet>0?`MAGNET · ${Math.ceil(game.magnet)}s`:''].filter(Boolean).join(' + '));
}
function events(){for(const event of game.drainEvents()){
  renderer.effect(event);
  if(event.type==='hit'){feedback(`${game.lives} ${game.lives===1?'chance':'chances'} left`,'hit',event.lethal?'RUN ENDED':'KEEP MOVING',event.lethal?1.5:1.2);if(!settings.reducedMotion)input.vibrate();}
  if(event.type==='clean'){
    const obstacle=game.entities.find(entity=>entity.type===event.obstacle&&entity.passed),gap=obstacle?event.x-(obstacle.x+obstacle.width):Infinity,near=gap<20,points=100+Math.min(event.streak,10)*10;
    feedback(`${near?'CLOSE CALL':'CLEAN'} +${points}`,near?'near':'reward',`STREAK ${event.streak}`,near?1.55:1.25);
  }
  // Stomp feedback is cosmetic only. Keep it under one beat so it cannot
  // read like a gameplay pause or make the music and route feel misaligned.
  if(event.type==='stomp')feedback('STOMP +250','stomp',`STREAK ${game.streak}`,.55);
  if(event.type==='coin')feedback('+25','coin',`${game.coins} COINS`,.85);
  if(event.type==='flow')feedback('FLOW CHARM +150','reward',`${game.streak} STREAK · RUSH`,1.45);
  if(event.type==='speed')feedback('RUSH ONLINE','power','SPEED · SHIELD · MAGNET',1.6);
  if(event.type==='shield')feedback('SHIELD READY','power','ONE HIT COVERED',1.35);
  if(event.type==='shieldBreak')feedback('SHIELD SAVED IT','power','KEEP MOVING',1.35);
  if(event.type==='magnet')feedback('MAGNET ON','power','COINS PULL IN',1.15);
  if(event.type==='slip')feedback('SLIPPERY','near','JUMP TO KEEP YOUR SPEED',1.2);
  if(['clear','gameover'].includes(event.type))result();
}}
const input=new Input({game,settings,navigate,sourceChanged:labels,
  bindKey:e=>{
    if(!binding)return false;e.preventDefault();
    if(e.code==='Escape'){binding=null;$('bindNotice').hidden=true;return true;}
    if(!/^(Space|ArrowUp|ArrowDown|Key[A-Z]|Digit[0-9])$/.test(e.code)||['KeyP','KeyR'].includes(e.code)){setText('bindNotice','Choose a letter, number, Space, ↑ or ↓. P, R and Esc are reserved.');return true;}
    const other=binding==='jumpKey'?'rollKey':'jumpKey';
    if(!validBinding(binding,e.code,settings[other])){setText('bindNotice','That key is already used by the other move. Choose a different key.');return true;}
    settings[binding]=e.code;binding=null;labels();persist();setText('bindNotice','Control saved.');return true;
  },action:name=>{
    if(name==='fullscreen')fullscreen();if(name==='retry')retry();
    if(name==='pause'){if(screen==='running'||screen==='countdown')pause();else if(screen==='paused')resume();else back();}
    if(name==='disconnect')pause('Controller disconnected');
    if(name==='back')back();
    if(name==='confirm'){
      const active=document.activeElement;
      if(active?.tagName==='SELECT'){active.selectedIndex=(active.selectedIndex+1)%active.options.length;active.dispatchEvent(new Event('change'));}
      else if(active?.type==='range'){active.value=Number(active.value)>=100?0:Number(active.value)+10;active.dispatchEvent(new Event('input'));}
      else if(menuControls().includes(active))active.click();else focusFirst();
    }
  }});
input.touch($('jumpButton'),'jump');input.touch($('rollButton'),'roll');if(matchMedia('(pointer:coarse)').matches)input.use('touch');labels();
$('startButton').addEventListener('click',()=>start());$('endlessButton').addEventListener('click',()=>start(0,'endless'));
$('settingsButton').addEventListener('click',settingsOpen);$('pauseSettingsButton').addEventListener('click',settingsOpen);
$('pauseButton').addEventListener('click',()=>pause());$('resumeButton').addEventListener('click',resume);$('restartButton').addEventListener('click',retry);
$('pauseHomeButton').addEventListener('click',home);$('resultHome').addEventListener('click',home);$('resultRetry').addEventListener('click',retry);
$('resultPrimary').addEventListener('click',()=>game.phase==='cleared'?(game.stage===LEVELS.length-1?home():start(game.stage+1)):retry());
$('settingsDone').addEventListener('click',back);$('unlockAllButton').addEventListener('click',unlockAll);document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',back));
$('fullscreenButton').addEventListener('click',fullscreen);$('reloadButton').addEventListener('click',()=>location.reload());
$('muteButton').addEventListener('click',()=>{sound.muted=!sound.muted;settings.muted=sound.muted;persist();sound.sync();$('muteButton').setAttribute('aria-pressed',String(sound.muted));$('muteButton').setAttribute('aria-label',sound.muted?'Unmute all audio':'Mute all audio');setText('muteLabel',sound.muted?'OFF':'ON');});
for(const [id,key,event] of [['pace','difficulty','change'],['musicVolume','music','input'],['effectsVolume','effects','input'],['hintsToggle','cues','change'],['motionToggle','reducedMotion','change'],['contrastToggle','contrast','change']]){
  const element=$(id);if(element.type==='checkbox')element.checked=settings[key];else element.value=['music','effects'].includes(key)?settings[key]*100:settings[key];
  element.addEventListener(event,()=>{settings[key]=element.type==='checkbox'?element.checked:element.type==='range'?Number(element.value)/100:element.value;sound.sync();persist();});
}
for(const [id,key] of [['bindJump','jumpKey'],['bindRoll','rollKey']])$(id).addEventListener('click',()=>{binding=key;$('bindNotice').hidden=false;setText('bindNotice','Press a new key. Esc cancels.');});
if(window.desktop){$('quitButton').hidden=false;$('quitButton').addEventListener('click',()=>window.desktop.quit());$('brandLink').removeAttribute('href');window.desktop.onSuspend(()=>pause());}
window.addEventListener('blur',()=>pause());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
window.addEventListener('pagehide',()=>{pause();persist();});
// ResizeObserver runs after animation callbacks. Redraw immediately after a
// backing-store resize so the browser never presents a cleared black canvas.
new ResizeObserver(()=>{renderer.resize();renderer.draw(game,0,1,cosmetic);}).observe($('playfield'));
document.addEventListener('fullscreenchange',()=>{$('fullscreenButton').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
// Menu focus stays in the visible panel. Gameplay shortcuts do not hijack settings.
document.addEventListener('keydown',event=>{
  if(event.code!=='Tab'||!panels[screen])return;
  const controls=menuControls(),first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
});
function frame(now){
  const workStart=testing?performance.now():0;
  const measuring=testing&&screen==='running'&&!frozen&&!document.hidden;
  if(measuring&&lastGameplayFrame){frameIntervals.push(now-lastGameplayFrame);if(frameIntervals.length>600)frameIntervals.shift();}
  lastGameplayFrame=measuring?now:0;
  const dt=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;cosmetic+=dt;
  input.poll(now);
  if(screen==='intro'){
    introTime+=dt;introCaption(introTime);if(renderer.cutscene)renderer.cutscene.elapsed=introTime;
    if(introTime>=INTRO_DURATION){renderer.cutscene=null;renderer.chaserIntroDone=true;frozen=testing;game.phase='running';sound.stopDialogue();show('running',false);sound.play();}
  }
  if(screen==='countdown'&&!frozen){countIn-=dt;setText('countdown',Math.max(1,Math.ceil(countIn/.4)));if(countIn<=0){game.resume();clock.reset();show('running',false);sound.play();}}
  const alpha=!frozen?clock.advance(dt):1;events();
  if(screen==='running'){feedbackTime=Math.max(0,feedbackTime-dt);$('feedback').hidden=feedbackTime<=0;}
  hudTime+=dt;if(hudTime>.08){hud();hudTime=0;}
  // Compact textures and the smaller backing store bound drawing cost.
  // Skipping until 1/45s on a 60Hz display discarded every other frame,
  // producing 30fps scrolling and slowing cosmetic effect expiration.
  renderer.draw(game,dt,alpha,cosmetic);
  if(testing){timings.push(renderer.drawMs);if(timings.length>600)timings.shift();if(measuring){frameWork.push(performance.now()-workStart);if(frameWork.length>600)frameWork.shift();}}
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
try{
  await assets.load(percent=>setText('loadPercent',`${Math.round(percent*100)}%`));
  if(save.unlocked&&!assets.lowMemory)await assets.scene(save.unlocked);
  renderer.warmTextures();
  ready=true;for(const id of ['startButton','endlessButton'])$(id).disabled=false;
  updateUnlockControl();home();
}catch{show('error');}

if(testing)window.__RUN_TEST__={
  ready:()=>ready, snapshot:()=>({...game.snapshot(),screen,source:input.source,ready,save:structuredClone(save),assets:{quality:assets.manifest?.lowMemoryActive?'low':assets.manifest?.compactAtlasActive?'compact':'full',image:assets.manifest?.image,size:assets.manifest?.size,sceneCount:assets.scenes.size,rasterCount:assets.rasters.size,atlasDecodedPixels:assets.image?assets.image.naturalWidth*assets.image.naturalHeight:0,kitDecodedPixels:assets.kit?assets.kit.naturalWidth*assets.kit.naturalHeight:0,rasterDecodedPixels:[...assets.rasters.values()].reduce((sum,image)=>sum+image.naturalWidth*image.naturalHeight,0)},draws:renderer.draws,view:{width:renderer.width,height:renderer.height,scale:renderer.scale,ground:renderer.ground,backgroundLaneClearance:renderer.backgroundLaneClearance,worldWidth:renderer.viewWidth},timings:[...timings],frameIntervals:[...frameIntervals],frameWork:[...frameWork]}),
  start:(stage=0,mode='story')=>start(stage,mode), freeze:(value=true)=>{frozen=value;},
  setInvincible:value=>{game.invincibleTest=!!value;hud();renderer.draw(game,0,1,cosmetic);},
  advance:seconds=>{for(let n=0;n<Math.round(seconds/STEP);n++){game.tick();events();}hud();renderer.draw(game,0,1,cosmetic);},
  command:(name,held=false)=>game.command(name,held),
  scenario:(type,offset=280)=>{game.entities=[{id:'test',type,x:game.world+PLAYER_X+offset,width:SHAPES[type].width,hit:false,passed:false}];game.pickups=[];game.routeLength=Infinity;hud();renderer.draw(game,0,1,cosmetic);},
  finish:()=>{game.world=game.routeLength-1;game.tick();events();hud();},
  setWorld:value=>{game.world=value;game.previousWorld=value;hud();renderer.draw(game,0,1,cosmetic);},
  boxes:value=>{renderer.showBoxes=value;},
  setPlayer:properties=>{Object.assign(game.player,properties);hud();renderer.draw(game,0,1,cosmetic);},
  clear:()=>{game.entities=[];game.pickups=[];game.routeLength=Infinity;hud();renderer.draw(game,0,1,cosmetic);},
  poll:()=>input.poll(performance.now()),
};

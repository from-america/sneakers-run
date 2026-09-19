export const keyLabel = code => ({ Space:'Space', ArrowUp:'↑', ArrowDown:'↓' })[code] || code.replace(/^Key|^Digit/, '');
export class Input {
  constructor({ game, settings, action, navigate, sourceChanged, bindKey }) {
    Object.assign(this, { game, settings, action, navigate, sourceChanged, bindKey });
    this.source='keyboard'; this.buttons=[]; this.padIndex=null; this.rollSources=new Set();
    this.keys=new Set(); this.repeatAt=0; this.previousDirection=0;
    window.addEventListener('keydown', e=>this.key(e,true));
    window.addEventListener('keyup', e=>this.key(e,false));
    window.addEventListener('blur', ()=>this.clear());
  }
  use(source) { if(this.source!==source){this.source=source;this.sourceChanged(source);} }
  roll(source, pressed) {
    if(pressed){this.rollSources.add(source);this.game.command('roll',true);}
    else{this.rollSources.delete(source);if(!this.rollSources.size)this.game.command('releaseRoll');}
  }
  key(event, down) {
    if(down && this.bindKey(event))return;
    if(event.code==='Tab'){this.use('keyboard');return;}
    const repeat=event.repeat||this.keys.has(event.code);
    if(down)this.keys.add(event.code);else this.keys.delete(event.code);
    if(['INPUT','SELECT'].includes(event.target.tagName)&&!['Escape','F11'].includes(event.code))return;
    if(down&&!repeat)this.use('keyboard');
    if(down&&!repeat&&(event.code==='F11'||event.code==='Enter'&&event.altKey)){event.preventDefault();this.action('fullscreen');return;}
    if(down&&!repeat&&['Escape','KeyP'].includes(event.code)){event.preventDefault();this.action('pause');return;}
    if(this.game.phase==='running'){
      if([this.settings.jumpKey,'ArrowUp','KeyW'].includes(event.code)){event.preventDefault();if(down&&!repeat)this.game.command('jump');}
      if([this.settings.rollKey,'KeyS'].includes(event.code)){event.preventDefault();if(!repeat||!down)this.roll(`key:${event.code}`,down);}
    }else if(down&&!repeat){
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){event.preventDefault();this.navigate(['ArrowUp','ArrowLeft'].includes(event.code)?-1:1);}
      if(event.code==='KeyR')this.action('retry');
    }
  }
  touch(button, verb) {
    button.addEventListener('pointerdown', e=>{
      if(button.disabled)return;e.preventDefault();this.use(e.pointerType==='mouse'?'keyboard':'touch');
      try{button.setPointerCapture(e.pointerId);}catch{}
      if(verb==='roll')this.roll(`pointer:${e.pointerId}`,true);else this.game.command('jump');
      button.dataset.held='true';
    });
    const release=e=>{delete button.dataset.held;if(verb==='roll')this.roll(`pointer:${e.pointerId}`,false);};
    button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
    button.addEventListener('click',e=>{if(e.detail===0&&this.game.phase==='running')this.game.command(verb);});
  }
  clear(){this.keys.clear();this.rollSources.clear();this.game.release();document.querySelectorAll('[data-held]').forEach(e=>delete e.dataset.held);}
  poll(now){
    const pads=Array.from(navigator.getGamepads?.()||[]),pad=pads.find(p=>p?.connected&&p.mapping==='standard');
    if(!pad){if(this.padIndex!==null){this.clear();this.action('disconnect');}this.padIndex=null;this.buttons=[];this.previousDirection=0;return;}
    this.padIndex=pad.index;const pressed=pad.buttons.map(b=>b.pressed||b.value>.5),edge=n=>pressed[n]&&!this.buttons[n];
    const ay=pad.axes[1]||0,ax=pad.axes[0]||0;
    const direction=pressed[13]||pressed[15]||ay>.55||ax>.55?1:pressed[12]||pressed[14]||ay<-.55||ax<-.55?-1:0;
    if(pressed.some((v,n)=>v&&!this.buttons[n])||direction&&direction!==this.previousDirection)this.use('gamepad');
    if(edge(9))this.action('pause');
    else if(this.game.phase==='running'){
      if(edge(0)||edge(12))this.game.command('jump');
      const low=pressed[1]||pressed[13],wasLow=this.buttons[1]||this.buttons[13];
      if(Boolean(low)!==Boolean(wasLow))this.roll('gamepad',low);
    }else{
      if(direction&&(direction!==this.previousDirection||now>=this.repeatAt)){this.navigate(direction,pressed[14]||pressed[15]||Math.abs(ax)>.55);this.repeatAt=now+(direction!==this.previousDirection?350:130);}
      if(edge(0))this.action('confirm');if(edge(1))this.action('back');if(edge(2))this.action('retry');
    }
    this.previousDirection=direction;this.buttons=pressed;
  }
  vibrate(){try{const pad=navigator.getGamepads?.()[this.padIndex];pad?.vibrationActuator?.playEffect('dual-rumble',{duration:90,strongMagnitude:.25,weakMagnitude:.4}).catch(()=>{});}catch{}}
}

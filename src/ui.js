//--UI--
/* ---------- state ---------- */
const SATS=1e8;
let S;
function reset(){S={step:0,base:presetSetup('hot'),mine:null,editBase:false,simBase:false,open:{},conf:{before:null,after:null},note:'',custom:{},picked:{mine:false},dis:null,w:newUse(null)}}
reset();
const $=id=>document.getElementById(id);
const STEPS=['Start','Today','Build','Use it','Share'];
const SHARE_URL='https://rolznz.github.io/bitcoin-self-custody-simulator/';
const SHARE_TEXT='Practise bitcoin self-custody with pretend coins: build a setup, throw disasters at it, and see what holds up.';
const btc=s=>(s/SATS).toFixed(4).replace(/\.?0+$/,'')+' BTC';
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- pieces ---------- */
function sel(id,s,k,f,opts,val){
  return `<select id="${id}" data-s="${s}" data-k="${k}" data-f="${f}">${Object.entries(opts).map(([v,l])=>`<option value="${v}"${v===val?' selected':''}>${l}</option>`).join('')}</select>`;
}
function keyLine(k){
  if(isProv(k))return `${DEVICES[k.device]} (${BRANDS[k.brand]}).`;
  const dev=k.device==='none'?'No device':k.device==='hw'?`${BRANDS[k.brand]} hardware signer, ${AT[k.dloc]}`:`${k.net==='offline'?'Offline':'Online'} ${DEVICES[k.device].toLowerCase()}, ${AT[k.dloc]}`;
  const bak=k.backup==='none'?'No backup':k.backup==='paper'||k.backup==='metal'?`${BACKUPS[k.backup]} backup ${AT[k.bloc]}`:k.backup==='memory'?'Seed memorized':'Seed in the cloud';
  return `${dev}. ${bak}.`;
}
function shapeOf(st){
  const mn=st.m+'-'+st.n;
  if(st.keys.some(isProv))return mn==='2-3'||mn==='3-5'?mn:'custom';
  if(st.n===1){const d=st.keys[0].device;return d==='phone'||d==='laptop'||d==='hw'?d:'custom'}
  return mn==='2-2'||mn==='2-3'||mn==='3-5'?mn:'custom';
}
function setShape(st,m,n){
  const provs=st.keys.filter(isProv),own=st.keys.filter(k=>!isProv(k)),want=Math.max(1,n-provs.length);
  while(own.length<want)own.push(newKey());own.length=want;
  st.keys=[...own,...provs.slice(0,Math.max(0,n-want))];st.n=st.keys.length;st.m=Math.max(1,Math.min(m,st.n));
}
function keyCard(s,k,i){
  const id=`${s}-${i}`,key=k;
  const phys=key.backup==='paper'||key.backup==='metal';
  const rec=i==='r',col=rec?'var(--base-bar)':`var(--k${i})`;
  const head=`<header><span class="tok">${rec?'R':LETTERS[i]}</span><h3>${rec?'Recovery key':'Key '+LETTERS[i]}</h3><button class="link" style="margin-left:auto" data-act="editKey" data-id="edit-${id}">Done</button></header>`;
  if(isProv(key))return `<article class="key" style="--kc:${col}">${head}
    <div class="fields"><label class="wide">Signs on ${sel(id+'-device',s,i,'device',DEVICES,key.device)}</label><label class="wide">Provider’s brand ${sel(id+'-brand',s,i,'brand',PBRANDS,key.brand)}</label></div>
    ${allKeys(S[s]).some(x=>x.device==='hw'&&x.brand===key.brand)?'<p class="hint">⚠️ Same brand as one of your hardware signers. One company’s hack or shutdown can hit both.</p>':''}
    <p class="hint">${key.device==='prov2'?'A second, separate company holds this key. If one provider is hacked or shuts down, the other is unaffected.':'A company holds this key and co-signs when you ask. It also keeps a copy of your wallet file. Nothing for you to back up. Your other keys can sit on a phone or a hardware signer.'}</p>
  </article>`;
  return `<article class="key" style="--kc:${col}">${head}
    <div class="fields">
      <label class="${key.device==='none'?'wide':''}">Signs on ${sel(id+'-device',s,i,'device',DEVICES,key.device)}</label>
      ${key.device==='hw'?`<label>Brand ${sel(id+'-brand',s,i,'brand',HWBRANDS,key.brand)}</label>`:''}
      ${soft(key)?`<label>Connection ${sel(id+'-net',s,i,'net',NETS,key.net)}</label>`:''}
      ${key.device!=='none'?`<label>Device kept at ${sel(id+'-dloc',s,i,'dloc',PLACES,key.dloc)}</label><label>PIN ${sel(id+'-pin',s,i,'pin',PINS,key.pin)}</label>`:''}
      <label class="${phys?'':'wide'}">Seed backup ${sel(id+'-backup',s,i,'backup',BACKUPS,key.backup)}</label>
      ${phys?`<label>Kept at ${sel(id+'-bloc',s,i,'bloc',PLACES,key.bloc)}</label>`:''}
    </div>
    ${key.device==='none'&&key.backup==='none'?'<p class="hint">⚠️ This key exists nowhere. Pick a device or a backup.</p>':''}
    <details data-d="${id}"${S.open[id]?' open':''}><summary>More options</summary>
      <div class="fields">
        ${key.device==='hw'?`<label class="wide">Connects by ${sel(id+'-conn',s,i,'conn',CONNS,key.conn||'usb')}</label>`:''}
        <label class="wide">Seed made by ${sel(id+'-ent',s,i,'ent',ENTS,key.ent)}</label>
        <label class="${key.pass==='none'?'wide':''}">Passphrase ${sel(id+'-pass',s,i,'pass',PASSES,key.pass)}</label>
        ${key.pass!=='none'?`<label>Strength ${sel(id+'-pstr',s,i,'pstr',PSTR,key.pstr)}</label>`:''}
        ${key.pass==='written'?`<label class="wide">Note kept at ${sel(id+'-ploc',s,i,'ploc',PLACES,key.ploc)}</label>`:''}
      </div>
    </details>
  </article>`;
}
function editor(s){
  const st=S[s];
  if(s==='mine'&&!S.picked.mine)return `<div class="card"><div class="fields"><label class="wide">Type of setup <select id="mine-type" data-s="mine" data-k="-1" data-f="type"><option value="" selected disabled>Choose a type of setup</option>${Object.entries(WHERE).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label></div>
    <p class="hint" style="margin-top:10px">Pick one to see its options, or get a recommendation above.</p></div>`;
  const type=`<label class="wide">Type of setup ${sel(s+'-type',s,-1,'type',WHERE,custodial(st)?st.type:st.keys.some(isProv)?'collab':'keys')}</label>`;
  if(custodial(st))return `<div class="card"><div class="fields">${type}<label class="wide">Login protection ${sel(s+'-login',s,-1,'login',LOGINS,st.login||'sms')}</label><p class="hint" style="grid-column:1/-1">Signing in with Google or Apple? Pick whatever protects that account.</p><label class="wide">Withdrawal protection ${sel(s+'-wd',s,-1,'wd',WDS,st.wd||'none')}</label></div>
    <p class="hint" style="margin-top:10px">${{exchange:'The exchange holds the keys. You hold a login, and trust them to let you withdraw.',fintech:'The app’s company holds the keys. You hold a login on your phone, and can pay by card or phone tap. Whether you can withdraw real bitcoin depends on the app.',bank:'The bank or broker holds the keys, often through a partner firm. You hold a login. Whether you can withdraw real bitcoin depends on the bank.',etf:'A fund holds the bitcoin. You hold shares through a broker, and can never withdraw the coins.'}[st.type]}</p></div>`;
  const collab=st.keys.some(isProv),act=S.custom[s]?'custom':shapeOf(st);
  const opts=collab?[['2-3','2-of-3'],['3-5','3-of-5'],['custom','Custom']]:[['phone','Phone wallet'],['laptop','Laptop wallet'],['hw','Hardware wallet'],['2-2','2-of-2'],['2-3','2-of-3'],['3-5','3-of-5'],['custom','Custom']];
  const row=(k,i)=>{const id=`edit-${s}-${i}`,rec=i==='r',nm=rec?'Recovery key':'Key '+LETTERS[i];
    return S.open[id]?keyCard(s,k,i):`<div class="krow" style="--kc:${rec?'var(--base-bar)':`var(--k${i})`}"><span class="tok">${rec?'R':LETTERS[i]}</span><span class="ktxt"><b>${nm}</b><small>${keyLine(k)}</small></span><button class="link" data-act="editKey" data-id="${id}" aria-label="Edit ${nm}">Edit</button></div>`};
  return `<div class="card"><div class="fields">${type}</div>
      <div class="picks" role="group" aria-label="Quick picks">${opts.map(([v,l])=>`<button class="chip" data-act="pick" data-s="${s}" data-v="${v}" aria-pressed="${act===v}">${l}</button>`).join('')}</div>
      ${act==='custom'?`<div class="quorum" style="margin-top:12px">
      <span class="stepper"><button data-act="n-" data-s="${s}" aria-label="Fewer keys"${st.n<=1?' disabled':''}>−</button><output>${st.n}</output><button data-act="n+" data-s="${s}" aria-label="More keys"${st.n>=5?' disabled':''}>+</button> ${st.n===1?'key':'keys'} in total</span>
      ${st.n>1?`<span class="stepper"><button data-act="m-" data-s="${s}" aria-label="Fewer needed"${st.m<=1?' disabled':''}>−</button><output>${st.m}</output><button data-act="m+" data-s="${s}" aria-label="More needed"${st.m>=st.n?' disabled':''}>+</button> needed to spend</span>`:''}
    </div>`:''}</div>
    <div class="keys">${st.keys.map(row).join('')}</div>
    ${st.m<st.n||TL(st)?`<div class="card"><h3>Wallet file</h3><p class="hint" style="margin:4px 0 10px">${TL(st)?'A timelock wallet can’t be spent without this file.':'If a key goes missing, you need this file plus the remaining keys.'}${allKeys(st).some(isProv)?' The provider keeps a copy too.':''}</p>
      <div class="fields"><label class="${st.config==='one'?'':'wide'}">Your own backup ${sel(s+'-config',s,-1,'config',CONFIGS,st.config)}</label>
      ${st.config==='one'?`<label>Kept at ${sel(s+'-cloc',s,-1,'cloc',PLACES,st.cloc)}</label>`:''}</div></div>`:''}
    <details class="adv" data-d="adv-${s}"${S.open['adv-'+s]?' open':''}><summary>Advanced${TL(st)?': recovery timelock on':''}</summary>
      <div class="card"><h3>Recovery timelock</h3><p class="hint" style="margin:4px 0 10px">A backup key that can spend on its own, but only after the coins sit unmoved for a year.</p>
        <div class="fields"><label class="wide">Timelock ${sel(s+'-tl',s,-1,'tl',{off:'Off',on:'On'},st.tl||'off')}</label></div>
        ${TL(st)?'<p class="hint" style="margin-top:8px">Move the coins at least once a year to reset the timer, or the recovery key can spend alone.</p>':''}</div>
      ${TL(st)?`<div class="keys">${row(st.rkey,'r')}</div>`:''}
    </details>`;
}
function chips(s){
  const out=[];
  if(custodial(s))out.push(s.type==='exchange'?'On an exchange':'In an ETF',s.type==='exchange'?'The exchange holds the keys':'You hold shares, not bitcoin');
  else if(s.n===1){const k=s.keys[0];
    if(isProv(k))out.push('One key, held by a provider');
    else{
      out.push(k.device==='none'?'No device':`${k.device==='hw'?BRANDS[k.brand]+' hardware signer':(k.net==='offline'?'Offline ':'Online ')+DEVICES[k.device].toLowerCase()} with ${k.pin==='none'?'no':PINS[k.pin].toLowerCase()} PIN, ${PLACES[k.dloc]}`);
      out.push(k.backup==='paper'||k.backup==='metal'?`${BACKUPS[k.backup]} backup, ${PLACES[k.bloc]}`:BACKUPS[k.backup]);
      out.push({device:k.device==='hw'?'Seed made by the device':'Seed made by the app',dice:'Seed from device plus dice',diceonly:'Seed from dice rolls',words:'Seed from words you picked'}[k.ent]);
      out.push(k.pass==='none'?'No passphrase':'Passphrase');
    }
  }else{
    const places=new Set();s.keys.forEach(k=>{if(real(k))places.add(k.dloc);if(k.backup==='paper'||k.backup==='metal')places.add(k.bloc)});
    out.push(`${s.m}-of-${s.n}`);s.keys.forEach((k,i)=>out.push(`Key ${LETTERS[i]}: `+(isProv(k)?DEVICES[k.device].toLowerCase():k.device==='none'?'backup only':`${k.device==='hw'?BRANDS[k.brand]+' hardware signer':(k.net==='offline'?'offline ':'online ')+DEVICES[k.device].toLowerCase()}, ${PLACES[k.dloc]}`)));
    
  }
  return `<div class="chips">${out.map(c=>`<span class="pill">${c}</span>`).join('')}</div>`;
}
function confButtons(which){
  return `<div class="conf" role="group" aria-label="Confidence from 1 to 5">${[1,2,3,4,5].map(n=>`<button data-act="conf" data-which="${which}" data-n="${n}" aria-pressed="${S.conf[which]===n}">${n}</button>`).join('')}</div>`;
}

/* ---------- screens ---------- */
function screenStart(){
  return `<h1>Take self-custody for a <span class="scribble">test drive<svg viewBox="0 0 260 26" aria-hidden="true"><path pathLength="1" d="M5 9C58 3 150 2 255 7"/><path pathLength="1" d="M22 20C84 14 168 14 240 18"/></svg></span></h1>
  <p><span class="pill">🔒 Runs in your browser. Nothing you pick is sent or saved.</span></p>
  <div><button class="btn cta" data-act="go" data-to="1">Get started</button></div>`;
}
function disasterCard(which,setups,d,title,hint){
  const list=disasterList(setups);
  const one=(s,o,name)=>{const word=o.kind==='t'?['taken','safe']:['gone','still there'];
    return `<div class="dres ${o.bad?'bad':'ok'}"><div class="body">${name?`<b>${name}</b>`:''}
      <div class="dkeys"${(s.n===1&&!TL(s))||custodial(s)?' hidden':''}>${s.keys.map((k,i)=>`<span class="dk${o.hit[i]?' hit':''}"><span class="tok" style="--kc:var(--k${i})">${LETTERS[i]}</span>${word[o.hit[i]?0:1]}</span>`).join('')}${o.rhit==null?'':`<span class="dk${o.rhit?' hit':''}"><span class="tok" style="--kc:var(--base-bar)">R</span>${word[o.rhit?0:1]}</span>`}</div>
      <span>${o.text}</span><span class="st lv-${o.bad?'high':'low'}">${o.verdict}</span></div></div>`};
  // In its dialog: a grid of tiles to pick from, then the result.
  const head=(icon,text)=>`<div class="simhead"><span class="emo" aria-hidden="true">${icon}</span><h3>${text}</h3><button class="simx" data-act="simClose" aria-label="Close">×</button></div>`;
  if(d&&!S.simList)return head(d.icon,d.label)+`<div role="status" class="dcmp">${one(setups[0],d.res[0],'')}</div>
    <div class="rowb"><button class="btn small" id="dis-today" data-act="disaster" data-w="today">🎲 Throw another</button><button class="btn small ghost" data-act="simList">Back to the list</button></div>`;
  const icon=e=>e.supply?'🚚':e.brand?'🐞':ICON[e.id]||'⚠️';
  const tiles=k=>`<div class="dtiles">${list.filter(x=>x[0]===k).map(x=>`<button type="button" class="dtile" data-act="disaster" data-w="today" data-id="${x[1].id}"><span aria-hidden="true">${icon(x[1])}</span>${elabel(x[1],setups)}</button>`).join('')}</div>`;
  return head('🔥',title)+`<button class="btn dsurprise" id="dis-today" data-act="disaster" data-w="today">🎲 Surprise me</button>
    <h4>Theft</h4>${tiles('t')}<h4>Loss</h4>${tiles('l')}`;
}
function setupList(s){
  const AT={home:'at home',office:'at the office',relative:'at a relative’s place',friend:'at a friend’s place',bank:'in the bank box',carry:'on you'};
  const up=x=>x[0].toUpperCase()+x.slice(1),rows=[];
  const dev=k=>isProv(k)?`${DEVICES[k.device].toLowerCase()} (${BRANDS[k.brand]})`:k.device==='none'?'none, backup only':k.device==='hw'?BRANDS[k.brand]+' hardware signer':(k.net==='offline'?'offline ':'online ')+DEVICES[k.device].toLowerCase();
  if(custodial(s))rows.push(['Where',TYPES[s.type]],['Keys',{exchange:'Held by the exchange',fintech:'Held by the app’s company',bank:'Held by the bank or its partner firm',etf:'None. You hold shares, not bitcoin'}[s.type]],['Login',LOGINS[s.login||'sms']],['Withdrawals',s.wd==='on'?'Address allowlist or waiting period':'No extra protection']);
  else if(s.n===1){const k=s.keys[0];
    if(isProv(k))rows.push(['Device',up(dev(k))]);
    else{
      rows.push(['Device',up(dev(k))+(real(k)?`, ${k.pin==='none'?'no':k.pin} PIN, ${AT[k.dloc]}`:'')]);
      rows.push(['Backup',k.backup==='paper'||k.backup==='metal'?`${BACKUPS[k.backup]}, ${AT[k.bloc]}`:BACKUPS[k.backup]]);
      rows.push(['Seed',{device:k.device==='hw'?'Made by the device':'Made by the app',dice:'Device plus your dice rolls',diceonly:'Your dice rolls only',words:'Words you picked yourself'}[k.ent]]);
      rows.push(['Passphrase',k.pass==='none'?'None':k.pass==='memory'?`${up(k.pstr)}, memorized`:`${up(k.pstr)}, written down, ${AT[k.ploc]}`]);
    }
  }else{
    rows.push(['Keys',`${s.m} of ${s.n} needed to spend`]);
    s.keys.forEach((k,i)=>rows.push([`Key ${LETTERS[i]}`,up(dev(k))+(real(k)?`, ${AT[k.dloc]}`:'')]));
    if(s.m<s.n)rows.push(['Wallet file',CONFIGS[s.config]]);
  }
  if(TL(s)){rows.push(['Recovery',`${up(dev(s.rkey))}${real(s.rkey)?`, ${AT[s.rkey.dloc]}`:''}. Can spend alone after a year unmoved`]);if(!(s.n>1&&s.m<s.n))rows.push(['Wallet file',CONFIGS[s.config]])}
  return `<dl class="spec">${rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
}
function startFrom(){
  return `<div class="rowb"><span class="hint">Start from</span>${[['hot','Phone wallet'],['laptop','Laptop wallet'],['typical','Hardware wallet'],['exchange','Exchange'],['fintech','Payment app'],['bank','Bank or broker'],['etf','ETF'],['m23','2-of-3 on your own'],['prov','2-of-3 with a provider'],['prov5','3-of-5 with a provider']].map(([p,l])=>`<button class="btn ghost small" data-act="preset" data-w="base" data-p="${p}">${l}</button>`).join('')}</div>`;
}
function screenMap(which){
  // The map shows the setup. Its two buttons open the disaster panel and the edit form, each in a dialog (see render).
  // The map fills the screen. Neither screen keeps the risks on show: Today's introduction says them once, Build
  // shows how they moved after each change, and the edit dialog always has them (see riskLine), with the scoreboard.
  const tool=(attrs,on,icon,name,short)=>`<button class="maptool" ${attrs}${on==null?'':` aria-pressed="${on}"`} aria-label="${name}" title="${name}"><span aria-hidden="true">${icon}</span>${short}</button>`;
  const intro=which==='base'&&S.mapIntro==='run',word={low:'Low',mid:'Medium',high:'High'};
  // A disaster that can be shown on the map plays there, and its result is a bar over the map instead of a dialog.
  // Disasters stack up until the coins are gone or the player resets (see throwDisaster).
  const R=S.run,d=R&&S.mapDis,o=d&&d.res[0],over=R&&R.over;
  const fx=d?fxOf(d,R):null;
  // The card is a sticker like the map's buttons: the disaster's emoji in a badge on its corner, and the verdict stamped
  // on. When the coins are gone and there is an answer, it can turn over ("How could I have stopped it?") to show the
  // hand-written solution for this kind of disaster: a low-effort one, and an alternative or a bigger step (stoppers()
  // in model.js). The × in its corner closes it and puts the map back as it was, which ends a run of disasters too.
  // Turning it over is done in the page, without a redraw, so the disaster on the map doesn't play again. On the Build
  // screen the change can be made there and then.
  const fixes=fx&&over?stoppers(S[which],d.ev,d.kind,which==='mine'):[];
  const btn=(act,text,cls)=>`<button type="button" class="mrbtn${cls?' '+cls:''}" data-act="${act}">${text}</button>`;
  const fixrow=(x,i)=>`<div class="mrdo">${x.how==='big'?'<small>A bigger step</small>':i?'<small>Or</small>':''}<strong>${x.do}</strong><span>${x.why}</span>${which!=='mine'?'':x.later?'<span>You can do that in the next step, “Try using it”.</span>':`<button type="button" class="mrbtn main" data-act="mapStop" data-i="${i}">Do it</button>`}</div>`;
  const result=fx?`<div class="mapresult ${over?'bad':'ok'}" role="status"><span class="mrbadge" aria-hidden="true">${d.icon}</span><button type="button" class="mrx" data-act="mapDisDone" aria-label="Close" title="Close">×</button>
      <div class="mrface"><b>${d.label}</b>${tagline(d.id,d.label)?`<i class="tagline">${tagline(d.id,d.label)}</i>`:''}
        <div class="mrbody"><span>${o.text}${over&&over.text?' '+over.text:''}${R.n?` <small class="runs">${over?`You had survived ${R.n}.`:`Survived ${R.n} in a row.`}</small>`:''}</span><span class="mrstamp">${over?over.verdict:'Coins safe'}</span></div>
        ${over?(fixes.length?`<div class="mrbtns">${btn('mapWhy','💡 How could I have stopped it?','main')}</div>`:''):`<div class="mrbtns">${btn('mapAnother','🎲 Another','main')+btn('simPick','Choose one…')}</div>`}</div>
      ${fixes.length?`<div class="mrfix"><b>💡 How to stop it</b>
        ${fixes[0].how==='big'?'<div class="mrdo"><span>There is no quick fix for this one.</span></div>':''}${fixes.map(fixrow).join('')}
        <div class="mrbtns">${btn('mapWhy','← Back')}</div></div>`:''}</div>`:'';
  // The Build screen is the same map showing the new setup. Its chip compares each risk with the current setup's, and
  // while no disaster is playing it offers the model's next recommended changes as cards that apply with one tap.
  /* The Build screen is the same map showing the new setup, and it shows things only once they mean something.
     - You arrive at a copy of the current setup, with a banner ("Now build your new setup.") and two ways to build:
       "Suggest a step" opens the model's next recommended changes, a small one and a big one, which apply with one
       tap; "Edit it myself" opens the edit form.
     - After every change, by either route or from a disaster's "Do it", a card says once what changed and how the two
       risks moved, and offers to test the new setup with a disaster (S.change; see noteChange).
     - Once the new setup differs from the current one (or there is nothing left to suggest), the way forward appears,
       "Try using it", and so does "Try a disaster". */
  const build=which==='mine',built=build&&isBuilt();
  const tips=build?bestChanges(S.mine,true):null,none=tips&&!tips.small&&!tips.big,fwd=!build||built||none;
  const tip=(k,title,x)=>x?`<button class="mapcardtip" data-act="mapApply" data-k="${k}"><small>${title}</small><b>${x.do}</b><span>Theft ${x.from.theft} → ${x.to.theft} · Loss ${x.from.loss} → ${x.to.loss}</span></button>`:'';
  const cards=build&&S.suggest&&!fx?`<div class="mapcards"><div class="mapcardshead"><b>${none?'💡 Suggestions':'💡 Pick a step'}</b><button type="button" class="mrx" data-act="suggest" aria-label="Close" title="Close">×</button></div>${tip('small','A small step',tips.small)}${tip('big','A big step',tips.big)}${none?'<div class="mapcardtip done"><b>Nothing more to suggest.</b><span>From here, every change trades one risk for another.</span></div>':''}</div>`:'';
  const c=build&&!fx&&!cards?S.change:null;
  const moved=(name,a,z)=>`<span><i style="background:${riskColor(z)}"></i>${name} <b>${a===z?`${word[level(z)]} ${z}`:`${word[level(a)]} ${a} → ${word[level(z)]} ${z}`}</b>${a===z?' <small>no change</small>':''}</span>`;
  const change=c?`<div class="mapresult ok change" role="status"><span class="mrbadge" aria-hidden="true">✅</span><button type="button" class="mrx" data-act="changeDone" aria-label="Close" title="Close">×</button>
      <div class="mrface"><b>${c.what||'You edited your setup.'}</b>
        <div class="mrrisks">${moved('Theft risk',c.from.theft,c.to.theft)}${moved('Loss risk',c.from.loss,c.to.loss)}</div>
        <div class="mrbtns">${btn('changeTest','🔥 Test it with a disaster','main')+btn('scores','📊 Compare with today')}</div></div></div>`:'';
  const banner=build&&!built&&!fx&&!cards&&!change?`<div class="mapbanner" role="status"><b>Now build your new setup.</b><span>${none?'There is nothing to suggest for this one. You can still edit it yourself.':'Get a suggestion, or edit it yourself if you already know the setup you want.'}</span></div>`:'';
  const tools=build
    ?(built?tool('data-act="simBase"',!!S.mapDis,'🔥','Simulate a disaster','Try a disaster'):'')+tool('data-act="suggest"',!!S.suggest,'💡','Suggest a step','Suggest a step')+tool('data-act="editBase"',S.editBase,'✏️','Edit it myself','Edit it myself')
    :tool('data-act="simBase"',!!S.mapDis,'🔥','Simulate a disaster','Try a disaster')+tool('data-act="editBase"',S.editBase,'✏️','Edit current setup','Edit current setup');
  return `<h2 class="sr">${build?'Build your new setup':'Your setup today'}</h2>
  <div class="mapcard${intro?' mapintro':''}${build?' build':''}${build&&fwd?' fwd':''}${result||cards||change?' lift':''}">${SetupMap.svg(S[which],fx)}${built?'<span class="maplabel">Your new setup</span>':''}${result}${cards}${change}${banner}${intro?'<svg class="mapline" aria-hidden="true"></svg><div class="mapcap" role="status"></div>':''}
    <div class="maptools">${tools}${fwd?`<button class="maptool next" data-act="go" data-to="${build?3:2}"><span aria-hidden="true">${build?'🧪':'🚀'}</span>${build?'Try using it →':'Improve it →'}</button>`:''}</div></div>`;
}
// The new setup counts as built once it differs from the current one. "Tested" is about using it, not what it is.
const sameSetup=(a,b)=>{const f=s=>JSON.stringify({...s,tested:0});return f(a)===f(b)};
const isBuilt=()=>!!S.mine&&!sameSetup(S.mine,S.base);
// Every change to the new setup on the Build map goes through here: do() makes it, and if the setup is different
// afterwards, the "what changed" card is set to show the move from just before this change to just after it.
function noteChange(what,make){
  const before=clone(S.mine),from=scoreOf(S.mine);
  make();
  if(sameSetup(before,S.mine))return false;
  const to=scoreOf(S.mine);
  S.change={what,from:{theft:from.theft,loss:from.loss},to:{theft:to.theft,loss:to.loss}};S.suggest=false;
  return true;
}
function screenToday(){return screenMap('base')}
function screenBuild(){return screenMap('mine')}
/* ---------- Use it ---------- */
/* The new setup's map again, and a short run of errands done on it one at a time. A card in the corner says what to do
   next and has the one or two buttons for it; two pills at the top show the coins in the old setup and in the new one.
     choose   send a small test, or send it all. Sending it all without a test always loses the lot (after a dice roll).
     recover  every device is wiped, and you walk to each backup to bring the keys back. A key with no backup is gone;
              if that leaves too few keys to spend, the test amount is lost and the way on is back to Build.
     back     the test is sent back: you walk to the keys that sign. This is where a setup's daily effort is felt.
     rest     the rest of the coins move over, and that is the end ("done").
   A setup held by a company has no keys to restore, so it skips "recover" and sends the test back by logging in.
   The walking and the flying coins are done in the page while the card is "busy" (useBusy); the state only changes when
   an errand has finished, so leaving half way leaves you where you were. S.w.for is the setup these errands were done
   with: arrive with a different one and they start again (see go). */
const TEST=1e6;
function newUse(setup){return{old:SATS,vault:0,stage:'choose',note:'',bad:false,lost:0,for:setup?clone(setup):null}}
function screenUse(){
  const w=S.w,st=S.mine,cust=custodial(st);
  if(st.type==='etf')return `<h2>Use it</h2>
  <p class="lede">With an ETF there is nothing to try here.</p>
  <div class="card"><h3>An ETF is shares, not bitcoin</h3><p class="hint" style="margin-top:4px">You can’t send, receive or spend the coins. To pay for anything you sell shares through your broker, during market hours.</p></div>
  <div class="rowb"><button class="btn ghost" data-act="go" data-to="2">Change your setup</button><button class="btn" data-act="go" data-to="4">Finish →</button></div>`;
  const into=cust?HOLDER[st.type]:'your new setup';
  const btn=(act,text,main,to)=>`<button type="button" class="mrbtn${main?' main':''}" data-act="${act}"${to==null?'':` data-to="${to}"`}>${text}</button>`;
  const [text,buttons]={
    choose:[`Time to move your coins into ${into}. Send a small test first, or send it all?`,btn('useTest','🧪 Send a small test',1)+btn('useAll','Send it all')],
    recover:['The test arrived. Now check you could get it back if every device broke.',btn('useRecover','💥 Wipe my devices and recover',1)],
    back:[cust?'The test arrived. Now send it back, to check you can get coins out again.':'Now send the test back, to prove you can spend from it.',btn('useBack','↩️ Send the test back',1)],
    rest:['Everything checks out.',btn('useRest','🚚 Move the rest',1)],
    done:[`All ${btc(w.vault)} is in ${into} now.`,btn('go','Finish →',1,4)+btn('useReset','↺ Do it again')],
    lost:[`You moved ${btc(w.lost)} without a test first, and something was wrong: a mistyped address, a bad backup, or a wallet that wasn’t set up the way you thought.`,btn('useReset','Try again with 1 BTC',1)],
    failed:[`Only the test was lost: ${btc(TEST)}. The rest is still in your old setup.`,btn('go','🔧 Fix it in Build',1,2)+btn('useReset','↺ Start again')],
  }[w.stage];
  return `<h2 class="sr">Use your new setup</h2>
  <div class="mapcard use">${SetupMap.svg(st)}
    <div class="usehud"><span class="usebal" id="use-old"><small>Old setup</small><b>${btc(w.old)}</b></span><i aria-hidden="true">→</i><span class="usebal new" id="use-new"><small>${cust?ACCT[st.type]:'New setup'}</small><b>${btc(w.vault)}</b></span></div>
    <div class="usecap" role="status">${w.note?`<b class="usenote${w.bad?' bad':''}">${w.note}</b>`:''}<span class="usetext">${text}</span><div class="mrbtns">${buttons}</div></div></div>`;
}
/* One errand at a time. While it runs the card shows only what is happening; "live" tells the job whether the map it
   started on is still the one on screen. Returns whether the errand is still the current one, i.e. whether its result
   should be kept: leaving the screen (go) starts a new count and drops it. If the map was zoomed in, as it starts on a
   phone, it follows you about and then goes back to where it was. */
let useRun=0,useAt=null;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function useBusy(job){
  const card=document.querySelector('.mapcard.use');if(!card||card.classList.contains('usebusy'))return false;
  const id=++useRun,view={...MV},live=()=>id===useRun&&card.isConnected;
  useAt=SetupMap.here();card.classList.add('usebusy');
  await job(card,live);
  if(id!==useRun)return false;
  if(view.k>1.05){setMapView(view.k,view.x,view.y,view.home);setTimeout(()=>{if(id===useRun)document.body.classList.remove('mapglide')},900)}
  return true;
}
const useSay=(card,html)=>{const e=card.querySelector('.usetext');if(e)e.innerHTML=html};
// An emoji popping up over a thing. Things you carry are drawn inside you, so theirs goes there and walks with you.
function usePop(card,x,y,emoji,you){
  const g=card.querySelector(you?'.mapyou':'svg.map');if(!g)return;
  const e=document.createElementNS('http://www.w3.org/2000/svg','text');
  e.setAttribute('x',x);e.setAttribute('y',y);e.setAttribute('text-anchor','middle');e.setAttribute('font-size',28);e.setAttribute('class','usepop');e.textContent=emoji;g.appendChild(e);
}
const usePopOn=(card,t,emoji)=>usePop(card,t.x,t.y-56,emoji,t.loc==='carry');
const useFate=(card,t,gone)=>{const e=card.querySelector(`.maptap[data-i="${t.i}"] .mapfate`);if(e)e.classList.toggle('usegone',gone)};
// You walk by sliding everything that is you. Reduced motion: no slide and no camera move, you are simply there.
async function useWalk(card,x,y){
  const g=card.querySelector('.mapyou'),me=SetupMap.here();if(!g)return;
  const ms=calm?0:Math.max(450,Math.min(1400,Math.hypot(x-useAt.x,y-useAt.y)*4));
  g.style.transition=calm?'none':`transform ${ms}ms ease-in-out`;g.style.transform=`translate(${x-me.x}px,${y-me.y}px)`;g.classList.add('walking');
  if(MV.k>1.05){ // zoomed in: keep you in the middle
    const m=card.querySelector('.map').getBoundingClientRect(),u=Math.min(m.width/MV.k/800,m.height/MV.k/560);
    document.body.classList.add('mapglide');setMapView(MV.k,(400-x)*u*MV.k,(280-(y-50))*u*MV.k);
  }
  useAt={x,y};await wait(calm?350:ms);g.classList.remove('walking');
}
// What is on the map, and how to talk about it. A thing kept at a place is walked to; one you carry, one in the cloud
// and one a company holds are not.
function useCtx(){
  const st=S.mine,T=SetupMap.things(),keys=allKeys(st),one=st.n===1&&!TL(st);
  const kk=i=>TL(st)&&i===keys.length-1?'R':i,name=k=>k==='R'?'The recovery key':one?'Your key':'Key '+LETTERS[k];
  const far=t=>!!t&&PLACES[t.loc]&&t.loc!=='carry';
  // where to stand: beside the row of things kept at that place, on the side nearer the middle of the island
  const stand=t=>{const xs=T.filter(x=>x.loc===t.loc).map(x=>x.x),a=Math.min(...xs),b=Math.max(...xs);return{x:(a+b)/2<350?b+44:a-44,y:t.y+6}};
  return{st,T,keys,kk,name,far,stand,find:(role,k)=>T.find(t=>t.role===role&&t.k===k)};
}
// Do the stops in order: the ones that need no walk first, then the rest, nearest first. Returns the places walked to.
async function useStops(card,live,c,stops){
  const near=stops.filter(s=>!c.far(s.t)),walk=stops.filter(s=>c.far(s.t)),places=[];
  let at=SetupMap.here();
  while(walk.length){const d=s=>Math.hypot(s.t.x-at.x,s.t.y-at.y);walk.sort((a,b)=>d(a)-d(b));const s=walk.shift();near.push(s);at=s.t}
  for(const s of near){
    if(!live())return places;
    if(c.far(s.t)){
      if(!places.includes(s.t.loc)){places.push(s.t.loc);useSay(card,`🚶 ${s.t.loc==='home'?'Going home':'Off to '+PLAIN[s.t.loc]}…`)}
      const p=c.stand(s.t);await useWalk(card,p.x,p.y);if(!live())return places;
    }
    useSay(card,s.text);
    if(s.t)usePopOn(card,s.t,s.mark);else{const me=SetupMap.here();usePop(card,me.x+30,me.y-150,s.mark,true)}
    if(s.back){useFate(card,s.back,false);usePopOn(card,s.back,'✅')}
    await wait(1300);
  }
  if(live()&&places.length){useSay(card,'🚶 And back again…');const me=SetupMap.here();await useWalk(card,me.x,me.y)}
  return places;
}
const useList=a=>a.length>1?a.slice(0,-1).join(', ')+' and '+a[a.length-1]:a[0]||'';
const usePlaces=p=>p.length?`${p.length} ${p.length===1?'stop':'stops'}: ${useList(p.map(l=>PLAIN[l]))}`:'';
// Coins hop from one pill to the other, or (sink) fall off the bottom of the map.
async function useCoins(card,from,to,n,sink){
  const A=$(from),B=$(to);if(!A||!B||calm)return wait(450);
  const c=card.getBoundingClientRect(),a=A.getBoundingClientRect(),b=B.getBoundingClientRect();
  const x0=a.left+a.width/2-c.left,y0=a.top+a.height/2-c.top,x1=sink?c.width/2:b.left+b.width/2-c.left,y1=sink?c.height+40:b.top+b.height/2-c.top;
  await Promise.all(Array.from({length:n},(_,i)=>{
    const e=document.createElement('i');e.className='usecoin';e.textContent='₿';card.appendChild(e);
    return e.animate([{transform:`translate(${x0}px,${y0}px) scale(.6)`,opacity:0},{opacity:1,offset:.15},
      {transform:`translate(${(x0+x1)/2}px,${sink?y0+70:Math.max(y0,y1)+44}px) scale(1.2)`,opacity:1,offset:sink?.3:.5},
      {transform:`translate(${x1}px,${y1}px) scale(.7)`,opacity:sink?0:1}],{duration:sink?1500:800,delay:i*140,easing:'ease-in-out',fill:'both'}).finished.then(()=>e.remove(),()=>{});
  }));
}
async function useTest(){
  const w=S.w;
  if(!await useBusy(async card=>{useSay(card,'🧪 Sending a small test…');await useCoins(card,'use-old','use-new',1)}))return;
  w.old-=TEST;w.vault+=TEST;w.note='';w.bad=false;w.stage=custodial(S.mine)?'back':'recover';render();
}
async function useAll(){
  const w=S.w;
  if(!await useBusy(async(card,live)=>{
    useSay(card,'<span class="die" aria-hidden="true">🎲</span> Rolling the dice… You’re moving everything without a test first.');await wait(1500);
    if(!live())return;
    useSay(card,'💸 Something was wrong.');await useCoins(card,'use-old','use-new',3,true);
  }))return;
  w.lost=w.old;w.old=0;w.note='💸 You lost it all.';w.bad=true;w.stage='lost';render();
}
async function useRecover(){
  const w=S.w,c=useCtx(),st=c.st,stops=[],lost=[];
  c.keys.forEach((k,i)=>{
    if(isProv(k))return;
    const id=c.kk(i),N=c.name(id),dev=c.find('device',id),bak=c.find('backup',id),note=c.find('pass',id),mem=k.pass==='memory'?' The passphrase came from memory too.':'';
    if(k.backup==='none'){if(id!=='R')lost.push({N,dev});return}
    if(bak)stops.push({t:bak,back:dev,mark:'✅',text:`${N}: restored from the ${bak.loc==='cloud'?'seed kept in the cloud':`${bak.t==='steel'?'metal':'paper'} backup ${AT[bak.loc]}`}.${mem}`});
    else stops.push({t:null,back:dev,mark:'🧠',text:`${N}: you typed the seed in from memory.${mem}`});
    if(note)stops.push({t:note,mark:'✅',text:`${N}: and its passphrase, from the note ${AT[note.loc]}.`});
  });
  const file=st.config==='one'&&c.T.find(t=>t.role==='file');
  if(file)stops.push({t:file,mark:'✅',text:`The wallet file, picked up ${AT[file.loc]}.`});
  let places=[];
  if(!await useBusy(async(card,live)=>{
    const devs=c.T.filter(t=>t.role==='device');
    devs.forEach(t=>{useFate(card,t,true);usePopOn(card,t,'💥')});
    useSay(card,devs.length?'💥 Every device is wiped.':'There is no device to wipe. Restoring from the backups anyway.');await wait(1400);
    places=await useStops(card,live,c,stops);
    for(const x of lost){if(!live())return;useSay(card,`${x.N} has no backup. Nothing brings it back.`);if(x.dev)usePopOn(card,x.dev,'❌');await wait(1500)}
  }))return;
  // Too few keys left to spend, or keys missing with no wallet file to find the coins with the others: it failed.
  const names=lost.map(x=>x.N),who=useList(names),has=names.length>1?'have':'has';
  const nofile=(st.m<st.n||TL(st))&&st.config==='none'&&!st.keys.some(isProv),short=st.n-lost.length<st.m;
  if(lost.length&&(short||nofile)){
    w.vault=0;w.bad=true;w.stage='failed';
    w.note=`❌ Recovery failed. ${who} ${has} no backup${st.n===1?', so wiping the device destroyed it':short?`, so you can’t reach the ${st.m} keys needed to spend`:', and without a backup of the wallet file the keys you have left can’t find the coins'}.`;
  }else{
    st.tested=true;w.bad=false;w.stage='back';
    w.note=`✅ Recovery worked${places.length?', after '+usePlaces(places):', without leaving the spot'}.`+
      (lost.length?` In a real wipe ${who} would be gone for good: no backup.`:nofile?' It only worked because every key came back: the wallet file has no backup.':'');
  }
  render();
}
async function useBack(){
  const w=S.w,c=useCtx(),st=c.st;
  if(custodial(st)){
    const login=c.T.find(t=>t.role==='login'),who=HOLDER[st.type];
    if(!await useBusy(async card=>{
      useSay(card,`🔑 You log in and ask ${who} to send it.`);if(login)usePopOn(card,login,'🔑');await wait(1300);
      await useCoins(card,'use-new','use-old',1);
    }))return;
    w.vault-=TEST;w.old+=TEST;w.bad=false;w.stage='rest';
    w.note=`↩️ The test came back. ${who[0].toUpperCase()+who.slice(1)} signed for you: no keys needed, and no say if it ever refuses.`;
    return render();
  }
  // the keys that sign: the easiest ones to get to, as many as the setup needs. A key the recovery couldn't have
  // brought back (no backup) is only used if nothing else is as near.
  const DEV={signer:'hardware signer',phone:'phone',laptop:'laptop'},me=SetupMap.here(),dist=t=>c.far(t)?1+Math.hypot(t.x-me.x,t.y-me.y)/100:0;
  const can=st.keys.map((k,i)=>{
    const N=c.name(i),dev=c.find('device',i),bak=c.find('backup',i);
    if(isProv(k))return{cost:.5,t:c.find('provkey',i),mark:'✍️',text:`${N}: the provider co-signs online.`};
    if(dev)return{cost:dist(dev)+(k.backup==='none'?.3:0),t:dev,mark:'✍️',text:`${N}: signed on the ${DEV[dev.t]} ${dev.loc==='carry'?'in your pocket':AT[dev.loc]}.`};
    if(k.backup==='none')return null;
    return{cost:4+dist(bak),t:bak||null,mark:'✍️',text:`${N}: it has no device, so you restored it from ${bak?'its backup':'memory'} to sign.`};
  }).filter(Boolean).sort((a,b)=>a.cost-b.cost).slice(0,st.m);
  let places=[];
  if(!await useBusy(async(card,live)=>{
    places=await useStops(card,live,c,can);
    if(live()&&can.length>=st.m)await useCoins(card,'use-new','use-old',1);
  }))return;
  if(can.length<st.m){w.vault=0;w.bad=true;w.stage='failed';w.note=`❌ You can’t spend. This setup needs ${st.m} keys to sign and only ${can.length} can.`;return render()}
  w.vault-=TEST;w.old+=TEST;w.bad=false;w.stage='rest';
  w.note=`↩️ The test came back. That took ${st.m} ${st.m===1?'signature':'signatures'} and ${places.length?usePlaces(places):'no trip at all'}.`;
  render();
}
async function useRest(){
  const w=S.w;
  if(!await useBusy(async card=>{useSay(card,'🚚 Moving the rest…');await useCoins(card,'use-old','use-new',3)}))return;
  w.vault+=w.old;w.old=0;w.note='🎉 Done.';w.bad=false;w.stage='done';render();
}
// The last screen is only about passing the game on, with a party on the island under it (SetupMap.party). Like the map
// screens it has the sea for a background and no scoreboard. Disasters and scores live on the map screens.
function screenShare(){
  return `<div class="party"><div class="finish"><h2>That’s the game.</h2>
  <p class="lede">If you found it fun or useful, share it with someone who might too.</p>
  <div class="card share"><button class="btn cta" data-act="share">${S.shared?'✓ Link copied':'📣 Share the simulator'}</button>
    <a href="${SHARE_URL}">${SHARE_URL.replace('https://','')}</a>
    <p class="hint">This shares a link to the simulator and nothing else.</p></div>
  <div class="rowb"><button class="btn ghost small" data-act="go" data-to="2">Back to your setup</button><button class="btn ghost small" data-act="reset">Start over</button></div></div>${SetupMap.party()}</div>`;
}
function feedbackText(){
  const c=S.conf;
  return `Self-custody simulator note\n${S.note||'(empty)'}`;
}
function tipHTML(t){
  const f=t.from,to=t.to,x=[];
  if(!t.plain){
    if(to.theft-f.theft>=2)x.push(`It does make theft ${to.theft-f.theft>=10?'noticeably':'a little'} more likely.`);
    if(to.loss-f.loss>=2)x.push(`It does make loss ${to.loss-f.loss>=10?'noticeably':'a little'} more likely.`);
    const e=[to.setup>f.setup?'to set up':'',to.spend>f.spend?'to spend':''].filter(Boolean);
    if(e.length)x.push(`It takes more effort ${e.join(' and ')}.`);
  }
  return `<span class="do">${t.do}</span><span class="why">${t.why}${x.length?' '+x.join(' '):''}</span>${t.pot?`<span class="why">${t.pot}</span>`:''}`;
}
function summaryBody(s){
  const x=summarize(s),li=a=>a.map(t=>`<li>${t}</li>`).join('');
  return `<div class="sumgrid">
      <div class="pro"><h4>What it does well</h4><ul>${li(x.pros)||'<li>Not much. Most of the disasters we test get through.</li>'}</ul></div>
      <div class="con"><h4>Where it’s weak</h4><ul>${li(x.cons)||'<li>Nothing stands out. None of our disasters is likely to get through.</li>'}</ul></div>
    </div>
    ${x.tips.small?`<div class="tip"><b>Low effort</b>${tipHTML(x.tips.small)}</div>`:''}
    ${x.tips.big?`<div class="tip"><b>High effort</b>${tipHTML(x.tips.big)}</div>`:''}
    ${!x.tips.small&&!x.tips.big?'<div class="tip"><b>Next step</b>No single change clearly improves it. From here, every step trades one risk for another.</div>':''}
    <p class="hint" style="margin-top:10px">There’s no one best setup for everyone. Pick the trade-offs that work for you.</p>`;
}
function perfectHTML(){
  return `<div class="how">
    <div class="howhead"><h2 id="howtitle">There is no perfect setup</h2><button class="x" data-act="howClose" aria-label="Close">×</button></div>
    <div><h3>Advice is written for the average person</h3>
      <p>Most guidance describes best practice for an average person. People aren’t all the same. A setup that is easy and safe for one person can be confusing and risky for another, so the right one for you is one you understand and can keep up.</p></div>
    <div><h3>Every setup rests on trust in something</h3>
      <p>Holding bitcoin means trusting the maths behind its keys, the wallet software, the people who make the hardware and, for some, a company that holds a key. Any of these can fail in ways nobody has seen yet.</p></div>
    <div><h3>What this simulator can’t score</h3>
      <ul class="plain"><li>A break in the maths itself, such as quantum computers that can work out a private key.</li><li>Bugs in bitcoin or in the wallet software everyone uses.</li><li>Bitcoin’s price. It swings a lot, and we don’t score that. We assume you’re holding for the long term and trust it to grow in value.</li><li>Anything nobody has thought of yet.</li></ul>
      <p class="hint" style="margin-top:6px">More keys don’t help with any of these. Every key in a 3-of-5 relies on the same maths, so a break that exposes one key can expose them all.</p></div>
    <div><h3>Some things no setup protects against</h3>
      <p>If someone threatens you in person to get your bitcoin, nothing in this simulator is a solution, and we won’t pretend otherwise. That is why it isn’t one of the disasters here.</p>
      <p>The most anyone can do is lower the odds of being singled out, so take your privacy seriously:</p>
      <ul class="plain"><li>Don’t brag about owning bitcoin, online or in person, and don’t say how much.</li><li>Don’t wear obvious bitcoin clothing or accessories in public.</li><li>Be careful about giving your name and home address to bitcoin-related companies. Customer lists get leaked.</li><li>Think about where bitcoin hardware is delivered, and who can see it arrive.</li></ul></div>
    <div><h3>Stay able to move</h3>
      <p>If bitcoin ever needs a new kind of address, for example a quantum-safe one, you would have to move your coins while there is still time. So keep an eye on the news, and keep a setup you can actually operate: keys you can reach, backups you have tested, secrets you still remember.</p></div>
    <div><h3>Even the best setup can go wrong</h3>
      <p>A 3-of-5 spread across brands and places can still fail. The more elaborate a setup is, the easier it is to lock yourself out, and that is as real a way to lose coins as theft.</p></div>
    <div><h3>What we’re trying to do</h3>
      <p>Make it easier to take one good step in your own custody journey: a setup a little better than today’s, that you will actually keep up.</p></div>
  </div>`;
}
function recHTML(applied){
  const t=bestChanges(S.mine,true),sc=scoreOf(S.mine);
  const card=(k,title,x)=>x?`<div class="tip"><b>${title}</b>${tipHTML(x)}<div style="margin-top:10px"><button class="btn small" data-act="applyRec" data-k="${k}">Apply to my build</button></div></div>`:'';
  return `<div class="how">
    <div class="howhead"><h2 id="howtitle">A recommendation</h2><button class="x" data-act="howClose" aria-label="Close">×</button></div>
    ${applied?`<p class="receipt" role="status">Applied. Your build is now at theft ${sc.theft} and loss ${sc.loss}.</p>`:''}
    <p>${S.picked.mine?'Based on the setup you’re building right now.':'Based on your setup today, since you haven’t changed anything yet.'} Apply one and the next suggestions appear here, until there are none left.</p>
    ${card('small','Low effort',t.small)}${card('big','High effort',t.big)}
    ${!t.small&&!t.big?'<div class="tip"><b>Nothing more to suggest</b>No further change clearly improves it. From here, every step trades one risk for another.</div>':''}
    <p class="hint">There’s no one best setup for everyone. Pick the trade-offs that work for you.</p>
  </div>`;
}
function howHTML(){
  const which=S.mine&&S.how==='mine'?'mine':'base',s=S[which],sc=scoreOf(s),d=drivers(s),rows=breakdown(s);
  const delta=(n,v,tip)=>`<button type="button" class="delta ${v>0?'up':v<0?'down':''}" data-tip="${esc(tip)}" aria-label="${n} ${v>0?'up '+v:v<0?'down '+(-v):'unchanged'}. ${esc(tip)}">${n} ${v>0?'+'+v:v<0?'−'+(-v):'0'}</button>`;
  const drv=a=>a.length?`<ul class="drv">${a.map(x=>`<li>${x.label}<small>Chance it happens in ten years: ${x.w}. Chance it costs you the coins if it does: ${x.p}.</small></li>`).join('')}</ul>`:'<p class="hint">Nothing on our list gets through.</p>';
  return `<div class="how">
    <div class="howhead"><h2 id="howtitle">Your scores explained</h2><button class="x" data-act="howClose" aria-label="Close">×</button></div>
    ${S.mine?`<div><span class="seg" role="group" aria-label="Which setup">${[['base','Before'],['mine','Now']].map(([v,l])=>`<button data-act="howWhich" data-v="${v}" aria-pressed="${which===v}">${l}</button>`).join('')}</span></div>`:''}
    <div><h3>In plain words</h3>${summaryBody(s)}</div>
    <div><h3>Theft and loss</h3>
      <div class="defs"><div><b>Theft risk</b>Someone else ends up in control of your coins. A burglar finds your seed, malware reaches your phone, a company holding them is hacked, or your account is frozen or seized.</div><div><b>Loss risk</b>Nobody can spend them, including you. A device dies with no backup, a passphrase is forgotten, or a fire destroys the only copy.</div></div>
      <p class="hint">The two often pull against each other. More copies and simpler secrets make loss less likely and theft more likely.</p></div>
    <div><h3>Control</h3>
      <p>Control is about whose coins they are. In an ETF you hold shares, not bitcoin. On an exchange, in an app or at a bank, a company holds the keys. With a provider you share them. In self custody only your keys can move them. The theft and loss scores don’t capture this, so it’s shown separately.</p></div>
    <div><h3>Setup and spending effort</h3>
      <p>Setup effort is the one-time work: how many keys, places, backups and secrets you have to arrange, and any hardware signer you have to buy and learn. Spending effort is the work every time you send: how many signers you need, where they are and how they connect. Receiving is always easy, because you only share an address.</p></div>
    <div><h3>How the scores work</h3>
      <p>We keep a list of things that can go wrong over ten years, each with a rough chance of happening. For each one we work out the chance your setup loses the coins. Added up and put on a 0 to 100 scale, that is your score. Lower is better.</p>
      <p class="hint" style="margin-top:6px">The chances are our estimates, so trust the comparison between setups more than the exact numbers.</p></div>
    <div><h3>Your setup, piece by piece</h3>
      <p class="hint" style="margin-bottom:6px">${custodial(s)?'A company holds the keys, so your login is the one piece you control. Hover over or tap a number to see why.':'How each choice moves the scores, compared with the alternative shown. Hover over or tap a number to see why. Points don’t add up exactly, because risks overlap.'}</p>
      ${rows.map(r=>`<div class="piece"><span>${r.label}<small>compared with ${r.vs}</small></span><span class="ds">${delta('Theft',r.dT,r.whyT)}${delta('Loss',r.dL,r.whyL)}</span></div>`).join('')}
    </div>
    <div><h3>What drives theft risk (${sc.theft})</h3>${drv(d.theft)}</div>
    <div><h3>What drives loss risk (${sc.loss})</h3>${drv(d.loss)}</div></div>`;
}
function riskColor(v){
  const t=Math.max(10,Math.min(60,v)),mix=(hi,lo,p)=>`color-mix(in oklch,var(--${hi}) ${Math.round(p*100)}%,var(--${lo}))`;
  return t<25?mix('yel','low',(t-10)/15):t<40?mix('mid','yel',(t-25)/15):mix('high','mid',(t-40)/20);
}
function scoreboard(R){
  const bar=(who,v,you)=>`<div class="bar${you?' you':R.mine?' was':''}"><span>${who}</span><span class="track"><span class="fill" style="width:${Math.max(4,v)}%;background:${riskColor(v)}"></span></span><span class="num">${v}</span></div>`;
  const dots=n=>'●'.repeat(n)+'○'.repeat(5-n);
  const meter=(name,f,top)=>`<div class="meter"><div class="name">${name}</div>${bar(R.mine?'Before':'Today',R.base[f])}${R.mine?bar('Now',R.mine[f],true):''}${R.mine&&R.mine[top]?`<div class="worry">Biggest worry: ${R.mine[top]}</div>`:''}</div>`;
  return `<button class="info" data-act="how" aria-label="How the scores work">i</button><h2>Scoreboard</h2><div class="meters">${meter('Theft risk','theft','tTop')}${meter('Loss risk','loss','lTop')}</div>
  <div class="effort ctrl"><div class="name">Control</div><span>${R.mine?'Before':'Today'}</span><span>${CTRL[R.base.control]}</span>${R.mine?`<span class="you">Now</span><span class="you">${CTRL[R.mine.control]}</span>`:''}</div>
  ${[['setup','Setup effort'],['spend','Spending effort']].map(([f,name])=>`<div class="effort"><div class="name">${name}</div><span>${R.mine?'Before':'Today'}</span>${f==='spend'&&S.base.type==='etf'?'<span>can’t spend bitcoin</span>':`<span class="dots">${dots(R.base[f])}</span>`}${R.mine?`<span class="you">Now</span>${f==='spend'&&S.mine.type==='etf'?'<span class="you">can’t spend bitcoin</span>':`<span class="dots you">${dots(R.mine[f])}</span>`}`:''}</div>`).join('')}
  <p class="hint note">For risk and effort, lower is better. Trust the comparison more than the exact numbers.</p>`;
}

/* ---------- render ---------- */
function render(){
  const act=document.activeElement&&document.activeElement.id;
  if(S.mine&&!S.picked.mine){const t=S.mine.tested;S.mine=clone(S.base);S.mine.tested=t}
  const brands=brandEvents([S.base,S.mine]);
  const R={base:risk(S.base,brands),mine:S.mine?risk(S.mine,brands):null};
  $('steps').innerHTML=STEPS.map((s,i)=>`<li><button data-act="go" data-to="${i}" ${i===S.step?'aria-current="step"':''}><span class="no">${i+1}. </span>${s}</button></li>`).join('');
  $('stage').innerHTML=[screenStart,screenToday,screenBuild,screenUse,screenShare][S.step]();
  document.querySelector('.grid').classList.toggle('solo',S.step===0);
  document.body.classList.toggle('landing',S.step===0);
  $('reset').hidden=S.step===0;
  $('score').innerHTML=scoreboard(R);
  // The map is the Today screen (the current setup) and the Build screen (the new one). Its dialogs work on whichever is showing.
  const onMap=S.step===1||S.step===2,mw=S.step===2?'mine':'base';
  // the disaster dialog: the list to pick from
  const sim=$('sim');
  if(S.simBase&&onMap){
    sim.innerHTML=`<div class="simbody">${disasterCard('today',[S[mw]],S.dis,'What could go wrong?','')}</div>`;
    if(!sim.open)sim.showModal();
    sim.scrollTop=0;
  }else if(sim.open)sim.close();
  // the edit dialog, opened by the pencil button on the map. It is redrawn on every change, so keep its scroll position.
  const ed=$('edit');
  if(S.editBase&&onMap){
    const y=ed.scrollTop;
    ed.innerHTML=`<div class="simbody"><div class="simhead"><span class="emo" aria-hidden="true">✏️</span><h3>${mw==='mine'?'Edit new setup':'Edit current setup'}</h3><button class="simx" data-act="editBase" aria-label="Close">×</button></div>${editor(mw)}${riskLine(S[mw])}<div><button class="btn" data-act="editBase">Done</button></div></div>`;
    if(!ed.open)ed.showModal();
    ed.scrollTop=y;
  }else if(ed.open)ed.close();
  // the full scoreboard, opened from the chip on the map
  const sb=$('scores');
  if(S.scoresOpen&&onMap){
    sb.innerHTML=`<div class="simbody"><div class="simhead"><span class="emo" aria-hidden="true">📊</span><h3>Scoreboard</h3><button class="simx" data-act="scores" aria-label="Close">×</button></div><div class="score scorefull">${scoreboard(R)}</div>
      <div><button class="btn small ghost" data-act="scoresMore" aria-expanded="${!!S.scoresMore}">${S.scoresMore?'Hide details':'See more details'}</button></div>
      ${S.scoresMore?`<div class="scoremore">${howHTML()}</div>`:''}</div>`;
    if(!sb.open)sb.showModal();
  }else if(sb.open)sb.close();
  document.body.classList.toggle('mapscreen',onMap||S.step===4||(S.step===3&&S.mine.type!=='etf')); // “Use it” is played on the map too, except for an ETF; Share has the island
  if(S.step===1&&S.mapIntro==='run')paintMapIntro(false); // the map was just redrawn mid-introduction: put it back as it was
  if(act&&$(act))$(act).focus();
}
function go(to){
  if(to>1&&!S.mine)S.mine=clone(S.base);
  // The map's introduction plays every time you arrive from the first screen, not only the first time: going back to Start
  // is starting again, so everything that happens the first time happens again, the fixed first disaster included.
  const firstMap=to===1&&(S.step===0||!mapIntroSeen);
  if(firstMap){mapIntroSeen=true;S.mapIntro='run';mapBeat=-1;S.thrown=false}
  if(to===1&&S.step===0){SetupMap.fresh();S.w=newUse(null)} // and the first seed you open is the Rickroll again, and “Use it” starts over
  useRun++;document.body.classList.remove('mapglide'); // an errand on the “Use it” map is dropped when you leave it
  if(to===3&&(!S.w.for||!sameSetup(S.w.for,S.mine))){S.w=newUse(S.mine);S.mine.tested=false} // a different setup: its errands start again
  if(to===0&&S.step!==0)startIntro(); // coming back to the first screen replays the car's entrance
  if(to!==1&&S.mapIntro==='run')S.mapIntro='done'; // leaving the map (by "Improve it", say) ends its introduction
  const wasMap=S.step>=1&&S.step<=3; // the map keeps its zoom between Today and Build, and starts afresh when you come to it from anywhere else
  S.suggest=false;S.change=null; // arriving on a map screen: no suggestions panel open, and no "what changed" card left over
  S.step=to;S.simBase=false;S.editBase=false;S.scoresOpen=false;S.mapDis=S.run=null;render();window.scrollTo({top:0});
  if(to>=1&&to<=3&&!wasMap)homeMapView();
  if(firstMap)runMapIntro();
}
/* ---------- map: zoom and drag ---------- */
// Mouse: wheel to zoom, drag to move. Touch: drag to move, pinch to zoom. The view is kept as three CSS variables on
// <body> rather than on the map, because the map is redrawn on every change of state and must come back as it was.
// It works during the map's introduction too. There a click still means "continue", but a drag or a pinch is not a
// click, and the caption's arrow is taken away while the map moves and drawn again once it has stopped.
// "home" is the view the map starts in (see homeMapView). There is no button to return to it: a drag or a pinch does.
const MV={k:1,x:0,y:0,home:true};
let mapArrowTimer=0;
function setMapView(k,x,y,home){
  const m=document.querySelector('.map'),r=m?m.getBoundingClientRect():{width:800,height:560},w=r.width/MV.k,h=r.height/MV.k;
  k=Math.min(4,Math.max(1,k));
  const lx=w*((k-1)/2+.3),ly=h*((k-1)/2+.3); // it can be dragged about a third of the way off, never out of sight
  Object.assign(MV,{k,x:Math.min(lx,Math.max(-lx,x)),y:Math.min(ly,Math.max(-ly,y)),home:!!home});
  const st=document.body.style;st.setProperty('--mk',MV.k);st.setProperty('--mx',MV.x+'px');st.setProperty('--my',MV.y+'px');
  if(S.mapIntro==='run'){const l=document.querySelector('.mapline');if(l)l.innerHTML='';clearTimeout(mapArrowTimer);mapArrowTimer=setTimeout(()=>aimMapArrow(0),250)}
}
// The whole island on a wide screen. A phone held upright is too narrow to show all of it at a size you can read, so
// there the map starts closer in, on your home, you and most of the bank; the rest is a drag or a pinch away.
const NEAR={k:1.78,x:286,y:360}; // how far in, and the point of the drawing (800 by 560) that sits in the middle
function homeMapView(){
  const m=document.querySelector('.map');
  if(!m||!matchMedia('(max-width:760px)').matches)return setMapView(1,0,0,true);
  const r=m.getBoundingClientRect(),u=Math.min(r.width/MV.k/800,r.height/MV.k/560); // how big one unit of the drawing is on screen, unzoomed
  setMapView(NEAR.k,(400-NEAR.x)*u*NEAR.k,(280-NEAR.y)*u*NEAR.k,true);
}
addEventListener('resize',()=>{if(MV.home&&S.step>=1&&S.step<=3)homeMapView()});
// Zoom to k keeping the point (px,py) of the window where it is. The map scales about its own middle.
function zoomMapAt(px,py,k){
  const m=document.querySelector('.map');if(!m)return;
  k=Math.min(4,Math.max(1,k));
  const r=m.getBoundingClientRect(),cx=r.left+r.width/2-MV.x,cy=r.top+r.height/2-MV.y,f=k/MV.k;
  setMapView(k,px-cx-f*(px-cx-MV.x),py-cy-f*(py-cy-MV.y));
}
{
  const pts=new Map();let moved=false,pinch=0;
  const onMap=ev=>{const t=ev.target;return t.closest&&t.closest('.mapcard')&&!t.closest('button,.mapcards,.mapresult,.mapcap,.usecap,.usehud')};
  document.addEventListener('wheel',ev=>{
    if(!onMap(ev))return;ev.preventDefault();
    zoomMapAt(ev.clientX,ev.clientY,MV.k*Math.exp(-ev.deltaY*(ev.ctrlKey?.01:.0015)));
  },{passive:false});
  document.addEventListener('pointerdown',ev=>{
    if(!onMap(ev)||(ev.pointerType==='mouse'&&ev.button!==0))return;
    if(!pts.size)moved=false;
    pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});pinch=0;
  });
  addEventListener('pointermove',ev=>{
    const p=pts.get(ev.pointerId);if(!p)return;
    const dx=ev.clientX-p.x,dy=ev.clientY-p.y;
    if(!moved&&pts.size===1&&Math.hypot(dx,dy)<6)return; // a small wobble is still a click
    moved=true;document.body.classList.add('mapdrag');
    p.x=ev.clientX;p.y=ev.clientY;
    if(pts.size===1)return setMapView(MV.k,MV.x+dx,MV.y+dy);
    const [a,b]=[...pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    if(pinch)zoomMapAt(mx,my,MV.k*d/pinch);
    setMapView(MV.k,MV.x+dx/2,MV.y+dy/2); // each finger carries half of the move
    pinch=d;
  });
  const up=ev=>{
    if(!pts.delete(ev.pointerId))return;pinch=0;
    if(!pts.size){document.body.classList.remove('mapdrag');if(moved)setTimeout(()=>{moved=false},60)}
  };
  addEventListener('pointerup',up);addEventListener('pointercancel',up);
  // the click that ends a drag must not open whatever was under the pointer
  addEventListener('click',ev=>{if(moved){moved=false;ev.stopPropagation();ev.preventDefault()}},true);
}
/* ---------- map introduction ---------- */
// The first time the map is shown it builds itself: you, then each thing you own, with a caption for each.
// Each caption waits for a click or tap, so nobody is rushed. It plays for everyone, each time you arrive from the
// first screen. Under reduced motion the steps, captions and clicks are all the same; only the movement is left out
// (things appear in place and the arrow is simply there), because the introduction is how the map gets explained.
// How far it has got is kept in mapBeat, not in the page, because the screen is redrawn on every change of state:
// paintMapIntro() can rebuild the current moment on a freshly drawn map, so a redraw can never leave the map empty.
let mapIntroSeen=false,mapBeat=-1;
// The Today screen has no risk chip. The risk of the current setup is said once, in words, by the caption that
// introduces "Try a disaster": one word when theft and loss are at the same level, both when they differ.
const RISK_WORD={low:'low',mid:'medium',high:'high'};
function riskSentence(){
  const sc=scoreOf(S.base),t=RISK_WORD[level(sc.theft)],l=RISK_WORD[level(sc.loss)];
  return 'With your current setup, your '+(t===l?`risk is ${t}.`:`theft risk is ${t} and your loss risk is ${l}.`);
}
const introBeats=()=>SetupMap.beats(riskSentence());
// The two risks in a word each, as on the map's chip. In the edit dialog it sits above "Done" and opens the scoreboard.
function riskLine(setup){
  const sc=scoreOf(setup),word={low:'Low',mid:'Medium',high:'High'};
  const one=(name,v)=>`<span><i style="background:${riskColor(v)}"></i>${name} <b>${word[level(v)]}</b></span>`;
  return `<button type="button" class="riskline" data-act="scores" aria-label="Theft risk ${word[level(sc.theft)]}, loss risk ${word[level(sc.loss)]}. Open the scoreboard">${one('Theft risk',sc.theft)}${one('Loss risk',sc.loss)}</button>`;
}
function runMapIntro(){setTimeout(()=>{if(mapBeat<0)nextMapBeat()},350)}
function nextMapBeat(){
  if(S.mapIntro!=='run')return;
  if(++mapBeat<introBeats().length)return paintMapIntro(true);
  S.mapIntro='done'; // show the finished map and its buttons
  const card=document.querySelector('.mapcard.mapintro');if(!card)return;
  card.querySelectorAll('.mapcap,.mapline').forEach(e=>e.remove());
  card.classList.remove('mapintro'); // every button was brought in by its own caption, so nothing makes a second entrance
}
function paintMapIntro(arriving){
  const card=document.querySelector('.mapcard.mapintro');if(!card||mapBeat<0)return;
  const cap=card.querySelector('.mapcap'),line=card.querySelector('.mapline'),beats=introBeats(),b=beats[mapBeat],at=mapBeat;
  // everything up to now is on the map; only what belongs to the newest caption animates in
  beats.slice(0,mapBeat+1).forEach((x,n)=>card.querySelectorAll([...x.steps.map(s=>`[data-step="${s}"]`),x.point].filter(Boolean).join(',')).forEach(e=>{e.classList.add('in');e.classList.toggle('was',n<mapBeat||!arriving)}));
  cap.innerHTML=`${mapBeat?'<button type="button" class="mapback" aria-label="Back">◂</button>':''}<span>${esc(b.text)}</span><button type="button" class="mapnext" aria-label="Continue">▸</button>`;
  cap.classList.toggle('up',!!b.point); // a caption about a button sits above the buttons, so its line can slant down to one
  cap.classList.remove('in');void cap.offsetWidth;cap.classList.add('in');
  aimMapArrow(b.point||!arriving?80:520); // drawn once the thing it points at has landed
  // Only two things continue: a click on the caption, or on an empty part of the map. Anything that can be clicked does
  // its own job and nothing more: a thing or a place opens its card, a button does what it says. Using them, and
  // closing what they opened, leaves the caption where it is, even when the caption is about that very thing.
  // The arrow on the left of the caption goes back one step.
  if(!card.dataset.intro){card.dataset.intro=1;card.addEventListener('click',ev=>{
    if(ev.target.closest('.mapback'))return prevMapBeat();
    if(S.mapIntro!=='run')return; // the introduction is over, but this card has not been redrawn since
    if(ev.target.closest('.mapcap')||!ev.target.closest('.maptap,.maptool,.mapscore,.mapresult,.mapcards,button,a,[role="button"]'))nextMapBeat();
  })}
}
// The pen arrow from the caption to what it is talking about. Drawn afresh for each caption, and again whenever the map
// has been dragged or zoomed, since the thing is then somewhere else on the screen.
function aimMapArrow(delay){
  const card=document.querySelector('.mapcard.mapintro'),at=mapBeat,b=introBeats()[at];if(!card||!b)return;
  const cap=card.querySelector('.mapcap'),line=card.querySelector('.mapline'),target=card.querySelector(b.point||`[data-step="${b.steps[0]}"]`);
  line.innerHTML='';
  if(target)setTimeout(()=>{
    if(mapBeat!==at||!line.isConnected)return;
    const c=card.getBoundingClientRect(),t=target.getBoundingClientRect(),k=cap.getBoundingClientRect(),tx=t.left+t.width/2;
    // up to a thing on the map from the top of the caption, or down to a button from the bottom of it
    const below=t.top>=k.bottom,y1=(below?k.bottom:k.top)-c.top;let x1=Math.max(k.left+24,Math.min(k.right-24,below?tx:k.left+k.width/2));
    // on its way down to a button the arrow must not run across another one (on a phone the buttons are in two rows):
    // if it would, it leaves the caption from wherever along its edge the way down is clear
    if(below){
      const inWay=[...card.querySelectorAll('.maptool.in')].filter(e=>e!==target).map(e=>e.getBoundingClientRect()).filter(o=>o.top<t.top&&o.bottom>k.bottom);
      const clear=x=>!inWay.some(o=>x>o.left-10&&x<o.right+10);
      if(!clear(x1))for(let d=12;d<k.width;d+=12){const x=[x1+d,x1-d].find(x=>x>=k.left+24&&x<=k.right-24&&x>=t.left+24&&x<=t.right-24&&clear(x));if(x!=null){x1=x;break}}
    }
    x1-=c.left;
    const x2=(below?Math.max(t.left+24,Math.min(t.right-24,x1+c.left)):tx)-c.left, // a wide thing off to one side is met at its near end
      y2=(below?t.top-7:Math.min(t.top+t.height/2,k.top-6))-c.top;
    // the landing's pen arrow: it leaves the caption straight up or down and bends over to the thing
    line.innerHTML=penArrow([x1,y1],[x1,y1+(y2-y1)*.6],[x2,y2]);
  },delay);
}
function prevMapBeat(){
  if(S.mapIntro!=='run'||mapBeat<1)return;
  mapBeat--;render(); // redrawing clears whatever the later step had brought in; render() then repaints up to this step
}
function resize(st,n){
  n=Math.max(1,Math.min(5,n));
  while(st.keys.length<n)st.keys.push(newKey());
  st.keys.length=n;st.n=n;st.m=Math.max(1,Math.min(st.m,n));st.tested=false;
}
function setWhere(st,v){
  if(v==='exchange'||v==='fintech'||v==='bank'||v==='etf'){st.type=v;return}
  st.type='keys';
  const has=st.keys.some(isProv);
  if(v==='keys'&&has)st.keys=st.keys.map(k=>isProv(k)?newKey():k);
  if(v==='collab'&&!has){
    if(st.n===1){st.keys=[st.keys[0],newKey(),provKey()];st.n=3;st.m=2}
    else st.keys[st.n-1]=provKey();
  }
}
function presetSetup(p){
  const s=newSetup();
  if(p==='exchange'||p==='fintech'||p==='bank'||p==='etf')s.type=p;
  else if(p==='hot')Object.assign(s.keys[0],{device:'phone',dloc:'carry'});
  else if(p==='laptop')Object.assign(s.keys[0],{device:'laptop',dloc:'home'});
  else if(p==='m23')Object.assign(s,{m:2,n:3,keys:[newKey(),newKey(),newKey()]});
  else if(p==='prov'||p==='prov5'){const A=newKey(),B=newKey();Object.assign(A,{device:'phone',dloc:'carry',backup:'cloud'});B.brand='B';
    Object.assign(s,p==='prov'?{m:2,n:3,keys:[A,newKey(),provKey()]}:{m:3,n:5,keys:[A,newKey(),newKey(),B,Object.assign(provKey(),{brand:'C'})]})}
  return s;
}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,w=S.w;
  if(a==='how'||a==='howWhich'){S.how=a==='how'?(S.mine&&S.step!==1?'mine':'base'):b.dataset.v;const dl=$('how');dl.innerHTML=howHTML();if(!dl.open)dl.showModal();return}
  if(a==='perfect'){const dl=$('how');dl.innerHTML=perfectHTML();if(!dl.open)dl.showModal();dl.scrollTop=0;return}
  if(a==='rec'){const dl=$('how');dl.innerHTML=recHTML();if(!dl.open)dl.showModal();dl.scrollTop=0;return}
  if(a==='applyRec'){const t=bestChanges(S.mine,true)[b.dataset.k];if(t){S.mine=clone(t.setup);S.picked.mine=true;changed('mine')}render();const dl=$('how');dl.innerHTML=recHTML(!!t);dl.scrollTop=0;return}
  if(a==='howClose'){$('how').close();return}
  if(a==='editKey'){S.open[b.dataset.id]=!S.open[b.dataset.id]}
  if(a==='pick'){const s=b.dataset.s,v=b.dataset.v,st=S[s];
    if(v==='custom')S.custom[s]=true;
    else{S.custom[s]=false;
      if(v==='phone'||v==='laptop'||v==='hw'){const n=presetSetup(v==='phone'?'hot':v==='laptop'?'laptop':'typical');st.keys=n.keys;st.n=1;st.m=1}
      else{const mn=v.split('-').map(Number);setShape(st,mn[0],mn[1])}
      st.tested=false}}
  if(a==='go'){if(b.classList.contains('cta')&&driveOff(()=>go(+b.dataset.to)))return;return go(+b.dataset.to)}
  if(a==='reset'){reset();mapIntroSeen=false;startIntro();return go(0)} // "Start over" replays the car's entrance, and the map's onboarding when you next reach it
  if(a==='editBase'){ // editing the setup ends any run of disasters. On the Build screen the form starts from the setup as it stands.
    if(S.editBase){editDone();render();return}
    S.editBase=true;S.mapDis=S.run=null;S.suggest=false;
    if(S.step===2){S.picked.mine=true;S.change=null;editFrom={setup:clone(S.mine),sc:scoreOf(S.mine)}}
  }
  if(a==='suggest'){S.suggest=!S.suggest;S.change=null;S.mapDis=S.run=null} // the suggestions panel takes the place of whatever card was showing
  if(a==='changeDone')S.change=null;
  if(a==='changeTest'){S.change=null;throwDisaster(null)}
  // "Try a disaster" always throws a random one onto the map. Choosing a particular one comes afterwards, from the result.
  if(a==='simBase'||a==='mapAnother'){
    // During the introduction, pressing "Try a disaster" while its caption is showing does what the caption asked, so
    // the introduction moves on: once the disaster is put away, the next caption is waiting. It is the one exception to
    // "only the caption and empty map continue", because this caption is itself an instruction to press the button.
    if(a==='simBase'&&S.step===1&&S.mapIntro==='run'&&(introBeats()[mapBeat]||{}).point==='[data-act="simBase"]')mapBeat++;
    S.change=null;S.suggest=false; // a disaster has the map to itself
    throwDisaster(null);
  }
  if(a==='simPick'){S.simBase=true;S.simList=true}
  if(a==='simClose')S.simBase=false;
  if(a==='mapDisDone'){S.mapDis=S.run=null;render();return} // Reset: the map as it was
  if(a==='scores'){S.scoresOpen=!S.scoresOpen;S.scoresMore=false}
  if(a==='scoresMore'){S.scoresMore=!S.scoresMore;S.how=S.step===2?'mine':'base'} // the explanation opens further down the same dialog
  if(a==='mapWhy'){const c=b.closest('.mapresult').classList;c.toggle('why');c.add('seen');return} // turn the result card over; no redraw, so the disaster doesn't replay, and once turned the stamp doesn't thump down again
  if(a==='mapStop'){ // "Do it" on the turned-over card, on the Build map: make the change that would have stopped this disaster
    const t=S.mapDis&&stoppers(S.mine,S.mapDis.ev,S.mapDis.kind,true)[+b.dataset.i];
    if(t){noteChange(t.do,()=>{S.mine=clone(t.setup)});S.picked.mine=true;changed('mine');S.mapDis=S.run=null}
  }
  if(a==='mapApply'){ // a suggestion on the Build map: apply it, and any run of disasters starts afresh
    const t=bestChanges(S.mine,true)[b.dataset.k];
    if(t){noteChange(t.do,()=>{S.mine=clone(t.setup)});S.picked.mine=true;changed('mine');S.mapDis=S.run=null}
  }
  if(a==='share'){ // the phone's own share sheet where there is one; otherwise copy the link, which is also there to copy by hand
    const copy=()=>{try{navigator.clipboard.writeText(SHARE_URL).then(()=>{S.shared=true;render()},()=>{})}catch(e){}};
    if(navigator.share)navigator.share({title:'Bitcoin Self-custody simulator',text:SHARE_TEXT,url:SHARE_URL}).catch(e=>{if(e.name!=='AbortError')copy()});
    else copy();
    return;
  }
  if(a==='simList')S.simList=true;
  if(a==='conf'){S.conf[b.dataset.which]=+b.dataset.n}
  if(a==='preset'&&b.dataset.w==='base')S.base=presetSetup(b.dataset.p);
  else if(a==='preset'){const p=b.dataset.p;
    if(p)S.mine=presetSetup(p);
    else{const m=+b.dataset.m,n=+b.dataset.n;S.mine.type='keys';S.mine.keys=S.mine.keys.map(k=>isProv(k)?newKey():k);resize(S.mine,n);S.mine.m=m}}
  if(a==='n+'||a==='n-'){const st=S[b.dataset.s];resize(st,st.n+(a==='n+'?1:-1))}
  if(a==='m+'||a==='m-'){const st=S[b.dataset.s];st.m=Math.max(1,Math.min(st.n,st.m+(a==='m+'?1:-1)))}
  if(a==='useReset'){S.w=newUse(S.mine);S.mine.tested=false}
  if(a==='useTest'||a==='useAll'||a==='useRecover'||a==='useBack'||a==='useRest'){({useTest,useAll,useRecover,useBack,useRest})[a]();return}
  if(a==='disaster')disaster(b.dataset.w,b.dataset.id||null);
  if(a==='preset')changed(b.dataset.w||'mine');
  if(b.dataset.s)changed(b.dataset.s);
  if(a==='copy'){if(!S.note.trim()){$('copied').textContent='Write a note first';return}const t=feedbackText();const done=()=>{$('copied').textContent='Copied'};
    try{navigator.clipboard.writeText(t).then(done,()=>{$('note').select()})}catch(e){$('note').select()}return}
  render();
});
function changed(which){if(which==='base')S.dis=null}
/* ---------- disaster taglines ---------- */
// One line under each disaster's name on the map, mostly borrowed from memes. They are jokes about the event,
// never advice. Brand and supply-chain events have an id per brand, so those match on the start of the id.
const TAGLINE={
  t_home:'They even took the kitchen sink.',t_office:'The cleaner found something interesting.',t_rel:'“I was just looking for the Wi-Fi password.”',t_friend:'“I was just looking for the Wi-Fi password.”',
  t_bank:'An inside job.',t_carry:'Yoink.',t_cloud:'They said it would show up as ******* if you typed it.',
  t_border:'Papers, please.',t_phish:'Your wallet urgently needs to be “validated”.',t_lapse:'You had one job.',
  t_guess:'correct horse battery staple',t_app:'It’s not a bug, it’s a feature.',t_brand:'It’s not a bug, it’s a feature.',t_supply:'It fell off the back of a truck.',
  t_prov:'“We take your security very seriously.”',t_provapp:'Automatic updates: what could go wrong?',t_prov2:'“We take your security very seriously.”',
  c_acct:'New phone, who dis?',c_hack:'“We take your security very seriously.”',c_freeze:'Withdrawals are temporarily paused.',c_frozen:'Computer says no.',c_rules:'It’s for your own protection.',
  l_dev:'Have you tried turning it off and on again?',l_home:'This is fine.',l_office:'It was in the box marked “misc”.',l_rel:'It did not spark joy.',l_friend:'Dude, where’s my seed?',
  l_bank:'Sorry, we’re closed.',l_carry:'It’s in your other trousers. It is not in your other trousers.',l_cloud:'Forgot your password? So did we.',
  l_prov:'It’s not you, it’s us.',l_prov2:'It’s not you, it’s us.',c_bust:'Assets are fine.',l_gov:'“We’re from the government and we’re here to help.”',l_bug:'Works on my machine.',
  l_time:'One does not simply remember twelve words.',
};
// Malware names the device it is on, taken from the disaster's own label. Phones keep apps apart, so for malware to
// reach a wallet's key the system has to be behind on its updates; the same line is used for a laptop.
const tagline=(id,label)=>id==='t_hot'?`You let your ${/phone or computer/.test(label)?'devices':/phone/.test(label)?'phone':'laptop'} get a bit too out of date.`
  :TAGLINE[id]||TAGLINE[Object.keys(TAGLINE).find(k=>id.startsWith(k))]||'';
/* ---------- a run of disasters on the map ---------- */
// Disasters compound. S.run keeps: a working copy of the setup ("live") with whatever was destroyed or carried off
// removed, so the model judges each new disaster against what is actually left; which keys thieves hold so far; what
// became of each thing on the map; and how many disasters the setup has survived. A run ends when the coins are gone.
const mapSetup=()=>S.step===2&&S.mine?S.mine:S.base;
const fxOf=(d,R)=>{const o=d.res[0];return {ev:d.ev,kind:d.kind,hit:o.hit,rhit:o.rhit,bad:o.bad,dead:o.dead,icon:d.icon,prior:R.fates}};
function throwDisaster(id){
  if(!S.run||S.run.over)S.run={live:clone(mapSetup()),fates:{},now:{},stolen:[],n:0,over:null};
  const R=S.run,L=R.live;
  Object.assign(R.fates,R.now);R.now={}; // the previous disaster's damage is now part of the scenery
  // The very first one is always malware, so everyone (and every demo) opens on the same story, and on the one that is
  // the main reason for a cold wallet: a key on an online phone or laptop can be taken from afar. Only if the setup has
  // such a key; otherwise malware would be a non-event and the first one is random too.
  const first=!S.thrown&&!custodial(L)&&allKeys(L).some(hot);S.thrown=true;
  const sure=!id&&first;if(sure)id='t_hot'; // and it always gets through: a first disaster that misses would teach nothing
  if(!id){ // random: one that can still reach something, and not the same one twice running
    const all=disasterList([L]).map(x=>x[1]),can=all.filter(e=>touches(L,e)),from=(can.length?can:all).filter(e=>!S.dis||e.id!==S.dis.id),pool=from.length?from:all;
    id=pool[Math.floor(Math.random()*pool.length)].id;
  }
  const d=S.dis=S.mapDis=runDisaster([L],id,null,sure),o=d.res[0];
  S.simBase=false; // the dialog is only the list to pick from
  SetupMap.svg(mapSetup(),fxOf(d,R)); // a dry run of the drawing, to learn what this disaster does to each thing
  for(const t of SetupMap.things()){
    if(!t.fresh||t.fate==='safe')continue;
    R.now[t.id]=t.fate;
    const k=t.k==='R'?L.rkey:L.keys[t.k];
    if(t.fate==='hacked'||!k&&t.role!=='file')continue; // hacked things are still there; the thief holding the key is counted below
    if(t.role==='device'||t.role==='provkey')k.device='none';
    if(t.role==='backup')k.backup='none';
    if(t.role==='file'&&L.config==='one')L.config='none';
  }
  if(d.kind==='t')o.hit.forEach((h,i)=>{if(h&&!R.stolen.includes(i))R.stolen.push(i)});
  const own=!custodial(L),left=L.keys.filter(k=>k.device!=='none'||k.backup!=='none').length;
  R.over=o.bad?{verdict:o.verdict}
    :own&&R.stolen.length>=L.m?{verdict:'Coins stolen',text:'Added to what was taken before, thieves now hold enough to spend.'}
    :own&&left<L.m?{verdict:'Coins lost',text:'Too little is left to spend the coins.'}:null;
  if(!R.over)R.n++;
}
function disaster(w,id){
  throwDisaster(id);
}
document.addEventListener('change',ev=>{
  const el=ev.target;
  if(!el.dataset||!el.dataset.f)return;
  const st=S[el.dataset.s],k=+el.dataset.k,f=el.dataset.f;
  changed(el.dataset.s);
  if(k<0){if(f==='type'){setWhere(st,el.value);S.custom[el.dataset.s]=false;S.picked[el.dataset.s]=true}else st[f]=el.value}else{const key=el.dataset.k==='r'?st.rkey:st.keys[k];key[f]=el.value;
    if(f==='device'){if(el.value==='phone')key.dloc='carry';if(el.value==='laptop')key.dloc='home';if(el.value==='prov'||el.value==='prov2'){key.backup='none';key.pass='none';if(key.brand==='D')key.brand='A'}}}
  if(f!=='pin')st.tested=false;
  render();
});
$('how').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('sim').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('sim').addEventListener('close',()=>{if(S.simBase){S.simBase=false;render()}}); // Esc or a click outside
$('edit').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('edit').addEventListener('close',()=>{if(S.editBase){editDone();render()}}); // Esc or a click outside
// Closing the edit dialog, however it is closed. On the Build screen, one "what changed" card covers the whole visit
// to the form: from the setup as it was when the form opened to the setup as it is now. Nothing changed, no card.
let editFrom=null;
function editDone(){
  S.editBase=false;
  if(S.step===2&&editFrom&&S.mine&&!sameSetup(editFrom.setup,S.mine)){
    const to=scoreOf(S.mine);
    S.change={what:null,from:{theft:editFrom.sc.theft,loss:editFrom.sc.loss},to:{theft:to.theft,loss:to.loss}};
  }
  editFrom=null;
}
$('scores').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('scores').addEventListener('close',()=>{if(S.scoresOpen){S.scoresOpen=false;render()}});
document.addEventListener('toggle',ev=>{const d=ev.target;if(d.dataset&&d.dataset.d)S.open[d.dataset.d]=d.open;},true);
document.addEventListener('input',ev=>{if(ev.target.id==='note'){S.note=ev.target.value}});
render();
/* ---------- landing car ---------- */
// The car is built from flat panels placed in 3D, so it can be seen from any angle.
// x is right, y is down, z is toward the viewer. The origin is the road under the middle of the car.
function buildCar(root){
  const plane=(parent,w,h,transform,css,html)=>{
    const d=document.createElement('div');d.className='pl';
    d.style.cssText=`width:${w}px;height:${h}px;left:${-w/2}px;top:${-h/2}px;transform:${transform};${css||''}`;
    if(html)d.innerHTML=html;parent.appendChild(d);return d;
  };
  const group=(parent,transform)=>{const d=document.createElement('div');d.className='g';if(transform)d.style.transform=transform;parent.appendChild(d);return d};
  const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.substr(i,2),16)*(1-t)+parseInt(b.substr(i,2),16)*t).toString(16).padStart(2,'0')).join('');
  // Outline of a rounded rectangle, clockwise from the top left.
  const roundRect=(w,h,r,n)=>{
    const pts=[],arc=(cx,cy,a0)=>{for(let i=0;i<=n;i++){const a=a0+Math.PI/2*i/n;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)])}};
    arc(w/2-r,-h/2+r,-Math.PI/2);arc(w/2-r,h/2-r,0);arc(-w/2+r,h/2-r,Math.PI/2);arc(-w/2+r,-h/2+r,Math.PI);return pts;
  };
  const circle=(r,n)=>Array.from({length:n},(_,i)=>[r*Math.cos(2*Math.PI*i/n),r*Math.sin(2*Math.PI*i/n)]);
  // Side walls of an outline pushed out along z: one strip per edge, lighter on top, darker underneath.
  const wallsZ=(parent,pts,cy,zc,depth,light,dark)=>pts.forEach((p,i)=>{
    const q=pts[(i+1)%pts.length],dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy);if(L<.01)return;
    plane(parent,L+1,depth,`translate3d(${(p[0]+q[0])/2}px,${cy+(p[1]+q[1])/2}px,${zc}px) rotateZ(${Math.atan2(dy,dx)}rad) rotateX(90deg)`,`background:${mix(light,dark,(1-dx/L)/2)}`);
  });

  /* body: an orange pill 352 wide, 156 tall, 290 long */
  const W=352,H=156,D=290,BY=-150;
  plane(root,W,H,`translate3d(0,${BY}px,${D/2}px)`,'',`<svg viewBox="-176 -78 352 156">
    <defs><linearGradient id="c3-o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFA033"/><stop offset=".5" stop-color="#F47B20"/><stop offset="1" stop-color="#DE6410"/></linearGradient>
    <linearGradient id="c3-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AD4FF"/><stop offset="1" stop-color="#3F97E6"/></linearGradient></defs>
    <rect x="-176" y="-78" width="352" height="156" rx="74" fill="url(#c3-o)"/>
    <path d="M-120 -64h240" stroke="#FFC078" stroke-width="7" stroke-linecap="round" opacity=".8"/>
    <rect x="-176" y="-26" width="20" height="50" rx="10" fill="#FFD84D"/><rect x="156" y="-26" width="20" height="50" rx="10" fill="#FFD84D"/>
    <g class="sc-night"><g fill="#FFE9A0" opacity=".3"><circle cx="-150" cy="-1" r="30"/><circle cx="150" cy="-1" r="30"/></g></g>
    <rect x="-104" y="-58" width="148" height="110" rx="14" fill="#1B1840"/><rect x="-88" y="-42" width="116" height="18" rx="5" fill="#F47B20"/>
    <g fill="#FFF4E0"><rect x="-88" y="-12" width="74" height="10" rx="5"/><rect x="-88" y="12" width="100" height="10" rx="5"/>
    <rect x="72" y="-50" width="56" height="24" rx="11"/><rect x="72" y="-16" width="56" height="24" rx="11"/><rect x="72" y="18" width="56" height="24" rx="11"/></g></svg>`);
  plane(root,W,H,`translate3d(0,${BY}px,${-D/2}px) rotateY(180deg)`,'',`<svg viewBox="-176 -78 352 156">
    <rect x="-176" y="-78" width="352" height="156" rx="74" fill="#D9620F"/>
    <rect x="-170" y="-22" width="16" height="44" rx="8" fill="#EF5350"/><rect x="154" y="-22" width="16" height="44" rx="8" fill="#EF5350"/>
    <rect x="-26" y="26" width="52" height="18" rx="9" fill="#1B1840"/></svg>`);
  wallsZ(root,roundRect(W,H,74,7),BY,0,D,'#FFB04A','#B94E08');

  /* wheels: four cylinders, each in a group that spins about its axle */
  const R=50,TW=58,N=12,hub='<svg viewBox="-50 -50 100 100"><circle r="23" fill="#FFF4E0"/><g fill="#C9C2B0"><circle r="6"/><circle cy="-14" r="3.5"/><circle cx="12" cy="7" r="3.5"/><circle cx="-12" cy="7" r="3.5"/></g></svg>';
  for(const sx of[-1,1])for(const sz of[-1,1]){
    const w=group(group(root,`translate3d(${sx*130}px,${-R}px,${sz*92}px)`));w.classList.add('sc-spin');
    for(let i=0;i<N;i++){
      const a=2*Math.PI*i/N,b=2*Math.PI*(i+1)/N,y1=R*Math.cos(a),z1=R*Math.sin(a),y2=R*Math.cos(b),z2=R*Math.sin(b);
      plane(w,TW,Math.hypot(y2-y1,z2-z1)+1,`translate3d(0,${(y1+y2)/2}px,${(z1+z2)/2}px) rotateX(${Math.atan2(z2-z1,y2-y1)}rad)`,`background:${i%2?'#1B1840':'#2B2756'}`);
    }
    for(const side of[-1,1])plane(w,2*R,2*R,`translate3d(${side*TW/2}px,0,0) rotateY(90deg)`,'border-radius:50%;background:#1B1840',side===sx?hub:'');
  }

  /* the driver: whoever you play as on the map, as a flat sticker of their head and shoulders. seatDriver() fills it in. */
  plane(root,150,180,'translate3d(0,-316px,-30px)','','<svg id="c3-driver" viewBox="-30 -105 60 72" style="overflow:hidden"></svg>');

  /* steering wheel (a tilted ring), arms and hands, roll bar, side glass */
  for(let k=0;k<4;k++)plane(root,128,128,`translate3d(0,-236px,30px) rotateX(62deg) translateZ(${k*4-6}px)`,'','<svg viewBox="-64 -64 128 128"><circle r="55" fill="none" stroke="#1B1840" stroke-width="14"/></svg>'); // stacked rings, so it has some thickness
  // Arms: each hangs from a shoulder and reaches forward to the wheel. Arm and hand are crossed panels so they show
  // from any side. The arm on the viewer's right swings up from its shoulder to wave.
  for(const sx of[-1,1]){
    const arm=group(group(root,`translate3d(${sx*44}px,-258px,-24px)`));if(sx>0)arm.classList.add('c3-wave');
    const dx=sx*10,dy=14,dz=60,L=Math.hypot(dx,dy,dz),aim=`translate3d(${dx/2}px,${dy/2}px,${dz/2}px) rotateY(${Math.atan2(-dz,dx)}rad) rotateZ(${Math.asin(dy/L)}rad)`;
    for(const rx of[0,90])plane(arm,L,15,`${aim} rotateX(${rx}deg)`,'border-radius:7px;background:var(--sleeve)');
    for(const r of['','rotateY(90deg)','rotateX(90deg)'])plane(arm,32,32,`translate3d(${dx}px,${dy}px,${dz}px) ${r}`,'border-radius:50%;background:var(--skin)'); // three discs: round from every side
  }
  plane(root,180,86,'translate3d(0,-262px,-96px)','','<svg viewBox="-90 -43 180 86"><path d="M-84 43V-18Q-84 -37 -66 -37H66Q84 -37 84 -18V43" fill="none" stroke="#1B1840" stroke-width="12" stroke-linecap="round"/></svg>');
  for(const sx of[-1,1]){
    plane(root,68,88,`translate3d(${sx*124}px,-270px,-20px) scaleX(${-sx})`,'','<svg viewBox="-34 -44 68 88"><path d="M-30 44L-8 -30Q-2 -44 12 -40L24 -36Q34 -32 32 -20L24 44Z" fill="url(#c3-b)"/></svg>');
    plane(root,90,62,`translate3d(${sx*124}px,-257px,-20px) rotateY(90deg)`,'border-radius:12px 26px 0 0;background:linear-gradient(#9AD4FF,#3F97E6);opacity:.6');
  }
}
buildCar($('sc-pitch'));
for(const id of['company','bank','home','friend'])$('sc-'+id).innerHTML=SetupMap.landmark(id); // the map's own buildings, in the scenery
// Puts whoever you play as on the map behind the wheel. Called again whenever the first screen comes back.
function seatDriver(){
  const d=SetupMap.driver();$('c3-driver').innerHTML=d.svg;$('sc-say').textContent='“'+d.quote+'”';
  $('car3d').style.setProperty('--sleeve',d.sleeve);$('car3d').style.setProperty('--skin',d.skin);
}
// One unit of the drawing in pixels, so the car layer can match the painted scene at any window size.
// "narrow" means the window shows too little of the drawing's width for the buildings at its sides to be in view.
new ResizeObserver(([e])=>{const r=e.contentRect;if(!r.width)return;const s=Math.max(r.width/1200,Math.min(r.height/450,r.width/780)); /* fill the height, but never so far in that less than 780 of the drawing's 1200 width shows: that is what it takes to see buildings on a phone */e.target.style.setProperty('--s',s);e.target.classList.toggle('narrow',r.width/s<1100)}).observe($('scene'));
/* ---------- landing entrance ---------- */
// The car jumps in once per page load. A click or tap skips to the end. Skipped entirely under reduced motion.
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
let introStart=0,introTimer=0;
function endIntro(){
  if(!document.body.classList.contains('intro'))return;
  clearTimeout(introTimer);
  document.body.classList.remove('intro');
  if(performance.now()-introStart>1000)document.body.classList.add('landed'); // it did land, so let the dust drift away
  runNotes();
}
// Plays on page load, and again whenever the player comes back to the first screen.
function startIntro(){
  seatDriver();
  if(calm)return;
  introStart=performance.now();clearTimeout(introTimer);
  document.body.classList.remove('landed');document.body.classList.add('intro');
  introTimer=setTimeout(endIntro,1650);
  addEventListener('pointerdown',endIntro,{once:true});
}
startIntro();
// Tap the car and it hops, then sets off: the same as pressing "Get started".
$('car3d').addEventListener('click',()=>{
  const m=$('sc-mover'),start=()=>{const b=document.querySelector('.btn.cta[data-act="go"]');if(b)b.click()};
  if(m.classList.contains('hop')||document.body.classList.contains('leaving'))return;
  if(calm)return start();
  m.classList.add('hop');setTimeout(()=>{m.classList.remove('hop');start()},700);
});
/* ---------- landing notes ---------- */
// Pen arrows that name what is in the scene, and a speech bubble with something the driver really said. One shows at a
// time, in turn, once the car has landed. [text, x, y, tilt, arrow from, bend, to, which layout it is for]
// A narrow window (a phone) has the buildings closer to the road (see #scene.narrow in the CSS), so the notes about
// them are listed twice: once placed for the wide layout, once for the narrow one.
// "You" stands to the right of the driver: the headline and the lines under it are on the left, and on a short window
// the driver's head comes up level with them.
const NOTES=[['You',748,226,6,[714,214],[684,202],[660,226]],
  ['Your home',214,446,-4,[196,458],[176,476],[150,484],'wide'],
  ['The bank',352,424,3,[332,434],[312,440],[292,456],'wide'],
  ['A friend’s place',1010,462,-3,[1052,474],[1078,478],[1098,498],'wide'],
  ['The exchange',952,356,4,[914,368],[890,366],[872,384],'wide'],
  ['Your home',310,402,-4,[296,414],[276,426],[270,450],'narrow'],
  ['The bank',330,396,3,[344,408],[360,420],[372,438],'narrow'],
  ['A friend’s place',868,560,-3,[900,540],[914,530],[922,514],'narrow'],
  ['The exchange',872,350,4,[864,362],[856,370],[854,384],'narrow']];
// penArrow() is the one arrow used for pointing at things, here and in the map's introduction: a curve from a to c that
// bends toward b, with an open head at c. A very short arrow gets a smaller head.
function penArrow(a,b,c){
  const n=v=>(+v).toFixed(1),ang=Math.atan2(c[1]-b[1],c[0]-b[0]),h=Math.min(13,Math.hypot(c[0]-a[0],c[1]-a[1])*.45);
  const tip=d=>`${n(c[0]-h*Math.cos(ang+d))} ${n(c[1]-h*Math.sin(ang+d))}`;
  // Two strokes, so that the line is drawn first and the head after it (.pen and .pen.head in the CSS). As one path they
  // would both start at once, and the short head would be finished long before the line reached it.
  const end=`${n(c[0])} ${n(c[1])}`;
  return `<path class="pen" pathLength="1" d="M${n(a[0])} ${n(a[1])}Q${n(b[0])} ${n(b[1])} ${end}"/><path class="pen head" pathLength="1" d="M${end}L${tip(.5)}M${end}L${tip(-.5)}"/>`;
}
$('sc-notes').innerHTML=NOTES.map(([t,x,y,r,a,b,c,fit])=>{
  return `<g class="sc-note"${fit?` data-fit="${fit}"`:''}>${penArrow(a,b,c)}<text x="${x}" y="${y}" text-anchor="middle" transform="rotate(${r} ${x} ${y})">${t}</text></g>`}).join('');
/* The notes are shown once, in order: the labels, then what the driver said. After that the tour is over, and only the
   driver changes: someone else takes the wheel, says their line, and makes way for the next. The buildings are not
   introduced again. Whoever is driving when you set off is you on the map. noteSolo: 0 during the tour, then 1 while a
   line is showing or due, 2 once it has faded and the driver is to be swapped. */
let noteTimer=0,noteI=-1,noteSolo=0;
function nextNote(){
  const c=document.body.classList,all=[...document.querySelectorAll('#scene .sc-note')],say=$('sc-say'),said=say.classList.contains('on');
  all.forEach(n=>n.classList.remove('on'));
  if(!c.contains('landing')||c.contains('intro')||c.contains('leaving')){noteI=-1;noteSolo=0;noteTimer=setTimeout(nextNote,800);return}
  if(noteSolo){
    if(said){noteSolo=2;noteTimer=setTimeout(nextNote,350)}                                  // let the bubble fade first
    else if(noteSolo===2){SetupMap.another();seatDriver();noteSolo=1;noteTimer=setTimeout(nextNote,500)} // the new driver, alone for a moment
    else{say.classList.add('on');noteTimer=setTimeout(nextNote,+say.dataset.ms)}
    return;
  }
  const layout=$('scene').classList.contains('narrow')?'narrow':'wide',fit=all.filter(n=>!n.dataset.fit||n.dataset.fit===layout);
  noteI++;fit[noteI].classList.add('on');
  if(noteI===fit.length-1)noteSolo=1;
  noteTimer=setTimeout(nextNote,+fit[noteI].dataset.ms||3200);
}
function runNotes(){clearTimeout(noteTimer);noteI=-1;noteSolo=0;noteTimer=setTimeout(nextNote,700)}
// A click anywhere on the first screen, other than on the car or a button, skips ahead: to the next label during the
// tour, and after it straight to the next driver and their line. So you can click through everyone quickly.
document.addEventListener('click',ev=>{
  const c=document.body.classList;
  if(!c.contains('landing')||c.contains('intro')||c.contains('leaving')||ev.target.closest('#car3d,button,a,dialog'))return;
  clearTimeout(noteTimer);
  if(!noteSolo)return nextNote();
  document.querySelectorAll('#scene .sc-note').forEach(n=>n.classList.remove('on'));
  SetupMap.another();seatDriver();noteSolo=1;noteTimer=setTimeout(nextNote,120); // a short gap, so the bubble pops in again
});
runNotes();
// "Get started": the car drives off toward you, then the next screen opens. Returns false if there is nothing to play.
function driveOff(then){
  const c=document.body.classList;
  if(calm||!c.contains('landing'))return false;
  if(c.contains('leaving'))return true;
  c.add('leaving');setTimeout(()=>{then();c.remove('leaving')},620);
  return true;
}

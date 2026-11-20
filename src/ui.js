//--UI--
/* ---------- state ---------- */
const SATS=1e8;
let S;
function reset(){S={step:0,base:presetSetup('hot'),mine:null,editBase:false,simBase:false,open:{},conf:{before:null,after:null},note:'',custom:{},picked:{mine:false},dis:null,dis2:null,tally:{n:0,a:0,b:0},w:{old:SATS,vault:0,log:[],tx:null,receipt:null,report:null,done:{}}}}
reset();
const $=id=>document.getElementById(id);
const STEPS=['Start','Today','Build','Use it','Stress test'];
const SHARE_URL='https://rolznz.github.io/bitcoin-self-custody-simulator/';
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
  const list=disasterList(setups),names=setups.length>1?['Before','Now']:[''];
  const opts=k=>list.filter(x=>x[0]===k).map(x=>`<button type="button" data-act="disaster" data-w="${which}" data-id="${x[1].id}"${d&&d.id===x[1].id?' class="on" aria-current="true"':''}>${elabel(x[1],setups)}</button>`).join('');
  const one=(s,o,name)=>{const word=o.kind==='t'?['taken','safe']:['gone','still there'];
    return `<div class="dres ${o.bad?'bad':'ok'}"><div class="body">${name?`<b>${name}</b>`:''}
      <div class="dkeys"${(s.n===1&&!TL(s))||custodial(s)?' hidden':''}>${s.keys.map((k,i)=>`<span class="dk${o.hit[i]?' hit':''}"><span class="tok" style="--kc:var(--k${i})">${LETTERS[i]}</span>${word[o.hit[i]?0:1]}</span>`).join('')}${o.rhit==null?'':`<span class="dk${o.rhit?' hit':''}"><span class="tok" style="--kc:var(--base-bar)">R</span>${word[o.rhit?0:1]}</span>`}</div>
      <span>${o.text}</span><span class="st lv-${o.bad?'high':'low'}">${o.verdict}</span></div></div>`};
  const t=S.tally;
  if(which==='today'){ // in the dialog on the Today screen: a grid of tiles to pick from, then the result
    const head=(icon,text)=>`<div class="simhead"><span class="emo" aria-hidden="true">${icon}</span><h3>${text}</h3><button class="simx" data-act="simClose" aria-label="Close">×</button></div>`;
    if(d&&!S.simList)return head(d.icon,d.label)+`<div role="status" class="dcmp">${one(setups[0],d.res[0],'')}</div>
      <div class="rowb"><button class="btn small" id="dis-today" data-act="disaster" data-w="today">🎲 Throw another</button><button class="btn small ghost" data-act="simList">Back to the list</button></div>`;
    const icon=e=>e.supply?'🚚':e.brand?'🐞':ICON[e.id]||'⚠️';
    const tiles=k=>`<div class="dtiles">${list.filter(x=>x[0]===k).map(x=>`<button type="button" class="dtile" data-act="disaster" data-w="today" data-id="${x[1].id}"><span aria-hidden="true">${icon(x[1])}</span>${elabel(x[1],setups)}</button>`).join('')}</div>`;
    return head('🔥',title)+`<button class="btn dsurprise" id="dis-today" data-act="disaster" data-w="today">🎲 Surprise me</button>
      <h4>Theft</h4>${tiles('t')}<h4>Loss</h4>${tiles('l')}`;
  }
  return `<div class="card"><h3>${title}</h3><p class="hint">${hint}</p>
    <div class="dctl"><button class="btn small${which==='today'?' outline':''}" id="dis-${which}" data-act="disaster" data-w="${which}">${d?'Another random one':'Random disaster'}</button><span class="hint">or</span>
      <details class="dmenu" id="pick-${which}"><summary aria-label="Pick a disaster">Pick one</summary><div class="dlist"><h4>Theft</h4>${opts('t')}<h4>Loss</h4>${opts('l')}</div></details></div>
    ${d?`<div role="status"><div class="dhead"><span class="emo" aria-hidden="true">${d.icon}</span><b>${d.label}</b></div>
      <div class="dcmp${setups.length>1?' two':''}">${setups.map((s,i)=>one(s,d.res[i],names[i])).join('')}</div>
      ${setups.length>1&&t.n>1?`<p class="hint" style="margin-top:10px">${t.n} disasters so far. Before survived ${t.a}, now survived ${t.b}.</p>`:''}</div>`:''}
  </div>`;
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
let buildSeen=null; // the new setup's scores as last drawn on the Build screen, to notice when a change moves them
function screenMap(which){
  // The map shows the setup. Its two buttons open the disaster panel and the edit form, each in a dialog (see render).
  // The map fills the screen. A chip in one corner gives the two risks in a word each and opens the full scoreboard.
  const tool=(attrs,on,icon,name,short)=>`<button class="maptool" ${attrs}${on==null?'':` aria-pressed="${on}"`} aria-label="${name}" title="${name}"><span aria-hidden="true">${icon}</span>${short}</button>`;
  const intro=which==='base'&&S.mapIntro==='run',sc=scoreOf(S[which]),word={low:'Low',mid:'Medium',high:'High'};
  const risk=(name,v)=>`<span><i style="background:${riskColor(v)}"></i>${name} <b>${word[level(v)]}</b></span>`;
  // A disaster that can be shown on the map plays there, and its result is a bar over the map instead of a dialog.
  // Disasters stack up until the coins are gone or the player resets (see throwDisaster).
  const R=S.run,d=R&&S.mapDis,o=d&&d.res[0],over=R&&R.over;
  const fx=d?fxOf(d,R):null;
  const result=fx?`<div class="mapresult ${over?'bad':'ok'}" role="status"><b>${d.icon} ${d.label}</b>${tagline(d.id)?`<i class="tagline">${tagline(d.id)}</i>`:''}<span>${o.text}${over&&over.text?' '+over.text:''}</span>
      <span class="rowb"><span class="st lv-${over?'high':'low'}">${over?over.verdict:'Coins safe'}</span><span class="runs">${over?(R.n?`after surviving ${R.n}`:'at the first disaster'):`Survived ${R.n} in a row`}</span></span>
      <div class="rowb">${over?'<button class="btn small" data-act="mapDisDone">↺ Reset and try again</button><button class="btn small ghost" data-act="simPick">Pick one</button>':'<button class="btn small" data-act="mapAnother">🎲 Another</button><button class="btn small ghost" data-act="simPick">Pick one</button><button class="btn small ghost" data-act="mapDisDone">↺ Reset</button>'}</div></div>`:'';
  // The Build screen is the same map showing the new setup. Its chip compares each risk with the current setup's, and
  // while no disaster is playing it offers the model's next recommended changes as cards that apply with one tap.
  const build=which==='mine',was=build?scoreOf(S.base):null;
  // On the Build screen the chip has two rows, Before and Now, each with its own coloured dots. When a change moves the
  // scores, the Now row plays from the old values to the new ones for about three seconds (see .chg in the CSS).
  if(build){
    if(buildSeen&&(buildSeen.theft!==sc.theft||buildSeen.loss!==sc.loss))S.chipAnim={from:buildSeen,until:Date.now()+3200};
    buildSeen={theft:sc.theft,loss:sc.loss};
  }
  const moving=build&&S.chipAnim&&Date.now()<S.chipAnim.until?S.chipAnim.from:null;
  const cell=(name,v,from)=>from!=null&&from!==v
    ?`<span class="chg"><i style="background:${riskColor(v)};--a:${riskColor(from)};--b:${riskColor(v)}"></i>${name} <b class="swap"><em>${word[level(from)]} ${from}</em><em>${word[level(v)]} ${v}</em></b></span>`
    :`<span><i style="background:${riskColor(v)}"></i>${name} <b>${word[level(v)]} ${v}</b></span>`;
  const chip=build?`<small>Before</small>${cell('Theft',was.theft)}${cell('Loss',was.loss)}<small>Now</small>${cell('Theft',sc.theft,moving&&moving.theft)}${cell('Loss',sc.loss,moving&&moving.loss)}`
    :risk('Theft risk',sc.theft)+risk('Loss risk',sc.loss);
  const tips=build&&!fx?bestChanges(S.mine,true):null;
  const tip=(k,title,x)=>x?`<button class="mapcardtip" data-act="mapApply" data-k="${k}"><small>${title}</small><b>${x.do}</b><span>Theft ${x.from.theft} → ${x.to.theft} · Loss ${x.from.loss} → ${x.to.loss}</span></button>`:'';
  const cards=tips?`<div class="mapcards">${tip('small','💡 A small step',tips.small)}${tip('big','🏗️ A big step',tips.big)}${!tips.small&&!tips.big?'<div class="mapcardtip done"><b>Nothing more to suggest.</b><span>From here, every change trades one risk for another.</span></div>':''}</div>`:'';
  return `<h2 class="sr">${build?'Build your new setup':'Your setup today'}</h2>
  <div class="mapcard${intro?' mapintro':''}${result||cards?' lift':''}">${SetupMap.svg(S[which],fx)}<span class="maplabel">${build?'Your new setup':'Your current setup'}</span>${result}${cards}${intro?'<svg class="mapline" aria-hidden="true"></svg><div class="mapcap" role="status"></div>':''}
    <button class="mapscore${build?' rows':''}${moving?' changing':''}" data-act="scores" aria-label="${build?`Before: theft risk ${was.theft}, loss risk ${was.loss}. Now: theft risk ${sc.theft}, loss risk ${sc.loss}`:`Theft risk ${word[level(sc.theft)]}, loss risk ${word[level(sc.loss)]}`}. Open the scoreboard">${chip}</button>
    <div class="maptools">${tool('data-act="help"',S.helpOpen,'❓','Help','Help')}${tool('data-act="simBase"',!!S.mapDis,'🔥','Simulate a disaster','Try a disaster')}${tool('data-act="editBase"',S.editBase,'✏️',build?'Edit new setup':'Edit current setup',build?'Edit new setup':'Edit current setup')}<button class="maptool next" data-act="go" data-to="${build?3:2}"><span aria-hidden="true">${build?'🧪':'🚀'}</span>${build?'Try using it →':'Improve it →'}</button></div></div>`;
}
function screenToday(){return screenMap('base')}
function screenBuild(){return screenMap('mine')}
function signPanel(){
  const tx=S.w.tx,st=S.mine,usable=st.keys.filter(k=>k.device!=='none'||k.backup!=='none').length;
  const slots=Array.from({length:st.m},(_,j)=>tx.sigs[j]===undefined?'<span class="slot"></span>':`<span class="tok" style="--kc:var(--k${tx.sigs[j]})">${LETTERS[tx.sigs[j]]}</span>`).join('');
  const where=k=>isProv(k)?'Provider co-signs online':k.device==='none'?(k.backup==='none'?'Exists nowhere, can’t sign':'Restore from backup first'):PLACES[k.dloc];
  return `<div class="sign" id="sign"><div class="signhead"><h3>${esc(tx.label)}</h3><span class="amt">${btc(tx.amt)}</span></div>
    <div class="slots">${slots}<span class="hint">${tx.sigs.length} of ${st.m} ${st.m===1?'signature':'signatures'}</span></div>
    <p class="hint">${usable<st.m?'Not enough usable keys, so these coins are stuck.':'Tap a key to sign with it.'}</p>
    <div class="sigkeys">${st.keys.map((k,i)=>`<button data-act="sig" data-i="${i}" aria-pressed="${tx.sigs.includes(i)}"${k.device==='none'&&k.backup==='none'?' disabled':''} style="--kc:var(--k${i})"><span class="tok">${LETTERS[i]}</span><span>Key ${LETTERS[i]}<small>${where(k)}</small></span></button>`).join('')}</div>
    <div><button class="btn ghost small" data-act="cancelTx">Cancel</button></div></div>`;
}
function screenUse(){
  const w=S.w,st=S.mine,busy=!!w.tx||!!w.rolling,d=w.done,cust=custodial(st),old=S.base;
  if(st.type==='etf')return `<h2>Use it</h2>
  <p class="lede">With an ETF there is nothing to try here.</p>
  <div class="card"><h3>An ETF is shares, not bitcoin</h3><p class="hint" style="margin-top:4px">You can’t send, receive or spend the coins. To pay for anything you sell shares through your broker, during market hours.</p></div>
  <div class="rowb"><button class="btn ghost" data-act="go" data-to="2">Change your setup</button><button class="btn" data-act="go" data-to="4">Stress test it</button></div>`;
  const chk=(on,l)=>`<span class="check${on?' done':''}">${on?'✓':'○'} ${l}</span>`;
  const item=(e,l,a)=>`<div class="item"><span class="emo" aria-hidden="true">${e}</span><b>${l}</b><span class="hint">${btc(a)}</span><button class="btn small" data-act="buy" data-l="${l}" data-a="${a}" aria-label="Buy ${l.toLowerCase()}" ${w.vault<a?'disabled':''}>Buy</button></div>`;
  const oldHint=custodial(old)?{exchange:'On an exchange',fintech:'In a payment app',bank:'With a bank',etf:'ETF shares'}[old.type]:old.n===1?'1 key':`${old.m}-of-${old.n}`;
  return `<h2>Use it</h2>
  <p class="lede">Move some coins and spend a little. Feel what daily life is like.</p>
  <div class="checks"><span class="hint">Things to try</span>${chk(d.test,'Send a test')}${chk(d.back,'Send some back')}${cust?'':chk(st.tested,'Practice recovery')}${chk(d.moved,'Move the rest')}${chk(d.bought,'Buy something')}${w.old!==SATS||w.vault>0||st.tested||w.lost||w.log.length?'<button class="link" style="font-size:.88rem;margin-left:4px" data-act="resetUse">Reset</button>':''}</div>
  <div class="flow">
    <div class="wallet"><div class="wtop"><span class="wname">Old setup</span><span class="hint">${oldHint}</span></div><div class="bal">${btc(w.old)}</div>
      ${w.old<=0?`<span class="hint">${w.lost?'Empty. The coins are gone.':'Empty. Everything has moved.'}</span>`:`<div class="rowb">${w.old>=1e6?`<button class="btn small" data-act="testIn" ${busy?'disabled':''}>Send 0.01 test</button>`:''}<button class="btn small ghost" data-act="moveRest" ${busy?'disabled':''}>Move it all</button></div>`}</div>
    <div class="arrow" aria-hidden="true"></div>
    <div class="wallet vault"><div class="wtop"><span class="wname">${cust?ACCT[st.type]:'New wallet'}</span><span class="toks">${cust?'':st.keys.map((k,i)=>`<span class="tok" style="--kc:var(--k${i})">${LETTERS[i]}</span>`).join('')}</span></div><div class="bal">${btc(w.vault)}</div>
      <div class="rowb"><button class="btn small" data-act="testOut" ${busy||w.vault<5e5?'disabled':''}>Send 0.005 back</button><span class="hint">${cust?HOLDER[st.type][0].toUpperCase()+HOLDER[st.type].slice(1)+' signs':st.n===1?'1 key signs':`${st.m} of ${st.n} keys sign`}</span></div></div>
  </div>
  ${w.rolling?'<div class="dice" role="status"><span class="die" aria-hidden="true">🎲</span><span><b>Rolling the dice…</b><br><span class="hint">You’re moving everything without a test first.</span></span></div>':''}
  ${w.lost?`<div class="lostbox" role="alert"><b>You lost it all.</b><span>You moved ${btc(w.lost)} without a test first, and something was wrong: a mistyped address, a bad backup, or a wallet that wasn’t set up the way you thought.</span><button class="btn small" data-act="retry">Try again with 1 BTC</button></div>`:''}
  <p class="hint">Receiving is always easy: you only share an address. Extra keys only add work when you spend.</p>
  ${w.receipt?`<p class="receipt${w.receipt.startsWith('You were lucky')?' warn':''}" role="status">${esc(w.receipt)}</p>`:''}
  ${w.tx?signPanel():`<div><div class="sectionh"><h3>Spend from ${cust?HOLDER[st.type]:'the new wallet'}</h3>${w.vault<1e4?`<span class="hint">Put coins in ${cust?'the account':'the new wallet'} first.</span>`:''}</div>
    <div class="shop">${item('☕','Coffee',1e4)}${item('💻','Laptop',2e6)}${item('🚗','Used car',35e6)}</div></div>
  ${cust?'':`<div class="card"><div class="split"><div><h3>Practice recovery</h3><p class="hint">Wipe every device and restore from your backups.</p></div>
    <button class="btn small ghost" data-act="rehearse">${st.tested?'Run again':'Wipe and recover'}</button></div>
    ${w.report?`<div class="report" style="margin-top:12px">${w.report.map(r=>`<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div>`:''}</div>`}
  ${w.log.length?`<div><p class="hint" style="margin-bottom:6px">Activity</p><ul class="log">${w.log.slice(0,4).map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div>`:''}`}
  <div><button class="btn" data-act="go" data-to="4">Stress test it</button></div>`;
}
function screenStress(R){
  const dT=R.mine.theft-R.base.theft,dL=R.mine.loss-R.base.loss,w=d=>d<=-3?'down':d>=3?'up':'same';
  const verdict={'down/down':'Safer on both counts.','down/up':'Harder to steal, easier to lose.','up/down':'Harder to lose, easier to steal.','up/up':'Riskier on both counts.','same/same':'About the same as before.',
    'down/same':'Harder to steal, same loss risk.','same/down':'Harder to lose, same theft risk.','up/same':'Easier to steal, same loss risk.','same/up':'Easier to lose, same theft risk.'}[w(dT)+'/'+w(dL)];
  const arrow=d=>d<=-3?'▼':d>=3?'▲':'≈';
  const num=v=>`<b style="color:color-mix(in srgb,${riskColor(v)} 80%,var(--shade))">${v}</b>`;
  return `<h2>Stress test</h2>
  <p class="lede">Throw disasters at both setups and see which one holds up.</p>
  ${disasterCard('stress',[S.base,S.mine],S.dis2,'Simulate a disaster','The same disaster hits your old setup and your new one.')}
  <div class="card"><p class="hint">Overall</p><p class="verdict">${verdict}</p>${R.mine.control!==R.base.control?`<p style="font-weight:700;margin-top:6px">${(dT+dL<0)===(R.mine.control>R.base.control)?'And':'But'} ${R.mine.control>R.base.control?(R.mine.control===4?'the coins are now fully yours.':'more of the control is now yours.'):'you’ve handed over some control.'}</p>`:''}
    <div class="deltas"><span class="pill">Theft risk ${num(R.base.theft)} to ${num(R.mine.theft)} ${arrow(dT)}</span><span class="pill">Loss risk ${num(R.base.loss)} to ${num(R.mine.loss)} ${arrow(dL)}</span><span class="pill">Control: ${R.base.control===R.mine.control?CTRL[R.mine.control].toLowerCase():CTRL[R.base.control].toLowerCase()+', now '+CTRL[R.mine.control].toLowerCase()}</span><span class="pill">Setup effort ${R.base.setup} to ${R.mine.setup} of 5</span><span class="pill">Spending effort ${S.base.type==='etf'?'can’t spend':R.base.spend} to ${S.mine.type==='etf'?'can’t spend':R.mine.spend+' of 5'}</span></div>
    <h3 style="margin-top:16px">Your new setup in plain words</h3>${summaryBody(S.mine)}
    <p class="hint" style="margin-top:10px">Not happy? <button class="btn ghost small" data-act="go" data-to="2">Tweak your setup</button></p></div>
  <div class="card share"><h3>Like the app? Help share it.</h3>
    <div class="rowb"><a href="${SHARE_URL}">${SHARE_URL.replace('https://','')}</a><button class="btn small" data-act="share">${S.shared?'Copied':'Copy link'}</button></div></div>`;
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
      <p>Setup effort is the one-time work: how many keys, places, backups and secrets you have to arrange. Spending effort is the work every time you send: how many signers you need, where they are and how they connect. Receiving is always easy, because you only share an address.</p></div>
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
  $('stage').innerHTML=[screenStart,screenToday,screenBuild,screenUse,()=>screenStress(R)][S.step]();
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
    ed.innerHTML=`<div class="simbody"><div class="simhead"><span class="emo" aria-hidden="true">✏️</span><h3>${mw==='mine'?'Edit new setup':'Edit current setup'}</h3><button class="simx" data-act="editBase" aria-label="Close">×</button></div>${editor(mw)}<div><button class="btn" data-act="editBase">Done</button></div></div>`;
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
  // help, opened from the map: everything the footer says on the other screens
  const hp=$('help');
  if(S.helpOpen&&onMap){
    hp.innerHTML=`<div class="simbody"><div class="simhead"><span class="emo" aria-hidden="true">❓</span><h3>Help</h3><button class="simx" data-act="help" aria-label="Close">×</button></div>
      <p>Pretend coins only. Scores are rough estimates, not advice.</p>
      <p><b>Never enter your seed or passphrase into any website.</b> This simulator will never ask for them.</p>
      <div class="rowb"><button class="btn small ghost" data-act="helpMore" aria-expanded="${!!S.helpMore}">There is no perfect setup</button><button class="btn small ghost" data-act="reset">Start over</button><span class="helpgh">${document.querySelector('footer .gh').outerHTML}</span></div>
      ${S.helpMore?`<div class="scoremore">${perfectHTML()}</div>`:''}</div>`;
    if(!hp.open)hp.showModal();
  }else if(hp.open)hp.close();
  document.body.classList.toggle('mapscreen',onMap);
  if(S.step===1&&S.mapIntro==='run')paintMapIntro(false); // the map was just redrawn mid-introduction: put it back as it was
  if(act&&$(act))$(act).focus();
}
function go(to){
  if(to>1&&!S.mine)S.mine=clone(S.base);
  const firstMap=to===1&&!mapIntroSeen&&!calm;
  if(firstMap){mapIntroSeen=true;S.mapIntro='run';mapBeat=-1}
  if(to===0&&S.step!==0)startIntro(); // coming back to the first screen replays the car's entrance
  if(to!==1&&S.mapIntro==='run')S.mapIntro='done'; // leaving the map (by "Improve it", say) ends its introduction
  buildSeen=null;S.chipAnim=null; // arriving on the Build screen never animates the scores; only changes made there do
  S.step=to;S.simBase=false;S.editBase=false;S.scoresOpen=false;S.helpOpen=false;S.mapDis=S.run=null;S.w.receipt=null;S.w.tx=null;render();window.scrollTo({top:0});
  if(firstMap)runMapIntro();
}
/* ---------- map introduction ---------- */
// The first time the map is shown it builds itself: you, then each thing you own, with a caption for each.
// Each caption waits for a click or tap, so nobody is rushed. It plays once per page load and never under reduced motion.
// How far it has got is kept in mapBeat, not in the page, because the screen is redrawn on every change of state:
// paintMapIntro() can rebuild the current moment on a freshly drawn map, so a redraw can never leave the map empty.
let mapIntroSeen=false,mapBeat=-1;
function runMapIntro(){setTimeout(()=>{if(mapBeat<0)nextMapBeat()},350)}
function nextMapBeat(){
  if(S.mapIntro!=='run')return;
  if(++mapBeat<SetupMap.beats().length)return paintMapIntro(true);
  S.mapIntro='done'; // show the finished map and its buttons
  const card=document.querySelector('.mapcard.mapintro');if(!card)return;
  card.querySelectorAll('.mapcap,.mapline').forEach(e=>e.remove());
  card.classList.remove('mapintro');card.classList.add('mapfresh');
}
function paintMapIntro(arriving){
  const card=document.querySelector('.mapcard.mapintro');if(!card||mapBeat<0)return;
  const cap=card.querySelector('.mapcap'),line=card.querySelector('.mapline'),beats=SetupMap.beats(),b=beats[mapBeat],at=mapBeat;
  // everything up to now is on the map; only what belongs to the newest caption animates in
  beats.slice(0,mapBeat+1).forEach((x,n)=>card.querySelectorAll([...x.steps.map(s=>`[data-step="${s}"]`),x.point].filter(Boolean).join(',')).forEach(e=>{e.classList.add('in');e.classList.toggle('was',n<mapBeat||!arriving)}));
  cap.innerHTML=`${mapBeat?'<button type="button" class="mapback" aria-label="Back">◂</button>':''}<span>${esc(b.text)}</span><button type="button" class="mapnext" aria-label="Continue">▸</button>`;
  cap.classList.toggle('up',!!b.point); // a caption about a button sits above the buttons, so its line can slant down to one
  cap.classList.remove('in');void cap.offsetWidth;cap.classList.add('in');
  // a faint line from the caption to what it is talking about, drawn once that thing has landed
  const target=card.querySelector(b.point||`[data-step="${b.steps[0]}"]`);
  line.innerHTML='';
  if(target)setTimeout(()=>{
    if(mapBeat!==at||!line.isConnected)return;
    const c=card.getBoundingClientRect(),t=target.getBoundingClientRect(),k=cap.getBoundingClientRect(),tx=t.left+t.width/2;
    // up to a thing on the map from the top of the caption, or down to a button from the bottom of it
    const below=t.top>=k.bottom,x1=Math.max(k.left+24,Math.min(k.right-24,below?tx:k.left+k.width/2))-c.left,y1=(below?k.bottom:k.top)-c.top;
    const x2=tx-c.left,y2=(below?t.top-5:Math.min(t.top+t.height/2,k.top-6))-c.top;
    line.innerHTML=`<line pathLength="1" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle cx="${x2}" cy="${y2}" r="7"/>`;
  },b.point||!arriving?80:520);
  // A click continues, unless it is on something that has already arrived: a thing opens its card, a button does its job.
  // The arrow on the left of the caption goes back one step.
  if(!card.dataset.intro){card.dataset.intro=1;card.addEventListener('click',ev=>{
    if(ev.target.closest('.mapback'))return prevMapBeat();
    if(!ev.target.closest('.maptap,.maptool,.mapresult'))nextMapBeat();
  })}
}
function prevMapBeat(){
  if(S.mapIntro!=='run'||mapBeat<1)return;
  mapBeat--;render(); // redrawing clears whatever the later step had brought in; render() then repaints up to this step
}
// Things and buttons can be used as soon as their caption has introduced them. One rule for all of them: closing the
// dialog that opened moves the introduction on, the same as a click on the map would.
for(const id of ['sim','edit','mapitem'])$(id).addEventListener('close',()=>{if(S.mapIntro==='run'&&S.step===1)nextMapBeat()});
function resize(st,n){
  n=Math.max(1,Math.min(5,n));
  while(st.keys.length<n)st.keys.push(newKey());
  st.keys.length=n;st.n=n;st.m=Math.max(1,Math.min(st.m,n));st.tested=false;if(st===S.mine)S.w.report=null;
}
function log(t){S.w.log.unshift(t)}
function finishTx(){
  const w=S.w,tx=w.tx,st=S.mine;
  w.vault-=tx.amt;if(tx.back){w.old+=tx.amt;w.done.back=true}else w.done.bought=true;
  if(custodial(st)){
    const who=HOLDER[st.type];
    w.receipt=`${tx.past}. ${who[0].toUpperCase()+who.slice(1)} signed for you. No keys needed, and no say if it ever refuses.`;
    log(`${tx.label}: ${btc(tx.amt)}, approved by ${who}`);
  }else{
    const places=[...new Set(tx.sigs.map(i=>{const k=st.keys[i];return isProv(k)?(k.device==='prov2'?'the second provider':'the provider'):k.device==='none'?(k.backup==='paper'||k.backup==='metal'?PLAIN[k.bloc]:'memory or the cloud'):PLAIN[k.dloc]}))];
    w.receipt=`${tx.past}. You needed ${tx.sigs.length} ${tx.sigs.length===1?'key':'keys'} from ${places.length} ${places.length===1?'place':'places'}: ${places.join(', ')}.`;
    log(`${tx.label}: ${btc(tx.amt)}, signed with ${tx.sigs.map(i=>'Key '+LETTERS[i]).join(' + ')}`);
  }
  w.tx=null;
}
function rehearse(){
  const st=S.mine,r=[],prov=st.keys.some(isProv);
  st.keys.forEach((k,i)=>{const n='Key '+LETTERS[i];
    if(isProv(k)){r.push(['🤝',`${n} stays with the provider. Nothing to restore.`]);return}
    if(k.backup==='none')r.push(['⚠️',k.device==='none'?`${n} exists nowhere, so it can never sign.`:prov?`${n} has no backup. If its device dies, you lean on your other key and the provider.`:`${n} has no backup. If its device dies, the key is gone.`]);
    else if(k.backup==='memory')r.push(['🧠',`${n} came back from memory today. Ten years from now is harder.`]);
    else r.push(['✅',`${n} restored from its ${BACKUPS[k.backup].toLowerCase()} backup.`]);
    if(k.pass==='memory')r.push(['🧠',`${n} also needs a passphrase that only lives in your head.`]);
  });
  if(st.m<st.n){
    if(prov)r.push(['✅','The provider handed back your wallet file.']);
    else if(st.config==='none')r.push(['⚠️','The wallet file only lives in the app. It worked today because every key was here. With one key missing you would be stuck.']);
    else r.push(['✅','Wallet rebuilt from the backed-up wallet file.']);
  }
  if(TL(st))r.push(['⏳','The recovery key restores too. It can only spend after the coins sit unmoved for a year.']);
  r.push(['🎉','Your balance showed up again. Tested backups lower your loss risk.']);
  st.tested=true;S.w.report=r;log('Practiced a full wipe and recovery');
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
  if(a==='applyRec'){const t=bestChanges(S.mine,true)[b.dataset.k];if(t){S.mine=clone(t.setup);S.picked.mine=true;S.w.report=null;changed('mine')}render();const dl=$('how');dl.innerHTML=recHTML(!!t);dl.scrollTop=0;return}
  if(a==='howClose'){$('how').close();return}
  if(a==='editKey'){S.open[b.dataset.id]=!S.open[b.dataset.id]}
  if(a==='pick'){const s=b.dataset.s,v=b.dataset.v,st=S[s];
    if(v==='custom')S.custom[s]=true;
    else{S.custom[s]=false;
      if(v==='phone'||v==='laptop'||v==='hw'){const n=presetSetup(v==='phone'?'hot':v==='laptop'?'laptop':'typical');st.keys=n.keys;st.n=1;st.m=1}
      else{const mn=v.split('-').map(Number);setShape(st,mn[0],mn[1])}
      st.tested=false;if(s==='mine')S.w.report=null}}
  if(a==='go'){if(b.classList.contains('cta')&&driveOff(()=>go(+b.dataset.to)))return;return go(+b.dataset.to)}
  if(a==='reset'){reset();startIntro();return go(0)} // "Start over" replays the car's entrance as well
  if(a==='editBase'){ // editing the setup ends any run of disasters. On the Build screen the form starts from the setup as it stands.
    S.editBase=!S.editBase;
    if(S.editBase){S.mapDis=S.run=null;if(S.step===2)S.picked.mine=true}
  }
  // "Try a disaster" always throws a random one onto the map. Choosing a particular one comes afterwards, from the result.
  if(a==='simBase'||a==='mapAnother')throwDisaster(null);
  if(a==='simPick'){S.simBase=true;S.simList=true}
  if(a==='simClose')S.simBase=false;
  if(a==='mapDisDone'){S.mapDis=S.run=null;render();if(S.mapIntro==='run')nextMapBeat();return} // Reset: the map as it was. During the onboarding it also moves on.
  if(a==='help'){S.helpOpen=!S.helpOpen;S.helpMore=false}
  if(a==='helpMore')S.helpMore=!S.helpMore;
  if(a==='scores'){S.scoresOpen=!S.scoresOpen;S.scoresMore=false}
  if(a==='scoresMore'){S.scoresMore=!S.scoresMore;S.how=S.step===2?'mine':'base'} // the explanation opens further down the same dialog
  if(a==='mapApply'){ // a recommendation card on the Build map: apply it, and any run of disasters starts afresh
    const t=bestChanges(S.mine,true)[b.dataset.k];
    if(t){S.mine=clone(t.setup);S.picked.mine=true;S.w.report=null;changed('mine');S.mapDis=S.run=null}
  }
  if(a==='share'){ // copy the link; where the page isn't allowed to, the link is still there to copy by hand
    try{navigator.clipboard.writeText(SHARE_URL).then(()=>{S.shared=true;render()},()=>{})}catch(e){}
    return;
  }
  if(a==='simList')S.simList=true;
  if(a==='conf'){S.conf[b.dataset.which]=+b.dataset.n}
  if(a==='preset'&&b.dataset.w==='base')S.base=presetSetup(b.dataset.p);
  else if(a==='preset'){const p=b.dataset.p;
    if(p){S.mine=presetSetup(p);S.w.report=null}
    else{const m=+b.dataset.m,n=+b.dataset.n;S.mine.type='keys';S.mine.keys=S.mine.keys.map(k=>isProv(k)?newKey():k);resize(S.mine,n);S.mine.m=m}}
  if(a==='n+'||a==='n-'){const st=S[b.dataset.s];resize(st,st.n+(a==='n+'?1:-1))}
  if(a==='m+'||a==='m-'){const st=S[b.dataset.s];st.m=Math.max(1,Math.min(st.n,st.m+(a==='m+'?1:-1)))}
  if(a==='testIn'){w.old-=1e6;w.vault+=1e6;w.receipt='Test received in the new wallet.';w.done.test=true;log('Test received: 0.01 BTC')}
  if(a==='moveRest'&&!w.done.test){
    const show=q=>{const el=document.querySelector(q);if(el)el.scrollIntoView({block:'center',behavior:'smooth'})};
    w.rolling=true;w.receipt=null;render();show('.dice');
    setTimeout(()=>{const amt=w.old;w.rolling=false;w.old=0;
      if(Math.random()<.5){w.lost=amt;log('Moved '+btc(amt)+' without a test, and lost it')}
      else{w.vault+=amt;w.done.moved=true;w.receipt='You were lucky this time. You moved all your funds to a new wallet without testing it.';log('Moved '+btc(amt)+' without a test')}
      render();show('.lostbox,.receipt')},1300);
    return}
  if(a==='moveRest'){log('Moved '+btc(w.old)+' to the new wallet');w.vault+=w.old;w.old=0;w.receipt='Everything is in the new wallet now.';w.done.moved=true}
  if(a==='resetUse'){S.w={old:SATS,vault:0,log:[],tx:null,receipt:null,report:null,done:{}};if(S.mine.tested){S.mine.tested=false;changed('mine')}}
  if(a==='retry'){S.w={old:SATS,vault:0,log:[],tx:null,receipt:null,report:null,done:{}}}
  if(a==='testOut'){w.tx={label:'Send back',past:'Sent 0.005 BTC back',amt:5e5,back:true,sigs:[]};w.receipt=null}
  if(a==='buy'){w.tx={label:'Buy '+b.dataset.l.toLowerCase(),past:'Bought a '+b.dataset.l.toLowerCase(),amt:+b.dataset.a,sigs:[]};w.receipt=null}
  if((a==='testOut'||a==='buy')&&custodial(S.mine))finishTx();
  if(a==='cancelTx')w.tx=null;
  if(a==='sig'&&w.tx){const i=+b.dataset.i,at=w.tx.sigs.indexOf(i);if(at>=0)w.tx.sigs.splice(at,1);else w.tx.sigs.push(i);if(w.tx.sigs.length>=S.mine.m)finishTx()}
  if(a==='rehearse')rehearse();
  if(a==='disaster')disaster(b.dataset.w,b.dataset.id||null);
  if(a==='preset')changed(b.dataset.w||'mine');
  if(b.dataset.s)changed(b.dataset.s);
  if(a==='copy'){if(!S.note.trim()){$('copied').textContent='Write a note first';return}const t=feedbackText();const done=()=>{$('copied').textContent='Copied'};
    try{navigator.clipboard.writeText(t).then(done,()=>{$('note').select()})}catch(e){$('note').select()}return}
  render();
  if((a==='buy'||a==='testOut')&&$('sign'))$('sign').scrollIntoView({block:'nearest'});
});
function changed(which){S.dis2=null;S.tally={n:0,a:0,b:0};if(which==='base')S.dis=null}
/* ---------- disaster taglines ---------- */
// One line under each disaster's name on the map, mostly borrowed from memes. They are jokes about the event,
// never advice. Brand and supply-chain events have an id per brand, so those match on the start of the id.
const TAGLINE={
  t_home:'They even took the kitchen sink.',t_office:'The cleaner found something interesting.',t_rel:'“I was just looking for the Wi-Fi password.”',t_friend:'“I was just looking for the Wi-Fi password.”',
  t_bank:'An inside job.',t_carry:'Yoink.',t_hot:'You downloaded more RAM.',t_cloud:'hunter2 was not a strong password.',
  t_duress:'The $5 wrench attack.',t_border:'Papers, please.',t_phish:'Your wallet urgently needs to be “validated”.',t_lapse:'You had one job.',
  t_guess:'correct horse battery staple',t_app:'It’s not a bug, it’s a feature.',t_brand:'It’s not a bug, it’s a feature.',t_supply:'It fell off the back of a truck.',
  t_prov:'“We take your security very seriously.”',t_provapp:'Automatic updates: what could go wrong?',t_prov2:'“We take your security very seriously.”',
  c_acct:'New phone, who dis?',c_hack:'“We take your security very seriously.”',c_freeze:'Withdrawals are temporarily paused.',c_frozen:'Computer says no.',c_rules:'It’s for your own protection.',
  l_dev:'Have you tried turning it off and on again?',l_home:'This is fine.',l_office:'It was in the box marked “misc”.',l_rel:'It did not spark joy.',l_friend:'Dude, where’s my seed?',
  l_bank:'Sorry, we’re closed.',l_carry:'It’s in your other trousers. It is not in your other trousers.',l_cloud:'Forgot your password? So did we.',
  l_prov:'It’s not you, it’s us.',l_prov2:'It’s not you, it’s us.',c_bust:'Assets are fine.',l_gov:'“We’re from the government and we’re here to help.”',l_bug:'Works on my machine.',
  l_time:'One does not simply remember twelve words.',
};
const tagline=id=>TAGLINE[id]||TAGLINE[Object.keys(TAGLINE).find(k=>id.startsWith(k))]||'';
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
  if(!id){ // random: one that can still reach something, and not the same one twice running
    const all=disasterList([L]).map(x=>x[1]),can=all.filter(e=>touches(L,e)),from=(can.length?can:all).filter(e=>!S.dis||e.id!==S.dis.id),pool=from.length?from:all;
    id=pool[Math.floor(Math.random()*pool.length)].id;
  }
  const d=S.dis=S.mapDis=runDisaster([L],id),o=d.res[0];
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
  if(w==='today')throwDisaster(id);
  else{S.dis2=runDisaster([S.base,S.mine],id,S.dis2&&S.dis2.id);const t=S.tally;t.n++;if(!S.dis2.res[0].bad)t.a++;if(!S.dis2.res[1].bad)t.b++}
}
document.addEventListener('change',ev=>{
  const el=ev.target;
  if(!el.dataset||!el.dataset.f)return;
  const st=S[el.dataset.s],k=+el.dataset.k,f=el.dataset.f;
  changed(el.dataset.s);
  if(k<0){if(f==='type'){setWhere(st,el.value);S.custom[el.dataset.s]=false;S.picked[el.dataset.s]=true}else st[f]=el.value}else{const key=el.dataset.k==='r'?st.rkey:st.keys[k];key[f]=el.value;
    if(f==='device'){if(el.value==='phone')key.dloc='carry';if(el.value==='laptop')key.dloc='home';if(el.value==='prov'||el.value==='prov2'){key.backup='none';key.pass='none';if(key.brand==='D')key.brand='A'}}}
  if(f!=='pin'){st.tested=false;if(st===S.mine)S.w.report=null}
  render();
});
$('how').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('sim').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('sim').addEventListener('close',()=>{if(S.simBase){S.simBase=false;render()}}); // Esc or a click outside
$('edit').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('edit').addEventListener('close',()=>{if(S.editBase){S.editBase=false;render()}});
$('scores').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('scores').addEventListener('close',()=>{if(S.scoresOpen){S.scoresOpen=false;render()}});
$('help').addEventListener('click',ev=>{if(ev.target===ev.currentTarget)ev.currentTarget.close()});
$('help').addEventListener('close',()=>{if(S.helpOpen){S.helpOpen=false;render()}});
document.addEventListener('toggle',ev=>{const d=ev.target;if(d.dataset&&d.dataset.d)S.open[d.dataset.d]=d.open;
  if(d.classList&&d.classList.contains('dmenu')&&d.open)d.querySelector('.dlist').scrollIntoView({block:'nearest'})},true);
// The disaster menu closes on a click outside it or on Escape.
document.addEventListener('click',ev=>{document.querySelectorAll('.dmenu[open]').forEach(d=>{if(!d.contains(ev.target))d.open=false})});
document.addEventListener('keydown',ev=>{if(ev.key!=='Escape')return;const d=document.querySelector('.dmenu[open]');if(d){d.open=false;d.querySelector('summary').focus()}});
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
    <linearGradient id="c3-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD95A"/><stop offset="1" stop-color="#FFB81F"/></linearGradient>
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

  /* the coin: a thick disc with a face on the front and a bitcoin mark on the back */
  const CY=-296,CZ=-30,CR=64,CT=18;
  plane(root,2*CR,2*CR,`translate3d(0,${CY}px,${CZ+CT/2}px)`,'',`<svg viewBox="-64 -64 128 128">
    <circle r="64" fill="url(#c3-c)"/><circle r="55" fill="none" stroke="#F2A900" stroke-width="3" opacity=".6"/>
    <g class="c3-look"><g class="c3-blink"><ellipse cx="-22" cy="-12" rx="8" ry="11" fill="#1B1840"/><ellipse cx="22" cy="-12" rx="8" ry="11" fill="#1B1840"/>
    <circle cx="-19" cy="-17" r="3.2" fill="#fff"/><circle cx="25" cy="-17" r="3.2" fill="#fff"/></g></g>
    <circle cx="-40" cy="10" r="10" fill="#FF6B93" opacity=".75"/><circle cx="40" cy="10" r="10" fill="#FF6B93" opacity=".75"/>
    <path d="M-14 12Q-7 22 0 13Q7 22 14 12" fill="none" stroke="#1B1840" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  plane(root,2*CR,2*CR,`translate3d(0,${CY}px,${CZ-CT/2}px) rotateY(180deg)`,'',`<svg viewBox="-64 -64 128 128"><circle r="64" fill="#F2A900"/><circle r="50" fill="none" stroke="#FFCB3D" stroke-width="5"/>
    <g fill="#FFCB3D"><rect x="-10" y="-36" width="6" height="72" rx="3"/><rect x="2" y="-36" width="6" height="72" rx="3"/><path d="M-20 -28H8Q26 -28 26 -15Q26 -3 12 -1Q30 1 30 14Q30 28 10 28H-20Z"/></g></svg>`);
  wallsZ(root,circle(CR,20),CY,CZ,CT,'#F8B21A','#D58E00');

  /* steering wheel (a tilted ring), arms and hands, roll bar, side glass */
  for(let k=0;k<4;k++)plane(root,128,128,`translate3d(0,-236px,30px) rotateX(62deg) translateZ(${k*4-6}px)`,'','<svg viewBox="-64 -64 128 128"><circle r="55" fill="none" stroke="#1B1840" stroke-width="14"/></svg>'); // stacked rings, so it has some thickness
  // Arms: each hangs from a shoulder on the coin's edge and reaches forward to the wheel. Arm and hand are crossed
  // panels so they show from any side. The arm on the viewer's right swings up from its shoulder to wave.
  for(const sx of[-1,1]){
    const arm=group(group(root,`translate3d(${sx*52}px,-262px,-21px)`));if(sx>0)arm.classList.add('c3-wave');
    const dx=sx*2,dy=18,dz=57,L=Math.hypot(dx,dy,dz),aim=`translate3d(${dx/2}px,${dy/2}px,${dz/2}px) rotateY(${Math.atan2(-dz,dx)}rad) rotateZ(${Math.asin(dy/L)}rad)`;
    for(const rx of[0,90])plane(arm,L,15,`${aim} rotateX(${rx}deg)`,'border-radius:7px;background:#F5A800');
    for(const r of['','rotateY(90deg)','rotateX(90deg)'])plane(arm,36,36,`translate3d(${dx}px,${dy}px,${dz}px) ${r}`,'border-radius:50%;background:#FFB81F'); // three discs: round from every side
  }
  plane(root,180,86,'translate3d(0,-262px,-96px)','','<svg viewBox="-90 -43 180 86"><path d="M-84 43V-18Q-84 -37 -66 -37H66Q84 -37 84 -18V43" fill="none" stroke="#1B1840" stroke-width="12" stroke-linecap="round"/></svg>');
  for(const sx of[-1,1]){
    plane(root,68,88,`translate3d(${sx*124}px,-270px,-20px) scaleX(${-sx})`,'','<svg viewBox="-34 -44 68 88"><path d="M-30 44L-8 -30Q-2 -44 12 -40L24 -36Q34 -32 32 -20L24 44Z" fill="url(#c3-b)"/></svg>');
    plane(root,90,62,`translate3d(${sx*124}px,-257px,-20px) rotateY(90deg)`,'border-radius:12px 26px 0 0;background:linear-gradient(#9AD4FF,#3F97E6);opacity:.6');
  }
}
buildCar($('sc-pitch'));
// One unit of the drawing in pixels, so the car layer can match the painted scene at any window size.
new ResizeObserver(([e])=>{const r=e.contentRect;if(r.width)e.target.style.setProperty('--s',Math.max(r.width/1200,r.height/450))}).observe($('scene'));
/* ---------- landing entrance ---------- */
// The car jumps in once per page load. A click or tap skips to the end. Skipped entirely under reduced motion.
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
let introStart=0,introTimer=0;
function endIntro(){
  if(!document.body.classList.contains('intro'))return;
  clearTimeout(introTimer);
  document.body.classList.remove('intro');
  if(performance.now()-introStart>1000)document.body.classList.add('landed'); // it did land, so let the dust drift away
}
// Plays on page load, and again whenever the player comes back to the first screen.
function startIntro(){
  if(calm)return;
  introStart=performance.now();clearTimeout(introTimer);
  document.body.classList.remove('landed');document.body.classList.add('intro');
  introTimer=setTimeout(endIntro,1650);
  addEventListener('pointerdown',endIntro,{once:true});
}
startIntro();
// Tap the car and it hops.
$('car3d').addEventListener('click',()=>{
  const m=$('sc-mover');if(calm||m.classList.contains('hop')||document.body.classList.contains('leaving'))return;
  m.classList.add('hop');setTimeout(()=>m.classList.remove('hop'),700);
});
// "Get started": the car drives off toward you, then the next screen opens. Returns false if there is nothing to play.
function driveOff(then){
  const c=document.body.classList;
  if(calm||!c.contains('landing'))return false;
  if(c.contains('leaving'))return true;
  c.add('leaving');setTimeout(()=>{then();c.remove('leaving')},620);
  return true;
}

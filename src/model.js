/* ---------- model ---------- */
const PLACES={home:'🏠 Home',office:'🏢 Office',relative:'👪 Relative’s place',friend:'🤝 Friend’s place',bank:'🏦 Bank box',carry:'🎒 On you'};
const PLAIN={home:'home',office:'the office',relative:'a relative’s place',friend:'a friend’s place',bank:'the bank box',carry:'your pocket'};
const TYPES={keys:'Self custody',exchange:'On an exchange',fintech:'In a payment app',bank:'With a bank or broker',etf:'In an ETF'};
const WHERE={keys:'Self custody',collab:'Collaborative custody (provider)',exchange:'On an exchange',fintech:'In a payment app',bank:'With a bank or broker',etf:'In an ETF'};
const HOLDER={exchange:'the exchange',fintech:'the app',bank:'the bank',etf:'the fund'};
const ACCT={exchange:'Exchange account',fintech:'Payment app',bank:'Bank account'};
const DEVICES={hw:'Hardware signer',phone:'Phone wallet',laptop:'Laptop wallet',prov:'Held by a provider',prov2:'Held by a second provider',none:'No device, backup only'};
const BRANDS={A:'Brand A',B:'Brand B',C:'Brand C',D:'DIY'};
const HWBRANDS={A:'Brand A',B:'Brand B',C:'Brand C',D:'DIY, self-built'};
const PBRANDS={A:'Brand A',B:'Brand B',C:'Brand C'};
const bname=b=>b==='D'?'DIY signer':BRANDS[b];
const BACKUPS={metal:'Metal plate',paper:'Paper',memory:'Memorized',cloud:'Cloud or password manager',none:'No backup'};
const PINS={none:'None',simple:'Simple',strong:'Strong'};
const PASSES={none:'None',memory:'Memorized',written:'Written down'};
const CONFIGS={none:'Only in the wallet app',one:'One extra copy',all:'A copy with every seed backup'};
const ENTS={device:'The device or app',dice:'Device plus your dice rolls',diceonly:'Your dice rolls only',words:'Words you picked yourself'};
const LETTERS='12345'; // keys are numbered, so they can't be mistaken for brands A, B, C

function newKey(){return{device:'hw',brand:'A',dloc:'home',pin:'simple',backup:'paper',bloc:'home',pass:'none',ploc:'home',ent:'device',net:'online',pstr:'simple',conn:'usb'}}
function provKey(d){return Object.assign(newKey(),{device:d||'prov',backup:'none',brand:d==='prov2'?'B':'A'})}
function newSetup(){return{type:'keys',login:'sms',wd:'none',m:1,n:1,keys:[newKey()],config:'none',cloc:'home',tested:false,tl:'off',rkey:newKey()}}
function clone(o){return JSON.parse(JSON.stringify(o))}
const isProv=k=>k.device==='prov'||k.device==='prov2';
const real=k=>k.device!=='none'&&!isProv(k);
const custodial=s=>s.type!=='keys';
const phishable=k=>k.device!=='prov'&&k.device!=='prov2'&&k.backup!=='none';
const PHISH=.4;
const TL=s=>s.type==='keys'&&s.tl==='on';
const allKeys=s=>TL(s)?[...s.keys,s.rkey]:s.keys;
const LAPSE=.25;
const REACH={relative:.2,friend:.2,office:.1,bank:.02,home:0,carry:0};
const LOGINS={password:'Password only',sms:'Password + text or email code',app:'Authenticator, passkey or key'};
const WDS={none:'None',on:'Address allowlist or waiting period'};
const custP=(s,e)=>!e.cust?0:e.login?Math.min(.95,e.cust[s.type]*{password:1.12,sms:1,app:.4}[s.login||'sms'])*(s.wd==='on'?.4:1):e.cust[s.type];
const soft=k=>k.device==='phone'||k.device==='laptop';
const hot=k=>soft(k)&&k.net!=='offline';
const PSTR={simple:'Simple',strong:'Strong'};
const crack=k=>k.pstr==='strong'?.02:.4;
const CONNS={usb:'USB cable',qr:'QR code (camera)',sd:'Memory card'};
const NETS={online:'Online',offline:'Always offline'};

const THEFT=[
  {id:'t_home',label:'Burglary at home',w:.05,places:['home']},
  {id:'t_office',label:'Theft at the office',w:.04,places:['office']},
  {id:'t_rel',label:'Someone snoops at your relative’s place',w:.04,places:['relative']},
  {id:'t_friend',label:'Someone snoops at your friend’s place',w:.04,places:['friend']},
  {id:'t_bank',label:'Bank box opened without you',w:.005,places:['bank']},
  {id:'t_carry',label:'Bag or phone stolen while out',w:.08,places:['carry'],takes:true},
  {id:'t_hot',label:'Malware on your phone or computer',w:.10,hot:true},
  {id:'t_cloud',label:'Cloud account hacked',w:.08,cloud:true},
  {id:'t_duress',label:'Forced to hand over keys at home',w:.005,places:['home','carry'],duress:true},
  {id:'t_border',label:'Forced to unlock your devices at a border',w:.02,places:['carry'],border:true},
  {id:'t_phish',label:'Phishing: you type a seed into a fake website',w:.10,phish:true},
  {id:'t_lapse',label:'You forgot to update your wallet’s timelock',w:LAPSE,lapse:true},
  {id:'t_guess',label:'Someone guesses a weak seed',w:.5,guess:true},
  {id:'t_app',label:'A wallet app turns out to make weak seeds',w:.01,app:true},
  {id:'t_prov',label:'Provider hacked: its key is stolen',w:.04,prov:'prov'},
  {id:'t_provapp',label:'Provider hacked: bad update takes other keys too',w:.02,prov:'prov',push:true},
  {id:'t_prov2',label:'Second provider hacked: its key is stolen',w:.04,prov:'prov2'},
  {id:'c_acct',label:'Your account is compromised (phishing, password attack, SIM swap)',w:.14,acct:true,login:true,cust:{exchange:.85,fintech:.6,bank:.3,etf:.1}},
  {id:'c_hack',label:'A big exchange is hacked',w:.10,cust:{exchange:.6,fintech:.4,bank:.2,etf:.1},labels:{exchange:'The exchange is hacked',fintech:'The payment app’s company is hacked',bank:'The bank or its partner firm is hacked',etf:'The fund’s custodian is hacked'},multi:'The company holding the coins is hacked'},
  {id:'c_freeze',label:'Withdrawals are frozen where your coins are held',w:.20,acct:true,cust:{exchange:.3,fintech:.25,bank:.15,etf:.05},badT:'The freeze never lifts, and the company keeps your coins.',okT:'The freeze lifted and you got your coins out.',verdict:'Coins frozen'},
  {id:'c_frozen',label:'Your account is locked or banned (e.g. missing documents)',w:.10,acct:true,cust:{exchange:.4,fintech:.5,bank:.3,etf:.2},badT:'You’re shut out, and the company keeps your coins.',okT:'You sorted it out and got your coins back.',verdict:'Coins frozen'},
  {id:'c_rules',label:'Government takeover: coins held by companies are seized',w:.04,cust:{exchange:.7,fintech:.7,bank:.8,etf:.9},badT:'Your coins were seized.',okT:'Yours weren’t taken this time.',verdict:'Coins seized'}
];
const LOSS=[
  {id:'l_dev',label:'A phone or signing device dies',w:0,sw:.5,dev:true,pure:true},
  {id:'l_home',label:'Fire or flood at home',w:.04,places:['home'],fire:true},
  {id:'l_office',label:'Office fire or clear-out',w:.05,places:['office'],fire:true},
  {id:'l_rel',label:'Relative moves or loses your things',w:.10,places:['relative']},
  {id:'l_friend',label:'Friend moves or loses your things',w:.10,places:['friend']},
  {id:'l_bank',label:'Bank box closed or out of reach',w:.02,places:['bank']},
  {id:'l_carry',label:'Phone or bag lost while out',w:.17,places:['carry']},
  // Scoring only: the loss side of the theft disaster t_carry. A stolen device is also gone for you. Never thrown as its own disaster.
  {id:'l_stolen',label:'Bag or phone stolen: you must recover without it',w:.08,places:['carry'],twin:true},
  {id:'l_cloud',label:'Locked out of your cloud account',w:.05,cloud:true},
  {id:'l_prov',label:'The provider shuts down or locks you out',w:.10,prov:'prov'},
  {id:'l_prov2',label:'The second provider shuts down or locks you out',w:.10,prov:'prov2'},
  {id:'c_bust',label:'A big exchange collapses',w:.20,cust:{exchange:.9,fintech:.6,bank:.3,etf:.1},labels:{exchange:'The exchange collapses',fintech:'The payment app’s company collapses',bank:'The bank or broker collapses',etf:'The fund or its custodian collapses'},multi:'The company holding the coins collapses'},
  {id:'l_gov',label:'Government takeover: your provider can no longer co-sign',w:.04,gov:true}
];
const TIME={id:'l_time',label:'Ten quiet years: things break, fade, get forgotten',places:[]};

function elabel(e,setups){
  if(!e.labels)return e.label;
  const u=[...new Set(setups.filter(s=>s&&custodial(s)).map(s=>s.type))];
  return u.length===1?e.labels[u[0]]:u.length>1?e.multi:e.label;
}
function dist(ps){let d=[1];for(const p of ps){const nd=new Array(d.length+1).fill(0);d.forEach((v,i)=>{nd[i]+=v*(1-p);nd[i+1]+=v*p});d=nd}return d}
function atLeast(ps,m){const d=dist(ps);let s=0;for(let i=m;i<d.length;i++)s+=d[i];return s}

const BRAND_ENT={device:.9,dice:.6,diceonly:.5,words:.9};
const BUG_ENT={device:.9,dice:.2,diceonly:.05,words:.05};
const APP_ENT={device:.9,dice:.3,diceonly:.05,words:.05};
function keyStolen(k,e){
  if(isProv(k))return e.prov===k.device?1:e.duress?.5:e.border?.3:0;
  if(e.prov)return !e.push?0:hot(k)?1:k.device==='hw'&&e.pbrands&&e.pbrands.includes(k.brand)?.5:0;
  if(e.cust)return 0;
  if(e.brand)return k.device==='hw'&&k.brand===e.brand?(e.supply?BRAND_ENT:BUG_ENT)[k.ent]*(e.supply&&k.brand==='D'?.2:1):0;
  if(e.app)return k.device==='phone'||k.device==='laptop'?APP_ENT[k.ent]:0;
  if(e.guess)return(k.ent==='words'?.9:k.ent==='diceonly'?.02:0)*(k.pass==='none'?1:crack(k));
  if(e.hot)return hot(k)?.8:soft(k)?.02:k.device==='hw'?{usb:.03,qr:.005,sd:.01}[k.conn||'usb']:0;
  const at=p=>!!e.places&&e.places.includes(p);
  let dev=0,bak=0,pass=1;
  if((e.cloud||e.border)&&k.backup==='cloud')bak=1;
  if(e.places){
    if(k.device!=='none'&&at(k.dloc))dev=e.duress||e.border||k.pin==='none'?1:(k.pin==='simple'?.3:.03);
    if((k.backup==='paper'||k.backup==='metal')&&at(k.bloc))bak=1;
    if(e.duress&&(k.backup==='memory'||k.backup==='cloud'))bak=1;
  }
  if(k.pass==='memory')pass=e.duress?1:e.border?0:crack(k);
  else if(k.pass==='written')pass=at(k.ploc)?1:e.border?0:crack(k);
  return(1-(1-dev)*(1-bak))*pass;
}
function withProv(s,e){
  if(!(e.prov||e.gov)||custodial(s))return e;
  const ps=allKeys(s).filter(k=>e.gov?isProv(k):k.device===e.prov);
  return ps.length?Object.assign({},e,{pbrands:ps.map(k=>k.brand)}):e;
}
function lapseReach(k){
  if(isProv(k))return .02;
  let p=0;
  if(real(k))p=Math.max(p,REACH[k.dloc]*(k.pin==='none'?1:k.pin==='simple'?.5:.1));
  if(k.backup==='paper'||k.backup==='metal')p=Math.max(p,REACH[k.bloc]);
  if(k.backup==='cloud')p=Math.max(p,.03);
  if(k.pass!=='none')p*=crack(k);
  return p;
}
function rkStolen(s,e){return e.prov&&!allKeys(s).some(k=>k.device===e.prov)?0:keyStolen(s.rkey,e)}
function theftP(s,e){
  if(custodial(s))return custP(s,e);
  if(e.cust)return 0;
  if(e.lapse)return TL(s)?lapseReach(s.rkey):0;
  if(e.phish){const c=s.keys.filter(phishable);return s.m>1||!c.length?0:Math.max(...c.map(k=>PHISH*(k.pass==='none'?1:.5)))}
  e=withProv(s,e);
  let q=e.prov?(s.keys.some(k=>k.device===e.prov)?atLeast(s.keys.map(k=>k.device===e.prov?1:isProv(k)?0:keyStolen(k,e)),s.m):0):atLeast(s.keys.map(k=>keyStolen(k,e)),s.m);
  if(TL(s))q=1-(1-q)*(1-LAPSE*rkStolen(s,e));
  return q;
}

const DEV_LIFE={hw:.8,phone:.5,laptop:.6,none:0};
const BAK_LIFE={metal:.97,paper:.88,cloud:.9,memory:.35,none:0};
function backupLeft(k,e,tested){
  const gone=p=>e.places.includes(p);
  let b=BAK_LIFE[k.backup];
  if(['metal','paper','cloud'].includes(k.backup)&&!tested)b*=.93;
  if(k.backup==='paper'&&gone(k.bloc))b=0;
  if(k.backup==='metal'&&gone(k.bloc))b*=e.fire?.85:0;
  if(k.backup==='cloud'&&e.cloud)b=0;
  return b;
}
function keyAvail(k,e,tested){
  if(e.pure&&e.dead&&e.dead!==k)return 1;
  if(isProv(k))return e.prov===k.device||e.gov?0:.9;
  const gone=p=>e.places.includes(p);
  let dev=DEV_LIFE[k.device]*(k.pin==='strong'?.85:k.pin==='none'?1:.93);
  if(k.device!=='none'&&gone(k.dloc))dev=0;
  if(e.dead===k)dev=0;
  if(e.now&&dev>0)dev=1;
  if(e.pbrands&&k.device==='hw'&&e.pbrands.includes(k.brand))dev*=.6;
  const bak=e.bugloss&&!tested&&k.device==='hw'&&k.brand===e.brand?0:backupLeft(k,e,tested);
  let pass=1;
  if(k.pass==='memory')pass=k.pstr==='strong'?.65:.8;
  if(k.pass==='written')pass=gone(k.ploc)?0:.9;
  if(e.now&&k.pass==='memory')return dev+(1-dev)*bak*pass;
  return(1-(1-dev)*(1-bak))*pass;
}
function configAvail(s,e){
  if(s.n===1&&!TL(s))return 1;
  const gone=p=>e.places.includes(p);
  let miss=1-(gone('home')?0:.7);
  if(s.config==='one')miss*=1-(gone(s.cloc)?0:.9);
  if(s.config==='all')allKeys(s).forEach(k=>{if(['metal','paper','cloud'].includes(k.backup))miss*=1-backupLeft(k,e,true)});
  if(!e.gov&&allKeys(s).some(k=>isProv(k)&&k.device!==e.prov))miss*=.05;
  return 1-miss;
}
function lossP(s,e){
  if(custodial(s))return custP(s,e);
  const ev=(e.cust&&!e.gov)||e===TIME?TIME:Object.assign({places:[]},withProv(s,e));
  if(e.dev&&!e.dead){const cs=s.keys.filter(real);return cs.length?Math.max(...cs.map(k=>lossP(s,Object.assign({},e,{dead:k})))):lossP(s,TIME)}
  const fix=ev===TIME&&s.keys.some(isProv);
  const d=dist(s.keys.map(k=>{const a=keyAvail(k,ev,s.tested);return fix?1-(1-a)*.5:a}));
  const c=configAvail(s,ev);
  if(TL(s)){let q=0;for(let i=s.m;i<=s.n;i++)q+=d[i];return Math.max(0,1-c*(1-(1-q)*(1-keyAvail(s.rkey,ev,s.tested))))}
  let ok=d[s.n];
  for(let i=s.m;i<s.n;i++)ok+=d[i]*c;
  return Math.max(0,1-ok);
}
function brandEvents(setups){
  const used=new Set();
  setups.forEach(s=>s&&!custodial(s)&&allKeys(s).forEach(k=>{if(k.device==='hw')used.add(k.brand)}));
  return[...used].sort().flatMap(b=>[{id:'t_brand'+b,label:bname(b)+' bug: it makes weak seeds',w:.01,brand:b},{id:'t_supply'+b,label:b==='D'?'Supply chain attack on the parts of your DIY signer':'Supply chain attack on your '+BRANDS[b]+' hardware wallet',w:.015,brand:b,supply:true}]);
}
function brandLossEvents(setups){
  const used=new Set();
  setups.forEach(s=>s&&!custodial(s)&&allKeys(s).forEach(k=>{if(k.device==='hw')used.add(k.brand)}));
  return[...used].sort().map(b=>({id:'l_bug'+b,label:bname(b)+' bug: seed backups don’t restore the coins',w:.015,brand:b,bugloss:true}));
}
const CTRL=['Not yours: shares only','A company holds them','Shared: the provider must co-sign','Yours, with a provider as backup','Fully yours'];
function control(s){
  if(s.type==='etf')return 0;
  if(custodial(s))return 1;
  const prov=s.keys.filter(isProv).length;
  return !prov?4:s.n-prov>=s.m?3:2;
}
function toScore(p){return Math.max(3,Math.min(99,Math.round(100*Math.sqrt(Math.max(0,Math.min(1,p))))))}
function level(sc){return sc<15?'low':sc<35?'mid':'high'}
function risk(s,brands){
  let theft=0,tTop=null,tMax=0;
  [...THEFT,...brands].forEach(e=>{const c=e.w*theftP(s,e);theft+=c;if(c>tMax){tMax=c;tTop=elabel(e,[s])}});
  const base=lossP(s,TIME);let loss=base,lMax=base*.4,lTop='Time: things break or get forgotten';
  [...LOSS,...brandLossEvents([s])].forEach(e=>{const c=e.w*(lossP(s,e)-base);loss+=c;if(c>lMax){lMax=c;lTop=elabel(e,[s])}});
  return{theft:toScore(theft),loss:toScore(loss),tTop:tMax>.0005?tTop:null,lTop:loss>.0005?lTop:null,setup:setupEffort(s),spend:spendEffort(s),control:control(s)};
}
function setupEffort(s){
  if(custodial(s))return 1;
  const places=new Set();let own=0,x=0;
  allKeys(s).forEach(k=>{
    if(isProv(k))return;own++;
    if(real(k))places.add(k.dloc);
    if(k.backup==='paper'||k.backup==='metal')places.add(k.bloc);
    if(k.backup==='metal'||k.backup==='memory')x+=.25;
    if(k.pass!=='none')x+=.5;
    if(k.ent==='dice'||k.ent==='diceonly')x+=.5;
    if(k.device==='hw'&&k.brand==='D')x+=.5;
    if(soft(k)&&k.net==='offline')x+=.25;
  });
  const raw=Math.max(0,own-1)*.75+Math.max(0,places.size-1)*.4+x+(TL(s)?.5:0)+((s.m<s.n||TL(s))&&s.config!=='none'?.25:0);
  return Math.max(1,Math.min(5,1+Math.round(raw)));
}
const TRIP={carry:0,home:0,office:1,relative:2,friend:2,bank:2.5};
function signCost(k){
  if(isProv(k))return .5;
  if(k.device==='none')return 4+(k.backup==='paper'||k.backup==='metal'?TRIP[k.bloc]:0);
  const base=k.device==='phone'?(k.net==='offline'?1.5:.5):k.device==='laptop'?(k.net==='offline'?1.5:1):{usb:1,qr:1.25,sd:1.75}[k.conn||'usb'];
  return base+TRIP[k.dloc]+(k.pass!=='none'?.5:0);
}
function spendEffort(s){
  if(custodial(s))return s.type==='etf'?5:1;
  const c=s.keys.map(signCost).sort((a,b)=>a-b).slice(0,s.m).reduce((a,b)=>a+b,0)+(s.m-1)*.5;
  return Math.max(1,Math.min(5,Math.round(c)));
}
const ICON={t_home:'🔓',t_office:'🔓',t_rel:'👀',t_friend:'👀',t_bank:'🏦',t_carry:'🎒',t_hot:'🦠',t_cloud:'☁️',t_duress:'🔧',t_border:'🛂',t_phish:'🎣',t_lapse:'⏲️',t_guess:'🎯',t_app:'🎲',t_prov:'🕵️',t_provapp:'📲',t_prov2:'🕵️',l_prov2:'🚪',c_acct:'🪪',c_hack:'💥',l_dev:'🔌',l_home:'🔥',l_office:'🔥',l_rel:'📦',l_friend:'📦',l_bank:'🏦',l_carry:'🎒',l_cloud:'☁️',l_prov:'🚪',c_bust:'📉',c_freeze:'⛔',c_frozen:'🧊',c_rules:'⚖️',l_gov:'⚖️',l_time:'⏳'};
function touches(s,e){
  if(custodial(s))return !!e.cust;
  const K=allKeys(s);
  if(e.cust)return false;
  if(e.gov)return K.some(isProv);
  if(e===TIME)return true;
  if(e.lapse)return TL(s);
  if(e.phish)return s.keys.some(phishable);
  if(e.dev)return s.keys.some(real);
  if(e.brand)return K.some(k=>k.device==='hw'&&k.brand===e.brand);
  if(e.push){const pk=s.keys.find(k=>k.device==='prov');return !!pk&&K.some(k=>hot(k)||(k.device==='hw'&&k.brand===pk.brand))}
  if(e.prov)return K.some(k=>k.device===e.prov);
  if(e.guess)return K.some(k=>!isProv(k)&&k.ent==='words');
  if(e.hot)return K.some(k=>hot(k)||k.device==='hw');
  if(e.app)return K.some(soft);
  if(e.cloud)return K.some(k=>k.backup==='cloud');
  const used=new Set();
  K.forEach(k=>{if(real(k))used.add(k.dloc);if(k.backup==='paper'||k.backup==='metal')used.add(k.bloc);if(k.pass==='written')used.add(k.ploc)});
  if(s.m<s.n||TL(s)){used.add('home');if(s.config==='one')used.add(s.cloc)}
  return e.places.some(p=>used.has(p))||(!!e.border&&K.some(k=>k.backup==='cloud'));
}
function disasterList(setups){
  return[...THEFT.map(e=>['t',e]),...brandEvents(setups).map(e=>['t',e]),...LOSS.map(e=>['l',e]),...brandLossEvents(setups).map(e=>['l',e]),['l',TIME]].filter(x=>!x[1].twin&&((x[1].cust&&!x[1].acct)||setups.some(s=>touches(s,x[1]))));
}
const untouched=e=>e.prov?'You don’t use that provider, so this can’t touch you.':e.brand?'You have no hardware wallet of that brand.':e.hot||e.app?'You have no key on an online phone or laptop.':e.cloud?'You keep nothing in the cloud.':e.guess?'Your seeds weren’t picked by hand.':e.border?'You aren’t carrying any keys or backups.':e.lapse?'You have no timelock to update.':e.phish?'You have no seed written down or memorized to give away.':e.gov?'You don’t rely on a provider.':e.dev?'You hold no device of your own.':'Nothing of yours is there.';
function outcome(s,kind,e,r){
  const ks=n=>n===1?'key':'keys';let hit=[],bad=false,text,rhit=null,gone=false,why=null,tip='',dead=-1; // dead: which key's device died, for "a device dies"
  const roll=(k,i)=>k.device==='prov'?r.p:k.device==='prov2'?r.p2:r.k[i];
  const E=withProv(s,e);
  if(custodial(s)){
    bad=!!e.cust&&r.c<custP(s,e);
    const far=s.type!=='exchange'&&(e.id==='c_hack'||e.id==='c_bust');
    text=!e.cust?'There are no keys of yours to take or lose.':bad?(far?'Your coins went down with it.':e.badT?e.badT:kind==='t'?'The coins were moved out and are not coming back.':'You can’t get your coins out.'):far?'Your coins were held separately, and you got them back.':e.okT?e.okT:kind==='t'?'The company caught it or made you whole.':'You got your coins out in time.';
  }else if(e.cust&&!touches(s,e)){
    hit=s.keys.map(()=>false);text='You hold your own keys, so this can’t touch you.';if(TL(s))rhit=false;
  }else if(e.phish){
    const c=s.keys.filter(phishable);hit=s.keys.map(()=>false);if(TL(s))rhit=false;
    if(!c.length)text=untouched(e);
    else{const tk=c[Math.floor(r.d*c.length)],i=s.keys.indexOf(tk),fooled=r.c<PHISH,pok=tk.pass==='none'||r.l<.5,nm=s.n>1?`Key ${LETTERS[i]}’s seed`:'your seed';
      hit[i]=fooled&&pok;bad=hit[i]&&s.m===1;
      text=!fooled?'You spotted the fake and closed the page.':!pok?`You typed ${nm} into a fake site, but the thief doesn’t have the passphrase.`:bad?`You typed ${nm} into a fake site, and the thief emptied the wallet.`:`You typed ${nm} into a fake site. The thief has 1 key but needs ${s.m}.`}
  }else if(kind==='t'){
    hit=s.keys.map((k,i)=>(e.prov&&!s.keys.some(x=>x.device===e.prov))?false:roll(k,i)<keyStolen(k,E));const c=hit.filter(Boolean).length;bad=c>=s.m;
    text=bad?(s.n===1?'The thief got your only key.':`The thief got ${c} ${ks(c)}, enough to spend.`):c?`The thief got ${c} ${ks(c)} but needs ${s.m}.`:'Nothing useful was taken.';
    if(!c&&e.places){
      const at=p=>e.places.includes(p),own=s.keys.filter(k=>!isProv(k)),one=own.length===1;
      const dT=own.filter(k=>real(k)&&at(k.dloc)).length,bT=own.filter(k=>(k.backup==='paper'||k.backup==='metal')&&at(k.bloc)).length;
      const what=(n,w)=>one?'your '+w:n===1?'a '+w:w+'s';
      if(dT&&bT)text=`The thief took ${what(dT,'device')} and ${what(bT,'backup')} but couldn’t get a key out of them.`;
      else if(dT)text=`The thief took ${what(dT,'device')} but couldn’t break into ${dT===1?'it':'them'}.`;
      else if(bT)text=`The thief took ${what(bT,'backup')} but doesn’t have the passphrase.`;
    }
    // One key, taken from a place: say how the thief got it.
    if(bad&&s.n===1&&e.places&&!e.duress&&!e.border&&s.keys[0].pass==='none'){
      const k=s.keys[0],at=p=>e.places.includes(p);
      if((k.backup==='paper'||k.backup==='metal')&&at(k.bloc))text=`The thief found your ${k.backup} backup, and with it your wallet key.`;
      else if(real(k)&&at(k.dloc))text=k.pin==='none'?'Your device had no PIN, so the thief got your wallet key.':'The thief managed to guess your PIN, and then got your wallet key.';
    }
    if(TL(s)){
      if(e.lapse){rhit=r.c<lapseReach(s.rkey);bad=rhit;text=rhit?'The timer ran out, and someone who could reach the recovery key used it.':'The timer ran out, but nobody used the recovery key before you reset it.'}
      else{rhit=r.kr<rkStolen(s,E);if(!bad&&rhit){bad=r.l<LAPSE;text=bad?'The thief got the recovery key, and the timelock had run out.':'The thief got the recovery key, but the timelock stops it spending on its own.'}}
    }
    if(e.takes&&!bad&&allKeys(s).some(k=>real(k)&&e.places.includes(k.dloc))){
      const L=outcome(s,'l',{id:'l_stolen',places:e.places},Object.assign({},r,{k:r.b,kr:r.bk,c:r.bc}));
      if(L.bad){bad=gone=true;text+=L.why?` But ${L.why}, so the coins are lost.${L.tip}`:' But you had no working way to recover, so the coins are lost.'}
      else text+=s.n===1&&!TL(s)?` ${backupName(s.keys[0],true)} brings the key back.`:' You can still recover your coins.';
    }
    if(!bad&&!rhit&&!touches(s,e))text=untouched(e);
  }else{
    const ev=Object.assign({places:[]},E);
    if(e.id!=='l_time')ev.now=true;
    if(e.dev){const cs=s.keys.filter(real);if(cs.length){ev.dead=cs[Math.floor(r.d*cs.length)];dead=s.keys.indexOf(ev.dead)}}
    hit=s.keys.map((k,i)=>roll(k,i)>=keyAvail(k,ev,s.tested));const lost=hit.filter(Boolean).length,left=s.n-lost;
    const cfg=r.c<configAvail(s,ev);
    if(TL(s)){
      rhit=r.kr>=keyAvail(s.rkey,ev,s.tested);const quorum=left>=s.m;bad=!cfg||(!quorum&&rhit);
      text=!cfg?'The wallet file is gone, and a timelock wallet can’t be spent without it.':quorum?(lost||rhit?'You lost a key but can still spend.':'Everything survived.'):rhit?'Your normal keys and the recovery key are all gone.':'Your normal keys are gone, but the recovery key gets the coins back after the wait.';
    }else{
      bad=left<s.m||(left<s.n&&!cfg);
      text=left<s.m?(s.n===1?'Your only key is gone.':lost===s.n?'Every key is gone.':`${lost} of ${s.n} keys are gone, and you need ${s.m}.`):bad?'Enough keys survived, but the wallet file is gone.':lost?`You lost ${lost} ${ks(lost)} but can still recover.`:'Everything survived.';
    }
    if(!bad&&!lost&&!rhit){
      const gone=p=>ev.places.includes(p),own=allKeys(s).filter(k=>!isProv(k));
      const dG=own.filter(k=>real(k)&&gone(k.dloc)).length;
      const bG=own.filter(k=>(k.backup==='paper'&&gone(k.bloc))||(k.backup==='metal'&&gone(k.bloc)&&!ev.fire)||(k.backup==='cloud'&&ev.cloud)).length;
      const one=own.length===1,cnt=(n,w)=>n===1?(one?'your ':'a ')+w:`${n} ${w}s`;
      if(dG&&bG)text=`You lost ${cnt(dG,'device')} and ${cnt(bG,'backup')}, but every key can still be recovered. Replace what was lost soon.`;
      else if(bG)text=`You lost ${cnt(bG,'backup')}, but ${one?'the key is still on your device':'the keys are still on your devices'}. Make a new backup soon.`;
      else if(dG)text=`You lost ${cnt(dG,'device')}, but ${dG===1?backupName(own.find(k=>real(k)&&gone(k.dloc)))+' brings the key back':'the backups bring the keys back'}.`;
    }
    if(e.dev&&ev.dead&&!TL(s)){const i=s.keys.indexOf(ev.dead),nm=s.n>1?`Key ${LETTERS[i]}’s device`:'Your device';
      text=bad?(s.n===1?'Your device died, and there was no working backup.':left<s.m?`${nm} died with no working backup, and that left too few keys.`:`${nm} died with no working backup, and without the wallet file you can’t use the keys that are left.`):hit[i]?`${nm} died with no working backup, but you can still spend with the other keys.`:`${nm} died, but its backup brought the key back.`}
    // One key, device gone, backup not touched by the disaster: say why the backup didn't save you.
    if(bad&&s.n===1&&!TL(s)&&e.id!=='l_time'&&!e.bugloss){
      const k=s.keys[0],g=p=>ev.places.includes(p);
      const devGone=real(k)&&(g(k.dloc)||ev.dead===k);
      const bakGone=((k.backup==='paper'||k.backup==='metal')&&g(k.bloc))||(k.backup==='cloud'&&ev.cloud);
      if(devGone&&!bakGone){
        why=k.backup==='none'?'you had no backup':k.backup==='memory'?'you couldn’t recall the seed from memory':k.pass!=='none'?`your ${k.backup} backup or its passphrase failed you`:`your ${k.backup} backup turned out to be unreadable`;
        if(['paper','metal','cloud'].includes(k.backup)&&!s.tested)tip=' A practice recovery might have caught that.';
        text=`Your device ${ev.dead?'died':'is gone'}, and ${why}.${tip}`;
      }
    }
    if(!bad&&!touches(s,e))text=untouched(e);
    else if(e.bugloss&&!bad)text=s.tested?'Your practice recovery already proved the backups restore.':'The devices still work, so you can move the coins before one fails.';
  }
  if(e.border)text=text.replace('The thief','They').replace('but needs','but need').replace('Nothing useful was taken.','They found nothing they could use.');
  return{kind,hit,rhit,bad,dead,text,why,tip,verdict:bad?(gone?'Coins lost':e.border?'Coins exposed':custodial(s)&&e.verdict?e.verdict:kind==='t'?'Coins stolen':'Coins lost'):'Coins safe'};
}
// Names a key's backup exactly, so a result can say which thing saved you: "your paper recovery phrase backup at home".
function backupName(k,capital){
  const at=p=>p==='bank'?' in the bank box':p==='carry'?' in your pocket':' at '+PLAIN[p];
  const n={paper:'your paper recovery phrase backup'+at(k.bloc),metal:'your steel recovery phrase backup'+at(k.bloc),memory:'the recovery phrase you memorized',cloud:'your recovery phrase backup in the cloud'}[k.backup]||'your backup';
  return capital?n[0].toUpperCase()+n.slice(1):n;
}
function runDisaster(setups,id,lastId){
  const list=disasterList(setups);let pick=list.find(x=>x[1].id===id);
  if(!pick)do{pick=list[Math.floor(Math.random()*list.length)]}while(list.length>1&&pick[1].id===lastId);
  const kind=pick[0],e=pick[1],r={k:[0,0,0,0,0].map(()=>Math.random()),c:Math.random(),p:Math.random(),p2:Math.random(),kr:Math.random(),l:Math.random(),d:Math.random(),b:[0,0,0,0,0].map(()=>Math.random()),bk:Math.random(),bc:Math.random()};
  return{id:e.id,ev:e,icon:e.supply?'🚚':e.brand?'🐞':ICON[e.id],label:elabel(e,setups),kind,res:setups.map(s=>outcome(s,kind,e,r))};
}
function scoreOf(s){return risk(s,brandEvents([s]))}
function drivers(s){
  const pct=x=>x>=.995?'certain':x<.005?'under 1%':Math.round(x*100)+'%';
  const t=[...THEFT,...brandEvents([s])].map(e=>({label:elabel(e,[s]),w:e.w,p:theftP(s,e),c:e.w*theftP(s,e)}));
  const base=lossP(s,TIME);
  const l=[...LOSS,...brandLossEvents([s])].map(e=>({label:elabel(e,[s]),w:e.w,p:lossP(s,e),c:e.w*(lossP(s,e)-base)}));
  if(!custodial(s))l.push({label:TIME.label,w:1,p:base,c:base});
  const top=a=>a.filter(x=>x.c>.0005).sort((a,b)=>b.c-a.c).slice(0,3).map(x=>({label:x.label,w:pct(x.w),p:pct(x.p)}));
  return{theft:top(t),loss:top(l)};
}
function breakdown(s){
  const cur=scoreOf(s),rows=[];
  const why=(d,w)=>d===0?'No measurable effect on this score in your setup.':(w&&w[d>0?0:1])||(d>0?'In your setup this choice raises this risk.':'In your setup this choice lowers this risk.');
  const add=(label,vs,mod,T,L)=>{const t=clone(s);mod(t);const a=scoreOf(t),dT=cur.theft-a.theft,dL=cur.loss-a.loss;if(dT||dL)rows.push({label,vs,dT,dL,whyT:why(dT,T),whyL:why(dL,L)})};
  if(custodial(s)){
    const lg=s.login||'sms';
    if(lg==='password')add('Login: password only','a text or email code as well',t=>{t.login='sms'},['A leaked or guessed password is all an attacker needs to get in.',null],null);
    else if(lg==='sms')add('Login: password plus a text or email code','a password only',t=>{t.login='password'},[null,'A stolen password alone no longer gets in, though a SIM swap or a hacked email account can still get the code.'],null);
    else add('Login: authenticator, passkey or security key','a password only',t=>{t.login='password'},[null,'A stolen password, a SIM swap or a hacked email account isn’t enough without your authenticator, passkey or key.'],null);
    if(s.wd==='on')add('Withdrawals: address allowlist or waiting period','no extra protection',t=>{t.wd='none'},[null,'A thief who gets into the account can only send to addresses you already approved, or has to wait while you are warned.'],null);
    else add('Withdrawals: no extra protection','an address allowlist or waiting period',t=>{t.wd='on'},['A thief who gets into the account can send the coins anywhere, straight away.',null],null);
    return rows;
  }
  if(s.n>1){
    add(`${s.m}-of-${s.n} keys`,'a single key (Key A on its own)',t=>{t.keys=[isProv(t.keys[0])?newKey():t.keys[0]];t.n=1;t.m=1},
      ['More keys and backups kept in the same places give a thief more to find.',`A thief now needs ${s.m} keys, so one break-in or hack isn’t enough.`],
      [`You now need ${s.m} keys to survive, so there is more that can go missing.`,s.m<s.n?`You can lose ${s.n-s.m} ${s.n-s.m===1?'key':'keys'} and still spend.`:null]);
    if(s.m<s.n){
      if(s.config==='none')add('Wallet file not backed up','a copy with every seed backup',t=>{t.config='all'},null,['If a key goes missing you also need the wallet file, and your only copy is in the wallet app.',null]);
      else add('Wallet file backed up','no backup of it',t=>{t.config='none'},null,[null,'If a key goes missing, a spare copy of the wallet file lets you rebuild the wallet.']);
    }
  }
  if(TL(s)){
    add('Recovery timelock','no timelock',t=>{t.tl='off'},
      ['If the timer ever runs out, the recovery key can spend on its own, so it’s one more thing a thief can use.',null],
      ['A timelock wallet can’t be spent without its wallet file, which is one more thing to lose.','If your normal keys are lost, the recovery key can still get the coins back after the wait.']);
    if(!(s.n>1&&s.m<s.n)){
      if(s.config==='none')add('Wallet file not backed up','a copy with every seed backup',t=>{t.config='all'},null,['A timelock wallet can’t be spent without its wallet file, and your only copy is in the wallet app.',null]);
      else add('Wallet file backed up','no backup of it',t=>{t.config='none'},null,[null,'A timelock wallet can’t be spent without its wallet file, and you have a spare copy.']);
    }
  }
  s.keys.forEach((k,i)=>{
    const K=s.n>1?`Key ${LETTERS[i]}: `:'',cap=x=>K?K+x:x[0].toUpperCase()+x.slice(1),dn=k.device==='phone'?'phone':'laptop',Dn=dn[0].toUpperCase()+dn.slice(1)+'s';
    if(isProv(k)){add(cap(DEVICES[k.device].toLowerCase()),'holding it yourself on a hardware signer at home',t=>{t.keys[i]=newKey()},
      ['A hacked provider can use this key, and so can someone who forces you to ask it to co-sign.','This key isn’t in your home for a burglar to find.'],
      ['If the provider shuts down or its coins are seized, this key goes with it.','The provider looks after this key, keeps a copy of your wallet file and helps you replace lost keys.']);
      const hwB=allKeys(s).filter(x=>x.device==='hw').map(x=>x.brand),other=['A','B','C'].find(b=>!hwB.includes(b));
      if(hwB.includes(k.brand)&&other)add(cap('provider is the same brand as a hardware signer'),'a provider from a different company',t=>{t.keys[i].brand=other},
        ['A hacked provider can push a bad update to its own hardware signer as well as to its app.',null],['If the provider shuts down, its own hardware signer may stop working too.',null]);
      return}
    if(k.device==='hw')add(cap('hardware signer'),'an online phone wallet carried on you',t=>{Object.assign(t.keys[i],{device:'phone',dloc:'carry',net:'online'})},
      ['A hardware signer depends on its maker and its delivery: a bad batch, or a device tampered with on the way to you, could expose the key.','The key never touches an internet-connected device, so malware can’t reach it, and it isn’t carried around to be stolen.'],
      [null,'It isn’t carried around, so it’s less likely to be lost or broken than a phone.']);
    if(k.device==='hw'){const c=k.conn||'usb';
      if(c==='usb')add(cap('signer connects by USB cable'),'an airgapped signer using QR codes',t=>{t.keys[i].conn='qr'},['Malware on your computer has a small chance of reaching a signer over the cable.',null],null);
      else add(cap(c==='qr'?'airgapped signer using QR codes':'airgapped signer using a memory card'),'a signer on a USB cable',t=>{t.keys[i].conn='usb'},[null,'With no cable, malware on your computer has almost no path to the signer.'],null);}
    if(k.device==='hw'&&k.brand==='D')add(cap('DIY signer, built yourself'),'a branded hardware signer',t=>{t.keys[i].brand=['A','B','C'].find(b=>!s.keys.some(x=>x.device==='hw'&&x.brand===b))||'A'},
      [null,'It’s built from ordinary parts, so there is no maker’s shipment for an attacker to tamper with.'],null);
    if(k.device==='none')add(cap('no device, backup only'),'a hardware signer at home',t=>{Object.assign(t.keys[i],{device:'hw',dloc:'home'})},
      [null,'There is no device for a thief to find or crack.'],['With no device, the backup is the only copy of this key.',null]);
    else{
      if(k.net==='offline'){
        add(cap(`${dn} is always offline`),`an online ${dn}`,t=>{t.keys[i].net='online'},[null,`Malware can’t reach a ${dn} that never connects to the internet.`],null);
        add(cap(`${dn} rather than a hardware signer`),'a hardware signer in the same place',t=>{t.keys[i].device='hw'},
          ['A wallet app’s seed generation and storage are less proven than a dedicated signer’s.','There is no hardware maker to trust, so a bad batch of signers can’t affect it.'],
          [`${Dn} break, get reset or get replaced more often than a dedicated signer.`,null]);
      }else add(cap(`${dn} is online`),'keeping it always offline',t=>{t.keys[i].net='offline'},[`Malware, or a malicious update from a hacked provider, can reach a ${dn} that’s connected to the internet.`,null],null);
      if(k.dloc==='carry')add(cap(`${dn} carried on you`),'keeping it at home',t=>{t.keys[i].dloc='home'},
        [`A ${dn} you carry can be stolen with your bag, and you can be made to unlock it at a border.`,'It isn’t at home with your other keys or backups, so one burglary finds less.'],
        [`A ${dn} you carry is more likely to be lost for good.`,'It isn’t at home, so a fire or flood there doesn’t destroy it.']);
      else add(cap(`${dn} kept at ${PLAIN[k.dloc]}`),'carrying it on you',t=>{t.keys[i].dloc='carry'},
        ['It sits in the same place as other keys or backups, so one break-in finds more.','It can’t be stolen while you’re out.'],
        ['A fire or flood there would destroy it along with whatever else is kept there.',`It’s less likely to be lost than a ${dn} you carry.`]);
    }
    if(real(k)){
      if(!soft(k)&&k.dloc!=='home')add(cap('device kept at '+PLAIN[k.dloc]),'keeping it at home',t=>{t.keys[i].dloc='home'},
        ['Someone else can get into this place more easily than your home, or other keys and backups are kept there too.','It’s away from the keys and backups kept at home, so one burglary finds less.'],
        ['Things kept away from home are more likely to go missing.','A fire or flood at home doesn’t destroy it.']);
      if(k.pin==='strong')add(cap('strong PIN'),'no PIN',t=>{t.keys[i].pin='none'},[null,'A thief who gets the device is very unlikely to guess the PIN.'],['A long PIN is easier to forget, and devices slow down or wipe after wrong guesses, so you’d be left relying on the backup.',null]);
      else if(k.pin==='simple')add(cap('simple PIN'),'no PIN',t=>{t.keys[i].pin='none'},[null,'A thief who gets the device still has to guess the PIN. A simple one may fall, but it stops a casual thief.'],['Even a simple PIN can be forgotten, and devices slow down or wipe after wrong guesses, so you’d be left relying on the backup.',null]);
      else add(cap('no PIN'),'a simple PIN',t=>{t.keys[i].pin='simple'},['Anyone who picks up the device can use the key straight away.',null],[null,'There is no PIN to forget.']);
    }
    if(k.backup==='none')add(cap('no seed backup'),'a paper backup at home',t=>{Object.assign(t.keys[i],{backup:'paper',bloc:'home'})},
      [null,'There is no written seed for a burglar to find.'],['If the device breaks or is lost, nothing else holds this key.',null]);
    else add(cap(k.backup==='memory'?'seed memorized, not written down':k.backup==='cloud'?'seed in the cloud or a password manager':`${BACKUPS[k.backup].toLowerCase()} backup at ${PLAIN[k.bloc]}`),'no backup at all',t=>{t.keys[i].backup='none'},
      [k.backup==='memory'?'Someone forcing you can make you recite it.':k.backup==='cloud'?'Anyone who gets into that account has the key, without needing the device or PIN.':'Anyone who finds the backup has the key, without needing the device or PIN.',null],
      [null,k.backup==='memory'?'If the device breaks or is lost, you can restore the key, as long as you still remember the words.':'If the device breaks or is lost, the backup brings the key back.']);
    if(k.pass==='none')add(cap('no passphrase'),'a simple memorized passphrase',t=>{Object.assign(t.keys[i],{pass:'memory',pstr:'simple'})},
      ['Without a passphrase, the seed backup or an unlocked device is enough on its own.',null],[null,'There is no passphrase to forget.']);
    else add(cap(k.pass==='memory'?`${k.pstr} memorized passphrase`:`${k.pstr} passphrase, written down at ${PLAIN[k.ploc]}`),'no passphrase',t=>{t.keys[i].pass='none'},
      [null,k.pass==='written'?'A thief needs both the seed and the note, which helps when they’re in different places.':k.pstr==='strong'?'A thief who finds the seed backup still needs the passphrase, and a strong one is very unlikely to be guessed.':'A thief who finds the seed backup still needs the passphrase, though a simple one can be guessed with enough tries.'],
      [k.pass==='written'?'The note is one more thing that can be lost or destroyed.':k.pstr==='strong'?'A long passphrase is easier to forget, and without it the key is gone, even with the seed.':'Forget the passphrase and the key is gone, even with the seed.',null]);
    if(k.ent==='device')add(cap('seed made by the device or app'),'adding your own dice rolls',t=>{t.keys[i].ent='dice'},
      ['You’re trusting the device’s random numbers. If its maker got that wrong, the seed could be weak.',null],null);
    else add(cap({dice:'seed from device plus dice rolls',diceonly:'seed from dice rolls only',words:'seed from words you picked'}[k.ent]),'letting the device make it',t=>{t.keys[i].ent='device'},
      [k.ent==='words'?'People are bad at picking random words, so these seeds get guessed. Attackers try likely phrases against the public blockchain, with no limit on attempts.':'Dice-only seeds go wrong if you roll too few times.','Your own dice rolls protect you if the device’s random numbers turn out to be weak.'],null);
  });
  if(s.tested)add('Recovery practiced','never testing them',t=>{t.tested=false},null,[null,'You’ve proved the backups restore, so a bad copy or a device bug won’t surprise you later.']);
  else add('Backups never tested','a practice recovery',t=>{t.tested=true},null,['An untested backup can turn out to be miscopied, or a device bug can mean it never restores.',null]);
  return rows;
}
const SAY={
  t_home:['A burglary at home alone doesn’t get a thief enough to spend.','A burglary at home might be enough for a thief.','One burglary at home can take everything.'],
  t_office:['Theft at the office alone isn’t enough to spend.','Theft at the office might be enough for a thief.','One theft at the office can take everything.'],
  t_rel:['Someone snooping at your relative’s place can’t spend alone.','Someone snooping at your relative’s place might get enough to spend.','Someone snooping at your relative’s place can take everything.'],
  t_friend:['Someone snooping at your friend’s place can’t spend alone.','Someone snooping at your friend’s place might get enough to spend.','Someone snooping at your friend’s place can take everything.'],
  t_bank:['An opened bank box alone isn’t enough to spend.','An opened bank box might be enough to spend.','Whoever opens your bank box can take everything.'],
  t_carry:['A stolen phone or bag alone doesn’t give a thief the coins.','A stolen phone or bag might be enough for a thief.','A stolen phone or bag can cost you everything.'],
  t_hot:['Malware on a phone or laptop can’t reach enough keys to spend.','Malware on your phone or laptop might reach enough keys.','Malware on your phone or laptop can take everything.'],
  t_cloud:['A hacked cloud account alone isn’t enough to spend.','A hacked cloud account might be enough to spend.','A hacked cloud account can take everything.'],
  t_duress:['Someone forcing you at home can’t get enough keys on the spot.','Someone forcing you at home might get enough keys.','Someone forcing you at home can make you hand over everything.'],
  t_border:['Being forced to unlock your devices at a border doesn’t expose enough keys.','Being forced to unlock your devices at a border might expose enough keys.','If you’re forced to unlock your devices at a border, the coins are exposed.'],
  t_lapse:['If you forget to update the timelock, nobody else can reach the recovery key.','If you forget to update the timelock, someone who can reach the recovery key might use it.','If you forget to update the timelock, whoever holds the recovery key can take the coins.'],
  t_phish:['Being tricked into typing one seed into a fake website isn’t enough to steal from you.','If you’re tricked into typing your seed into a fake website, the coins are gone.','If you’re tricked into typing your seed into a fake website, the coins are gone.'],
  t_guess:[null,'A weak seed might be guessed.','A seed made from words you picked is likely to be guessed.'],
  t_app:['A wallet app that makes weak seeds can’t sink you on its own.','A wallet app that makes weak seeds might expose enough keys.','If your wallet app made a weak seed, everything is exposed.'],
  t_prov:['A hacked provider can’t spend with its own key alone.','A hacked provider’s key might be the last one a thief needs.','A hacked provider can spend with the keys it holds.'],
  t_provapp:['A malicious update from a hacked provider can’t reach enough keys.','A hacked provider pushing a malicious update might reach enough keys.','A hacked provider pushing a malicious update to its app and devices could take everything.'],
  t_prov2:['A hacked second provider can’t spend with its own key alone.','A hacked second provider’s key might be the last one a thief needs.','A hacked second provider can spend with the keys it holds.'],
  t_brand:['A weak-seed bug in one hardware brand isn’t enough to steal from you.','A weak-seed bug in one hardware brand might be enough to steal from you.','If your hardware brand turns out to make weak seeds, everything is exposed.'],
  l_bug:['If one hardware brand’s seed backups turn out not to restore, you can still recover.','If your hardware brand’s seed backups turn out not to restore, you might be locked out.','If your hardware brand’s seed backups turn out not to restore, the coins are gone when the device dies.'],
  t_supply:['A hardware wallet tampered with before it reached you isn’t enough to steal from you.','A hardware wallet tampered with before it reached you might be enough to steal from you.','If your hardware wallet was tampered with before it reached you, everything is exposed.'],
  c_acct:[null,'A takeover of your account might cost you the coins.','If someone takes over your account, the coins are likely gone.'],
  c_hack:['An exchange hack can’t touch coins you hold yourself.','A hack of the company holding the coins might cost you them.','If the company holding your coins is hacked, they can go with it.'],
  l_dev:['If a device dies, its backup or your other keys cover it.','If a device dies, you might be locked out.','If your device dies, the coins are gone.'],
  l_home:['A fire or flood at home doesn’t lock you out.','A fire or flood at home might lock you out.','One fire or flood at home can wipe out the coins.'],
  l_office:['Losing what’s at the office doesn’t lock you out.','Losing what’s at the office might lock you out.','Losing what’s at the office wipes out the coins.'],
  l_rel:['If your relative loses what you left there, you can still recover.','If your relative loses what you left there, you might be locked out.','If your relative loses what you left there, the coins are gone.'],
  l_friend:['If your friend loses what you left there, you can still recover.','If your friend loses what you left there, you might be locked out.','If your friend loses what you left there, the coins are gone.'],
  l_bank:['Losing access to the bank box doesn’t lock you out.','Losing access to the bank box might lock you out.','Losing access to the bank box locks you out.'],
  l_carry:['Losing your phone or bag doesn’t lose the coins.','Losing your phone or bag might lose the coins.','Losing your phone or bag loses the coins.'],
  l_stolen:['If your phone or bag is stolen, you can still recover the coins.','If your phone or bag is stolen, you might not be able to recover the coins.','If your phone or bag is stolen, the coins are gone even if the thief can’t unlock it.'],
  l_cloud:['Being locked out of your cloud account doesn’t cost you the coins.','Being locked out of your cloud account might cost you the coins.','Being locked out of your cloud account costs you the coins.'],
  l_prov:['If the provider shuts down, you can still recover on your own.','If the provider shuts down, you might be stuck.','If the provider shuts down, you are likely stuck.'],
  l_prov2:['If the second provider shuts down, you can still recover.','If the second provider shuts down, you might be stuck.','If the second provider shuts down, you are likely stuck.'],
  c_bust:['An exchange collapse can’t touch coins you hold yourself.','A collapse of the company holding the coins might cost you them.','If the company holding your coins collapses, they likely go with it.'],
  c_freeze:[null,'A withdrawal freeze might leave your coins with the company for good.','A withdrawal freeze leaves your coins with the company.'],
  c_frozen:[null,'A locked or banned account might leave your coins with the company.','A locked or banned account leaves your coins with the company.'],
  c_rules:['A government seizure of company-held coins can’t reach yours.','A government seizure of company-held coins might take yours.','A government seizure of company-held coins would likely take yours.'],
  l_gov:['A government takeover of your provider wouldn’t lock you out.','A government takeover might knock out your provider and leave you stuck.','A government takeover would knock out your provider and leave you stuck.'],
  l_time:['Left alone for ten years, it’s likely to still work.','Left alone for ten years, there’s a real chance something breaks or is forgotten.','Left alone for ten years, it will probably fail: something breaks or is forgotten.']
};
function summarize(s){
  const pros=[],cons=[],own=!custodial(s),say=e=>SAY[e.supply?'t_supply':e.bugloss?'l_bug':e.brand?'t_brand':e.id];
  const world=e=>e.cust&&!e.acct;
  const ev=[...THEFT,...brandEvents([s])].map(e=>({e,w:e.w,p:theftP(s,e)})).concat([...LOSS,...brandLossEvents([s])].map(e=>({e,w:e.w,p:own&&world(e)&&!touches(s,e)?0:lossP(s,e)})),own?[{e:TIME,w:1,p:lossP(s,TIME)}]:[]);
  const safeWorld=own&&ev.filter(x=>world(x.e)).every(x=>x.p<.1);
  const ct=control(s);
  if(!own){pros.push({w:9,t:'There are no keys, seeds or devices for you to lose or forget.'});
    cons.push({w:9,t:ct===0?'You hold shares, not bitcoin. You can never withdraw or spend the coins.':'A company holds the keys. The coins are yours only as long as it lets you withdraw.'})}
  if(ct===4)pros.push({w:9,t:'The coins are fully yours. No company can freeze, seize or lose them.'});
  else if(safeWorld)pros.push({w:8,t:'An exchange collapse, hack or government seizure can’t touch coins you hold yourself.'});
  if(ct===3)pros.push({w:7,t:'You can spend without the provider, so the coins stay yours if it disappears.'});
  if(ct===2)cons.push({w:7,t:'You can’t spend without the provider co-signing.'});
  ev.forEach(x=>{
    const rel=x.e===TIME||touches(s,x.e)||(own&&world(x.e)&&!safeWorld);if(!rel)return;
    if(own&&world(x.e)&&safeWorld)return;
    const lvl=x.p<.1?0:x.p<.5?1:2,t=say(x.e)[lvl];if(!t)return;
    const sw=x.e.sw!=null?x.e.sw:x.w;(lvl?cons:pros).push({w:lvl?sw*x.p:sw,t});
  });
  const su=setupEffort(s),sp=spendEffort(s);
  if(su<=2&&sp<=2&&s.type!=='etf')pros.push({w:.03,t:'It takes little effort to set up and to spend from.'});
  if(su>=4)cons.push({w:.03,t:'It takes real effort to set up: several keys, places or things to remember.'});
  if(sp>=4&&s.type!=='etf')cons.push({w:.03,t:'Spending takes real effort: several signers, or a trip to reach them.'});
  const top=a=>a.sort((a,b)=>b.w-a.w).slice(0,3).map(x=>x.t);
  return{pros:top(pros),cons:top(cons),tips:bestChanges(s)};
}
const AT={home:'at home',office:'at the office',relative:'at a relative’s place',friend:'at a friend’s place',bank:'in the bank box',carry:'on you'};
const _cc=new Map(),_bc=new Map(),_pc=new Map();
function cands(s,build){
  const ck=(build?'b':'a')+JSON.stringify(s);if(_cc.has(ck))return _cc.get(ck);
  const cur=scoreOf(s),low=[],high=[];
  const ev=(act,why,mod,tag)=>{const t=clone(s);mod(t);const a=scoreOf(t);return{do:act,why,mod,tag,to:a,setup:t,gain:(cur.theft-a.theft)+(cur.loss-a.loss),worse:Math.max(a.theft-cur.theft,a.loss-cur.loss),eff:(a.setup+a.spend)-(cur.setup+cur.spend)}};
  const L=(act,why,mod,tag)=>low.push(ev(act,why,mod,tag)),H=(act,why,mod)=>{high.push(ev(act,why,mod));return high[high.length-1]};
  if(custodial(s)){
    if((s.login||'sms')!=='app')L('Protect your login with an authenticator, passkey or security key.','A stolen password or a SIM swap is no longer enough to get in.',t=>{t.login='app'},'login');
    if(s.wd!=='on')L('Turn on an address allowlist or a waiting period for withdrawals.','A thief inside your account can’t send the coins somewhere new straight away.',t=>{t.wd='on'},'wd');
    const c=H({exchange:'Get your own wallet and move the coins to it.',fintech:'Get your own wallet and move the coins to it.',bank:'Get your own wallet and move the coins to it. If the bank won’t let you withdraw, sell and rebuy elsewhere.',etf:'Sell the shares, buy bitcoin, and hold it in your own wallet.'}[s.type],
      'The coins become yours: no company can freeze, seize or lose them. How safe they are then is up to you.',t=>{Object.assign(t,newSetup())});
    c.always=true;c.plain=true;
  }else{
    const PL=['office','bank','relative','friend','home'],one=s.n===1;
    s.keys.forEach((k,i)=>{
      if(isProv(k)){const hwB=allKeys(s).filter(x=>x.device==='hw').map(x=>x.brand),other=['A','B','C'].find(b=>!hwB.includes(b));if(hwB.includes(k.brand)&&other)L('Use a provider from a different company than your hardware signer.','One company’s hack or shutdown can no longer hit both.',t=>{t.keys[i].brand=other},i+':brand');return}
      const K=one?'the key':`Key ${LETTERS[i]}`,Ks=one?'the':`Key ${LETTERS[i]}’s`;
      if(k.device==='none')L(`Put ${K} on a hardware signer kept at home.`,'You can sign without restoring from the backup every time.',t=>{Object.assign(t.keys[i],{device:'hw',dloc:'home'})},i+':device');
      if(soft(k))L(one?`Move your wallet from the ${k.device} to a hardware signer.`:`Move ${K} to a hardware signer.`,'Malware on a phone or computer can no longer reach the key.',t=>{Object.assign(t.keys[i],{device:'hw',dloc:'home'})},i+':device');
      if(hot(k))L(`Keep ${Ks} ${k.device} always offline.`,'Malware can’t reach a device that never connects.',t=>{t.keys[i].net='offline'},i+':net');
      if(soft(k)&&k.dloc==='carry')L(`Keep ${Ks} ${k.device} at home.`,'It can’t be stolen, lost or unlocked by force while you’re out.',t=>{t.keys[i].dloc='home'},i+':dloc');
      if(k.device==='hw')PL.forEach(pl=>{if(k.dloc!==pl)L(`Keep ${Ks} signer ${AT[pl]}.`,'It’s away from your other keys and backups, so one break-in or fire takes less.',t=>{t.keys[i].dloc=pl},i+':dloc')});
      if(k.backup==='none')L(one?'Write your seed down on paper as a backup.':`Write down a paper backup for ${K}.`,'If the device dies, the backup brings the key back.',t=>{Object.assign(t.keys[i],{backup:'paper',bloc:'home'})},i+':backup');
      if(k.backup==='memory'||k.backup==='cloud')L(`Write ${Ks} seed on paper instead.`,k.backup==='memory'?'Paper doesn’t forget.':'A hacked or locked account can no longer take it or lose it.',t=>{Object.assign(t.keys[i],{backup:'paper',bloc:'home'})},i+':backup');
      if(k.backup==='paper'||k.backup==='metal'){
        PL.forEach(pl=>{if(k.bloc!==pl)L(`Keep ${Ks} seed backup ${AT[pl]}.`,'It’s away from your other keys and backups, so one break-in or fire takes less.',t=>{t.keys[i].bloc=pl},i+':bloc')});
        if(k.backup==='paper')L(`Switch ${Ks} seed backup to a metal plate.`,'Metal survives fire and water far better than paper.',t=>{t.keys[i].backup='metal'},i+':backup');
      }
      if(real(k)&&k.pin!=='strong')L(`Set a strong PIN on ${Ks} device.`,'A thief who gets the device is very unlikely to guess it.',t=>{t.keys[i].pin='strong'},i+':pin');
      if(k.pass!=='none'&&k.pstr==='simple')L(`Make ${Ks} passphrase a strong one.`,'A thief who has the seed can’t guess it.',t=>{t.keys[i].pstr='strong'},i+':pstr');
      if(k.ent==='words')L(`Let the device make ${Ks} seed.`,'Seeds people pick themselves get guessed.',t=>{t.keys[i].ent='device'},i+':ent');
      if(k.ent==='device')L(`Add your own dice rolls to ${Ks} seed.`,'It protects you if the device’s random numbers turn out to be weak.',t=>{t.keys[i].ent='dice'},i+':ent');
      if(k.device==='hw'&&k.brand!=='D'&&s.keys.some((x,j)=>j!==i&&x.device==='hw'&&x.brand===k.brand)){
        const other=['A','B','C'].find(b=>!s.keys.some(x=>x.device==='hw'&&x.brand===b));
        if(other)L(`Use a different brand for ${Ks} signer.`,'One brand’s bug or tampered batch can no longer hit two keys.',t=>{t.keys[i].brand=other},i+':brand');
      }
    });
    if((s.m<s.n||TL(s))&&s.config==='none')L('Back up the wallet file with every seed backup.','If a key goes missing, you need that file to use the rest.',t=>{t.config='all'},'config');
    if(!s.tested&&!build)L('Practice a recovery.','It proves your backups work before you need them.',t=>{t.tested=true},'tested');
    if(one&&!isProv(s.keys[0]))H('Go to 2-of-3, with the keys and backups in three different places.','No single break-in, fire, bad device or phishing page is enough.',t=>{
      const B=newKey(),C=newKey();Object.assign(B,{dloc:'office',bloc:'bank',brand:'B'});Object.assign(C,{dloc:'relative',bloc:'relative',brand:'C'});
      t.keys=[t.keys[0],B,C];t.n=3;t.m=2;t.config='all'});
    if(s.n>1){
      const own=s.keys.map((k,i)=>i).filter(i=>!isProv(s.keys[i])),P=['home','office','relative','bank','friend'],off=s.m===s.n?1:0;
      const spread=t=>own.forEach((i,j)=>{const k=t.keys[i];if(real(k)&&k.dloc!=='carry')k.dloc=P[j%5];if(k.backup==='paper'||k.backup==='metal')k.bloc=P[(j+off)%Math.min(5,Math.max(own.length,2))]});
      const brands=t=>{let c=0;own.forEach(i=>{const k=t.keys[i];if(k.device==='hw'&&k.brand!=='D')k.brand=['A','B','C'][c++%3]})};
      const file=t=>{if(t.m<t.n||TL(t))t.config='all'};
      H('Spread the keys out, so each key and its backup sit somewhere different.','No single break-in or fire can take two keys.',spread);
      H('Use a different brand for each hardware signer.','One brand’s bug or tampered batch can only hit one key.',brands);
      H('Spread the keys out, mix brands and back up the wallet file.','No single break-in, fire or bad device is enough.',t=>{spread(t);brands(t);file(t)});
      if(s.m===s.n&&s.n<5)H(`Add a key, so you need ${s.m} of ${s.n+1}.`,'You can then lose a key and still spend.',t=>{t.keys.push(newKey());t.n++});
    }
  }
  const lowOk=x=>x.gain>=1&&x.worse<=Math.max(2,x.gain-1)&&x.to.spend-cur.spend<=1&&x.to.setup-cur.setup<=1;
  let lo=low.filter(lowOk).sort((a,b)=>b.gain-a.gain||a.eff-b.eff)[0];
  if(!lo){
    for(let i=0;i<low.length;i++)for(let j=i+1;j<low.length;j++){
      if(low[i].tag===low[j].tag)continue;
      const t=clone(s);low[i].mod(t);low[j].mod(t);const a=scoreOf(t),gain=(cur.theft-a.theft)+(cur.loss-a.loss),worse=Math.max(a.theft-cur.theft,a.loss-cur.loss);
      if(gain>=2&&worse<=2&&(!lo||gain>lo.gain))lo={do:`${low[i].do.slice(0,-1)}, and ${low[j].do[0].toLowerCase()+low[j].do.slice(1)}`,why:'Neither helps much alone. Together, one break-in or fire takes less.',to:a,setup:t,gain};
    }
  }
  const hi=high.find(x=>x.always)||high.filter(x=>x.gain>=3&&x.worse<=3).sort((a,b)=>b.gain-a.gain||a.eff-b.eff)[0];
  const out={cur,lo:lo||null,hi:hi||null};
  if(_cc.size>400)_cc.clear();_cc.set(ck,out);return out;
}
function potential(s,full){
  const ck=(full?'f':'l')+JSON.stringify(s);if(_pc.has(ck))return _pc.get(ck);
  let cur=s,n=0;
  while(n++<30){const c=cands(cur,false),x=full&&c.hi&&!c.hi.always?c.hi:c.lo;if(!x)break;cur=x.setup}
  const out=scoreOf(cur);if(_pc.size>200)_pc.clear();_pc.set(ck,out);return out;
}
function potText(stay,after,here){
  const lv=v=>v<15?'low':v<35?'medium':'high',rk={low:0,medium:1,high:2},a={t:lv(after.theft),l:lv(after.loss)},b={t:lv(stay.theft),l:lv(stay.loss)};
  let out=`Kept well, ${a.t===a.l?`theft and loss risk can both be ${a.t}`:`theft risk can be ${a.t} and loss risk ${a.l}`}.`;
  const wt=rk[b.t]>rk[a.t],wl=rk[b.l]>rk[a.l];
  return wt&&wl&&b.t===b.l?`${out} ${here}, theft and loss risk both stay ${b.t}.`:wt||wl?`${out} ${here}, ${[wt?`theft risk stays ${b.t}`:'',wl?`loss risk stays ${b.l}`:''].filter(Boolean).join(' and ')}.`:out;
}
function bestChanges(s,build){
  const ck=(build?'b':'a')+JSON.stringify(s);if(_bc.has(ck))return _bc.get(ck);
  const c=cands(s,build),pack=x=>x?{do:x.do,why:x.why,plain:x.plain,from:c.cur,to:x.to,setup:x.setup}:null;
  const out={small:pack(c.lo),big:pack(c.hi)};
  if(out.big){
    const here=custodial(s)?{exchange:'On an exchange',fintech:'In a payment app',bank:'With a bank or broker',etf:'In an ETF'}[s.type]:s.n===1?'With a single key':'With small steps alone';
    out.big.pot=potText(potential(s,false),potential(c.hi.setup,true),here);
  }
  if(_bc.size>60)_bc.clear();_bc.set(ck,out);return out;
}

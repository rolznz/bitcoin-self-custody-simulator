/* ---------- map ---------- */
// Draws a setup as a small island: you, five places, a cloud and a company across the water, with the things
// you own standing outside wherever they are kept. Nothing is spelled out on the map; clicking a thing opens a card.
// SetupMap.svg(setup) returns the picture. Everything else in here is private.
const SetupMap=(()=>{
  const KEY=['#FFB81F','#FF6B93','#19C29D','#9A82FF','#45A9FF'],INK='#1B1840';
  const keyColor=k=>k==='R'?'#A7A4CB':KEY[k],keyName=k=>k==='R'?'R':k+1;
  const poly=(pts,fill)=>`<path d="M${pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')}Z" fill="${fill}"/>`;

  /* buildings: boxes at a fixed three-quarter angle. a runs down-right, b down-left, z up. (cx,cy) is the middle of the floor. */
  function building(cx,cy,o){
    const P=(a,b,z)=>[cx+(a-b)*.866,cy+(a+b)*.5-z],{w,d,h,r=0}=o;
    let s=`<ellipse cx="${cx}" cy="${cy+6}" rx="${(w+d)*.95}" ry="${(w+d)*.52}" fill="#000" opacity=".13"/>`;
    s+=poly([P(-w,d,0),P(w,d,0),P(w,d,h),P(-w,d,h)],o.wallA);   // wall facing down-left
    s+=poly([P(w,-d,0),P(w,d,0),P(w,d,h),P(w,-d,h)],o.wallB);   // wall facing down-right
    for(const f of o.onA||[])s+=poly([P(f[0],d,f[2]),P(f[1],d,f[2]),P(f[1],d,f[3]),P(f[0],d,f[3])],f[4]);
    for(const f of o.onB||[])s+=poly([P(w,f[0],f[2]),P(w,f[1],f[2]),P(w,f[1],f[3]),P(w,f[0],f[3])],f[4]);
    if(r){ // pitched roof, ridge running front to back
      const e=5;
      s+=poly([P(-w,d,h),P(w,d,h),P(0,d,h+r)],o.wallA);
      s+=poly([P(-w-e,-d-e,h-3),P(-w-e,d+e,h-3),P(0,d+e,h+r),P(0,-d-e,h+r)],o.roofB);
      s+=poly([P(w+e,-d-e,h-3),P(w+e,d+e,h-3),P(0,d+e,h+r),P(0,-d-e,h+r)],o.roofA);
      if(o.chimney)s+=poly([P(w*.5,-d*.3,h+r*.3),P(w*.5,-d*.3,h+r+8),P(w*.5+10,-d*.3,h+r+8),P(w*.5+10,-d*.3,h+r*.1)],o.wallB)+poly([P(w*.5,-d*.3,h+r+8),P(w*.5+10,-d*.3,h+r+8),P(w*.5+10,-d*.3-10,h+r+8),P(w*.5,-d*.3-10,h+r+8)],o.wallA);
    }else s+=poly([P(-w,-d,h),P(w,-d,h),P(w,d,h),P(-w,d,h)],o.roofA);
    return {svg:s,front:cy+(w+d)*.5,top:P(0,0,h+r)[1]};
  }
  const win=(a0,z0,n,m,sx,sz,c,ww=10,wh=12)=>{const o=[];for(let i=0;i<n;i++)for(let j=0;j<m;j++)o.push([a0+i*sx,a0+i*sx+ww,z0+j*sz,z0+j*sz+wh,c]);return o};
  const SPOTS={
    home:    {name:'Home',x:126,y:334,b:{w:44,d:38,h:42,r:30,wallA:'#FFF4E0',wallB:'#EAD9BC',roofA:'#FF6B93',roofB:'#D94C77',chimney:1,onA:[[-10,8,0,26,'#9A6A3A'],[-36,-20,14,28,'#8FD3FF'],[20,36,14,28,'#8FD3FF']],onB:[[-24,-6,14,28,'#6DBBEA'],[6,24,14,28,'#6DBBEA']]}},
    relative:{name:'Relative’s place',x:262,y:172,b:{w:40,d:34,h:38,r:26,wallA:'#FDF0FF',wallB:'#E2D0EE',roofA:'#9A82FF',roofB:'#7A62DD',onA:[[-8,8,0,24,'#9A6A3A'],[18,32,12,26,'#8FD3FF']],onB:[[-20,-4,12,26,'#6DBBEA'],[6,22,12,26,'#6DBBEA']]}},
    office:  {name:'Office',x:438,y:176,b:{w:38,d:38,h:112,wallA:'#DCE6FF',wallB:'#B9C7EE',roofA:'#EEF2FF',onA:[...win(-30,10,4,5,16,19,'#5B9BE8').slice(4),[-8,8,0,14,INK]],onB:win(-30,10,4,5,16,19,'#4A86CF')}},
    friend:  {name:'Friend’s place',x:604,y:268,b:{w:40,d:34,h:38,r:26,wallA:'#F0FFF8',wallB:'#CDE9DD',roofA:'#19C29D',roofB:'#0E9C7D',chimney:1,onA:[[-8,8,0,24,'#9A6A3A'],[-32,-18,12,26,'#8FD3FF']],onB:[[-20,-4,12,26,'#6DBBEA'],[6,22,12,26,'#6DBBEA']]}},
    bank:    {name:'Bank box',x:466,y:386,b:{w:52,d:36,h:50,wallA:'#F4F1EA',wallB:'#D8D3C6',roofA:'#FFD84D',onA:[[-46,-38,0,40,'#fff'],[-26,-18,0,40,'#fff'],[18,26,0,40,'#fff'],[38,46,0,40,'#fff'],[-9,9,0,30,INK],[-52,52,40,50,'#EDE7D8']],onB:[[-36,36,40,50,'#C9C3B4'],[-22,-8,10,30,'#8FA0B8'],[8,22,10,30,'#8FA0B8']]}},
  };
  const COMPANY={x:684,y:134,b:{w:36,d:36,h:96,wallA:'#3B3670',wallB:'#28245A',roofA:'#514C8C',onA:win(-28,10,4,4,15,20,'#FFD84D',9,11),onB:win(-28,10,4,4,15,20,'#E8B93A',9,11)}};
  const YOU={x:300,y:446};

  /* tokens: small upright pictures of the things you own. Feet at (0,0). */
  const TOK={
    phone:`<rect x="-13" y="-48" width="26" height="46" rx="6" fill="${INK}"/><rect x="-10" y="-44" width="20" height="36" rx="3" fill="#5438F0"/><circle cy="-27" r="7" fill="#FFB81F"/>`,
    laptop:`<rect x="-19" y="-36" width="38" height="26" rx="4" fill="${INK}"/><rect x="-16" y="-33" width="32" height="20" rx="2" fill="#5438F0"/><path d="M-24 -8h48l-4 6h-40z" fill="#8E8AB8"/>`,
    signer:`<rect x="-24" y="-36" width="48" height="24" rx="12" fill="#F47B20"/><rect x="-24" y="-24" width="48" height="12" rx="6" fill="#DD6614"/><rect x="-12" y="-33" width="18" height="18" rx="3" fill="${INK}"/><rect x="-9" y="-30" width="12" height="3" rx="1.5" fill="#F47B20"/><circle cx="14" cy="-30" r="2.2" fill="#FFF4E0"/><circle cx="14" cy="-24" r="2.2" fill="#FFF4E0"/><circle cx="14" cy="-18" r="2.2" fill="#FFF4E0"/><rect x="-3" y="-12" width="6" height="10" fill="#8E8AB8"/>`,
    paper:`<g transform="rotate(-5)"><rect x="-16" y="-46" width="32" height="42" rx="2" fill="#FFFDF2" stroke="#E4DCC0"/><path d="M-11 -38h9M2 -38h9M-11 -31h9M2 -31h9M-11 -24h9M2 -24h9M-11 -17h9M2 -17h9M-11 -10h9M2 -10h9" stroke="#8E8AB8" stroke-width="2" stroke-linecap="round"/></g>`,
    steel:`<rect x="-20" y="-34" width="40" height="28" rx="3" fill="#B8C2D4"/><rect x="-20" y="-12" width="40" height="6" rx="3" fill="#8E9AB0"/><g fill="#5F6B82"><circle cx="-15" cy="-29" r="1.8"/><circle cx="15" cy="-29" r="1.8"/><circle cx="-15" cy="-15" r="1.8"/><circle cx="15" cy="-15" r="1.8"/></g><path d="M-11 -26h22M-11 -21h22M-11 -16h22" stroke="#6C7890" stroke-width="2.4" stroke-dasharray="2.4 1.6"/>`,
    file:`<path d="M-14 -46h20l8 8v34h-28z" fill="#fff" stroke="#C9CDE6"/><path d="M6 -46v8h8z" fill="#C9CDE6"/><text y="-17" text-anchor="middle" font-size="13" font-weight="800" style="fill:#5438F0">{ }</text>`,
    note:`<g transform="rotate(4)"><rect x="-15" y="-36" width="30" height="30" fill="#FFE66B"/><path d="M-9 -27h18M-9 -20h18M-9 -13h10" stroke="#B89A00" stroke-width="2" stroke-linecap="round"/></g>`,
    login:`<rect x="-21" y="-40" width="42" height="30" rx="5" fill="#fff" stroke="#C9CDE6"/><circle cx="-9" cy="-28" r="5" fill="#8E8AB8"/><path d="M-17 -15q8 -10 16 0z" fill="#8E8AB8"/><rect x="4" y="-27" width="12" height="10" rx="2" fill="#F07F00"/><path d="M6.5 -27v-3q3.5 -5 7 0v3" fill="none" stroke="#F07F00" stroke-width="2"/>`,
    coins:`<ellipse cy="-8" rx="15" ry="6" fill="#E99A00"/><rect x="-15" y="-14" width="30" height="6" fill="#E99A00"/><ellipse cy="-14" rx="15" ry="6" fill="#FFCB3D"/><ellipse cy="-19" rx="15" ry="6" fill="#E99A00"/><rect x="-15" y="-25" width="30" height="6" fill="#E99A00"/><ellipse cy="-25" rx="15" ry="6" fill="#FFCB3D"/><ellipse cy="-30" rx="15" ry="6" fill="#E99A00"/><rect x="-15" y="-36" width="30" height="6" fill="#E99A00"/><ellipse cy="-36" rx="15" ry="6" fill="#FFD95A"/>`,
    key:`<circle cx="-8" cy="-26" r="11" fill="none" stroke="#8E8AB8" stroke-width="6"/><path d="M2 -26h22M16 -26v9M23 -26v7" fill="none" stroke="#8E8AB8" stroke-width="6" stroke-linecap="round"/>`,
  };
  const NAMES={phone:'Phone wallet',laptop:'Laptop wallet',signer:'Hardware signer',paper:'Seed on paper',steel:'Seed on steel',file:'Wallet file',note:'Passphrase note',login:'Login',coins:'The coins',key:'A key the company holds'};
  const MARK={
    lock:`<g transform="translate(-17 -46)"><circle r="9" fill="#17A865" stroke="#fff" stroke-width="2"/><rect x="-4" y="-2" width="8" height="6" rx="1" fill="#fff"/><path d="M-2.5 -2v-1.5q2.5 -3.5 5 0v1.5" fill="none" stroke="#fff" stroke-width="1.5"/></g>`,
    tick:`<g transform="translate(-17 -46)"><circle r="9" fill="#17A865" stroke="#fff" stroke-width="2"/><path d="M-4 0l3 3l5 -6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  };
  let REG=[]; // what each clickable thing is, by index; rebuilt on every draw
  /* A disaster playing on the map. FX is what the model threw: the event, whether it is a theft or a loss, and which
     keys it says were hit. From that, each thing on the map gets a fate:
       "gone"   destroyed, lost or out of reach        "taken"  carried off
       "hacked" still there, but someone else has it    "safe"   it was in the line of fire and came through
     or none, if the disaster never came near it. The rules follow the model's own event flags, so a new event of an
     existing kind needs nothing here. */
  let FX=null;
  /* Disasters compound: what earlier ones destroyed or carried off stays that way. FX.prior holds those fates by thing.
     A thing already gone can't be struck again; anything else can. fate() gives [fate, fresh]: fresh means the disaster
     playing now did it, so it animates; the rest is drawn as it was left. */
  const tid=t=>`${t.role||t.t}:${t.k==null?'':t.k}:${t.loc||''}`;
  function fate(t){
    const prior=FX&&FX.prior&&FX.prior[tid(t)];
    if(prior==='gone'||prior==='taken')return [prior,false];
    const f=FX&&FX.ev?strike(t):'';
    return f?[f,true]:[prior||'',false];
  }
  function strike(t){
    const e=FX.ev,theft=FX.kind==='t',k=t.key,hit=t.k==='R'?!!FX.rhit:t.k!=null&&!!FX.hit[t.k];
    const hacked=hit?'hacked':'safe',lost=hit?'gone':'safe';
    if(e.duress||e.border)return e.places.includes(t.loc)&&t.k!=null?(hit?(e.border?'hacked':'taken'):'safe'):''; // forced: what you have on you or at home
    if(e.places&&e.places.length){                                      // strikes a place, or you while out
      if(!e.places.includes(t.loc))return '';
      if(!theft)return t.t==='steel'&&e.fire?'safe':'gone';
      return e.takes||hit?'taken':'safe';
    }
    if(e.cloud)return t.loc==='cloud'?(theft?hacked:'gone'):'';
    if(e.cust){                                                         // the company holding the coins: hacked or seized (taken), frozen or bust (gone)
      const stolen=e.login||e.id==='c_hack'||e.id==='c_rules';
      return t.role==='coins'?(FX.bad?(stolen?'taken':'gone'):'safe'):t.role==='login'&&e.login?(FX.bad?'hacked':'safe'):'';
    }
    if(e.prov||e.gov){                                                  // a provider is hacked, shuts down or is taken over
      if(t.role==='provkey'&&(e.gov||k.device===e.prov))return theft?hacked:'gone';
      return e.push&&t.role==='device'&&hit?'hacked':'';
    }
    if(e.dev)return t.role==='device'&&t.k===FX.dead?'gone':'';          // one device dies
    if(e.hot)return t.role!=='device'?'':hot(k)?hacked:hit?'hacked':'';  // malware: online phones and laptops are in the line of fire; it rarely reaches anything else
    if(e.app)return t.role==='device'&&soft(k)?hacked:'';
    if(e.brand)return k&&k.device==='hw'&&k.brand===e.brand&&t.role===(e.bugloss?'backup':'device')?(e.bugloss?lost:hacked):'';
    if(e.guess)return (t.role==='device'||t.role==='backup')&&k.ent==='words'?hacked:'';
    if(e.phish)return t.role==='backup'&&hit?'hacked':'';
    if(e.lapse)return t.k==='R'?hacked:'';
    if(e.id==='l_time')return t.k!=null&&hit?'gone':'';                  // ten quiet years: whatever belonged to a key that didn't last
    return '';
  }
  const FXMARK={gone:['#EF5350','<path d="M-5 -5L5 5M5 -5L-5 5" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>'],hacked:['#EF5350','<path d="M0 -7v7" stroke="#fff" stroke-width="3.8" stroke-linecap="round"/><circle cy="6" r="2.2" fill="#fff"/>'],safe:['#17A865','<path d="M-6 0l4 4l7 -8" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>']};
  function token(x,y,t,s=1){
    REG.push(t);
    const [f,fresh]=fate(t);t.fate=f;t.fresh=fresh;t.id=tid(t);t.x=x;t.y=y;
    const mark=FXMARK[f]?`<g class="fxmark${fresh?'':' was'}" transform="translate(0 -24)"><circle r="13" fill="${FXMARK[f][0]}" stroke="#fff" stroke-width="2.5"/>${FXMARK[f][1]}</g>`:'';
    const badge=t.k==null?'':`<circle cx="17" cy="-46" r="10" fill="${keyColor(t.k)}" stroke="#fff" stroke-width="2"/><text x="17" y="-42" text-anchor="middle" font-size="11" font-weight="800">${keyName(t.k)}</text>`;
    return `<g class="maptap" data-i="${REG.length-1}" transform="translate(${x.toFixed(1)} ${y}) scale(${s})"><title>${NAMES[t.t]}</title><g class="mapstep" data-step="t${REG.length-1}"><ellipse rx="20" ry="6" fill="#000" opacity=".16"/><g class="mapfate ${f?'fate-'+f:''}${fresh?'':' was'}"><g class="mappulse" style="--t:${-(REG.length%6)*.4}s">${TOK[t.t]}${badge}${MARK[t.mark]||''}</g></g>${mark}</g></g>`;
  }
  const label=(x,y,text,dim)=>{const w=text.length*7.2+18;return `<g opacity="${dim?.6:1}"><rect x="${x-w/2}" y="${y-13}" width="${w}" height="20" rx="10" fill="#fff" opacity=".9"/><text x="${x}" y="${y+1.5}" text-anchor="middle" font-size="13" font-weight="700">${text}</text></g>`};
  // a row of tokens centred on x; they close up when there are many
  const row=(x,y,items,place,s=1)=>{const gap=Math.min(46,items.length>1?150/(items.length-1):46)*s,x0=x-(items.length-1)*gap/2;return items.map((t,i)=>(t.place=place,token(x0+i*gap,y,t,s))).join('')};

  /* what is where, read from the app's setup */
  function describe(s){
    const d={places:{home:[],office:[],relative:[],friend:[],bank:[]},you:[],head:[],cloud:[],company:null};
    const put=(loc,t)=>{t.loc=loc;(loc==='carry'?d.you:d.places[loc]).push(t)};
    if(custodial(s)){
      const name={exchange:'Exchange',fintech:'Payment app',bank:'Bank or broker',etf:'ETF fund'}[s.type];
      d.company={name,items:[{t:'coins',role:'coins',loc:'company'}]};
      d.you.push({t:'login',role:'login',loc:'carry',mark:s.login==='app'?'lock':null});
      d.head.push({label:name+' password',secret:'hunter2',dots:7});
      return d;
    }
    const keys=allKeys(s),several=s.m<s.n||TL(s);
    keys.forEach((k,i)=>{
      const kk=TL(s)&&i===keys.length-1?'R':i;
      if(isProv(k)){d.company=d.company||{name:'Provider',items:[]};d.company.items.push({t:'key',k:kk,role:'provkey',key:k,loc:'company'});return}
      if(k.device!=='none'){
        put(k.dloc,{t:{hw:'signer',phone:'phone',laptop:'laptop'}[k.device],k:kk,role:'device',key:k,mark:k.pin==='strong'?'lock':null});
        if(k.pin!=='none')d.head.push({label:{hw:'Signer',phone:'Phone',laptop:'Laptop'}[k.device]+' unlock PIN',secret:k.pin==='simple'?'1234':'31415926',dots:k.pin==='simple'?4:8,k:kk});
      }
      if(k.backup==='paper'||k.backup==='metal'){
        put(k.bloc,{t:k.backup==='paper'?'paper':'steel',k:kk,role:'backup',key:k,mark:s.tested?'tick':null});
        if(several&&s.config==='all')put(k.bloc,{t:'file',role:'file'});
      }else if(k.backup==='memory')d.head.push({label:'Seed phrase',secret:'never gonna give you… um',dots:12,k:kk});
      else if(k.backup==='cloud')d.cloud.push({t:'paper',k:kk,role:'backup',key:k,loc:'cloud'});
      if(k.pass==='memory')d.head.push({label:'Wallet passphrase',secret:'hunter2',dots:7,k:kk});
      else if(k.pass==='written')put(k.ploc,{t:'note',k:kk,role:'pass',key:k});
    });
    if(several&&s.config==='one')put(s.cloc,{t:'file',role:'file'});
    return d;
  }

  /* Who you play as: a photo of a well-known bitcoiner's head, cut out like a sticker, on a small drawn body.
     Purely for fun: it changes nothing in the model. "quote" is something the person really said or wrote and is shown
     in quotation marks under their name, so never invent or reword one. "jokes" are ours, about the character, and
     are never put in their mouth. head: [file, width of the picture when it is 168 tall]. */
  const CHARS={
    satoshi:{name:'Satoshi Nakamoto',by:'Satoshi Nakamoto, 2010',head:['img/head-satoshi.webp',145],skin:'#D9A07A',
      quote:'If you don’t believe me or don’t get it, I don’t have time to try to convince you, sorry.',
      jokes:['Nobody knows who you are. Some days that includes you.','Last seen online in 2011. Nobody has dared to change the password.']},
    hal:{name:'Hal Finney',by:'Hal Finney, 2009',head:['img/head-hal.webp',140],skin:'#E0A98A',
      quote:'Running bitcoin',
      jokes:['Running bitcoin. Also just running.','Received the very first bitcoin transaction. Never bragged about it.']},
    adam:{name:'Adam Back',by:'Adam Back, on his Twitter profile',head:['img/head-adam.webp',133],skin:'#E2B79E',
      quote:'Bitcoin is Hashcash extended with inflation control.',
      jokes:['Invented proof-of-work to stop spam. Still gets spam.','Gets asked whether he is Satoshi about once a day.']},
    saylor:{name:'Michael Saylor',by:'Michael Saylor',head:['img/head-saylor.webp',118],skin:'#D8A88C',
      quote:'There is no second best.',
      jokes:['Has never sold. Has also never blinked.','Currently working out what this island costs in bitcoin.']},
    jack:{name:'Jack Dorsey',by:'Jack Dorsey, 2021',head:['img/head-jack.webp',102],skin:'#D6A283',
      quote:'Bitcoin changes absolutely everything.',
      jokes:['The beard is on its own block height.','Sent from a silent retreat.']},
    andreas:{name:'Andreas M. Antonopoulos',by:'Andreas M. Antonopoulos',head:['img/head-andreas.webp',131],skin:'#DDB093',up:1,
      quote:'Not your keys, not your coins.',
      jokes:['Has already explained bitcoin to everyone on this island. Twice.','Can explain this whole map using only pizza.']},
    breedlove:{name:'Robert Breedlove',by:'Robert Breedlove',head:['img/head-breedlove.webp',128],skin:'#D2A078',
      quote:'Bitcoin is the most superior monetary technology that has ever existed.',
      jokes:['Was offered a shirt. Declined.','Asks “what is money?” between push-ups.']},
    saifedean:{name:'Saifedean Ammous',by:'Saifedean Ammous, The Bitcoin Standard',head:['img/head-saifedean.webp',126],skin:'#C99A78',
      quote:'Bitcoin is the hardest money ever invented.',
      jokes:['On a strict diet of steak and hard money.','Low time preference. Will wait as long as it takes for you to read the book.']},
  };
  let WHO='satoshi';
  /* The figure, feet at (0,0), about 103 tall. Every body is the same few parts in different clothes. */
  function figure(id,carry){
    const c=CHARS[id],k=c.skin,[file,w168]=c.head;
    const legs=(col,shoe,bare)=>`<g fill="${bare?k:col}"><rect x="-11" y="-22" width="9" height="20" rx="3"/><rect x="2" y="-22" width="9" height="20" rx="3"/></g>${bare?`<path d="M-13 -25H13L12 -12H1L0 -16L-1 -12H-12Z" fill="${col}"/>`:''}<g fill="${shoe}"><ellipse cx="-7.5" cy="-1.5" rx="7" ry="3.6"/><ellipse cx="7.5" cy="-1.5" rx="7" ry="3.6"/></g>`;
    // arms: skin all the way, with a sleeve over the whole arm or only the top of it. The right one reaches out when carrying.
    const L=c.up?['M-15 -42Q-27 -42 -29 -55',-29,-57,'M-15 -42Q-22 -43 -25 -47']:['M-15 -42Q-22 -34 -20 -24',-20,-22,'M-15 -42Q-19 -39 -20 -35'];
    const R=carry?['M14 -41Q26 -38 34 -24',34,-22,'M14 -41Q20 -41 24 -37']:['M15 -42Q22 -34 20 -24',20,-22,'M15 -42Q19 -39 20 -35'];
    const arm=(a,sleeve,short,wide)=>`<path d="${a[0]}" fill="none" stroke="${short?k:sleeve}" stroke-width="${wide||7}" stroke-linecap="round"/>${short&&sleeve?`<path d="${a[3]}" fill="none" stroke="${sleeve}" stroke-width="${(wide||7)+1}" stroke-linecap="round"/>`:''}<circle cx="${a[1]}" cy="${a[2]}" r="3.8" fill="${k}"/>`;
    const arms=(sleeve,short,wide)=>arm(L,sleeve,short,wide)+arm(R,sleeve,short,wide);
    const torso=fill=>`<path d="M-15 -46Q-17 -46 -17 -42L-13 -18H13L17 -42Q17 -46 15 -46Z" fill="${fill}"/>`;
    const suit=(jacket,shirt,tie,len)=>arms(jacket)+torso(jacket)+`<path d="M-6 -46L0 -33L6 -46Z" fill="${shirt}"/><path d="M-1.8 -45h3.6l1.5 ${len-3}L0 ${-45+len}l-3.3 -3z" fill="${tie}"/><path d="M-6 -46L0 -33L6 -46M0 -33V-18" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.2"/>`;
    const body={
      satoshi:()=>legs('#5A5F6B','#2B2B33')+suit('#8C8577','#E4ECF2','#3D4A5C',12),
      saylor:()=>legs('#1E2740','#111')+suit('#1E2740','#fff','#F7931A',19),
      hal:()=>legs('#1F2A55','#fff',1)+arms('',1)+torso('#D8343B')+`<rect x="-7.5" y="-40" width="15" height="11" rx="1.5" fill="#fff"/><text x="0" y="-31.6" text-anchor="middle" font-size="8" font-weight="800" fill="#1B1840">09</text>`,
      adam:()=>legs('#3B4A6B','#2B2B33')+arms('#23232B',1)+torso('#23232B')+`<text x="0" y="-30" text-anchor="middle" font-size="7" font-weight="700" font-family="monospace" fill="#7CFFB2">0000</text>`,
      jack:()=>`<defs><radialGradient id="map-tiedye" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#FFE14D"/><stop offset=".3" stop-color="#FF7A59"/><stop offset=".55" stop-color="#E85D9A"/><stop offset=".8" stop-color="#7C66FF"/><stop offset="1" stop-color="#3DC8E8"/></radialGradient></defs>`+legs('#23232B','#B98A55')+arms('#7C66FF',1)+torso('url(#map-tiedye)'),
      andreas:()=>`<defs><pattern id="map-plaid" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#CFE2F3"/><path d="M0 2H7M2 0V7" stroke="#4F7FB5" stroke-width="1.6"/><path d="M0 5.5H7M5.5 0V7" stroke="#fff" stroke-width=".8"/></pattern></defs>`+legs('#8B7B5A','#5B4632')+arms('#9DBFE0')+torso('url(#map-plaid)')+`<path d="M-4 -46L0 -40L4 -46Z" fill="${k}"/><path d="M0 -40V-18" stroke="#4F7FB5" stroke-width="1"/>`,
      // no shirt: wide shoulders, big arms, and a six-pack drawn the way a child would
      breedlove:()=>legs('#23232B','#2B2B33',1)+arms('',1,10)+`<circle cx="-21" cy="-37" r="6.5" fill="${k}"/><circle cx="${carry?22:21}" cy="-37" r="6.5" fill="${k}"/><path d="M-21 -46Q-24 -46 -23 -40L-12 -20H12L23 -40Q24 -46 21 -46Z" fill="${k}"/><g fill="none" stroke="#9A6B45" stroke-width="1.3" stroke-linecap="round"><path d="M-14 -40Q-7 -33 -1 -39M1 -39Q7 -33 14 -40"/><path d="M-22 -40Q-25 -37 -23 -33M22 -40Q25 -37 23 -33" opacity=".7"/></g><g fill="#fff" fill-opacity=".28" stroke="#9A6B45" stroke-width="1"><rect x="-6.5" y="-33.5" width="6" height="4" rx="1.6"/><rect x=".5" y="-33.5" width="6" height="4" rx="1.6"/><rect x="-6.5" y="-29" width="6" height="4" rx="1.6"/><rect x=".5" y="-29" width="6" height="4" rx="1.6"/><rect x="-6" y="-24.5" width="5.5" height="4" rx="1.6"/><rect x=".5" y="-24.5" width="5.5" height="4" rx="1.6"/></g><path d="M-8 -46Q0 -37 8 -46" fill="none" stroke="#D8DBE6" stroke-width="1.1"/>`,
      // navy suit, white shirt, no tie, and a steak in his other hand
      saifedean:()=>legs('#27406B','#2B2B33')+arms('#27406B')+torso('#27406B')+`<path d="M-6 -46L0 -34L6 -46Z" fill="#fff"/><path d="M-2.5 -46L0 -40L2.5 -46Z" fill="${k}"/><path d="M-6 -46L0 -34L6 -46M0 -34V-18" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.2"/><g transform="translate(-23 -18) rotate(-20)"><path d="M-7 0Q-8 -6 -1 -6Q7 -7 7 -1Q7 5 1 5Q-6 6 -7 0Z" fill="#F1DCCB"/><path d="M-5.4 0Q-6 -4.6 -1 -4.6Q5.4 -5.4 5.4 -1Q5.4 3.6 1 3.6Q-4.8 4.4 -5.4 0Z" fill="#B5413A"/><circle cx="-1.6" cy="-.6" r="1.5" fill="#F1DCCB"/></g>`,
    }[id]();
    // the head: big, and overlapping the collar. Jack's is longer, so the beard runs down his shirt.
    const hh=id==='jack'?70:60,hw=w168*hh/168,top=-103,x=-hw/2,s=hh/168;
    const eye=(ex,ey)=>`<g transform="translate(${(x+ex*s).toFixed(1)} ${(top+ey*s).toFixed(1)})"><circle r="4.6" fill="#FF2A2A" opacity=".35"/><path d="M-9 0H9M0 -3.5V3.5" stroke="#FF4B4B" stroke-width="1.1" stroke-linecap="round"/><circle r="2.6" fill="#FF2A2A"/><circle r="1.1" fill="#FFE3E3"/></g>`;
    return body+`<image href="${file}" x="${x.toFixed(1)}" y="${top}" width="${hw.toFixed(1)}" height="${hh}"/>`+(id==='saylor'?`<g class="maplaser">${eye(49,92)}${eye(78,92)}</g>`:'');
  }

  // Places (and you) can be clicked too. They open a card with nothing but a name and a joke: see SPOT_JOKES.
  // The attributes go on the place's group; a <title> can't, so the name is the label for screen readers.
  const spot=(id,name)=>{REG.push({spot:id,name});return `class="maptap mapplace" data-i="${REG.length-1}" role="button" aria-label="${name}"`};
  // Every disaster is a target plus one of six effects. The target is where it strikes: a place, you, the cloud, the
  // company across the water, the things it reaches, or (for time passing) the whole island.
  function effectKind(){
    const e=FX.ev,theft=FX.kind==='t';
    if(e.id==='l_time'||e.lapse)return 'time';
    if(e.places&&e.places.length)return theft?'thief':e.fire?'fire':e.places[0]==='bank'?'lock':'poof'; // stolen, burned, shut away, mislaid
    if(theft)return e.cust&&!e.login&&e.id!=='c_hack'?'lock':'bolt';                                  // freezes and seizures lock; hacks strike
    return e.cloud||e.prov||e.gov?'lock':'poof';                                                      // locked out; or it just stops existing
  }
  function target(spots){
    const e=FX.ev,you={x:YOU.x,top:YOU.y-106,front:YOU.y-18,you:1};
    if(e.places&&e.places.length){const p=e.places.find(p=>p!=='carry'&&!e.duress);return p?spots[p]:you}
    if(e.cloud)return {x:124,top:20,front:104};
    if(e.prov||e.gov||(e.cust&&!e.login))return spots.company;
    if(e.login||e.phish)return you;
    if(e.id==='l_time')return {x:350,top:210,front:300};
    const t=REG.find(t=>t.fresh&&t.fate!=='safe')||REG.find(t=>t.fresh); // strikes things directly: aim at the first one it reaches
    return t?{x:t.x,top:t.y-112,front:t.y}:you;
  }
  // What happens there: the disaster's icon drops in, then the effect. Timing is in the CSS (.fx…): drop, effect, then the things react.
  function effects(h){
    const flame=(x,y,s,d)=>`<g transform="translate(${h.x+x} ${y}) scale(${s})"><g class="fxflame" style="--t:${d}s"><path d="M0 0C-17 -9 -15 -30 -5 -44C-4 -34 3 -32 4 -24C10 -30 9 -40 6 -50C20 -38 22 -14 0 0Z" fill="#FF7A1A"/><path d="M0 -2C-9 -7 -8 -19 -2 -27C-1 -21 3 -20 4 -15C10 -20 11 -8 0 -2Z" fill="#FFD84D"/></g></g>`;
    const smoke=(x,y,d)=>`<circle class="fxsmoke" style="--t:${d}s" cx="${h.x+x}" cy="${y}" r="13" fill="#5A5688"/>`;
    let s=`<text class="fxdrop" x="${h.x}" y="${h.top+8}" text-anchor="middle" font-size="46">${FX.icon}</text>`;
    const kind=effectKind();
    if(kind==='bolt')s+=`<g class="fxbolt" transform="translate(${h.x} ${h.top})"><path d="M8 -150L-22 -52H-2L-18 18L30 -72H8L26 -150Z" fill="#FFD84D" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></g>`;
    if(kind==='lock')s+=`<g transform="translate(${h.x} ${h.top+34})"><g class="fxlock"><path d="M-15 -4v-14q15 -24 30 0v14" fill="none" stroke="#5A5688" stroke-width="8" stroke-linecap="round"/><rect x="-25" y="-6" width="50" height="40" rx="9" fill="#FFB81F" stroke="#fff" stroke-width="3"/><circle cy="10" r="6" fill="#1B1840"/><rect x="-2.5" y="12" width="5" height="12" rx="2.5" fill="#1B1840"/></g></g>`;
    if(kind==='poof')s+=`<g class="fxpoof" fill="#fff">${[[-26,10,20,0],[18,2,24,.25],[2,-22,18,.5],[-8,24,16,.75]].map(c=>`<circle class="fxpuff" style="--t:${c[3]}s" cx="${h.x+c[0]}" cy="${h.top+40+c[1]}" r="${c[2]}"/>`).join('')}</g>`;
    if(kind==='time')s+=`<g transform="translate(${h.x} ${h.top+20})" class="fxtime"><circle r="34" fill="#fff" stroke="#1B1840" stroke-width="6"/><path class="fxhand" d="M0 0V-22" stroke="#1B1840" stroke-width="5" stroke-linecap="round"/><path class="fxhand slow" d="M0 0V-14" stroke="#EF5350" stroke-width="5" stroke-linecap="round"/><circle r="4" fill="#1B1840"/></g>`;
    if(kind==='fire')s+=`<g class="fxfire">${smoke(-10,h.top-6,0)}${smoke(18,h.top-2,.5)}${smoke(-28,h.top+6,.9)}${flame(-34,h.top+34,.9,0)}${flame(-6,h.top+22,1.25,.15)}${flame(24,h.top+30,1,.3)}${flame(44,h.front-14,.8,.1)}${flame(-48,h.front-18,.75,.25)}</g>`;
    if(kind==='thief'){const x=h.you?h.x-64:h.x+74,y=h.you?h.front+18:h.front+30;
      s+=`<g class="fxthief" style="--from:${h.you?-260:260}px"><g transform="translate(${x} ${y})"><ellipse cy="2" rx="22" ry="7" fill="#000" opacity=".2"/><path d="M-19 0Q-20 -31 -8 -47H8Q20 -31 19 0Z" fill="#2B2756"/><circle cy="-56" r="15" fill="#2B2756"/><rect x="-15" y="-62" width="30" height="10" rx="5" fill="#fff"/><circle cx="-6" cy="-57" r="2.6" fill="#1B1840"/><circle cx="6" cy="-57" r="2.6" fill="#1B1840"/><path d="M14 -30q16 -8 22 6q4 16 -10 20q-14 2 -16 -10z" fill="#C9A26B"/></g></g>`}
    return s;
  }
  function svg(setup,fx){
    const S=describe(setup),B=[],T=[];REG=[];FX=fx||null; // buildings sorted back to front; tokens and labels on top so nothing hides them
    let paths='';const spots={}; // where each building stands, for aiming a disaster at it
    for(const [id,p] of Object.entries(SPOTS)){
      const items=S.places[id],b=building(p.x,p.y,p.b),y=b.front+38;
      spots[id]={x:p.x,top:b.top,front:b.front};
      if(items.length)paths+=`<path d="M${YOU.x} ${YOU.y-6}Q${(YOU.x+p.x)/2} ${Math.max(YOU.y,p.y)-10} ${p.x} ${p.y+34}" fill="none" stroke="#EAD9A8" stroke-width="9" stroke-linecap="round" opacity=".9"/>`;
      B.push([p.y,`<g ${spot(id,p.name)} opacity="${items.length?1:.5}">${b.svg}</g>`]);
      T.push(row(p.x,y,items,p.name)+label(p.x,y+(items.length?18:-22),p.name,!items.length));
    }
    // you: whoever you are playing as, holding what you carry
    REG.push({spot:'you'});
    let you=`<g class="mapstep maptap" data-i="${REG.length-1}" data-step="you"><title>You</title><ellipse cx="${YOU.x}" cy="${YOU.y+2}" rx="24" ry="8" fill="#000" opacity=".18"/><g class="mapchar" data-carry="${S.you.length?1:0}" transform="translate(${YOU.x} ${YOU.y})">${figure(WHO,S.you.length)}</g>`;
    you+=label(YOU.x,YOU.y+22,'You')+'</g>'+row(YOU.x+42+(S.you.length-1)*17,YOU.y+2,S.you,'With you',.85);
    if(S.head.length){ // thought bubble: closed until clicked. It floats up and to the right of the big head.
      REG.push({head:S.head});
      you+=`<g transform="translate(28 -16)"><g class="maptap mapstep" data-step="head" data-i="${REG.length-1}"><title>Memorized</title><circle cx="${YOU.x+6}" cy="${YOU.y-86}" r="4" fill="#fff"/><circle cx="${YOU.x+2}" cy="${YOU.y-99}" r="6.5" fill="#fff"/>
        <g class="mappulse"><rect x="${YOU.x-34}" y="${YOU.y-146}" width="68" height="38" rx="19" fill="#fff"/><g fill="#8E8AB8"><circle cx="${YOU.x-14}" cy="${YOU.y-127}" r="4.5"/><circle cx="${YOU.x}" cy="${YOU.y-127}" r="4.5"/><circle cx="${YOU.x+14}" cy="${YOU.y-127}" r="4.5"/></g></g></g></g>`;
    }
    // the company across the water, and the cloud: always drawn, faded when unused, like every other place
    const c=COMPANY,cb=building(c.x,c.y,c.b),co=S.company;spots.company={x:c.x,top:cb.top,front:cb.front};
    const far=`<g ${spot('company',co?co.name:'Exchange')} opacity="${co?1:.5}"><ellipse cx="${c.x}" cy="${c.y+16}" rx="96" ry="48" fill="#1B8E77"/><ellipse cx="${c.x}" cy="${c.y+8}" rx="96" ry="48" fill="#E9DDB0"/><ellipse cx="${c.x}" cy="${c.y+6}" rx="88" ry="42" fill="#7ED6A0"/>${cb.svg}</g>`+
      (co?row(c.x-58,c.y+52,co.items,co.name)+`<path d="M${YOU.x+70} ${YOU.y-50}Q520 60 ${c.x-96} ${c.y+30}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round" opacity=".9"/>`:'')+
      label(c.x+4,c.y+62,co?co.name:'Exchange',!co);
    const cloud=`<g ${spot('cloud','Cloud')} opacity="${S.cloud.length?1:.5}"><ellipse cx="118" cy="150" rx="62" ry="12" fill="#000" opacity=".1"/><g fill="#fff"><rect x="50" y="64" width="150" height="40" rx="20"/><circle cx="92" cy="64" r="28"/><circle cx="140" cy="54" r="36"/></g></g>`+row(124,102,S.cloud,'Cloud',.8)+label(124,124,'Cloud',!S.cloud.length);
    B.sort((a,b)=>a[0]-b[0]);
    return `<svg class="map" viewBox="0 0 800 560" role="img" aria-label="A map of this setup: where each device and backup is kept">
      <defs><linearGradient id="map-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6F06A"/><stop offset="1" stop-color="#5FCF8A"/></linearGradient></defs>
      <path d="M40 60h30M720 300h36M700 480h44M30 470h28M610 30h24M22 250h20M560 520h30M330 36h30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="350" cy="320" rx="322" ry="204" fill="#1B8E77"/><ellipse cx="350" cy="306" rx="322" ry="204" fill="#E9DDB0"/><ellipse cx="350" cy="302" rx="308" ry="192" fill="url(#map-grass)"/>
      ${far}<g class="mapstep" data-step="end">${paths}</g>${B.map(b=>b[1]).join('')}${T.join('')}${you}${cloud}${FX&&FX.ev?effects(target(spots)):''}
    </svg>`;
  }

  /* The introduction: the map builds itself in a few beats, each with a short caption. Worded as "let's say", because
     this is a pretend starting point and not a claim about the player. With many things, they all arrive in one beat. */
  const SAY={phone:'you have a bitcoin wallet on your phone',laptop:'you have a bitcoin wallet on your laptop',signer:'your key is on a hardware signer',login:'all you hold is a login',coins:'your coins are with a company',key:'a company holds one key',paper:'you wrote down the 12-word recovery phrase on a piece of paper',steel:'you stamped the 12-word recovery phrase into steel',note:'your passphrase is written down',file:'there is a copy of the wallet file'};
  const AT={'Home':' at home','Relative’s place':' at a relative’s place','Office':' at the office','Friend’s place':' at a friend’s place','Bank box':' in a bank box','Cloud':' in the cloud'};
  const ORDER=['coins','phone','laptop','signer','key','login','paper','steel','note','file'];
  function beats(){
    const things=REG.map((t,i)=>({t,i})).filter(x=>x.t.t).sort((a,b)=>ORDER.indexOf(a.t.t)-ORDER.indexOf(b.t.t));
    const out=[{steps:['you'],text:'This is you. Tap yourself to be someone else.'}];
    if(things.length>3)out.push({steps:things.map(x=>'t'+x.i),text:'Let’s say this is your setup.'});
    else things.forEach((x,n)=>out.push({steps:['t'+x.i],text:(n?'And ':'Let’s say ')+SAY[x.t.t]+(AT[x.t.place]||'')+'.'}));
    // What is memorized arrives as the thought bubble. An unlock PIN belongs with its device, so the bubble comes
    // straight after the device; with no PIN it comes last.
    const head=(REG.find(t=>t.head)||{}).head;
    if(head){
      const pin=head.find(l=>/unlock PIN/.test(l.label)),one=pin||head[0],lower=l=>l.label[0].toLowerCase()+l.label.slice(1);
      const beat={steps:['head'],text:pin||head.length===1?`And your ${lower(one)} is memorized.`:'And some things are memorized.'};
      const device=out.findIndex(b=>b.steps.length===1&&REG[+b.steps[0].slice(1)]&&['phone','laptop','signer'].includes(REG[+b.steps[0].slice(1)].t));
      if(pin&&device>0)out.splice(device+1,0,beat);else out.push(beat);
    }
    // the last three are about buttons on the screen, not things on the map; "point" is what the caption's line leads to
    out.push({steps:[],point:'[data-act="simBase"]',text:'🔥 Press “Try a disaster” to see what could go wrong.'});
    out.push({steps:[],point:'[data-act="editBase"]',text:'✏️ You can edit your current setup at any time.'});
    out.push({steps:[],point:'.maptool.next',text:'🚀 When you’re ready, press “Improve it” to build a better one.'});
    return out;
  }

  /* the card that opens when you click a thing. It says what the thing is, never what could go wrong with it. */
  const WORDS=['never','gonna','give','you','up','never','gonna','let','you','down','never','gonna'];
  const kb=k=>k==null?'':`<b class="mapkb" style="background:${keyColor(k)}" title="Key ${keyName(k)}">${keyName(k)}</b>`;
  function card(o){
    const joke=text=>text?`<p class="mapjoke">${text}</p>`:'';
    if(o.spot==='you'){
      // You: who you are playing as, something they really said, one of our lines about them, and the others to pick from.
      const c=CHARS[WHO];
      return `<h3>You, as ${c.name}</h3><blockquote class="mapquote">“${c.quote}”<cite>${c.by}</cite></blockquote>`+joke(any(c.jokes))+
        `<div class="mapwho" role="group" aria-label="Play as someone else">${Object.keys(CHARS).map(id=>`<button type="button" class="mapface" data-who="${id}" aria-pressed="${id===WHO}" aria-label="${CHARS[id].name}" title="${CHARS[id].name}"><img src="${CHARS[id].head[0]}" alt=""></button>`).join('')}</div>`;
    }
    if(o.spot)return `<h3>${SPOT_NAMES[o.spot]||o.name}</h3>`+joke(any(SPOT_JOKES[o.spot]));
    // Everything memorized is hidden behind dots. Clicking the dots shows that one; clicking again hides it.
    if(o.head)return `<h3>Memorized</h3>`+o.head.map(l=>`<div class="maprow"><span>${kb(l.k)}${l.label}</span><button type="button" class="mapsecret" data-secret="${l.secret}" data-mask="${'•'.repeat(l.dots)}" aria-label="Show or hide">${'•'.repeat(l.dots)}</button></div>`).join('')+joke('Also currently thinking about: '+any(THOUGHTS));
    const head=`<h3>${NAMES[o.t]} ${kb(o.k)}</h3>${o.place?`<p>${o.place}</p>`:''}`;
    const list=(cls,num)=>`<div class="${cls}">${WORDS.map((w,i)=>`<div>${num?`<small>${i+1}. </small>`:''}${w}</div>`).join('')}</div>`;
    const jokes=joke(JOKES[o.t]&&any(JOKES[o.t]))+joke(PLACE_JOKES[o.loc]);
    if(o.t==='paper')return head+`<div class="mapseed">${list('mapsheet',1)}<i class="maprick" role="img" aria-label="A photo of Rick Astley, taped to the paper"></i></div>`+jokes;
    if(o.t==='steel')return head+list('mapplate',0)+jokes;
    return head+jokes;
  }
  /* Hidden jokes: one line about the thing, one about where it is kept. They only show when a card is opened, and they
     never say what could go wrong with the thing. Several lines for one thing means a different one each time. */
  const any=a=>a[Math.floor(Math.random()*a.length)];
  const THOUGHTS=['their cat.','whether the oven is off.','that one embarrassing thing from 2009.','what’s for dinner.','a song they heard once in 2007.'];
  const JOKES={
    phone:['Currently open: 47 browser tabs.','Battery: 3%. As always.','Screen time this week: you don’t want to know.'],
    laptop:['Currently open: 47 browser tabs.','Fan status: preparing for take-off.'],
    signer:['Firmware update available. It has been for two years.'],
    steel:['Will outlive you, your house, and probably the sun.'],
    file:['File name: final_v2_REAL_final.json'],
    note:['Filed under “definitely not passwords”.'],
    coins:['Funds are safu.'],
    login:['Two-factor code sent to a phone number you had in 2016.'],
    key:['They promise they haven’t looked.'],
  };
  // The places themselves, and you. Purely for life: a name and one of a few lines, different each time.
  const SPOT_NAMES={home:'Your home',relative:'Your relative’s place',office:'Your office',friend:'Your friend’s place',bank:'The bank',cloud:'The cloud'};
  const SPOT_JOKES={
    home:['Home sweet home. The dishes can wait.','There’s a drawer in here full of cables you will never use.','The Wi-Fi password is on the fridge.'],
    relative:['Your grandma just made freshly baked cookies 😋','They still ask when you’ll get a real job.','Someone in here is forwarding chain emails.'],
    office:['This meeting could have been an email.','The printer is jammed. It has always been jammed.','Somebody hit “reply all”.'],
    friend:['They still owe you for that pizza in 2019.','You helped them move. Twice.','Their couch has seen things.'],
    bank:['Free pens. Chained to the desk.','Please take a number.','Your call is important to us.'],
    cloud:['Storage almost full. Upgrade now?','Syncing… since 2019.','There is no cloud. It’s just someone else’s computer.'],
    company:['Wen moon?','Number go up.','Support will reply within 3 to 5 business years.'],
  };
  const PLACE_JOKES={bank:'Opening hours: never when you need it.',relative:'They think it’s a recipe.',friend:'They promised not to peek.',office:'In the drawer under the stapler.',cloud:'The cloud: just someone else’s computer.'};
  document.addEventListener('click',ev=>{
    // The card is a real dialog, so the dimmed backdrop covers the whole page. Esc, the button or a click outside closes it.
    const dl=document.getElementById('mapitem'),tap=ev.target.closest('.maptap'),secret=ev.target.closest('.mapsecret'),who=ev.target.closest('[data-who]');
    const show=o=>{dl.innerHTML=`<div class="mappop">${card(o)}<button class="btn small" data-mapclose>Close</button></div>`};
    if(secret){const shown=secret.classList.toggle('shown');secret.textContent=shown?secret.dataset.secret:secret.dataset.mask;return}
    // Picking someone else redraws the figure on every map on the page, and the card, without closing it.
    if(who){WHO=who.dataset.who;document.querySelectorAll('.mapchar').forEach(g=>{g.innerHTML=figure(WHO,g.dataset.carry==='1')});show({spot:'you'});dl.querySelector('[aria-pressed="true"]').focus();return}
    if(ev.target===dl||ev.target.closest('[data-mapclose]')){dl.close();return}
    if(tap){show(REG[+tap.dataset.i]);dl.showModal()}
  });
  // beats() and things() describe the map drawn by the latest svg() call. things() lists what is on it and what became of each.
  const things=()=>REG.filter(t=>t.t).map(t=>({id:t.id,role:t.role,k:t.k,fate:t.fate,fresh:t.fresh}));
  return {svg,beats,things};
})();

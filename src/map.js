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
  function token(x,y,t,s=1){
    REG.push(t);
    const badge=t.k==null?'':`<circle cx="17" cy="-46" r="10" fill="${keyColor(t.k)}" stroke="#fff" stroke-width="2"/><text x="17" y="-42" text-anchor="middle" font-size="11" font-weight="800">${keyName(t.k)}</text>`;
    return `<g class="maptap" data-i="${REG.length-1}" transform="translate(${x.toFixed(1)} ${y}) scale(${s})"><title>${NAMES[t.t]}</title><g class="mapstep" data-step="t${REG.length-1}"><ellipse rx="20" ry="6" fill="#000" opacity=".16"/><g class="mappulse" style="--t:${-(REG.length%6)*.4}s">${TOK[t.t]}${badge}${MARK[t.mark]||''}</g></g></g>`;
  }
  const label=(x,y,text,dim)=>{const w=text.length*7.2+18;return `<g opacity="${dim?.6:1}"><rect x="${x-w/2}" y="${y-13}" width="${w}" height="20" rx="10" fill="#fff" opacity=".9"/><text x="${x}" y="${y+1.5}" text-anchor="middle" font-size="13" font-weight="700">${text}</text></g>`};
  // a row of tokens centred on x; they close up when there are many
  const row=(x,y,items,place,s=1)=>{const gap=Math.min(46,items.length>1?150/(items.length-1):46)*s,x0=x-(items.length-1)*gap/2;return items.map((t,i)=>(t.place=place,token(x0+i*gap,y,t,s))).join('')};

  /* what is where, read from the app's setup */
  function describe(s){
    const d={places:{home:[],office:[],relative:[],friend:[],bank:[]},you:[],head:[],cloud:[],company:null};
    const put=(loc,t)=>(loc==='carry'?d.you:d.places[loc]).push(t);
    if(custodial(s)){
      const name={exchange:'Exchange',fintech:'Payment app',bank:'Bank or broker',etf:'ETF fund'}[s.type];
      d.company={name,items:[{t:'coins'}]};
      d.you.push({t:'login',mark:s.login==='app'?'lock':null});
      d.head.push({label:name+' password',value:'*******',secret:'hunter2'});
      return d;
    }
    const keys=allKeys(s),several=s.m<s.n||TL(s);
    keys.forEach((k,i)=>{
      const kk=TL(s)&&i===keys.length-1?'R':i;
      if(isProv(k)){d.company=d.company||{name:'Provider',items:[]};d.company.items.push({t:'key',k:kk});return}
      if(k.device!=='none'){
        put(k.dloc,{t:{hw:'signer',phone:'phone',laptop:'laptop'}[k.device],k:kk,mark:k.pin==='strong'?'lock':null});
        if(k.pin!=='none')d.head.push({label:{hw:'Signer',phone:'Phone',laptop:'Laptop'}[k.device]+' unlock PIN',value:k.pin==='simple'?'1234':'8 digits',k:kk});
      }
      if(k.backup==='paper'||k.backup==='metal'){
        put(k.bloc,{t:k.backup==='paper'?'paper':'steel',k:kk,mark:s.tested?'tick':null});
        if(several&&s.config==='all')put(k.bloc,{t:'file'});
      }else if(k.backup==='memory')d.head.push({label:'Seed phrase',value:'never gonna give you… um',k:kk});
      else if(k.backup==='cloud')d.cloud.push({t:'paper',k:kk});
      if(k.pass==='memory')d.head.push({label:'Wallet passphrase',value:'*******',secret:'hunter2',k:kk});
      else if(k.pass==='written')put(k.ploc,{t:'note',k:kk});
    });
    if(several&&s.config==='one')put(s.cloc,{t:'file'});
    return d;
  }

  function svg(setup){
    const S=describe(setup),B=[],T=[];REG=[]; // buildings sorted back to front; tokens and labels on top so nothing hides them
    let paths='';
    for(const [id,p] of Object.entries(SPOTS)){
      const items=S.places[id],b=building(p.x,p.y,p.b),y=b.front+38;
      if(items.length)paths+=`<path d="M${YOU.x} ${YOU.y-6}Q${(YOU.x+p.x)/2} ${Math.max(YOU.y,p.y)-10} ${p.x} ${p.y+34}" fill="none" stroke="#EAD9A8" stroke-width="9" stroke-linecap="round" opacity=".9"/>`;
      B.push([p.y,`<g opacity="${items.length?1:.5}">${b.svg}</g>`]);
      T.push(row(p.x,y,items,p.name)+label(p.x,y+(items.length?18:-22),p.name,!items.length));
    }
    // you: a game piece, holding what you carry
    let you=`<g class="mapstep" data-step="you"><ellipse cx="${YOU.x}" cy="${YOU.y+2}" rx="24" ry="8" fill="#000" opacity=".18"/><path d="M${YOU.x-21} ${YOU.y}Q${YOU.x-22} ${YOU.y-34} ${YOU.x-9} ${YOU.y-52}H${YOU.x+9}Q${YOU.x+22} ${YOU.y-34} ${YOU.x+21} ${YOU.y}Z" fill="#5438F0"/><path d="M${YOU.x-21} ${YOU.y}Q${YOU.x-22} ${YOU.y-18} ${YOU.x-17} ${YOU.y-30}H${YOU.x+17}Q${YOU.x+22} ${YOU.y-18} ${YOU.x+21} ${YOU.y}Z" fill="#4329D6"/><circle cx="${YOU.x}" cy="${YOU.y-62}" r="16" fill="#5438F0"/><circle cx="${YOU.x-5}" cy="${YOU.y-66}" r="5" fill="#7C66FF"/>`;
    if(S.you.length)you+=`<path d="M${YOU.x+14} ${YOU.y-38}Q${YOU.x+26} ${YOU.y-36} ${YOU.x+34} ${YOU.y-22}" fill="none" stroke="#5438F0" stroke-width="8" stroke-linecap="round"/>`;
    you+=label(YOU.x,YOU.y+22,'You')+'</g>'+row(YOU.x+42+(S.you.length-1)*17,YOU.y+2,S.you,'With you',.85);
    if(S.head.length){ // thought bubble: closed until clicked
      REG.push({head:S.head});
      you+=`<g class="maptap mapstep" data-step="head" data-i="${REG.length-1}"><title>Memorized</title><circle cx="${YOU.x+6}" cy="${YOU.y-86}" r="4" fill="#fff"/><circle cx="${YOU.x+2}" cy="${YOU.y-99}" r="6.5" fill="#fff"/>
        <g class="mappulse"><rect x="${YOU.x-34}" y="${YOU.y-146}" width="68" height="38" rx="19" fill="#fff"/><g fill="#8E8AB8"><circle cx="${YOU.x-14}" cy="${YOU.y-127}" r="4.5"/><circle cx="${YOU.x}" cy="${YOU.y-127}" r="4.5"/><circle cx="${YOU.x+14}" cy="${YOU.y-127}" r="4.5"/></g></g></g>`;
    }
    // the company across the water, and the cloud: always drawn, faded when unused, like every other place
    const c=COMPANY,cb=building(c.x,c.y,c.b),co=S.company;
    const far=`<g opacity="${co?1:.5}"><ellipse cx="${c.x}" cy="${c.y+16}" rx="96" ry="48" fill="#1B8E77"/><ellipse cx="${c.x}" cy="${c.y+8}" rx="96" ry="48" fill="#E9DDB0"/><ellipse cx="${c.x}" cy="${c.y+6}" rx="88" ry="42" fill="#7ED6A0"/>${cb.svg}</g>`+
      (co?row(c.x-58,c.y+52,co.items,co.name)+`<path d="M${YOU.x+70} ${YOU.y-50}Q520 60 ${c.x-96} ${c.y+30}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round" opacity=".9"/>`:'')+
      label(c.x+4,c.y+62,co?co.name:'Exchange',!co);
    const cloud=`<g opacity="${S.cloud.length?1:.5}"><ellipse cx="118" cy="150" rx="62" ry="12" fill="#000" opacity=".1"/><g fill="#fff"><rect x="50" y="64" width="150" height="40" rx="20"/><circle cx="92" cy="64" r="28"/><circle cx="140" cy="54" r="36"/></g></g>`+row(124,102,S.cloud,'Cloud',.8)+label(124,124,'Cloud',!S.cloud.length);
    B.sort((a,b)=>a[0]-b[0]);
    return `<svg class="map" viewBox="0 0 800 560" role="img" aria-label="A map of this setup: where each device and backup is kept">
      <defs><linearGradient id="map-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6F06A"/><stop offset="1" stop-color="#5FCF8A"/></linearGradient></defs>
      <path d="M40 60h30M720 300h36M700 480h44M30 470h28M610 30h24M22 250h20M560 520h30M330 36h30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <ellipse cx="350" cy="320" rx="322" ry="204" fill="#1B8E77"/><ellipse cx="350" cy="306" rx="322" ry="204" fill="#E9DDB0"/><ellipse cx="350" cy="302" rx="308" ry="192" fill="url(#map-grass)"/>
      ${far}<g class="mapstep" data-step="end">${paths}</g>${B.map(b=>b[1]).join('')}${T.join('')}${you}${cloud}
    </svg>`;
  }

  /* The introduction: the map builds itself in a few beats, each with a short caption. Worded as "let's say", because
     this is a pretend starting point and not a claim about the player. With many things, they all arrive in one beat. */
  const SAY={phone:'you have a bitcoin wallet on your phone',laptop:'you have a bitcoin wallet on your laptop',signer:'your key is on a hardware signer',login:'all you hold is a login',coins:'your coins are with a company',key:'a company holds one key',paper:'you wrote down the 12-word recovery phrase on a piece of paper',steel:'you stamped the 12-word recovery phrase into steel',note:'your passphrase is written down',file:'there is a copy of the wallet file'};
  const AT={'Home':' at home','Relative’s place':' at a relative’s place','Office':' at the office','Friend’s place':' at a friend’s place','Bank box':' in a bank box','Cloud':' in the cloud'};
  const ORDER=['coins','phone','laptop','signer','key','login','paper','steel','note','file'];
  function beats(){
    const things=REG.map((t,i)=>({t,i})).filter(x=>x.t.t).sort((a,b)=>ORDER.indexOf(a.t.t)-ORDER.indexOf(b.t.t));
    const out=[{steps:['you'],text:'This is you.'}];
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
    if(o.head)return `<h3>Memorized</h3>`+o.head.map(l=>`<div class="maprow"><span>${kb(l.k)}${l.label}</span><span${l.secret?` data-secret="${l.secret}"`:''}>${l.value}</span></div>`).join('')+(o.head.some(l=>l.secret)?'<button class="btn small ghost" data-mapshow>Show it</button>':'');
    const head=`<h3>${NAMES[o.t]} ${kb(o.k)}</h3>${o.place?`<p>${o.place}</p>`:''}`;
    const list=(cls,num)=>`<div class="${cls}">${WORDS.map((w,i)=>`<div>${num?`<small>${i+1}. </small>`:''}${w}</div>`).join('')}</div>`;
    if(o.t==='paper')return head+`<div class="mapseed">${list('mapsheet',1)}<i class="maprick" role="img" aria-label="A photo of Rick Astley, taped to the paper"></i></div>`;
    if(o.t==='steel')return head+list('mapplate',0);
    return head;
  }
  document.addEventListener('click',ev=>{
    // The card is a real dialog, so the dimmed backdrop covers the whole page. Esc, the button or a click outside closes it.
    const dl=document.getElementById('mapitem'),tap=ev.target.closest('.maptap'),show=ev.target.closest('[data-mapshow]');
    if(show){dl.querySelectorAll('[data-secret]').forEach(e=>e.textContent=e.dataset.secret);show.remove();return}
    if(ev.target===dl||ev.target.closest('[data-mapclose]')){dl.close();return}
    if(tap){dl.innerHTML=`<div class="mappop">${card(REG[+tap.dataset.i])}<button class="btn small" data-mapclose>Close</button></div>`;dl.showModal()}
  });
  return {svg,beats}; // beats() describes the map drawn by the latest svg() call
})();

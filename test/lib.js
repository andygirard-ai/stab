var S={room:null,rows:[],notes:{},free:{},feedEC:null,feedPH:null,side:'standard',dir:'up',op:'APG',mode:'sweep',triage:[]};
var DEMO=false; var HIST=[]; function getHist(){return HIST;}
/* =====================================================================
   rooms.js — the weekly facility data. EDIT THIS FILE ON MONDAYS.
   Nothing else needs touching for schedule changes, move-ins, strain
   maps or feed targets. Bump asOf when you edit; the setup screen
   shows it and warns past seven days.
   Load order: rooms.js -> pure.js -> app.js.
   ===================================================================== */
var ROOMDATA_ASOF='9/3/2026';

/* mL per plant per day, as punched into Growlink */
var SCHED_ML={A1:996,A2:996,A3:1890,A4:2269,A5:1453,A6:1750,A7:1797,
 B1:1470,B2:997,B3:1480,B4:1292,B5:1798,B6:1688,
 C1:1713,C2:1245,C3:1480,C4:4322,C5:2152,C6:1688};

/* table count, bag size, media per room (bag can be overridden per room
   at sweep start; that override lives in stab_roomcfg, not here) */
var ROOMS={
 A1:{t:12,bag:2,media:'Bio365'}, A2:{t:12,bag:2,media:'Bio365'},
 A3:{t:12,bag:2,media:'Mother Earth coco'}, A4:{t:12,bag:1.25,media:'Bio365'},
 A5:{t:12,bag:1.25,media:'Bio365'}, A6:{t:12,bag:1.25,media:'Bio365'},
 A7:{t:12,bag:1.25,media:'Bio365'},
 B1:{t:11,bag:2,media:'Bio365'}, B2:{t:11,bag:2,media:'Bio365'},
 B3:{t:11,bag:1.25,media:'Bio365'}, B4:{t:11,bag:1.25,media:'Bio365'},
 B5:{t:11,bag:1.25,media:'Bio365'}, B6:{t:11,bag:2,media:'Bio365'},
 C1:{t:11,bag:2,media:'Bio365'}, C2:{t:11,bag:2,media:'Bio365'},
 C3:{t:11,bag:1.25,media:'Bio365'}, C4:{t:11,bag:1.25,media:'Bio365'},
 C5:{t:11,bag:1.25,media:'Bio365'}, C6:{t:11,bag:2,media:'Bio365'}
};

/* strain by table + flags: U underlights, T saucer */
var RMAP={
 A1:{"1":["Purple Chem",""],"2":["Purple Chem","T"],"3":["Purple Chem",""],"4":["Durban Poison",""],"5":["Durban Poison",""],"6":["Durban Poison","T"],"7":["Wedding Cake",""],"8":["Wedding Cake",""],"9":["Wedding Cake","T"],"10":["Mule Fuel",""],"11":["Mule Fuel",""],"12":["Mule Fuel",""]},
 A2:{"1":["Sour Jack",""],"2":["Ballet Slipper",""],"3":["Pretty Privilege",""],"4":["Pretty Privilege",""],"5":["Toronja",""],"6":["Toronja",""],"7":["Cobra Kush",""],"8":["Cobra Kush",""],"9":["Cobra Kush",""],"10":["Gas Plant",""],"11":["Gas Plant",""],"12":["Gas Plant",""]},
 A3:{"1":["Gas Plant",""],"2":["Gas Plant",""],"3":["Gas Plant",""],"4":["Gas Plant","T"],"5":["King Louie OG",""],"6":["King Louie OG",""],"7":["King Louie OG","T"],"8":["King Louie OG",""],"9":["Strawberry C.R.E.A.M.","T"],"10":["Strawberry C.R.E.A.M.",""],"11":["Lemon Drop Top","T"],"12":["Lemon Drop Top",""]},
 A4:{"1":["Pineapple Express",""],"2":["Pineapple Express",""],"3":["Banana Sherbet",""],"4":["Banana Sherbet",""],"5":["Banana Sherbet","T"],"6":["Sugar Breath",""],"7":["Sour Jack",""],"8":["Ice Cream Mintz",""],"9":["King 2","T"],"10":["King 2",""],"11":["Rum Cake",""],"12":["Rum Cake",""]},
 A5:{"1":["Cobra Kush",""],"2":["Cobra Kush",""],"3":["Cobra Kush","T"],"4":["Purple Chem","T"],"5":["The Judge","T"],"6":["The Judge",""],"7":["The Judge",""],"8":["The Judge",""],"9":["Kush Mintz","T"],"10":["Kush Mintz",""],"11":["Kush Mintz",""],"12":["Kush Mintz",""]},
 A6:{"1":["Bazooka Haze",""],"2":["Biker Kush",""],"3":["Biker Kush","T"],"4":["Znowflakes",""],"5":["Mule Fuel","TU"],"6":["Mule Fuel",""],"7":["Durban Poison","T"],"8":["Durban Poison",""],"9":["King Louis OG",""],"10":["King Louis OG",""],"11":["Wedding Cake","T"],"12":["Wedding Cake","U"]},
 A7:{"1":["Cabernet","U"],"2":["Cabernet",""],"3":["White truffle","T"],"4":["Banana Kush",""],"5":["Banana Kush","T"],"6":["Honeymoon Diesel",""],"7":["Honeymoon Diesel","T"],"8":["Super Silver Haze","T"],"9":["Super Silver Haze",""],"10":["Super Silver Haze",""],"11":["GMO",""],"12":["GMO","U"]},
 B1:{"1":["Mikado",""],"2":["Mikado",""],"3":["Runna Gal","T"],"4":["Runna Gal",""],"5":["CsxLem",""],"6":["Super Runtz x Sherbanger","T"],"7":["Super Runtz x Sherbanger",""],"8":["Gelato 41",""],"9":["VOP Kush",""],"10":["VOP Kush/Lip Smackers","T"],"11":["Lip Smackers",""]},
 B2:{"1":["Trick Trick OG",""],"2":["Island Sunshine",""],"3":["Island Sunshine",""],"4":["Runna Gal",""],"5":["Sunshine Kush",""],"6":["Sunshine Kush",""],"7":["Runtz x Sunset Sherbert",""],"8":["Runtz x Sunset Sherbert",""],"9":["Kush Mintz P5",""],"10":["Kush Mintz P5",""],"11":["Gelato 41",""]},
 B3:{"1":["Sour D 2",""],"2":["Milk Bone",""],"3":["Milk Bone","T"],"4":["Glitter Bomb",""],"5":["Glitter Bomb",""],"6":["Sour D","T"],"7":["Sour D",""],"8":["Brown Sugar",""],"9":["Brown Sugar",""],"10":["MAC",""],"11":["Guavanade",""]},
 B4:{"1":["Ethanol #33",""],"2":["Cherry Paloma",""],"3":["Cherry Paloma",""],"4":["Lime Thai",""],"5":["Lime Thai","T"],"6":["Honeymoon Diesel",""],"7":["Honeymoon Diesel",""],"8":["Hot Sauce",""],"9":["Cap Junky","T"],"10":["Cap Junky",""],"11":["Pink Passionfruit",""]},
 B5:{"1":["Sour d 2",""],"2":["Sour d 2","T"],"3":["Chemlato",""],"4":["Hindu Kush","T"],"5":["IDK",""],"6":["IDK",""],"7":["The OG","T"],"8":["Cabernet",""],"9":["Cabernet",""],"10":["Sour D","T"],"11":["Sour D",""]},
 B6:{"1":["Pineapple Kush",""],"2":["Walkabout",""],"3":["GMO Punch",""],"4":["GMO Punch","U"],"5":["Super Boof",""],"6":["Super Boof",""],"7":["Blue Nerdz",""],"8":["Banana Kush","TU"],"9":["Banana Kush",""],"10":["Walkabout",""],"11":["Pineapple Kush",""]},
 C1:{"1":["Deep Space #6",""],"2":["Deep Space #6",""],"3":["Pink Passionfruit",""],"4":["Pink Passionfruit",""],"5":["Milk Bone",""],"6":["Milk Bone",""],"7":["Blue Nerdz",""],"8":["Blue Nerdz",""],"9":["Glitter Bomb",""],"10":["Glitter Bomb",""],"11":["Cap Junky",""]},
 C2:{"1":["Deep Space #6",""],"2":["Deep Space #6",""],"3":["Milk Bone",""],"4":["Milk Bone",""],"5":["Cherry Paloma",""],"6":["Hot Sauce",""],"7":["Hot sauce",""],"8":["Banana Kush",""],"9":["Banana Kush",""],"10":["Ethanol #33",""],"11":["Ethanol #33",""]},
 C3:{"1":["Walkabout",""],"2":["Walkabout",""],"3":["Super Boof",""],"4":["Super Boof",""],"5":["Garlic Budder",""],"6":["Garlic Budder","T"],"7":["GMO Punch",""],"8":["GMO Punch",""],"9":["Velvet Breath","T"],"10":["Velvet Breath",""],"11":["Kabuki Sour",""]},
 C4:{"1":["Lemon Cherry Sherbert",""],"2":["Gello Gelato",""],"3":["Gello Gelato","T"],"4":["Chemdawg x Rainbowbeltz",""],"5":["Chemdawg x Rainbowbeltz",""],"6":["Young Gong","T"],"7":["Petro Chem",""],"8":["Purple Flamingo",""],"9":["OG Hurricane","T"],"10":["OG Hurricane",""],"11":["King Clem",""]},
 C5:{"1":["Kabuki Sour",""],"2":["Kabuki Sour","T"],"3":["Velvet Breath",""],"4":["Velvet Breath","T"],"5":["Blue Nerdz","T"],"6":["Runtz",""],"7":["Hellcat #15",""],"8":["Hellcat #15",""],"9":["Deep Space #6",""],"10":["Gorilla Glue #4",""],"11":["Gorilla Glue #4",""]},
 C6:{"1":["Mule Fuel","U"],"2":["Mule Fuel","T"],"3":["Mule Fuel / Cherry 96",""],"4":["Cabernet / Cap Junky / Guavanade / Bubba Kush",""],"5":["Guavanade",""],"6":["Cobra Kush","T"],"7":["Cap Junky",""],"8":["Cherry 96","U"],"9":["Cherry 96","T"],"10":["Cabernet",""],"11":["MAC","T"]}
};

/* first shot HH:MM, interval minutes, shots per day */
var SCHED={A1:['01:15',120,2],A2:['13:15',120,2],A3:['01:15',120,5],A4:['13:15',120,5],
 A5:['01:15',120,3],A6:['13:15',120,5],A7:['09:15',120,4],B1:['01:15',120,2],B2:['01:15',120,2],
 B3:['01:15',120,5],B4:['01:15',120,3],B5:['01:15',120,2],B6:['01:15',120,2],C1:['13:15',120,2],
 C2:['13:15',120,2],C3:['13:15',120,5],C4:['13:15',120,4],C5:['13:15',120,3],C6:['13:15',120,2]};

/* feed EC target by room; 0 = on water */
var FEEDEC={A1:2.5,A2:2.5,A3:0,A4:0,A5:2.6,A6:2.6,A7:2.6,
            B1:2.5,B2:2.5,B3:0,B4:2.5,B5:2.5,B6:2.5,
            C1:2.5,C2:2.5,C3:0,C4:2.5,C5:2.5,C6:2.5};
var DOF_REF=new Date(2026,7,28);
var DOF={A1:10,A2:9,A3:60,A4:57,A5:45,A6:38,A7:53,B1:17,B2:1,B3:64,B4:38,B5:29,B6:24,
         C1:16,C2:3,C3:63,C4:36,C5:29,C6:25};

/* Manual task durations as configured in Growlink 9/2/2026.
   Room flush = "all water". Rescue = "all feed" or an individual table. */
var MTASK={flush:{A:28,B:21,C:21}, rescue:12,
           note:'A2 splits: T1/T2 25 min, T3-T12 50 min — 4-drip vs 2-drip'};

/* pure.js — calibration, protocol, parsing, routes, workbook + CHECK.
   No DOM, no Bluetooth, no storage: everything here runs in node for tests.
   Storage is reached only through late-bound globals (getHist) that app.js
   defines before any call. */
/* ===================== PURE (testable, no DOM) ===================== */
var VER='v22';
function floorFor(rm){
  var c=ROOMS[rm]; if(!c) return 22;
  return (c.floor!=null)?c.floor:(FLOOR[c.bag]!=null?FLOOR[c.bag]:22);
}
var FLOOR={2:22, 1.25:30};
var PEGS=[
 ['posture',['praying','neutral','rolled','drooping','flagging']],
 ['color',['good','fading','light','yellowing','interveinal','purpling']],
 ['damage',['tip burn','margin','necrosis','bleach','wind burn','foxtail']],
 ['pests',['mites','thrips']],
 ['herm',['herm']],
 ['blocked',['crew','spray REI','maintenance']]
];
/* Feed EC by room, used by the CHECK rules to flag dilution as a fraction
   of what the room should be receiving rather than an absolute floor. */
function flushMins(rm){ return MTASK.flush[rm.charAt(0)]||21; }

function hoursSinceShot(room, nowDate){
  var c=SCHED[room]; if(!c) return null;
  var now=nowDate||new Date(), p=c[0].split(':'), best=null;
  for(var d=-1; d<=0; d++){
    var t0=new Date(now); t0.setDate(t0.getDate()+d);
    t0.setHours(+p[0],+p[1],0,0);
    for(var k=0;k<c[2];k++){
      var t=new Date(t0.getTime()+k*c[1]*60000);
      if(t<=now && (best===null || t>best)) best=t;
    }
  }
  return best===null ? null : (now-best)/3600000;
}
function dofNow(rm, nowDate){
  var d=DOF[rm]; if(d===undefined) return '';
  var n=nowDate?new Date(nowDate):new Date();
  return d + Math.round((n.setHours(0,0,0,0)-DOF_REF.getTime())/86400000);
}

/* ---- probe protocol ---- */
var SVC='deca0001-10c7-43a8-8c9f-42b70e03808d';
var NTF='deca0003-10c7-43a8-8c9f-42b70e03808d';
var WRT='deca0002-10c7-43a8-8c9f-42b70e03808d';

function crc16(arr){
  var c=0;
  for(var i=0;i<arr.length;i++){ c^=arr[i]<<8;
    for(var k=0;k<8;k++) c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF; }
  return c;
}
function frameBytes(txt){
  var p=[], i;
  for(i=0;i<txt.length;i++) p.push(txt.charCodeAt(i)&0xFF);
  var tot=6+p.length, b=[0x7C,0x61,(tot>>8)&255,tot&255];
  for(i=0;i<p.length;i++) b.push(p[i]);
  var c=crc16(b); b.push((c>>8)&255,c&255);
  return b;
}
var TRIGGER={n:'framed "sdicmd 0XR3!!"', b:frameBytes('sdicmd 0XR3!!')};
var CANDS=(function(){
  var L=[];
  ['sdicmd 0XR3!!','sdicmd 0XR3!!\n','sdicmd 0XR3!','sdicmd 0XR3!\n',
   'sdicmd 0XR3!!\r\n','0XR3!','0XR3!\n','sdicmd 0R3!!','sdicmd 0R0!!'
  ].forEach(function(t){ L.push({n:'framed '+JSON.stringify(t), b:frameBytes(t)}); });
  ['sdicmd 0XR3!!','sdicmd 0XR3!!\n','0XR3!','0XR3!\r\n'
  ].forEach(function(t){ L.push({n:'raw '+JSON.stringify(t), t:t}); });
  ['0','1','2'].forEach(function(a){ ['XR3!','XR4!','R3!','R4!'].forEach(function(c){
    L.push({n:a+c,t:a+c}); }); });
  [1,2,3,0,10,13].forEach(function(v){ L.push({n:'0x'+v.toString(16),b:[v]}); });
  return L;
})();
function bytesOf(c){
  if(c.b) return new Uint8Array(c.b);
  var a=[], t=c.t||'';
  for(var i=0;i<t.length;i++) a.push(t.charCodeAt(i)&0xFF);
  return new Uint8Array(a);
}

/* ---- conversions (verified against METER TEROS 12 docs, 8/30/2026 audit) ---- */
function vwcCounts(c){
  return (6.771e-10*c*c*c - 5.105e-6*c*c + 1.302e-2*c - 10.848)*100;
}
function permCounts(c){
  var v=2.887e-9*c*c*c - 2.080e-5*c*c + 5.276e-2*c - 43.39;
  return v*v;
}
/* METER publishes two VWC calibrations. The facility runs soilless (cubic,
   above). Mineral soil is linear: 3.879e-4*RAW - 0.6956, max ~0.70 in pure
   water (TEROS 12 manual 20587). Garden beds are mineral soil, so they must
   NOT use the soilless cubic. */
function vwcMineral(c){ return (3.879e-4*c - 0.6956)*100; }
var MINERAL_MEDIA={'Garden soil':1};
function isMineral(media){ return !!MINERAL_MEDIA[media]; }
function vwcFor(media, c){ return isMineral(media)?vwcMineral(c):vwcCounts(c); }

/* Hilhorst offset by media. Bio365 fitted from two paired Aroya readings
   (2.87 / 2.93 -> 2.90). Coco unproven — CAL-pair A3 to confirm or split.
   Garden soil uses METER's generic 4.1 until CAL pairs say otherwise. */
var OFFSET_BY_MEDIA={'Bio365':2.90,'Mother Earth coco':2.90,
  'Garden soil':4.10,                 /* METER generic, mineral only */
  'Peat mix · Sunshine #4 / ProMix HP':2.90};  /* Bio365 analogue, unfitted */
function offsetFor(media){
  return OFFSET_BY_MEDIA.hasOwnProperty(media)?OFFSET_BY_MEDIA[media]:2.90;
}

/* Inverses — used only by the simulator to synthesise realistic raw frames. */
function countsForVwc(target, mineral){
  if(mineral) return (target/100 + 0.6956)/3.879e-4;
  var lo=1000, hi=4000, m;
  for(var i=0;i<48;i++){ m=(lo+hi)/2; if(vwcCounts(m)<target) lo=m; else hi=m; }
  return (lo+hi)/2;
}
function bulkForEC(counts, ecTarget, tC, off){
  var eb=permCounts(counts), ep=80.3-0.37*(tC-20), d=eb-off;
  if(d<=0.5) return 0;
  return Math.max(0, Math.round(ecTarget*d*1000/ep));
}
function poreEC(counts, bulk_uS, tC, off){
  var eb=permCounts(counts), ep=80.3-0.37*(tC-20), d=eb-off;
  if(d<=0.5) return null;
  return ep*(bulk_uS/1000)/d;
}

/* parseText: path 1 = direct sensor reply (temp already degC per integrator
   guide); path 2 = ZSC status frame (counts x10, temp raw/100-50). */
function parseText(txt){
  var s=String(txt).replace(/[^\x20-\x7E]/g,' ');
  var m=s.match(/(\d+\.\d+)\s+(-?\d+\.?\d*)\s+(-?\d+)\s*[gh]/);
  if(m) return {counts:+m[1], tC:+m[2], bulk:+m[3], raw:m[0].trim(), direct:true};
  var n=s.match(/(\d+)\s*:\s*(\d+)\s+(\d+)\s+(\d+)/);
  if(n) return {counts:+n[2]/10, tC:+n[3]/100-50, bulk:+n[4], raw:n[0].trim(), direct:false, lead:+n[1]};
  return null;
}
function bytesToText(arr){
  var s='';
  for(var i=0;i<arr.length;i++){
    var v=arr[i]; s+=(v>=0x20&&v<=0x7E)?String.fromCharCode(v):' ';
  }
  return s;
}

/* ---- RX reassembly: framed (7C61+len+payload+CRC) and plain-text paths.
   Hooks are assigned by the DOM layer (and by tests). ---- */
var emitReading=function(pr){};
var emitUnparsed=function(tag,txt){};
var RX={buf:[], lastAt:0, flushT:null};
function rxBytes(bytes){
  for(var i=0;i<bytes.length;i++) RX.buf.push(bytes[i]);
  RX.lastAt=Date.now();
  if(RX.buf.length>600) RX.buf.splice(0,RX.buf.length-600);
  processRx();
}
function tryText(txt){
  var pr=parseText(txt);
  if(pr){ emitReading(pr); return true; }
  return false;
}
function processRx(){
  var b=RX.buf, guard=0;
  while(guard++<40){
    var s=-1;
    for(var i=0;i+1<b.length;i++){ if(b[i]===0x7C && b[i+1]===0x61){ s=i; break; } }
    if(s>=0){
      if(s>0){
        var head=b.slice(0,s);
        if(!tryText(bytesToText(head)) && head.length>6) emitUnparsed('pre', bytesToText(head));
        b.splice(0,s);
      }
      if(b.length<4) return;
      var len=(b[2]<<8)|b[3];
      if(len<7||len>400){ b.splice(0,2); continue; }
      if(b.length<len) return; /* wait for the rest of the frame */
      var fr=b.slice(0,len); b.splice(0,len);
      var want=(fr[len-2]<<8)|fr[len-1];
      var got=crc16(fr.slice(0,len-2));
      var payload=bytesToText(fr.slice(4,len-2));
      if(!tryText(payload)) emitUnparsed(got===want?'frame':'crc-bad', payload);
      continue;
    }
    /* no frame marker: try the whole buffer as text */
    if(b.length && tryText(bytesToText(b))){ b.length=0; }
    else if(b.length>240){
      emitUnparsed('overflow', bytesToText(b.slice(0,120)));
      b.splice(0,b.length-120);
    }
    return;
  }
}
function rxFlushStale(){
  if(RX.buf.length && Date.now()-RX.lastAt>900){
    if(!tryText(bytesToText(RX.buf))) emitUnparsed('stale', bytesToText(RX.buf));
    RX.buf.length=0;
  }
}

/* ---- route ---- */
function buildRoute(room, dir, mode){
  var cfg=ROOMS[room], r=[];
  if(mode==='triage'){
    var picks=(S.triage||[]).slice();
    if(!picks.length){ for(var z0=1;z0<=cfg.t;z0++) picks.push(z0); }
    if(dir==='down') picks.reverse();
    picks.forEach(function(t){
      var seq=(t%2===1)?['front','center','header']:['header','center','front'];
      seq.forEach(function(p){
        r.push({t:t,pos:p,depth:'reference'});
        if(cfg.bag===2) r.push({t:t,pos:p,depth:'mid-bag'});
      });
    });
    return r;
  }
  if(mode==='flush'){
    for(var q2=0;q2<60;q2++) r.push({t:'?',pos:'spot',depth:'reference',spot:true});
    return r;
  }
  if(mode==='spot'){
    for(var q=0;q<40;q++) r.push({t:'?',pos:'spot',depth:'reference',spot:true});
    return r;
  }
  var order=[]; for(var z=1;z<=cfg.t;z++) order.push(z);
  if(dir==='down') order.reverse();
  for(var oi=0;oi<order.length;oi++){ var t=order[oi];
    var seq=(t%2===1)?['front','center','header']:['header','center','front'];
    for(var p=0;p<3;p++){
      r.push({t:t,pos:seq[p],depth:'reference'});
      if(cfg.bag===2) r.push({t:t,pos:seq[p],depth:'mid-bag'});
    }
  }
  return r;
}
/* PREV merge: newest reading per position wins. Entries carry ts from v21;
   older ones only have d (M/D/YYYY), which is treated as midnight local. */
function prevTs(p){
  if(!p) return 0;
  if(p.ts) return p.ts;
  var m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(p.d||'');
  return m ? new Date(+m[3],+m[1]-1,+m[2]).getTime() : 0;
}
function mergePrev(mine, theirs){
  var out={}, added=0, updated=0, kept=0;
  Object.keys(mine).forEach(function(k){ out[k]=mine[k]; });
  Object.keys(theirs).forEach(function(k){
    var t=theirs[k]; if(!t||typeof t.v!=='number') return;
    if(!out[k]){ out[k]=t; added++; }
    else if(prevTs(t)>prevTs(out[k])){ out[k]=t; updated++; }
    else kept++;
  });
  return {merged:out, added:added, updated:updated, kept:kept};
}
function mergePrevText(mine, txt){
  var obj; try{ obj=JSON.parse(txt); }catch(e){ return {error:'not a position-history file'}; }
  var theirs=(obj&&obj.kind==='stab_prev')?obj.prev:obj;
  if(!theirs||typeof theirs!=='object'||Array.isArray(theirs)) return {error:'not a position-history file'};
  var keys=Object.keys(theirs);
  if(!keys.length || !/^[A-Z]\d\|/.test(keys[0])) return {error:'no position keys in that file'};
  return mergePrev(mine, theirs);
}
function med(a){ var x=a.slice().sort(function(p,q){return p-q;});
  if(!x.length) return null;
  return x.length%2 ? x[(x.length-1)/2] : (x[x.length/2-1]+x[x.length/2])/2; }
function csvq(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
function fmtDur(ms){
  var s=Math.max(0,Math.round(ms/1000));
  return Math.floor(s/60)+':'+('0'+(s%60)).slice(-2);
}

function rowNote(t){
  var c=S.notes[t]||'', f=(S.free&&S.free[t])||'';
  return c && f ? c+'. '+f : (c||f);
}

/* ============ WORKBOOK PASTE BLOCK ============
   Row notes in the format used in BB_fert_data, the notes-column
   paragraph, and a CHECK section generated from the data. */
function feelWord(v,bag){
  var b = bag===2
    ? [[18,'dry'],[22,'dry ok'],[26,'ok'],[30,'ok good'],[34,'good'],[38,'good solid'],[44,'solid'],[50,'solid heavy']]
    : [[22,'dry'],[26,'dry ok'],[30,'ok'],[34,'ok good'],[38,'good'],[43,'good solid'],[48,'solid'],[53,'solid heavy']];
  for(var i=0;i<b.length;i++) if(v<b[i][0]) return b[i][1];
  return 'heavy';
}
/* Row-note grammar (BB_fert_data): first word is the dominant feel; a slash
   adds the other end of the spread; "splotchy dry/solid" when the spread is
   two or more steps wide (driest first, heaviest last). */
var FEEL_ORDER=['dry','dry ok','ok','ok good','good','good solid','solid','solid heavy','heavy'];
function feelDesc(vals,bag){
  if(!vals.length) return '';
  var lo=feelWord(Math.min.apply(null,vals),bag), hi=feelWord(Math.max.apply(null,vals),bag);
  var dom=feelWord(med(vals),bag);
  if(lo===hi) return dom;
  var span=FEEL_ORDER.indexOf(hi)-FEEL_ORDER.indexOf(lo);
  if(span>=2) return 'splotchy '+lo+'/'+hi;
  return dom+'/'+(dom===lo?hi:lo);
}
function byTable(){
  var t={};
  S.rows.forEach(function(r){ (t[r.table]=t[r.table]||[]).push(r); });
  return t;
}
function tableMedians(tabs){
  var m={};
  Object.keys(tabs).forEach(function(t){
    var v=tabs[t].filter(function(r){return r.depth==='reference';}).map(function(r){return r.vwc;});
    if(v.length) m[t]=med(v);
  });
  return m;
}
function checkLines(){
  var out=[], tabs=byTable();
  /* spot and flush routes have no table structure; every rule below assumes one */
  if(S.mode==='spot'||S.mode==='flush') return [];
  var f=floorFor(S.room), feed=(S.feedEC!=null?S.feedEC:FEEDEC[S.room]);
  var tmeds=tableMedians(tabs), nTab=Object.keys(tmeds).length;
  var strainTabs={};
  Object.keys(tabs).forEach(function(t){
    var st=(tabs[t][0].strain||'').trim();
    if(st) (strainTabs[st]=strainTabs[st]||[]).push(t);
  });
  Object.keys(tabs).sort(function(a,b){return (+a)-(+b);}).forEach(function(t){
    var rr=tabs[t];
    var ref=rr.filter(function(r){return r.depth==='reference';});
    var mid=rr.filter(function(r){return r.depth==='mid-bag';});
    var rv=ref.map(function(r){return r.vwc;});
    if(!rv.length) return;
    var tm=med(rv), hrs=parseFloat(rr[0].hrs);

    /* inverted profile — only a fault soon after a shot */
    if(mid.length && !isNaN(hrs) && hrs<4){
      var mm=med(mid.map(function(r){return r.vwc;}));
      if(mm>tm+2) out.push('T'+t+'  mid '+mm.toFixed(0)+' above ref '+tm.toFixed(0)+
        ' at '+hrs.toFixed(1)+'h — sequence error or stalled wetting front');
    }
    /* dilution — EC well under what the room is being fed */
    if(feed>0){
      var ecs=ref.filter(function(r){return r.ec!=null;}).map(function(r){return r.ec;});
      if(ecs.length){
        var em=med(ecs);
        if(em < feed*0.6 && tm < f+8)
          out.push('T'+t+'  EC '+em.toFixed(1)+' vs '+feed.toFixed(1)+' feed, moisture '+
            tm.toFixed(0)+' — dilution, check the valve path');
      }
      var zero=ref.filter(function(r){return r.bulk!=null && r.bulk<0.12 && r.vwc<20;}).length;
      if(zero>=2) out.push({k:'nofeed', t:t, s:'T'+t+'  '+zero+' readings at near-zero EC with low moisture — no feed reaching these bags'});
    }
    /* table-level fault — collapsed to a room line below if it is everywhere */
    var below=rv.filter(function(v){return v<f;}).length;
    if(below>=Math.ceil(rv.length/2) && below>1)
      out.push({k:'floor', t:t, s:'T'+t+'  '+below+' of '+rv.length+' below floor — table-level fault'});
    /* outlier both directions — one vote per table, leave-one-out, three tables minimum.
       (v20 pooled every reading, so with two tables both were "outliers" from
       their own midpoint, and a table with extra stabs dragged the median.) */
    if(nTab>=3 && rv.length>=2){
      var others=Object.keys(tmeds).filter(function(x){return x!==t;}).map(function(x){return tmeds[x];});
      var roomMed=med(others);
      if(Math.abs(tm-roomMed)>=10)
        out.push('T'+t+'  median '+tm.toFixed(0)+' vs other tables '+roomMed.toFixed(0)+
          ' — '+(tm<roomMed?'dry':'wet')+' outlier');
    }
    /* one table of a strain deviating from its siblings */
    var st=(rr[0].strain||'').trim();
    if(st && strainTabs[st] && strainTabs[st].length>=3){
      var sibs=strainTabs[st].filter(function(x){return x!==t;})
        .map(function(x){ var v=tabs[x].filter(function(r){return r.depth==='reference';})
          .map(function(r){return r.vwc;}); return v.length?med(v):null; })
        .filter(function(x){return x!=null;});
      if(sibs.length>=2){
        var sm=med(sibs);
        if(Math.abs(tm-sm)>=8)
          out.push('T'+t+'  '+st+' at '+tm.toFixed(0)+' vs '+sm.toFixed(0)+
            ' on its other tables — '+(tm<sm?'delivery, not demand':'wet vs siblings — drainage or valve'));
      }
    }
  });
  /* A rule that fires on more than half the tables is describing the room,
     not a table. Collapse it so the genuine outliers stay visible. */
  var nT=nTab, byKind={}, keep=[];
  out.forEach(function(o){
    if(typeof o==='string'){ keep.push(o); return; }
    (byKind[o.k]=byKind[o.k]||[]).push(o);
  });
  Object.keys(byKind).forEach(function(k){
    var g=byKind[k];
    /* collapse needs a room's worth of tables — in triage or a sweep cut short,
       "1 of 1 tables below floor — this is the room" is the wrong conclusion */
    if(nT>=4 && g.length > nT/2){
      keep.unshift(k==='floor'
        ? 'ROOM  '+g.length+' of '+nT+' tables below floor — this is the room, not the tables'
        : 'ROOM  '+g.length+' of '+nT+' tables at near-zero EC — feed is not reaching this room');
    } else g.forEach(function(o){ keep.push(o.s); });
  });
  return keep;
}
function buildWorkbook(){
  if(!S.rows.length) return '';
  var cfg=ROOMS[S.room]||{bag:2}, bag=cfg.bag, f=floorFor(S.room);
  var tabs=byTable();
  var ref=S.rows.filter(function(r){return r.depth==='reference';});
  var rv=ref.map(function(r){return r.vwc;});
  var ecs=ref.filter(function(r){return r.ec!=null;}).map(function(r){return r.ec;});
  var lows=S.rows.filter(function(r){return r.flag;}).length;
  var tm=S.rows[0].time.slice(0,5), hrs=S.rows[0].hrs;
  var vol=(SCHED_ML&&SCHED_ML[S.room])||null;

  var prevMed=null;
  try{
    var ph=getHist().filter(function(x){return x.room===S.room && x.med!=null && (!x.mode || x.mode==='sweep');});
    if(ph.length) prevMed=ph[0].med;
  }catch(e){}
  var curMed=rv.length?med(rv):null;
  var delta=(prevMed!=null && curMed!=null)
    ? ', was '+prevMed.toFixed(1)+' ('+(curMed-prevMed>=0?'+':'')+(curMed-prevMed).toFixed(1)+')' : '';
  var head=S.room+' · DOF '+dofNow(S.room)+' · '+bag+' gal'+
    (vol?' · '+vol+' mL':'')+
    (hrs?' · '+hrs+'h':'')+
    ' · median '+(curMed==null?'--':curMed.toFixed(1))+delta+
    ' · '+lows+'/'+S.rows.length+' below floor'+
    (ecs.length?' · EC '+med(ecs).toFixed(1):'');

  var lines=[];
  Object.keys(tabs).sort(function(a,b){return (+a)-(+b);}).forEach(function(t){
    var rr=tabs[t];
    var rf=rr.filter(function(r){return r.depth==='reference';});
    var md=rr.filter(function(r){return r.depth==='mid-bag';});
    if(!rf.length) return;
    var vals=rf.map(function(r){return r.vwc;});
    var desc=feelDesc(vals,bag);
    var parts=rf.map(function(r){
      var p=r.vwc.toFixed(0)+(r.ec!=null?'/'+r.ec.toFixed(2):'');
      if(r.plant) p+=' '+r.plant;
      return p;
    });
    var line=tm+' '+desc+' '+parts.join(' · ');
    if(md.length) line+=' — mid '+md.map(function(r){return r.vwc.toFixed(0);}).join(' · ');
    var st=(rf[0].strain||'').trim(); if(st) line+=' '+st;
    var fl=rf[0].flags||'';
    if(fl.indexOf('U')>=0) line+=', underlights';
    if(fl.indexOf('T')>=0) line+=', saucer';
    var nt=rowNote(t); if(nt) line+='. '+nt;
    lines.push(line);
  });

  var para=tm+' '+(S.rows[0].depth&&S.rows.some(function(r){return r.depth==='mid-bag';})
      ?'reference + mid':'reference')+' sweep, '+S.side+' side, '+S.dir+
    ' direction, '+S.rows.length+' stabs'+(hrs?', '+hrs+' hrs since shot':'')+'. Room '+
    (rv.length?Math.min.apply(null,rv).toFixed(0)+'-'+Math.max.apply(null,rv).toFixed(0):'--')+
    ', median '+(curMed==null?'--':curMed.toFixed(1))+delta+', '+lows+' of '+S.rows.length+
    ' below the '+f+' floor.'+(ecs.length?' EC median '+med(ecs).toFixed(1)+
    ', range '+Math.min.apply(null,ecs).toFixed(2)+'-'+Math.max.apply(null,ecs).toFixed(2)+'.':'')+
    (S.feedEC?' Feed '+S.feedEC+(S.feedPH?'/'+S.feedPH:'')+'.':'')+' Operator '+S.op+'.';

  var chk=checkLines();
  return head+'\n\nROW NOTES  (paste down the Row Notes column, one per table)\n'+lines.join('\n')+
    '\n\nNOTES  (Notes column, spans rows)\n'+para+
    '\n\nCHECK\n'+(chk.length?chk.join('\n'):'nothing flagged');
}
/* ===================== END PURE ===================== */

module.exports={S,ROOMS,mergePrevText,prevTs,FLOOR,FEEDEC,floorFor,med,checkLines,buildWorkbook,feelWord,byTable,setHist:function(h){HIST=h;},hoursSinceShot,dofNow,buildRoute,poreEC,permCounts,vwcCounts,parseText,frameBytes,crc16,rxBytes};
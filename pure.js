/* pure.js — calibration, protocol, parsing, routes, workbook + CHECK.
   No DOM, no Bluetooth, no storage: everything here runs in node for tests.
   Storage is reached only through late-bound globals (getHist) that app.js
   defines before any call. */
/* ===================== PURE (testable, no DOM) ===================== */
var VER='v27';
function floorFor(rm){
  var c=ROOMS[rm]; if(!c) return 22;
  return (c.floor!=null)?c.floor:(FLOOR[c.bag]!=null?FLOOR[c.bag]:22);
}
var FLOOR={2:22, 1.25:30};
var PEGS=[
 ['posture',['praying','neutral','rolled shoulders','flagging']],
 ['color',['good','light','yellowing','purpling','interveinal']],
 ['damage',['tip burn','margin','windburn']],
 ['pests',['mites','thrips']],
 ['bud',['bleaching','foxtailing','herm']],
 ['blocked',['dripper','emitter','line','crew']]
];
/* Reasons a whole room is blocked. Room-wide crew goes here; the single
   unreachable table is the 'crew' chip in blocked above. */
var ACCESS=['spray REI','crew working','other'];
/* Why one table went unmeasured. Never fed to the CHECK rules. */
var SKIPWHY=['crew','dark','harvest','other'];
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
/* The same walk as hoursSinceShot, forwards: when the room next gets water.
   Used by the pre-walk brief (A §5) so the operator can see whether he is
   about to read a room just before or just after a shot. */
function hoursToNextShot(room, nowDate){
  var c=SCHED[room]; if(!c) return null;
  var now=nowDate||new Date(), p=c[0].split(':'), best=null;
  for(var d=0; d<=1; d++){
    var t0=new Date(now); t0.setDate(t0.getDate()+d);
    t0.setHours(+p[0],+p[1],0,0);
    for(var k=0;k<c[2];k++){
      var t=new Date(t0.getTime()+k*c[1]*60000);
      if(t>now && (best===null || t<best)) best=t;
    }
  }
  return best===null ? null : (best-now)/3600000;
}
function schedLine(room){
  var c=SCHED[room]; if(!c) return '';
  var p=c[0].split(':');
  return c[2]+' shot'+(c[2]>1?'s':'')+' from '+fmt12(+p[0],p[1])+', every '+(c[1]/60)+'h';
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
/* The snake's phase belongs to the WALK, not to the table number.
   v26 and earlier keyed it on table parity — odd tables front→header, even
   tables header→front — which is right walking up from T1 and wrong walking
   the other way: reversing the order reversed the tables but left every
   table starting at the same end it started at before, so on 9/9 the app
   asked for header while the operator stood at the front of T12. The
   operator always enters at the front end, so the first table of any walk
   starts at 'front' and it alternates from there. Walking up from T1 this
   is identical to the old mapping (walk index 0 is T1, odd walk indices are
   even tables); walking down it is the flip that was missing. The target
   picker reads the route, so it inherits this. */
function serpentine(walkIndex){
  return (walkIndex%2===0)?['front','center','header']:['header','center','front'];
}
function buildRoute(room, dir, mode){
  var cfg=ROOMS[room], r=[];
  if(mode==='triage'){
    var picks=(S.triage||[]).slice();
    if(!picks.length){ for(var z0=1;z0<=cfg.t;z0++) picks.push(z0); }
    if(dir==='down') picks.reverse();
    picks.forEach(function(t,pi){
      var seq=serpentine(pi);
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
    var seq=serpentine(oi);
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
/* ---- access blocks and per-table skips ----
   A table skipped for a re-entry interval or a blocked aisle is *unmeasured*,
   not bad. It must not fire a rule, must not sit in another table's
   leave-one-out median, and must not shrink the denominator the collapse
   test divides by — otherwise skipping four tables of eleven turns four
   ordinary table faults into a room-level verdict about a room that was
   never seen. */
function tableSkipped(t){ return !!(S.skipped && S.skipped[String(t)]); }
function skipReason(t){ return (S.skipped && S.skipped[String(t)]) || ''; }
function skippedList(){ return Object.keys(S.skipped||{}); }
/* A skip reason describes access, not data quality: it says the aisle was
   shut, not that the bag was misread. So a reading taken before the table
   was skipped is real and counts in every summary number. Only the CHECK
   rules drop skipped tables, because those reason about tables rather than
   readings and half a table is not evidence about a table. This also keeps
   the numbers stable as a partial table fills up — a table skipped on its
   last stop would otherwise drop five good readings out of the headline. */
/* 12-hour throughout — the workbook is 12-hour, the app used to emit 24h. */
function fmt12(h,m){
  var ap=h>=12?'PM':'AM', h12=h%12; if(h12===0) h12=12;
  return h12+':'+m+' '+ap;
}
/* Addendum A §2. A skipped table is unmeasured, so stabs taken on it before
   the aisle shut must not sit in the room median or the below-floor count,
   and every count states what it was computed over. v25 counted them on the
   grounds that a real reading is a real reading; 9/9 showed the cost — B-1
   swept three tables of eleven and its export read like a whole room. A
   partial sweep now says so everywhere it reports a number. */
function measuredRows(){
  return S.rows.filter(function(r){ return !tableSkipped(r.table); });
}
function coverage(){
  var cfg=ROOMS[S.room]||{t:0}, seen={};
  measuredRows().forEach(function(r){ if(r.table!=null && r.table!=='?') seen[String(r.table)]=1; });
  var sk=skippedList(), why=[];
  sk.forEach(function(t){ var w=skipReason(t); if(w && why.indexOf(w)<0) why.push(w); });
  return {swept:Object.keys(seen).length, total:cfg.t||0, skipped:sk.length, why:why};
}
function coverageLine(){
  var c=coverage();
  var s=c.swept+' of '+c.total+' tables swept';
  if(c.skipped) s+=' · '+c.skipped+' skipped'+(c.why.length?' ('+c.why.join(', ')+')':'');
  return s;
}
function sweepStamp(){
  if(S.rows.length && S.rows[0].time){
    var p=S.rows[0].time.split(':');
    return fmt12(+p[0],p[1]);
  }
  var d=new Date(S.startedAt||Date.now());
  return fmt12(d.getHours(),('0'+d.getMinutes()).slice(-2));
}
function checkLines(){
  var out=[];
  /* spot and flush routes have no table structure; every rule below assumes one */
  if(S.mode==='spot'||S.mode==='flush') return [];
  var all=byTable(), tabs={};
  Object.keys(all).forEach(function(t){ if(!tableSkipped(t)) tabs[t]=all[t]; });
  /* every table we tried to read: measured + skipped. A skipped table with no
     readings never reaches byTable, so count the skip list, not the rows. */
  var nSkip=skippedList().length;
  var f=floorFor(S.room), feed=(S.feedEC!=null?S.feedEC:FEEDEC[S.room]);
  var tmeds=tableMedians(tabs), nTab=Object.keys(tmeds).length;
  var nSeen=nTab+nSkip;
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
     not a table. Collapse it so the genuine outliers stay visible.
     The threshold divides by every table we tried to read (nSeen), never by
     the measured subset — half of what is left after skipping is not half a
     room. The guard still counts measured tables: a verdict about the room
     needs a room's worth of actual readings behind it. */
  var byKind={}, keep=[];
  out.forEach(function(o){
    if(typeof o==='string'){ keep.push(o); return; }
    (byKind[o.k]=byKind[o.k]||[]).push(o);
  });
  Object.keys(byKind).forEach(function(k){
    var g=byKind[k];
    if(nTab>=4 && g.length > nSeen/2){
      var scope=g.length+' of '+nTab+(nSkip?' measured ('+nSkip+' skipped)':'');
      keep.unshift(k==='floor'
        ? 'ROOM  '+scope+' tables below floor — this is the room, not the tables'
        : 'ROOM  '+scope+' tables at near-zero EC — feed is not reaching this room');
    } else g.forEach(function(o){ keep.push(o.s); });
  });
  return keep;
}
/* One line per table, in table order, T-prefixed. A skipped table keeps its
   line and states why, so the pasted column stays aligned with the workbook's
   own table rows instead of everything below it moving up one. */
function rowNoteLines(){
  var cfg=ROOMS[S.room]||{bag:2}, bag=cfg.bag;
  var tabs=byTable(), keys={};
  Object.keys(tabs).forEach(function(t){ keys[t]=1; });
  skippedList().forEach(function(t){ keys[t]=1; });
  var lines=[];
  Object.keys(keys).sort(function(a,b){return (+a)-(+b);}).forEach(function(t){
    if(tableSkipped(t)){ lines.push('T'+t+'  — '+skipReason(t)); return; }
    var rr=tabs[t]||[];
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
    var line='T'+t+'  '+desc+' '+parts.join(' · ');
    if(md.length) line+=' — mid '+md.map(function(r){return r.vwc.toFixed(0);}).join(' · ');
    var st=(rf[0].strain||'').trim(); if(st) line+=' '+st;
    var fl=rf[0].flags||'';
    if(fl.indexOf('U')>=0) line+=', underlights';
    if(fl.indexOf('T')>=0) line+=', saucer';
    var nt=rowNote(t); if(nt) line+='. '+nt;
    lines.push(line);
  });
  return lines;
}
/* Copy 1: the Row Notes column on its own. No summary, no CHECK, no header.
   The stamp sits inline before the first row's first word — on its own line
   it pushes every following row down one when pasted into the column. */
function buildRowNotes(){
  var lines=rowNoteLines();
  if(!lines.length) return '';
  lines=lines.slice();
  lines[0]=sweepStamp()+' '+lines[0];
  return lines.join('\n');
}
function roomHead(){
  var cfg=ROOMS[S.room]||{bag:2}, bag=cfg.bag;
  var msd=measuredRows();
  var ref=msd.filter(function(r){return r.depth==='reference';});
  var rv=ref.map(function(r){return r.vwc;});
  var ecs=ref.filter(function(r){return r.ec!=null;}).map(function(r){return r.ec;});
  var lows=msd.filter(function(r){return r.flag;}).length;
  var hrs=S.rows.length?S.rows[0].hrs:'';
  var vol=(SCHED_ML&&SCHED_ML[S.room])||null;
  var nSkip=skippedList().length;
  var prevMed=null;
  try{
    var ph=getHist().filter(function(x){return x.room===S.room && x.med!=null && (!x.mode || x.mode==='sweep');});
    if(ph.length) prevMed=ph[0].med;
  }catch(e){}
  var curMed=rv.length?med(rv):null;
  var delta=(prevMed!=null && curMed!=null)
    ? ', was '+prevMed.toFixed(1)+' ('+(curMed-prevMed>=0?'+':'')+(curMed-prevMed).toFixed(1)+')' : '';
  var dof=dofNow(S.room);
  return S.room+' · DOF '+(dof===''?'—':dof)+' · '+bag+' gal'+
    (vol?' · '+vol+' mL':'')+
    (hrs?' · '+hrs+'h':'')+
    ' · median '+(curMed==null?'--':curMed.toFixed(1))+delta+
    ' · '+lows+'/'+msd.length+' below floor'+
    (ecs.length?' · EC '+med(ecs).toFixed(1):'')+
    ' · '+coverageLine();
}
function roomPara(){
  var cfg=ROOMS[S.room]||{bag:2}, bag=cfg.bag, f=floorFor(S.room);
  var msd=measuredRows();
  var ref=msd.filter(function(r){return r.depth==='reference';});
  var rv=ref.map(function(r){return r.vwc;});
  var ecs=ref.filter(function(r){return r.ec!=null;}).map(function(r){return r.ec;});
  var lows=msd.filter(function(r){return r.flag;}).length;
  var tm=sweepStamp(), hrs=S.rows.length?S.rows[0].hrs:'';
  var prevMed=null;
  try{
    var ph=getHist().filter(function(x){return x.room===S.room && x.med!=null && (!x.mode || x.mode==='sweep');});
    if(ph.length) prevMed=ph[0].med;
  }catch(e){}
  var curMed=rv.length?med(rv):null;
  var delta=(prevMed!=null && curMed!=null)
    ? ', was '+prevMed.toFixed(1)+' ('+(curMed-prevMed>=0?'+':'')+(curMed-prevMed).toFixed(1)+')' : '';
  var para=tm+' '+(S.rows.length && S.rows.some(function(r){return r.depth==='mid-bag';})
      ?'reference + mid':'reference')+' sweep, '+S.side+' side, '+S.dir+
    ' direction, '+msd.length+' stabs'+(hrs?', '+hrs+' hrs since shot':'')+'. '+
    coverageLine()+'. Room '+
    (rv.length?Math.min.apply(null,rv).toFixed(0)+'-'+Math.max.apply(null,rv).toFixed(0):'--')+
    ', median '+(curMed==null?'--':curMed.toFixed(1))+delta+', '+lows+' of '+msd.length+
    ' below the '+f+' floor.'+(ecs.length?' EC median '+med(ecs).toFixed(1)+
    ', range '+Math.min.apply(null,ecs).toFixed(2)+'-'+Math.max.apply(null,ecs).toFixed(2)+'.':'');
  /* room-level access block, set on the setup screen before Start */
  if(S.access && S.access.reason){
    para+=' Room access: '+S.access.reason+
      (S.access.note?' — '+S.access.note:'')+'.';
  }
  var sk=skippedList().sort(function(a,b){return (+a)-(+b);});
  if(sk.length){
    var partial=sk.some(function(t){ return S.rows.some(function(r){ return String(r.table)===String(t); }); });
    para+=' Skipped '+sk.map(function(t){return 'T'+t+' ('+skipReason(t)+')';}).join(', ')+
      ' — outside the CHECK rules and outside every count above'+
      (partial?'; the stabs taken there are in the CSV':'')+'.';
  }
  para+=(S.feedEC?' Feed '+S.feedEC+(S.feedPH?'/'+S.feedPH:'')+'.':'')+' Operator '+S.op+'.';
  return para;
}
/* Copy 2: the Notes column. Addendum A §3 — the app writes NOTHING here by
   default. Every number it used to paste (DOF, bag, volume, hours since
   shot, median, below-floor count) already exists in the workbook, computed
   from the operator's own formulas, and there are only 11-12 note cells per
   room shared with a second operator, used for flush times and saucer
   pickups. A cell that says "CHECK / nothing flagged" costs a cell and says
   nothing, so those words are never written.
   What survives is an exception a person has to act on: a dead bag, or a
   table that read nothing when its neighbours did. The analysis lives in
   the CSV and on the done screen, which is where it belongs. */
var ROOMNOTE_MAX=4;
function roomNoteExceptions(){
  var out=[];
  var dead=S.rows.filter(function(r){ return r.zeroEc; });
  if(dead.length){
    out.push('dead bag'+(dead.length>1?'s':'')+' '+dead.map(function(r){
      return 'T'+r.table+' '+r.position; }).join(', ')+' — zero EC, no feed reaching '+
      (dead.length>1?'them':'it'));
  }
  /* a table that read nothing when its neighbours did: every one of its
     reference stabs at near-zero EC, while some other measured table read
     normally. One dry table among dry tables is the room, not the table —
     that is a CSV question, not a note-cell one. */
  var tabs=byTable(), starved=[], fed=0;
  Object.keys(tabs).sort(function(a,b){return (+a)-(+b);}).forEach(function(t){
    if(tableSkipped(t)) return;
    var ref=tabs[t].filter(function(r){ return r.depth==='reference'; });
    if(!ref.length) return;
    var zero=ref.filter(function(r){ return r.bulk!=null && r.bulk<0.12 && r.vwc<20; }).length;
    if(zero===ref.length && ref.length>=2) starved.push(t); else fed++;
  });
  if(fed>0 && starved.length){
    out.push(starved.length>2
      ? 'no feed reaching T'+starved.join(', T')+' — check the room valve'
      : starved.map(function(t){ return 'T'+t+' read nothing while its neighbours fed — check the valve path'; }).join('\n'));
  }
  return out.join('\n').split('\n').filter(Boolean).slice(0,ROOMNOTE_MAX);
}
function buildRoomNotes(){
  var ex=roomNoteExceptions();
  if(!ex.length) return '';
  ex=ex.slice();
  ex[0]=sweepStamp()+' '+ex[0];
  return ex.join('\n');
}
/* Combined block, kept for the session history so an old sweep still reads
   as one document. The two copy buttons use the halves above. */
function buildWorkbook(){
  if(!S.rows.length) return '';
  var chk=checkLines();
  return roomHead()+'\n\nROW NOTES  (paste down the Row Notes column, one per table)\n'+
    rowNoteLines().join('\n')+
    '\n\nNOTES  (Notes column, spans rows)\n'+roomPara()+
    '\n\nCHECK\n'+(chk.length?chk.join('\n'):'nothing flagged');
}
/* ===================== END PURE ===================== */

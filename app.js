
'use strict';
/* =====================================================================
   STAB v25 — 9/7/2026  (two paste blocks · peg chips · access · skips)
   Written from the diff after test/test.sh ran green, notes.js included.
   - The workbook block is two copies now, not one split by thumb on the
     phone: buildRowNotes() is the Row Notes column alone, T-prefixed one
     line per table; buildRoomNotes() is summary, paragraph and CHECK. Both
     open with the sweep timestamp. buildWorkbook() still returns the
     combined document and is what history stores, alongside both halves.
   - Peg chips reworked: bud group (bleaching, foxtailing, herm) split out
     of damage; wilted, drooping, fading and necrosis retired. Values kept
     in old sessions are not dropped — openPegs shows any selected value
     that is no longer a chip under 'from an earlier sweep', so it stays
     visible and removable instead of persisting invisibly forever.
   - Voice readout deleted outright: say(), S.speech, PREF.voice, the
     toggle and its CSS. The dictate button is gone too; the keyboard mic
     key still dictates into the same box. The fault log's own 'drooping'
     and 'wilted' chips are a different list and are untouched.
   - Room access block: a sheet on the setup bar beside log and EOD.
     Tapping Start commits it; the sweep runs normally. It surfaces in the
     room-notes paragraph only.
   - Skip now asks why, then how far: a reason almost always applies to the
     whole table, so it offers 'skip the rest of T7 · 5 stops' as one tap.
     The reason is recorded against the table and printed as 'T7  — spray REI'.
   - THE CAREFUL PART. Access reasons never reach the CHECK rules. A
     skipped table is dropped from the rule set entirely, so it cannot fire
     a rule, cannot be an outlier, and cannot sit in another table's
     leave-one-out median. But the collapse threshold still divides by
     every table we tried to read (measured + skipped), because dividing by
     the measured subset is what turns five ordinary table faults in a
     half-skipped room into a room-level verdict about a room nobody saw.
     The >=4 guard still counts measured tables: a claim about the room
     needs a room's worth of real readings behind it.
     The summary counts are the other way round: they count every stab that
     happened, including readings taken on a table before it was skipped. A
     skip reason describes access, not data quality — it says the aisle shut,
     not that the bag was misread — so a real reading still belongs in the
     headline. Dropping them also degraded badly as a partial table filled
     up: a table skipped on its last stop would have lost five good readings
     out of the below-floor count. The head still marks the skip, and the
     paragraph names which tables were skipped and that stabs taken there
     still count.

   STAB v24 — 9/7/2026  (BENCH test fixture room)
   Written from the diff after test/test.sh ran green, bench.js included.
   - rooms.js gains BENCH: 4 tables, 2 gal, peat mix, kind:'test'. It is
     deliberately absent from SCHED, DOF, SCHED_ML, FEEDEC and RMAP — the
     point is that every lookup over those tolerates a missing room.
     dofNow and hoursSinceShot already returned '' and null; floorFor falls
     back to the 2-gal floor and the dilution rule skips on feed>0 being
     false for undefined. Nothing needed a fake zero.
   - DOF now prints as an em dash instead of a blank when unknown, in the
     workbook head and the sweep header.
   - kind was already an established marker (the not-seen list, the triage
     guard and the flush plan all filtered on it) with no room setting it.
     Extended to the weekly coverage line, whose room total is now counted
     rather than hardcoded to 19, and to the EOD swept list.
   - Room grid: fixtures are pulled out of the wings — BENCH starts with B
     and would have landed in B WING — into a NOT A ROOM row, dashed amber,
     sub-label 'BENCH · test', no coverage bar.
   - test/bench.js covers the boot, a 4-stab sweep with no NaN or undefined
     in the workbook or CSV, and the three exclusions. smoke.js now counts
     production rooms and fixtures separately instead of asserting 19.

   STAB v23 — 9/6/2026  (Bluefy screen dim + background state)
   Written from the diff after test/test.sh ran green, bluefy.js included.
   - Bluefy-only APIs, both feature-detected so Safari and jsdom no-op:
     navigator.bluetooth.setScreenDimEnabled(bool) and the
     'backgroundstatechanged' event. See the BF block by the wake lock.
   - The screen is held bright from keepAwake() and given back from
     releaseAwake(), so both sweep entry points and END are covered by the
     two calls already there. discard, 'more' and the log sheet's
     close-and-reload call releaseAwake() before location.reload(), and a
     pagehide handler is the net for every other way out — an abandoned
     sweep must not leave the phone awake.
   - backgroundstatechanged saves the session on the way out instead of
     waiting for the next reading, and on the way back the step line says
     how long we were gone and whether the GATT link survived.
     Bluefy does not document the event payload, so bfInBackground() reads
     the plausible carriers and falls back to document.visibilityState.
   - test/bluefy.js stubs navigator.bluetooth and drives all of the above,
     including a build that has the event but no setScreenDimEnabled.

   STAB v22 — 9/4/2026  (refactor, no new features)
   Written from the diff after test/test.sh + extra.js ran green.
   - Split into index.html / rooms.js / pure.js / app.js. Script order is
     rooms -> pure -> app. Per-release version strings to bump: <title>,
     .brand, .v div, VER in pure.js, and the three ?v= src tags.
   - Weekly data (SCHED_ML, ROOMS, RMAP, SCHED, FEEDEC, DOF, DOF_REF, MTASK)
     lives in rooms.js with ROOMDATA_ASOF; setup screen shows the date and
     warns in amber past seven days.
   - Workbook builder, CHECK rules and rowNote moved into pure.js.
   - S9: only mode==='sweep' history counts as the "was X" delta baseline.
   - Demo banner fixed across the top of every screen (#demoband), on the
     moment demo is toggled; body.demo shifts flow content down 34px.
   - Garden mode deleted: GARDEN room, GARDEN_DEFAULT, PEGS_GARDEN,
     gardenGroup, gardenPlantCount, isGarden, cropOf, CROPS, the button, and
     every branch in buildRoute/drawRoute/render/doCommit/openPegs/hdrInfo/
     demo sim. The mineral-soil calibration (vwcMineral, MINERAL_MEDIA,
     OFFSET_BY_MEDIA) is kept: it is sensor doctrine with a METER source,
     not garden code, and will be needed when the garden gets its own app.
   - Storage: stab_session is one key {v:22,s,rows}; v21's second key
     stab_rows is read on resume and removed on clear. stab_hist and
     stab_events are {v:1,items:[]} and read bare arrays as v0. stab_prev
     carries _v:1 ('_'-prefixed keys are never positions). stab_crops
     added to the clear-data list. stab_qt was already gone in v21.
   - <title> now matches VER (v21 shipped saying v20).
   Net -96 lines; functions removed: cropOf gardenGroup gardenPlantCount
   isGarden; added: syncDemo.

   STAB v21 — 9/3/2026 (audit build)
   Fixes: resume now restores free text, feed EC/pH, triage picks, skip and
   unstable counts · room picker shows the saved bag size · a room can be set
   to water (feed EC 0) from the room-setup box · CHECK rules: no ROOM
   collapse under 4 tables, outlier rule needs 3 tables and votes one median
   per table, wet vs dry wording on the strain rule, spot/flush modes skip
   CHECK · row-note feel words: dominant first, "splotchy" for wide spread ·
   history write survives a full localStorage (drops old CSV text first) ·
   faults and bulbs can be marked fixed · implausible-reading flag (>62% on a
   2-gal bag, <6% anywhere) that v19 announced but never shipped · auto
   capture: air threshold 5%, poll 0.8 s, stability judged on bulk EC (the
   pore-EC gate stalled 15-20% bags for 10 s) · CSV appends Settle n,
   Unstable, Implausible · PREV export/import with merge by timestamp ·
   mic test button (voice notes are not implemented — see audit).
   NOT in this build despite the v19 note below: audio voice notes.

   STAB v20 — 9/2/2026
   New: bag size and feed EC/pH asked at room start and remembered per room,
   so the dilution CHECK rule uses what was measured rather than a constant ·
   flush plan with the real manual-task durations · feed EC/pH carried into
   every row and the notes paragraph.

   STAB v19 — 9/2/2026
   New: triage and speed modes · flush mode with per-pass runoff capture ·
   log-a-shot · fault log and bulb log with Teams-format output · implausible
   reading prompt · delta against last sweep · room history on the picker ·
   voice note per table · end-of-day roll-up. History 60 sessions, PREV kept
   permanently.

   STAB v18 — 9/1/2026
   New: workbook paste block with CHECK rules · peg sheet restructured
   (posture/color/damage/pests/blocked + free text) · tap a table in the
   route strip to reopen its notes · discard sweep · retry counter · feed
   EC per room · faster peg reset · garden mode retired.

   STAB v17 — clean rewrite, 8/30/2026
   Fixes from the 8/30 audit: S1 resume/recovery · S2 tap-to-reconnect ·
   S3 request/response correlation (direct frames only, post-write) ·
   S4 hardcoded verified trigger, hunt as fallback · S5 finish clears
   in-flight state · S6 redo restores extra stops · S7 loud connect
   failures, deca-scoped fallbacks · S8 CSV quote escaping · S9 undo
   rolls back "last here" · S10 hygiene.
   New: acked writes + frame reassembly (CRC-verified RX) · auto
   capture (stab-to-log) with stability detection + beeps · long-press
   CAL mode with per-media Hilhorst offsets · battery pill (30/15%) ·
   wake lock + video fallback · coverage board · operator column ·
   navigator.share · debug ring.
   CSV: original 22 columns unchanged, appended: Operator, Frame,
   Batt, Lat ms.
   ===================================================================== */

/* app.js — BLE, capture state machine, UI, storage. */
/* Demo must be unmistakable on every screen — the operator once hesitated
   to tap around for fear of polluting real data, which means the old
   indicator was not doing its job. */
function syncDemo(){
  var b=document.getElementById('demoband');
  if(b) b.classList.toggle('hide',!DEMO);
  document.body.classList.toggle('demo',DEMO);
}


/* ===================== DOM / APP ===================== */
var WB_TEXT='', ROW_TEXT='', ROOM_TEXT='';
var $=function(id){ return document.getElementById(id); };
function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }

var S={room:null, side:'standard', dir:'up', mode:'sweep', auto:true,
  op:'APG', notes:{}, route:[], i:0, rows:[], last:null, lastAt:0,
  dev:null, chr:null, svc:null, wchr:null, batC:null, batt:null,
  trigger:null, verifying:false, connecting:false, everConn:false,
  awaiting:false, tries:0, rt:null, tWrite:0, lastLat:null, lastPoll:0,
  pegsOpen:false, cal:false, finished:false, roomStarted:false,
  redo:[], logOpen:false, triage:[], feedEC:null, feedPH:null, skips:0, unstable:0, startedAt:0, copied:false, shared:false, free:{},
  skipped:{}, access:null, alarmQueue:[], huntFails:0, shotMidSweep:false,
  flaggedTable:false, reconnB:false};
var A={state:'air', buf:[], lastAir:null, t0:0};
var CAL={stage:'live', frozen:null, released:false};
var DBG={pkts:0, polls:0, directs:0, statusFrames:0, writeFails:0, timeouts:0, unparsed:[]};
var WAIT=[];

var PREV={};
try{ PREV=JSON.parse(localStorage.getItem('stab_prev')||'{}'); }catch(e){ PREV={}; }
if(!PREV._v) PREV._v=1;   /* schema marker; '_'-prefixed keys are not positions */
var PREF={side:'standard',dir:null,mode:'sweep',cap:'auto',lastDir:null};
try{ var _p=JSON.parse(localStorage.getItem('stab_setup')||'null'); if(_p) PREF=Object.assign(PREF,_p); }catch(e){}
try{ var _o=localStorage.getItem('stab_op'); if(_o) S.op=_o; }catch(e){}

function lsSet(k,v){
  try{ localStorage.setItem(k,v); return true; }
  catch(e){
    toast('storage full — CSV export still works');
    return false;
  }
}
/* History is the only store that can realistically fill localStorage (60
   sessions × full CSV). On a quota failure, drop the CSV text from the oldest
   entries first (the picker, deltas and EOD only need med/n/when), then cap. */
function saveHist(h){
  h=h.slice(0,60);
  function W(items){ return JSON.stringify({v:1,items:items}); }
  if(lsSet('stab_hist',W(h))) return true;
  var slim=h.map(function(x,i){ if(i<20) return x; var y={}; Object.keys(x).forEach(function(k){ if(k!=='csv'&&k!=='wb'&&k!=='wbrow'&&k!=='wbroom') y[k]=x[k]; }); return y; });
  if(lsSet('stab_hist',W(slim))){ toast('storage tight — old CSV text dropped from history'); return true; }
  if(lsSet('stab_hist',W(slim.slice(0,20)))){ toast('storage tight — history cut to 20'); return true; }
  return false;
}
function saveSession(){
  if(DEMO) return;
  lsSet('stab_session',JSON.stringify({v:22,
    s:{room:S.room,side:S.side,dir:S.dir,mode:S.mode,op:S.op,i:S.i,
       notes:S.notes,free:S.free||{},route:S.route,startedAt:S.startedAt,
       feedEC:S.feedEC,feedPH:S.feedPH,triage:S.triage||[],
       skips:S.skips||0,unstable:S.unstable||0,
       skipped:S.skipped||{},access:S.access||null},
    rows:S.rows}));
  /* v21 kept rows in a second key; one write, one read, one thing to clear */
}
function clearSession(){
  try{ localStorage.removeItem('stab_session'); localStorage.removeItem('stab_rows'); }catch(e){}
}
function savePrefs(){
  lsSet('stab_setup',JSON.stringify({side:S.side,dir:S.dir,mode:S.mode,
    cap:S.auto?'auto':'manual',lastDir:PREF.lastDir}));
  lsSet('stab_op',S.op);
}

/* ---------------- audio ---------------- */
var AC=null;
function audio(){
  if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC && AC.state==='suspended'){ try{ AC.resume(); }catch(e){} }
  return AC;
}
var TONES={ok:[[880,80]], warn:[[660,80],[660,80]], floor:[[440,90],[440,90],[440,90]],
  out:[[660,70],[330,150]], tick:[[1320,35]], tableDone:[[523,70],[659,70],[784,120]],
  sweepDone:[[523,80],[659,80],[784,80],[1047,180]], cal:[[988,70],[1319,80]],
  battLow:[[494,120],[392,120],[330,220]], drop:[[330,170],[262,220]],
  /* zero-EC alarm (1.4): lower and longer than 'out' so it does not read as
     just another outlier beep — rooms are loud, so this costs nothing to add
     even though the operator is told not to rely on it. */
  alarm:[[220,220],[196,220],[220,220],[196,320]]};
function beep(name){
  var a=audio(); if(!a) return;
  var t=a.currentTime+0.01, seq=TONES[name]||[];
  for(var i=0;i<seq.length;i++){
    var o=a.createOscillator(), g=a.createGain();
    o.type='triangle'; o.frequency.value=seq[i][0];
    var dur=seq[i][1]/1000, peak=(name==='tick')?0.08:0.3;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(peak,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t+dur+0.03);
    t+=dur+0.07;
  }
}

/* ---------------- wake lock ---------------- */
var WL={lock:null, vid:null, advised:false};
function wlAcquire(){
  if(!('wakeLock' in navigator)) return Promise.resolve(false);
  return navigator.wakeLock.request('screen').then(function(l){
    WL.lock=l; return true;
  }).catch(function(){ return false; });
}
function makeKeepAwakeVideo(){
  return new Promise(function(res){
    try{
      if(typeof MediaRecorder==='undefined'){ res(null); return; }
      var cv=document.createElement('canvas'); cv.width=64; cv.height=64;
      var cx=cv.getContext('2d');
      var stream=cv.captureStream(5);
      var mime=MediaRecorder.isTypeSupported('video/mp4')?'video/mp4':
        (MediaRecorder.isTypeSupported('video/webm')?'video/webm':'');
      if(!mime){ res(null); return; }
      var rec=new MediaRecorder(stream,{mimeType:mime}), chunks=[];
      rec.ondataavailable=function(e){ if(e.data && e.data.size) chunks.push(e.data); };
      rec.onstop=function(){ res(chunks.length?new Blob(chunks,{type:mime}):null); };
      rec.start();
      var t0=Date.now();
      (function draw(){
        cx.fillStyle=((Date.now()>>7)&1)?'#000':'#010101';
        cx.fillRect(0,0,64,64);
        if(Date.now()-t0<700) requestAnimationFrame(draw); else { try{rec.stop();}catch(e){res(null);} }
      })();
      setTimeout(function(){ try{ if(rec.state!=='inactive') rec.stop(); }catch(e){} },2500);
    }catch(e){ res(null); }
  });
}
function wlAdvise(){
  if(WL.advised) return;
  WL.advised=true;
  var seen=false; try{ seen=!!localStorage.getItem('stab_wlt'); }catch(e){}
  if(!seen){
    try{ localStorage.setItem('stab_wlt','1'); }catch(e){}
    toast('screen may auto-lock — set Auto-Lock to Never for sweeps');
  }
}
function keepAwake(){
  bfDim(false);
  wlAcquire().then(function(ok){
    if(ok) return;
    if(WL.vid){ WL.vid.play().catch(function(){}); return; }
    makeKeepAwakeVideo().then(function(blob){
      if(!blob){ wlAdvise(); return; }
      var v=document.createElement('video');
      v.muted=true; v.loop=true; v.playsInline=true; v.setAttribute('playsinline','');
      v.style.cssText='position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
      v.src=URL.createObjectURL(blob);
      document.body.appendChild(v); WL.vid=v;
      v.play().catch(function(){ wlAdvise(); });
    });
  });
}
function releaseAwake(){
  if(WL.lock){ try{ WL.lock.release(); }catch(e){} WL.lock=null; }
  if(WL.vid){ try{ WL.vid.pause(); }catch(e){} }
  bfDim(true);
}

/* ---------------- Bluefy: screen dim + background state ----------------
   Bluefy exposes two things Safari does not: navigator.bluetooth
   .setScreenDimEnabled(bool), and a 'backgroundstatechanged' event on
   navigator.bluetooth. Everything here is feature-detected — in Safari and
   in jsdom navigator.bluetooth is either absent or lacks these, and every
   function below turns into a no-op returning false. */
var BF={listening:false, bgAt:0, wasConn:false};
function bfCan(m){
  try{ return !!(navigator.bluetooth && typeof navigator.bluetooth[m]==='function'); }
  catch(e){ return false; }
}
/* dim(true) = let the phone dim normally. dim(false) = hold it bright. */
function bfDim(on){
  if(!bfCan('setScreenDimEnabled')) return false;
  try{ navigator.bluetooth.setScreenDimEnabled(!!on); return true; }
  catch(e){ return false; }
}
/* Bluefy does not document the event payload, so read the obvious carriers
   and fall back to the document's own visibility, which is always right. */
function bfInBackground(e){
  if(e && typeof e.background==='boolean') return e.background;
  if(e && typeof e.isBackground==='boolean') return e.isBackground;
  if(e && typeof e.state==='string') return e.state==='background';
  try{ if(navigator.bluetooth && typeof navigator.bluetooth.backgroundState==='string')
         return navigator.bluetooth.backgroundState==='background'; }catch(e2){}
  return document.visibilityState!=='visible';
}
function onBackgroundState(e){
  var sweeping=S.roomStarted && !S.finished;
  if(bfInBackground(e)){
    /* Don't wait for the next reading — iOS can kill us while backgrounded. */
    BF.bgAt=Date.now(); BF.wasConn=isConn();
    if(sweeping) saveSession();
    return;
  }
  if(!sweeping) return;
  var secs=BF.bgAt?Math.round((Date.now()-BF.bgAt)/1000):0;
  var away=secs<60?(secs+'s'):(Math.round(secs/60)+'m');
  bfDim(false);                       /* backgrounding drops the hold */
  if(!BF.wasConn) step('back after '+away+' — probe was not connected');
  else if(isConn()) step('back after '+away+' — probe still connected');
  else step('back after '+away+' — probe dropped while backgrounded, reconnecting');
}
function bfListen(){
  if(BF.listening) return false;
  try{
    if(!navigator.bluetooth || typeof navigator.bluetooth.addEventListener!=='function') return false;
    navigator.bluetooth.addEventListener('backgroundstatechanged',onBackgroundState);
    BF.listening=true; return true;
  }catch(e){ return false; }
}
bfListen();

/* ---------------- history / coverage helpers ---------------- */
function getHist(){
  try{
    var h=JSON.parse(localStorage.getItem('stab_hist')||'[]');
    if(Array.isArray(h)) return h;          /* v0, pre-9/3 */
    return (h && h.v===1 && Array.isArray(h.items)) ? h.items : [];
  }catch(e){ return []; }
}
function histTs(h){
  if(h.ts) return h.ts;
  var t=Date.parse(h.when||''); return isNaN(t)?0:t;
}

/* ---------------- setup screen ---------------- */
(function buildSetup(){
  /* operator chips */
  var ops=['APG','EGY'];
  if(S.op && ops.indexOf(S.op)<0) ops.push(S.op);
  var ob=$('ops'), html='';
  ops.forEach(function(o){ html+='<button class="opc'+(o===S.op?' on':'')+'" data-op="'+o+'">'+o+'</button>'; });
  html+='<button class="opc" data-op="+">+</button>';
  ob.innerHTML=html;
  ob.addEventListener('click',function(e){
    var b=e.target.closest('.opc'); if(!b) return;
    var v=b.dataset.op;
    if(v==='+'){
      var x=prompt('Initials (2–3 letters):','');
      if(!x) return;
      v=x.trim().toUpperCase().slice(0,3);
      if(!v) return;
    }
    S.op=v; savePrefs();
    buildOps();
  });
  function buildOps(){
    var ops2=['APG','EGY'];
    if(S.op && ops2.indexOf(S.op)<0) ops2.push(S.op);
    var h2='';
    ops2.forEach(function(o){ h2+='<button class="opc'+(o===S.op?' on':'')+'" data-op="'+o+'">'+o+'</button>'; });
    h2+='<button class="opc" data-op="+">+</button>';
    ob.innerHTML=h2;
  }

  /* saved bag sizes / feed EC must be applied before the grid draws them */
  loadRoomCfgAll();
  /* coverage from history */
  var hist=getHist(), latest={}, now=Date.now();
  hist.forEach(function(h){
    if(h.mode && h.mode!=='sweep') return;
    var t=histTs(h); if(!t) return;
    if(!latest[h.room] || t>latest[h.room]) latest[h.room]=t;
  });
  /* weekly line */
  var wkRooms={}, wkN=0;
  hist.forEach(function(h){
    if(ROOMS[h.room] && ROOMS[h.room].kind) return;   /* bench work is not coverage */
    var t=histTs(h);
    if(t && now-t<7*86400000){
      if(!h.mode || h.mode==='sweep') wkRooms[h.room]=1;
      wkN+=h.n||0;
    }
  });
  var wr=Object.keys(wkRooms).length;
  var nRooms=Object.keys(ROOMS).filter(function(k){return !ROOMS[k].kind;}).length;
  $('weekly').textContent=wr?('this week '+wr+'/'+nRooms+' rooms · '+wkN+' stabs'):'no sweeps logged this week';

  /* rooms grid. A test fixture (ROOMS[k].kind) belongs to no wing and gets
     its own labelled row with the kind spelled out in the sub-label, so it
     cannot be grabbed by accident partway through a shift. */
  var wings=['A','B','C'], box=$('rooms');
  function roomBtn(k){
    var cfg=ROOMS[k];
    var b=document.createElement('button');
    b.className='rm'+(cfg.kind?' test':''); b.dataset.room=k;
    var days=latest[k]?Math.floor((now-latest[k])/86400000):null;
    var age=(days===null)?'—':(days===0?'today':days+'d');
    /* A §5: swept-today and swept-three-days-ago both read green, so a room
       already done this morning looked the same as one due. Today gets its
       own badge — a mark reads faster than a shade while walking. */
    var cls=(days===null)?'':(days===0?'t':(days<=3?'g':(days<=7?'a':'r')));
    /* no coverage bar on a fixture — it is not on anybody's rotation */
    var sub=cfg.kind?(k+' · '+cfg.kind):(cfg.bag+' gal · '+age);
    b.innerHTML=k+(days===0&&!cfg.kind?'<span class="tb">today</span>':'')+
      '<span class="sub">'+sub+'</span>'+
      '<span class="cov '+(cfg.kind?'':cls)+'"></span>';
    return b;
  }
  function roomSection(label,keys){
    if(!keys.length) return;
    var lab=document.createElement('div'); lab.className='wl';
    lab.textContent=label; box.appendChild(lab);
    var d=document.createElement('div'); d.className='wing';
    keys.forEach(function(k){ d.appendChild(roomBtn(k)); });
    box.appendChild(d);
  }
  wings.forEach(function(w){
    roomSection(w+' WING', Object.keys(ROOMS).filter(function(k){
      return k[0]===w && !ROOMS[k].kind; }));
  });
  roomSection('NOT A ROOM', Object.keys(ROOMS).filter(function(k){
    return !!ROOMS[k].kind; }));
  box.addEventListener('click',function(e){
    var b=e.target.closest('.rm'); if(!b) return;
    [].forEach.call(box.querySelectorAll('.rm'),function(x){x.classList.remove('on');});
    b.classList.add('on'); S.room=b.dataset.room;
    S.triage=[];
    S.access=null; syncAccessBtn();   /* access is per room */
    $('startbtn').textContent='Start '+S.room;
    $('startbar').classList.add('up');
    syncModeUI();
    showRoomHistory();
    showBrief();
    showRoomCfg();
  });

  /* side / dir / mode / capture */
  S.side=PREF.side||'standard';
  /* A §5: T1 first, always. v25 auto-alternated off the last sweep's
     direction to cancel directional bias, which meant the app opened on
     "last table first" most mornings — a default the operator has to undo
     rather than one he asked for. The toggle still alternates on request
     and Dir is still in the CSV, so the bias question stays testable. */
  S.dir=PREF.dir||'up';
  S.mode=PREF.mode||'sweep';
  if(PREF.showHist===undefined) PREF.showHist=true;
  S.auto=(PREF.cap!=='manual');
  function mark(cls,val,attr){
    [].forEach.call(document.querySelectorAll('.'+cls),function(x){
      x.classList.toggle('on',x.dataset[attr]===val);
    });
  }
  mark('side',S.side,'side'); mark('dir',S.dir,'dir');
  mark('mode',S.mode,'mode'); syncModeUI(); mark('cap',S.auto?'auto':'manual','cap');

  $('setup').addEventListener('click',function(e){
    var b=e.target.closest('.side,.dir,.mode,.cap'); if(!b) return;
    var cls=b.classList.contains('side')?'side':
            b.classList.contains('dir')?'dir':
            b.classList.contains('mode')?'mode':'cap';
    [].forEach.call(document.querySelectorAll('.'+cls),function(x){x.classList.remove('on');});
    b.classList.add('on');
    if(cls==='side') S.side=b.dataset.side;
    else if(cls==='dir') S.dir=b.dataset.dir;
    else if(cls==='mode'){ S.mode=b.dataset.mode; syncModeUI(); }
    else S.auto=(b.dataset.cap==='auto');
    savePrefs();
  });

  $('demo').onclick=function(){
    DEMO=!DEMO;
    $('demo').textContent='demo mode · '+(DEMO?'on':'off');
    $('demo').classList.toggle('on',DEMO);
    syncDemo();
  };
  function dataCounts(){
    var h=getHist().length, pv=Object.keys(PREV).filter(function(k){return k.charAt(0)!=='_';}).length, cal=0;
    try{ cal=JSON.parse(localStorage.getItem('stab_cal')||'[]').length; }catch(e){}
    $('dcounts').innerHTML=
      '<b>'+h+'</b> saved sweep'+(h===1?'':'s')+'<br>'+
      '<b>'+pv+'</b> position histor'+(pv===1?'y':'ies')+'<br>'+
      '<b>'+cal+'</b> calibration pair'+(cal===1?'':'s');
    $('clrsweeps').disabled=!h; $('clrprev').disabled=!pv;
  }
  dataCounts();
  $('clrsweeps').onclick=function(){
    var h=getHist();
    if(!h.length) return;
    if(!confirm('Remove '+h.length+' saved sweep CSV'+(h.length===1?'':'s')+
      '?\n\nExport anything you still need first. Calibration pairs and position history stay.')) return;
    try{ localStorage.removeItem('stab_hist'); }catch(e){}
    dataCounts(); toast('saved sweeps cleared');
  };
  $('clrprev').onclick=function(){
    var n=Object.keys(PREV).length;
    if(!n) return;
    if(!confirm('Remove '+n+' position baselines?\n\nThe "last here" line and Δ comparisons start over. Saved sweeps and calibration pairs stay.')) return;
    PREV={};
    try{ localStorage.removeItem('stab_prev'); }catch(e){}
    dataCounts(); toast('position history cleared');
  };
  /* ---- PREV export / import: two probes, two phones, one history ---- */
  $('expprev').onclick=function(){
    var n=Object.keys(PREV).length;
    if(!n){ toast('no position history yet'); return; }
    var pack={kind:'stab_prev',v:1,op:S.op,exported:Date.now(),prev:PREV};
    shareOrCopy(JSON.stringify(pack),'stab_prev_'+S.op+'_'+fnameDate()+'.json','position history ('+n+')');
  };
  $('impprev').onclick=function(){
    var pasted=($('imppaste').value||'').trim();
    if(pasted){ importPrevText(pasted); return; }
    $('imppaste').classList.remove('hide');
    try{ $('impfile').click(); }catch(e){}
  };
  $('impfile').onchange=function(){
    var f=this.files&&this.files[0]; if(!f) return;
    var rd=new FileReader();
    rd.onload=function(){ importPrevText(String(rd.result||'')); };
    rd.readAsText(f);
    this.value='';
  };
  function importPrevText(txt){
    var res=mergePrevText(PREV, txt);
    if(res.error){ toast(res.error); return; }
    PREV=res.merged;
    lsSet('stab_prev',JSON.stringify(PREV));
    $('imppaste').value=''; $('imppaste').classList.add('hide');
    dataCounts();
    toast('merged: '+res.added+' new, '+res.updated+' newer, '+res.kept+' kept');
  }
  /* ---- mic capability probe: settles the voice-note question on the device ---- */
  $('mictest').onclick=function(){
    var md=navigator.mediaDevices;
    if(!md||!md.getUserMedia){ toast('no getUserMedia here — voice recording is not possible in this browser'); return; }
    if(typeof MediaRecorder==='undefined'){ toast('mic exists but no MediaRecorder — cannot save audio'); return; }
    md.getUserMedia({audio:true}).then(function(st){
      st.getTracks().forEach(function(t){ t.stop(); });
      var m4a=MediaRecorder.isTypeSupported('audio/mp4'), webm=MediaRecorder.isTypeSupported('audio/webm');
      toast('mic OK · '+(m4a?'audio/mp4':webm?'audio/webm':'no audio type')+(canShareFiles()?' · file share OK':' · no file share'));
    }).catch(function(e){ toast('mic refused: '+((e&&e.name)||e)); });
  };
  $('clrall').onclick=function(){
    if(!confirm('Start fresh?\n\nRemoves saved sweeps, position history and any interrupted sweep.\n\nKeeps calibration pairs, crop names and your settings.')) return;
    PREV={};
    ['stab_hist','stab_prev','stab_session','stab_rows','stab_crops'].forEach(function(k){
      try{ localStorage.removeItem(k); }catch(e){}
    });
    dataCounts();
    $('resume').classList.add('hide');
    toast('clean slate — calibration kept');
  };
})();

/* ---------------- recovery banner ---------------- */
(function recovery(){
  var sess=null, rows=[];
  try{
    var _raw=JSON.parse(localStorage.getItem('stab_session')||'null');
    if(_raw && _raw.v>=22){ sess=_raw.s; rows=_raw.rows||[]; }
    else if(_raw){ sess=_raw;                       /* v21 and earlier */
      try{ rows=JSON.parse(localStorage.getItem('stab_rows')||'[]'); }catch(e2){}
    }
  }catch(e){}
  if(!(rows&&rows.length) && !(sess&&sess.route&&sess.route.length)) return;
  var room=(sess&&sess.room)||(rows[0]&&rows[0].room)||'?';
  $('resume').classList.remove('hide');
  $('rtitle').textContent='Interrupted sweep — '+room;
  $('rsub').textContent=(rows.length||0)+' readings saved'+
    (sess?(' · stop '+((sess.i||0)+1)+'/'+(sess.route?sess.route.length:'?')):'');
  if(!sess) $('rgo').style.display='none';
  if(!rows.length) $('rexp').style.display='none';
  $('rdis').onclick=function(){ clearSession(); $('resume').classList.add('hide'); };
  function hydrate(){
    if(sess){
      S.room=sess.room; S.side=sess.side||S.side; S.dir=sess.dir||S.dir;
      S.mode=sess.mode||S.mode; S.op=sess.op||S.op;
      S.notes=sess.notes||{}; S.free=sess.free||{}; S.route=sess.route||[]; S.i=sess.i||0;
      S.startedAt=sess.startedAt||Date.now();
      S.triage=sess.triage||[]; S.skips=sess.skips||0; S.unstable=sess.unstable||0;
      S.skipped=sess.skipped||{}; S.access=sess.access||null;
      /* feed EC/pH: from the session if it has them, else the saved room config */
      var rc=roomCfg()[S.room]||{};
      S.feedEC=(sess.feedEC!=null)?sess.feedEC:(rc.ec!=null?rc.ec:null);
      S.feedPH=(sess.feedPH!=null)?sess.feedPH:(rc.ph!=null?rc.ph:null);
    }else{
      var r0=rows[0]||{};
      S.room=r0.room||'?'; S.side=r0.side||S.side; S.dir=r0.dir||S.dir;
      S.mode=r0.mode||S.mode; S.notes={}; S.route=[]; S.i=rows.length;
      S.startedAt=Date.now();
    }
    S.rows=rows||[];
  }
  $('rexp').onclick=function(){ hydrate(); S.roomStarted=true; finish(); };
  $('rgo').onclick=function(){
    hydrate();
    S.roomStarted=true;
    $('setup').classList.add('hide'); $('startbar').classList.remove('up');
    ['hdr','route','main','pad'].forEach(function(id){$(id).classList.remove('hide');});
    $('hroom').textContent=S.room;
    hdrInfo();
    drawRoute(); render(); setBig();
    keepAwake(); audio();
    connect();
  };
})();

/* ---------------- start ---------------- */
function hdrInfo(){
  var hs=hoursSinceShot(S.room), dof=dofNow(S.room);
  $('hside').textContent=(DEMO?'DEMO · ':'')+(S.mode==='spot'?'SPOT · ':'')+'DOF '+(dof===''?'—':dof)+
    (hs===null?'':' · '+hs.toFixed(1)+'h');
}
$('startbtn').onclick=function(){
  if(!S.room) return;
  if(S.mode==='triage' && !(S.triage&&S.triage.length)){ toast('pick the tables to triage first'); return; }
  applyRoomCfg();
  S.route=buildRoute(S.room,S.dir,S.mode,S.side); S.i=0; S.rows=[]; S.notes={};
  S.startedAt=Date.now(); S.roomStarted=true;
  S.skips=0; S.unstable=0; S.redo=[]; S.alarmQueue=[]; S.huntFails=0; S.shotMidSweep=false; renderAlarm();
  S.skipped={};   /* S.access is set on setup and committed by this tap */
  saveSession();
  $('setup').classList.add('hide'); $('startbar').classList.remove('up');
  ['hdr','route','main','pad'].forEach(function(id){$(id).classList.remove('hide');});
  $('hroom').textContent=S.room;
  hdrInfo();
  drawRoute(); render(); setBig();
  audio(); keepAwake();
  syncDemo();
  if(DEMO){
    S.trigger=TRIGGER; S.everConn=true;
    ['log','extra','skip','undo','redo'].forEach(function(id){$(id).disabled=false;});
    $('dot').className='dot live'; $('statxt').textContent='demo';
    A.state='air'; A.buf=[]; SIM.phase='air';
    setBig(); step('demo probe — tap TAP TO STAB to simulate a reading');
    return;
  }
  connect();
};

/* ---------------- render ---------------- */
function drawRoute(){
  var el=$('route'); el.innerHTML='';
  var cur=S.route[S.i], spot=(S.mode==='spot');
  var tv={};
  S.rows.forEach(function(r){
    if(r.depth==='reference' && typeof r.table==='number'){ (tv[r.table]=tv[r.table]||[]).push(r.vwc); }
  });
  var f=floorFor(S.room);
  for(var t=1;t<=ROOMS[S.room].t;t++){
    var d=document.createElement('div'); d.className='tk';
    if(!spot){
      if(cur && t===cur.t) d.className+=' now';
      else if(!cur || t<cur.t) d.className+=' done';
    }
    var col='';
    if(tv[t]){ var mv=med(tv[t]);
      col=mv<f?'var(--low)':(mv<f+6?'var(--warn)':'var(--ok)'); }
    d.dataset.t=t;
    d.onclick=function(){ if(!S.finished) openPegs(+this.dataset.t); };
    d.style.cursor='pointer';
    d.innerHTML='<span class="bar"'+(col&&d.className.indexOf('now')<0?' style="background:'+col+'"':'')+
      '></span><span class="n">'+t+'</span>';
    el.appendChild(d);
  }
  var now=el.querySelector('.now'); if(now) now.scrollIntoView({inline:'center',block:'nearest'});
}
function render(){
  var s=S.route[S.i];
  if(!s){ finish(); return; }
  $('pos').textContent=(s.spot?'Spot '+(S.i+1):'Table '+s.t);
  $('depth').innerHTML=s.pos+'<span class="d">'+(s.depth==='reference'?'REF':'MID')+'</span>';
  var rm=RMAP[S.room]||{}, info=rm[String(s.t)]||['',''];
  $('strain').onclick=null;
  $('strain').innerHTML=info[0]
    ? info[0]+(info[1].indexOf('U')>=0?'<span class="tag">underlights</span>':'')
             +(info[1].indexOf('T')>=0?'<span class="tag">saucer</span>':'') : '';
  var nx=S.route[S.i+1];
  $('nextup').textContent=nx
    ? 'next  '+(nx.spot?'spot':'T'+nx.t+' '+nx.pos+' '+(nx.depth==='reference'?'ref':'mid'))
    : 'last one';
  var rv=S.rows.filter(function(r){return r.depth==='reference';}).map(function(r){return r.vwc;});
  $('roomavg').innerHTML=rv.length>2?'room <b>'+med(rv).toFixed(0)+'</b> · n'+rv.length:'';
  var key=S.room+'|'+s.t+'|'+s.pos+'|'+s.depth, p=PREV[key];
  $('ctx').innerHTML=p
    ? '<span class="was">last here '+p.d+'</span> &nbsp; '+p.v+'% &nbsp; '+(p.e==null?'—':p.e)+' dS/m &nbsp; <span id="cdelta"></span>'
    : '<span class="was">no prior reading here</span>';
  drawRoute(); drawRecent(); paint();
}
/* ---------------- target picker (1.2 sequence recovery) ----------------
   The current-target label is the control: tap it to say "actually I'm
   here", long-press a recent entry to say "that one was actually here".
   pickableRoute() is false for spot/flush — those have no table structure
   to pick from (matches checkLines()'s own guard). */
function pickableRoute(){ return S.route.length && S.mode!=='spot' && S.mode!=='flush'; }
function routeIndexNear(t,pos,depth,near){
  var best=-1;
  for(var i=0;i<S.route.length;i++){
    var s=S.route[i];
    if(s.t===t && s.pos===pos && s.depth===depth && (best<0 || Math.abs(i-near)<Math.abs(best-near))) best=i;
  }
  return best;
}
var TP={forRow:null};
function openTarget(rowIdx){
  if(S.finished || !pickableRoute()){ toast('no table sequence to pick from'); return; }
  TP.forRow=(rowIdx==null?null:rowIdx);
  var cfg=ROOMS[S.room]||{t:11};
  var h='';
  for(var t=1;t<=cfg.t;t++) h+='<button class="tgt" data-t="'+t+'">'+t+'</button>';
  $('targettabs').innerHTML=h;
  $('targetpos').innerHTML='';
  [].forEach.call(document.querySelectorAll('#targettabs .tgt'),function(b){
    b.onclick=function(){
      [].forEach.call(document.querySelectorAll('#targettabs .tgt'),function(x){x.classList.remove('on');});
      b.classList.add('on');
      renderTargetPos(+b.dataset.t);
    };
  });
  $('targetsheet').classList.remove('hide');
}
function renderTargetPos(t){
  var opts=[], seen={};
  S.route.forEach(function(s){
    if(s.t!==t) return;
    var k=s.pos+'|'+s.depth; if(seen[k]) return; seen[k]=1;
    opts.push({pos:s.pos,depth:s.depth});
  });
  $('targetpos').innerHTML=opts.map(function(o){
    return '<button class="tgt" data-pos="'+o.pos+'" data-depth="'+o.depth+'">'+o.pos+
      (o.depth==='mid-bag'?' <span class="d">MID</span>':'')+'</button>';
  }).join('');
  [].forEach.call(document.querySelectorAll('#targetpos .tgt'),function(b){
    b.onclick=function(){ pickTarget(t,b.dataset.pos,b.dataset.depth); };
  });
}
/* Relabels one row to a different route stop, keeping the measured values.
   PREV is re-keyed so the position-history delta follows the corrected
   label rather than the stale one. */
function relabelRow(r,stop){
  r.table=stop.t; r.position=stop.pos; r.depth=stop.depth;
  r.strain=((RMAP[S.room]||{})[String(stop.t)]||['',''])[0];
  r.flags=((RMAP[S.room]||{})[String(stop.t)]||['',''])[1];
  r.plant=(stop.extra?'adjacent':'');
  var newKey=r.room+'|'+stop.t+'|'+stop.pos+'|'+stop.depth;
  PREV[newKey]={d:r.date,v:r.vwc,e:r.ec,ts:Date.now()};
  if(!DEMO) lsSet('stab_prev',JSON.stringify(PREV));
}
/* The last n readings are, one for one, shifted back by n route slots from
   whatever slot they are each currently labelled with — not simply
   relabelled to newIndex..newIndex+n-1, which would just reproduce the
   labels they already have. n is the sequence distance the operator gave
   us (S.i minus the corrected target), so this handles an off-by-one and
   an off-by-three with the same arithmetic. */
function shiftBack(n){
  var len=S.rows.length, count=Math.min(n,len);
  for(var k=0;k<count;k++){
    var rowPos=len-count+k, oldRouteIdx=S.i-count+k, newRouteIdx=oldRouteIdx-n;
    if(newRouteIdx<0 || !S.route[newRouteIdx]) continue;
    relabelRow(S.rows[rowPos],S.route[newRouteIdx]);
  }
}
function pickTarget(t,pos,depth){
  $('targetsheet').classList.add('hide');
  var near=(TP.forRow==null)?S.i:TP.forRow;
  var idx=routeIndexNear(t,pos,depth,near);
  if(idx<0){ toast('not on this route'); return; }
  if(TP.forRow!=null){
    var rowIdx=TP.forRow; TP.forRow=null;
    if(S.rows[rowIdx]) relabelRow(S.rows[rowIdx],S.route[idx]);
    saveSession(); render(); flash();
    return;
  }
  if(idx===S.i) return;
  if(idx>S.i){ S.i=idx; saveSession(); render(); flash(); return; }
  var n=S.i-idx;
  if(confirm('Shift the last '+n+' reading'+(n>1?'s':'')+' back one slot?')) shiftBack(n);
  S.i=idx; saveSession(); render(); flash();
}
function drawRecent(){
  var el=$('recent'); if(!el) return;
  if(!pickableRoute() || !S.rows.length){ el.innerHTML=''; return; }
  var n=Math.min(4,S.rows.length), h='';
  for(var i=S.rows.length-1;i>=S.rows.length-n;i--){
    var r=S.rows[i];
    h+='<button class="rc" data-i="'+i+'">T'+r.table+' '+r.position+' '+
      (r.depth==='reference'?'ref':'mid')+' '+r.vwc.toFixed(0)+'%</button>';
  }
  el.innerHTML=h;
  [].forEach.call(el.querySelectorAll('.rc'),function(b){
    var lt=null, fired=false;
    b.addEventListener('pointerdown',function(){
      fired=false; clearTimeout(lt);
      lt=setTimeout(function(){ fired=true; openTarget(+b.dataset.i); },500);
    });
    ['pointerup','pointerleave','pointercancel'].forEach(function(ev){
      b.addEventListener(ev,function(){ clearTimeout(lt); });
    });
    b.addEventListener('click',function(){ if(fired){ fired=false; return; } toast('long-press to reassign'); });
  });
}
function ecClass(ec){
  if(ec==null) return 'enone';
  if(ec>=3&&ec<=6) return 'eok';
  if((ec>=2.5&&ec<3)||(ec>6&&ec<=7)) return 'ewarn';
  return 'elow';
}
function paint(){
  var v=$('vwc');
  if(!S.last){ v.textContent='--'; v.className='none';
    $('ecbig').textContent='--'; $('ecbig').className='enone';
    $('tmp').textContent='--';
  }else{
    v.textContent=S.last.vwc.toFixed(1);
    var f=floorFor(S.room);
    v.className=S.last.vwc<f?'low':(S.last.vwc<f+6?'warn':'ok');
    $('ecbig').textContent=(S.last.ec==null?'--':S.last.ec.toFixed(2));
    $('ecbig').className=ecClass(S.last.ec);
    $('tmp').textContent=(S.last.tmp*9/5+32).toFixed(1);
    var cd=$('cdelta');
    if(cd){
      var s=S.route[S.i];
      var p=s?PREV[S.room+'|'+s.t+'|'+s.pos+'|'+s.depth]:null;
      if(p && S.last.vwc>=8){
        var dv=S.last.vwc-p.v, txt='Δ '+(dv>=0?'+':'')+dv.toFixed(1);
        if(p.e!=null && S.last.ec!=null){
          var de=S.last.ec-p.e; txt+=' / '+(de>=0?'+':'')+de.toFixed(2);
        }
        cd.textContent=txt;
      }else cd.textContent='';
    }
  }
  battPaint();
  setBig();
}
function battPaint(){
  var b=$('batt');
  if(S.batt==null||S.batt>30){ b.className=''; b.textContent=''; return; }
  b.className=S.batt<=15?'red':'amber';
  b.textContent='batt '+S.batt+'%';
}
function isConn(){ if(DEMO) return true;
  return !!(S.dev && S.dev.gatt && S.dev.gatt.connected && S.chr); }
/* Three probe states, one colour each (Addendum B §2). GREEN pulsing: clear
   and armed, stab now. RED: reading, hold still. WHITE: logged, pull the
   probe out. v28 gave reading and logged the same red, which left no cue for
   the moment to lift out — the one the operator was moving too fast through. */
function setBig(){
  var b=$('log'); if(!S.roomStarted) return;
  b.disabled=false;
  b.classList.remove('busy','wait','pull','dim','ready');
  if(S.connecting){ b.textContent='CONNECTING…'; b.classList.add('dim'); return; }
  if(!isConn()){ b.textContent=S.everConn?'RECONNECT':'CONNECT'; return; }
  if(S.verifying){ b.textContent='CHECKING PROBE…'; b.classList.add('busy'); return; }
  if(!S.trigger){ b.textContent='RETRY PROBE'; return; }
  if(!S.auto){
    if(S.awaiting){ b.textContent='READING…'; b.classList.add('wait'); }
    else{ b.textContent='TAKE READING'; b.classList.add('ready'); }
    return;
  }
  if(DEMO){
    if(A.state==='settling'){ b.textContent='READING… HOLD STILL'; b.classList.add('wait'); }
    else if(A.state==='hold'){ b.textContent='LOGGED · PULL PROBE'; b.classList.add('pull'); }
    else{ b.textContent='TAP TO STAB'; b.classList.add('ready'); }
    return;
  }
  if(A.state==='settling'){
    b.textContent=A.prompted?'NO STABLE READING · TAP TO COMMIT':'READING… HOLD STILL';
    b.classList.add('wait');
  }
  else if(A.state==='hold'){ b.textContent='LOGGED · PULL PROBE'; b.classList.add('pull'); }
  else{ b.textContent='STAB NOW'; b.classList.add('ready'); }
}
function step(m){ var d=$('diag'); if(d) d.textContent=m; }
function flash(){
  var m=$('main'); if(!m) return;
  m.classList.add('flash');
  setTimeout(function(){ m.classList.remove('flash'); },130);
}
var tmr;
function toast(msg){
  var t=$('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(tmr); tmr=setTimeout(function(){t.classList.remove('show');},2400);
}
/* ---------------- alarm (1.3/1.4): red, held until acknowledged ----------------
   A toast auto-dismisses in 2.4s, too fast for something the field showed
   goes unnoticed. Alarms queue instead: each stays up until tapped, and the
   next one (if any) takes its place. */
function showAlarm(msg){
  S.alarmQueue=S.alarmQueue||[];
  S.alarmQueue.push(msg);
  renderAlarm();
}
function renderAlarm(){
  var el=$('alarm'); if(!el) return;
  if(!S.alarmQueue || !S.alarmQueue.length){ el.classList.add('hide'); return; }
  var t=$('alarmtxt'); if(t) t.textContent=S.alarmQueue[0];
  el.classList.remove('hide');
}
var alarmOk=$('alarmok');
if(alarmOk) alarmOk.onclick=function(){
  if(S.alarmQueue) S.alarmQueue.shift();
  renderAlarm();
};

/* ---------------- bluetooth ---------------- */
function dbgUnparsedPush(tag,txt){
  DBG.unparsed.push(new Date().toLocaleTimeString('en-US',{hour12:false})+' ['+tag+'] '+String(txt).slice(0,60));
  if(DBG.unparsed.length>20) DBG.unparsed.shift();
}
emitUnparsed=function(tag,txt){
  dbgUnparsedPush(tag,txt);
  step('unparsed ['+tag+'] '+String(txt).slice(0,26));
};
emitReading=function(pr){
  var now=Date.now();
  if(pr.direct) DBG.directs++; else DBG.statusFrames++;
  var media=S.room?ROOMS[S.room].media:'Bio365';
  var ec=poreEC(pr.counts,pr.bulk,pr.tC,offsetFor(media));
  var r={vwc:+vwcFor(media,pr.counts).toFixed(1), tmp:+pr.tC.toFixed(1),
    ec:(ec==null?null:+ec.toFixed(2)), bulk:+(pr.bulk/1000).toFixed(3),
    counts:pr.counts, raw:pr.raw, direct:pr.direct, ts:now};
  S.last=r; S.lastAt=now; paint();
  step((pr.direct?'':'status · ')+pr.raw);
  if(pr.direct && S.tWrite && now>=S.tWrite) S.lastLat=Math.round(now-S.tWrite);
  for(var i=WAIT.length-1;i>=0;i--){
    if(!WAIT[i].direct || pr.direct){
      var w=WAIT.splice(i,1)[0]; clearTimeout(w.t); w.res(r);
    }
  }
  if(S.cal){ CAL.live=r; if(CAL.stage==='live') calPaint(); return; }
  if(!pr.direct) return;                      /* status frames never commit */
  if(S.tWrite && now<S.tWrite) return;        /* pre-write straggler guard */
  if(S.awaiting){
    S.awaiting=false; clearTimeout(S.rt);
    doCommit(r,{});
    return;
  }
  if(S.auto && !S.pegsOpen && !S.logOpen && !S.finished && !S.verifying && S.trigger) autoFeed(r);
};
function onPacket(e){
  DBG.pkts++;
  var dv=e.target.value, bytes=[];
  for(var i=0;i<dv.byteLength;i++) bytes.push(dv.getUint8(i));
  rxBytes(bytes);
}
function onDrop(){
  S.chr=null; S.wchr=null; S.svc=null; S.batC=null;
  S.verifying=false; S.awaiting=false; clearTimeout(S.rt);
  $('dot').className='dot'; $('statxt').textContent='dropped';
  if(S.cal && CAL.released){ calPaint(); }
  else if(!S.finished){ beep('drop'); toast('probe disconnected'); step('probe disconnected — tap to reconnect'); }
  setBig();
}
function waitDirect(ms){
  return new Promise(function(res){
    var w={direct:true,res:res};
    w.t=setTimeout(function(){
      var k=WAIT.indexOf(w); if(k>=0) WAIT.splice(k,1);
      res(null);
    },ms);
    WAIT.push(w);
  });
}
function sendTrigger(){
  if(!S.wchr) return Promise.reject(new Error('no write characteristic'));
  var cand=S.trigger||TRIGGER, data=bytesOf(cand);
  DBG.polls++;
  var useAck=!!(S.wchr.properties && S.wchr.properties.write);
  var p=useAck?S.wchr.writeValue(data):S.wchr.writeValueWithoutResponse(data);
  return p.then(function(){ S.tWrite=Date.now(); });
}
function connect(){
  if(!navigator.bluetooth){ step('no Web Bluetooth — open in Bluefy'); return Promise.resolve(); }
  if(S.connecting) return Promise.resolve();
  S.connecting=true; setBig(); step('connecting…');
  var p;
  if(S.dev){
    p=S.dev.gatt.connect().catch(function(){ S.dev=null; return pickAndConnect(); });
  }else p=pickAndConnect();
  return p.then(function(){
    step('connected — settling');
    return sleep(700);
  }).then(function(){
    var g=S.dev.gatt;
    step('finding service');
    return g.getPrimaryService(SVC).catch(function(){
      return g.getPrimaryServices().then(function(list){
        for(var i=0;i<list.length;i++){ if(list[i].uuid.indexOf('deca')===0) return list[i]; }
        throw new Error('probe service not found');
      });
    });
  }).then(function(svc){
    S.svc=svc; step('finding characteristics');
    return svc.getCharacteristic(NTF).catch(function(){
      return svc.getCharacteristics().then(function(cs){
        for(var i=0;i<cs.length;i++){
          if(cs[i].uuid.indexOf('deca')===0 && cs[i].properties.notify) return cs[i];
        }
        throw new Error('notify characteristic not found');
      });
    });
  }).then(function(c){
    S.chr=c;
    c.addEventListener('characteristicvaluechanged',onPacket);
    return c.startNotifications();
  }).then(function(){
    return S.svc.getCharacteristic(WRT).catch(function(){
      return S.svc.getCharacteristics().then(function(cs){
        for(var i=0;i<cs.length;i++){
          if(cs[i].uuid.indexOf('deca')===0 &&
             (cs[i].properties.write||cs[i].properties.writeWithoutResponse)) return cs[i];
        }
        throw new Error('write characteristic not found');
      });
    });
  }).then(function(w){
    S.wchr=w;
    S.everConn=true; S.connecting=false;
    ['log','extra','skip','undo','redo'].forEach(function(id){$(id).disabled=false;});
    $('statxt').textContent='waiting';
    readBattery(S.dev.gatt);
    setBig();
    return verifyTrigger();
  }).catch(function(err){
    S.connecting=false;
    setBig();
    $('log').disabled=false;
    step('connect failed: '+((err&&err.message)||err));
  });
}
function pickAndConnect(){
  step('requesting device');
  return navigator.bluetooth.requestDevice({filters:[{services:[SVC]}],optionalServices:[SVC,'battery_service']})
    .catch(function(){
      step('retry with all devices');
      return navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[SVC,'battery_service']});
    })
    .then(function(dev){
      S.dev=dev;
      dev.addEventListener('gattserverdisconnected',onDrop);
      step('connecting GATT');
      return dev.gatt.connect();
    });
}
function verifyTrigger(){
  S.verifying=true; setBig(); step('checking probe…');
  S.trigger=TRIGGER;
  function tryOnce(){
    return sendTrigger().catch(function(){ DBG.writeFails++; })
      .then(function(){ return waitDirect(1600); });
  }
  return tryOnce().then(function(r){
    if(r) return r;
    return tryOnce();
  }).then(function(r){
    if(r){
      S.verifying=false; S.huntFails=0;
      step('probe ok — '+TRIGGER.n);
      ready();
      return;
    }
    S.trigger=null;
    step('default trigger not confirmed — hunting');
    return huntFallback().then(function(){
      S.verifying=false;
      if(S.trigger){ S.huntFails=0; ready(); return; }
      /* 1.8: two failed hunts in a row is almost always the connector, not
         the probe — breaks the retry loop before the operator burns more
         time on it. */
      S.huntFails=(S.huntFails||0)+1;
      if(S.huntFails>=2){
        setBig(); step('remove the connector, wipe it, and reinsert');
        toast('remove the connector, wipe it, and reinsert');
      }else{ setBig(); step('no trigger found — tap RETRY PROBE'); }
    });
  });
}
function huntFallback(){
  var i=0;
  function next(){
    if(i>=CANDS.length) return Promise.resolve();
    var c=CANDS[i++];
    step('hunt '+i+'/'+CANDS.length+' '+c.n);
    var save=S.trigger; S.trigger=c;
    return sendTrigger().catch(function(){ DBG.writeFails++; })
      .then(function(){ return waitDirect(950); })
      .then(function(r){
        if(r){ step('★ trigger = '+c.n); return; }
        S.trigger=save;
        return next();
      });
  }
  return next();
}
function ready(){
  setBig();
  if(S.auto){ A.state='air'; A.buf=[]; }
  if(S.batt!=null && S.batt<=15){ beep('battLow'); toast('probe battery '+S.batt+'% — bring spares'); }
  if(S.cal && CAL.stage==='saved'){ CAL.stage='live'; calPaint(); }
  step('ready');
}
function readBattery(g){
  g.getPrimaryService('battery_service').then(function(s){
    return s.getCharacteristic('battery_level');
  }).then(function(c){
    S.batC=c;
    return c.readValue().then(function(v){
      S.batt=v.getUint8(0); battPaint();
      c.addEventListener('characteristicvaluechanged',function(e){
        S.batt=e.target.value.getUint8(0); battPaint();
      });
      return c.startNotifications().catch(function(){});
    });
  }).catch(function(){ S.batt=null; });
}
setInterval(function(){
  if(S.batC && isConn()){
    S.batC.readValue().then(function(v){ S.batt=v.getUint8(0); battPaint(); }).catch(function(){});
  }
},300000);

/* ---------------- manual capture ---------------- */
function bigTap(){
  audio();
  if(DEMO){
    if(SIM.phase==='air') simStab();
    else{ SIM.phase='air'; SIM.backAt=0; setBig(); }
    return;
  }
  if(S.connecting) return;
  if(!isConn()){ connect(); return; }
  if(S.verifying) return;
  if(!S.trigger){ verifyTrigger(); return; }
  if(S.auto){
    /* v27 A1.2: pause is gone. Once the probe is in a bag it will always
       produce a reading, so there is no moment where suspending the live
       read helps — and the tap that used to pause was the operator's
       instinct to log. Any tap with a live frame in hand commits it,
       flagged manual; a tap with nothing to commit says so and does
       nothing else. */
    /* the buffer survives the commit until the probe clears to air, so the
       state guard is what stops a second tap logging the same stab twice */
    if(A.state==='settling' && A.buf.length){
      var last=A.buf[A.buf.length-1];
      A.state='hold'; doCommit(last,{manual:true}); setBig();
      return;
    }
    if(A.state==='hold'){ toast('already logged — pull the probe'); return; }
    toast('stab a bag to log');
    return;
  }
  if(S.awaiting) return;
  S.awaiting=true; S.tries=0;
  setBig(); step('reading…');
  attempt();
}
function attempt(){
  S.tries++;
  sendTrigger().catch(function(){
    DBG.writeFails++;
    if(S.awaiting && S.tries<4) setTimeout(attempt,260);
  });
  clearTimeout(S.rt);
  S.rt=setTimeout(function(){
    if(!S.awaiting) return;
    if(S.tries<2){ step('retry…'); attempt(); }
    else{
      S.awaiting=false; DBG.timeouts++;
      setBig(); step('NO RESPONSE — tap again');
      beep('warn'); toast('no reading — tap again');
    }
  },2200);
}

/* ---------------- auto capture ---------------- */
/* v21: AIR 8→5 (the cubic reads air at about -1.5%; real bags were logged at
   8.1%, so 8 was throwing away dry readings). POLL 1200→800 and MIN_SETTLE to
   match: the probe answers in ~420 ms flat (9/1 data), so 0.8 s leaves margin.
   STAB_E retired: pore EC is bulk EC divided by (permittivity − 2.90), and at
   15–20% VWC a 2-count wobble moved it 0.3–0.9 dS/m against a 0.15 gate, which
   pushed those stabs to the 10 s timeout. Bulk EC is what the sensor measures;
   the VWC gate already covers the permittivity side. */
/* v26: manual commit (1.1). Below 20% VWC the signal is noisier (dry,
   low-conductivity bags) and the settle gate above was rejecting valid
   frames outright — a dry bag could read on screen and never auto-log.
   Below LOW_V the tolerance band widens and the minimum settle window
   halves, so a genuinely dry-but-stable bag clears the gate sooner. This
   does not touch the gate at normal moisture, only the low end. SETTLE_PROMPT
   surfaces a manual-commit prompt at 8s if the gate still hasn't cleared,
   rather than leaving the operator guessing; MAX_SETTLE stays as the final
   backstop so a missed prompt still resolves instead of hanging forever. */
/* v27 A1.3: the insertion gate sat far above the sensor floor. A-7 T12 read
   6–8% on screen and never logged: AIR 5 said "not air", but INS 13 was
   never reached and the jump from a ~2% in-hand baseline was under JUMP 6,
   so the frame sat in 'air' forever. The probe reads 2.0–2.3% held in a
   bare hand, so anything meaningfully above that is a bag, not air. The
   gate now sits just over the sensor floor; with the manual commit always
   available (A1.2) an unusual bag can be forced through regardless. */
var POLL=800, AIR=3.5, INS=6, JUMP=2.5, STAB_V=0.5, STAB_B=0.03, STAB_B_REL=0.04,
    MIN_SETTLE=800, MAX_SETTLE=10000, SETTLE_PROMPT=8000, LOW_V=20, HOLD_DROP=15;
setInterval(function(){
  if(!S.roomStarted||S.finished||!S.auto||S.cal||S.pegsOpen||S.logOpen) return;
  if(DEMO) return;
  if(S.awaiting||S.verifying||S.connecting||!S.trigger||!isConn()) return;
  if(document.visibilityState!=='visible') return;
  if(Date.now()-S.lastPoll<POLL) return;
  S.lastPoll=Date.now();
  sendTrigger().catch(function(){ DBG.writeFails++; });
},200);
function autoFeed(r){
  if(!S.route[S.i]) return;
  if(A.state==='hold'){
    /* v28: hold used to clear only on a frame under AIR. A probe pulled from
       a wet bag is itself wet and reads well above AIR for a second or two —
       at an 800 ms poll a quick reference-to-mid-bag move can produce no
       qualifying frame at all, so the mid-bag stab arrives while we are still
       holding and is dropped on the floor. The cursor never advances, and the
       room reaches its last stop still asking for stabs the operator has
       already taken. A decisive drop from the value just logged clears it
       too: a paired mid-bag stab of the same bag runs about five points under
       its reference, so HOLD_DROP well past that cannot be mistaken for one. */
    if(r.vwc<AIR || (A.holdV!=null && r.vwc < A.holdV-HOLD_DROP)){
      A.state='air'; A.buf=[]; A.lastAir=r.vwc; beep('tick'); setBig();
    }
    return;
  }
  if(r.vwc<AIR){
    if(A.state!=='air'){ A.state='air'; A.buf=[]; setBig(); }
    A.lastAir=r.vwc;
    return;
  }
  if(A.state==='air'){
    if(r.vwc>=INS || (A.lastAir!=null && r.vwc-A.lastAir>=JUMP)){
      A.state='settling'; A.buf=[r]; A.t0=Date.now(); A.samples=1; A.prompted=false; setBig();
    }
    return;
  }
  /* settling */
  A.buf.push(r); if(A.buf.length>4) A.buf.shift();
  A.samples=(A.samples||1)+1;
  var n=A.buf.length;
  var low=r.vwc<LOW_V;
  var vTol=low?STAB_V*2:STAB_V;
  var bTol=low?STAB_B*2:STAB_B, bRelTol=low?STAB_B_REL*2:STAB_B_REL;
  var minSettle=low?MIN_SETTLE/2:MIN_SETTLE;
  if(n>=2){
    var a=A.buf[n-2], b=r;
    var ecOk=Math.abs(a.bulk-b.bulk)<=Math.max(bTol, bRelTol*b.bulk);
    if(Math.abs(a.vwc-b.vwc)<=vTol && ecOk && Date.now()-A.t0>=minSettle){
      A.state='hold'; doCommit(b,{}); setBig(); return;
    }
  }
  if(!A.prompted && Date.now()-A.t0>=SETTLE_PROMPT){
    A.prompted=true;
    beep('warn'); toast('no stable reading — tap to commit now'); setBig();
  }
  if(Date.now()-A.t0>MAX_SETTLE){
    var byV=A.buf.slice().sort(function(p,q){return p.vwc-q.vwc;});
    var m=byV[Math.floor(byV.length/2)];
    A.state='hold'; S.unstable++;
    doCommit(m,{unstable:true}); setBig();
  }
}

/* ---------------- demo probe ----------------
   No hardware. Synthesises raw sensor frames and pushes them through
   rxBytes(), so demo mode runs the same CRC/reassembly/parse/commit path
   as the real probe — a demo is also a live self-test. Demo never writes
   facility data to storage. */
var DEMO=false;
var SIM={phase:'air', t0:0, target:0, targetEC:0, backAt:0};
function simTarget(rm,t,pos,depth){
  var s=(String(t)+pos+depth), seed=0;
  for(var i=0;i<s.length;i++) seed+=s.charCodeAt(i);
  var base=46;
  var d=(depth==='mid-bag')?-5:0;
  var p=(pos==='header'||pos==='end')?2:((pos==='front'||pos==='start')?-2:0);
  return Math.max(9, base+d+p+((seed%13)-6)*0.9);
}
function simTargetEC(rm,t,pos){
  var s=(String(t)+pos), seed=0;
  for(var i=0;i<s.length;i++) seed+=s.charCodeAt(i);
  return 3.4+(seed%11)*0.22;
}
function simStab(){
  var st=S.route[S.i]; if(!st) return;
  SIM.target=simTarget(S.room,st.t,st.pos,st.depth);
  SIM.targetEC=simTargetEC(S.room,st.t,st.pos);
  SIM.phase='in'; SIM.t0=Date.now(); SIM.backAt=0;
  setBig();
}
function simInject(){
  var media=S.room?ROOMS[S.room].media:'Bio365', tC=22.0, vwc;
  if(SIM.phase==='air'){ vwc=1.4+Math.random()*1.6; }
  else{
    var el=Date.now()-SIM.t0;
    if(el<1300){ var f=el/1300; vwc=2+(SIM.target-2)*f+(Math.random()-0.5)*1.6; }
    else vwc=SIM.target+(Math.random()-0.5)*0.3;
  }
  var c=countsForVwc(vwc, isMineral(media));
  var bulk=(SIM.phase==='air')?0:bulkForEC(c, SIM.targetEC, tC, offsetFor(media));
  rxBytes(frameBytes('0\t'+c.toFixed(1)+' '+tC.toFixed(1)+' '+bulk+'\rg8'));
}
setInterval(function(){
  if(!DEMO||!S.roomStarted||S.finished||S.pegsOpen) return;
  if(SIM.phase==='in' && A.state==='hold' && !SIM.backAt) SIM.backAt=Date.now()+900;
  if(SIM.backAt && Date.now()>SIM.backAt){ SIM.phase='air'; SIM.backAt=0; }
  simInject();
},600);

/* ---------------- commit / advance ---------------- */
function doCommit(r, meta){
  var stop=S.route[S.i]; if(!stop){ return; }
  var f=floorFor(S.room);
  var key=S.room+'|'+stop.t+'|'+stop.pos+'|'+stop.depth;
  var pc=PREV[key];
  var tblVals=S.rows.filter(function(x){return x.table===stop.t&&x.depth===stop.depth;})
                    .map(function(x){return x.vwc;});
  var tmed=tblVals.length>=2?med(tblVals):null;
  var outlier=(pc&&Math.abs(r.vwc-pc.v)>8)||(tmed!=null&&Math.abs(r.vwc-tmed)>10);
  var row={
    date:new Date().toLocaleDateString('en-US'),
    time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}),
    room:S.room, table:stop.t, position:stop.pos, depth:stop.depth,
    strain:((RMAP[S.room]||{})[String(stop.t)]||['',''])[0],
    flags:((RMAP[S.room]||{})[String(stop.t)]||['',''])[1],
    hrs:(function(){var h=hoursSinceShot(S.room,null,stop.t); return h===null?'':h.toFixed(1);})(),
    mode:S.mode, dir:S.dir, feedEC:(S.feedEC==null?'':S.feedEC), feedPH:(S.feedPH==null?'':S.feedPH),
    plant:(stop.extra?'adjacent':''),
    bag:ROOMS[S.room].bag, media:ROOMS[S.room].media,
    side:S.side, vwc:r.vwc, ec:r.ec, bulk:r.bulk, tmp:r.tmp,
    flag:r.vwc<f, raw:r.raw,
    op:DEMO?(S.op+' (DEMO)'):S.op, frame:r.direct?'direct':'status',
    /* Settle n: auto = probe samples from insertion to commit; manual = write attempts */
    tries:S.auto?(A.samples||1):(S.tries||0),
    unstable:!!meta.unstable,
    implaus:((ROOMS[S.room].bag===2 && r.vwc>62) || r.vwc<6),
    batt:(S.batt==null?'':S.batt), lat:(S.lastLat==null?'':S.lastLat),
    manualCommit:!!meta.manual,
    /* 1.4: a live per-stab alarm, distinct from the CHECK "no feed" rule —
       this fires on ONE reading, not two, because it means "delivery
       fault", not "drying bag" (a drying bag's EC rises, it does not sit
       at zero). */
    zeroEc:(r.bulk!=null && r.bulk<0.02 && r.vwc<20),
    _pc:pc||null, _out:!!outlier
  };
  /* §4: a shot that fires mid-sweep splits the room into two populations
     that are not comparable — on 9/9 C-3 flipped from 1.9h to 0.0h partway
     through and nobody was told. Rows after the shot carry postShot so the
     CSV can separate them, and the operator gets one alarm at the moment. */
  if(S.rows.length){
    var prevHrs=parseFloat(S.rows[S.rows.length-1].hrs);
    var nowHrs=parseFloat(row.hrs);
    if(!isNaN(prevHrs) && !isNaN(nowHrs) && nowHrs < prevHrs - 0.25){
      S.shotMidSweep=true;
      showAlarm('a shot fired mid-sweep — readings from here are not comparable to the ones before it');
    }
  }
  row.postShot=!!S.shotMidSweep;
  S.rows.push(row);
  A.holdV=r.vwc;   /* what 'hold' watches for the probe leaving */
  PREV[key]={d:row.date,v:row.vwc,e:row.ec,ts:Date.now()};
  if(!DEMO) lsSet('stab_prev',JSON.stringify(PREV));
  S.redo=[];
  if(row.flag && S.mode==='sweep' && !stop.spot) S.flaggedTable=true;
  /* feedback */
  if(row.zeroEc){
    beep('alarm');
    showAlarm('zero EC — T'+stop.t+' '+stop.pos+' '+(stop.depth==='reference'?'ref':'mid')+' — delivery fault, not a dry reading');
  }
  if(row.implaus){ beep('out'); toast('implausible '+row.vwc+'% — bad seat? undo and re-stab'); }
  else if(row.flag){ beep('floor'); toast('below floor · '+row.vwc+'%'); }
  else if(meta.unstable){ beep('out'); toast('unstable — logged median'); }
  else if(outlier){
    beep('out');
    var dref=pc?(r.vwc-pc.v):(r.vwc-tmed);
    toast('outlier Δ'+(dref>=0?'+':'')+dref.toFixed(1)+' — undo?');
  }
  else if(row.vwc<f+6) beep('warn');
  else beep('ok');
  step('logged '+(stop.spot?'spot':'T'+stop.t+' '+stop.pos+' '+(stop.depth==='reference'?'ref':'mid'))+
    ' '+r.vwc.toFixed(1)+'%');
  advance(stop);
}
function advance(stop){
  S.i++; saveSession();
  var nxt=S.route[S.i];
  var tableDone=S.mode==='sweep' && !stop.spot && (!nxt || nxt.t!==stop.t);
  if(tableDone) beep('tableDone');
  if(!nxt){ setTimeout(finish,450); return; }
  if(tableDone && S.flaggedTable){
    S.flaggedTable=false;
    setTimeout(function(){ openPegs(stop.t); },150);
    render();
    return;
  }
  if(tableDone) S.flaggedTable=false;
  render(); flash();
}

/* ---------------- controls ---------------- */
$('log').addEventListener('click',function(){
  if(LP.fired){ LP.fired=false; return; }
  bigTap();
});
var LP={t:null,fired:false};
$('log').addEventListener('pointerdown',function(){
  LP.fired=false; clearTimeout(LP.t);
  if(!S.roomStarted||!isConn()||S.cal) return;
  LP.t=setTimeout(function(){ LP.fired=true; openCal(); },600);
});
['pointerup','pointerleave','pointercancel'].forEach(function(ev){
  $('log').addEventListener(ev,function(){ clearTimeout(LP.t); });
});
$('log').addEventListener('contextmenu',function(e){ e.preventDefault(); });

$('extra').onclick=function(){
  if(S.awaiting) return;
  var j=S.i-1;
  if(j<0){ toast('take a reading first'); return; }
  var last=S.route[j], t=last.t, pos=last.pos;
  /* 1.7: find the ORIGINAL (non-extra) ref/mid block for this table and
     position, skipping back over any earlier +plant duplicates first. A
     second "+plant" tap at the same spot used to land on its own previous
     extra entry, find nothing behind it, and silently lose the pairing on
     the next plant. Walking past the duplicates first means every tap
     repeats the same original pair rather than an accumulating stack. */
  var end=j; while(end>=0 && S.route[end].t===t && S.route[end].pos===pos && S.route[end].extra) end--;
  var start=end; while(start>=0 && S.route[start].t===t && S.route[start].pos===pos && !S.route[start].extra) start--;
  start++;
  if(start>end){ toast('nothing to repeat'); return; }
  var grp=[];
  for(var k=start;k<=end;k++) grp.push({t:S.route[k].t,pos:S.route[k].pos,depth:S.route[k].depth,extra:true,spot:S.route[k].spot});
  Array.prototype.splice.apply(S.route,[S.i,0].concat(grp));
  S.redo=[]; A.state='air'; A.buf=[];
  saveSession(); render(); flash();
  toast('adjacent plant · '+(last.spot?'spot':'T'+last.t+' '+last.pos));
};
$('skip').onclick=openSkip;
$('undo').onclick=function(){
  if(!S.rows.length){ toast('nothing to undo'); return; }
  var r=S.rows.pop();
  if(S.i>0) S.i--;
  var extraStop=null;
  if(S.route[S.i] && S.route[S.i].extra){ extraStop=S.route.splice(S.i,1)[0]; }
  S.redo.push({row:r, extraStop:extraStop});
  /* A1.4: undoing the reading that raised an alarm takes the alarm with it —
     leaving the banner up made the operator dismiss it a second time. */
  if(S.alarmQueue && S.alarmQueue.length){ S.alarmQueue=[]; renderAlarm(); }
  var key=r.room+'|'+r.table+'|'+r.position+'|'+r.depth;
  if(r._pc) PREV[key]=r._pc; else delete PREV[key];
  lsSet('stab_prev',JSON.stringify(PREV));
  S.last={vwc:r.vwc,ec:r.ec,tmp:r.tmp,bulk:r.bulk,raw:r.raw,direct:true,counts:0};
  S.lastAt=Date.now();
  A.state='hold'; A.buf=[]; A.holdV=r.vwc;
  saveSession(); render(); flash();
  step('undone T'+r.table+' '+r.position+' — pull probe, re-stab');
  toast('undone — re-stab');
};
$('redo').onclick=function(){
  if(!S.redo.length){ toast('nothing to redo'); return; }
  var rec=S.redo.pop();
  if(rec.extraStop) S.route.splice(S.i,0,rec.extraStop);
  S.rows.push(rec.row); S.i++;
  var r=rec.row, key=r.room+'|'+r.table+'|'+r.position+'|'+r.depth;
  PREV[key]={d:r.date,v:r.vwc,e:r.ec,ts:Date.now()};
  lsSet('stab_prev',JSON.stringify(PREV));
  S.last={vwc:r.vwc,ec:r.ec,tmp:r.tmp,bulk:r.bulk,raw:r.raw,direct:true,counts:0};
  S.lastAt=Date.now();
  saveSession(); render(); flash();
  step('redone T'+r.table+' '+r.position+' '+r.vwc.toFixed(1)+'%');
};
$('note').onclick=function(){
  var s=S.route[S.i], t=s?s.t:(S.rows.length?S.rows[S.rows.length-1].table:null);
  if(t==null||t==='?'){ toast('notes are per table'); return; }
  openPegs(t);
};
$('pos').onclick=function(){ openTarget(null); };
$('schedbtn').onclick=openSchedule;
$('schedparse').onclick=function(){
  SCHEDPARSE=parseSchedule($('schedpaste').value);
  drawSchedParse();
};
$('schedok').onclick=function(){
  if(!SCHEDPARSE || !SCHEDPARSE.tables.length) return;
  saveSched(S.room,{savedAt:Date.now(), room:S.room, tables:SCHEDPARSE.tables});
  $('schedsheet').classList.add('hide');
  showBrief();
  toast('schedule saved for '+S.room+' · '+SCHEDPARSE.tables.length+' tables');
};
$('schedclose').onclick=function(){ $('schedsheet').classList.add('hide'); SCHEDPARSE=null; };
$('targetcancel').onclick=function(){ $('targetsheet').classList.add('hide'); TP.forRow=null; };
$('exit').onclick=function(){
  if(S.rows.length && !confirm('End sweep with '+S.rows.length+' readings?')) return;
  finish();
};
$('hstat').onclick=function(){
  if(isConn()){ toast('connected'); return; }
  connect();
};

/* ---------------- pegs ---------------- */
var PEGSEL={};
function openPegs(tbl){
  PEGSEL={};
  S.pegsOpen=true;
  var existing=(S.notes[tbl]||'').split(' · ').filter(Boolean);
  existing.forEach(function(w){ PEGSEL[w]=1; });
  var list=PEGS;
  var rm=RMAP[S.room]||{}, info=rm[String(tbl)]||[''
,''];
  $('pegtop').innerHTML='Table '+tbl+
    '<span class="sm"><b class="st">'+(info[0]||S.room)+
    '</b> · tap only what stands out</span>';
  var h='';
  list.forEach(function(p,pi){
    h+='<div class="pg"><div class="h">'+p[0]+'</div><div class="c">';
    p[1].forEach(function(w){
      h+='<button class="chip'+(PEGSEL[w]?' on':'')+'" data-w="'+w+'">'+w+'</button>';
    });
    h+='</div></div>';
  });
  var known={}; PEGS.forEach(function(p){ p[1].forEach(function(w){ known[w]=1; }); });
  var legacy=Object.keys(PEGSEL).filter(function(w){ return !known[w]; });
  if(legacy.length){
    h+='<div class="pg"><div class="h">from an earlier sweep</div><div class="c">';
    legacy.forEach(function(w){ h+='<button class="chip on" data-w="'+w+'">'+w+'</button>'; });
    h+='</div></div>';
  }
  $('pegs').innerHTML=h;
  $('pegfree').value=(S.free&&S.free[tbl])||'';
  [].forEach.call(document.querySelectorAll('#pegs .chip'),function(b){
    b.onclick=function(){
      b.classList.toggle('on');
      var k=b.dataset.w;
      if(PEGSEL[k]) delete PEGSEL[k]; else PEGSEL[k]=1;
    };
  });
  $('pegdone').onclick=function(){
    var w=Object.keys(PEGSEL);
    if(w.length) S.notes[tbl]=w.join(' · ');
    else delete S.notes[tbl];
    S.free=S.free||{};
    var ft=($('pegfree').value||'').trim();
    if(ft) S.free[tbl]=ft; else delete S.free[tbl];
    S.pegsOpen=false;
    if(A.state==='settling'){ A.buf=[]; A.t0=Date.now(); }
    saveSession();
    $('pegsheet').classList.add('hide');
    render(); flash();
  };
  $('pegsheet').classList.remove('hide');
}

/* ---------------- CAL mode ---------------- */
function getPairs(){
  try{ return JSON.parse(localStorage.getItem('stab_cal')||'[]'); }catch(e){ return []; }
}
function pairStats(media){
  var ps=getPairs().filter(function(p){return p.media===media&&p.off!=null;});
  if(!ps.length) return null;
  var sum=0; ps.forEach(function(p){sum+=p.off;});
  return {n:ps.length, mean:sum/ps.length};
}
function openCal(){
  if(!S.roomStarted) return;
  S.cal=true;
  CAL={stage:'live', frozen:null, released:false, live:S.last};
  $('calsheet').classList.remove('hide');
  beep('cal');
  calPaint();
}
function closeCal(){
  S.cal=false;
  $('calsheet').classList.add('hide');
  if(A.state==='settling'){ A.buf=[]; A.t0=Date.now(); }
  A.state='air'; A.buf=[];
  setBig();
  if(!isConn()) step('probe released — tap RECONNECT');
}
function calPaint(){
  var media=S.room?ROOMS[S.room].media:'Bio365';
  $('calrm').textContent=S.room+' · '+media+' · offset '+offsetFor(media).toFixed(2);
  var b=$('calbody'), f=$('calfoot'), n=getPairs().length;
  if(CAL.stage==='live'){
    var r=CAL.live||S.last;
    b.innerHTML=(r?
      '<div class="calrow"><div class="callab">live</div>'+
      '<div class="calbig">'+r.vwc.toFixed(1)+'<span class="u"> %</span>&nbsp;&nbsp;'+
      (r.ec==null?'--':r.ec.toFixed(2))+'<span class="u"> EC</span></div>'+
      '<div class="calres">bulk '+r.bulk.toFixed(3)+' · '+r.tmp.toFixed(1)+' °C · counts '+r.counts.toFixed(1)+'</div></div>'
      :'<div class="calrow"><div class="calbig">--</div></div>')+
      '<div class="calnote">Stab, wait for the numbers to steady, then capture. The probe stays put until you\'ve read it in Aroya too.</div>';
    f.innerHTML='<button class="pri" data-act="cap">Capture</button>'+
      '<button class="sec" data-act="exp">Pairs · '+n+' · export</button>';
  }else if(CAL.stage==='frozen'){
    var z=CAL.frozen;
    b.innerHTML='<div class="calrow"><div class="callab">captured — hold the probe still</div>'+
      '<div class="calbig">'+z.vwc.toFixed(1)+'<span class="u"> %</span>&nbsp;&nbsp;'+
      (z.ec==null?'--':z.ec.toFixed(2))+'<span class="u"> EC</span></div>'+
      '<div class="calres">bulk '+z.bulk.toFixed(3)+' · '+z.tmp.toFixed(1)+' °C · counts '+z.counts.toFixed(1)+'</div></div>'+
      '<div class="calnote">Release drops the Bluetooth link so Aroya can connect. Keep the probe exactly where it is.</div>';
    f.innerHTML='<button class="pri" data-act="rel">Release probe</button>'+
      '<button class="sec" data-act="retake">Retake</button>';
  }else if(CAL.stage==='enter'){
    b.innerHTML='<div class="calnote">Connect Aroya, read the same stab, then enter its numbers.</div>'+
      '<div class="calrow"><div class="callab">Aroya VWC %</div>'+
      '<input class="calin" id="caV" inputmode="decimal" placeholder="56.0"></div>'+
      '<div class="calrow"><div class="callab">Aroya pore EC</div>'+
      '<input class="calin" id="caE" inputmode="decimal" placeholder="3.13"></div>';
    f.innerHTML='<button class="pri" data-act="save">Save pair</button>';
  }else{ /* saved */
    var p=CAL.saved, st=pairStats(p.media);
    b.innerHTML='<div class="calrow"><div class="callab">pair saved</div>'+
      '<div class="calres">this pair offset <b>'+(p.off==null?'—':p.off.toFixed(2))+'</b><br>'+
      (st?'mean <b>'+st.mean.toFixed(2)+'</b> · n='+st.n+' ('+p.media+')<br>':'')+
      'ΔVWC '+(p.dv>=0?'+':'')+p.dv.toFixed(1)+' vs Aroya<br>'+
      'applied in app: '+offsetFor(p.media).toFixed(2)+'</div></div>'+
      '<div class="calnote">Offsets update in code once a media has 4–6 agreeing pairs.</div>';
    f.innerHTML='<button class="pri" data-act="recon">Reconnect · another pair</button>'+
      '<button class="sec" data-act="exp">Export pairs</button>'+
      '<button class="sec" data-act="done">Done</button>';
  }
}
$('calx').onclick=closeCal;
$('calfoot').addEventListener('click',function(e){
  var b=e.target.closest('button'); if(!b) return;
  var act=b.dataset.act;
  if(act==='cap'){
    var r=CAL.live||S.last;
    if(!r||!r.counts){ toast('no live reading yet'); return; }
    CAL.frozen=r; CAL.stage='frozen'; beep('cal'); calPaint();
  }else if(act==='retake'){
    CAL.stage='live'; calPaint();
  }else if(act==='rel'){
    CAL.released=true; CAL.stage='enter';
    try{ if(S.dev&&S.dev.gatt&&S.dev.gatt.connected) S.dev.gatt.disconnect(); }catch(e){}
    calPaint();
  }else if(act==='save'){
    var aV=parseFloat(($('caV').value||'').replace(',','.'));
    var aE=parseFloat(($('caE').value||'').replace(',','.'));
    if(isNaN(aV)&&isNaN(aE)){ toast('enter at least one Aroya number'); return; }
    var z=CAL.frozen, media=ROOMS[S.room].media;
    var eb=permCounts(z.counts), ep=80.3-0.37*(z.tmp-20);
    var off=(!isNaN(aE)&&aE>0.05&&z.bulk>0.005)?+(eb-ep*z.bulk/aE).toFixed(2):null;
    var pair={ts:Date.now(),
      date:new Date().toLocaleDateString('en-US'),
      time:new Date().toLocaleTimeString('en-US',{hour12:false}),
      room:S.room, media:media, counts:z.counts, vwc:z.vwc, ec:z.ec, bulk:z.bulk,
      tmp:z.tmp, raw:z.raw, aV:(isNaN(aV)?null:aV), aE:(isNaN(aE)?null:aE), off:off};
    var ps=getPairs(); ps.push(pair);
    lsSet('stab_cal',JSON.stringify(ps));
    CAL.saved={media:media, off:off, dv:(isNaN(aV)?0:z.vwc-aV)};
    CAL.stage='saved'; beep('cal'); calPaint();
  }else if(act==='recon'){
    connect();
    toast('reconnecting…');
  }else if(act==='done'){
    closeCal();
  }else if(act==='exp'){
    var ps2=getPairs();
    if(!ps2.length){ toast('no pairs yet'); return; }
    var head='Date,Time,Room,Media,Counts,App VWC,App pore EC,App bulk,Temp C,Aroya VWC,Aroya EC,Implied offset,Raw\n';
    var body=ps2.map(function(p){
      return [p.date,p.time,p.room,csvq(p.media),p.counts,p.vwc,(p.ec==null?'':p.ec),p.bulk,p.tmp,
        (p.aV==null?'':p.aV),(p.aE==null?'':p.aE),(p.off==null?'':p.off),csvq(p.raw)].join(',');
    }).join('\n');
    shareOrCopy(head+body,'cal_pairs_'+fnameDate()+'.csv','pairs');
  }
});

/* ---------------- finish / done ---------------- */
function fnameDate(){
  var d=new Date();
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)+
    '_'+('0'+d.getHours()).slice(-2)+('0'+d.getMinutes()).slice(-2);
}
var CSV_TEXT='', CSV_NAME='';
function canShareFiles(){
  try{
    return !!(navigator.canShare &&
      navigator.canShare({files:[new File([''],'t.csv',{type:'text/csv'})]}));
  }catch(e){ return false; }
}
function shareOrCopy(text,name,label){
  if(canShareFiles()){
    var f=new File([text],name,{type:/\.json$/.test(name)?'application/json':'text/csv'});
    navigator.share({files:[f]}).then(function(){ toast(label+' shared'); })
      .catch(function(){});
  }else{
    var ta=$('csv'); var old=ta.value; ta.value=text; ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    if(navigator.clipboard) navigator.clipboard.writeText(text).catch(function(){});
    ta.value=old;
    toast(label+' copied');
  }
}


/* ============ EVENT LOG ============
   Shots, faults and bulbs. One store, one shape, so an end-of-day roll-up
   and a maintenance message can both be generated from it. */
function getEv(){
  try{
    var a=JSON.parse(localStorage.getItem('stab_events')||'[]');
    if(Array.isArray(a)) return a;          /* v0 */
    return (a && a.v===1 && Array.isArray(a.items)) ? a.items : [];
  }catch(e){ return []; }
}
function addEv(e){
  e.ts=Date.now();
  e.when=new Date().toLocaleString('en-US');
  e.op=S.op||'';
  var a=getEv(); a.unshift(e);
  lsSet('stab_events',JSON.stringify({v:1,items:a.slice(0,400)}));
  return e;
}
function evToday(){
  var d=new Date(); d.setHours(0,0,0,0);
  return getEv().filter(function(e){ return e.ts>=d.getTime(); });
}
function mlFor(room,mins){
  var cfg=ROOMS[room]; if(!cfg) return null;
  var rate = (room.charAt(0)==='A') ? 70 : 95;   /* mL per plant per minute */
  return Math.round(mins*rate);
}
/* Maintenance message in the format the Teams thread expects: room first,
   then table, then what is wrong. Chris has had to ask "what room" before. */
function faultMsg(e){
  return e.room+(e.table?' T'+e.table:'')+' — '+e.what+(e.detail?'. '+e.detail:'');
}
function bulbMsg(e){
  return e.room+' — '+e.n+' bulb'+(e.n>1?'s':'')+' out over T'+e.tables;
}

function finish(){
  if(S.finished) return;
  S.finished=true;
  S.awaiting=false; clearTimeout(S.rt);
  releaseAwake();
  ['hdr','route','main','pad'].forEach(function(id){$(id).classList.add('hide');});
  $('pegsheet').classList.add('hide'); $('calsheet').classList.add('hide');
  $('logsheet').classList.add('hide'); S.pegsOpen=false; S.logOpen=false;
  $('targetsheet').classList.add('hide'); TP.forRow=null;
  $('done').classList.remove('hide');
  /* A §2.1: medians and below-floor counts are over MEASURED tables only,
     and the coverage line below says how many that was. */
  var msd=measuredRows();
  var v=msd.filter(function(r){return r.depth==='reference';})
           .map(function(r){return r.vwc;}).sort(function(a,b){return a-b;});
  var m=v.length?med(v):null;
  var lows=msd.filter(function(r){return r.flag;}).length;
  var dur=S.startedAt?Date.now()-S.startedAt:0;
  var clean=(DBG.timeouts===0 && S.skips===0 && S.unstable===0);
  /* previous same-room sweep for delta + PR */
  var hist=getHist(), prev=null, pr=null;
  for(var i=0;i<hist.length;i++){
    var h=hist[i];
    if(h.room!==S.room) continue;
    if(h.mode && h.mode!=='sweep') continue;
    if(!prev && h.med!=null) prev=h;
    if(h.clean && h.dur){ if(pr==null||h.dur<pr) pr=h.dur; }
  }
  $('dtitle').textContent=S.room+' · '+S.rows.length+' readings';
  var html='reference median <b class="big">'+(m==null?'--':m.toFixed(1)+'%')+'</b>';
  if(prev && m!=null){
    var dm=m-prev.med;
    html+=' &nbsp;Δ '+(dm>=0?'+':'')+dm.toFixed(1)+' vs '+(prev.when?prev.when.split(',')[0]:'last');
  }
  html+='<br>';
  if(v.length) html+='range '+v[0].toFixed(1)+' – '+v[v.length-1].toFixed(1)+'%<br>';
  html+='below floor '+lows+' of '+msd.length+' · misses '+DBG.timeouts+'<br>';
  html+='<span'+(coverage().skipped?' class="low"':'')+'>'+coverageLine()+'</span><br>';
  var dead=S.rows.filter(function(r){return r.zeroEc;});
  if(dead.length) html+='<span class="low">'+dead.length+' dead bag'+(dead.length>1?'s':'')+' flagged — '+
    dead.map(function(r){return 'T'+r.table+' '+r.position;}).join(', ')+'</span><br>';
  html+='time '+fmtDur(dur);
  if(S.mode==='sweep'){
    if(clean){
      html+=' · <span class="pr">clean ✓</span>';
      if(pr==null || dur<pr) html+=' <span class="pr">new PR</span>';
      else html+=' · PR '+fmtDur(pr);
    }else if(pr!=null) html+=' · PR '+fmtDur(pr);
  }
  html+='<br>operator '+S.op+' · side '+S.side;
  $('stats').innerHTML=html;
  /* CSV: original 22 columns, then appended */
  var head='Date,Time,Room,Table,Position,Depth,Plant,Strain,Flags,Hrs since shot,Mode,Dir,Bag gal,Media,Side,VWC,Pore EC,Bulk EC,Temp F,Below floor,Row notes,Raw,Feed EC,Feed pH,Operator,Frame,Batt,Lat ms,Settle n,Unstable,Implausible,Manual commit,Zero EC flag,Skipped,After mid-sweep shot\n';
  var lines=S.rows.map(function(r){
    return [r.date,r.time,r.room,r.table,r.position,r.depth,r.plant,csvq(r.strain),r.flags,r.hrs,
      r.mode,r.dir,r.bag,r.media,r.side,r.vwc,(r.ec==null?'':r.ec),r.bulk,
      (r.tmp*9/5+32).toFixed(1),(r.flag?'YES':''),csvq(rowNote(r.table)),csvq(r.raw),
      (r.feedEC==null?'':r.feedEC),(r.feedPH==null?'':r.feedPH),r.op||'',r.frame||'',(r.batt==null?'':r.batt),(r.lat==null?'':r.lat),(r.tries==null?'':r.tries),(r.unstable?'YES':''),(r.implaus?'YES':''),
      (r.manualCommit?'YES':''),(r.zeroEc?'YES':''),csvq(skipReason(r.table)),(r.postShot?'YES':'')].join(',');
  });
  /* A §2.1: a table that was never measured leaves no row, so the skip was
     invisible in the export — B-1 shipped 18 rows for three tables with no
     record that eight were skipped or why. One record row per skipped table,
     measurements empty, carries it. */
  var cols=head.trim().split(',');
  var nCols=cols.length, iSkip=cols.indexOf('Skipped');
  var skD=new Date().toLocaleDateString('en-US');
  var skT=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  skippedList().sort(function(a,b){return (+a)-(+b);}).forEach(function(t){
    if(S.rows.some(function(r){ return String(r.table)===String(t); })) return;
    var cells=[]; while(cells.length<nCols) cells.push('');
    cells[0]=skD; cells[1]=skT; cells[2]=S.room; cells[3]=t;
    cells[10]=S.mode; cells[11]=S.dir;
    cells[12]=ROOMS[S.room]?ROOMS[S.room].bag:''; cells[13]=ROOMS[S.room]?ROOMS[S.room].media:'';
    cells[14]=S.side; cells[24]=S.op||'';
    cells[iSkip]=csvq(skipReason(t));
    lines.push(cells.join(','));
  });
  var body=lines.join('\n');
  CSV_TEXT=head+body;
  CSV_NAME=S.room+'_'+fnameDate()+'.csv';
  $('csv').value=CSV_TEXT;
  WB_TEXT=buildWorkbook();
  ROW_TEXT=buildRowNotes(); ROOM_TEXT=buildRoomNotes();
  $('wbrow').value=ROW_TEXT; $('wbroom').value=ROOM_TEXT;
  /* A §3: the CHECK rules still run — they are read here and land in the
     CSV, they just never go into the shared notes column. */
  var ck=checkLines();
  $('checks').innerHTML=ck.length
    ? ck.map(function(l){ return '<div class="ck">'+l.replace(/</g,'&lt;')+'</div>'; }).join('')
    : 'nothing flagged';
  var none=ROOM_TEXT==='';
  $('wbroomnone').classList.toggle('hide',!none);
  $('wbroom').classList.toggle('hide',none);
  $('copyroom').parentNode.classList.toggle('hide',none);
  try{
    if(DEMO) throw 0;
    var h2=getHist();
    h2.unshift({room:S.room, when:new Date().toLocaleString('en-US'), ts:Date.now(),
      n:S.rows.length, mode:S.mode, dir:S.dir, med:(m==null?null:+m.toFixed(1)), low:lows,
      dur:dur, clean:clean, csv:CSV_TEXT, wb:WB_TEXT, wbrow:ROW_TEXT, wbroom:ROOM_TEXT,
      dbg:{polls:DBG.polls,directs:DBG.directs,writeFails:DBG.writeFails,timeouts:DBG.timeouts,unstable:S.unstable||0},
      notes:JSON.parse(JSON.stringify(S.notes||{})), free:JSON.parse(JSON.stringify(S.free||{}))});
    saveHist(h2);
  }catch(e){}
  clearSession();
  PREF.lastDir=S.dir; savePrefs();
  if(!canShareFiles()) $('share').style.display='none';
  $('dbg').textContent='pkts '+DBG.pkts+' · polls '+DBG.polls+' · direct '+DBG.directs+
    ' · status '+DBG.statusFrames+' · writeFail '+DBG.writeFails+' · timeouts '+DBG.timeouts+
    ' · lastLat '+(S.lastLat==null?'—':S.lastLat+'ms')+
    (DBG.unparsed.length?('\n\nunparsed:\n'+DBG.unparsed.join('\n')):'\n\nno unparsed packets');
  showHist();
  beep('sweepDone');
}
function showHist(){
  var el=$('hist'); if(!el) return;
  var h=getHist();
  if(h.length<2){ el.innerHTML=''; return; }
  el.innerHTML='<div class="hl">earlier sweeps</div>'+h.slice(1).map(function(x,i){
    return '<button class="hb" data-i="'+(i+1)+'">'+x.room+' · '+x.n+' · '+
      (x.when?x.when.split(', ')[1]||x.when:'')+'</button>';
  }).join('');
  [].forEach.call(el.querySelectorAll('.hb'),function(b){
    b.onclick=function(){
      var hh=getHist(), it=hh[+b.dataset.i]; if(!it) return;
      $('csv').value=it.csv;
      $('wbrow').value=it.wbrow||'';
      $('wbroom').value=it.wbroom||it.wb||'';
      var ns=[]; var nn=it.notes||{}, ff=it.free||{};
      Object.keys(nn).forEach(function(k){ ns.push('T'+k+' '+nn[k]+(ff[k]?'. '+ff[k]:'')); });
      Object.keys(ff).forEach(function(k){ if(!nn[k]) ns.push('T'+k+' '+ff[k]); });
      $('histnotes').innerHTML = ns.length
        ? '<div class="hl">'+it.room+' notes · '+(it.when||'')+'</div>'+
          ns.map(function(x){return '<div class="hn">'+x+'</div>';}).join('')
        : '<div class="hl">'+it.room+' · no table notes</div>';
      var t=$('wbroom').value?$('wbroom'):$('csv');
      t.select();
      if(navigator.clipboard) navigator.clipboard.writeText(t.value).catch(function(){});
      toast('loaded '+it.room);
    };
  });
}
$('share').onclick=function(){
  if(!CSV_TEXT) return;
  var f=new File([CSV_TEXT],CSV_NAME,{type:'text/csv'});
  navigator.share({files:[f]}).then(function(){ S.shared=true; toast('CSV shared'); })
    .catch(function(){});
};
$('copy').onclick=function(){
  var t=$('csv');
  t.select(); t.setSelectionRange(0,999999);
  var ok=false;
  try{ ok=document.execCommand('copy'); }catch(e){}
  S.copied=true;
  if(navigator.clipboard) navigator.clipboard.writeText(t.value)
    .then(function(){toast('CSV copied');},function(){});
  else toast(ok?'CSV copied':'select the text and copy');
};
function copyBox(id,label){
  var t=$(id);
  t.select(); t.setSelectionRange(0,999999);
  var ok=false;
  try{ ok=document.execCommand('copy'); }catch(e){}
  S.copied=true;
  if(navigator.clipboard) navigator.clipboard.writeText(t.value)
    .then(function(){toast(label+' copied');},function(){});
  else toast(ok?(label+' copied'):'select the text and copy');
}
$('copyrow').onclick=function(){ copyBox('wbrow','row notes'); };
$('copyroom').onclick=function(){ copyBox('wbroom','room notes'); };
$('discard').onclick=function(){
  if(!confirm('Discard this sweep? '+S.rows.length+' readings will be deleted and no history kept.')) return;
  try{
    var h=getHist();
    if(h.length && h[0].room===S.room){ h.shift(); lsSet('stab_hist',JSON.stringify(h)); }
  }catch(e){}
  clearSession();
  releaseAwake();
  location.reload();
};
$('more').onclick=function(){
  if(S.rows.length && !S.copied && !S.shared &&
     !confirm('Start a new room? Share or copy the CSV first if you have not.')) return;
  releaseAwake();
  location.reload();
};



/* ============ END OF DAY ROLL-UP ============ */
function buildEOD(){
  var d=new Date(), ds=d.toLocaleDateString('en-US');
  var h=getHist().filter(function(x){ var t=new Date(x.ts||0); t.setHours(0,0,0,0);
    var dd=new Date(); dd.setHours(0,0,0,0);
    if(ROOMS[x.room] && ROOMS[x.room].kind) return false;   /* fixture, not a room */
    return t.getTime()===dd.getTime(); });
  var ev=evToday();
  var out=['FERTIGATION — '+ds+'  ·  '+(S.op||'')];
  out.push('');
  if(h.length){
    out.push('SWEPT  '+h.length+' room'+(h.length>1?'s':''));
    h.slice().reverse().forEach(function(x){
      out.push('  '+x.room+'  median '+(x.med==null?'--':x.med.toFixed(1))+
        '  ·  '+x.n+' stabs  ·  '+(x.when||'').split(', ')[1]);
    });
  } else out.push('SWEPT  none');
  var shots=ev.filter(function(e){return e.kind==='shot';});
  if(shots.length){
    out.push(''); out.push('SHOTS');
    shots.slice().reverse().forEach(function(e){ out.push('  '+summarizeEv(e)); });
  }
  var f=ev.filter(function(e){return e.kind==='fault';});
  if(f.length){
    out.push(''); out.push('FAULTS');
    f.slice().reverse().forEach(function(e){ out.push('  '+faultMsg(e)); });
  }
  var b=ev.filter(function(e){return e.kind==='bulb';});
  if(b.length){
    out.push(''); out.push('BULBS');
    b.slice().reverse().forEach(function(e){ out.push('  '+bulbMsg(e)); });
  }
  var ro=ev.filter(function(e){return e.kind==='runoff';});
  if(ro.length){
    out.push(''); out.push('RUNOFF');
    ro.slice().reverse().forEach(function(e){ out.push('  '+summarizeEv(e)); });
  }
  var openf=getEv().filter(function(e){
    return (e.kind==='fault'||e.kind==='bulb') && e.status==='open'; });
  if(openf.length){
    out.push(''); out.push('STILL OPEN');
    openf.forEach(function(e){
      var age=Math.floor((Date.now()-e.ts)/86400000);
      out.push('  '+(e.kind==='fault'?faultMsg(e):bulbMsg(e))+
        (age>0?'  ('+age+'d)':'  (today)'));
    });
  }
  /* coverage: rooms not seen in three days */
  var latest={}; getHist().forEach(function(x){
    if(!latest[x.room]||x.ts>latest[x.room]) latest[x.room]=x.ts; });
  var stale=Object.keys(ROOMS).filter(function(k){
    return !ROOMS[k].kind && (!latest[k] || (Date.now()-latest[k])>3*86400000); });
  if(stale.length){
    out.push(''); out.push('NOT SEEN IN 3 DAYS  '+stale.join(' · '));
  }
  return out.join('\n');
}

/* ---------------- log sheet ---------------- */
var LOGKIND='shot';
function openLog(kind){
  LOGKIND=kind||'shot';
  S.logOpen=true;
  $('logtop').textContent='Log · '+(S.room||'');
  drawLog();
  [].forEach.call(document.querySelectorAll('#logtabs .lgt'),function(b){
    b.classList.toggle('on', b.dataset.k===LOGKIND);
    b.onclick=function(){ LOGKIND=b.dataset.k; openLog(LOGKIND); };
  });
  $('logsave').style.display=(LOGKIND==='flush')?'none':'';
  $('logsheet').classList.remove('hide');
}
function fld(label,inner){ return '<div class="f"><label>'+label+'</label>'+inner+'</div>'; }

/* Room history on the picker — three numbers and any open faults, so the
   walk to the room primes the brain before the first stab. */
/* Bag size and feed EC are asked at room start rather than hardcoded.
   C3 ran a 1.25-gal route on 2-gal bags on 9/2 and mislabelled the depth
   pairs; the dilution CHECK rule was using a fixed 2.5 while tank A ran 3.2. */
function roomCfg(){
  try{ return JSON.parse(localStorage.getItem('stab_roomcfg')||'{}'); }catch(e){ return {}; }
}
/* Imported schedules, keyed by room. Late-bound the same way getHist is, so
   pure.js can reach them without knowing about storage. Addendum B §4. */
function getSched(){
  try{ return JSON.parse(localStorage.getItem('stab_sched')||'{}'); }catch(e){ return {}; }
}
function saveSched(rm,rec){
  var a=getSched(); a[rm]=rec; lsSet('stab_sched',JSON.stringify(a));
}

/* ---------------- schedule paste-in (Addendum B §4) ----------------
   Copy the room's whole schedule screen out of Growlink, paste, check what
   was read, commit. The verification step is the point: a paste that was
   misread and silently trusted is how hours-since-shot goes wrong, which is
   the bug this feature exists to kill. */
var SCHEDPARSE=null;
function openSchedule(){
  if(!S.room){ toast('pick a room first'); return; }
  SCHEDPARSE=null;
  $('schedtop').textContent='Schedule · '+S.room;
  $('schedpaste').value='';
  var cur=getSched()[S.room];
  $('schedbody').innerHTML=cur
    ? '<div class="sn">last imported '+(cur.savedAt?new Date(cur.savedAt).toLocaleString('en-US'):'—')+
      ' · '+cur.tables.length+' tables</div>'
    : '<div class="sn">nothing imported yet — this room falls back to the weekly file</div>';
  $('schedok').classList.add('hide');
  $('schedsheet').classList.remove('hide');
}
function schedFmt(sec){
  if(sec==null) return '—';
  var m=Math.floor(sec/60), r=Math.round(sec%60);
  return m+'m'+(r?' '+r+'s':'');
}
function drawSchedParse(){
  var r=SCHEDPARSE;
  if(!r || !r.tables.length){
    $('schedbody').innerHTML='<div class="sn bad">nothing read from that paste — is it the whole room screen?</div>';
    $('schedok').classList.add('hide');
    return;
  }
  var wrongRoom=(r.room && r.room!==S.room);
  var h='';
  if(wrongRoom) h+='<div class="sn bad">that paste says '+r.room+', you are on '+S.room+'</div>';
  h+='<div class="sn">'+r.tables.length+' table'+(r.tables.length>1?'s':'')+' read'+
     (r.warnings.length?' · '+r.warnings.length+' thing'+(r.warnings.length>1?'s':'')+' to look at':'')+'</div>';
  h+='<table class="sched"><tr><th>T</th><th>start</th><th>shot</th><th>every</th><th>x</th><th>total</th></tr>';
  r.tables.forEach(function(t){
    var p=t.P1||{};
    var bad=(t.reconciles===false);
    h+='<tr'+(bad?' class="bad"':'')+'><td>'+t.table+(t.shared?'<span class="sh">+</span>':'')+'</td>'+
       '<td>'+(p.start?fmt12(+p.start.split(':')[0],p.start.split(':')[1]):'—')+'</td>'+
       '<td>'+schedFmt(p.duration)+'</td>'+
       '<td>'+(p.interval?(p.interval/3600).toFixed(1)+'h':'—')+'</td>'+
       '<td>'+(p.frequency||'—')+'</td>'+
       '<td>'+schedFmt(t.runtimeSec)+(bad?' ⚠':'')+'</td></tr>';
    if(t.P2) h+='<tr class="p2"><td>P2</td><td>'+(t.P2.start||'—')+'</td><td>'+schedFmt(t.P2.duration)+
       '</td><td>'+(t.P2.interval?(t.P2.interval/3600).toFixed(1)+'h':'—')+'</td><td>'+(t.P2.frequency||'—')+'</td><td></td></tr>';
  });
  h+='</table>';
  var bad=r.tables.filter(function(t){ return t.reconciles===false; });
  if(bad.length) h+='<div class="sn bad">⚠ T'+bad.map(function(t){return t.table;}).join(', T')+
    ': shot x frequency does not match the total runtime, so something was misread</div>';
  if(r.warnings.length) h+='<div class="sn bad">'+r.warnings.join('<br>')+'</div>';
  $('schedbody').innerHTML=h;
  $('schedok').classList.toggle('hide', wrongRoom);
}
function saveRoomCfg(rm,o){
  var a=roomCfg(); a[rm]=o; lsSet('stab_roomcfg',JSON.stringify(a));
}
function showRoomCfg(){
  var el=$('roomcfg'); if(!el) return;
  if(!S.room){ el.classList.add('hide'); return; }
  var saved=roomCfg()[S.room]||{};
  $('cfg_bag').value=String(saved.bag||(ROOMS[S.room]?ROOMS[S.room].bag:2));
  $('cfg_ec').value = saved.ec!=null ? saved.ec : (FEEDEC[S.room]||'');
  $('cfg_ph').value = saved.ph!=null ? saved.ph : '';
  el.classList.remove('hide');
}
function applyRoomCfg(){
  if(!S.room || !ROOMS[S.room]) return;
  var bag=parseFloat($('cfg_bag')?$('cfg_bag').value:0)||ROOMS[S.room].bag;
  var ecTxt=($('cfg_ec')?$('cfg_ec').value:'').trim().toLowerCase();
  /* "0", "w" or "water" means the room is on water; blank keeps the last known feed */
  var ec=(ecTxt==='0'||ecTxt==='w'||ecTxt==='water')?0:parseFloat(ecTxt);
  var ph=parseFloat($('cfg_ph')?$('cfg_ph').value:0);
  ROOMS[S.room].bag=bag;
  if(!isNaN(ec) && ec>=0) FEEDEC[S.room]=ec;
  S.feedEC=(!isNaN(ec)&&ec>=0)?ec:FEEDEC[S.room];
  S.feedPH=(!isNaN(ph)&&ph>0)?ph:null;
  saveRoomCfg(S.room,{bag:bag, ec:S.feedEC, ph:S.feedPH});
}
function loadRoomCfgAll(){
  var a=roomCfg();
  Object.keys(a).forEach(function(k){
    if(ROOMS[k] && a[k].bag) ROOMS[k].bag=a[k].bag;
    if(a[k].ec!=null && !isNaN(+a[k].ec)) FEEDEC[k]=+a[k].ec;
  });
}
function showRoomHistory(){
  var el=$('roomhist'); if(!el) return;
  if(!S.room || !PREF.showHist){ el.innerHTML=''; return; }
  var h=getHist().filter(function(x){return x.room===S.room && x.med!=null;}).slice(0,4);
  el.innerHTML=h.length
    ? h.map(function(x){
        var d=(x.when||'').split(',')[0];
        return d+' <span class="k">'+x.med.toFixed(1)+'</span>';
      }).join('  ·  ')
    : 'no history';
}
/* A §5: the pre-walk brief and the post-sweep review are the same picture.
   Tapping a room tile gives it before the walk instead of only at the end —
   last sweep, where the schedule is, and anything still open. */
function showBrief(){
  var el=$('brief'); if(!el) return;
  if(!S.room || !ROOMS[S.room]){ el.classList.add('hide'); el.innerHTML=''; return; }
  var esc=function(x){ return String(x).replace(/</g,'&lt;'); };
  var cfg=ROOMS[S.room], rows=[];
  var h=getHist().filter(function(x){
    return x.room===S.room && x.med!=null && (!x.mode||x.mode==='sweep'); });
  var last=h[0];
  rows.push(['last', last
    ? (last.when||'')+' · median '+last.med.toFixed(1)+
      (last.low!=null?' · '+last.low+' below floor':'')
    : 'no sweep recorded']);
  var dof=dofNow(S.room);
  rows.push(['room', (dof===''?'DOF —':'DOF '+dof)+' · '+cfg.bag+' gal · '+cfg.t+' tables'+
    (FEEDEC[S.room]!=null?' · feed '+(FEEDEC[S.room]||'water'):'')]);
  var sc=schedLine(S.room);
  if(sc){
    var hs=hoursSinceShot(S.room), nx=hoursToNextShot(S.room);
    rows.push(['shots', sc]);
    rows.push(['now', (hs==null?'—':hs.toFixed(1)+'h since last shot')+
      (nx==null?'':' · next in '+nx.toFixed(1)+'h')]);
  }
  /* §4: say out loud which schedule those two lines came from. The weekly
     file goes stale between grows and looks exactly like a current one. */
  var imp=getSched()[S.room];
  var sb=$('schedbtn');
  if(sb){
    sb.classList.toggle('set',!!imp);
    sb.textContent=imp
      ? 'irrigation schedule · imported '+new Date(imp.savedAt).toLocaleDateString('en-US')+
        ' · '+imp.tables.length+' tables'
      : 'irrigation schedule · paste one in (using the weekly file)';
  }
  var open=getEv().filter(function(e){
    return e.room===S.room && (e.kind==='fault'||e.kind==='bulb') && e.status==='open'; });
  if(open.length) rows.push(['open', open.map(function(e){
    return e.kind==='fault'?faultMsg(e):bulbMsg(e); }).join(' · ')]);
  el.innerHTML=rows.map(function(r){
    return '<div class="br"><span class="bk">'+r[0]+'</span>'+esc(r[1])+'</div>';
  }).join('');
  el.classList.remove('hide');
}

function syncModeUI(){
  var tp=$('triagepick');
  if(!tp) return;
  if(S.mode==='triage' && S.room && ROOMS[S.room] && !ROOMS[S.room].kind){
    tp.classList.remove('hide');
    var n=ROOMS[S.room].t, h='';
    for(var t=1;t<=n;t++)
      h+='<button data-t="'+t+'"'+((S.triage||[]).indexOf(t)>=0?' class="on"':'')+'>'+t+'</button>';
    $('tpick').innerHTML=h;
    [].forEach.call($('tpick').children,function(b){
      b.onclick=function(){
        var t=+b.dataset.t; S.triage=S.triage||[];
        var i=S.triage.indexOf(t);
        if(i>=0) S.triage.splice(i,1); else S.triage.push(t);
        S.triage.sort(function(x,y){return x-y;});
        b.classList.toggle('on');
      };
    });
  } else tp.classList.add('hide');
}
function drawLog(){
  var rm=S.room||'', h='';
  if(LOGKIND==='shot'){
    h+=fld('room','<input id="lg_room" value="'+rm+'">');
    h+=fld('tables — blank means whole room','<input id="lg_tables" placeholder="5  or  7,8">');
    h+=fld('minutes','<input id="lg_min" inputmode="decimal" value="12">');
    h+=fld('source','<select id="lg_src"><option>feed</option><option>water</option></select>');
    h+=fld('why','<div class="chips" id="lg_why">'+
      ['dry','drooping','flagging','wilted','kink fixed','valve fixed','prime','other']
        .map(function(w){return '<button class="chip" data-w="'+w+'">'+w+'</button>';}).join('')+'</div>');
    h+=fld('note','<textarea id="lg_note" rows="2"></textarea>');
  } else if(LOGKIND==='fault'){
    h+=fld('room','<input id="lg_room" value="'+rm+'">');
    h+=fld('table — blank if room level','<input id="lg_table" placeholder="5">');
    h+=fld('what','<div class="chips" id="lg_what">'+
      ['valve not opening','valve clicks, no flow','leak','kinked line','unhooked dripper',
       'dual source','no master valve','breaker reset','header crack']
        .map(function(w){return '<button class="chip" data-w="'+w+'">'+w+'</button>';}).join('')+'</div>');
    h+=fld('detail','<textarea id="lg_detail" rows="2" placeholder="crack before the screen in the header"></textarea>');
  } else if(LOGKIND==='bulb'){
    h+=fld('room','<input id="lg_room" value="'+rm+'">');
    h+=fld('over which tables','<input id="lg_tables" placeholder="2,3  or  9">');
    h+=fld('how many out','<input id="lg_n" inputmode="numeric" value="1">');
    h+=fld('note','<textarea id="lg_note" rows="2"></textarea>');
  } else if(LOGKIND==='flush'){
    var done=flushDone();
    h='<div class="hl">flush plan · tap a room when it is done</div><div id="fplan">';
    Object.keys(ROOMS).filter(function(k){return !ROOMS[k].kind;}).forEach(function(k){
      var water=(FEEDEC[k]===0);
      var mins=flushMins(k);
      var lbl=k+'  '+(water?'on water — skip':mins+' min')+
        (k==='A2'?'   T1/T2 25 · T3-T12 50':'');
      var open=getEv().filter(function(e){
        return e.room===k && (e.kind==='fault') && e.status==='open'; }).length;
      h+='<button class="fp'+(done[k]?' on':'')+(water?' skip':'')+'" data-r="'+k+'">'+
         lbl+(open?'   ⚠ open fault':'')+'</button>';
    });
    h+='</div>';
    $('logbody').innerHTML=h;
    [].forEach.call(document.querySelectorAll('#fplan .fp'),function(b){
      b.onclick=function(){
        var d=flushDone(), k=b.dataset.r;
        if(d[k]) delete d[k]; else d[k]=Date.now();
        lsSet('stab_flush',JSON.stringify(d));
        b.classList.toggle('on');
      };
    });
    $('logrecent').innerHTML='<div class="hl">after the flush</div>'+
      '<div class="r">stab three tables per room about an hour after it drains — that is the field capacity reading</div>';
    return;
  } else {
    h+=fld('room','<input id="lg_room" value="'+rm+'">');
    h+=fld('table','<input id="lg_table" placeholder="3">');
    h+=fld('pass','<select id="lg_pass"><option>1</option><option>2</option><option>3</option></select>');
    h+=fld('volume mL — dry if none','<input id="lg_vol" placeholder="400 or dry">');
    h+=fld('runoff EC','<input id="lg_ec" inputmode="decimal" placeholder="6.0">');
    h+=fld('runoff pH','<input id="lg_ph" inputmode="decimal" placeholder="6.3">');
  }
  $('logbody').innerHTML=h;
  [].forEach.call(document.querySelectorAll('#logbody .chip'),function(b){
    b.onclick=function(){
      var p=b.parentNode;
      if(p.id==='lg_what'){ [].forEach.call(p.children,function(c){c.classList.remove('on');}); }
      b.classList.toggle('on');
    };
  });
  var recent=getEv().filter(function(e){return e.kind===LOGKIND;}).slice(0,6);
  $('logrecent').innerHTML = recent.length
    ? '<div class="hl">recent</div>'+recent.map(function(e){
        var fix=(e.status==='open')?' <button class="chip evfix" data-ts="'+e.ts+'">fixed</button>':'';
        return '<div class="r">'+(e.when||'').split(', ')[1]+'  '+summarizeEv(e)+fix+'</div>'; }).join('')
    : '';
  [].forEach.call(document.querySelectorAll('#logrecent .evfix'),function(b){
    b.onclick=function(){ closeEv(+b.dataset.ts); drawLog(); toast('marked fixed'); };
  });
}
/* Mark a fault or bulb fixed. v19/v20 had no way to do this, so every fault
   stayed "open" on the picker, the flush plan and the EOD roll-up forever. */
function closeEv(ts){
  var a=getEv(), hit=false;
  a.forEach(function(e){ if(e.ts===ts && e.status==='open'){ e.status='fixed'; e.fixedTs=Date.now(); hit=true; } });
  if(hit) lsSet('stab_events',JSON.stringify(a));
  return hit;
}
function flushDone(){
  try{
    var d=JSON.parse(localStorage.getItem('stab_flush')||'{}');
    var cut=Date.now()-20*3600000;   /* a flush plan is good for one shift */
    Object.keys(d).forEach(function(k){ if(d[k]<cut) delete d[k]; });
    return d;
  }catch(e){ return {}; }
}
function summarizeEv(e){
  if(e.kind==='shot') return e.room+(e.tables?' T'+e.tables:'')+'  '+e.min+' min '+e.src+
    (e.ml?'  ~'+e.ml+' mL':'')+(e.why?'  '+e.why:'');
  if(e.kind==='fault') return faultMsg(e)+(e.status&&e.status!=='open'?'  ['+e.status+']':'');
  if(e.kind==='bulb') return bulbMsg(e);
  return e.room+' T'+e.table+' pass '+e.pass+'  '+(e.vol||'')+(e.ec?'  '+e.ec+' EC':'')+(e.ph?' / '+e.ph:'');
}
function pick(id){
  var el=$(id); if(!el) return '';
  var on=el.querySelector('.chip.on');
  return on?on.dataset.w:'';
}
function pickAll(id){
  var el=$(id); if(!el) return '';
  return [].map.call(el.querySelectorAll('.chip.on'),function(b){return b.dataset.w;}).join(' · ');
}
function val(id){ var el=$(id); return el?(el.value||'').trim():''; }
$('logsave').onclick=function(){
  var room=(val('lg_room')||S.room||'').toUpperCase();
  if(!room){ toast('room?'); return; }
  var e;
  if(LOGKIND==='shot'){
    var mins=parseFloat(val('lg_min'))||0;
    if(!mins){ toast('minutes?'); return; }
    e=addEv({kind:'shot', room:room, tables:val('lg_tables'), min:mins,
      src:val('lg_src')||'feed', ml:mlFor(room,mins), why:pickAll('lg_why'), note:val('lg_note')});
  } else if(LOGKIND==='fault'){
    var what=pick('lg_what');
    if(!what){ toast('what is wrong?'); return; }
    e=addEv({kind:'fault', room:room, table:val('lg_table'), what:what,
      detail:val('lg_detail'), status:'open'});
    var msg=faultMsg(e);
    if(navigator.clipboard) navigator.clipboard.writeText(msg).catch(function(){});
    toast('logged · message copied for Teams');
    drawLog(); return;
  } else if(LOGKIND==='bulb'){
    var n=parseInt(val('lg_n'),10)||1;
    e=addEv({kind:'bulb', room:room, tables:val('lg_tables'), n:n, note:val('lg_note'), status:'open'});
    var bm=bulbMsg(e);
    if(navigator.clipboard) navigator.clipboard.writeText(bm).catch(function(){});
    toast('logged · message copied for Teams');
    drawLog(); return;
  } else {
    e=addEv({kind:'runoff', room:room, table:val('lg_table'), pass:val('lg_pass'),
      vol:val('lg_vol'), ec:val('lg_ec'), ph:val('lg_ph')});
  }
  toast('logged');
  drawLog();
};

/* ---------------- room access block ----------------
   A whole room blocked: spray re-entry, a trim crew in the aisles. Set on
   setup, committed by tapping Start, and reported in the room-notes
   paragraph. It does not stop the sweep — a few rows can usually still be
   reached — and it never reaches the CHECK rules. One table you cannot get
   to is a per-table skip, not this. */
function syncAccessBtn(){
  var b=$('accbtn'); if(!b) return;
  var on=!!(S.access && S.access.reason);
  b.classList.toggle('set',on);
  b.textContent=on?'access ·':'access';
}
function drawAccess(){
  var cur=(S.access&&S.access.reason)||'';
  $('accbody').innerHTML='<div class="pg"><div class="c">'+ACCESS.map(function(w){
    return '<button class="chip'+(w===cur?' on':'')+'" data-w="'+w+'">'+w+'</button>';
  }).join('')+'</div></div>';
  $('accnote').value=(S.access&&S.access.note)||'';
  [].forEach.call(document.querySelectorAll('#accbody .chip'),function(b){
    b.onclick=function(){
      var w=b.dataset.w;
      var same=(S.access&&S.access.reason===w);
      S.access=same?null:{reason:w,note:($('accnote').value||'').trim()};
      drawAccess(); syncAccessBtn();
      toast(same?'access cleared':('room access · '+w));
    };
  });
}
function openAccess(){
  if(!S.room){ toast('pick a room first'); return; }
  $('acctop').textContent='Room access · '+S.room;
  drawAccess();
  $('accsheet').classList.remove('hide');
}
$('accbtn').onclick=openAccess;
$('accclose').onclick=function(){
  if(S.access) S.access.note=($('accnote').value||'').trim();
  syncAccessBtn();
  $('accsheet').classList.add('hide');
};
$('accclear').onclick=function(){
  S.access=null; drawAccess(); syncAccessBtn(); toast('access cleared');
};

/* ---------------- per-table skip reason ----------------
   Why one table went unmeasured. Recorded against the table, printed in the
   row notes as "T7  — spray REI", and deliberately kept out of every CHECK
   rule: a table behind a re-entry interval is not a table fault. */
/* Stops for one table are contiguous in every route buildRoute produces,
   so "the rest of this table" is the run starting at S.i. */
function restOfTable(){
  var stop=S.route[S.i];
  if(!stop || stop.t==null) return 0;
  var n=0;
  while(S.i+n<S.route.length && S.route[S.i+n].t===stop.t) n++;
  return n;
}
function doSkip(reason,whole){
  var stop=S.route[S.i];
  var n=1;
  if(reason && stop && stop.t!=null){
    S.skipped=S.skipped||{};
    S.skipped[String(stop.t)]=reason;
    if(whole) n=restOfTable();
  }
  S.redo=[]; S.skips+=n; S.i+=n;
  saveSession(); render(); flash();
  toast(reason?((whole&&n>1?('T'+stop.t+' skipped, '+n+' stops'):'skipped')+' — '+reason):'skipped');
}
/* A §2.1: one tap. A reason applies to the whole table — a closed aisle
   does not reopen for the next stop — so tagging it skips the rest of the
   table and lands the cursor on the next one. v25 asked "whole table or
   just this stop?" as a second tap, and the operator was then repositioning
   the cursor by hand anyway. */
function drawSkipReasons(){
  $('skipbody').innerHTML='<div class="pg"><div class="c">'+SKIPWHY.map(function(w){
    return '<button class="chip" data-w="'+w+'">'+w+'</button>';
  }).join('')+'</div></div>';
  [].forEach.call(document.querySelectorAll('#skipbody .chip'),function(b){
    b.onclick=function(){ $('skipsheet').classList.add('hide'); doSkip(b.dataset.w,true); };
  });
}
function openSkip(){
  var stop=S.route[S.i];
  /* a spot stop belongs to no table, so there is nothing to attribute it to */
  if(!stop || stop.t==null){ doSkip(''); return; }
  $('skiptop').textContent='Skip table '+stop.t;
  drawSkipReasons();
  $('skipsheet').classList.remove('hide');
}
$('skipcancel').onclick=function(){ $('skipsheet').classList.add('hide'); };

$('logbtn').onclick=function(){ openLog('shot'); };
$('logbtn2').onclick=function(){ openLog('shot'); };
$('eodbtn').onclick=function(){
  var t=buildEOD();
  S.logOpen=true;
  $('logtop').textContent='End of day';
  $('logtabs').style.display='none';
  $('logbody').innerHTML='<textarea id="eodtext" rows="22" style="font-size:12px;line-height:1.55">'+
    t.replace(/</g,'&lt;')+'</textarea>';
  $('logrecent').innerHTML='';
  $('logsave').textContent='Copy';
  $('logsave').onclick=function(){
    var e=$('eodtext'); e.select();
    if(navigator.clipboard) navigator.clipboard.writeText(e.value).catch(function(){});
    toast('roll-up copied');
  };
  $('logclose').onclick=function(){
    S.logOpen=false; $('logsheet').classList.add('hide');
    $('logtabs').style.display=''; $('logsave').textContent='Save';
    releaseAwake();
    location.reload();
  };
  $('logsheet').classList.remove('hide');
};
$('logclose').onclick=function(){ S.logOpen=false; $('logsheet').classList.add('hide'); };

/* ---------------- housekeeping loops ---------------- */
setInterval(function(){
  if(S.roomStarted && !S.finished){
    if(S.last) paint();
    var d=$('dot');
    if(isConn()){
      var stale=Date.now()-S.lastAt>9000;
      d.className='dot '+(stale?'stale':'live');
      $('statxt').textContent=S.lastAt?(stale?'stale':'live'):'waiting';
    }
  }
  rxFlushStale();
},1000);
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState!=='visible') return;
  if(S.roomStarted && !S.finished){
    wlAcquire(); bfDim(false);
    if(!isConn() && S.dev && !S.connecting && !(S.cal&&CAL.released)){
      connect();
    }
  }
});

/* Closing the tab or navigating away is an exit too — never leave Bluefy
   holding the screen bright for a sweep that is over. */
window.addEventListener('pagehide',function(){ bfDim(true); });

/* ---- room data staleness ---- */
(function(){
  var el=document.getElementById('dataage'); if(!el) return;
  var m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(ROOMDATA_ASOF||'');
  if(!m){ el.textContent='room data date unreadable'; el.className='stale'; return; }
  var asOf=new Date(+m[3],+m[1]-1,+m[2]);
  var days=Math.floor((Date.now()-asOf.getTime())/86400000);
  if(days>7){
    el.textContent='room data as of '+ROOMDATA_ASOF+' — '+days+' days old · DOF and shot times are stale';
    el.className='stale';
  }else{
    el.textContent='room data as of '+ROOMDATA_ASOF+(days>0?' · '+days+'d':'');
    el.className='';
  }
})();

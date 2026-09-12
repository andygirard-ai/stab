
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
   CAL mode with per-media Hilhorst offsets ·
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
  dev:null, chr:null, svc:null, wchr:null, batt:null, battAt:0, battWait:0, battWarned:false,
  trigger:null, verifying:false, connecting:false, everConn:false,
  awaiting:false, tries:0, rt:null, tWrite:0, lastLat:null, lastPoll:0,
  pegsOpen:false, cal:false, finished:false, roomStarted:false,
  redo:[], logOpen:false, triage:[], feedEC:null, feedPH:null, skips:0, unstable:0, startedAt:0, copied:false, shared:false, free:{},
  skipped:{}, access:null, alarmQueue:[], huntFails:0, shotMidSweep:false, probeFrames:0,
  profile:false, spotTable:null, postFlush:false,
  flaggedTable:false, reconnB:false};
var A={state:'air', buf:[], lastAir:null, t0:0};
var CAL={stage:'live', frozen:null, released:false};
var DBG={pkts:0, polls:0, directs:0, statusFrames:0, writeFails:0, timeouts:0, unparsed:[],
         sensorErr:0, lastSensorErr:null};
/* assigned inside buildSetup; settings calls it to open the practice room */
var pickRoom=function(){};
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
    s:{room:S.room,side:S.side,dir:S.dir,mode:S.mode,op:S.op,i:S.i,probeFrames:S.probeFrames||0,
       profile:!!S.profile,spotTable:S.spotTable,postFlush:!!S.postFlush,
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
    cap:S.auto?'auto':'manual',lastDir:PREF.lastDir,profile:!!S.profile}));
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
  /* descending, and distinct from the outlier beep: the ZSC runs on two AA
     alkalines with no fuel gauge, so -9991 from the sensor is the only
     warning the operator gets that they need changing. */
  supplyLow:[[494,120],[392,120],[330,220]], drop:[[330,170],[262,220]],
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
  /* §3: the chips read as names because a second operator has to recognise
     himself on a screen he has never seen. The stored value stays initials,
     so every CSV already exported still matches. */
  var OPNAME={APG:'Andy', EGY:'Evan'};
  var ops=['APG','EGY'];
  if(S.op && ops.indexOf(S.op)<0) ops.push(S.op);
  var ob=$('ops'), html='';
  ops.forEach(function(o){ html+='<button class="opc'+(o===S.op?' on':'')+'" data-op="'+o+'">'+(OPNAME[o]||o)+'</button>'; });
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
    ops2.forEach(function(o){ h2+='<button class="opc'+(o===S.op?' on':'')+'" data-op="'+o+'">'+(OPNAME[o]||o)+'</button>'; });
    h2+='<button class="opc" data-op="+">+</button>';
    ob.innerHTML=h2;
  }

  /* §4: apply the qualifying rule once to everything already stored, so the
     three-second walk-ins stop holding records. The sweeps themselves are
     kept — for some of them the stored CSV is the only copy — they are
     simply stamped out of the running. */
  /* The depth control shipped in v34 with no styling — it rendered as plain
     text, so tapping "Profile" looked like nothing happening and the choice
     persisted silently. Every sweep since has been taking a mid at every
     position. Nobody chose that, so it is cleared once. */
  (function unstickProfile(){
    try{
      if(localStorage.getItem('stab_profreset')) return;
      lsSet('stab_profreset','1');
      if(PREF.profile){ PREF.profile=false; S.profile=false; savePrefs(); }
    }catch(e){}
  })();

  (function stampQual(){
    try{
      if(localStorage.getItem('stab_qualrule')) return;
      var h=getHist(), n=0;
      h.forEach(function(x){
        if(x.qual===undefined){ x.qual=histQualifies(x); if(!x.qual) n++; }
      });
      lsSet('stab_hist',JSON.stringify({v:1,items:h}));
      lsSet('stab_qualrule','1');
      if(n) setTimeout(function(){ toast(n+' short sweep'+(n===1?'':'s')+' no longer hold records'); },900);
    }catch(e){}
  })();

  /* §6.7 depth: reference-only by default, profile when the walk is about
     drainage or confirming a schedule change. Per session, remembered. */
  [].forEach.call(document.querySelectorAll('.prof'),function(b){
    b.onclick=function(){
      [].forEach.call(document.querySelectorAll('.prof'),function(x){x.classList.remove('on');});
      b.classList.add('on');
      S.profile=(b.dataset.prof==='1');
      savePrefs();
    };
  });
  /* Post-flush is a property of one sweep, not a preference: it is never
     remembered, because remembering it would silently lift the ceiling on
     Monday. */
  [].forEach.call(document.querySelectorAll('.pf'),function(b){
    b.onclick=function(){ b.classList.toggle('on'); };
  });

  /* saved bag sizes / feed EC must be applied before the grid draws them */
  loadRoomCfgAll();
  /* coverage from history */
  var hist=getHist(), latest={}, blind={}, now=Date.now();
  hist.forEach(function(h){
    if(h.mode && h.mode!=='sweep') return;
    var t=histTs(h); if(!t) return;
    if(!latest[h.room] || t>latest[h.room]){
      latest[h.room]=t;
      /* §3: the most recent sweep decides what the tile says. A hand-only
         sweep of a 1.25-gallon room cannot find a table below floor, so it
         must not sit there looking like a room that has been checked. */
      blind[h.room]=!!h.handOnly;
    }
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
  var nRooms=activeRooms().length;
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
    var st=roomState(k), off=(st!=='active');
    var sub=cfg.kind?(k+' · '+cfg.kind)
           :off?(st==='movein'?'move-in · confirm room setup':st)
           :(cfg.bag+' gal · '+age);
    if(blind[k]) sub=cfg.bag+' gal · hand-only';
    /* §6.2: an open fault is a reason to walk into the room differently, so
       it belongs on the tile he reads before he walks, not only in the brief */
    var nf=flagCount(k);
    if(nf) sub+=' · '+nf+' flag'+(nf>1?'s':'');
    if(off) b.className+=' off';
    /* One badge, and these are in priority order: what is true of the room
       beats what is true of its last sweep. A four-deep ternary was doing
       this and had stopped being readable. */
    var badge='';
    if(off)             badge='<span class="tb hb">'+(st==='movein'?'move-in':st)+'</span>';
    else if(blind[k])   badge='<span class="tb hb">hand</span>';
    else if(nf)         badge='<span class="tb fb">'+nf+'</span>';
    else if(days===0)   badge='<span class="tb">today</span>';
    var bar=off?'':(blind[k]?'r':cls);
    b.innerHTML=k+badge+
      '<span class="sub">'+sub+'</span>'+
      '<span class="cov '+bar+'"></span>';
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
  /* §4: the practice room is no longer a tile. It sat in the grid under a
     "NOT A ROOM" heading, which is a label doing a lock's job — on a phone
     handed to somebody on his first morning, one mis-tap puts a shift's
     worth of stabs into a fixture. It lives in settings now. */
  box.addEventListener('click',function(e){
    var b=e.target.closest('.rm'); if(!b) return;
    pickRoom(b.dataset.room);
  });
  pickRoom=function(k){
    if(!ROOMS[k]) return;
    var b=box.querySelector('.rm[data-room="'+k+'"]');
    [].forEach.call(box.querySelectorAll('.rm'),function(x){x.classList.remove('on');});
    if(b){ b.classList.add('on'); b.scrollIntoView({block:'nearest'}); }
    S.room=k;
    S.triage=[];
    S.access=null; syncAccessBtn();   /* access is per room */
    $('startbtn').textContent='Start '+S.room;
    $('startbar').classList.add('up');
    syncModeUI();
    showRoomHistory();
    showBrief();
    showRoomCfg();
  };

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
  S.profile=!!PREF.profile;
  function mark(cls,val,attr){
    [].forEach.call(document.querySelectorAll('.'+cls),function(x){
      x.classList.toggle('on',x.dataset[attr]===val);
    });
  }
  mark('side',S.side,'side'); mark('dir',S.dir,'dir');
  mark('mode',S.mode,'mode'); syncModeUI(); mark('cap',S.auto?'auto':'manual','cap');
  mark('prof',S.profile?'1':'0','prof');

  $('setup').addEventListener('click',function(e){
    var b=e.target.closest('.side,.dir,.mode,.cap,.prof'); if(!b) return;
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
  }

  /* ---------------- settings (backlog §4) ----------------
     The landing page carried eight buttons that were useful while this was
     being built and are noise to a second operator: a mic capability probe
     whose question is answered, two destructive clears one tap from the room
     grid, and a transfer pair that only matters when a second phone exists.
     They are all here now, behind a long-press on the version string, and
     nothing on this screen is needed to run a sweep.

     The practice room comes with them. BENCH sat in the room grid under a
     "NOT A ROOM" heading, which is a label doing a lock's job. */
  var LP=null;
  function openSettings(){
    dataCounts();
    $('dangerword').value=''; armDanger();
    $('setsheet').classList.remove('hide');
  }
  function armDanger(){
    var ok=($('dangerword').value||'').trim().toUpperCase()==='DELETE';
    ['clrsweeps','clrprev','clrall'].forEach(function(id){ $(id).disabled=!ok; });
  }
  (function bindLongPress(){
    var el=document.querySelector('.brand'); if(!el) return;
    var fire=function(){ LP=null; openSettings(); };
    el.addEventListener('touchstart',function(){ LP=setTimeout(fire,700); },{passive:true});
    ['touchend','touchmove','touchcancel'].forEach(function(ev){
      el.addEventListener(ev,function(){ if(LP){ clearTimeout(LP); LP=null; } },{passive:true});
    });
    el.addEventListener('mousedown',function(){ LP=setTimeout(fire,700); });
    ['mouseup','mouseleave'].forEach(function(ev){
      el.addEventListener(ev,function(){ if(LP){ clearTimeout(LP); LP=null; } });
    });
  })();
  $('dangerword').oninput=armDanger;
  $('setclose').onclick=function(){ $('setsheet').classList.add('hide'); };
  /* ---- probe scan: settle the battery question with the device, not with
     a document ----
     The Batt column was read exactly this way from v18 to v42 and never
     once returned a value, which is why it was deleted. But "never returned
     a value" is not the same as "the service is absent", and the difference
     is one error name. This asks the bridge and prints what it says,
     verbatim and copyable. If a byte comes back, the column goes straight
     back in and the deletion was wrong. */
  /* "180f by UUID: 2" — that was this scan reporting a rejection whose .name
     was empty, so it fell through and printed the value itself. Bluefy's Web
     Bluetooth shim does not always reject with a DOMException. Everything a
     rejection carries goes in now, because the one time this matters is the
     time the shape is unfamiliar. */
  function errText(e){
    if(e==null) return 'unknown';
    var bits=[];
    if(e.name) bits.push(e.name);
    if(e.message && e.message!==e.name) bits.push(e.message);
    if(e.code!=null) bits.push('code '+e.code);
    if(!bits.length) bits.push(typeof e+' '+String(e));
    return bits.join(' · ');
  }
  $('scango').onclick=function(){
    var out=[], el=$('scanout');
    function line(x){ out.push(x); el.textContent=out.join('\n'); }
    line('probe scan · '+new Date().toLocaleString('en-US'));
    /* The scan connects on its own. It used to refuse unless a probe was
       already connected, and there was no way to get one: connecting happens
       inside a sweep, the only way out of a sweep is END, and by the time
       you are back on the setup screen to reach settings the link is gone.
       A diagnostic that cannot be run is not a diagnostic. */
    function withGatt(){
      if(S.dev && S.dev.gatt && S.dev.gatt.connected) return Promise.resolve(S.dev.gatt);
      if(!navigator.bluetooth){ line('no Web Bluetooth — open this in Bluefy'); return Promise.resolve(null); }
      line('not connected — connecting…  (wake the probe: press its button, LED blinks)');
      return connect().then(function(){
        if(S.dev && S.dev.gatt && S.dev.gatt.connected) return S.dev.gatt;
        line('could not connect — is the probe awake and in range?');
        return null;
      }).catch(function(e){ line('connect failed: '+((e&&e.message)||e)); return null; });
    }
    withGatt().then(function(g){
      if(!g) { line('— end of scan —'); return; }
      line('device: '+(S.dev.name||'(unnamed)'));
      line('trigger: '+(S.trigger?('confirmed · '+S.trigger.n):'not confirmed'));
      function chars(svc, indent){
        if(!svc.getCharacteristics) return Promise.resolve();
        return svc.getCharacteristics().then(function(cs){
          cs.forEach(function(c){
            var p=c.properties||{}, f=[];
            ['read','notify','write','writeWithoutResponse','indicate'].forEach(function(k){ if(p[k]) f.push(k); });
            line(indent+c.uuid+'  ['+f.join(',')+']');
          });
        }).catch(function(e){ line(indent+'(characteristics unreadable — '+errText(e)+')'); });
      }
      /* Dump the service's characteristics before reading, so "180f present
         but non-conforming" is distinguishable from "180f absent". The
         Battery Service spec makes 2A19 mandatory and readable; if 180f is
         here and 2A19 is not, that is the interesting answer and it should
         be visible rather than collapsed into one error name.
         The SIG UUID and the Web Bluetooth alias resolve to the same
         service; both are tried so a naming mistake cannot pass for
         absence. */
      function attempt(label, id){
        return g.getPrimaryService(id).then(function(svc){
          line(label+': service FOUND — characteristics:');
          return chars(svc,'    ').then(function(){
            return svc.getCharacteristic(BAT_CHR);
          }).then(function(c){
            return c.readValue().then(function(v){
              if(!v || v.byteLength<1){ line(label+': 2a19 read returned no bytes'); return; }
              var pct=v.getUint8(0);
              line(label+': 2a19 = '+pct+(pct>100?'  (out of range — not a percentage)':'%'));
              line('*** BATTERY READS. Send this to me and the column goes back in. ***');
            });
          }).catch(function(e){ line(label+': 180f found but 2a19 failed — '+errText(e)); });
        }).catch(function(e){ line(label+': '+errText(e)); });
      }
      return attempt('180f by UUID', BAT_SVC)
        .then(function(){ return attempt('battery_service by alias','battery_service'); })
        .then(function(){
          if(!g.getPrimaryServices) return;
          return g.getPrimaryServices().then(function(ss){
            line('services granted and present: '+(ss.map(function(x){return x.uuid;}).join(' ')||'none'));
            /* every one of them, not only DECA: a readable characteristic we
               do not already use is the last place a reading could hide */
            return ss.reduce(function(ch,svc){
              return ch.then(function(){
                line('  service '+svc.uuid);
                return chars(svc,'    ');
              });
            }, Promise.resolve());
          }).catch(function(e){ line('service enumeration: '+errText(e)); });
        })
        .then(function(){ line('— end of scan —'); });
    });
  };
  /* ---- battery capture over the DECA UART ----
     The SOLUS 1.2.6 release binary contains the literal command "get -batt"
     alongside MeterBleUart, BLEUart, the DECA UUIDs, SolusDevice,
     batteryLevel and getBatteryIcon, and contains no 180F or 2A19. So the
     original app reads the battery through this same UART, and the GATT dump
     that found no Battery Service was right about the service and wrong as
     an answer about the battery.

     This sends the command through the transport already proven by sdicmd —
     same framing, same characteristic, same write — and records every
     notification raw. It does not parse the reply. The parser gets written
     from an observed packet, not from a guess about one. */
  $('batgo').onclick=function(){
    var out=[], el=$('batout');
    function line(x){ out.push(x); el.textContent=out.join('\n'); }
    function dump(label, frames){
      if(!frames.length){ line('  (no notifications)'); return; }
      frames.forEach(function(f,i){
        line('  ['+(i+1)+'] +'+(f.ms-frames[0].ms)+'ms  '+f.n+' bytes');
        line('      hex   '+f.hex);
        line('      ascii '+f.ascii);
      });
    }
    line('battery capture · '+new Date().toLocaleString('en-US'));
    (function(){
      if(S.dev && S.dev.gatt && S.dev.gatt.connected) return Promise.resolve(true);
      if(!navigator.bluetooth){ line('no Web Bluetooth — open this in Bluefy'); return Promise.resolve(false); }
      line('connecting…  (wake the probe: press its button, LED blinks)');
      return connect().then(function(){ return !!(S.dev&&S.dev.gatt&&S.dev.gatt.connected); })
        .catch(function(e){ line('connect failed: '+errText(e)); return false; });
    })().then(function(okc){
      if(!okc){ line('— end —'); return; }
      if(!S.wchr){ line('no write characteristic — cannot send'); line('— end —'); return; }
      line('device: '+(S.dev.name||'(unnamed)'));
      /* notifications were subscribed by connect(), before any write */
      line('notify: DECA0003 subscribed by connect, before anything was sent');
      var acked=!!(S.wchr.properties && S.wchr.properties.write);
      function send(label, bytes){
        line('');
        line(label);
        line('  sent  '+hexOf(bytes));
        rawCapStart();
        var d=new Uint8Array(bytes);
        var w=acked?S.wchr.writeValue(d):S.wchr.writeValueWithoutResponse(d);
        return w.catch(function(e){ line('  write failed: '+errText(e)); })
          .then(function(){ return new Promise(function(r){ setTimeout(r,2500); }); })
          .then(function(){ return rawCapStop(); });
      }
      var framed=frameBytes(BATT_CMD);
      return send('framed "'+BATT_CMD+'"  — the same framing sdicmd uses', framed)
        .then(function(f){
          dump('framed', f);
          if(f.length) return null;
          /* nothing came back to the framed form; the raw form costs another
             two seconds and saves a second trip to the room */
          var raw=[]; for(var i=0;i<BATT_CMD.length;i++) raw.push(BATT_CMD.charCodeAt(i)&0xFF);
          return send('raw "'+BATT_CMD+'"  — unframed, same characteristic', raw)
            .then(function(g){ dump('raw', g); });
        })
        .then(function(){ line(''); line('— end of capture —'); });
    });
  };
  $('batcopy').onclick=function(){
    var t=$('batout').textContent||'';
    if(!t.trim()){ toast('run the capture first'); return; }
    shareOrCopy(t,'batt_capture_'+fnameDate()+'.txt','battery capture');
  };
  $('scancopy').onclick=function(){
    var t=$('scanout').textContent||'';
    if(!t.trim()){ toast('run the scan first'); return; }
    shareOrCopy(t,'probe_scan_'+fnameDate()+'.txt','probe scan');
  };
  $('benchgo').onclick=function(){
    $('setsheet').classList.add('hide');
    pickRoom('BENCH');
  };
  $('clrsweeps').onclick=function(){
    var h=getHist();
    if(!h.length){ toast('no saved sweeps'); return; }
    if(!confirm('Remove '+h.length+' saved sweep CSV'+(h.length===1?'':'s')+
      '?\n\nExport anything you still need first. Calibration pairs and position history stay.')) return;
    try{ localStorage.removeItem('stab_hist'); }catch(e){}
    dataCounts(); toast('saved sweeps cleared');
  };
  $('clrprev').onclick=function(){
    var n=Object.keys(PREV).length;
    if(!n){ toast('no position history'); return; }
    if(!confirm('Remove '+n+' position baselines?\n\nThe "last here" line and Δ comparisons start over. Saved sweeps and calibration pairs stay.')) return;
    PREV={};
    try{ localStorage.removeItem('stab_prev'); }catch(e){}
    dataCounts(); toast('position history cleared');
  };
  $('backupgo').onclick=runBackup;
  $('backupgo2').onclick=runBackup;
  $('renamebtn').onclick=openRenameSheet;
  $('renameclose').onclick=function(){ $('renamesheet').classList.add('hide'); };
  $('rn_save').onclick=function(){
    var oldName=$('rn_old').value, newName=($('rn_new').value||'').trim(),
        eff=$('rn_date').value;
    if(!oldName){ toast('pick the strain to rename'); return; }
    if(!newName){ toast('type the new name'); return; }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(eff)){ toast('pick an effective date'); return; }
    saveRename({old:oldName, new:newName, effectiveDate:eff, savedAt:Date.now(), op:S.op||''});
    $('rn_new').value='';
    renderRenames();
    toast(oldName+' -> '+newName+' effective '+eff);
  };
  $('backupimport').onclick=function(){
    var pasted=($('backuppaste').value||'').trim();
    if(pasted){ importBackupText(pasted); return; }
    $('backuppaste').classList.remove('hide');
    try{ $('backupfile').click(); }catch(e){}
  };
  $('backupfile').onchange=function(){
    var f=this.files&&this.files[0]; if(!f) return;
    var rd=new FileReader();
    rd.onload=function(){ importBackupText(String(rd.result||'')); };
    rd.readAsText(f);
    this.value='';
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
      S.mode=sess.mode||S.mode; S.op=sess.op||S.op; S.probeFrames=sess.probeFrames||0;
      S.profile=!!sess.profile; S.spotTable=(sess.spotTable==null?null:sess.spotTable);
      S.postFlush=!!sess.postFlush;
      S.notes=sess.notes||{}; S.free=sess.free||{}; S.route=sess.route||[]; S.i=sess.i||0;
      S.startedAt=sess.startedAt||Date.now();
      S.triage=sess.triage||[]; S.skips=sess.skips||0; S.unstable=sess.unstable||0;
      S.skipped=sess.skipped||{}; S.access=sess.access||null;
      /* feed EC/pH: from the session if it has them (the normal case for a
         genuinely resumed sweep), else read fresh — never a saved room
         config constant (Weekend Plan 1.5, corrected 9/12) */
      var rc=roomCfg()[S.room]||{};
      S.feedEC=(sess.feedEC!=null)?sess.feedEC:feedEcFor(S.room);
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
  showRoomConfirm();
};
/* ---------------- room confirmation (Weekend Plan 1.1) ----------------
   A full C3 sweep was filed as A1 on 9/11 and nothing on screen said so for
   eleven tables — the room grid is easy to mis-tap and nothing since then
   forced a second look. This sits between Start and the first stab as its
   own step: big room name plus the strain list, sourced from strainListFor
   (room config first, the Monday file under it). Only #confirmgo begins the
   sweep; #confirmback is the only other live control, so there is no tap
   that gets past this by accident. */
function showRoomConfirm(){
  $('confirmroom').textContent=S.room;
  var list=strainListFor(S.room);
  $('confirmstrains').textContent=list.length?list.join(' / '):'no strains on record';
  $('confirmsheet').classList.remove('hide');
}
$('confirmback').onclick=function(){ $('confirmsheet').classList.add('hide'); };
$('confirmgo').onclick=function(){
  $('confirmsheet').classList.add('hide');
  beginSweep();
};
function beginSweep(){
  /* §5.5: said here, where it can still change what he does — not on the
     done screen, where it is only an excuse for the numbers. */
  if(S.mode==='sweep'){
    var ww=windowWarning(S.room);
    if(ww) setTimeout(function(){ toast(ww); }, 500);
  }
  S.route=buildRoute(S.room,S.dir,S.mode,S.side); S.i=0; S.rows=[]; S.notes={};
  S.startedAt=Date.now(); S.roomStarted=true;
  S.skips=0; S.unstable=0; S.redo=[]; S.alarmQueue=[]; S.huntFails=0; S.shotMidSweep=false;
  S.probeFrames=0; S.spotTable=null;
  S.postFlush=!!(document.querySelector('.pf.on'));
  renderAlarm();
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
}

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
    if(spot && t===S.spotTable) d.className+=' now';
    /* §6.1: in a spot sweep the strip is the only thing that knows where the
       operator is standing, so tapping it says which table this stab belongs
       to. Without that, spot rows carry no table and cannot be aligned to a
       workbook column at all. Notes stay reachable from the note button,
       which starts working once a table is chosen. */
    d.onclick=function(){
      if(S.finished) return;
      if(S.mode==='spot'){ S.spotTable=+this.dataset.t; saveSession(); render(); drawRoute(); return; }
      openPegs(+this.dataset.t);
    };
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
  $('pos').innerHTML=s.spot
    ? 'Spot '+(S.i+1)+(S.spotTable!=null?' · T'+S.spotTable:' · pick a table')
    : 'Table <b class="tnum">'+s.t+'</b>';
  $('depth').innerHTML=s.pos+'<span class="d">'+(s.depth==='reference'?'REF':'MID')+'</span>';
  var info=strainFor(S.room, s.t);
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
  /* §6.2: at the table, not buried in a list he read twenty minutes ago */
  var fl=(s.spot&&S.spotTable!=null)?flagLine(S.room,S.spotTable):flagLine(S.room,s.t);
  $('tflag').textContent=fl;
  $('tflag').classList.toggle('hide',!fl);
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
  var si=strainFor(S.room, stop.t);
  r.strain=si[0];
  r.flags=si[1];
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
  setBig();
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
function showAlarm(msg, opts){
  S.alarmQueue=S.alarmQueue||[];
  S.alarmQueue.push(opts?{msg:msg, undo:!!opts.undo}:msg);
  renderAlarm();
}
function renderAlarm(){
  var el=$('alarm'); if(!el) return;
  if(!S.alarmQueue || !S.alarmQueue.length){ el.classList.add('hide'); return; }
  var a=S.alarmQueue[0];
  var t=$('alarmtxt'); if(t) t.textContent=(typeof a==='string')?a:a.msg;
  /* An alarm raised by a reading can take that reading back with it: it
     caught the error, so it can fix the error. */
  var canUndo=(typeof a!=='string' && a.undo && S.rows.length>0);
  var ub=$('alarmundo'); if(ub) ub.classList.toggle('hide',!canUndo);
  el.classList.remove('hide');
}
var alarmOk=$('alarmok');
if(alarmOk) alarmOk.onclick=function(){
  if(S.alarmQueue) S.alarmQueue.shift();
  renderAlarm();
};
var alarmUndo=$('alarmundo');
if(alarmUndo) alarmUndo.onclick=function(){
  if(S.alarmQueue) S.alarmQueue.shift();
  renderAlarm();
  $('undo').click();
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
/* A sensor error is not a reading and never commits. Before this they fell
   into the unparsed bucket, so a probe reporting low supply looked exactly
   like a probe that had gone quiet — misses climbing, nothing on screen, no
   reason given. The held banner is right for all three: each of them means
   stop and fix something, not stab again. */
/* The reply to "get -batt", which only counts when one was asked for. A bare
   integer on this UART is unambiguous in practice, but "unambiguous in
   practice" is how a wrong number gets into a CSV, so it is tied to a
   request that is still outstanding. */
var BATT_WARN=20, BATT_CRIT=10, BATT_WAIT=6000;
/* Refreshed while the probe is in hand, so an all-day sweep is not reading a
   number from breakfast. The command is a 15-byte write and a 10-byte
   notification on a radio that is already up; against maintaining the BLE
   link and driving the TEROS at 3-16 mA for 25 ms a measurement, its own
   draw is not worth counting. What it does cost is the write characteristic,
   which the poll also uses — so it only goes out when nothing is in flight. */
var BATT_REFRESH_MS=300000, BATT_STALE_MIN=15;
emitBattery=function(pr){
  if(!S.battWait || Date.now()-S.battWait>BATT_WAIT){
    step('battery reply with nothing pending — ignored ('+pr.batt+')');
    return;
  }
  S.battWait=0;
  if(pr.batt<0 || pr.batt>100){
    step('battery out of range — ignored ('+pr.batt+')');
    return;
  }
  S.batt=pr.batt;
  S.battAt=Date.now();
  step('battery '+S.batt+'%');
  battPaint(); battWarn();
};
/* Keep it current while the probe is in hand, without ever competing with a
   stab. The write characteristic carries both the sdicmd poll and this, so
   the refresh stands down whenever anything is in flight and simply tries
   again a minute later. */
setInterval(function(){
  if(!battLive() || !S.wchr) return;
  if(S.battWait || S.awaiting || S.verifying || S.connecting || S.cal) return;
  if(A.state==='settling') return;
  if(S.battAt && Date.now()-S.battAt < BATT_REFRESH_MS) return;
  requestBattery();
},60000);
function requestBattery(){
  if(!S.wchr) return Promise.resolve();
  var d=new Uint8Array(frameBytes(BATT_CMD));
  S.battWait=Date.now();
  var acked=!!(S.wchr.properties && S.wchr.properties.write);
  return (acked?S.wchr.writeValue(d):S.wchr.writeValueWithoutResponse(d))
    .catch(function(){ S.battWait=0; });
}
/* A battery number is a claim about a device that is present. It must not
   outlive the link: the pill was surviving a disconnect, so a probe asleep
   in a pocket still read 77% on screen, and in demo — where everything else
   is synthetic — that was the one thing that looked live.
   Gated on the real GATT link rather than isConn(), which returns true in
   demo whether a probe is there or not. */
function battLive(){
  return !!(S.dev && S.dev.gatt && S.dev.gatt.connected);
}
function battPaint(){
  var b=$('batt'); if(!b) return;
  if(!battLive()){ b.className=''; b.textContent=''; return; }
  /* 1.4: before the first battery reply — the first five minutes of a
     sweep, every time — this pill is where the probe's own name shows up
     instead of sitting empty. */
  if(S.batt==null){
    if(S.probeName){ b.className='ok'; b.textContent=S.probeName; }
    else{ b.className=''; b.textContent=''; }
    return;
  }
  /* shown whenever it is known: a pill that appears only near empty means a
     healthy probe and a probe that never answered look identical */
  b.className=S.batt<BATT_CRIT?'red':(S.batt<BATT_WARN?'amber':'ok');
  /* and an old number says how old, so a stale one is visibly stale */
  var age=S.battAt?Math.floor((Date.now()-S.battAt)/60000):0;
  b.textContent='batt '+S.batt+'%'+(age>=BATT_STALE_MIN?' · '+age+'m':'')+(S.probeName?' · '+S.probeName:'');
}
function battWarn(){
  if(S.batt==null) return;
  var low=S.batt<BATT_WARN;
  if(low && !S.battWarned){
    S.battWarned=true;
    beep('supplyLow');
    toast('probe battery '+S.batt+'% — bring two AA cells');
  }
  if(!low && S.batt>BATT_WARN+5) S.battWarned=false;
}
emitSensorError=function(pr){
  DBG.sensorErr=(DBG.sensorErr||0)+1;
  DBG.lastSensorErr=pr.err;
  S.lastErr=pr.err;
  step('sensor error '+pr.err+' — '+pr.msg);
  A.state='air'; A.buf=[];
  S.awaiting=false; clearTimeout(S.rt);
  beep(pr.err==='-9991'?'supplyLow':'alarm');
  if(S.alarmQueue.length<2) showAlarm('probe '+pr.err+' · '+pr.msg);
  setBig();
};
emitReading=function(pr){
  var now=Date.now();
  if(pr.direct) DBG.directs++; else DBG.statusFrames++;
  /* §3: proof the probe was in the room. Demo frames are not proof, and a
     sweep that lost the probe partway is as blind as one that never had it,
     so this counts frames rather than trusting a setting. */
  if(!DEMO) S.probeFrames=(S.probeFrames||0)+1;
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
/* Raw notification capture, off by default. Every notification passes
   through here before any framing or parsing, which is the only place a
   reply of unknown shape can be recorded faithfully. The SOLUS 1.2.6 binary
   carries the literal string "get -batt" beside MeterBleUart, SolusDevice,
   batteryLevel and getBatteryIcon — and no 180F or 2A19 — so the battery
   comes back over this UART in a form nobody here has seen yet. Log it, do
   not interpret it. */
var RAWCAP=null;
function rawCapStart(){ RAWCAP=[]; }
function rawCapStop(){ var r=RAWCAP; RAWCAP=null; return r||[]; }
function hexOf(bytes){
  return bytes.map(function(b){ return (b<16?'0':'')+b.toString(16); }).join(' ').toUpperCase();
}
function asciiOf(bytes){
  return bytes.map(function(b){ return (b>=0x20&&b<=0x7E)?String.fromCharCode(b):'.'; }).join('');
}
function onPacket(e){
  DBG.pkts++;
  var dv=e.target.value, bytes=[];
  for(var i=0;i<dv.byteLength;i++) bytes.push(dv.getUint8(i));
  if(RAWCAP) RAWCAP.push({ms:Date.now(), n:bytes.length, hex:hexOf(bytes), ascii:asciiOf(bytes)});
  rxBytes(bytes);
}
function onDrop(){
  S.chr=null; S.wchr=null; S.svc=null; S.battWait=0;
  /* the battery belonged to that link and goes with it */
  S.batt=null; S.battAt=0; S.battWarned=false; battPaint();
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
    /* 1.4: the bridge's own advertised name, captured fresh on every
       successful connect — a probe swap mid-day (Evan's arriving) shows up
       here rather than silently carrying the last one forward. Falls back
       to whatever was last known rather than clearing it, since not every
       BluetoothDevice exposes .name on a reconnect. */
    S.probeName=(S.dev && S.dev.name) || S.probeName || '';
    ['log','extra','skip','undo','redo'].forEach(function(id){$(id).disabled=false;});
    $('statxt').textContent='waiting';
    setBig();
    battPaint();
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
  /* battery_service is listed so the probe scan in settings can attempt it.
     Web Bluetooth refuses any service not named at requestDevice, so leaving
     it out would make "not found" untestable rather than false. */
  return navigator.bluetooth.requestDevice({filters:[{services:[SVC]}],optionalServices:[SVC,BAT_SVC]})
    .catch(function(){
      step('retry with all devices');
      return navigator.bluetooth.requestDevice({acceptAllDevices:true,optionalServices:[SVC,BAT_SVC]});
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
  /* Once per connect. Two AA alkalines do not move in an afternoon, and the
     request rides the same UART the sweep uses, so asking more often would
     only compete with the poll for the write characteristic. */
  requestBattery();
  if(S.auto){ A.state='air'; A.buf=[]; }
  if(S.cal && CAL.stage==='saved'){ CAL.stage='live'; calPaint(); }
  step('ready');
}

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
    room:S.room, table:(stop.spot && S.spotTable!=null)?S.spotTable:stop.t,
    position:stop.pos, depth:stop.depth,
    strain:strainFor(S.room, stop.t)[0],
    flags:strainFor(S.room, stop.t)[1],
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
    implaus:isImplausible(S.room, r.vwc, !!S.postFlush),
    batt:(S.batt==null?'':S.batt), lat:(S.lastLat==null?'':S.lastLat),
    /* 1.4: the bridge's own name (e.g. ZSC08328), stored per connection —
       a prerequisite for per-probe calibration once Evan's probe arrives. */
    probe:S.probeName||'',
    manualCommit:!!meta.manual,
    /* 1.4: a live per-stab alarm, distinct from the CHECK "no feed" rule —
       this fires on ONE reading, not two, because it means "delivery
       fault", not "drying bag" (a drying bag's EC rises, it does not sit
       at zero). */
    zeroEc:(r.bulk!=null && r.bulk<0.02 && r.vwc<20),
    _pc:pc||null, _out:!!outlier,
    /* §undo: where the cursor stood when this was committed. S.i-- was the
       inverse only while the route never changed shape, and it changes on
       every +plant and every conditional mid — so undoing after an insert
       left the reading gone and the cursor where it was. */
    _i:S.i
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
  if(row.implaus){
    beep('out');
    showAlarm('implausible · '+row.vwc+'% against a ceiling of '+
      plausCeiling(S.room,!!S.postFlush).toFixed(0)+'% — bad seat?'+
      (S.postFlush?'':' If this room was just flushed, tag the sweep post-flush.'),
      {undo:true});
  }
  else if(row.flag){ beep('floor'); toast('below floor · '+row.vwc+'%'); }
  else if(meta.unstable){ beep('out'); toast('unstable — logged median'); }
  else if(outlier){
    beep('out');
    var dref=pc?(r.vwc-pc.v):(r.vwc-tmed);
    /* A toast that asks "undo?" and slides away in 2.4 seconds is a question
       nobody gets to answer. It caught the error; it can fix the error. */
    showAlarm('outlier · T'+row.table+' '+row.position+' '+r.vwc.toFixed(1)+'% · Δ'+
      (dref>=0?'+':'')+dref.toFixed(1)+' from '+(pc?'the last sweep here':'this table'),
      {undo:true});
  }
  else if(row.vwc<f+6) beep('warn');
  else beep('ok');
  step('logged '+(stop.spot?'spot':'T'+stop.t+' '+stop.pos+' '+(stop.depth==='reference'?'ref':'mid'))+
    ' '+r.vwc.toFixed(1)+'%');
  /* §6.7: a reference that lands low earns a mid-bag stab at the same
     position, inserted now rather than routed in advance — the route cannot
     know which references will come back dry. Skipped when the next stop is
     already that mid, which is what profile mode routes. */
  if(!stop.spot && S.mode==='sweep' && wantsMid(S.room,stop.depth,r.vwc)){
    var nx=S.route[S.i+1];
    var already=nx && nx.t===stop.t && nx.pos===stop.pos && nx.depth==='mid-bag';
    if(!already){
      S.route.splice(S.i+1,0,{t:stop.t,pos:stop.pos,depth:'mid-bag',auto:true});
      toast('below '+midTrigger(S.room)+' — mid-bag stab at the same spot');
    }
  }
  advance(stop);
}
function advance(stop){
  S.i++; saveSession();
  var nxt=S.route[S.i];
  var tableDone=S.mode==='sweep' && !stop.spot && (!nxt || nxt.t!==stop.t);
  /* Weekend Plan 1.3: T6-front to T7-front reads identically on screen at
     a glance, and a room is loud enough that one more beep in the same
     register stops registering. tableDone already has its own tone; this
     adds a haptic buzz and a pulse on the table number itself. */
  if(tableDone){ beep('tableDone'); vibrate(BUZZ_TABLE); pulseTable(); }
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
/* Feature-detected: most of iOS Bluefy has no Vibration API at all, and a
   missing one costs nothing here — the beep and the pulse still fire. */
var BUZZ_TABLE=[40,60,40];
function vibrate(pattern){
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}
function pulseTable(){
  var el=$('pos'); if(!el) return;
  el.classList.remove('pulse');
  void el.offsetWidth;   /* restart the animation even table-to-table */
  el.classList.add('pulse');
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
  var wasI=S.i;
  S.i=(r._i!=null)?r._i:Math.max(0,S.i-1);
  var extraStop=null;
  /* an adjacent-plant stop, or the conditional mid-bag the undone reference
     called for (§6.7) — either way it was created by the row coming off */
  if(S.route[S.i] && (S.route[S.i].extra || S.route[S.i].auto)){
    extraStop=S.route.splice(S.i,1)[0];
  }
  S.redo.push({row:r, extraStop:extraStop, i:wasI});
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
  S.rows.push(rec.row);
  S.i=(rec.i!=null)?rec.i:S.i+1;
  var r=rec.row, key=r.room+'|'+r.table+'|'+r.position+'|'+r.depth;
  PREV[key]={d:r.date,v:r.vwc,e:r.ec,ts:Date.now()};
  lsSet('stab_prev',JSON.stringify(PREV));
  S.last={vwc:r.vwc,ec:r.ec,tmp:r.tmp,bulk:r.bulk,raw:r.raw,direct:true,counts:0};
  S.lastAt=Date.now();
  saveSession(); render(); flash();
  step('redone T'+r.table+' '+r.position+' '+r.vwc.toFixed(1)+'%');
};
$('note').onclick=function(){
  var s=S.route[S.i];
  var t=(S.mode==='spot' && S.spotTable!=null) ? S.spotTable
        : (s?s.t:(S.rows.length?S.rows[S.rows.length-1].table:null));
  if(t==null||t==='?'){ toast('notes are per table'); return; }
  openPegs(t);
};
$('pos').onclick=function(){ openTarget(null); };
$('schedbtn').onclick=openSchedule;
$('cfgbtn').onclick=openRoomSetup;
$('weekly').onclick=openDay;
$('dayclose').onclick=function(){ $('daysheet').classList.add('hide'); };
/* Tank readings (Weekend Plan 1.5) — one entry point, once a day, for the
   number the dilution rule actually needs. A room reads it through its
   tank assignment in room config; a room on water reads 0 regardless. */
function renderTanks(){
  var el=$('tankbody'); if(!el) return;
  var t=getTanks();
  el.innerHTML=TANK_IDS.map(function(id){
    var r=t[id]||{};
    return '<div class="tankrow"><label>'+id+'</label>'+
      '<input class="tec" data-id="'+id+'" inputmode="decimal" placeholder="EC" value="'+(r.ec!=null?r.ec:'')+'">'+
      '<input class="tph" data-id="'+id+'" inputmode="decimal" placeholder="pH" value="'+(r.ph!=null?r.ph:'')+'">'+
      '<input class="torp" data-id="'+id+'" inputmode="numeric" placeholder="ORP" value="'+(r.orp!=null?r.orp:'')+'">'+
      '</div>';
  }).join('');
}
$('tanksave').onclick=function(){
  var t=getTanks();
  var now=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
  TANK_IDS.forEach(function(id){
    var ec=parseFloat((document.querySelector('#tankbody .tec[data-id="'+id+'"]')||{}).value);
    var ph=parseFloat((document.querySelector('#tankbody .tph[data-id="'+id+'"]')||{}).value);
    var orp=parseFloat((document.querySelector('#tankbody .torp[data-id="'+id+'"]')||{}).value);
    var rec={};
    if(!isNaN(ec)) rec.ec=ec;
    if(!isNaN(ph)) rec.ph=ph;
    if(!isNaN(orp)) rec.orp=orp;
    if(Object.keys(rec).length){ rec.time=now; t[id]=rec; }
    else delete t[id];
  });
  lsSet(tanksKey(), JSON.stringify(t));
  toast('tank readings saved');
};
$('cfgclose').onclick=function(){ $('cfgsheet').classList.add('hide'); };
$('cfgsave').onclick=function(){
  if(!saveRoomSetup()) return;
  $('cfgsheet').classList.add('hide');
  showRoomCfg(); showBrief();
  toast('room setup saved for '+S.room);
};
$('schedparse').onclick=function(){
  SCHEDPARSE=parseSchedule($('schedpaste').value);
  drawSchedParse();
};
$('schedok').onclick=function(){
  var r=SCHEDPARSE;
  if(!r || !r.tables.length) return;
  /* One paste, every room in it. The weekly blob carries all nineteen, and
     saving them one room at a time was nineteen trips through this screen. */
  var groups=(r.rooms&&r.rooms.length)?r.rooms:[{room:S.room, tables:r.tables}];
  var n=0, skipped=[];
  groups.forEach(function(g){
    var rm=(groups.length===1)?S.room:g.room;
    if(!ROOMS[rm]){ skipped.push(g.room); return; }
    saveSched(rm,{savedAt:Date.now(), asOf:r.asOf||null, room:rm, tables:g.tables});
    n++;
  });
  $('schedsheet').classList.add('hide');
  showBrief();
  toast(n>1 ? 'schedules saved for '+n+' rooms · '+r.tables.length+' tables'+
              (skipped.length?' · skipped '+skipped.join(', '):'')
            : 'schedule saved for '+S.room+' · '+r.tables.length+' tables');
};
$('schedclose').onclick=function(){ $('schedsheet').classList.add('hide'); SCHEDPARSE=null; };
$('schedlogexport').onclick=function(){
  if(!S.room){ toast('pick a room first'); return; }
  var n=getSchedLog().filter(function(e){ return e.room===S.room; }).length;
  if(!n){ toast('no logged changes for '+S.room+' yet'); return; }
  shareOrCopy(buildSchedLogCsv(S.room), S.room+'_schedule_history_'+fnameDate()+'.csv',
    S.room+' change log ('+n+')');
};
$('targetcancel').onclick=function(){ $('targetsheet').classList.add('hide'); TP.forRow=null; };
$('exit').onclick=function(){
  if(S.rows.length){
    if(!confirm('End sweep with '+S.rows.length+' readings?')) return;
    finish();
    return;
  }
  /* Nothing was logged, and that is two different situations: a bag-feel
     sweep of a room, which must be recorded and flagged (§3), or a room
     opened by mistake, which should leave no trace. START was one-way — the
     only exit recorded a sweep either way — so an accidental tap put an
     empty session in the history and a room's tile went to "swept today". */
  if(skippedList().length){ finish(); return; }   /* skips are a record */
  if(confirm('No readings logged.\n\nOK — record this as a hand-only sweep of '+S.room+'.\n\n'+
             'Cancel — discard it, as if the room was never opened.')){
    finish();
    return;
  }
  abandonSweep();
};
/* Back out of a sweep with nothing recorded: no history entry, no CSV, no
   coverage, and the room's tile untouched. */
function abandonSweep(){
  S.roomStarted=false; S.finished=false;
  S.rows=[]; S.notes={}; S.free={}; S.skipped={}; S.redo=[];
  S.route=[]; S.i=0; S.alarmQueue=[]; renderAlarm();
  S.awaiting=false; clearTimeout(S.rt);
  releaseAwake();
  clearSession();
  ['hdr','route','main','pad'].forEach(function(id){$(id).classList.add('hide');});
  ['pegsheet','calsheet','logsheet','targetsheet'].forEach(function(id){$(id).classList.add('hide');});
  S.pegsOpen=false; S.logOpen=false;
  $('done').classList.add('hide');
  $('setup').classList.remove('hide');
  $('startbar').classList.add('up');
  step('sweep discarded — nothing recorded');
  toast('discarded — nothing recorded');
}
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
  var info=strainFor(S.room, tbl);
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
  /* ts is the event's id — closeEv() finds a fault by it. Two events logged
     in the same millisecond would share one, and marking either fixed would
     close both. A human cannot tap that fast, but tagging a row of tables
     for flush can, and a silently closed fault is a leak nobody goes back
     to. Nudge past any collision; ordering is preserved either way. */
  var last=getEv()[0];
  e.ts=Date.now();
  if(last && e.ts<=last.ts) e.ts=last.ts+1;
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
/* §4: whether a stored sweep may hold a record. Entries written before this
   rule existed carry no qual field; they are not grandfathered in, because
   the whole reason for the rule is that some of them are three-second walks
   in and out. An old entry qualifies only if it can still prove it. */
function histQualifies(h){
  if(!h || h.mode && h.mode!=='sweep') return false;
  if(h.qual===true) return true;
  if(h.qual===false) return false;
  var cfg=ROOMS[h.room];
  if(!cfg || cfg.kind) return false;
  if(!h.n || !h.dur) return false;
  var live=cfg.t-(h.skipped||0);
  if(live<=0) return false;
  /* pre-rule entries recorded no coverage or frame count, so infer what can
     be inferred: stabs per live table stands in for both. */
  return h.n >= 2*Math.ceil(live*0.8);
}
function qualWhy(){
  if(S.mode!=='sweep') return 'only full sweeps are timed';
  if(probeFrames()===0) return 'no probe reading';
  var c=coverage(), live=c.total-c.skipped;
  if(live<=0) return 'no tables left to sweep';
  if(c.swept<Math.ceil(live*0.8))
    return c.swept+' of '+live+' tables, needs '+Math.ceil(live*0.8);
  return measuredRows().length+' stabs over '+c.swept+' tables, needs '+(2*c.swept);
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
  /* §4: a record needs a qualifying sweep under it. "Clean" only said
     nothing went wrong, which is trivially true of walking in and tapping
     out, and that is what was setting records. */
  var qual=qualifyingSweep();
  var spm=stabsPerMin(measuredRows().length,dur);
  /* previous same-room sweep for delta, and the records this one is racing:
     the room's own and the facility's. Elapsed and stabs/min are kept apart
     because they reward opposite things — elapsed gets better by skipping
     tables, stabs/min does not. */
  var hist=getHist(), prev=null, pr=null, prSpm=null, fsSpm=null, fsRoom=null;
  for(var i=0;i<hist.length;i++){
    var h=hist[i];
    if(h.mode && h.mode!=='sweep') continue;
    if(!histQualifies(h)) continue;
    if(h.room===S.room){
      if(h.dur && (pr==null||h.dur<pr)) pr=h.dur;
      if(h.spm && (prSpm==null||h.spm>prSpm)) prSpm=h.spm;
    }
    if(h.spm && (fsSpm==null||h.spm>fsSpm)){ fsSpm=h.spm; fsRoom=h.room; }
  }
  for(var i2=0;i2<hist.length;i2++){
    var hp=hist[i2];
    if(hp.room!==S.room) continue;
    if(hp.mode && hp.mode!=='sweep') continue;
    if(hp.med!=null){ prev=hp; break; }
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
  html+='time '+fmtDur(dur)+(spm?' · '+spm.toFixed(1)+' stabs/min':'');
  if(S.mode==='sweep'){
    if(clean) html+=' · <span class="pr">clean ✓</span>';
    if(qual){
      html+='<br>';
      html+=(pr==null||dur<pr) ? '<span class="pr">fastest '+S.room+' yet</span>'
                               : S.room+' best '+fmtDur(pr);
      if(spm){
        html+=(prSpm==null||spm>prSpm) ? ' · <span class="pr">best pace here</span>'
                                       : ' · pace best '+prSpm.toFixed(1);
        if(fsSpm==null||spm>fsSpm) html+=' · <span class="pr">facility best pace</span>';
        else html+=' · facility '+fsSpm.toFixed(1)+' ('+fsRoom+')';
      }
    }else{
      html+='<br><span class="low">not a qualifying sweep — '+qualWhy()+'</span>';
    }
  }
  if(handOnlyBlind()) html+='<br><span class="low">'+NO_PROBE_FLAG+
    ' — no probe reading, and this room\'s floor is '+floorFor(S.room)+
    '. The hand goes blind below about '+HAND_LIMIT+', so bag feel cannot find a table under it.</span>';
  html+='<br>operator '+S.op+' · side '+S.side;
  $('stats').innerHTML=html;
  buildExports();
  clearChangedIfConfirmed();
  try{
    if(DEMO) throw 0;
    var h2=getHist();
    var histTs=Date.now();
    h2.unshift({room:S.room, when:new Date().toLocaleString('en-US'), ts:histTs,
      n:S.rows.length, mode:S.mode, dir:S.dir, med:(m==null?null:+m.toFixed(1)), low:lows,
      dur:dur, clean:clean, qual:qual, spm:(spm==null?null:+spm.toFixed(2)),
      probeFrames:S.probeFrames||0, handOnly:handOnlyBlind(), op:S.op||'',
      skipped:skippedList().length, swept:coverage().swept,
      csv:CSV_TEXT, wb:WB_TEXT, wbrow:ROW_TEXT, wbroom:ROOM_TEXT,
      dbg:{polls:DBG.polls,directs:DBG.directs,writeFails:DBG.writeFails,timeouts:DBG.timeouts,unstable:S.unstable||0},
      notes:JSON.parse(JSON.stringify(S.notes||{})), free:JSON.parse(JSON.stringify(S.free||{}))});
    saveHist(h2);
    S._histTs=histTs;
  }catch(e){}
  clearSession();
  PREF.lastDir=S.dir; savePrefs();
  if(!canShareFiles()) $('share').style.display='none';
  $('dbg').textContent='pkts '+DBG.pkts+' · polls '+DBG.polls+' · direct '+DBG.directs+
    ' · status '+DBG.statusFrames+' · writeFail '+DBG.writeFails+' · timeouts '+DBG.timeouts+
    ' · lastLat '+(S.lastLat==null?'—':S.lastLat+'ms')+
    ' · batt '+(S.batt==null?'no reply':S.batt+'%')+
    (DBG.sensorErr?' · sensor errors '+DBG.sensorErr+' (last '+DBG.lastSensorErr+')':'')+
    (DBG.unparsed.length?('\n\nunparsed:\n'+DBG.unparsed.join('\n')):'\n\nno unparsed packets');
  showHist();
  beep('sweepDone');
}
/* ---------------- CSV / workbook / CHECK exports ----------------
   Pulled out of finish() so re-rooming (Weekend Plan 1.2) can rebuild
   everything room-derived without duplicating a 40-line block. Reads S.rows
   and S.room; writes CSV_TEXT/WB_TEXT/ROW_TEXT/ROOM_TEXT and the matching
   textareas/checks on screen. Safe to call more than once. */
function buildExports(){
  /* CSV: original 22 columns, then appended */
  var head='Date,Time,Room,Table,Position,Depth,Plant,Strain,Flags,Hrs since shot,Mode,Dir,Bag gal,Media,Side,VWC,Pore EC,Bulk EC,Temp F,Below floor,Row notes,Raw,Feed EC,Feed pH,Operator,Frame,Batt,Lat ms,Settle n,Unstable,Implausible,Manual commit,Zero EC flag,Skipped,After mid-sweep shot,Sweep flags,Tank,Drippers,Open flags,Probe\n';
  var swx=sweepFlags();
  if(S.postFlush) swx.push('POST_FLUSH');
  if(DBG.sensorErr) swx.push('SENSOR_ERR:'+DBG.lastSensorErr+'x'+DBG.sensorErr);
  var swFlags=swx.join(' ');
  var lines=S.rows.map(function(r){
    return [r.date,r.time,r.room,r.table,r.position,r.depth,r.plant,csvq(r.strain),r.flags,r.hrs,
      r.mode,r.dir,r.bag,r.media,r.side,r.vwc,(r.ec==null?'':r.ec),r.bulk,
      (r.tmp*9/5+32).toFixed(1),(r.flag?'YES':''),csvq(rowNote(r.table)),csvq(r.raw),
      (r.feedEC==null?'':r.feedEC),(r.feedPH==null?'':r.feedPH),r.op||'',r.frame||'',(r.batt==null?'':r.batt),(r.lat==null?'':r.lat),(r.tries==null?'':r.tries),(r.unstable?'YES':''),(r.implaus?'YES':''),
      (r.manualCommit?'YES':''),(r.zeroEc?'YES':''),csvq(skipReason(r.table)),(r.postShot?'YES':''),swFlags,
      tankFor(S.room),(typeof r.table==='number'?drippersFor(S.room,r.table):''),
      csvq(flagLine(S.room,r.table)),r.probe||''].join(',');
  });
  /* A §2.1: a table that was never measured leaves no row, so the skip was
     invisible in the export — B-1 shipped 18 rows for three tables with no
     record that eight were skipped or why. One record row per skipped table,
     measurements empty, carries it. */
  /* index by name: appending a column has broken a positional write twice
     now, once in the export itself and once in three different tests */
  var cols=head.trim().split(',');
  var nCols=cols.length, iSkip=cols.indexOf('Skipped'), iFlags=cols.indexOf('Sweep flags'),
      iTank=cols.indexOf('Tank'), iProbe=cols.indexOf('Probe');
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
    cells[iFlags]=swFlags; cells[iTank]=tankFor(S.room);
    cells[iProbe]=S.probeName||'';
    lines.push(cells.join(','));
  });
  /* §3: a hand-only sweep produces no rows at all, so without this the whole
     walk exports as a bare header line and reads as "nothing happened". One
     record row carries the room, the operator and the flag. */
  if(!lines.length && S.roomStarted){
    var hc=[]; while(hc.length<nCols) hc.push('');
    hc[0]=skD; hc[1]=skT; hc[2]=S.room;
    hc[10]=S.mode; hc[11]=S.dir;
    hc[12]=ROOMS[S.room]?ROOMS[S.room].bag:''; hc[13]=ROOMS[S.room]?ROOMS[S.room].media:'';
    hc[14]=S.side; hc[24]=S.op||'';
    hc[iFlags]=swFlags||'NO_READINGS'; hc[iTank]=tankFor(S.room);
    hc[iProbe]=S.probeName||'';
    lines.push(hc.join(','));
  }
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
/* ---------------- re-room (Weekend Plan 1.2) ----------------
   A full C3 sweep went out as A1 on 9/11 and nothing on the done screen
   said so. Table, position, depth and every measurement stay exactly as
   read; strain, floor, bag, drippers and hours since shot recompute for
   whichever room actually took the readings — reRoomRows does the work,
   buildExports reruns the CSV/workbook/CHECK. The sweep is already in
   history by the time this screen is up (finish() writes it immediately),
   so that entry is kept in sync too, matched by the timestamp finish()
   stamped it with rather than by room name — the room name is exactly
   what is changing. */
function showReroomSheet(){
  var el=$('reroomgrid'); if(!el) return;
  var h='';
  ['A','B','C'].forEach(function(w){
    var keys=Object.keys(ROOMS).filter(function(k){ return k[0]===w && !ROOMS[k].kind; });
    if(!keys.length) return;
    h+='<div class="wl">'+w+' WING</div><div class="wing">'+
      keys.map(function(k){ return '<button class="rm'+(k===S.room?' on':'')+'" data-room="'+k+'">'+k+'</button>'; }).join('')+
      '</div>';
  });
  el.innerHTML=h;
  [].forEach.call(el.querySelectorAll('.rm'),function(b){
    b.onclick=function(){ applyReroom(b.dataset.room); };
  });
  $('reroomsheet').classList.remove('hide');
}
function applyReroom(newRoom){
  if(!ROOMS[newRoom] || ROOMS[newRoom].kind) return;
  if(newRoom===S.room){ $('reroomsheet').classList.add('hide'); return; }
  var oldRoom=S.room;
  if(!confirm('Re-room this sweep from '+oldRoom+' to '+newRoom+'?\n\n'+
     'Table, position and depth stay exactly as read. Strain, floor, bag, '+
     'drippers and hours since shot recompute for '+newRoom+'.')) return;
  S.rows=reRoomRows(S.rows, newRoom);
  S.room=newRoom;
  $('reroomsheet').classList.add('hide');
  $('dtitle').textContent=S.room+' · '+S.rows.length+' readings';
  buildExports();
  if(!DEMO){
    try{
      var h=getHist();
      if(h.length && S._histTs && h[0].ts===S._histTs){
        h[0].room=S.room;
        h[0].csv=CSV_TEXT; h[0].wb=WB_TEXT; h[0].wbrow=ROW_TEXT; h[0].wbroom=ROOM_TEXT;
        var msd2=measuredRows();
        var v2=msd2.filter(function(r){return r.depth==='reference';}).map(function(r){return r.vwc;});
        h[0].med=v2.length?+med(v2).toFixed(1):null;
        h[0].low=msd2.filter(function(r){return r.flag;}).length;
        saveHist(h);
      }
    }catch(e){}
  }
  toast('re-roomed '+oldRoom+' → '+newRoom);
}
$('reroom').onclick=showReroomSheet;
$('reroomcancel').onclick=function(){ $('reroomsheet').classList.add('hide'); };
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
/* ---- full backup / restore (Weekend Plan 1.6) ----
   Storage is per device and a second phone is coming. Every stored sweep
   (the CSV and workbook text already sitting in stab_hist) plus room
   config, in one shareable file — a lost or wiped phone should not be a
   lost day's sweeps. */
function backupKey(){ return 'stab_backup_'+new Date().toLocaleDateString('en-US').replace(/\//g,'-'); }
function backupDone(){ try{ return localStorage.getItem(backupKey())==='1'; }catch(e){ return false; } }
function markBackedUp(){ try{ localStorage.setItem(backupKey(),'1'); }catch(e){} }
function runBackup(){
  var h=getHist();
  if(!h.length){ toast('no stored sweeps yet'); return; }
  var pack={kind:'stab_backup',v:1,op:S.op,exported:Date.now(),hist:h,roomcfg:roomCfg()};
  shareOrCopy(JSON.stringify(pack),'stab_backup_'+fnameDate()+'.json',
    'backup ('+h.length+' sweep'+(h.length>1?'s':'')+')');
  markBackedUp();
  renderBackupNudge();
}
function importBackupText(txt){
  var pack;
  try{ pack=JSON.parse(txt); }catch(e){ toast('that is not a backup file'); return; }
  if(!pack || pack.kind!=='stab_backup' || !Array.isArray(pack.hist)){ toast('that is not a stab backup'); return; }
  /* merge by ts: this phone's own sweeps stay, the other phone's sweeps
     that are missing here get added — never a blind overwrite */
  var h=getHist(), have={}; h.forEach(function(x){ if(x.ts) have[x.ts]=true; });
  var added=0;
  pack.hist.forEach(function(x){ if(!x.ts || !have[x.ts]){ h.push(x); added++; } });
  h.sort(function(a,b){ return (b.ts||0)-(a.ts||0); });
  saveHist(h);
  var rc=roomCfg(), merged=0;
  Object.keys(pack.roomcfg||{}).forEach(function(rm){
    if(!rc[rm]){ rc[rm]=pack.roomcfg[rm]; merged++; }
  });
  lsSet('stab_roomcfg',JSON.stringify(rc));
  $('backuppaste').value=''; $('backuppaste').classList.add('hide');
  toast('restored: '+added+' sweep'+(added===1?'':'s')+', '+merged+' room config'+(merged===1?'':'s'));
}
function renderBackupNudge(){
  var el=$('backupnudge'); if(!el) return;
  var h=getHist();
  var due=h.length>0 && !backupDone();
  el.classList.toggle('hide', !due);
  if(due) $('backupcount').textContent=h.length+' saved sweep'+(h.length>1?'s':'')+' on this phone only';
}
/* Today's tank readings, keyed by tank (A/B/C/Veg) — Weekend Plan 1.5. A
   fresh calendar day starts blank on purpose: yesterday's EC is not a fact
   about today's tank, and carrying it forward silently would be exactly
   the ASSUMED-constant mistake this replaces. Late-bound like getSched. */
function tanksKey(){ return 'stab_tanks_'+new Date().toLocaleDateString('en-US').replace(/\//g,'-'); }
function getTanks(){
  try{ return JSON.parse(localStorage.getItem(tanksKey())||'{}'); }catch(e){ return {}; }
}
/* Strain renames (Weekend Plan 2.3, §6.5). Late-bound like getSched, so
   pure.js's applyRename reaches this without knowing about storage. Built
   now; the three pending renames are not entered until Andy says Monday —
   this list starts and stays empty until someone actually uses the tool. */
function getRenames(){
  try{ return JSON.parse(localStorage.getItem('stab_renames')||'[]'); }catch(e){ return []; }
}
function saveRename(entry){
  var a=getRenames(); a.push(entry); lsSet('stab_renames', JSON.stringify(a));
}
function openRenameSheet(){
  var sel=$('rn_old'); if(!sel) return;
  sel.innerHTML=allStrainNames().map(function(n){ return '<option value="'+esc(n)+'">'+esc(n)+'</option>'; }).join('');
  $('rn_new').value='';
  var t=new Date();
  $('rn_date').value=t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);
  renderRenames();
  $('renamesheet').classList.remove('hide');
}
function renderRenames(){
  var el=$('renamelist'); if(!el) return;
  var list=getRenames().slice().sort(function(a,b){ return b.savedAt-a.savedAt; });
  if(!list.length){ el.innerHTML='<div class="renamerow">nothing renamed yet</div>'; return; }
  var today=new Date().toISOString().slice(0,10);
  el.innerHTML=list.map(function(r){
    var pending=r.effectiveDate>today;
    return '<div class="renamerow"><b>'+esc(r.old)+'</b> → <b>'+esc(r.new)+'</b> · effective '+
      esc(r.effectiveDate)+(pending?' <span class="pend">(pending)</span>':' (active)')+'</div>';
  }).join('');
}
function saveSched(rm,rec){
  var a=getSched(), was=a[rm];
  /* §6.4: a room whose shot structure just changed needs a reading 1-2 h
     after its next P1 to confirm the front still reaches the bottom of the
     bag. Nobody remembers which rooms those are by Thursday, so the diff
     against the previous import is kept and the room says so until a sweep
     lands in that window. */
  var diffs=schedDiff(rm, was, rec);
  if(diffs.length) rec.changed={at:Date.now(), diffs:diffs};
  else if(was && was.changed) rec.changed=was.changed;
  a[rm]=rec; lsSet('stab_sched',JSON.stringify(a));
  logSchedDiff(rm, was, rec);
}
/* M:SS, for a diff and the workbook's Room Schedule History export (§2.2)
   — "Durations M:SS text". schedFmt (5m 15s) is the per-table detail
   screen's own format and stays as it is; this is a different reading. */
function mmss(sec){
  if(sec==null) return '—';
  var m=Math.floor(sec/60), s=Math.round(sec%60);
  return m+':'+(s<10?'0':'')+s;
}
/* Every field difference on one table between two schedule imports —
   Weekend Plan 2.1. The old version stopped at the first field that
   differed, so a paste that moved both the start time and the shot count
   silently dropped the second change. This reports all of it: start, P1
   shot×frequency (with the mL that shot delivers, since a duration or
   frequency change is the volume conversation), interval, P2 appearing/
   parking/changing, the flush timer, and on/off. Returns the parts array
   (for the diff screen, which wants them separable) or null when nothing
   actually differs. */
function schedTableDiffParts(rm, o, t){
  if(!o || !t) return null;
  var parts=[];
  if(!!o.inactive!==!!t.inactive) parts.push(t.inactive?'on → off':'off → on');
  var a=o.P1||{}, b=t.P1||{};
  if(a.start && b.start && a.start!==b.start)
    parts.push(fmt12(+a.start.split(':')[0],a.start.split(':')[1])+' → '+
               fmt12(+b.start.split(':')[0],b.start.split(':')[1]));
  if((a.duration!=null && b.duration!=null && a.duration!==b.duration) ||
     (a.frequency!=null && b.frequency!=null && a.frequency!==b.frequency))
    parts.push(mmss(a.duration)+'×'+(a.frequency||'—')+' → '+mmss(b.duration)+'×'+(b.frequency||'—'));
  if(a.interval!=null && b.interval!=null && a.interval!==b.interval)
    parts.push((a.interval/3600).toFixed(1)+'h → '+(b.interval/3600).toFixed(1)+'h');
  var oP2=!!o.P2, nP2=!!t.P2;
  if(oP2 && !nP2) parts.push('P2 parked');
  else if(!oP2 && nP2) parts.push('P2 added');
  else if(oP2 && nP2 && (o.P2.start!==t.P2.start || o.P2.duration!==t.P2.duration || o.P2.frequency!==t.P2.frequency))
    parts.push('P2 '+mmss(o.P2.duration)+'×'+(o.P2.frequency||'—')+' → '+mmss(t.P2.duration)+'×'+(t.P2.frequency||'—'));
  var of=(o.flush&&o.flush.duration!=null)?o.flush.duration:null;
  var nf=(t.flush&&t.flush.duration!=null)?t.flush.duration:null;
  if(of!==nf && (of!=null||nf!=null)) parts.push('flush '+mmss(of)+' → '+mmss(nf));
  if(!parts.length) return null;
  /* the volume conversation, once anything about P1's daily runtime moved */
  if(o.runtimeSec!=null && t.runtimeSec!=null && o.runtimeSec!==t.runtimeSec){
    var mo=mlPerPlant(rm,t.table,o.runtimeSec/60), mn=mlPerPlant(rm,t.table,t.runtimeSec/60);
    if(mo!=null && mn!=null) parts.push(mo+' → '+mn+' mL');
  }
  return parts;
}
function schedDiff(rm, was, now){
  if(!was || !was.tables || !now || !now.tables) return [];
  var old={}, out=[];
  was.tables.forEach(function(t){ old[t.table]=t; });
  now.tables.forEach(function(t){
    var parts=schedTableDiffParts(rm, old[t.table], t);
    if(parts) out.push('T'+t.table+' '+parts.join(' · '));
  });
  return out;
}
/* ---------------- change log, per room (Weekend Plan 2.2) ----------------
   Every table-level schedule change, kept forever — not just the "still
   needs a post-change read" flag saveSched already tracks — for exporting
   into the workbook's own Room Schedule History layout. One entry per
   table that actually changed, storing the full before/after snapshots
   rather than a pre-formatted string, so the export renders straight from
   the data schedTableDiffParts already agrees on. */
function getSchedLog(){
  try{ return JSON.parse(localStorage.getItem('stab_schedlog')||'[]'); }catch(e){ return []; }
}
function logSchedDiff(rm, was, now){
  if(!was || !was.tables || !now || !now.tables) return;
  var old={}; was.tables.forEach(function(t){ old[t.table]=t; });
  var log=getSchedLog(), added=false;
  now.tables.forEach(function(t){
    var o=old[t.table];
    if(!schedTableDiffParts(rm, o, t)) return;
    log.push({ts:Date.now(), room:rm, table:t.table, op:S.op||'', note:'', before:o, after:t});
    added=true;
  });
  if(added) lsSet('stab_schedlog', JSON.stringify(log));
}
/* The workbook's own Room Schedule History layout. Growlink's three phase
   types are P1, P2 and flush; the workbook calls the third one P3 — same
   timer, different name. P3 On reads OFF when a table carries no flush
   timer at all, same as the spec asks for P3 specifically; the others get
   the neutral '—' schedFmt/mmss already uses for "not applicable" rather
   than invent a second convention. */
function schedLogRow(e){
  var t=e.after||{}, p1=t.P1||{}, p2=t.P2||null, p3=t.flush||null;
  var onTxt=function(ph){ return ph ? (ph.start?fmt12(+ph.start.split(':')[0],ph.start.split(':')[1]):'—') : 'OFF'; };
  /* toFixed already returns the text with its trailing zero; wrapping it
     back through Number (as an earlier draft did) silently strips it, so
     50.0 minutes exports as "50" instead — the exact drift a workbook
     paste should never introduce. */
  var hrs=function(sec){ return sec!=null?(sec/3600).toFixed(2):''; };
  var vol=(t.runtimeSec!=null)?mlPerPlant(e.room,e.table,t.runtimeSec/60):null;
  return [new Date(e.ts).toLocaleDateString('en-US'),
    onTxt(p1), mmss(p1.duration), hrs(p1.interval), (p1.frequency!=null?p1.frequency:''),
    onTxt(p2), mmss(p2&&p2.duration), hrs(p2&&p2.interval), (p2&&p2.frequency!=null?p2.frequency:''),
    onTxt(p3), mmss(p3&&p3.duration), hrs(p3&&p3.interval), (p3&&p3.frequency!=null?p3.frequency:''),
    mmss(t.runtimeSec), (t.runtimeSec!=null?(t.runtimeSec/60).toFixed(1):''),
    (vol==null?'':vol), e.note||''];
}
function buildSchedLogCsv(rm){
  var head='Date,P1 On,Duration,Interval,Frequency,P2 On,Duration,Interval,Frequency,'+
    'P3 On,P3 Duration,P3 Interval,P3 Frequency,Total Runtime,Runtime (min),Volume,Notes\n';
  var rows=getSchedLog().filter(function(e){ return !rm || e.room===rm; })
    .sort(function(a,b){ return a.ts-b.ts; })
    .map(function(e){ return schedLogRow(e).map(csvq).join(','); });
  return head+rows.join('\n');
}
/* The post-shot window is 1 to 2 hours after P1. A sweep that lands in it
   is the confirmation the change was waiting for, so the flag clears. */
function clearChangedIfConfirmed(){
  var a=getSched(), rec=a[S.room];
  if(!rec || !rec.changed) return;
  var h=hoursSinceShot(S.room);
  if(h!=null && h>=1 && h<=2.5 && probeFrames()>0){
    delete rec.changed;
    lsSet('stab_sched',JSON.stringify(a));
  }
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
  $('schedok').textContent='Save schedule';
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
function drawSchedRooms(r){
  var unknown=r.rooms.filter(function(g){ return !ROOMS[g.room]; });
  var sched=getSched();
  /* Weekend Plan 2.1: the paste is a diff, not just a reading, even at
     nineteen rooms — a room nobody touched this week collapses to "same",
     and the ones that actually moved are what the screen is for. */
  var changedRooms=0;
  r.rooms.forEach(function(g){
    if(ROOMS[g.room] && schedDiff(g.room, sched[g.room], {tables:g.tables}).length) changedRooms++;
  });
  var h='<div class="sn">'+r.rooms.length+' rooms · '+r.tables.length+' tables'+
    (r.asOf?' · as of '+esc(r.asOf):'')+
    (changedRooms?' · '+changedRooms+' changed since last import':'')+'</div>';
  if(unknown.length) h+='<div class="sn bad">not rooms this app knows: '+
    unknown.map(function(g){ return esc(g.room); }).join(', ')+' — they will be skipped</div>';
  h+='<table class="sched"><tr><th>room</th><th>tables</th><th>first shot</th><th>state</th><th>changed</th></tr>';
  r.rooms.forEach(function(g){
    var known=!!ROOMS[g.room];
    var off=g.tables.filter(function(t){ return t.inactive; }).length;
    var bad=g.tables.filter(function(t){ return t.reconciles===false; }).length;
    var live=g.tables.filter(function(t){ return !t.inactive; })[0];
    var st=off===g.tables.length ? 'all off'
         : bad ? bad+' misread'
         : g.warnings.length ? 'short paste'
         : (off?off+' off':'ok');
    var diffs=known?schedDiff(g.room, sched[g.room], {tables:g.tables}):[];
    var chg=!known?'—':!sched[g.room]?'first import':diffs.length?diffs.length+' table'+(diffs.length>1?'s':''):'same';
    var cls=!known?' class="off"':(bad||g.warnings.length)?' class="bad"':(diffs.length?' class="chg"':'');
    h+='<tr'+cls+'><td>'+esc(g.room)+'</td><td>'+g.tables.length+'</td>'+
       '<td>'+(live&&live.P1.start?fmt12(+live.P1.start.split(':')[0],live.P1.start.split(':')[1]):'—')+'</td>'+
       '<td>'+st+'</td><td>'+chg+'</td></tr>';
  });
  h+='</table>';
  if(r.warnings.length) h+='<div class="sn bad">'+r.warnings.map(esc).join('<br>')+'</div>';
  $('schedbody').innerHTML=h;
  $('schedok').textContent='Save all '+r.rooms.filter(function(g){ return !!ROOMS[g.room]; }).length+' rooms';
  $('schedok').classList.remove('hide');
}
function schedFmt(sec){
  if(sec==null) return '—';
  var m=Math.floor(sec/60), r=Math.round(sec%60);
  return m+'m'+(r?' '+r+'s':'');
}
/* Weekend Plan 2.1: the paste is a diff, not just a reading. Unchanged
   tables collapse into a count; a changed table gets its own line, in the
   same format the change log and saveSched's post-shot flag already use —
   one diff engine, three consumers. */
function schedDiffSection(rm, freshTables){
  var stored=getSched()[rm];
  if(!stored || !stored.tables || !stored.tables.length)
    return '<div class="sn">first import for this room — nothing to compare against</div>';
  var diffLines=schedDiff(rm, stored, {tables:freshTables});
  if(!diffLines.length)
    return '<div class="sn">no change from the import saved '+
      (stored.savedAt?new Date(stored.savedAt).toLocaleDateString('en-US'):'earlier')+'</div>';
  var changed={}; diffLines.forEach(function(l){ var m=l.match(/^T(\S+)/); if(m) changed[m[1]]=true; });
  var nChanged=Object.keys(changed).length, nUnchanged=freshTables.length-nChanged;
  var h='<div class="sn chg">'+nChanged+' table'+(nChanged>1?'s':'')+' changed since '+
    (stored.savedAt?new Date(stored.savedAt).toLocaleDateString('en-US'):'the last import')+
    (nUnchanged>0?' · '+nUnchanged+' unchanged':'')+'</div>';
  h+=diffLines.map(function(l){ return '<div class="schedchg">'+esc(l)+'</div>'; }).join('');
  return h;
}
function drawSchedParse(){
  var r=SCHEDPARSE;
  if(!r || !r.tables.length){
    $('schedbody').innerHTML='<div class="sn bad">nothing read from that paste — is it a schedule screen?</div>';
    $('schedok').classList.add('hide');
    return;
  }
  /* The weekly blob is the whole facility, so the common case is nineteen
     rooms at once and the per-table detail would be 209 rows nobody reads.
     A room a line, with what is off and what is missing, is the check that
     matters at that size; the per-table screen stays for a single room. */
  if(r.rooms && r.rooms.length>1){ drawSchedRooms(r); return; }
  var wrongRoom=(r.room && r.room!==S.room);
  var h='';
  if(wrongRoom) h+='<div class="sn bad">that paste says '+r.room+', you are on '+S.room+'</div>';
  else h+=schedDiffSection(S.room, r.tables);
  h+='<div class="sn">'+r.tables.length+' table'+(r.tables.length>1?'s':'')+' read'+
     (r.warnings.length?' · '+r.warnings.length+' thing'+(r.warnings.length>1?'s':'')+' to look at':'')+'</div>';
  h+='<table class="sched"><tr><th>T</th><th>start</th><th>shot</th><th>every</th><th>x</th><th>total</th></tr>';
  r.tables.forEach(function(t){
    var p=t.P1||{};
    var bad=(t.reconciles===false);
    if(t.inactive){
      h+='<tr class="off"><td>'+t.table+(t.shared?'<span class="sh">+</span>':'')+'</td>'+
         '<td colspan="5">off — 0s total runtime</td></tr>';
      return;
    }
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
  var nOff=r.tables.filter(function(t){ return t.inactive; }).length;
  if(nOff) h+='<div class="sn">'+nOff+' table'+(nOff>1?'s are':' is')+
    ' switched off — no shots, and nothing computed from the weekly file either</div>';
  var nSen=r.tables.filter(function(t){ return t.sensor; }).length;
  h+='<div class="sn">'+nSen+' of '+r.tables.length+' tables carry a sensor name</div>';
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
  /* 1.5, corrected 9/12: always the live tank reading, never a persisted
     override — typing here is good for this sweep only, never saved as a
     new room-level constant (that was exactly the ASSUMED-constant mistake
     this item exists to end). */
  var live=feedEcFor(S.room);
  $('cfg_ec').value = (live!=null?live:'');
  $('cfg_ec').placeholder = tankFor(S.room) ? '0 = water' : 'no tank assigned';
  $('cfg_ph').value = saved.ph!=null ? saved.ph : '';
  el.classList.remove('hide');
}
function applyRoomCfg(){
  if(!S.room || !ROOMS[S.room]) return;
  var bag=parseFloat($('cfg_bag')?$('cfg_bag').value:0)||ROOMS[S.room].bag;
  var ecTxt=($('cfg_ec')?$('cfg_ec').value:'').trim().toLowerCase();
  /* "0", "w" or "water" means the room is on water; blank reads from the
     room's own tank (Weekend Plan 1.5), never a guessed constant. */
  var ec=(ecTxt==='0'||ecTxt==='w'||ecTxt==='water')?0:parseFloat(ecTxt);
  var ph=parseFloat($('cfg_ph')?$('cfg_ph').value:0);
  ROOMS[S.room].bag=bag;
  /* An explicit number here is a one-sweep override, not a saved constant
     — there is no room-level EC to preserve any more (Weekend Plan 1.5,
     corrected 9/12). Blank reads the room's own tank. */
  S.feedEC=(!isNaN(ec) && ec>=0) ? ec : feedEcFor(S.room);
  S.feedPH=(!isNaN(ph)&&ph>0)?ph:null;
  /* merge: this used to replace the whole record, which would drop the
     move-in fields (flower start, strains, drippers, tank) on every Start */
  var keep=roomCfg()[S.room]||{};
  keep.bag=bag; keep.ph=S.feedPH;
  delete keep.ec;   /* one-sweep only — never saved as a room-level constant */
  saveRoomCfg(S.room, keep);
}
/* ---------------- the day (backlog §6.3) ----------------
   At 3:13 PM on 9/10 the operator asked what he had covered and the answer
   meant reading the workbook. Every part of it was already in the app. */
function openDay(){
  var rows=dayCoverage(), h='';
  var done=rows.filter(function(r){ return r.swept && !r.handOnly; }).length;
  var hand=rows.filter(function(r){ return r.handOnly; }).length;
  $('daytop').textContent=new Date().toLocaleDateString('en-US',
    {weekday:'long',month:'short',day:'numeric'});
  $('daysub').textContent=done+' of '+rows.length+' rooms on the probe'+
    (hand?' · '+hand+' hand-only':'')+
    ' · '+rows.filter(function(r){ return r.postShotDue; }).length+' waiting on a post-change read';
  renderTanks();
  renderBackupNudge();
  /* §5.5: the sequence to walk, which is what the 3 PM question is really
     asking. The wing sections below stay, because that is how the rooms are
     laid out on the floor and he still navigates by them. */
  var wo=walkOrder();
  if(wo.length){
    h+='<div class="lbl">Walk order · soonest window first</div><div class="dayg">';
    wo.forEach(function(r,i){
      var w=r.window, tag='';
      if(w.kind==='post') tag=w.state==='open'
        ? '<span class="dtag chg">post-change read, due now</span>'
        : '<span class="dtag chg">post-change read · '+(w.hrs!=null?'in '+w.hrs.toFixed(1)+'h':'after the next shot')+'</span>';
      else if(w.state==='closed') tag='<span class="dtag late">window shut '+Math.abs(w.hrs).toFixed(1)+'h ago</span>';
      else if(w.hrs!=null) tag='<span class="dtag win">'+w.hrs.toFixed(1)+'h left</span>';
      h+='<button class="dayr wk '+(w.state==='open'?'todo':'shut')+'" data-r="'+r.room+'">'+
         '<b>'+(i+1)+'. '+r.room+'</b>'+
         '<span class="dw">'+(r.handOnly?'hand-only so far · needs the probe'
            :r.swept?'read, waiting on the change':'not read')+'</span>'+tag+'</button>';
    });
    h+='</div>';
  }else{
    h+='<div class="lbl">Walk order</div><div class="dayg">'+
       '<div class="dayr done"><b>nothing left</b><span class="dw">every active room has been read on the probe today</span></div></div>';
  }
  ['AM','PM','other'].forEach(function(wing){
    var g=rows.filter(function(r){ return r.wing===wing; });
    if(!g.length) return;
    h+='<div class="lbl">'+(wing==='AM'?'AM rooms · lights out 11:00'
        :wing==='PM'?'PM rooms · lights out 13:15':'other')+'</div><div class="dayg">';
    g.forEach(function(r){
      var cls=r.handOnly?'hand':(r.swept?'done':'todo');
      var what=r.handOnly ? 'hand-only · cannot detect below floor'
             : r.swept ? (r.at||'')+(r.op?' · '+r.op:'')+
                         (r.coverage!=null?' · '+r.coverage+'%':'')+' · '+r.n+' stabs'
             : 'not read';
      var tail='';
      if(r.postShotDue) tail+='<span class="dtag chg">post-change read due</span>';
      if(r.flags) tail+='<span class="dtag flg">'+r.flags+' flag'+(r.flags>1?'s':'')+'</span>';
      if(!r.swept && r.closesIn!=null && r.closesIn>0 && r.closesIn<3)
        tail+='<span class="dtag win">window closes in '+r.closesIn.toFixed(1)+'h</span>';
      if(!r.swept && r.closesIn!=null && r.closesIn<=0)
        tail+='<span class="dtag late">window closed</span>';
      h+='<button class="dayr '+cls+'" data-r="'+r.room+'"><b>'+r.room+'</b>'+
         '<span class="dw">'+what+'</span>'+tail+
         (r.changed&&r.changed.length?'<span class="dch">'+r.changed.join(' · ').replace(/</g,'&lt;')+'</span>':'')+
         '</button>';
    });
    h+='</div>';
  });
  $('daybody').innerHTML=h;
  [].forEach.call(document.querySelectorAll('#daybody .dayr'),function(b){
    b.onclick=function(){ $('daysheet').classList.add('hide'); pickRoom(b.dataset.r); };
  });
  $('daysheet').classList.remove('hide');
}

/* ---------------- room setup (backlog §5.4) ----------------
   Two wrong calls on 9/10 came from this being uneditable: C3 showed the
   previous grow's strain map and produced a wrong tiering recommendation,
   and B3 read DOF 77 when it was 7. Everything here changes at move-in, not
   weekly, and everything left blank falls back to the weekly file. */
function openRoomSetup(){
  if(!S.room || !ROOMS[S.room]){ toast('pick a room first'); return; }
  var c=roomCfg()[S.room]||{};
  $('cfgtop').textContent='Room setup · '+S.room;
  $('cfg_fs').value=c.flowerStart||'';
  $('cfg_fs').placeholder=FLOWER_START[S.room]||'YYYY-MM-DD';
  $('cfg_bag2').value=String(c.bag||ROOMS[S.room].bag);
  $('cfg_floor').value=(floorIsSet(S.room)?c.floor:'');
  $('cfg_plants').value=(c.plants!=null?c.plants:'');
  $('cfg_tank').value=c.tank||'';
  var st=roomState(S.room);
  [].forEach.call(document.querySelectorAll('#cfg_state .rst'),function(b){
    b.classList.toggle('on', b.dataset.st===st);
    b.onclick=function(){
      [].forEach.call(document.querySelectorAll('#cfg_state .rst'),function(x){x.classList.remove('on');});
      b.classList.add('on');
    };
  });
  $('cfg_floor').oninput=drawCfgFloor;
  $('cfg_bag2').onchange=drawCfgFloor;
  drawCfgFloor();
  drawCfgDof();
  var h='<table class="cfgt"><tr><th>T</th><th>strain</th><th>plants</th><th>drip</th><th>under</th></tr>';
  for(var t=1;t<=ROOMS[S.room].t;t++){
    var si=strainFor(S.room,t), under=(si[1]||'').indexOf('U')>=0;
    var pn=plantsFor(S.room,t);
    h+='<tr><td>'+t+'</td>'+
       '<td><input type="text" class="st" data-t="'+t+'" value="'+esc(si[0]||'')+'"></td>'+
       '<td><input type="text" class="pl'+(plantsKnown(S.room,t)?' known':'')+'" inputmode="numeric" '+
         'data-t="'+t+'" value="'+(pn==null?'':pn)+'"></td>'+
       '<td><input type="text" class="dr'+(drippersKnown(S.room,t)?' known':'')+'" inputmode="numeric" '+
         'data-t="'+t+'" value="'+drippersFor(S.room,t)+'"></td>'+
       '<td><button class="ul'+(under?' on':'')+'" data-t="'+t+'">U</button></td></tr>';
  }
  $('cfgtables').innerHTML=h+'</table>';
  [].forEach.call(document.querySelectorAll('#cfgtables .ul'),function(b){
    b.onclick=function(){ b.classList.toggle('on'); };
  });
  /* a hand-entered count is a counted one from the moment it is typed */
  [].forEach.call(document.querySelectorAll('#cfgtables .dr, #cfgtables .pl'),function(i){
    i.oninput=function(){ i.classList.add('known'); };
  });
  $('cfg_fs').oninput=drawCfgDof;
  $('cfgsheet').classList.remove('hide');
}
function esc(x){ return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
/* The floor is one number and everything downstream reads it: the feel
   words, the mid-bag trigger, below-floor counts, and whether a hand can
   find the floor at all. Bag size only supplies the starting value. */
function drawCfgFloor(){
  var el=$('cfg_floornote'); if(!el) return;
  var bag=parseFloat($('cfg_bag2').value)||2;
  var dflt=(FLOOR[bag]!=null?FLOOR[bag]:22);
  $('cfg_floor').placeholder=String(dflt);
  var v=($('cfg_floor').value||'').trim();
  var f=v===''?dflt:parseFloat(v);
  if(isNaN(f)||f<=0||f>60){ el.innerHTML='<span class="low">a floor wants a number between 1 and 60</span>'; return; }
  el.innerHTML='floor <b>'+f+'%</b>'+(v===''?' · from the weekly file':'')+
    ' · feel words break at '+FEEL_OFFSETS.map(function(o){ return f+o[0]; }).slice(0,4).join(' / ')+
    ' · mid-bag stab under '+Math.max(25,f)+
    (f>HAND_LIMIT?' · <span class="low">too high for bag feel — this room needs the probe</span>'
               :' · bag feel can reach it');
}
function drawCfgDof(){
  var v=($('cfg_fs').value||'').trim() || FLOWER_START[S.room] || '';
  var el=$('cfg_dof');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){ el.innerHTML='<span class="low">no flower start — DOF cannot be computed</span>'; return; }
  var p=v.split('-'), st=new Date(+p[0],+p[1]-1,+p[2]);
  if(isNaN(st.getTime())){ el.innerHTML='<span class="low">that is not a date</span>'; return; }
  var n=new Date(); n.setHours(0,0,0,0);
  var dof=Math.round((n-st)/86400000);
  el.innerHTML='DOF <b>'+dof+'</b> today'+
    (($('cfg_fs').value||'').trim()?'':' · from the weekly file')+
    (dof<0?' <span class="low">— that date is in the future</span>':'')+
    (dof>90?' <span class="low">— over 90 days, check it</span>':'');
}
function saveRoomSetup(){
  var c=roomCfg()[S.room]||{};
  var fs=($('cfg_fs').value||'').trim();
  if(fs && !/^\d{4}-\d{2}-\d{2}$/.test(fs)){ toast('flower start wants YYYY-MM-DD'); return false; }
  if(fs) c.flowerStart=fs; else delete c.flowerStart;
  c.bag=parseFloat($('cfg_bag2').value)||ROOMS[S.room].bag;
  var fv=($('cfg_floor').value||'').trim();
  if(fv===''){ delete c.floor; }
  else{
    var fn=parseFloat(fv);
    if(isNaN(fn)||fn<=0||fn>60){ toast('floor wants a number between 1 and 60'); return false; }
    c.floor=fn;
  }
  var stb=document.querySelector('#cfg_state .rst.on');
  c.state=stb?stb.dataset.st:'active';
  var pl=parseInt($('cfg_plants').value,10);
  if(!isNaN(pl) && pl>0) c.plants=pl; else delete c.plants;
  var tk=$('cfg_tank').value;
  if(tk) c.tank=tk; else delete c.tank;
  var strains={}, drip={}, anyS=false, anyD=false;
  [].forEach.call(document.querySelectorAll('#cfgtables .st'),function(i){
    var t=i.dataset.t, name=(i.value||'').trim();
    var u=document.querySelector('#cfgtables .ul[data-t="'+t+'"]').classList.contains('on');
    var old=strainFor(S.room,t);
    var flags=(old[1]||'').replace(/U/g,'')+(u?'U':'');
    if(name!==(old[0]||'') || flags!==(old[1]||'')){ anyS=true; }
    strains[t]=[name, flags];
  });
  [].forEach.call(document.querySelectorAll('#cfgtables .dr'),function(i){
    var n=parseInt(i.value,10);
    if(!isNaN(n) && n>0 && i.classList.contains('known')){ drip[i.dataset.t]=n; anyD=true; }
  });
  var plantsT={}, anyP=false;
  [].forEach.call(document.querySelectorAll('#cfgtables .pl'),function(i){
    var n=parseInt(i.value,10);
    if(!isNaN(n) && n>0 && i.classList.contains('known')){ plantsT[i.dataset.t]=n; anyP=true; }
  });
  if(anyS || (c.strains&&Object.keys(c.strains).length)) c.strains=strains;
  if(anyD) c.drippers=drip;
  if(anyP) c.plantsT=plantsT;
  c.savedAt=Date.now();
  saveRoomCfg(S.room, c);
  ROOMS[S.room].bag=c.bag;
  return true;
}
function loadRoomCfgAll(){
  var a=roomCfg();
  Object.keys(a).forEach(function(k){
    if(ROOMS[k] && a[k].bag) ROOMS[k].bag=a[k].bag;
    /* a saved feed EC is a one-sweep override from last time, not a
       constant to carry forward as a room fact (Weekend Plan 1.5,
       corrected 9/12) — feedEcFor reads the tank fresh every time instead */
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
  var tk=tankFor(S.room), fe=feedEcFor(S.room);
  var feedTxt=!tk ? 'no tank assigned'
    : isOnWater(S.room) ? 'on water'
    : 'tank '+tk+(fe!=null?' · feed '+fe:' · reading pending');
  rows.push(['room', (dof===''?'DOF —':'DOF '+dof)+' · '+cfg.bag+' gal · '+cfg.t+' tables · '+feedTxt]);
  var sc=schedLine(S.room);
  if(sc){
    var hs=hoursSinceShot(S.room), nx=hoursToNextShot(S.room);
    rows.push(['shots', sc]);
    rows.push(['now', (hs==null?'—':hs.toFixed(1)+'h since last shot')+
      (nx==null?'':' · next in '+nx.toFixed(1)+'h')]);
  }
  /* §4: say out loud which schedule those two lines came from. The weekly
     file goes stale between grows and looks exactly like a current one. */
  /* §6: room config went stale between grows and looked exactly like a
     current one. The button says when it was last confirmed. */
  var rc=roomCfg()[S.room]||{};
  var cb=$('cfgbtn');
  if(cb){
    var never=!rc.savedAt;
    cb.classList.toggle('stale',never);
    cb.textContent=never
      ? 'room setup · never confirmed for this grow'
      : 'room setup · confirmed '+new Date(rc.savedAt).toLocaleDateString('en-US');
  }
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
       'needs a dripper','fan','header crack','dead bag','needs flush',
       'dual source','no master valve','breaker reset']
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
      var water=isOnWater(k);
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
    /* §6.2: tables tagged "needs flush" during the week, collected. This
       list was assembled by hand in chat from a week of conversation. */
    var fl2=flushList();
    $('logrecent').innerHTML=
      (fl2.length
        ? '<div class="hl">tables tagged for flush</div><div class="r">'+
          fl2.join('<br>').replace(/</g,'&lt;')+'</div>'+
          '<div class="r"><button class="chip" id="flushcopy">copy the list</button></div>'
        : '<div class="hl">tables tagged for flush</div>'+
          '<div class="r">none — tag one with log · fault · "needs flush"</div>')+
      '<div class="hl">after the flush</div>'+
      '<div class="r">stab three tables per room about an hour after it drains — that is the field capacity reading</div>';
    if($('flushcopy')) $('flushcopy').onclick=function(){
      shareOrCopy(fl2.join(' · '),'flush_'+fnameDate()+'.txt','flush list');
    };
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

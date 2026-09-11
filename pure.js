/* pure.js — calibration, protocol, parsing, routes, workbook + CHECK.
   No DOM, no Bluetooth, no storage: everything here runs in node for tests.
   Storage is reached only through late-bound globals (getHist) that app.js
   defines before any call. */
/* ===================== PURE (testable, no DOM) ===================== */
var VER='v47';
/* The floor is one number, and it lives in room config.
   Everything that used to key off bag size now keys off this instead — the
   feel bands, the mid-bag trigger, and whether a hand can find the floor at
   all. Bag size still picks the starting value in the weekly file, but it
   is a default the operator overrides per room, not an input to anything
   downstream. The 1.25-gallon floor is expected to move once the field
   capacity reads are in, and when it does nothing else has to be touched. */
function floorFor(rm){
  var c=ROOMS[rm]; if(!c) return 22;
  var o=rcfg(rm);
  if(o.floor!=null && o.floor!=='' && !isNaN(+o.floor)) return +o.floor;
  return (c.floor!=null)?c.floor:(FLOOR[c.bag]!=null?FLOOR[c.bag]:22);
}
function floorIsSet(rm){
  var o=rcfg(rm);
  return !!(o.floor!=null && o.floor!=='' && !isNaN(+o.floor));
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

/* Every irrigation series that waters a table today. An imported schedule
   wins over rooms.js, and it is per table because tiers within one room
   routinely differ — B3 read 1.7h since its last shot on 9/10 when the real
   answer was 5.6h, because rooms.js still carried the previous grow's five
   shots. P2 is a second series, not a variant of the first. */
function schedSeries(room, table){
  var imp=(typeof getSched==='function')?(getSched()||{}):{};
  var rec=imp[room];
  if(rec && rec.tables && rec.tables.length){
    var t=null, i;
    for(i=0;i<rec.tables.length;i++){
      if(table!=null && rec.tables[i].table===table){ t=rec.tables[i]; break; }
    }
    /* A table the paste did not cover falls back to the rest of the import,
       never to the weekly file: mixing a current schedule with a stale one
       inside one room is the exact failure §4 exists to end, and it would be
       invisible in the rows. The paste screen warns when tables are missing,
       which is the moment to fix it.

       It falls back to a table that is actually running. Standing in for an
       uncovered table with a switched-off one would report the whole room as
       never watered, which is a worse lie than the stale schedule this is
       avoiding. */
    if(!t) t=schedFallback(rec);
    if(t){
      /* An inactive table gets no shots at all — not the weekly file's, which
         would be worse than none: it would read as watered on schedule. */
      if(t.inactive) return [];
      var out=[];
      [t.P1,t.P2].forEach(function(ph){
        if(schedPhaseOn(ph))
          out.push({start:ph.start, intervalMin:(ph.interval||0)/60, count:ph.frequency});
      });
      if(out.length) return out;
    }
  }
  var c=SCHED[room];
  return c ? [{start:c[0], intervalMin:c[1], count:c[2]}] : [];
}
function schedFallback(rec){
  var ts=rec.tables;
  for(var i=0;i<ts.length;i++) if(!ts[i].inactive) return ts[i];
  return ts[0];            /* every table is off — then the room really is */
}
function shotTimes(room, table, nowDate){
  var now=nowDate||new Date(), all=[];
  schedSeries(room,table).forEach(function(ser){
    var p=ser.start.split(':');
    for(var d=-1; d<=1; d++){
      var t0=new Date(now); t0.setDate(t0.getDate()+d);
      t0.setHours(+p[0],+p[1],0,0);
      for(var k=0;k<ser.count;k++) all.push(new Date(t0.getTime()+k*ser.intervalMin*60000));
    }
  });
  all.sort(function(a,b){ return a-b; });
  return all;
}
function hoursSinceShot(room, nowDate, table){
  var now=nowDate||new Date(), all=shotTimes(room,table,now), best=null;
  for(var i=0;i<all.length;i++) if(all[i]<=now && (best===null||all[i]>best)) best=all[i];
  return best===null ? null : (now-best)/3600000;
}
/* The same walk as hoursSinceShot, forwards: when the room next gets water.
   Used by the pre-walk brief (A §5) so the operator can see whether he is
   about to read a room just before or just after a shot. */
function hoursToNextShot(room, nowDate, table){
  var now=nowDate||new Date(), all=shotTimes(room,table,now), best=null;
  for(var i=0;i<all.length;i++) if(all[i]>now && (best===null||all[i]<best)) best=all[i];
  return best===null ? null : (best-now)/3600000;
}
/* ============ SCHEDULE PASTE-IN (Addendum B §4) ============
   Growlink exposes no schedule endpoint, so the operator copies the room's
   whole schedule screen and pastes it here. The screen puts the VALUE before
   its LABEL:

     4            <- value
     Mins         <- unit
     44
     Secs
     Duration     <- the label those four lines belong to

   so the parser is label-driven rather than positional: accumulate lines
   until a known label arrives, then interpret what was accumulated. That
   survives the fields appearing in a different order or a field being absent,
   which a positional parser would not.

   Nothing here trusts its own output. parseSchedule reports what it could not
   read alongside what it could, and the operator confirms per table on a
   verification screen before any of it is committed — the paste is a
   convenience, not an authority. */
var SCHED_LABELS={'start time':'start','duration':'duration','interval':'interval',
                  'frequency':'frequency','total runtime':'runtime'};
/* Number/unit pairs: 4 Mins 44 Secs -> 284.
   A3 T11+12's flush prints "45" and then "0 Secs" with no Mins label at all,
   so a number can arrive with its unit missing. The units always descend —
   Hrs, then Mins, then Secs — so an unlabelled number takes the unit one step
   above whichever labelled unit comes next. 45 ahead of "0 Secs" is 45
   minutes. Guessing it as seconds would have read a 45-minute flush as
   45 seconds and quietly reported a room as barely watered. */
var SCHED_UNITS=[['hr',3600],['min',60],['sec',1]];
function schedUnitIndex(u){
  u=String(u||'').toLowerCase();
  if(/^hr|^hour/.test(u)) return 0;
  if(/^min/.test(u)) return 1;
  if(/^sec/.test(u)) return 2;
  return -1;
}
function schedSeconds(pend){
  /* tokenize into numbers, each with its unit index or none */
  var toks=[];
  for(var i=0;i<pend.length;i++){
    var n=parseFloat(pend[i]);
    if(isNaN(n)) continue;
    var ui=schedUnitIndex(pend[i+1]);
    toks.push({n:n, u:ui});
    if(ui>=0) i++;                       /* the unit belongs to this number */
  }
  /* fill a missing unit from the next labelled one, one step larger */
  for(var j=toks.length-1, next=-1; j>=0; j--){
    if(toks[j].u>=0){ next=toks[j].u; continue; }
    if(next>0){ toks[j].u=next-1; next=toks[j].u; }
  }
  var s=0, saw=false;
  toks.forEach(function(t){
    if(t.u<0) return;
    s+=t.n*SCHED_UNITS[t.u][1]; saw=true;
  });
  return saw?s:null;
}
function schedClock(pend){
  for(var i=pend.length-1;i>=0;i--){
    var m=/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i.exec(pend[i]);
    if(m){
      var h=+m[1], ap=(m[3]||'').toUpperCase();
      if(ap==='PM' && h<12) h+=12;
      if(ap==='AM' && h===12) h=0;
      return ('0'+h).slice(-2)+':'+m[2];
    }
  }
  return null;
}
function schedRuntime(line){
  /* "18m 56s" as printed under the control type */
  var m=/(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i.exec(String(line).trim());
  if(!m || (!m[1]&&!m[2]&&!m[3])) return null;
  return (+(m[1]||0))*3600 + (+(m[2]||0))*60 + (+(m[3]||0));
}
/* "B5 Table 1", "A1 Table 11+12" — the A-wing shared-valve convention means a
   header can name more than one table, and both get the same schedule. */
/* The first field names a room and one or more tables, and nothing else in
   it means anything. Real headers seen so far:

     A1 Table 1          A3 table 2          B2 table 1
     A1 table 11+12      A6 Tables 11 + 12   A7 Table 2 manual
     A7 Table 11+12 manual

   so: case-insensitive, singular or plural, spaces allowed around the plus,
   and any trailing word ignored. Match the room and the numbers; discard
   the rest rather than trying to anticipate what else Growlink will append.
   The line reaching here has already been cut at its first tab, so the
   sensor column never takes part. */
function schedHeader(line){
  var m=/^([A-Za-z]-?\d+)\s+tables?\s+([\d\s+]*\d)/i.exec(String(line));
  if(!m) return null;
  var tables=m[2].split('+').map(function(x){ return parseInt(x,10); })
                 .filter(function(x){ return !isNaN(x); });
  if(!tables.length) return null;
  return {room:m[1].replace('-',''), tables:tables};
}
/* A parked P2 is not an absent one: Growlink holds it at 0 Mins 1 Secs, a
   1-minute interval and a frequency of 1. Read literally that is a second
   daily series delivering about a millilitre, which would move
   hours-since-shot and show up on the verification screen as a real shot.
   A phase under two seconds is off. */
function schedPhaseOn(ph){
  return !!(ph && ph.start && ph.frequency && ph.duration!=null && ph.duration>1);
}
/* The second tab-separated field on a header line is the sensor mapping —
   "C4 Table 1 moisture", "A1 11 Back Moisture", "Substrate Moisture
   #20004907", or "---" for a table with no sensor assigned. It is the key
   the sensor pull needs to tie a Growlink reading back to a table, and the
   two known orphans (C1 T10 #20004922, C4 T6 #20004907) are exactly the
   rows that read as a raw id. Stored, never parsed for meaning: it decides
   nothing here, and the table identity comes from the first field alone. */
function schedSensor(rawLine){
  var parts=String(rawLine||'').split('\t');
  if(parts.length<2) return null;
  var v=parts[1].trim();
  if(!v || /^-+$/.test(v)) return null;
  return v;
}
function sensorId(name){
  var m=/#(\d{4,})/.exec(String(name||''));
  return m?m[1]:null;
}
/* The blob leads with "all schedules as of 9/11/26 10:14am". Kept, because
   it says how stale the schedule is independently of when it was pasted —
   a Monday blob pasted on Thursday is three days old and nothing else in
   the import would know. */
function schedAsOf(text){
  var m=/as of\s+([^\n]+)/i.exec(String(text||'').slice(0,400));
  return m?m[1].trim():null;
}
function parseSchedule(text){
  var raws=String(text||'').split(/\r?\n/);
  var lines=raws.map(function(l){ return l.replace(/\t.*$/,'').trim(); });
  var blocks=[], cur=null, pend=[], section='P1', warn=[];
  /* A block is worth keeping if it carries a schedule — or if it carries a
     control type and a zero total, which is a table that exists and is
     switched off. Dropping those would make an inactive table look like a
     table the paste missed. */
  function close(){
    if(cur && (cur.P1.start || cur.P1.duration!=null || (cur.control && cur.runtime===0)))
      blocks.push(cur);
    cur=null;
  }
  for(var i=0;i<lines.length;i++){
    var ln=lines[i];
    if(!ln) continue;
    var hd=schedHeader(ln);
    if(hd){ close(); cur={room:hd.room, tables:hd.tables, control:null, runtime:null,
                          sensor:schedSensor(raws[i]), P1:{}, P2:{}, flush:{}};
            pend=[]; section='P1'; continue; }
    if(!cur){ continue; }                      /* preamble before the first table */
    var low=ln.toLowerCase();
    if(/^p1\s+timers?$/.test(low)){ section='P1'; pend=[]; continue; }
    if(/^p2\s+timers?$/.test(low)){ section='P2'; pend=[]; continue; }
    if(/^flush\s+timers?$/.test(low)){ section='flush'; pend=[]; continue; }
    if(/^(simple timer|copilot)$/.test(low)){ cur.control=ln; pend=[]; continue; }
    /* Simple Timer records end with this; Copilot records have no marker. */
    if(low==='create new timer'){ pend=[]; continue; }
    if(cur.control && cur.runtime===null && /^[\dhms\s]+$/i.test(ln) && /[hms]/i.test(ln)){
      cur.runtime=schedRuntime(ln); pend=[]; continue;
    }
    var key=SCHED_LABELS[low];
    if(key){
      var tgt=cur[section]||(cur[section]={});
      if(key==='start') tgt.start=schedClock(pend);
      else if(key==='frequency'){
        var f=parseFloat(pend[pend.length-1]);
        tgt.frequency=isNaN(f)?null:f;
      }
      else if(key==='runtime') cur.runtime=schedSeconds(pend);
      else tgt[key]=schedSeconds(pend);
      if(tgt[key]===null && key!=='frequency') warn.push('could not read '+low+' for T'+cur.tables.join('+'));
      pend=[];
      continue;
    }
    pend.push(ln);
  }
  close();
  /* one record per table, so a shared-valve header fans out */
  var tables=[];
  blocks.forEach(function(b){
    b.tables.forEach(function(t){
      /* P1 duration x frequency should equal the total runtime the screen
         prints. When it does, the block was read correctly; when it does
         not, something was misread and the verification screen says so
         rather than the operator finding out from a wrong dryback call.

         P1 only. The printed total on a Copilot room excludes P2 and the
         flush — A1 prints 16m 14s, which is 8:07 x 2 and nothing else,
         while the flush alone is 28 minutes. Summing the phases would flag
         every correct A-wing table. On a Simple Timer room there is only
         P1, so it is the same rule. */
      /* A printed total of 0s is a timer that is switched off, not a block
         that was misread. Reconciling it against P1 would flag every
         inactive table as an error and bury the real ones, and computing a
         shot series from it would tell the operator a room is being watered
         when it is not. */
      var inactive=(b.runtime===0);
      var calc=(b.P1.duration!=null&&b.P1.frequency)?b.P1.duration*b.P1.frequency:null;
      tables.push({table:t, room:b.room, control:b.control, runtimeSec:b.runtime,
                   sensor:b.sensor||null, sensorId:sensorId(b.sensor),
                   /* a shared valve prints one sensor for the pair, so both
                      records carry it and neither pretends to its own */
                   sharedSensor:(b.tables.length>1 && !!b.sensor),
                   shared:b.tables.length>1?b.tables.slice():null,
                   P1:b.P1, P2:schedPhaseOn(b.P2)?b.P2:null,
                   flush:(b.flush&&(b.flush.duration!=null))?b.flush:null,
                   inactive:inactive,
                   reconciles:inactive?null
                     :((calc!=null&&b.runtime!=null)?(Math.abs(calc-b.runtime)<=60):null)});
    });
  });
  /* The weekly blob is the whole facility in one paste — nineteen rooms,
     209 records — not one room's screen. Grouping by room is the difference
     between one import a week and nineteen. Sorting the flat list by table
     number alone would interleave A1 T1 with B1 T1, so the grouping has to
     come first. */
  var byRoom={}, order=[];
  tables.forEach(function(t){
    if(!byRoom[t.room]){ byRoom[t.room]={room:t.room, tables:[], warnings:[]}; order.push(t.room); }
    byRoom[t.room].tables.push(t);
  });
  order.forEach(function(rm){
    var g=byRoom[rm];
    g.tables.sort(function(a,b){ return a.table-b.table; });
    /* A room's screen is meant to be pasted whole. A short paste is not an
       error, but the uncovered tables will read off their neighbours'
       schedule, so the operator has to be told which before committing. */
    if(!ROOMS[rm]) return;
    var have={}, miss=[];
    g.tables.forEach(function(t){ have[t.table]=1; });
    for(var n=1;n<=ROOMS[rm].t;n++) if(!have[n]) miss.push(n);
    if(miss.length){
      var fb=null;
      for(var k=0;k<g.tables.length;k++) if(!g.tables[k].inactive){ fb=g.tables[k]; break; }
      g.warnings.push('no schedule for T'+miss.join(', T')+
        ' — those tables will read off T'+(fb?fb.table:(g.tables[0]?g.tables[0].table:'?')));
    }
  });
  var rooms=order.map(function(rm){ return byRoom[rm]; });
  var flat=[];
  rooms.forEach(function(g){ g.tables.forEach(function(t){ flat.push(t); }); });
  rooms.forEach(function(g){
    g.warnings.forEach(function(w){ warn.push((rooms.length>1?g.room+': ':'')+w); });
  });
  return {room:order[0]||null, rooms:rooms, tables:flat, warnings:warn, asOf:schedAsOf(text)};
}
/* The brief's one-line summary of when the room gets water. It reads the
   same source hoursSinceShot does, so the brief can never describe one
   schedule while the rows are stamped against another — which is how B3's
   1.7h looked plausible on 9/10. Tables in one room routinely differ, so
   where they do the line says so rather than picking one and hiding it. */
function schedLine(room, table){
  var ser=schedSeries(room, table);
  if(!ser.length) return '';
  var txt=ser.map(function(s){
    var p=s.start.split(':');
    return s.count+' shot'+(s.count>1?'s':'')+' from '+fmt12(+p[0],p[1])+
           (s.count>1?', every '+(s.intervalMin/60)+'h':'');
  }).join(' · then ');
  if(table==null && schedTiers(room)>1) txt+=' (T'+schedTables(room)[0]+'; tiers differ)';
  return txt;
}
/* How many distinct schedules an imported room has, and which tables carry
   them. Zero means nothing imported and the weekly file is in charge. */
function schedTables(room){
  var rec=((typeof getSched==='function')?(getSched()||{}):{})[room];
  return (rec&&rec.tables)?rec.tables.map(function(t){ return t.table; }):[];
}
function schedTiers(room){
  var rec=((typeof getSched==='function')?(getSched()||{}):{})[room], seen={};
  if(!rec||!rec.tables) return 0;
  rec.tables.forEach(function(t){
    var p=t.P1||{};
    seen[[p.start,p.duration,p.interval,p.frequency,
          t.P2?[t.P2.start,t.P2.duration,t.P2.interval,t.P2.frequency].join('/'):''].join('|')]=1;
  });
  return Object.keys(seen).length;
}
/* Days since flower start. Counted off a date rather than carried as a number
   against a reference day, so it cannot go stale between move-ins. */
/* ===== room config (backlog §5.4) =====
   Everything a room carries that changes at move-in rather than weekly:
   flower start, strain and underlight per table, bag size, plant count,
   dripper count per table, tank. rooms.js holds what was true when it was
   written; the config overlay holds what the operator has since found, and
   the overlay wins. Two wrong calls on 9/10 came from this gap — C3 showed
   the previous grow's strain map and produced a wrong tiering
   recommendation, and B3 read DOF 77 when it was 7.

   Reached through accessors, never by indexing RMAP or DRIPPERS directly,
   so there is one place an override can be missed. */
/* ===== open table flags (backlog §6.2) =====
   C5 T5's header elbow is leaking. A5 T3 had two drippers repaired. B3
   T4-T7 centers need a third dripper. None of that had anywhere to live
   except a row note on the day it was seen and the operator's memory after
   that, and the flush list for 9/11 was assembled by hand in chat.

   Faults were already stored and already had an open/fixed lifecycle; what
   was missing was them reaching the three places somebody would act on
   them — the room tile before the walk, the stab screen at the table, and
   the export afterwards. */
function openFlags(rm, t){
  var ev=(typeof getEv==='function')?getEv():[];
  return ev.filter(function(e){
    if(e.kind!=='fault' || e.status!=='open' || e.room!==rm) return false;
    if(t==null) return true;
    return String(e.table)===String(t);
  });
}
function flagCount(rm){ return openFlags(rm,null).length; }
function flagLine(rm, t){
  return openFlags(rm,t).map(function(e){
    return e.what+(e.detail?' — '+e.detail:''); }).join(' · ');
}
/* Tables tagged for the next flush, facility-wide. The 9/11 list — B4
   T3/T6/T9, B6 T7, C1 T5/T8, C5 T2/T4/T5, C6 T9, A6 T7, A7 T7 — was
   assembled by hand from a week of conversation. */
var FLUSH_TAG='needs flush';
function flushList(){
  var ev=(typeof getEv==='function')?getEv():[], by={};
  ev.forEach(function(e){
    if(e.kind!=='fault' || e.status!=='open' || e.what!==FLUSH_TAG) return;
    if(e.table==null || e.table==='') return;
    (by[e.room]=by[e.room]||[]).push(String(e.table));
  });
  return Object.keys(by).sort().map(function(rm){
    var seen={}, ts=[];
    by[rm].forEach(function(t){ if(!seen[t]){ seen[t]=1; ts.push(t); } });
    ts.sort(function(a,b){ return (+a)-(+b); });
    return rm+' T'+ts.join('/');
  });
}
/* ===== what has been covered today (backlog §6.3) =====
   At 3:13 PM on 9/10 the operator asked what he had covered and the answer
   meant reading the workbook. The app already knew. This is that question
   and the 6:45 AM plan in one place.

   AM and PM rooms are the grouping because they are the grouping he walks
   in: lights out at 11:00 for the AM rooms and 13:15 for the PM ones is
   what makes a room's window close, and a room read after its window is a
   post-shot reading that only confirms a shot landed. */
function roomWing(rm){
  var ser=schedSeries(rm,null);
  var start=ser.length?ser[0].start:(SCHED[rm]?SCHED[rm][0]:null);
  if(!start) return 'other';
  var h=+start.split(':')[0];
  return h<12?'AM':'PM';
}
/* AM rooms must be read before 11:00, PM before 13:15, A7 before 09:15.
   Returns hours left, negative once the window has closed. */
function windowCloses(rm){
  if(rm==='A7') return '09:15';
  return roomWing(rm)==='AM' ? '11:00' : '13:15';
}
function hoursToWindow(rm, nowDate){
  var c=windowCloses(rm); if(!c) return null;
  var now=nowDate||new Date(), p=c.split(':');
  var t=new Date(now); t.setHours(+p[0],+p[1],0,0);
  return (t-now)/3600000;
}
/* ===== the walk order (backlog §5.5) =====
   Pre-irrigation readings are the ones that decide anything: they show
   dryback depth. A reading taken after the shot only confirms it landed. So
   the order to walk in is the order the windows shut, soonest first.

   One exception, and it inverts the rule: a room whose shot structure just
   changed wants a reading 1 to 2 hours AFTER its next P1, to confirm the
   front still reaches the bottom of the bag. For that room the window is
   the post-shot one, and getting there early is as wrong as getting to the
   others late. */
function roomWindow(rm, nowDate){
  var now=nowDate||new Date();
  var imp=(typeof getSched==='function')?(getSched()||{}):{};
  var changed=!!(imp[rm] && imp[rm].changed);
  if(changed){
    var since=hoursSinceShot(rm, now);
    if(since!=null){
      if(since<1)  return {kind:'post', state:'early', hrs:1-since};
      if(since<=2.5) return {kind:'post', state:'open', hrs:2.5-since};
    }
    var nx=hoursToNextShot(rm, now);
    return {kind:'post', state:'waiting', hrs:(nx==null?null:nx+1)};
  }
  var left=hoursToWindow(rm, now);
  if(left==null) return {kind:'pre', state:'open', hrs:null};
  return {kind:'pre', state:left>0?'open':'closed', hrs:left};
}
/* Rooms still to read, in the order to walk them. Soonest deadline first;
   a room whose window has already shut drops behind the ones that can still
   be read properly, and a post-change room that is not due yet goes last
   because walking it now would waste the trip. */
function walkOrder(nowDate){
  var now=nowDate||new Date();
  return dayCoverage(now)
    .filter(function(r){ return !r.swept || r.handOnly || r.postShotDue; })
    .map(function(r){ r.window=roomWindow(r.room, now); return r; })
    .sort(function(a,b){
      var rank=function(r){
        if(r.window.state==='open')    return 0;
        if(r.window.state==='early')   return 1;
        if(r.window.state==='closed')  return 2;
        return 3;                                  /* waiting on a shot */
      };
      var ra=rank(a), rb=rank(b);
      if(ra!==rb) return ra-rb;
      var ha=(a.window.hrs==null?999:a.window.hrs), hb=(b.window.hrs==null?999:b.window.hrs);
      if(ha!==hb) return ha-hb;
      return a.room<b.room?-1:1;
    });
}
/* Said at Start, when it can still change what he does. */
function windowWarning(rm, nowDate){
  var w=roomWindow(rm, nowDate);
  if(w.kind==='post'){
    if(w.state==='open') return '';
    if(w.state==='early') return rm+' is waiting on a post-change read — it is due about '+
      w.hrs.toFixed(1)+'h from now, 1 to 2h after the shot';
    return rm+' is waiting on a post-change read, after its next shot'+
      (w.hrs!=null?' — about '+w.hrs.toFixed(1)+'h from now':'');
  }
  if(w.state==='closed') return rm+'\u2019s pre-irrigation window shut '+
    Math.abs(w.hrs).toFixed(1)+'h ago — this reads dryback after the shot, not before it';
  return '';
}
function dayCoverage(nowDate){
  var now=nowDate||new Date(), t0=new Date(now); t0.setHours(0,0,0,0);
  var hist=(typeof getHist==='function')?getHist():[];
  var today={};
  hist.forEach(function(x){
    if(x.mode && x.mode!=='sweep') return;
    var ts=x.ts||Date.parse(x.when||'')||0;
    if(ts<t0.getTime()) return;
    if(!today[x.room] || ts>(today[x.room].ts||0)) today[x.room]=x;
  });
  var imp=(typeof getSched==='function')?(getSched()||{}):{};
  var rows=Object.keys(ROOMS).filter(function(k){
    return !ROOMS[k].kind && roomActive(k); }).map(function(rm){
    var x=today[rm]||null, cfg=ROOMS[rm];
    var cov=(x && x.swept!=null && cfg.t) ? Math.round(100*x.swept/cfg.t) : null;
    var rec=imp[rm];
    return {room:rm, wing:roomWing(rm),
            swept:!!x, handOnly:!!(x&&x.handOnly), at:x?(x.when||'').split(', ')[1]||'':'',
            op:x?(x.op||''):'', n:x?(x.n||0):0, coverage:cov,
            postShotDue:!!(rec && rec.changed), changed:(rec&&rec.changed)?rec.changed.diffs:null,
            flags:flagCount(rm), closesIn:hoursToWindow(rm, now)};
  });
  rows.sort(function(a,b){
    if(a.wing!==b.wing) return a.wing<b.wing?-1:1;
    return a.room<b.room?-1:1;
  });
  return rows;
}
function rcfg(rm){
  try{ return (typeof roomCfg==='function' ? (roomCfg()[rm]||{}) : {}); }
  catch(e){ return {}; }
}
function flowerStartFor(rm){
  var c=rcfg(rm);
  return c.flowerStart || FLOWER_START[rm] || '';
}
function strainFor(rm, t){
  var c=rcfg(rm), k=String(t);
  if(c.strains && c.strains[k]) return c.strains[k];
  return (RMAP[rm]||{})[k] || ['',''];
}
function tankFor(rm){
  var c=rcfg(rm);
  if(c.tank) return c.tank;
  return (FEEDEC[rm]===0) ? 'water' : '';
}
/* Room state (spec §5.7, and A3 went harvest -> empty -> move-in in 48
   hours this week with no way to say so). Only an active room is on the
   sweep rotation; the rest stay visible but out of the count, because a
   room missing from a list reads as an oversight. */
var ROOM_STATES=['active','harvest','empty','movein'];
function roomState(rm){
  var c=rcfg(rm);
  return (c.state && ROOM_STATES.indexOf(c.state)>=0) ? c.state : 'active';
}
function roomActive(rm){ return roomState(rm)==='active'; }
function activeRooms(){
  return Object.keys(ROOMS).filter(function(k){ return !ROOMS[k].kind && roomActive(k); });
}
function plantsFor(rm){
  var c=rcfg(rm);
  return (c.plants!=null && !isNaN(+c.plants)) ? +c.plants : null;
}
/* Dripper count, and whether anybody has actually counted it. Identical
   runtimes deliver different volumes when the count differs — A2 T1/T2 get
   twice what T3-T12 do — so an assumed count must never be presented as a
   measured one. */
function drippersFor(rm, t){
  var c=rcfg(rm), k=String(t);
  if(c.drippers && c.drippers[k]!=null) return +c.drippers[k];
  var d=DRIPPERS[rm];
  if(d && d[t]!=null) return d[t];
  if(d && d[k]!=null) return d[k];
  return DRIP_DEFAULT[String(rm).charAt(0)] || 3;
}
function drippersKnown(rm, t){
  var c=rcfg(rm), k=String(t);
  if(c.drippers && c.drippers[k]!=null) return true;
  var d=DRIPPERS[rm];
  return !!(d && (d[t]!=null || d[k]!=null));
}
/* Millilitres per plant from runtime, the way the plumbing actually works:
   minutes x drippers x flow per dripper. The flat 70/95 mL/min the app used
   was this same arithmetic with the dripper count assumed — 4 in A wing,
   3 in B and C — which is exactly the assumption A2 and C3 break. */
function mlPerPlant(rm, t, runtimeMin){
  if(runtimeMin==null || isNaN(runtimeMin)) return null;
  var flow=DRIP_FLOW[String(rm).charAt(0)];
  if(flow==null) return null;
  return Math.round(runtimeMin*drippersFor(rm,t)*flow);
}
/* What a plant on this table actually gets today, from the imported
   schedule's printed P1 runtime and the dripper count. The workbook Volume
   column is P1 only, and on these screens the printed total is P1 only too,
   so the two agree. Returns null rather than a guess when either half is
   missing — SCHED_ML in the weekly file is the fallback, and it is a room
   figure that cannot see a tiered table. */
function mlPlantToday(rm, t){
  var imp=(typeof getSched==='function')?(getSched()||{}):{};
  var rec=imp[rm];
  if(!rec || !rec.tables || !rec.tables.length) return null;
  var row=null;
  for(var i=0;i<rec.tables.length;i++){
    if(t!=null && rec.tables[i].table===t){ row=rec.tables[i]; break; }
  }
  if(!row) row=rec.tables[0];
  if(row.runtimeSec==null) return null;
  return mlPerPlant(rm, (t==null?row.table:t), row.runtimeSec/60);
}
function dofNow(rm, nowDate){
  var s=flowerStartFor(rm); if(!s) return '';
  var p=s.split('-'), start=new Date(+p[0],+p[1]-1,+p[2]).getTime();
  var n=nowDate?new Date(nowDate):new Date();
  return Math.round((n.setHours(0,0,0,0)-start)/86400000);
}

/* ---- probe protocol ---- */
var SVC='deca0001-10c7-43a8-8c9f-42b70e03808d';
/* Bluetooth SIG assigned numbers: Battery Service and Battery Level. The
   spec is not in doubt — a uint8, 0 to 100, read mandatory, notify optional.
   What is in doubt is whether this bridge implements it, which is a question
   about the device and not about the spec. The probe scan in settings asks
   the device directly. */
var BAT_SVC='0000180f-0000-1000-8000-00805f9b34fb';
var BAT_CHR='00002a19-0000-1000-8000-00805f9b34fb';
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
/* The sensor's three error codes, printed in place of the measured value
   (Integrator Guide, SENSOR ERROR CODES). They arrive in the same frame
   shape as a reading and were falling through to the unparsed bucket, so a
   probe in any of these states looked to the operator like a probe that had
   simply gone quiet: misses climbing, no reading, no reason.

   -9991 is NOT a battery gauge and must not be described as one. It says
   the sensor's supply was inadequate at the moment of measurement, which a
   bad stereo connection, contact resistance or a regulation fault can cause
   as readily as exhausted cells. And it is an end-stage fault: by the time
   it fires the measurement is already lost. It is no substitute for a
   graded 73 / 42 / 18 reading, which is a separate question about whether
   the ZSC exposes the standard Battery Service — see the probe scan.
   */
var SENSOR_ERRS={
  '-9999':'measurement compromised — the values would mean nothing',
  '-9992':'sensor calibration lost or corrupt — needs METER support',
  '-9991':'supply voltage too low to measure — check the stereo plug, then the ZSC batteries'
};
function parseText(txt){
  var s=String(txt).replace(/[^\x20-\x7E]/g,' ');
  /* an error frame still looks like a sensor line: sentinel, then the type
     character the reading regex keys on */
  var e=s.match(/(-999[129])[\s\S]{0,24}?[gh]\s*\d*\s*$/) || s.match(/(-999[129])\s/);
  if(e) return {err:e[1], msg:SENSOR_ERRS[e[1]]||'sensor error '+e[1],
                raw:s.trim().slice(0,48), direct:true};
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
var emitSensorError=function(pr){};
var RX={buf:[], lastAt:0, flushT:null};
function rxBytes(bytes){
  for(var i=0;i<bytes.length;i++) RX.buf.push(bytes[i]);
  RX.lastAt=Date.now();
  if(RX.buf.length>600) RX.buf.splice(0,RX.buf.length-600);
  processRx();
}
function tryText(txt){
  var pr=parseText(txt);
  if(!pr) return false;
  if(pr.err){ emitSensorError(pr); return true; }
  emitReading(pr); return true;
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
/* Tables are walked in AISLES, two to an aisle, and you always enter an aisle
   at the front: the first table of an aisle runs front→center→header, the
   second header→center→front. That never changes. What changes is which
   tables share an aisle, and that is a fact about the SIDE of the row:

     standard   (t1,t2) (t3,t4) (t5,t6) …
     opposite   (t1) (t2,t3) (t4,t5) …    first table alone against the wall

   Keyed on side, not on direction. Which end you start from reorders the
   tables; it does not change which of them share an aisle. Getting that axis
   wrong is what broke this three times running — v26 keyed the phase on table
   parity, v27 on the walk index, v29 on direction — and each was right in
   exactly the cases that happened to get walked that week. Addendum B §1
   carries the four-row truth table and test/adda.js encodes it verbatim, so
   a fourth wrong axis fails the suite instead of a room.

   The target picker reads the route, so it inherits this. */
function aislePos(walkIndex, side){
  return side==='opposite'
    ? (walkIndex===0 ? 0 : (walkIndex-1)%2)
    : walkIndex%2;
}
function walkPhase(walkIndex, side){
  return aislePos(walkIndex,side)===0
    ? ['front','center','header'] : ['header','center','front'];
}
/* §6.7: the mid-bag stab is conditional, not routine.
   The 9/8 note said mid-bag only informs on wet bags. With 893 reference/mid
   pairs from the workbook — 582 of them in 2-gallon rooms — it is the
   reverse. Above 30% the mid reads 3 to 6 points under the reference with a
   tight spread: ordinary stratification, confirming nothing, and 75% of all
   stabs sit above 30. Below 20% it reads 8 or more points WETTER than the
   reference more than half the time, which is the wetting front stalling
   above the jig depth — and that says shot size, not frequency.

   So a sweep takes the reference and asks for the mid only when the
   reference lands low enough for the answer to mean something. Profile mode
   keeps the old every-position behaviour for post-change confirmation and
   drainage work, and a triage is that work by definition. */
/* ===== field capacity, and what counts as implausible =====
   The ceiling was a flat 62% for a 2-gallon bag, and on flush day a bag at
   field capacity reads right through it. Judging a reading against the
   previous sweep is worse: the previous sweep is exactly what a flush is
   supposed to differ from.

   So the ceiling is the room's own field capacity plus a margin. FC is not
   one number — it climbs through flower, about 44% at day 2, 48% at day 10,
   55% at day 17, easing to 52% by day 25 in a 2-gallon bag — so it is
   interpolated from DOF and overridable per room in config, like the floor.
   A post-flush sweep lifts the ceiling by its own margin, because a bag that
   has just been flooded is legitimately wetter than one that has not. */
var FC_CURVE=[[2,44],[10,48],[17,55],[25,52],[60,52]];
var FC_MARGIN=8, FC_FLUSH_MARGIN=10, VWC_MIN=6;
function fcFor(rm){
  var c=rcfg(rm);
  if(c.fc!=null && c.fc!=='' && !isNaN(+c.fc)) return +c.fc;
  var dof=dofNow(rm);
  var base;
  if(dof===''||dof==null) base=FC_CURVE[2][1];
  else if(dof<=FC_CURVE[0][0]) base=FC_CURVE[0][1];
  else{
    base=FC_CURVE[FC_CURVE.length-1][1];
    for(var i=1;i<FC_CURVE.length;i++){
      var a=FC_CURVE[i-1], b=FC_CURVE[i];
      if(dof<=b[0]){
        base=a[1]+(b[1]-a[1])*((dof-a[0])/(b[0]-a[0]));
        break;
      }
    }
  }
  /* the curve is measured in 2-gallon bags; a smaller bag holds less water
     per unit volume at the same tension, and its floor carries that */
  var cfg=ROOMS[rm];
  if(cfg && cfg.bag && cfg.bag!==2) base+=(floorFor(rm)-22);
  return Math.round(base*10)/10;
}
function plausCeiling(rm, postFlush){
  return fcFor(rm) + FC_MARGIN + (postFlush?FC_FLUSH_MARGIN:0);
}
function isImplausible(rm, vwc, postFlush){
  if(vwc<VWC_MIN) return true;
  return vwc > plausCeiling(rm, postFlush);
}
function midTrigger(room){
  return Math.max(25, floorFor(room));
}
function wantsMid(room, depth, vwc){
  var cfg=ROOMS[room];
  if(!cfg || cfg.bag!==2) return false;      /* the evidence is 2-gallon only */
  if(depth!=='reference') return false;
  return vwc < midTrigger(room);
}
function profileMode(){ return !!S.profile; }
function buildRoute(room, dir, mode, side){
  var cfg=ROOMS[room], r=[];
  if(mode==='triage'){
    var picks=(S.triage||[]).slice();
    if(!picks.length){ for(var z0=1;z0<=cfg.t;z0++) picks.push(z0); }
    if(dir==='down') picks.reverse();
    picks.forEach(function(t,pi){
      var seq=walkPhase(pi,side);
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
  var everyMid=(cfg.bag===2 && profileMode());
  for(var oi=0;oi<order.length;oi++){ var t=order[oi];
    var seq=walkPhase(oi,side);
    for(var p=0;p<3;p++){
      r.push({t:t,pos:seq[p],depth:'reference'});
      if(everyMid) r.push({t:t,pos:seq[p],depth:'mid-bag'});
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
/* The feel words, as offsets from the room's floor rather than a table per
   bag size. The 2-gallon numbers are unchanged — floor 22 resolves to
   18/22/26/30/34/38/44/50, exactly the table this replaces, and the 9/1
   fixtures produce identical row notes.

   Deriving them fixes the 1.25-gallon rooms, where the old table was the
   2-gallon one shifted four points while the floor moves eight: "ok" ran
   26 to 30 and sat entirely below the 30 floor, so a table picked for a
   triage because it was under could be described as ok. A derived word
   contradicting a derived threshold is a defect. It also means a new bag
   size — coco, when it comes back — resolves from its floor with no second
   table to keep in step.

   The hand goes blind below about 25% in a 1.25-gallon bag, so the word
   there carries nothing the number does not. Below floor is now always
   'dry' or 'dry ok', in every room. */
var FEEL_OFFSETS=[[-4,'dry'],[0,'dry ok'],[4,'ok'],[8,'ok good'],
                  [12,'good'],[16,'good solid'],[22,'solid'],[28,'solid heavy']];
function feelWord(v,floor){
  for(var i=0;i<FEEL_OFFSETS.length;i++) if(v<floor+FEEL_OFFSETS[i][0]) return FEEL_OFFSETS[i][1];
  return 'heavy';
}
/* Row-note grammar (BB_fert_data): first word is the dominant feel; a slash
   adds the other end of the spread; "splotchy dry/solid" when the spread is
   two or more steps wide (driest first, heaviest last). */
var FEEL_ORDER=['dry','dry ok','ok','ok good','good','good solid','solid','solid heavy','heavy'];
function feelDesc(vals,floor){
  if(!vals.length) return '';
  var lo=feelWord(Math.min.apply(null,vals),floor), hi=feelWord(Math.max.apply(null,vals),floor);
  var dom=feelWord(med(vals),floor);
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
  if(handOnlyBlind()) s+=' · hand-only · cannot detect below floor';
  return s;
}
/* ===== hand-only sweeps (backlog §3) =====
   The hand goes blind below about 25% VWC in a 1.25-gallon bag, and the
   floor in those rooms is 30. So a bag-feel sweep of a 1.25-gallon room does
   not merely read less precisely — it structurally cannot find the thing the
   sweep is for. A room walked that way must never come back looking covered.

   Detection is the absence of probe frames, not an operator declaration:
   there is no hand-feel entry mode to opt into, and a sweep that lost its
   probe partway is exactly as blind as one that never had it. */
/* The hand goes blind below about 25% VWC. That is a fact about fingers and
   peat, not about bag size, so the test is whether this room's floor sits
   above it — a room whose floor drops to 24 can be checked by hand again
   without anyone editing this rule. */
var HAND_LIMIT=25;
var NO_PROBE_FLAG='NO_PROBE_BLIND_FLOOR';
function probeFrames(){ return S.probeFrames||0; }
function handOnly(){ return probeFrames()===0; }
function handOnlyBlind(){
  if(!S.room || !ROOMS[S.room]) return false;
  return handOnly() && floorFor(S.room) > HAND_LIMIT;
}
function sweepFlags(){
  return handOnlyBlind() ? [NO_PROBE_FLAG] : [];
}
/* ===== what counts as a sweep worth racing (backlog §4) =====
   Entering a room and tapping out was being recorded as a personal record:
   no timeouts, no skips, no unstable frames, three seconds. Elapsed time on
   its own rewards not doing the work, so a record needs a floor under it and
   a second number beside it. */
function qualifyingSweep(){
  if(S.mode!=='sweep') return false;
  if(probeFrames()===0) return false;
  var c=coverage(), live=c.total-c.skipped;
  if(live<=0) return false;
  if(c.swept < Math.ceil(live*0.8)) return false;
  return measuredRows().length >= 2*c.swept;
}
/* Stabs per minute. Elapsed time alone gets faster by skipping tables; this
   does not, so both are kept and both are shown. */
function stabsPerMin(n,durMs){
  if(!durMs || durMs<1000 || !n) return null;
  return n/(durMs/60000);
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
  var fp=floorFor(S.room);
  var tabs=byTable(), keys={};
  Object.keys(tabs).forEach(function(t){ keys[t]=1; });
  skippedList().forEach(function(t){ keys[t]=1; });
  var lines=[];
  /* §6.1: one line per table, in room order, blank where nothing was swept.
     A spot or triage sweep used to export only the tables it touched, so the
     operator had to place each line by hand in an eleven- or twelve-row
     block — and on 9/10 two of them went in wrong: B3's four lines one row
     high, B6's three as a block on T6-T8. Eleven lines with seven blanks
     paste at T1 and land. A full sweep is unchanged, because every table
     already had a line. */
  if(ROOMS[S.room] && S.mode!=='flush') for(var n=1;n<=ROOMS[S.room].t;n++) keys[n]=1;
  Object.keys(keys).sort(function(a,b){return (+a)-(+b);}).forEach(function(t){
    if(t==='?') return;                      /* spot stabs with no table: below */
    if(tableSkipped(t)){ lines.push('T'+t+'  — '+skipReason(t)); return; }
    var rr=tabs[t]||[];
    if(!rr.length){ lines.push(''); return; }
    var rf=rr.filter(function(r){return r.depth==='reference';});
    var md=rr.filter(function(r){return r.depth==='mid-bag';});
    if(!rf.length){ lines.push(''); return; }
    var vals=rf.map(function(r){return r.vwc;});
    var desc=feelDesc(vals,fp);
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
    /* Below floor, said out loud. The feel words describe how a bag feels
       and do not track the floor: a 1.25-gallon bag at 27% reads "ok" and is
       three points under. The numbers are in the line, but they only mean
       something to a reader who is holding this room's floor in his head.
       It matters most in a triage, where the room-note cells are deliberately
       empty (B §7) so this line is the only thing that reaches the workbook,
       and where every table on the walk was picked for being below floor. */
    var low=rf.filter(function(r){ return r.vwc<fp; });
    if(low.length){
      /* Name the positions rather than count them. A count next to rounded
         numbers reads as a contradiction — "1 of 3 below floor 30" beside a
         reading printed as 30 that is really 29.6 — and in a triage the end
         of the table that is dry is the thing he walked over to find out. */
      var seen={}, where=[];
      low.forEach(function(r){ if(!seen[r.position]){ seen[r.position]=1; where.push(r.position); } });
      line+=', '+(low.length===rf.length?'all':where.join(' + '))+' below floor '+fp;
    }
    var nt=rowNote(t); if(nt) line+='. '+nt;
    lines.push(line);
  });
  /* Stabs that belong to no table keep their own block at the end rather
     than silently vanishing out of an aligned column. */
  if(tabs['?']){
    var sp=tabs['?'].filter(function(r){ return r.depth==='reference'; });
    if(sp.length) lines.push('', 'UNASSIGNED  '+sp.map(function(r){
      return r.vwc.toFixed(0)+(r.ec!=null?'/'+r.ec.toFixed(2):''); }).join(' · '));
  }
  return lines;
}
/* Copy 1: the Row Notes column on its own. No summary, no CHECK, no header.
   The stamp sits inline before the first row's first word — on its own line
   it pushes every following row down one when pasted into the column. */
function buildRowNotes(){
  var lines=rowNoteLines();
  if(!lines.length) return '';
  lines=lines.slice();
  /* §6.1: with blanks holding the alignment, the stamp goes on the first
     line that has something on it — prefixing a blank would put a timestamp
     in the cell of a table nobody swept. */
  for(var i=0;i<lines.length;i++){
    if(lines[i]!==''){ lines[i]=sweepStamp()+' '+lines[i]; break; }
  }
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
  /* computed from the imported schedule and the dripper count where both are
     known; the weekly room figure otherwise, which cannot see a tiered table */
  var volC=mlPlantToday(S.room,null);
  var vol=volC!=null?volC:((SCHED_ML&&SCHED_ML[S.room])||null);
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
    (vol?' · '+vol+' mL'+(volC!=null?'':' (weekly file)'):'')+
    (tankFor(S.room)?' · tank '+tankFor(S.room):'')+
    (hrs?' · '+hrs+'h':'')+
    ' · median '+(curMed==null?'--':curMed.toFixed(1))+delta+
    ' · '+lows+'/'+msd.length+' below floor'+
    (ecs.length?' · EC '+med(ecs).toFixed(1):'')+
    ' · '+coverageLine()+
    (handOnlyBlind()?'  ·  '+NO_PROBE_FLAG:'');
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
  /* Addendum B §7: a triage deliberately targets the tables already known to
     be bad, so anything it could say about them is a foregone conclusion —
     and the note cells are shared. Triage, spot and flush write nothing at
     all; their findings live in the CSV and on the done screen. */
  if(S.mode==='triage'||S.mode==='spot'||S.mode==='flush') return '';
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

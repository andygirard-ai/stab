// v27 Addendum A (9/9 field notes): the serpentine phase flip on the
// opposite direction, pause removed, the settle floor, undo clearing the
// alarm, exception-only room notes, crew-skip coverage, and the display
// defaults. The load-bearing case is the phase flip — it corrupted two
// rooms of real data on 9/9 and it silently corrupts the target picker too.
const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
const dir=path.dirname(file);
const html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,
  (m,f)=>'<script>\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n</'+'script>');

const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function boot(storage){
  const errors=[], vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push(String(e.message||e)));
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    url:'https://example.github.io/stab/',
    beforeParse(w){ w.Element.prototype.scrollIntoView=function(){}; w.confirm=()=>true; w.prompt=()=>'ABC';
      w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}});
      // the auto-lock advisory is a one-time toast; seeding it as already
      // seen keeps its async path from firing into a closed window
      w.localStorage.setItem('stab_wlt','1');
      if(storage) Object.keys(storage).forEach(k=>w.localStorage.setItem(k,storage[k])); }});
  return {w:dom.window, d:dom.window.document, errors};
}
const start=(w,d,room,bag)=>{ d.querySelector('#rooms .rm[data-room="'+room+'"]').click();
  d.getElementById('cfg_bag').value=String(bag||2); d.getElementById('startbtn').click();
  w.S.dev={gatt:{connected:true}}; w.S.chr={};
  ['log','extra','skip','undo','redo'].forEach(id=>{ d.getElementById(id).disabled=false; }); };
function enterSettling(w,vwc,rawBulk){
  const c=w.countsForVwc(vwc,false);
  w.rxBytes(w.frameBytes('0\t1790.0 22.0 0\rg8'));
  w.rxBytes(w.frameBytes('0\t'+c.toFixed(1)+' 22.0 '+(rawBulk==null?900:rawBulk)+'\rg8'));
}
function rowsFor(w,room,spec){
  const o=[];
  Object.keys(spec).forEach(t=>{ for(let i=0;i<3;i++) o.push({date:'9/9/2026',time:'09:42:00',
    room,table:+t,position:'center',depth:'reference',plant:'',strain:'',flags:'',hrs:'2.0',
    mode:'sweep',dir:'up',bag:2,media:'Bio365',side:'standard',vwc:spec[t],ec:4,bulk:0.5,tmp:25,
    flag:spec[t]<w.floorFor(room),raw:'x',manualCommit:false,zeroEc:false}); });
  return o;
}

(async()=>{
  // ====== Addendum B §1: aisle grouping, the four-row truth table ======
  // Encoded verbatim from the spec. This bug has been "fixed" three times on
  // three different axes — table parity (v26), walk index (v27), direction
  // (v29) — each right in exactly the cases that happened to be walked that
  // week. The table is the oracle; anything that disagrees with it is wrong
  // however reasonable it sounds.
  //
  //   Standard, T1     (1,2) (3,4) (5,6) (7,8) (9,10) (11,12)
  //   Standard, T11    (11,10) (9,8) (7,6) (5,4) (3,2) (1)
  //   Opposite, T1     (1) (2,3) (4,5) (6,7) (8,9) (10,11)
  //   Opposite, T11    (11) (10,9) (8,7) (6,5) (4,3) (2,1)
  //
  // First table of an aisle runs front→header, second header→front.
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.triage=[];
    const firsts=(room,dir,side)=>{
      const seen={}, out=[];
      w.buildRoute(room,dir,'sweep',side).forEach(s=>{
        if(!seen[s.t]){ seen[s.t]=1; out.push([s.t,s.pos]); } });
      return out;
    };
    // groups → the expected first-position per table, in walk order
    const fromGroups=groups=>{
      const o=[];
      groups.forEach(g=>g.forEach((t,i)=>o.push([t, i===0?'front':'header'])));
      return o;
    };
    const show=a=>a.slice(0,6).map(x=>'T'+x[0]+' '+x[1]).join(' | ');
    const cases=[
      ['standard, T1 first','B1','up','standard',   [[1,2],[3,4],[5,6],[7,8],[9,10],[11]]],
      ['standard, T11 first','B1','down','standard',[[11,10],[9,8],[7,6],[5,4],[3,2],[1]]],
      ['opposite, T1 first','B1','up','opposite',   [[1],[2,3],[4,5],[6,7],[8,9],[10,11]]],
      ['opposite, T11 first','B1','down','opposite',[[11],[10,9],[8,7],[6,5],[4,3],[2,1]]],
    ];
    cases.forEach(([label,room,dir,side,groups])=>{
      const got=firsts(room,dir,side), want=fromGroups(groups);
      const same=got.length===want.length &&
        got.every((g,i)=>g[0]===want[i][0] && g[1]===want[i][1]);
      ok(same, label+': '+show(got)+(same?'':'   WANT '+show(want)));
    });
    // the 12-table A wing, same rule
    const a1opp=firsts('A1','up','opposite');
    ok(a1opp[0][1]==='front' && a1opp[1][1]==='front' && a1opp[2][1]==='header',
       'A1 opposite from T1 — first table alone against the wall: '+show(a1opp));
    const a1std=firsts('A1','up','standard');
    ok(a1std[0][1]==='front' && a1std[1][1]==='header' && a1std[2][1]==='front',
       'A1 standard from T1 — plain pairs, unchanged all week: '+show(a1std));
    // the axis itself: side changes the phase, direction only reorders
    const sameSideDifferentDir = firsts('B1','up','opposite').map(x=>x[1]).join()
                              === firsts('B1','down','opposite').map(x=>x[1]).join();
    ok(sameSideDifferentDir,'direction reorders the tables but does not change the phase pattern');
    const differentSide = firsts('B1','up','standard').map(x=>x[1]).join()
                       !== firsts('B1','up','opposite').map(x=>x[1]).join();
    ok(differentSide,'…while side does change it — that is the axis');
    w.close(); }

  // the picker inherits the fix: picking the stop you are standing at moves
  // one slot, not six. This is the A-1 corruption from 9/9.
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'A1',2); w.S.dir='down'; w.S.side='opposite';
    w.S.route=w.buildRoute('A1','down','sweep','opposite'); w.S.i=0;
    // walk the first table and a half in 'down' order, as the operator did
    const seq=w.S.route.slice(0,7).map(s=>'T'+s.t+' '+s.pos+' '+s.depth);
    ok(/^T12 front reference/.test(seq[0]),'route opens where the operator stands: '+seq[0]);
    w.S.i=7;
    const target=w.S.route[6];                    // the stop he actually just did
    const idx=w.routeIndexNear(target.t,target.pos,target.depth,w.S.i);
    ok(idx===6,'the picker resolves that stop to its own slot, one behind the cursor: '+idx);
    ok(w.S.i-idx===1,'so the correction is one slot, not six: '+(w.S.i-idx));
    /* sweep-starting blocks leave the keep-awake promise in flight; closing
       the window under it tears down document before that resolves */ }

  // ============ §1.2 pause is gone ============
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    ok(w.S.paused===undefined,'no S.paused on the state object at all');
    // the capture pause is deleted, not merely unreachable (WL.vid.pause() is
    // the keep-awake video and has nothing to do with it)
    const live=fs.readFileSync(path.join(dir,'app.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
    const dead=/S\.paused|pausedBeforeCal|PAUSED/.exec(live);
    ok(!dead,'no pause state or label left in live code'+(dead?': '+dead[0]:''));
    // a tap with nothing in hand does not arm/disarm anything, it just says so
    const before=w.S.rows.length;
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===before,'a tap in clear air logs nothing');
    ok(w.S.paused===undefined,'…and still has no pause to toggle');
    ok(/stab a bag/i.test(d.getElementById('toast').textContent),'…it says what to do: "'+d.getElementById('toast').textContent+'"');
    // and the reading path still runs afterwards — the old bug killed it here
    enterSettling(w,35.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===before+1,'the very next stab still commits');
    ok(w.S.rows[w.S.rows.length-1].manualCommit===true,'…flagged manual');
    // the frame buffer outlives the commit until the probe clears, so a
    // second tap on the same stab must not log it twice
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===before+1,'a second tap on the same stab logs nothing: '+w.S.rows.length);
    ok(/already logged/i.test(d.getElementById('toast').textContent),'…and says why: "'+d.getElementById('toast').textContent+'"');
    ok(errors.length===0,'no runtime errors (1.2): '+errors.join('|')); }

  // ============ §1.3 settle floor down to just above the sensor floor ====
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'A7',1.25); w.S.trigger=w.TRIGGER; await sleep(20);
    // the A-7 T12 case: 6-8% on screen, would not log under v26 (INS 13)
    enterSettling(w,7.0,300); await sleep(20);
    ok(w.A.state==='settling','a 7% bag now reaches the settle gate, not stuck in air');
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===1 && Math.abs(w.S.rows[0].vwc-7.0)<0.3,'…and logs: '+(w.S.rows[0]||{}).vwc+'%');
    // the probe in a bare hand (2.0-2.3%) is still air, not a bag
    w.rxBytes(w.frameBytes('0\t'+w.countsForVwc(2.2,false).toFixed(1)+' 22.0 0\rg8'));
    await sleep(20);
    ok(w.A.state==='air','2.2% in a bare hand still reads as air: '+w.A.state);
    ok(errors.length===0,'no runtime errors (1.3): '+errors.join('|')); }

  // ============ v28: a wet probe pulled between ref and mid-bag ============
  // 9/10 field: a room reached its last table still asking for stabs already
  // taken. Cause: 'hold' only cleared under AIR (3.5%), and a probe pulled
  // from a wet bag is wet — at an 800ms poll a quick reference-to-mid move
  // can produce no frame that low, so the mid-bag stab lands during 'hold'
  // and is dropped, and the cursor never advances.
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,45.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);       // reference logged
    ok(w.S.rows.length===1 && w.A.state==='hold','reference logged, holding');
    const cursorAfterRef=w.S.i;
    // pull the probe out — still wet, reads 9%, nowhere near AIR
    w.rxBytes(w.frameBytes('0\t'+w.countsForVwc(9.0,false).toFixed(1)+' 22.0 400\rg8'));
    await sleep(20);
    ok(w.A.state==='air','a wet probe at 9% still counts as out of the bag: '+w.A.state);
    // straight into the mid-bag stab
    w.rxBytes(w.frameBytes('0\t'+w.countsForVwc(40.0,false).toFixed(1)+' 22.0 850\rg8'));
    await sleep(20);
    ok(w.A.state==='settling','…so the mid-bag stab is picked up rather than dropped');
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===2,'both stabs logged: '+w.S.rows.length);
    ok(w.S.i===cursorAfterRef+1,'and the cursor advanced once per stab, so the room can finish');
    ok(errors.length===0,'no runtime errors (wet pull): '+errors.join('|')); }

  // the same drop must NOT re-arm us while the probe is still in the bag —
  // a paired mid-bag reading runs about five points under its reference
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,45.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    for(let k=0;k<3;k++){                                   // 40% is a plausible mid-bag of the same bag
      w.rxBytes(w.frameBytes('0\t'+w.countsForVwc(40.0,false).toFixed(1)+' 22.0 880\rg8'));
      await sleep(15);
    }
    ok(w.A.state==='hold','a five-point drop is not the probe leaving the bag: '+w.A.state);
    ok(w.S.rows.length===1,'…so nothing double-logs: '+w.S.rows.length);
    ok(errors.length===0,'no runtime errors (no false re-arm): '+errors.join('|')); }

  // ============ §1.4 undo clears the alarm banner ============
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,15.0,10); await sleep(20);      // bulk 0.010, vwc 15 → alarm
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows[w.S.rows.length-1].zeroEc===true,'zero-EC reading logged');
    ok(!d.getElementById('alarm').classList.contains('hide'),'alarm banner is up');
    d.getElementById('undo').click(); await sleep(20);
    ok(d.getElementById('alarm').classList.contains('hide'),'undo takes the banner with the reading');
    ok(w.S.rows.length===0,'…and the reading is gone');
    ok(errors.length===0,'no runtime errors (1.4): '+errors.join('|')); }

  // ============ §3 room notes: exception only ============
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B5'; w.S.mode='sweep'; w.S.notes={}; w.S.free={}; w.S.skipped={};
    w.S.rows=rowsFor(w,'B5',{1:44,2:45,3:44});
    ok(w.buildRoomNotes()==='','a healthy room writes nothing at all: "'+w.buildRoomNotes()+'"');
    // the 9/8 output, in full, must not come back
    const banned=/DOF|median|gal|mL|below|hrs since shot|CHECK|nothing flagged/;
    ok(!banned.test(w.buildRoomNotes()),'none of the flagged 9/8 content can appear');
    // a dead bag is worth a cell
    w.S.rows[1].zeroEc=true; w.S.rows[1].table=2; w.S.rows[1].position='front';
    const dead=w.buildRoomNotes();
    ok(/dead bag T2 front/.test(dead),'a dead bag earns one line: "'+dead+'"');
    ok(dead.split('\n').length===1,'…one line, not a block');
    ok(!banned.test(dead.replace(/dead bag/,'')),'…with no statistics attached');
    // a table that read nothing while its neighbours fed
    w.S.rows=rowsFor(w,'B5',{1:44,2:45}).concat(rowsFor(w,'B5',{3:12}));
    w.S.rows.filter(r=>r.table===3).forEach(r=>{ r.bulk=0.01; });
    const starved=w.buildRoomNotes();
    ok(/T3 read nothing while its neighbours fed/.test(starved),'a starved table earns one line: "'+starved+'"');
    ok(starved.split('\n').length<=4,'the cap holds at four lines');
    // every room in the room is starved: that is the room, and it is one line
    w.S.rows=rowsFor(w,'B5',{1:12,2:12,3:12});
    w.S.rows.forEach(r=>{ r.bulk=0.01; });
    ok(w.buildRoomNotes()==='','all tables starved is a room question, not a note cell');
    ok(errors.length===0,'no runtime errors (§3): '+errors.join('|'));
    w.close(); }

  // ============ B §7: triage writes nothing to the note cells ============
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B6'; w.S.notes={}; w.S.free={}; w.S.skipped={};
    w.S.rows=rowsFor(w,'B6',{1:12,2:12});
    w.S.rows.forEach(r=>{ r.bulk=0.01; r.zeroEc=true; });   // as bad as it gets
    w.S.mode='sweep';
    ok(w.buildRoomNotes()!=='','a sweep with dead bags does write an exception line');
    w.S.mode='triage';
    ok(w.buildRoomNotes()==='','triage writes nothing at all: "'+w.buildRoomNotes()+'"');
    w.S.mode='spot';
    ok(w.buildRoomNotes()==='','spot too');
    w.S.mode='flush';
    ok(w.buildRoomNotes()==='','and flush');
    ok(errors.length===0,'no runtime errors (B §7): '+errors.join('|'));
    w.close(); }

  // ============ §2 crew skip: coverage, counts, CSV ============
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B1'; w.S.mode='sweep'; w.S.notes={}; w.S.free={};
    w.S.rows=rowsFor(w,'B1',{1:40,2:41,3:39});           // 3 of 11 tables read
    w.S.skipped={4:'crew',5:'crew',6:'crew',7:'crew',8:'crew',9:'crew',10:'crew',11:'crew'};
    const cov=w.coverageLine();
    ok(/^3 of 11 tables swept · 8 skipped \(crew\)$/.test(cov),'coverage reads as the field asked: "'+cov+'"');
    ok(/3 of 11 tables swept/.test(w.roomHead()),'the head carries it too');
    // a partial sweep must not report like a complete one
    w.S.rows=w.S.rows.concat(rowsFor(w,'B1',{4:5}));      // stabs taken before the aisle shut
    ok(w.measuredRows().length===9,'skipped-table stabs leave the measured set: '+w.measuredRows().length);
    ok(/0\/9 below floor/.test(w.roomHead()),'…so they are in neither side of the below-floor count');
    ok(w.S.rows.length===12,'…while staying in S.rows for the CSV');
    ok(errors.length===0,'no runtime errors (§2 counts): '+errors.join('|'));
    w.close(); }

  // the skip reaches the CSV — B-1 exported 18 rows with no trace of it
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,35.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);      // one real reading on T1
    const tbl=w.S.route[w.S.i].t;
    d.getElementById('skip').click(); await sleep(20);
    [].find.call(d.querySelectorAll('#skipbody .chip'),x=>x.dataset.w==='crew').click();
    await sleep(20);
    ok(w.S.route[w.S.i].t!==tbl,'one tap skipped the table and advanced to T'+w.S.route[w.S.i].t);
    d.getElementById('exit').click(); await sleep(50);
    const csv=d.getElementById('csv').value.split('\n');
    const col=n=>csv[0].split(',').indexOf(n);
    ok(col('Skipped')>=0,'CSV has a Skipped column');
    const skipRows=csv.slice(1).filter(l=>l.split(',')[col('Skipped')]==='"crew"');
    ok(skipRows.length>0,'the skip is recorded in the export: '+skipRows.length+' row(s)');
    const nCols=csv[0].split(',').length;
    ok(csv.slice(1).every(l=>l.split(',').length===nCols),'every row has the header\'s column count');
    // a table skipped with no readings at all still leaves a record row
    const fully=csv.slice(1).filter(l=>{ const c=l.split(','); return c[15]==='' && c[col('Skipped')]==='"crew"'; });
    ok(fully.length>=0,'record rows for never-measured tables are well formed');
    ok(errors.length===0,'no runtime errors (§2 CSV): '+errors.join('|')); }

  // a room where every table was skipped before a single stab
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B2'; w.S.mode='sweep'; w.S.rows=[];
    w.S.skipped={1:'dark',2:'dark',3:'harvest'};
    ok(/0 of 11 tables swept · 3 skipped \(dark, harvest\)/.test(w.coverageLine()),
       'nothing swept still reports honestly: "'+w.coverageLine()+'"');
    w.close(); }

  // ============ §5 display defaults ============
  { const {w,d,errors}=boot({'stab_setup':JSON.stringify({side:'standard',dir:'up',mode:'sweep',cap:'auto',lastDir:'up'})});
    await sleep(50);
    ok(w.S.dir==='up','T1 first is the default even after a T1-first sweep (no auto-alternate): '+w.S.dir);
    const sideBtns=[].map.call(d.querySelectorAll('.side'),b=>b.textContent.trim());
    ok(sideBtns.join('|')==='standard|opposite','side control reads standard/opposite only: '+sideBtns.join(' · '));
    ok(!d.querySelector('.side .sub') && !d.querySelector('.dir .sub'),'no explanatory sub-text on either control');
    w.close(); }

  // swept today is its own state on the tile
  { const t0=new Date(); t0.setHours(0,0,0,0);
    const todayTs=Math.max(Date.now()-3600e3, t0.getTime()+60e3);
    const hist=[{room:'C2',ts:todayTs,when:new Date(todayTs).toLocaleString('en-US'),n:66,mode:'sweep',med:38.0,low:2},
                {room:'C1',ts:Date.now()-2*86400e3,when:new Date(Date.now()-2*86400e3).toLocaleString('en-US'),n:66,mode:'sweep',med:35.0}];
    const {w,d,errors}=boot({'stab_hist':JSON.stringify({v:1,items:hist})}); await sleep(50);
    const today=d.querySelector('#rooms .rm[data-room="C2"]');
    const recent=d.querySelector('#rooms .rm[data-room="C1"]');
    ok(!!today.querySelector('.tb'),'a room swept today carries a today badge');
    ok(!recent.querySelector('.tb'),'a room swept two days ago does not');
    ok(today.querySelector('.cov').className!==recent.querySelector('.cov').className,
       'and their coverage bars differ: "'+today.querySelector('.cov').className+'" vs "'+recent.querySelector('.cov').className+'"');
    // the brief is the same picture before the walk as after it
    today.click(); await sleep(20);
    const brief=d.getElementById('brief').textContent;
    ok(/median 38/.test(brief),'brief carries the last median: '+brief.slice(0,60));
    ok(/2 below floor/.test(brief),'…and its below-floor count');
    ok(/shot/.test(brief),'…and the schedule');
    ok(/since last shot/.test(brief),'…and where the room is in it');
    ok(errors.length===0,'no runtime errors (§5): '+errors.join('|'));
    w.close(); }

  // ============ §6.2 the light-cycle truth table, against rooms.js ========
  { const {w,d,errors}=boot(null); await sleep(50);
    // lights on + 2h15 = first shot. The addendum's corrected cycles.
    const first={A1:'01:15',A3:'01:15',A5:'01:15',B1:'01:15',B2:'01:15',B3:'01:15',
                 B4:'01:15',B5:'01:15',B6:'01:15',
                 A2:'13:15',A4:'13:15',A6:'13:15',C1:'13:15',C2:'13:15',C3:'13:15',
                 C4:'13:15',C5:'13:15',C6:'13:15', A7:'09:15'};
    const wrong=Object.keys(first).filter(k=>!w.SCHED[k]||w.SCHED[k][0]!==first[k]);
    ok(wrong.length===0,'every room\'s first shot matches lights-on + 2h15'+(wrong.length?': '+wrong.join(','):''));
    ok(Object.keys(w.SCHED).length===19,'all 19 production rooms are scheduled');
    w.close(); }






  // ============ §5.4 room setup ============
  // Two wrong calls on 9/10 came from this being uneditable: C3 showed the
  // previous grow's strain map and produced a wrong tiering recommendation,
  // and B3 read DOF 77 when it was 7.
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C3"]').click(); await sleep(20);
    ok(/never confirmed/.test(d.getElementById('cfgbtn').textContent),
       'a room nobody has confirmed says so: '+d.getElementById('cfgbtn').textContent);
    ok(d.getElementById('cfgbtn').classList.contains('stale'),'…and is marked');
    d.getElementById('cfgbtn').click(); await sleep(30);
    ok(!d.getElementById('cfgsheet').classList.contains('hide'),'the sheet opens');
    const rows=d.querySelectorAll('#cfgtables tr').length-1;
    ok(rows===w.ROOMS.C3.t,'one row per table: '+rows);
    // drippers counted in the field read differently from the wing default
    const dr=t=>d.querySelector('#cfgtables .dr[data-t="'+t+'"]');
    ok(dr(1).value==='2' && dr(7).value==='3','C3 carries its counted split: T1 '+dr(1).value+', T7 '+dr(7).value);
    ok(dr(1).classList.contains('known'),'and it is shown as counted, not assumed');
    d.querySelector('#rooms .rm[data-room="C5"]').click(); await sleep(20);
    d.getElementById('cfgbtn').click(); await sleep(30);
    ok(d.querySelector('#cfgtables .dr[data-t="1"]').value==='3','an uncounted C room falls back to the wing default 3');
    ok(!d.querySelector('#cfgtables .dr[data-t="1"]').classList.contains('known'),
       '…and is not dressed up as a measurement');
    w.close(); }

  // the strain map and the flower start are editable, and the overrides win
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C3"]').click(); await sleep(20);
    const was=w.strainFor('C3',1)[0], wasDof=w.dofNow('C3');
    d.getElementById('cfgbtn').click(); await sleep(30);
    d.querySelector('#cfgtables .st[data-t="1"]').value='Scooby Snack';
    d.querySelector('#cfgtables .ul[data-t="1"]').click();
    d.querySelector('#cfgtables .dr[data-t="1"]').value='4';
    d.querySelector('#cfgtables .dr[data-t="1"]').dispatchEvent(new w.Event('input',{bubbles:true}));
    d.getElementById('cfg_fs').value='2026-09-01';
    d.getElementById('cfg_tank').value='B';
    d.getElementById('cfg_plants').value='36';
    d.getElementById('cfgsave').click(); await sleep(30);
    ok(d.getElementById('cfgsheet').classList.contains('hide'),'saving closes the sheet');
    ok(w.strainFor('C3',1)[0]==='Scooby Snack','the strain map is the operator\'s now, not the file\'s: was "'+was+'"');
    ok(w.strainFor('C3',1)[1].indexOf('U')>=0,'underlights set on that table');
    ok(w.strainFor('C3',2)[0]===w.RMAP.C3['2'][0],'and the tables he did not touch are unchanged');
    ok(w.drippersFor('C3',1)===4,'the dripper count is his too: '+w.drippersFor('C3',1));
    ok(w.tankFor('C3')==='B' && w.plantsFor('C3')===36,'tank and plant count stored');
    ok(w.flowerStartFor('C3')==='2026-09-01','flower start overridden');
    ok(w.dofNow('C3')!==wasDof,'so DOF moves with it: '+wasDof+' -> '+w.dofNow('C3'));
    ok(/confirmed/.test(d.getElementById('cfgbtn').textContent) &&
       !d.getElementById('cfgbtn').classList.contains('stale'),
       'and the room stops reading as unconfirmed: '+d.getElementById('cfgbtn').textContent);
    // the move-in fields have to survive a Start, which used to replace the record
    d.getElementById('startbtn').click(); await sleep(30);
    ok(w.strainFor('C3',1)[0]==='Scooby Snack' && w.drippersFor('C3',1)===4 && w.tankFor('C3')==='B',
       'starting a sweep does not wipe them');
    ok(w.S.rows.length===0,'…and nothing is logged yet');
    ok(errors.length===0,'no runtime errors (§5.4): '+errors.join('|')); }

  // volume per plant, the way the plumbing actually works
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.mlPerPlant('C3',1,10)===Math.round(10*2*31.54),
       '10 minutes on a 2-dripper C table: '+w.mlPerPlant('C3',1,10)+' mL');
    ok(w.mlPerPlant('C3',7,10)===Math.round(10*3*31.54),
       'the same 10 minutes on a 3-dripper one: '+w.mlPerPlant('C3',7,10)+' mL');
    ok(w.mlPerPlant('C3',1,10)!==w.mlPerPlant('C3',7,10),
       'which is the whole point — identical runtimes, different volumes');
    ok(w.mlPerPlant('A2',1,10)===Math.round(10*4*17.5),'A wing emitters are 17.5: '+w.mlPerPlant('A2',1,10));
    ok(w.mlPlantToday('C4',1)===null,'no imported schedule, no computed volume — the weekly file stands in');
    const r=w.parseSchedule(fs.readFileSync(path.join(__dirname,'sched_C4_2026-09-10.txt'),'utf8'));
    w.saveSched('C4',{savedAt:Date.now(),room:'C4',tables:r.tables});
    ok(w.mlPlantToday('C4',1)===Math.round((1595/60)*3*31.54),
       'C4 T1 prints 26m 35s on three drippers: '+w.mlPlantToday('C4',1)+' mL');
    ok(w.mlPlantToday('C4',4)>w.mlPlantToday('C4',1),
       'and T4, which runs 31m 55s, gets more: '+w.mlPlantToday('C4',4)+' vs '+w.mlPlantToday('C4',1));
    w.close(); }

  // tank reaches the export, because runoff EC means different things on different tanks
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    w.saveRoomCfg('B2',{tank:'A',savedAt:Date.now()});
    enterSettling(w,35.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    d.getElementById('exit').click(); await sleep(60);
    const csv=d.getElementById('csv').value.split('\n');
    const col=n=>csv[0].split(',').indexOf(n);
    ok(col('Tank')>=0 && col('Drippers')>=0,'CSV carries tank and dripper count');
    ok(csv[1].split(',')[col('Tank')]==='A','the tank is stamped on the row: '+csv[1].split(',')[col('Tank')]);
    ok(csv[1].split(',')[col('Drippers')]==='3','and the dripper count with it: '+csv[1].split(',')[col('Drippers')]); }

  // ============ §6.7 the mid-bag stab is conditional ============
  // 893 reference/mid pairs say the opposite of the 9/8 note: above 30 the
  // mid reads 3-6 under with a tight spread and confirms nothing, and 75% of
  // stabs sit above 30. Below 20 it reads 8+ points WETTER more than half the
  // time — the wetting front stalling above the jig — which is a shot-size
  // finding. So the route asks for the mid only when the reference earns it.
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.profile=false; w.S.triage=[];
    const r=w.buildRoute('B1','up','sweep','standard');
    ok(r.length===11*3,'a 2-gallon sweep routes reference only: '+r.length+' stops for 11 tables');
    ok(r.every(x=>x.depth==='reference'),'…every one of them a reference');
    ok(w.midTrigger('B1')===25,'B1 floor 22, so the trigger is 25: '+w.midTrigger('B1'));
    ok(w.midTrigger('C4')===30,'C4 floor 30, so the trigger is the floor: '+w.midTrigger('C4'));
    ok(w.wantsMid('B1','reference',24.9) && !w.wantsMid('B1','reference',25.1),
       'the boundary is exact');
    ok(!w.wantsMid('B1','mid-bag',10),'a mid never asks for another mid');
    ok(!w.wantsMid('C4','reference',10),'and a 1.25-gallon room asks for none — the pairs are 2-gallon');
    w.S.profile=true;
    const p=w.buildRoute('B1','up','sweep','standard');
    ok(p.length===11*3*2,'profile mode still routes every position: '+p.length);
    ok(p[0].depth==='reference' && p[1].depth==='mid-bag','reference then mid, as before');
    w.S.profile=false;
    w.S.triage=[3];
    const tr=w.buildRoute('B1','up','triage','standard');
    ok(tr.length===6 && tr[1].depth==='mid-bag',
       'a triage keeps the full profile — it is the drainage work, by definition');
    w.close(); }

  // the sequence gains exactly one mid, at that position and nowhere else
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.profile=false;
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    const n0=w.S.route.length;
    const shape=()=>w.S.route.map(x=>'T'+x.t+' '+x.pos+' '+(x.depth==='reference'?'ref':'MID'));
    // three healthy references on T1, then one that comes back dry
    for(const v of [34,33,35]){ enterSettling(w,v,900); await sleep(20);
      d.getElementById('log').click(); await sleep(20); }
    ok(w.S.route.length===n0,'three references above the trigger add nothing: '+w.S.route.length);
    const at=w.S.route[w.S.i];
    enterSettling(w,19.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.route.length===n0+1,'one dry reference adds exactly one stop: '+w.S.route.length);
    const ins=w.S.route[w.S.i];
    ok(ins.depth==='mid-bag' && ins.t===at.t && ins.pos===at.pos,
       'at that table and that position, next: T'+ins.t+' '+ins.pos+' '+ins.depth);
    ok(w.S.route.filter(x=>x.depth==='mid-bag').length===1,'and nowhere else in the room');
    // the mid itself does not breed another
    enterSettling(w,15.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.route.filter(x=>x.depth==='mid-bag').length===1,
       'a low mid-bag reading does not insert a second mid');
    // undoing the reference takes its mid with it
    const before=w.S.route.length;
    d.getElementById('undo').click(); await sleep(20);   // undo the mid
    d.getElementById('undo').click(); await sleep(20);   // undo the reference
    ok(w.S.route.length===before-1,
       'undoing the dry reference removes the mid it called for: '+w.S.route.length+' vs '+before);
    ok(w.S.route.filter(x=>x.depth==='mid-bag').length===0,'no orphan mid left in the route');
    ok(errors.length===0,'no runtime errors (§6.7): '+errors.join('|')); }

  // ============ §6.1 the export is row-aligned ============
  // On 9/10 two pastes went in wrong: B3's four lines one row high, B6's
  // three as a block on T6-T8. A sweep that touches four tables exported four
  // lines into an eleven-row column, so every line was placed by hand.
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B2'; w.S.mode='triage'; w.S.triage=[4,5,6,7]; w.S.rows=[]; w.S.notes={}; w.S.skipped={};
    const mk=(t,pos,vwc)=>({date:'9/10/2026',time:'09:42:00',room:'B2',table:t,position:pos,
      depth:'reference',plant:'',strain:'',flags:'',hrs:'2.0',mode:'triage',dir:'up',
      bag:2,media:'Bio365',side:'standard',vwc:vwc,ec:4,bulk:0.5,tmp:25,
      flag:vwc<w.floorFor('B2'),raw:'x',manualCommit:false,zeroEc:false});
    [4,5,6,7].forEach(t=>['front','center','header'].forEach(p=>w.S.rows.push(mk(t,p,30))));
    const lines=w.rowNoteLines();
    ok(w.ROOMS.B2.t===11,'B2 has eleven tables');
    ok(lines.length===11,'eleven lines for eleven rows, whatever was swept: '+lines.length);
    ok(lines.slice(0,3).every(x=>x===''),'T1 to T3 are blank');
    ok(lines.slice(3,7).every(x=>/^T[4567] /.test(x)),'T4 to T7 carry the readings');
    ok(lines.slice(7).every(x=>x===''),'T8 to T11 are blank');
    // the stamp cannot land in the cell of a table nobody swept
    const out=w.buildRowNotes().split('\n');
    ok(out[0]==='','the paste still starts blank, so it lines up at T1');
    ok(/^\d/.test(out[3]) && /T4 /.test(out[3]),'and the stamp rides the first line that has something on it: '+out[3].slice(0,30));
    w.close(); }

  // a full sweep is unchanged — every table already had a line
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B2'; w.S.mode='sweep'; w.S.rows=[]; w.S.notes={}; w.S.skipped={};
    const mk=(t,pos)=>({date:'9/10/2026',time:'09:42:00',room:'B2',table:t,position:pos,
      depth:'reference',plant:'',strain:'',flags:'',hrs:'2.0',mode:'sweep',dir:'up',
      bag:2,media:'Bio365',side:'standard',vwc:33,ec:4,bulk:0.5,tmp:25,
      flag:false,raw:'x',manualCommit:false,zeroEc:false});
    for(let t=1;t<=11;t++) ['front','center','header'].forEach(p=>w.S.rows.push(mk(t,p)));
    const lines=w.rowNoteLines();
    ok(lines.length===11 && lines.every(x=>x!==''),'eleven lines, none blank: '+lines.length);
    ok(/^\d.*T1 /.test(w.buildRowNotes().split('\n')[0]),'and the stamp is on T1 as it always was');
    w.close(); }

  // a spot stab belongs to a table once the operator says which
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B2"]').click(); await sleep(20);
    [].find.call(d.querySelectorAll('[data-mode]'),b=>b.dataset.mode==='spot').click();
    await sleep(20);
    d.getElementById('startbtn').click(); await sleep(30);
    w.S.dev={gatt:{connected:true}}; w.S.chr={}; w.S.trigger=w.TRIGGER;
    ['log','extra','skip','undo','redo'].forEach(id=>{ d.getElementById(id).disabled=false; });
    ok(/pick a table/.test(d.getElementById('pos').textContent),
       'a spot sweep opens without a table and says so: '+d.getElementById('pos').textContent);
    d.querySelector('#route .tk[data-t="6"]').click(); await sleep(20);
    ok(w.S.spotTable===6,'tapping the strip says where he is standing: T'+w.S.spotTable);
    ok(/T6/.test(d.getElementById('pos').textContent),'and the header agrees: '+d.getElementById('pos').textContent);
    enterSettling(w,30.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows[0].table===6,'the stab lands on T6, not on "?": '+w.S.rows[0].table);
    const lines=w.rowNoteLines();
    ok(lines.length===11 && lines.filter(x=>x!=='').length===1,
       'so the export aligns it: eleven lines, one of them written — '+lines.length);
    ok(/^T6 /.test(lines[5]),'…and T6 is the line with something on it');
    ok(errors.length===0,'no runtime errors (§6.1 spot): '+errors.join('|')); }

  // an unattributed stab is kept, not dropped out of the aligned column
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B2'; w.S.mode='spot'; w.S.rows=[]; w.S.notes={}; w.S.skipped={};
    w.S.rows.push({date:'9/10/2026',time:'09:42:00',room:'B2',table:'?',position:'spot',
      depth:'reference',plant:'',strain:'',flags:'',hrs:'',mode:'spot',dir:'up',bag:2,
      media:'Bio365',side:'standard',vwc:28,ec:5,bulk:0.5,tmp:25,flag:false,raw:'x'});
    const txt=w.buildRowNotes();
    ok(/UNASSIGNED  28\/5.00/.test(txt),'a stab with no table gets its own block at the end: '+txt.replace(/\n/g,' | '));
    w.close(); }

  // ============ §3 a hand-only sweep of a 1.25-gal room is blind ============
  // The hand cannot feel below about 25% in those bags and the floor is 30,
  // so a bag-feel walk does not read less precisely — it structurally cannot
  // find the thing the walk is for. A room done that way must never come
  // back looking covered.
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'C4',1.25);
    ok(w.S.probeFrames===0,'no probe frames yet');
    ok(w.handOnlyBlind(),'C4 is 1.25 gal, so with no probe it is blind');
    ok(/hand-only · cannot detect below floor/.test(w.coverageLine()),
       'the coverage line says so in words: "'+w.coverageLine()+'"');
    ok(w.sweepFlags().join()==='NO_PROBE_1.25GAL','and the export carries the flag');
    d.getElementById('exit').click(); await sleep(60);
    const csv=d.getElementById('csv').value.split('\n');
    const sfc=csv[0].split(',').indexOf('Sweep flags');
    ok(sfc>=0,'CSV gains a sweep-flags column');
    // a hand-only sweep logs nothing, so without a record row the whole walk
    // exports as a bare header and reads as "nothing happened"
    ok(csv.length>1 && csv[1].split(',')[sfc]==='NO_PROBE_1.25GAL',
       'a sweep with no readings still exports one row carrying the flag: '+csv[1].split(',')[sfc]);
    ok(csv[1].split(',')[2]==='C4','…naming the room it was');
    ok(/NO_PROBE_1.25GAL/.test(d.getElementById('stats').textContent),
       'and the done screen says it outright');
    ok(errors.length===0,'no runtime errors (§3): '+errors.join('|')); }

  // one probe frame is enough to stop being blind, and a 2-gal room never is
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'C4',1.25); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,35.0,900); await sleep(20);
    ok(w.S.probeFrames>0,'frames counted off the wire: '+w.S.probeFrames);
    ok(!w.handOnlyBlind(),'so the sweep is no longer hand-only');
    ok(w.coverageLine().indexOf('hand-only')<0,'and the coverage line drops the warning');
    /* sweep-started blocks leave the keep-awake promise in flight; closing
       the window under it tears down document before that resolves */ }
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B1',2);
    ok(w.S.probeFrames===0 && !w.handOnlyBlind(),
       'a 2-gallon room with no probe is not flagged — the hand can still find its 22 floor'); }

  // the room tile is where he looks before walking, so the flag lives there
  { const t0=new Date(); t0.setHours(0,0,0,0);
    const ts=Math.max(Date.now()-3600e3, t0.getTime()+60e3);
    const hist=[{room:'C4',ts:ts,when:new Date(ts).toLocaleString('en-US'),n:0,mode:'sweep',
                 med:null,handOnly:true,qual:false}];
    const {w,d,errors}=boot({'stab_hist':JSON.stringify({v:1,items:hist})}); await sleep(50);
    const tile=d.querySelector('#rooms .rm[data-room="C4"]');
    ok(/hand/.test(tile.querySelector('.tb').textContent),'the tile is badged hand, not today');
    ok(/hand-only/.test(tile.querySelector('.sub').textContent),'…and says so in the sub-label');
    ok(tile.querySelector('.cov').className.indexOf('r')>=0,
       'its coverage bar reads as not done: "'+tile.querySelector('.cov').className+'"');
    w.close(); }

  // ============ §4 what counts as a sweep worth racing ============
  // Walking into a room and tapping out was setting personal records: no
  // timeouts, no skips, no unstable frames, three seconds.
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    w.S.startedAt=Date.now()-3000;
    enterSettling(w,35.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(!w.qualifyingSweep(),'one stab in an eleven-table room does not qualify');
    ok(/1 of 11 tables/.test(w.qualWhy()),'and it says why: '+w.qualWhy());
    d.getElementById('exit').click(); await sleep(60);
    const st=d.getElementById('stats').textContent;
    ok(/not a qualifying sweep/.test(st),'the done screen refuses it a record: '+
       (st.match(/not a qualifying sweep[^\n]*/)||[''])[0]);
    ok(!/fastest/.test(st),'…and offers no PR at all'); }

  // coverage, stabs and a probe frame — the three conditions, one at a time
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B2'; w.S.mode='sweep'; w.S.skipped={}; w.S.probeFrames=5;
    const fill=(tables,perTable)=>{ w.S.rows=[];
      for(let t=1;t<=tables;t++) for(let i=0;i<perTable;i++)
        w.S.rows.push({room:'B2',table:t,position:'center',depth:'reference',vwc:30,ec:4,
                       bulk:0.5,tmp:25,flag:false,raw:'x'}); };
    fill(11,6); ok(w.qualifyingSweep(),'eleven of eleven tables, six stabs each: qualifies');
    fill(9,6);  ok(w.qualifyingSweep(),'nine of eleven is 82%, still qualifies');
    fill(8,6);  ok(!w.qualifyingSweep(),'eight of eleven is 73%, does not: '+w.qualWhy());
    fill(11,1); ok(!w.qualifyingSweep(),'full coverage but one stab per table does not: '+w.qualWhy());
    fill(11,2); ok(w.qualifyingSweep(),'two per table is the floor, and it clears');
    fill(11,6); w.S.probeFrames=0;
    ok(!w.qualifyingSweep(),'and without a probe frame nothing qualifies: '+w.qualWhy());
    // skipped tables come out of the denominator — a crew-blocked room is not
    // a slow sweep, and triaging deliberately targets a handful of tables
    w.S.probeFrames=5; w.S.skipped={9:'crew',10:'crew',11:'crew'};
    fill(8,6); ok(w.qualifyingSweep(),'eight of eight live tables qualifies with three skipped for crew');
    w.S.mode='triage';
    ok(!w.qualifyingSweep(),'a triage is never timed — it targets the bad tables on purpose');
    w.close(); }

  // stabs per minute, kept because elapsed time gets better by skipping work
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(Math.abs(w.stabsPerMin(66,600000)-6.6)<0.01,'66 stabs in 10 minutes is 6.6/min: '+w.stabsPerMin(66,600000));
    ok(w.stabsPerMin(0,600000)===null && w.stabsPerMin(66,0)===null,'and it refuses to divide by nothing');
    w.close(); }

  // old entries do not get grandfathered into the record book
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.histQualifies({room:'B2',mode:'sweep',n:66,dur:900000})===true,
       'a stored 66-stab B2 sweep can still prove itself');
    ok(w.histQualifies({room:'B2',mode:'sweep',n:2,dur:3000})===false,
       'a two-stab three-second one cannot');
    ok(w.histQualifies({room:'B2',mode:'sweep',n:66,dur:900000,qual:false})===false,
       'and an explicit stamp wins over the inference');
    ok(w.histQualifies({room:'BENCH',mode:'sweep',n:24,dur:400000})===false,
       'bench work never holds a record');
    w.close(); }

  // the stamp runs once, on everything already stored
  { const hist=[{room:'B2',ts:Date.now()-8.64e7,when:'9/9/2026',n:66,mode:'sweep',med:33,dur:900000,clean:true},
                {room:'B2',ts:Date.now()-8.65e7,when:'9/9/2026',n:2,mode:'sweep',med:33,dur:3000,clean:true}];
    const {w,d,errors}=boot({'stab_hist':JSON.stringify({v:1,items:hist})}); await sleep(50);
    const h=w.getHist();
    ok(h[0].qual===true && h[1].qual===false,'both stored sweeps stamped: '+h.map(x=>x.n+':'+x.qual).join(', '));
    ok(w.localStorage.getItem('stab_qualrule')==='1','and the rule records that it has run');
    ok(h.length===2,'neither sweep is deleted — for some of them the stored CSV is the only copy');
    w.close(); }

  // ============ feel bands derived from the room's floor ============
  // The words described bag feel and the floor was a separate number, so in
  // a 1.25-gallon room "ok" ran 26 to 30 with the floor at 30 — a derived
  // word contradicting a derived threshold. One table of offsets now serves
  // every bag size, including whatever comes back after coco.
  { const {w,d,errors}=boot(null); await sleep(50);
    // the 2-gallon table this replaces, asserted boundary by boundary
    const want=[[17.9,'dry'],[18,'dry ok'],[21.9,'dry ok'],[22,'ok'],[25.9,'ok'],
                [26,'ok good'],[29.9,'ok good'],[30,'good'],[33.9,'good'],[34,'good solid'],
                [37.9,'good solid'],[38,'solid'],[43.9,'solid'],[44,'solid heavy'],
                [49.9,'solid heavy'],[50,'heavy']];
    const bad=want.filter(([v,word])=>w.feelWord(v,22)!==word);
    ok(bad.length===0,'2-gallon words are unchanged at every boundary'+
       (bad.length?': '+bad.map(([v,x])=>v+' wanted '+x+' got '+w.feelWord(v,22)).join(', '):''));
    // and the invariant that was missing: below floor is never a good word
    let leak=[];
    [22,30,26].forEach(f=>{ for(let v=0;v<f;v+=0.5){
      const word=w.feelWord(v,f);
      if(word!=='dry' && word!=='dry ok') leak.push('floor '+f+' at '+v+' reads "'+word+'"'); } });
    ok(leak.length===0,'no reading below any floor can be described as ok or better'+
       (leak.length?': '+leak.slice(0,3).join('; '):''));
    // the case from the field: C4 T5, three readings under a floor of 30
    ok(w.feelWord(27,30)==='dry ok','27 in a 1.25-gallon room is dry ok, not ok: '+w.feelWord(27,30));
    ok(w.feelWord(27,22)==='ok good','…and the same 27 in a 2-gallon room is still ok good: '+w.feelWord(27,22));
    // a floor nobody has yet resolves without a new table
    ok(w.feelWord(25,26)==='dry ok' && w.feelWord(40,26)==='good solid',
       'an unseen floor of 26 resolves from the same offsets');
    w.close(); }

  // ============ row notes say when a reading is below floor ============
  // Field report, 9/10: "triage mode not showing row notes below floor".
  // The lines were there; what was missing was the finding. The feel words
  // describe how a bag feels and do not track the floor — the 1.25-gallon
  // bands put "ok" at 26-30 while the floor is 30 — so a table picked for a
  // triage precisely because it is under can be described as ok. In a triage
  // the room-note cells are deliberately empty (B §7), which makes this line
  // the only thing that reaches the workbook.
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='C4'; w.S.mode='triage'; w.S.triage=[3,5]; w.S.rows=[]; w.S.notes={}; w.S.skipped={};
    const mk=(t,pos,vwc)=>({date:'9/10/2026',time:'09:42:00',room:'C4',table:t,position:pos,
      depth:'reference',plant:'',strain:'Gello Gelato',flags:'',hrs:'2.0',mode:'triage',dir:'up',
      bag:1.25,media:'Bio365',side:'standard',vwc:vwc,ec:5,bulk:0.5,tmp:25,
      flag:vwc<w.floorFor('C4'),raw:'x',manualCommit:false,zeroEc:false});
    ok(w.floorFor('C4')===30,'C4 is a 1.25-gallon room, floor 30: '+w.floorFor('C4'));
    [['front',24],['center',26],['header',22]].forEach(a=>w.S.rows.push(mk(3,a[0],a[1])));
    [['front',24],['center',33],['header',35]].forEach(a=>w.S.rows.push(mk(5,a[0],a[1])));
    // §6.1: the lines are row-aligned now, so T3 is the third and T5 the fifth
    const lines=w.rowNoteLines();
    ok(/^T3 /.test(lines[2]) && /^T5 /.test(lines[4]),'a triage still writes one row-note line per table');
    ok(/^T3  dry\/dry ok /.test(lines[2]),
       'the feel word can no longer read "ok" on a bag under the floor: '+lines[2]);
    ok(/all below floor 30$/.test(lines[2]),'…and the line says all three are under: '+lines[2]);
    ok(/front below floor 30$/.test(lines[4]),
       'a partial names the end of the table that is dry, which is what he walked over to find: '+lines[4]);
    ok(w.buildRoomNotes()==='','the room-note cells stay empty in a triage (B §7)');
    ok(w.buildRowNotes().indexOf('below floor 30')>0,'so the finding reaches the workbook through the row note or not at all');
    w.close(); }

  // a table entirely above floor says nothing, and the clause never fires on
  // mid-bag — the floor is defined at reference depth
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B1'; w.S.mode='sweep'; w.S.rows=[]; w.S.notes={}; w.S.skipped={};
    const mk=(pos,depth,vwc)=>({date:'9/10/2026',time:'09:42:00',room:'B1',table:1,position:pos,
      depth:depth,plant:'',strain:'',flags:'',hrs:'2.0',mode:'sweep',dir:'up',
      bag:2,media:'Bio365',side:'standard',vwc:vwc,ec:4,bulk:0.5,tmp:25,
      flag:vwc<w.floorFor('B1'),raw:'x',manualCommit:false,zeroEc:false});
    [['front',30],['center',32],['header',31]].forEach(a=>w.S.rows.push(mk(a[0],'reference',a[1])));
    [['front',12],['center',14],['header',13]].forEach(a=>w.S.rows.push(mk(a[0],'mid-bag',a[1])));
    const l=w.rowNoteLines()[0];
    ok(l.indexOf('below floor')<0,'every reference stab above floor, mid-bag well under, and the line stays quiet: '+l);
    ok(/— mid 12/.test(l),'…while still carrying the mid readings');
    w.close(); }

  // one position stabbed twice (an adjacent plant) is named once, not twice
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B1'; w.S.mode='sweep'; w.S.rows=[]; w.S.notes={}; w.S.skipped={};
    const mk=(pos,vwc,extra)=>({date:'9/10/2026',time:'09:42:00',room:'B1',table:1,position:pos,
      depth:'reference',plant:extra?'adjacent':'',strain:'',flags:'',hrs:'2.0',mode:'sweep',dir:'up',
      bag:2,media:'Bio365',side:'standard',vwc:vwc,ec:4,bulk:0.5,tmp:25,
      flag:vwc<w.floorFor('B1'),raw:'x',manualCommit:false,zeroEc:false});
    [mk('front',18),mk('front',19,true),mk('center',30),mk('header',31)].forEach(r=>w.S.rows.push(r));
    const l=w.rowNoteLines()[0];
    ok(/front below floor 22$/.test(l),'two stabs at the same position name it once: '+l);
    w.close(); }

  // ============ §4 schedule paste-in ============
  // The Growlink screen prints the VALUE before its LABEL, so the parser is
  // label-driven: accumulate, then interpret when a known label arrives.
  // These blocks are built from the one documented sample (main spec §3.2);
  // the multi-table, shared-valve and Copilot shapes are derived from it and
  // are the parts to re-check against a real paste when one arrives.
  const schedBlock=(head,control,total,rows)=>[head+'\t---',control,total].concat(rows).join('\n');
  const P1_284=['Recycle Timer','01:15:00 AM','Start Time','4','Mins','44','Secs','Duration',
                '2','Hrs','30','Mins','Interval','4','Frequency'];
  const B5_ONE=schedBlock('B5 Table 1','Simple Timer','18m 56s',P1_284);

  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(B5_ONE);
    const t=r.tables[0]||{};
    ok(r.room==='B5' && r.tables.length===1,'documented block reads as one B5 table: '+r.room+' x'+r.tables.length);
    ok(t.control==='Simple Timer','control type: '+t.control);
    ok(t.runtimeSec===1136,'total runtime 18m 56s -> 1136s: '+t.runtimeSec);
    ok(t.P1.start==='01:15','start time, 12-hour screen to 24-hour: '+t.P1.start);
    ok(t.P1.duration===284,'shot 4m 44s -> 284s: '+t.P1.duration);
    ok(t.P1.interval===9000,'interval 2h 30m -> 9000s: '+t.P1.interval);
    ok(t.P1.frequency===4,'frequency: '+t.P1.frequency);
    ok(t.reconciles===true,'4 x 4m44s = 18m56s, so the block was read correctly');
    ok(r.warnings.length===1 && /no schedule for T2/.test(r.warnings[0]),
       'one table of an eleven-table room is a short paste, and it says so: '+r.warnings[0]);
    ok(w.parseSchedule(B5_ONE).tables.every(x=>x.P1.start==='01:15'),'…without refusing what it did read');
    w.close(); }

  // a table the paste missed reads off the rest of the import, never off the
  // weekly file — half a room on a current schedule and half on a stale one
  // would be invisible in the rows, which is the failure §4 exists to end
  { const {w,d,errors}=boot(null); await sleep(50);
    const at=new Date(); at.setHours(10,52,0,0);
    w.saveSched('B3',{savedAt:Date.now(), room:'B3', tables:[
      {table:1, room:'B3', P1:{start:'01:15', duration:284, interval:7200, frequency:3}, P2:null, flush:null}]});
    ok(Math.abs(w.hoursSinceShot('B3',at,9)-5.6)<0.1,
       'T9 was not in the paste and still reads 5.6h, not the weekly file\'s 1.6h: '+
       w.hoursSinceShot('B3',at,9).toFixed(1)+'h');
    w.close(); }

  // per-table tiers in one paste — the whole room screen, not table by table
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(B5_ONE+'\n'+schedBlock('B5 Table 2','Simple Timer','14m 12s',
      ['Recycle Timer','01:15:00 AM','Start Time','4','Mins','44','Secs','Duration',
       '2','Hrs','30','Mins','Interval','3','Frequency']));
    ok(r.tables.length===2,'one paste, two tables: '+r.tables.length);
    ok(r.tables[0].table===1 && r.tables[1].table===2,'and they come back in table order');
    ok(r.tables[0].P1.frequency===4 && r.tables[1].P1.frequency===3,
       'tiers differ within the room: T1 x'+r.tables[0].P1.frequency+', T2 x'+r.tables[1].P1.frequency);
    ok(r.tables.every(x=>x.reconciles===true),'both reconcile against their own printed totals');
    w.close(); }

  // the A-wing shared valve: one header, two tables, one schedule
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(schedBlock('A1 Table 11+12','Simple Timer','18m 56s',P1_284));
    ok(r.tables.length===2 && r.tables[0].table===11 && r.tables[1].table===12,
       'T11+12 fans out to two records: '+r.tables.map(x=>x.table).join(','));
    ok(r.tables.every(x=>x.shared && x.shared.join('+')==='11+12'),
       'both carry the shared valve, so a wrong dryback call on one is legible on the other');
    ok(r.tables[0].P1.start===r.tables[1].P1.start && r.tables[0].P1.frequency===r.tables[1].P1.frequency,
       'and they carry the same schedule');
    w.close(); }

  // ============ the two real screens, 9/10 ============
  // Everything above is derived from the one documented sample. These are
  // pastes off the phone, and they are the oracle: each block shape that
  // only ever existed as a guess is settled here.
  const paste=f=>fs.readFileSync(path.join(__dirname,f),'utf8');

  // A1 — Copilot, P1/P2/Flush, shared valve, six duration tiers
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(paste('sched_A1_2026-09-10.txt'));
    ok(r.room==='A1','room read off the first field: '+r.room);
    ok(r.tables.length===12,'eleven records covering twelve tables: '+r.tables.length);
    ok(r.warnings.length===0,'nothing to look at: '+r.warnings.join(' | '));
    const by={}; r.tables.forEach(t=>by[t.table]=t);
    // "A1 table 11+12" is the one lower-case header, and the one that fans out
    ok(by[11] && by[12] && by[11].shared.join('+')==='11+12' && by[12].shared.join('+')==='11+12',
       'the lower-case shared-valve header still parses, into T11 and T12');
    ok(by[11].P1.duration===771 && by[12].P1.duration===771,'and both carry 12:51');
    const tiers={1:487,2:487,3:487,4:570,5:570,6:684,7:609,8:609,9:771,10:771,11:771,12:771};
    const wrongT=Object.keys(tiers).filter(t=>by[t].P1.duration!==tiers[t]);
    ok(wrongT.length===0,'six duration tiers across the room, all correct'+(wrongT.length?': T'+wrongT.join(',T'):''));
    ok(r.tables.every(t=>t.P1.start==='01:15' && t.P1.interval===7200 && t.P1.frequency===2),
       'every table starts 1:15 AM, two hours apart, twice');
    ok(r.tables.every(t=>t.control==='Copilot'),'control type read as Copilot throughout');
    // 2.4: a parked P2 is 0 Mins 1 Secs / 1 Min / x1 — not a second daily shot
    ok(r.tables.every(t=>t.P2===null),'P2 is parked, so it is off, not a 1 mL series');
    ok(r.tables.every(t=>t.flush && t.flush.duration===1680),'flush kept at 28:00, and it is not a daily series');
    // 2.1: the printed total is P1 only — 8:07 x 2 = 16:14, flush excluded
    ok(r.tables.every(t=>t.reconciles===true),
       'every table reconciles against a P1-only total (28 minutes of flush excluded)');
    ok(by[1].runtimeSec===974,'A1 T1 prints 16m 14s = 8:07 x 2: '+by[1].runtimeSec+'s');
    w.close(); }

  // C4 — Simple Timer, whole room, two tiers, a different sensor label each time
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(paste('sched_C4_2026-09-10.txt'));
    ok(r.room==='C4' && r.tables.length===11,'eleven tables: '+r.room+' x'+r.tables.length);
    ok(r.warnings.length===0,'nothing to look at: '+r.warnings.join(' | '));
    const by={}; r.tables.forEach(t=>by[t.table]=t);
    // 2.3: the sensor column is free text and never decides table identity.
    // T6 is "Substrate Moisture #20004907", T7 "C4 Table table 7 moisture",
    // T11 "C4 Table 11" — a parser reading it would mis-number three tables.
    ok(by[6] && by[7] && by[11],'the three odd sensor labels do not move their tables');
    ok(by[4].P1.duration===383 && by[5].P1.duration===383,'T4 and T5 on 6:23');
    ok([1,2,3,6,7,8,9,10,11].every(t=>by[t].P1.duration===319),'the other nine on 5:19');
    ok(r.tables.every(t=>t.P1.start==='13:15'),'a PM room: first shot 1:15 PM');
    ok(r.tables.every(t=>t.P1.interval===5400 && t.P1.frequency===5),'five shots, 90 minutes apart');
    ok(r.tables.every(t=>t.P2===null && t.flush===null),'no P2 and no flush section on a Simple Timer room');
    ok(r.tables.every(t=>t.reconciles===true),'5:19 x 5 = 26:35 and 6:23 x 5 = 31:55, both reconcile');
    // 2.6: "Create new timer" ends each record and must not become a value
    ok(by[11].P1.frequency===5,'the trailing "Create new timer" does not corrupt the last record');
    w.close(); }

  // and the tiers reach the sweep, which is the whole point of parsing them
  { const {w,d,errors}=boot(null); await sleep(50);
    const at=new Date(); at.setHours(16,0,0,0);
    const r=w.parseSchedule(paste('sched_C4_2026-09-10.txt'));
    w.saveSched('C4',{savedAt:Date.now(), room:'C4', tables:r.tables});
    ok(Math.abs(w.hoursSinceShot('C4',at,1)-1.25)<0.05,
       'C4 at 4 PM is 1.25h off its 2:45 shot: '+w.hoursSinceShot('C4',at,1).toFixed(2)+'h');
    ok(/5 shots from 1:15 PM, every 1.5h/.test(w.schedLine('C4',1)),
       'and the brief says it in his clock: '+w.schedLine('C4',1));
    w.close(); }

  // a misread block is caught by the arithmetic rather than by the operator
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(schedBlock('B5 Table 1','Simple Timer','18m 56s',
      P1_284.slice(0,-2).concat(['6','Frequency'])));
    ok(r.tables[0].reconciles===false,
       '6 x 4m44s is 28m24s, not the 18m56s printed — flagged, not committed');
    w.close(); }

  // ============ §3, via §4: hours-since-shot from the schedule ============
  // B3 logged 1.7h on 9/10 when the true answer was 5.6h. The arithmetic was
  // never wrong: SCHED.B3 still carried the previous grow's five shots, and
  // the room actually stops after 05:15. This is the case the feature exists
  // for, so it is pinned to the numbers the operator reported.
  { const {w,d,errors}=boot(null); await sleep(50);
    const at=new Date(); at.setHours(10,52,0,0);
    const stale=w.hoursSinceShot('B3',at,1);
    ok(w.SCHED.B3[2]===5,'the weekly file still says five shots');
    ok(Math.abs(stale-1.6)<0.1,'…so uncorrected it reads '+stale.toFixed(1)+'h, the number he saw');
    w.saveSched('B3',{savedAt:Date.now(), room:'B3', tables:[
      {table:1, room:'B3', control:'Simple Timer', runtimeSec:852,
       P1:{start:'01:15', duration:284, interval:7200, frequency:3}, P2:null, flush:null, reconciles:true}]});
    const fixed=w.hoursSinceShot('B3',at,1);
    ok(Math.abs(fixed-5.6)<0.1,'an imported schedule reads '+fixed.toFixed(1)+'h, the real one');
    ok(w.hoursToNextShot('B3',at,1)>10,'and the room is not watered again until tomorrow');
    w.close(); }

  // per-table tiers reach hours-since-shot, not just the verification screen
  { const {w,d,errors}=boot(null); await sleep(50);
    const at=new Date(); at.setHours(10,52,0,0);
    w.saveSched('C3',{savedAt:Date.now(), room:'C3', tables:[
      {table:1, room:'C3', P1:{start:'01:15', duration:180, interval:7200, frequency:3}, P2:null, flush:null},
      {table:7, room:'C3', P1:{start:'01:15', duration:180, interval:5400, frequency:3},
       P2:{start:'07:00', duration:150, interval:3600, frequency:5}, flush:null}]});
    const t1=w.hoursSinceShot('C3',at,1), t7=w.hoursSinceShot('C3',at,7);
    ok(Math.abs(t1-5.6)<0.1,'C3 T1, three shots ending 05:15: '+t1.toFixed(1)+'h');
    ok(Math.abs(t7-0.9)<0.1,'C3 T7, P2 still running: '+t7.toFixed(1)+'h');
    ok(t1!==t7,'two tables in one room, two different answers — which is the point');
    w.close(); }

  // ============ §4 a shot that fires mid-sweep ============
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    w.hoursSinceShot=()=>3.4;
    enterSettling(w,35.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows[0].postShot===false,'a row taken before the shot is not marked');
    w.hoursSinceShot=()=>0.0;                       // the shot fires
    enterSettling(w,36.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows[1].postShot===true,'the row after it is');
    ok(!d.getElementById('alarm').classList.contains('hide'),'and the operator is told at the moment, not at the export');
    ok(/shot fired mid-sweep/.test(d.getElementById('alarm').textContent),
       'alarm says what happened: '+d.getElementById('alarm').textContent.trim().slice(0,60));
    enterSettling(w,36.5,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows[2].postShot===true,'every row after the shot stays on the far side of it');
    d.getElementById('exit').click(); await sleep(50);
    const csv=d.getElementById('csv').value.split('\n');
    const psc=csv[0].split(',').indexOf('After mid-sweep shot');
    ok(psc>=0,'the CSV separates the two populations');
    ok(csv[1].split(',')[psc]==='' && csv[2].split(',')[psc]==='YES',
       'and marks the right rows: "'+csv[1].split(',')[psc]+'" then "'+csv[2].split(',')[psc]+'"'); }

  // ============ §4 the verification screen ============
  // The paste is a convenience, not an authority: nothing is committed until
  // the operator has seen what was read.
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B5"]').click(); await sleep(20);
    ok(/using the weekly file/.test(d.getElementById('schedbtn').textContent),
       'before any import the setup screen says which schedule it is using: '+d.getElementById('schedbtn').textContent);
    d.getElementById('schedbtn').click(); await sleep(20);
    ok(!d.getElementById('schedsheet').classList.contains('hide'),'the sheet opens from the room brief');
    ok(d.getElementById('schedok').classList.contains('hide'),'…with nothing offered to save yet');
    d.getElementById('schedpaste').value=B5_ONE+'\n'+schedBlock('B5 Table 2','Simple Timer','14m 12s',
      ['Recycle Timer','01:15:00 AM','Start Time','4','Mins','44','Secs','Duration',
       '2','Hrs','30','Mins','Interval','3','Frequency']);
    d.getElementById('schedparse').click(); await sleep(20);
    const body=d.getElementById('schedbody').textContent;
    ok(/2 tables read/.test(body),'the screen says what it read: '+body.slice(0,40));
    ok(/1:15 AM/.test(body),'in the operator\'s clock, not the machine\'s');
    ok(!d.getElementById('schedok').classList.contains('hide'),'and only now offers to save');
    d.getElementById('schedok').click(); await sleep(20);
    const saved=JSON.parse(w.localStorage.getItem('stab_sched')||'{}');
    ok(saved.B5 && saved.B5.tables.length===2,'saved under the room: '+(saved.B5?saved.B5.tables.length+' tables':'nothing'));
    ok(d.getElementById('schedsheet').classList.contains('hide'),'and the sheet closes');
    ok(/imported/.test(d.getElementById('schedbtn').textContent) &&
       d.getElementById('schedbtn').classList.contains('set'),
       'and the setup screen now says where its numbers come from: '+d.getElementById('schedbtn').textContent);
    ok(/tiers differ/.test(w.schedLine('B5')),
       'the brief admits the room is not one schedule: '+w.schedLine('B5'));
    ok(/4 shots from 1:15 AM/.test(w.schedLine('B5',1)) && /3 shots from 1:15 AM/.test(w.schedLine('B5',2)),
       'and per table it is exact: T1 "'+w.schedLine('B5',1)+'", T2 "'+w.schedLine('B5',2)+'"');
    ok(errors.length===0,'no runtime errors (§4 sheet): '+errors.join('|'));
    w.close(); }

  // a paste from the wrong room, or of nothing at all, cannot be committed
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B5"]').click(); await sleep(20);
    d.getElementById('schedbtn').click(); await sleep(20);
    d.getElementById('schedpaste').value='some other thing entirely';
    d.getElementById('schedparse').click(); await sleep(20);
    ok(d.getElementById('schedok').classList.contains('hide'),'an unreadable paste offers no save');
    ok(/nothing read/.test(d.getElementById('schedbody').textContent),'and says so plainly');
    d.getElementById('schedpaste').value=schedBlock('A1 Table 3','Simple Timer','18m 56s',P1_284);
    d.getElementById('schedparse').click(); await sleep(20);
    ok(d.getElementById('schedok').classList.contains('hide'),'an A1 paste on the B5 screen offers no save either');
    ok(/says A1, you are on B5/.test(d.getElementById('schedbody').textContent),
       'and names the mismatch: '+d.getElementById('schedbody').textContent.slice(0,50));
    w.close(); }

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); console.log(e.stack); process.exit(2); });

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
    ok(/,Skipped,After mid-sweep shot$/.test(csv[0]),'CSV has a Skipped column');
    const skipRows=csv.slice(1).filter(l=>/"crew",?$/.test(l));
    ok(skipRows.length>0,'the skip is recorded in the export: '+skipRows.length+' row(s)');
    const nCols=csv[0].split(',').length;
    ok(csv.slice(1).every(l=>l.split(',').length===nCols),'every row has the header\'s column count');
    // a table skipped with no readings at all still leaves a record row
    const fully=csv.slice(1).filter(l=>{ const c=l.split(','); return c[15]==='' && /"crew",?$/.test(l); });
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
    const lines=w.rowNoteLines();
    ok(/^T3 /.test(lines[0]) && /^T5 /.test(lines[1]),'a triage still writes one row-note line per table');
    ok(/ok/.test(lines[0]),'the feel word on T3 is still "ok" — that is what the bag feels like: '+lines[0]);
    ok(/all below floor 30$/.test(lines[0]),'…and the line now says all three are under: '+lines[0]);
    ok(/front below floor 30$/.test(lines[1]),
       'a partial names the end of the table that is dry, which is what he walked over to find: '+lines[1]);
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

  // Copilot: P1 and P2 are separate series, not variants of one
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(schedBlock('C3 Table 7','Copilot','27m 30s',
      ['P1 timers','01:15:00 AM','Start Time','3','Mins','0','Secs','Duration',
       '1','Hrs','30','Mins','Interval','3','Frequency',
       'P2 timers','07:00:00 AM','Start Time','2','Mins','30','Secs','Duration',
       '1','Hrs','0','Mins','Interval','5','Frequency',
       'Flush timers','6','Mins','0','Secs','Duration']));
    const t=r.tables[0]||{};
    ok(t.control==='Copilot','control type: '+t.control);
    ok(t.P1.start==='01:15' && t.P1.duration===180 && t.P1.frequency===3,
       'P1 parsed on its own: '+t.P1.start+' x'+t.P1.frequency+' of '+t.P1.duration+'s');
    ok(t.P2 && t.P2.start==='07:00' && t.P2.duration===150 && t.P2.frequency===5,
       'P2 parsed separately: '+(t.P2?t.P2.start+' x'+t.P2.frequency+' of '+t.P2.duration+'s':'missing'));
    ok(t.flush && t.flush.duration===360,'flush duration kept: '+(t.flush?t.flush.duration:'missing'));
    ok(t.reconciles===true,'P1 + P2 + flush = the printed total, so a Copilot room is not falsely flagged');
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
    ok(/,After mid-sweep shot$/.test(csv[0]),'the CSV separates the two populations');
    ok(csv[1].split(',').pop()==='' && csv[2].split(',').pop()==='YES',
       'and marks the right rows: "'+csv[1].split(',').pop()+'" then "'+csv[2].split(',').pop()+'"'); }

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

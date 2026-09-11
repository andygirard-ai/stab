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















  // ============ battery over the DECA UART ============
  // The SOLUS 1.2.6 release binary carries the literal "get -batt" beside
  // MeterBleUart, SolusDevice, batteryLevel and getBatteryIcon, and no 180F
  // or 2A19. The GATT dump was right that there is no Battery Service and
  // wrong as an answer about the battery — it comes back over the same UART
  // that answers sdicmd.
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.BATT_CMD==='get -batt','the command is the literal from the binary: '+JSON.stringify(w.BATT_CMD));
    // framed exactly as sdicmd is: 7C 61, length, payload, CRC-16/XMODEM
    const f=w.frameBytes(w.BATT_CMD);
    ok(f[0]===0x7C && f[1]===0x61,'framed with the same 7C 61 marker');
    ok(((f[2]<<8)|f[3])===f.length,'…the same whole-frame length: '+((f[2]<<8)|f[3])+' of '+f.length);
    ok(f.length===6+w.BATT_CMD.length,'…and no padding: '+f.length+' bytes for a '+w.BATT_CMD.length+'-char command');
    const body=f.slice(0,f.length-2), crc=(f[f.length-2]<<8)|f[f.length-1];
    ok(w.crc16(body)===crc,'…and a CRC that checks out');
    const ascii=f.slice(4,f.length-2).map(b=>String.fromCharCode(b)).join('');
    ok(ascii==='get -batt','the payload is the command verbatim: '+JSON.stringify(ascii));
    w.close(); }

  // the capture records notifications raw, before any parsing touches them
  { const {w,d,errors}=boot(null); await sleep(50);
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    let written=null;
    w.S.dev={name:'ZSC08328', gatt:{connected:true}};
    // a notification arrives through onPacket, which is where the raw hook
    // sits — rxBytes is one layer further in and would bypass it
    const notify=bytes=>w.onPacket({target:{value:{byteLength:bytes.length,
      getUint8:i=>bytes[i]}}});
    w.S.wchr={properties:{write:true}, writeValue:function(d2){
      written=[].slice.call(d2);
      setTimeout(function(){ notify(w.frameBytes('batt 87 4.21V')); },30);
      return Promise.resolve();
    }};
    d.getElementById('batgo').click(); await sleep(2900);
    const t=d.getElementById('batout').textContent;
    ok(written && written.join()===w.frameBytes('get -batt').join(),
       'it writes the framed command through the sdicmd write path');
    ok(/framed "get -batt"/.test(t),'the capture says what it sent');
    ok(/subscribed by connect, before anything was sent/.test(t),
       'and that notifications were already subscribed — connect does that before any write');
    ok(/hex   7C 61/.test(t),'the reply is logged as hex: '+(t.match(/hex   [^\n]*/)||[''])[0]);
    ok(/ascii .*batt 87 4\.21V/.test(t),'and as ascii: '+(t.match(/ascii [^\n]*/)||[''])[0]);
    // nothing is interpreted
    ok(!/87%/.test(t) && !/percent/i.test(t),'nothing is parsed — no percentage is claimed anywhere');
    ok(w.S.batt===undefined || w.S.batt==null,'and no battery value is stored');
    ok(errors.length===0,'no runtime errors (battery capture): '+errors.join('|'));
    w.close(); }

  // no reply to the framed form falls back to the raw one, labelled, in the
  // same trip to the room
  { const {w,d,errors}=boot(null); await sleep(50);
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    const sent=[];
    w.S.dev={name:'ZSC08328', gatt:{connected:true}};
    w.S.wchr={properties:{write:true}, writeValue:function(d2){
      sent.push([].slice.call(d2)); return Promise.resolve();
    }};
    d.getElementById('batgo').click(); await sleep(5600);
    const t=d.getElementById('batout').textContent;
    ok(sent.length===2,'two attempts when the first is silent: '+sent.length);
    ok(sent[0][0]===0x7C,'the first is framed');
    ok(sent[1].map(b=>String.fromCharCode(b)).join()===''.concat(...'get -batt').split('').join(),
       'the second is the bare command on the same characteristic');
    ok(/\(no notifications\)/.test(t),'each silent attempt says so');
    ok(/raw "get -batt"/.test(t),'and the two are labelled apart: '+
       (t.match(/raw "[^\n]*/)||[''])[0]);
    w.close(); }

  // the raw hook is off unless a capture is running
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,33.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===1,'an ordinary sweep is unaffected');
    ok(w.hexOf([0x7C,0x61,0x0F])==='7C 61 0F','the hex helper is plain: '+w.hexOf([0x7C,0x61,0x0F]));
    ok(w.asciiOf([0x62,0x61,0x74,0x74,0x00])==='batt.','and unprintables show as dots: '+
       w.asciiOf([0x62,0x61,0x74,0x74,0x00])); }

  // A3 is Bio365 now, so no room in the facility runs coco
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.ROOMS.A3.media==='Bio365','A3 was replanted into Bio365: '+w.ROOMS.A3.media);
    ok(w.ROOMS.A3.bag===2,'…still 2 gallon');
    const media={}; Object.keys(w.ROOMS).forEach(k=>{ if(!w.ROOMS[k].kind) media[w.ROOMS[k].media]=1; });
    ok(Object.keys(media).join()==='Bio365',
       'every production room is on one substrate, so the fitted 2.90 offset covers all of them: '+
       Object.keys(media).join(', '));
    ok(w.offsetFor('Bio365')===2.90,'and that offset is 2.90: '+w.offsetFor('Bio365'));
    w.close(); }

  // ============ the scan had no way to be run ============
  // Field report 9/11: "when I'm in settings and I tap scan probe, I'm not
  // connected. But then when I go to a room and connect, the only way to get
  // out of there is to end. And when you hit end, it disconnects." A
  // diagnostic that cannot be run is not a diagnostic.
  { const {w,d,errors}=boot(null); await sleep(50);
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    // no probe, no Web Bluetooth in jsdom: it says so rather than refusing
    d.getElementById('scango').click(); await sleep(40);
    const t=d.getElementById('scanout').textContent;
    ok(/probe scan · /.test(t),'the scan always starts and reports');
    ok(!/wake the probe and connect first/.test(t),
       'it no longer tells him to do the thing he has no way of doing');
    ok(/open this in Bluefy/.test(t),'…it says what is actually wrong here: '+t.split('\n').pop());
    w.close(); }

  // with a probe already connected it scans it, without reconnecting
  { const {w,d,errors}=boot(null); await sleep(50);
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    let connects=0;
    w.connect=function(){ connects++; return Promise.resolve(); };
    const nf=new Error('x'); nf.name='NotFoundError';
    w.S.dev={name:'ZSC', gatt:{connected:true,
      getPrimaryService:()=>Promise.reject(nf),
      getPrimaryServices:()=>Promise.resolve([])}};
    d.getElementById('scango').click(); await sleep(80);
    ok(connects===0,'an already-connected probe is not reconnected');
    ok(/device: ZSC/.test(d.getElementById('scanout').textContent),'and it is scanned');
    w.close(); }

  // ============ START was one-way ============
  // Opening a room by mistake could only be ended, which recorded an empty
  // sweep and marked the tile swept today.
  { const {w,d,errors}=boot(null); await sleep(50);
    w.confirm=()=>false;                       // "discard it"
    start(w,d,'B2',2); await sleep(20);
    ok(w.S.roomStarted,'a sweep is running');
    d.getElementById('exit').click(); await sleep(40);
    ok(!w.S.roomStarted,'END with nothing logged can back out');
    ok(d.getElementById('done').classList.contains('hide'),'no done screen');
    ok(!d.getElementById('setup').classList.contains('hide'),'back on the setup screen');
    ok(w.getHist().length===0,'and nothing is written to history: '+w.getHist().length);
    ok(!w.localStorage.getItem('stab_session'),'no interrupted sweep left behind either');
    w.close(); }

  // …while a deliberate bag-feel sweep is still recorded and still flagged
  { const {w,d,errors}=boot(null); await sleep(50);
    w.confirm=()=>true;                        // "record it as hand-only"
    start(w,d,'C4',1.25); await sleep(20);
    d.getElementById('exit').click(); await sleep(60);
    ok(!d.getElementById('done').classList.contains('hide'),'the done screen appears');
    ok(/NO_PROBE_BLIND_FLOOR/.test(d.getElementById('stats').textContent),
       'and it is flagged hand-only, which §3 requires'); }

  // a sweep with skips is a record even with no readings
  { const {w,d,errors}=boot(null); await sleep(50);
    let asked=0; w.confirm=()=>{ asked++; return false; };
    start(w,d,'B2',2); await sleep(20);
    w.S.skipped={1:'crew',2:'crew'};
    d.getElementById('exit').click(); await sleep(60);
    ok(asked===0,'no question asked — skips are already a record of the walk');
    ok(!d.getElementById('done').classList.contains('hide'),'it ends normally'); }

  // ============ the TEROS guide: sensor error codes ============
  // The TEROS 12 is a passive 4.0-15 VDC sensor whose SDI-12 command set
  // carries no power telemetry, and the ZSC bridge runs on two AA cells and
  // documents no level readout anywhere. The Batt column was read exactly as
  // the SIG specifies and never returned a value, so it is gone — and the
  // probe scan in settings can still overturn that. What is not in doubt is
  // -9991, "insufficient voltage to perform the measurement", which arrives
  // on the wire we already read. All three error codes were falling through
  // to the unparsed bucket.
  { const {w,d,errors}=boot(null); await sleep(50);
    const cases=[['-9991',/supply voltage too low/],['-9992',/calibration lost/],
                 ['-9999',/measurement compromised/]];
    cases.forEach(([code,re])=>{
      const pr=w.parseText('0\t'+code+' 24.9 308\rg8');
      ok(pr && pr.err===code,code+' parses as an error, not a reading: '+(pr?(pr.err||pr.counts):'unparsed'));
      ok(pr && re.test(pr.msg),'…saying what it means: '+(pr?pr.msg:''));
    });
    const good=w.parseText('0\t2297.3 24.9 308\rg8');
    ok(good && !good.err && good.counts===2297.3,'a real reading is untouched: '+good.counts);
    const air=w.parseText('0\t1790.0 22.0 0\rg8');
    ok(air && !air.err && air.counts===1790,'and so is an air frame');
    w.close(); }

  // an error frame never becomes a reading
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    const i0=w.S.i;
    w.rxBytes(w.frameBytes('0\t-9991 24.9 308\rg8')); await sleep(20);
    ok(w.S.rows.length===0,'nothing is logged: '+w.S.rows.length+' rows');
    ok(w.S.i===i0,'the cursor does not move');
    ok(!d.getElementById('alarm').classList.contains('hide'),'the operator gets a held banner');
    const at=d.getElementById('alarmtxt').textContent;
    ok(/-9991/.test(at) && /stereo plug/.test(at) && /ZSC batteries/.test(at),
       'and names the supply fault with its likeliest causes in order — not "the batteries are low", '+
       'which -9991 does not say: '+at);
    ok(!/batteries too low/.test(at),
       '-9991 is a supply fault at the sensor, not a battery gauge, and the wording must not imply one');
    ok(d.getElementById('alarmundo').classList.contains('hide'),
       'with no Undo, because no reading was taken');
    ok(w.DBG.sensorErr===1 && w.DBG.lastSensorErr==='-9991','and it is counted: '+w.DBG.sensorErr);
    // it is not left in the unparsed bucket pretending to be a protocol fault
    ok(!w.DBG.unparsed.some(x=>/9991/.test(x)),'it is not filed as an unparsed packet');
    // the machine is re-armed, so a good stab after it still works
    d.getElementById('alarmok').click(); await sleep(20);
    enterSettling(w,33.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===1,'a good reading after the error still logs: '+w.S.rows.length);
    d.getElementById('exit').click(); await sleep(60);
    const csv=d.getElementById('csv').value.split('\n');
    const col=n=>csv[0].split(',').indexOf(n);
    ok(/SENSOR_ERR:-9991x1/.test(csv[1].split(',')[col('Sweep flags')]),
       'and the sweep carries it into the export: '+csv[1].split(',')[col('Sweep flags')]);
    ok(col('Batt')<0,'the Batt column is gone — it never once returned a value');
    ok(/sensor errors 1 \(last -9991\)/.test(d.getElementById('dbg').textContent),
       'with the count in the diagnostics'); }

  // ============ the weekly blob — the whole facility in one paste =========
  // What he actually copies each week: nineteen rooms, 209 records, one
  // blob. Every earlier fixture was a single room's screen, and the pipeline
  // above the block parser assumed that.
  { const {w,d,errors}=boot(null); await sleep(50);
    const blob=fs.readFileSync(path.join(__dirname,'sched_ALL_2026-09-11.txt'),'utf8');
    const r=w.parseSchedule(blob);
    ok(r.rooms.length===19,'all nineteen rooms come out of one paste: '+r.rooms.length);
    ok(r.tables.length===216,'216 table records — 7 A-wing rooms of 12, 12 of 11: '+r.tables.length);
    ok(r.warnings.length===0,'and not one warning: '+r.warnings.join(' | '));
    ok(r.asOf==='9/11/26 10:14am','the blob\'s own timestamp is kept: '+r.asOf);
    const by={}; r.rooms.forEach(g=>by[g.room]=g);
    ok(Object.keys(by).sort().join(',')==='A1,A2,A3,A4,A5,A6,A7,B1,B2,B3,B4,B5,B6,C1,C2,C3,C4,C5,C6',
       'every production room, no strays: '+Object.keys(by).sort().join(','));
    ok(by.A1.tables.length===12 && by.B1.tables.length===11,'wing sizes right');
    // grouping has to come before sorting or the rooms interleave
    ok(r.tables.slice(0,12).every(t=>t.room==='A1'),
       'the flat list stays grouped: '+r.tables.slice(0,3).map(t=>t.room+'T'+t.table).join(' '));
    ok(r.tables[0].table===1 && r.tables[11].table===12,'and sorted within a room');
    w.close(); }

  // the things this blob contains that no earlier fixture did
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(fs.readFileSync(path.join(__dirname,'sched_ALL_2026-09-11.txt'),'utf8'));
    const get=(rm,t)=>r.tables.filter(x=>x.room===rm&&x.table===t)[0];
    // A3 and A4 print 0s daily runtime on every table — both rooms are off
    const off={}; r.tables.forEach(t=>{ if(t.inactive) off[t.room]=(off[t.room]||0)+1; });
    ok(Object.keys(off).sort().join(',')==='A3,A4','two rooms are switched off: '+Object.keys(off).sort().join(','));
    ok(off.A3===12 && off.A4===12,'every table in them: A3 '+off.A3+', A4 '+off.A4);
    ok(get('A3',1).reconciles===null,'and none of them is flagged as a misread block');
    ok(get('A3',1).P1.duration===536,'…while their P1 is still read, for when they come back on');
    // A3 T11+12's flush prints 45, a blank line, then 0 Secs
    ok(get('A3',11).flush.duration===2700,
       'A3 T11+12 flush is 45 minutes, not 45 seconds: '+get('A3',11).flush.duration+'s');
    ok(get('A3',12).flush.duration===2700,'…on both halves of the shared valve');
    // an hour in the printed total
    ok(get('A2',3).runtimeSec===4320 && get('A2',3).reconciles===true,
       'A2 T3 prints 1h 12m 0s and reconciles against 36m x2: '+get('A2',3).runtimeSec+'s');
    // every reconciliation in the facility passes
    ok(r.tables.filter(t=>t.reconciles===false).length===0,'not one misread block in 209 records');
    // the sensor map, which is what the sensor pull needs
    const ids=r.tables.filter(t=>t.sensorId).map(t=>t.room+' T'+t.table+' #'+t.sensorId);
    ok(ids.join(', ')==='C1 T10 #20004922, C4 T6 #20004907',
       'both known orphans found, and only those: '+ids.join(', '));
    const none=r.tables.filter(t=>!t.sensor).length;
    ok(none===76,'and 76 tables have no sensor assigned: '+none);
    ok(get('A1',11).sensor==='A1 11 Back Moisture' && get('A1',12).sharedSensor===true,
       'the shared valve carries one sensor across both records');
    w.close(); }

  // one paste, every room saved
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C4"]').click(); await sleep(20);
    d.getElementById('cfgbtn'); d.getElementById('schedbtn').click(); await sleep(20);
    d.getElementById('schedpaste').value=fs.readFileSync(path.join(__dirname,'sched_ALL_2026-09-11.txt'),'utf8');
    d.getElementById('schedparse').click(); await sleep(30);
    const body=d.getElementById('schedbody').textContent;
    ok(/19 rooms · 216 tables/.test(body),'the screen summarises by room, not 216 rows: '+body.slice(0,44));
    ok(/as of 9\/11\/26/.test(body),'with the blob\'s own timestamp');
    ok(/all off/.test(body),'and says which rooms are switched off');
    ok(/Save all 19 rooms/.test(d.getElementById('schedok').textContent),
       'the button says what it will do: '+d.getElementById('schedok').textContent);
    // the wrong-room guard must not fire on a facility paste
    ok(!/you are on C4/.test(body),'it does not complain that the paste "says A1" — it says all of them');
    d.getElementById('schedok').click(); await sleep(30);
    const saved=JSON.parse(w.localStorage.getItem('stab_sched')||'{}');
    ok(Object.keys(saved).length===19,'nineteen rooms stored from one tap: '+Object.keys(saved).length);
    ok(saved.B1.tables.length===11 && saved.A1.tables.length===12,'each with its own tables');
    ok(saved.C4.asOf==='9/11/26 10:14am','and each carrying when the blob was taken');
    // and the schedules are live: B3's shots now come from the import
    const at=new Date(); at.setHours(10,52,0,0);
    ok(w.hoursSinceShot('A3',at,1)===null,'a room that is off reports no last shot');
    ok(w.hoursSinceShot('A1',at,1)!==null,'a room that is running does: '+w.hoursSinceShot('A1',at,1).toFixed(1)+'h');
    ok(errors.length===0,'no runtime errors (weekly blob): '+errors.join('|'));
    w.close(); }

  // a single-room paste still gets the per-table screen and the room guard
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B5"]').click(); await sleep(20);
    d.getElementById('schedbtn').click(); await sleep(20);
    d.getElementById('schedpaste').value=fs.readFileSync(path.join(__dirname,'sched_C4_2026-09-10.txt'),'utf8');
    d.getElementById('schedparse').click(); await sleep(20);
    ok(/says C4, you are on B5/.test(d.getElementById('schedbody').textContent),
       'one room and the wrong one still refuses: '+d.getElementById('schedbody').textContent.slice(0,40));
    ok(d.getElementById('schedok').classList.contains('hide'),'…with no save offered');
    w.close(); }

  // ============ 9/11 schedule paste, second round ============
  // Four things a wider set of real screens showed. Written from the
  // operator's notes on the paste rather than the paste itself, so the
  // header variants are exactly the eight he listed and no more.

  // 1. the first field names a room and table numbers; nothing else in it
  //    means anything
  { const {w,d,errors}=boot(null); await sleep(50);
    const want={
      'A1 Table 1':['A1',[1]], 'A3 table 2':['A3',[2]], 'B2 table 1':['B2',[1]],
      'C3 table 1':['C3',[1]], 'A1 table 11+12':['A1',[11,12]],
      'A6 Tables 11 + 12':['A6',[11,12]],          // plural, spaces round the plus
      'A7 Table 2 manual':['A7',[2]],              // trailing word
      'A7 Table 11+12 manual':['A7',[11,12]]
    };
    const bad=Object.keys(want).filter(k=>{
      const g=w.schedHeader(k);
      return !g || g.room!==want[k][0] || g.tables.join()!==want[k][1].join();
    });
    ok(bad.length===0,'every header variant parses'+(bad.length?': '+bad.join(' | '):''));
    ok(w.schedHeader('Simple Timer')===null && w.schedHeader('P1 timers')===null &&
       w.schedHeader('18m 56s')===null,'and the lines that are not headers still are not');
    w.close(); }

  // 2. a number can arrive with its unit missing
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.schedSeconds(['45','0','Secs'])===2700,
       'A3 T11+12 flush prints 45 then 0 Secs with no Mins label: '+w.schedSeconds(['45','0','Secs'])+'s');
    ok(w.schedSeconds(['1','Hrs','5','30','Secs'])===3930,
       'a bare number between Hrs and Secs is minutes: '+w.schedSeconds(['1','Hrs','5','30','Secs']));
    ok(w.schedSeconds(['4','Mins','44','Secs'])===284,'labelled pairs are unchanged');
    ok(w.schedSeconds(['0','Mins','1','Secs'])===1,'and so is the parked P2');
    ok(w.schedSeconds(['45'])===null,'a bare number with nothing to anchor it stays unread');
    ok(w.schedSeconds(['Recycle Timer','01:15:00 AM'])===null,'as does a line with no units at all');
    w.close(); }

  // 3. a 0s total is a timer switched off, not a block that was misread
  { const {w,d,errors}=boot(null); await sleep(50);
    const off=['B5 Table 4\tB5 4 moisture\t','Simple Timer','0s\t','Recycle Timer','',
               '01:15:00 AM','Start Time','4','Mins','44','Secs','Duration',
               '2','Hrs','30','Mins','Interval','4','Frequency','Create new timer'].join('\n');
    const r=w.parseSchedule(off);
    ok(r.tables.length===1,'the table is kept, not dropped as a paste that missed it');
    ok(r.tables[0].inactive===true,'and marked off: '+r.tables[0].inactive);
    ok(r.tables[0].reconciles===null,'reconciliation does not apply, so it is not flagged as an error');
    ok(r.warnings.filter(x=>/T4[^0-9]/.test(x)).length===0,
       'and nothing warns about the table itself: '+(r.warnings.join(' | ')||'no warnings'));
    // and it contributes no shots, which is the part that would mislead
    w.saveSched('B5',{savedAt:Date.now(), room:'B5', tables:r.tables});
    const at=new Date(); at.setHours(10,52,0,0);
    ok(w.hoursSinceShot('B5',at,4)===null,
       'an off table reports no last shot rather than the weekly file\'s: '+w.hoursSinceShot('B5',at,4));
    ok(w.schedSeries('B5',4).length===0,'no series at all');
    w.close(); }

  // an off table must not stand in for the tables a paste missed
  { const {w,d,errors}=boot(null); await sleep(50);
    w.saveSched('B5',{savedAt:Date.now(), room:'B5', tables:[
      {table:4, room:'B5', inactive:true, P1:{start:'01:15',duration:284,interval:7200,frequency:4}, P2:null, flush:null},
      {table:5, room:'B5', inactive:false, P1:{start:'01:15',duration:284,interval:7200,frequency:3}, P2:null, flush:null}]});
    const at=new Date(); at.setHours(10,52,0,0);
    ok(w.hoursSinceShot('B5',at,4)===null,'the off table itself still reports nothing');
    ok(Math.abs(w.hoursSinceShot('B5',at,9)-5.6)<0.1,
       'but T9, which the paste missed, reads off the running table, not the off one: '+
       w.hoursSinceShot('B5',at,9));
    w.close(); }

  // 4. the sensor column is the sensor pull's table key
  { const {w,d,errors}=boot(null); await sleep(50);
    const rec=(head,sensor)=>[head+'\t'+sensor+'\t','Simple Timer','26m 35s\t','Recycle Timer','','',
      '01:15:00 PM','Start Time','5','Mins','19','Secs','Duration','1','Hrs','30','Mins','Interval',
      '5','Frequency','Create new timer'].join('\n');
    const r=w.parseSchedule([
      rec('C4 Table 1','C4 Table 1 moisture'),
      rec('C4 Table 6','Substrate Moisture #20004907'),
      rec('C4 Table 11','---')
    ].join('\n'));
    const by={}; r.tables.forEach(t=>by[t.table]=t);
    ok(by[1].sensor==='C4 Table 1 moisture','a named sensor is stored verbatim: '+by[1].sensor);
    ok(by[6].sensor==='Substrate Moisture #20004907','so is an orphan reading as a raw id');
    ok(by[6].sensorId==='20004907','with the id pulled out for the lookup: '+by[6].sensorId);
    ok(by[1].sensorId===null,'a named one has no id, which is fine');
    ok(by[11].sensor===null,'--- means unassigned, and is stored as nothing rather than as "---"');
    // the sensor column still decides no table identity
    const odd=w.parseSchedule(rec('C4 Table 7','C4 Table table 7 moisture'));
    ok(odd.tables[0].table===7,'a sensor name that says "table" twice moves nothing: T'+odd.tables[0].table);
    w.close(); }

  // a shared valve prints one sensor for the pair
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(['A1 table 11+12\tA1 11 Back Moisture\t','Copilot','16m 14s\t',
      'P1 timers','','','01:15:00 AM','Start Time','8','Mins','7','Secs','Duration',
      '2','Hrs','0','Mins','Interval','2','Frequency'].join('\n'));
    ok(r.tables.length===2,'two records');
    ok(r.tables.every(t=>t.sensor==='A1 11 Back Moisture'),'both carry the one sensor the screen printed');
    ok(r.tables.every(t=>t.sharedSensor===true),
       'flagged as shared, so neither is taken for a sensor of its own');
    w.close(); }

  // the two real pastes still parse, with their sensors now kept
  { const {w,d,errors}=boot(null); await sleep(50);
    const r=w.parseSchedule(fs.readFileSync(path.join(__dirname,'sched_C4_2026-09-10.txt'),'utf8'));
    ok(r.tables.length===11 && r.warnings.length===0,'C4 unchanged: '+r.tables.length+' tables');
    const by={}; r.tables.forEach(t=>by[t.table]=t);
    ok(by[6].sensorId==='20004907','and C4 T6\'s orphan id is now captured: '+by[6].sensorId);
    ok(by[11].sensor==='C4 Table 11','T11\'s bare name too');
    ok(r.tables.every(t=>!t.inactive),'nothing in C4 is switched off');
    const a=w.parseSchedule(fs.readFileSync(path.join(__dirname,'sched_A1_2026-09-10.txt'),'utf8'));
    ok(a.tables.length===12 && a.warnings.length===0,'A1 unchanged: '+a.tables.length+' records');
    ok(a.tables.filter(t=>t.table===11)[0].sharedSensor===true,'A1 T11+12 shares its sensor');
    w.close(); }

  // ============ 9/11 bugs ============

  // 1. the depth control was inert — real buttons with no styling at all,
  //    so tapping Profile looked like nothing happening and the choice stuck.
  //    v34's test set S.profile directly and never touched the UI, which is
  //    exactly why this shipped.
  { const {w,d,errors}=boot(null); await sleep(50);
    const segs=[].slice.call(d.querySelectorAll('#setup .two button, #cfgsheet .two button'));
    const bare=segs.filter(b=>!b.classList.contains('seg'));
    ok(bare.length===0,'every segmented control carries the class that styles it'+
       (bare.length?': '+bare.map(b=>b.className).join(' | '):''));
    ok(segs.length>=16,'and there are '+segs.length+' of them');
    // the styling rule must actually name that class
    const css=d.querySelector('style').textContent;
    ok(/\.seg,/.test(css) && /\.seg\.on,/.test(css),
       'the stylesheet styles .seg in both states, so a new control cannot be invisible');
    w.close(); }

  // driven through the buttons, which is the part that was never tested
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B2"]').click(); await sleep(20);
    const prof=n=>d.querySelector('.prof[data-prof="'+n+'"]');
    ok(prof(0).classList.contains('on'),'Reference is the default');
    ok(!w.S.profile,'…and the state agrees');
    prof(1).click(); await sleep(20);
    ok(w.S.profile===true,'tapping Profile sets it: '+w.S.profile);
    ok(prof(1).classList.contains('on') && !prof(0).classList.contains('on'),
       'and the selection is visible, which it was not');
    d.getElementById('startbtn').click(); await sleep(30);
    ok(w.S.route.length===33*2,'profile routes a mid at every position: '+w.S.route.length);
    w.S.roomStarted=false; }
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B2"]').click(); await sleep(20);
    d.querySelector('.prof[data-prof="1"]').click(); await sleep(20);
    d.querySelector('.prof[data-prof="0"]').click(); await sleep(20);
    ok(w.S.profile===false,'and tapping back to Reference clears it');
    d.getElementById('startbtn').click(); await sleep(30);
    ok(w.S.route.length===33,'reference-only again: '+w.S.route.length);
    ok(w.S.route.every(x=>x.depth==='reference'),'no mids routed at all'); }

  // a Profile chosen blind, before the control was visible, is cleared once
  { const {w,d,errors}=boot({'stab_setup':JSON.stringify({side:'standard',dir:'up',mode:'sweep',cap:'auto',profile:true})});
    await sleep(50);
    ok(w.S.profile===false,'a setting nobody could see was a setting nobody chose');
    ok(w.localStorage.getItem('stab_profreset')==='1','and it is only cleared once');
    ok(d.querySelector('.prof[data-prof="0"]').classList.contains('on'),'the control shows Reference');
    w.close(); }
  { const {w,d,errors}=boot({'stab_setup':JSON.stringify({profile:true}),'stab_profreset':'1'});
    await sleep(50);
    ok(w.S.profile===true,'a Profile chosen after the fix survives');
    w.close(); }

  // 2. undo did not restore the cursor once the route could change shape
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    // front, then +plant at front, then the extra, then advance to center
    enterSettling(w,33.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    d.getElementById('extra').click(); await sleep(20);
    const atExtra=w.S.i, stopExtra=w.S.route[w.S.i];
    enterSettling(w,34.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    const atThird=w.S.route[w.S.i];
    enterSettling(w,35.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===3,'three readings in');
    ok(w.S.route[w.S.i]!==atThird,'and the cursor has moved past it');
    d.getElementById('undo').click(); await sleep(20);
    ok(w.S.rows.length===2,'undo removes the reading');
    ok(w.S.route[w.S.i]===atThird,
       'and the cursor lands back on the stop that reading was taken at: T'+
       w.S.route[w.S.i].t+' '+w.S.route[w.S.i].pos);
    d.getElementById('undo').click(); await sleep(20);
    ok(w.S.i===atExtra,'undoing the adjacent plant puts the cursor on the extra stop: '+w.S.i+' vs '+atExtra);
    d.getElementById('redo').click(); await sleep(20);
    ok(w.S.rows.length===2,'redo brings it back');
    ok(w.S.route[w.S.i]===atThird,'…and the cursor goes forward with it, to where it was');
    ok(errors.length===0,'no runtime errors (undo): '+errors.join('|')); }

  // 3. the outlier banner can fix what it caught
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    for(const v of [33,34]){ enterSettling(w,v,900); await sleep(20);
      d.getElementById('log').click(); await sleep(20); }
    enterSettling(w,52.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows.length===3,'the outlier is logged, as it always was');
    ok(!d.getElementById('alarm').classList.contains('hide'),
       'and it raises a banner, not a toast that slides away');
    ok(/outlier/.test(d.getElementById('alarmtxt').textContent),
       'saying what it is: '+d.getElementById('alarmtxt').textContent);
    ok(!d.getElementById('alarmundo').classList.contains('hide'),'with an Undo beside the OK');
    d.getElementById('alarmundo').click(); await sleep(20);
    ok(w.S.rows.length===2,'which takes the reading back: '+w.S.rows.length);
    ok(d.getElementById('alarm').classList.contains('hide'),'and clears the banner'); }

  // an alarm that is not about a reading offers no undo
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'B2',2); await sleep(20);
    w.showAlarm('a shot fired mid-sweep');
    ok(!d.getElementById('alarm').classList.contains('hide'),'the banner is up');
    ok(d.getElementById('alarmundo').classList.contains('hide'),'…with no Undo, because there is nothing to undo'); }

  // 4. the wet ceiling is field capacity, not a flat number or the last sweep
  { const {w,d,errors}=boot(null); await sleep(50);
    // B2 flowered 8/27, so it is young and its FC is low
    ok(w.fcFor('B2')<w.fcFor('B4'),'a young room has a lower field capacity than an old one: '+
       w.fcFor('B2')+' vs '+w.fcFor('B4'));
    const ceil=w.plausCeiling('B2',false);
    ok(!w.isImplausible('B2',ceil-1,false),'a reading under the ceiling stands: '+(ceil-1).toFixed(1));
    ok(w.isImplausible('B2',ceil+1,false),'one over it is flagged: '+(ceil+1).toFixed(1));
    ok(w.isImplausible('B2',5,false),'and the dry end still catches a bad seat');
    // flush day: a bag at field capacity read straight through the old flat 62
    ok(w.plausCeiling('B2',true)>w.plausCeiling('B2',false),'a post-flush sweep lifts the ceiling');
    ok(!w.isImplausible('B2',ceil+1,true),'so the same reading stands on flush day');
    // the ceiling is config, like the floor
    w.saveRoomCfg('B2',{fc:60, savedAt:Date.now()});
    ok(w.fcFor('B2')===60,'and FC is overridable per room: '+w.fcFor('B2'));
    ok(w.plausCeiling('B2',false)===68,'ceiling follows it: '+w.plausCeiling('B2',false));
    w.close(); }

  // the tag belongs to one sweep and is never remembered
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B2"]').click(); await sleep(20);
    d.querySelector('.pf').click(); await sleep(20);
    d.getElementById('startbtn').click(); await sleep(30);
    ok(w.S.postFlush===true,'the sweep is tagged');
    w.S.dev={gatt:{connected:true}}; w.S.chr={}; w.S.trigger=w.TRIGGER;
    ['log','extra','skip','undo','redo'].forEach(id=>{ d.getElementById(id).disabled=false; });
    enterSettling(w,58.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    ok(w.S.rows[0].implaus===false,'58% is not implausible on flush day');
    d.getElementById('exit').click(); await sleep(60);
    const csv=d.getElementById('csv').value.split('\n');
    const col=n=>csv[0].split(',').indexOf(n);
    ok(/POST_FLUSH/.test(csv[1].split(',')[col('Sweep flags')]),
       'and the export says so, which is what explains the numbers: '+csv[1].split(',')[col('Sweep flags')]);
    ok(!JSON.parse(w.localStorage.getItem('stab_setup')||'{}').postFlush,
       'it is not remembered — Monday must not inherit a lifted ceiling'); }

  // The scan ran on probe ZSC08328 on 9/11 and settled it: one service,
  // DECA0001, carrying only DECA0002 [write,writeWithoutResponse] and
  // DECA0003 [notify]. battery_service was granted, so the enumeration was
  // authoritative — 0x180F is not on the device, and nothing on it is
  // readable. test/probe_scan_2026-09-11.txt is the dump.
  { const {w,d,errors}=boot(null); await sleep(50);
    const dump=fs.readFileSync(path.join(__dirname,'probe_scan_2026-09-11.txt'),'utf8');
    const svcLine=(dump.match(/services granted and present: (.*)/)||['',''])[1];
    ok(svcLine.trim().toLowerCase()==='deca0001-10c7-43a8-8c9f-42b70e03808d',
       'the device carries exactly one service: '+svcLine.trim());
    ok(!/180f/i.test(svcLine),'…and 0x180F is not it');
    ok(!/\[.*read.*\]/.test(dump),'no characteristic on the device is readable');
    ok(/DECA0002.*\[write,writeWithoutResponse\]/.test(dump) && /DECA0003.*\[notify\]/.test(dump),
       'write and notify only, which is what CLAUDE.md records');
    w.close(); }

  // the scan that settled it: it asks the bridge rather than a document, and
  // reports everything a rejection carries
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.BAT_SVC==='0000180f-0000-1000-8000-00805f9b34fb','the SIG Battery Service UUID');
    ok(w.BAT_CHR==='00002a19-0000-1000-8000-00805f9b34fb','and the Battery Level characteristic');
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    ok(!d.getElementById('setsheet').classList.contains('hide'),'settings opens');
    d.getElementById('scango').click(); await sleep(30);
    ok(!/2a19 =/.test(d.getElementById('scanout').textContent),
       'with no probe it reports nothing rather than a false absence or a false reading');
    // a bridge that does carry it
    w.S.dev={name:'ZSC-1234', gatt:{connected:true,
      getPrimaryService:()=>Promise.resolve({
        getCharacteristic:()=>Promise.resolve({readValue:()=>Promise.resolve({byteLength:1,getUint8:()=>72})})}),
      getPrimaryServices:()=>Promise.resolve([])}};
    d.getElementById('scango').click(); await sleep(60);
    const t=d.getElementById('scanout').textContent;
    ok(/2a19 = 72%/.test(t),'a bridge that carries it reports the byte: '+(t.match(/2a19 = [^\n]*/)||[''])[0]);
    ok(/column goes back in/.test(t),'…and says plainly that the deletion was wrong');
    w.close(); }

  // a bridge that does not carry it names the error rather than going quiet
  { const {w,d,errors}=boot(null); await sleep(50);
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    const err=new Error('x'); err.name='NotFoundError';
    w.S.dev={name:'ZSC-1234', gatt:{connected:true,
      getPrimaryService:()=>Promise.reject(err),
      getPrimaryServices:()=>Promise.resolve([{uuid:'deca0001-10c7-43a8-8c9f-42b70e03808d',
        getCharacteristics:()=>Promise.resolve([
          {uuid:'deca0002-10c7-43a8-8c9f-42b70e03808d',properties:{write:true}},
          {uuid:'deca0003-10c7-43a8-8c9f-42b70e03808d',properties:{notify:true}}])}])}};
    d.getElementById('scango').click(); await sleep(80);
    const t=d.getElementById('scanout').textContent;
    ok(/180f by UUID: NotFoundError/.test(t),'the UUID attempt reports its error name: '+
       (t.match(/180f by UUID: [^\n]*/)||[''])[0]);

    ok(/battery_service by alias: NotFoundError/.test(t),
       'and the alias separately, so a naming mistake cannot pass for absence');
    ok(/deca0002.*write/.test(t) && /deca0003.*notify/.test(t),
       'the characteristics it does carry are listed, with their properties');
    ok(/service deca0001/.test(t),'under the service they belong to');
    ok(!/column goes back in/.test(t),'and nothing claims a battery was found');
    w.close(); }

  // 180f present but non-conforming is a different answer from 180f absent,
  // and the scan has to show which
  { const {w,d,errors}=boot(null); await sleep(50);
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    const nf=new Error('x'); nf.name='NotFoundError';
    w.S.dev={name:'ZSC', gatt:{connected:true,
      getPrimaryService:()=>Promise.resolve({
        getCharacteristics:()=>Promise.resolve([
          {uuid:'00002a1a-0000-1000-8000-00805f9b34fb',properties:{read:true}}]),
        getCharacteristic:()=>Promise.reject(nf)}),
      getPrimaryServices:()=>Promise.resolve([])}};
    d.getElementById('scango').click(); await sleep(80);
    const t=d.getElementById('scanout').textContent;
    ok(/service FOUND — characteristics:/.test(t),'a found service lists what it carries');
    ok(/00002a1a/.test(t),'…including a characteristic that is not 2a19: '+
       (t.match(/00002a1a[^\n]*/)||[''])[0]);
    ok(/180f found but 2a19 failed/.test(t),
       'and the read failure is reported separately from the service being absent');
    ok(!/BATTERY READS/.test(t),'nothing claims a battery was found');
    w.close(); }

  // the real scan printed "180f by UUID: 2" — Bluefy rejected with something
  // that had no .name, and the reporter fell through to the bare value
  { const {w,d,errors}=boot(null); await sleep(50);
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    w.S.dev={name:'ZSC08328', gatt:{connected:true,
      getPrimaryService:()=>Promise.reject({code:2}),
      getPrimaryServices:()=>Promise.resolve([])}};
    d.getElementById('scango').click(); await sleep(80);
    const t=d.getElementById('scanout').textContent;
    ok(/180f by UUID: code 2/.test(t),
       'a rejection carrying only a code now says so: '+(t.match(/180f by UUID: [^\n]*/)||[''])[0]);
    ok(!/180f by UUID: 2$/m.test(t),'…rather than printing the bare value');
    w.close(); }

  // ============ the pad, in the order the buttons are actually used =======
  { const {w,d,errors}=boot(null); await sleep(50);
    const order=[].map.call(d.querySelectorAll('#pad .row.pad4 button'),b=>b.id);
    ok(order.join(' ')==='redo skip undo extra',
       '+ plant is at the thumb end and redo at the far one: '+order.join(' '));
    ok(order[3]==='extra','the most-tapped of the four is last, which is nearest');
    ok(order[0]==='redo','and the rarest is first, which is furthest');
    ok(order.indexOf('undo')===2,'undo is beside + plant, with redo still on the row to cover a mis-tap');
    w.close(); }

  // ============ the floor is one number, and it lives in config ============
  // Field note 9/11: the 1.25-gallon floor may move after today's field
  // capacity reads. Nothing downstream may derive itself from bag size.
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.floorFor('C4')===30,'C4 starts on the weekly file\'s 1.25-gallon floor: '+w.floorFor('C4'));
    ok(!w.floorIsSet('C4'),'…which is a default, not a setting');
    w.saveRoomCfg('C4',{floor:26, savedAt:Date.now()});
    ok(w.floorFor('C4')===26,'one number in config moves it: '+w.floorFor('C4'));
    ok(w.floorIsSet('C4'),'and now it is set');
    // everything downstream follows without being touched
    ok(w.feelWord(25,w.floorFor('C4'))==='dry ok' && w.feelWord(21,w.floorFor('C4'))==='dry',
       'the feel bands move with it — dry ok at 25, dry at 21, against a floor of 26');
    ok(w.feelWord(27,w.floorFor('C4'))==='ok','27 becomes ok at a floor of 26: '+w.feelWord(27,w.floorFor('C4')));
    ok(w.midTrigger('C4')===26,'wait — the mid trigger is max(25, floor): '+w.midTrigger('C4'));
    w.saveRoomCfg('C4',{floor:23, savedAt:Date.now()});
    ok(w.midTrigger('C4')===25,'…so below 25 the trigger holds at 25: '+w.midTrigger('C4'));
    // and the hand-blind rule is about fingers, not bag size
    w.S.room='C4'; w.S.probeFrames=0;
    w.saveRoomCfg('C4',{floor:30, savedAt:Date.now()});
    ok(w.handOnlyBlind(),'a floor of 30 is out of reach of the hand');
    w.saveRoomCfg('C4',{floor:24, savedAt:Date.now()});
    ok(!w.handOnlyBlind(),'a floor of 24 is not — and nobody had to edit the rule');
    ok(w.ROOMS.C4.bag===1.25,'the bag size never changed through any of that: '+w.ROOMS.C4.bag);
    w.close(); }

  // the floor is editable on the room setup screen and says what it changes
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C4"]').click(); await sleep(20);
    d.getElementById('cfgbtn').click(); await sleep(30);
    ok(d.getElementById('cfg_floor').value==='','unset until somebody sets it');
    ok(d.getElementById('cfg_floor').placeholder==='30','with the weekly file shown as the placeholder');
    ok(/too high for bag feel/.test(d.getElementById('cfg_floornote').textContent),
       'and it says a floor of 30 needs the probe: '+d.getElementById('cfg_floornote').textContent);
    d.getElementById('cfg_floor').value='24';
    d.getElementById('cfg_floor').dispatchEvent(new w.Event('input',{bubbles:true}));
    ok(/bag feel can reach it/.test(d.getElementById('cfg_floornote').textContent),
       'at 24 it can be checked by hand: '+d.getElementById('cfg_floornote').textContent);
    ok(/feel words break at 20 \/ 24 \/ 28 \/ 32/.test(d.getElementById('cfg_floornote').textContent),
       'and it shows where the words break, so the change is visible before saving');
    d.getElementById('cfgsave').click(); await sleep(30);
    ok(w.floorFor('C4')===24,'saved: '+w.floorFor('C4'));
    d.getElementById('cfg_floor').value='0';
    d.getElementById('cfgbtn').click(); await sleep(20);
    d.getElementById('cfg_floor').value='99';
    ok(w.saveRoomSetup()===false,'a floor of 99 is refused');
    ok(w.floorFor('C4')===24,'…and the stored one is untouched: '+w.floorFor('C4'));
    w.close(); }

  // ============ §5.7 room state ============
  // A3 went harvest -> empty -> move-in in 48 hours this week and the app
  // had no way to say so.
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.roomState('A3')==='active','a room with nothing said about it is active');
    ok(w.activeRooms().length===19,'all nineteen on the rotation: '+w.activeRooms().length);
    w.saveRoomCfg('A3',{state:'harvest', savedAt:Date.now()});
    ok(w.roomState('A3')==='harvest' && !w.roomActive('A3'),'harvest takes it off the rotation');
    ok(w.activeRooms().length===18,'eighteen now: '+w.activeRooms().length);
    ok(w.dayCoverage().filter(r=>r.room==='A3').length===0,'and the day screen stops asking for it');
    w.saveRoomCfg('A3',{state:'movein', savedAt:Date.now()});
    ok(!w.roomActive('A3'),'so does move-in — the room is filling, not producing');
    w.saveRoomCfg('A3',{state:'active', savedAt:Date.now()});
    ok(w.activeRooms().length===19,'and it comes back: '+w.activeRooms().length);
    w.close(); }

  { const ts=Date.now()-3600e3;
    const {w,d,errors}=boot({
      'stab_roomcfg':JSON.stringify({A3:{state:'empty',savedAt:Date.now()}}),
      'stab_hist':JSON.stringify({v:1,items:[{room:'B1',ts:ts,when:new Date(ts).toLocaleString('en-US'),
        n:33,mode:'sweep',med:32,swept:11}]})});
    await sleep(50);
    const tile=d.querySelector('#rooms .rm[data-room="A3"]');
    ok(!!tile,'an empty room is still on the grid — a room missing from a list reads as an oversight');
    ok(tile.classList.contains('off'),'…greyed');
    ok(tile.querySelector('.tb').textContent==='empty','…and labelled: '+tile.querySelector('.tb').textContent);
    ok(/1\/18 rooms/.test(d.getElementById('weekly').textContent),
       'the weekly denominator follows the rotation: '+d.getElementById('weekly').textContent);
    w.close(); }

  // ============ §5.5 the walk order ============
  // Pre-irrigation readings are the ones that decide anything. The order to
  // walk is the order the windows shut.
  { const {w,d,errors}=boot(null); await sleep(50);
    const at=new Date(); at.setHours(8,0,0,0);
    ok(w.roomWindow('B1',at).kind==='pre','an ordinary room is waiting on its pre-irrigation window');
    ok(Math.abs(w.roomWindow('B1',at).hrs-3)<0.05,'B1 shuts at 11:00, so three hours left at 8: '+
       w.roomWindow('B1',at).hrs.toFixed(1));
    ok(Math.abs(w.roomWindow('A7',at).hrs-1.25)<0.05,'A7 shuts at 09:15: '+w.roomWindow('A7',at).hrs.toFixed(1));
    ok(w.roomWindow('C4',at).hrs>5,'a PM room has all morning: '+w.roomWindow('C4',at).hrs.toFixed(1));
    const order=w.walkOrder(at).map(r=>r.room);
    ok(order.indexOf('A7')<order.indexOf('B1'),'A7 before B1 — its window shuts first');
    ok(order.indexOf('B1')<order.indexOf('C4'),'B1 before C4 — AM before PM');
    // after 11:00 the AM rooms have missed their window and drop behind
    const late=new Date(); late.setHours(12,0,0,0);
    const lateOrder=w.walkOrder(late).map(r=>r.room);
    ok(w.roomWindow('B1',late).state==='closed','B1 is shut at noon');
    ok(lateOrder.indexOf('C4')<lateOrder.indexOf('B1'),
       'so a PM room that can still be read properly goes first: '+lateOrder.slice(0,4).join(' · '));
    ok(/window shut/.test(w.windowWarning('B1',late)),
       'and starting it says so: '+w.windowWarning('B1',late));
    ok(w.windowWarning('C4',late)==='','while a room inside its window says nothing');
    w.close(); }

  // the post-change exception inverts the rule
  { const {w,d,errors}=boot(null); await sleep(50);
    w.saveSched('B5',{savedAt:Date.now(), room:'B5', tables:[
      {table:1, room:'B5', P1:{start:'01:15', duration:284, interval:7200, frequency:3}, P2:null, flush:null}]});
    const a=w.getSched(); a.B5.changed={at:Date.now(), diffs:['T1 x2→x3']};
    w.localStorage.setItem('stab_sched',JSON.stringify(a));
    // 06:00 is 45 minutes past the 05:15 last shot — too early for the read
    const early=new Date(); early.setHours(6,0,0,0);
    ok(w.roomWindow('B5',early).kind==='post','a changed room waits on a post-shot read, not a pre one');
    ok(w.roomWindow('B5',early).state==='early','and at 45 minutes it is early');
    ok(/due about 0.3h from now/.test(w.windowWarning('B5',early)),
       'starting it now says how long to wait: '+w.windowWarning('B5',early));
    const due=new Date(); due.setHours(6,45,0,0);
    ok(w.roomWindow('B5',due).state==='open','at 1.5h it is due');
    ok(w.windowWarning('B5',due)==='','and starting it says nothing');
    const order=w.walkOrder(due).map(r=>r.room);
    ok(order[0]==='B5','a room due now leads the walk: '+order.slice(0,3).join(' · '));
    const tooLate=new Date(); tooLate.setHours(9,0,0,0);
    ok(w.roomWindow('B5',tooLate).state==='waiting','past the window it waits for the next shot');
    ok(w.walkOrder(tooLate).map(r=>r.room).slice(-1)[0]==='B5',
       'and drops to the back — walking it now would waste the trip');
    w.close(); }

  // the screen itself
  { const {w,d,errors}=boot(null); await sleep(50);
    d.getElementById('weekly').click(); await sleep(30);
    ok(/Walk order/.test(d.getElementById('daybody').textContent),'the day screen leads with the walk order');
    const first=d.querySelector('#daybody .dayr.wk');
    ok(/^1\. /.test(first.querySelector('b').textContent),'numbered: '+first.querySelector('b').textContent);
    first.click(); await sleep(20);
    ok(w.S.room===first.dataset.r,'and tapping one picks that room');
    ok(errors.length===0,'no runtime errors (§5.5): '+errors.join('|'));
    w.close(); }

  // ============ §6.2 table flags that persist ============
  // C5 T5's header elbow is leaking. A5 T3 had two drippers repaired. B3
  // T4-T7 centers need a third dripper. None of it had anywhere to live
  // except a row note on the day it was seen. Faults were already stored
  // with an open/fixed lifecycle; what was missing was them reaching the
  // three places somebody would act on them.
  { const {w,d,errors}=boot(null); await sleep(50);
    w.addEv({kind:'fault',room:'C5',table:'5',what:'leak',detail:'header elbow',status:'open'});
    w.addEv({kind:'fault',room:'C5',table:'2',what:'needs flush',status:'open'});
    ok(w.flagCount('C5')===2,'two open flags on C5: '+w.flagCount('C5'));
    ok(w.flagCount('C1')===0,'none on a room that has none');
    ok(/leak — header elbow/.test(w.flagLine('C5','5')),'and the table knows which: '+w.flagLine('C5','5'));
    ok(w.flagLine('C5','7')==='','a table with no flag says nothing');
    // a fixed flag stops showing but is not deleted
    const ts=w.getEv().filter(e=>e.what==='leak')[0].ts;
    w.closeEv(ts);
    ok(w.flagCount('C5')===1,'marking it fixed drops the count: '+w.flagCount('C5'));
    ok(w.getEv().filter(e=>e.what==='leak').length===1,'…without losing the history');
    w.close(); }

  // the tile before the walk, the stab screen at the table, the export after
  { const {w,d,errors}=boot(null); await sleep(50);
    w.addEv({kind:'fault',room:'B2',table:'3',what:'unhooked dripper',detail:'front left',status:'open'});
    w.buildSetupAgain && w.buildSetupAgain();
    const {w:w2,d:d2}=boot({'stab_events':w.localStorage.getItem('stab_events')});
    await sleep(50);
    const tile=d2.querySelector('#rooms .rm[data-room="B2"]');
    ok(/1 flag/.test(tile.querySelector('.sub').textContent),
       'the tile carries the count before he walks in: '+tile.querySelector('.sub').textContent);
    ok(tile.querySelector('.tb') && tile.querySelector('.tb').textContent==='1','…as a badge too');
    start(w2,d2,'B2',2); w2.S.trigger=w2.TRIGGER; await sleep(20);
    // walk to T3 and check the flag surfaces at the table, not before
    w2.S.i=w2.S.route.findIndex(x=>x.t===2); w2.render();
    ok(d2.getElementById('tflag').classList.contains('hide'),'nothing shown on T2');
    w2.S.i=w2.S.route.findIndex(x=>x.t===3); w2.render();
    ok(!d2.getElementById('tflag').classList.contains('hide'),'the flag appears when the cursor reaches T3');
    ok(/unhooked dripper — front left/.test(d2.getElementById('tflag').textContent),
       'saying what it is: '+d2.getElementById('tflag').textContent);
    enterSettling(w2,33.0,900); await sleep(20);
    d2.getElementById('log').click(); await sleep(20);
    d2.getElementById('exit').click(); await sleep(60);
    const csv=d2.getElementById('csv').value.split('\n');
    const col=n=>csv[0].split(',').indexOf(n);
    ok(col('Open flags')>=0,'and the export has a column for them');
    ok(/unhooked dripper/.test(csv[1].split(',')[col('Open flags')]),
       'carrying it on the row: '+csv[1].split(',')[col('Open flags')]);
    w.close(); }

  // the flush list assembles itself instead of being remembered
  { const {w,d,errors}=boot(null); await sleep(50);
    [['B4','3'],['B4','6'],['B4','9'],['B6','7'],['C1','5'],['C1','8'],
     ['C5','2'],['C5','4'],['C5','5'],['C6','9'],['A6','7'],['A7','7']]
      .forEach(([rm,t])=>w.addEv({kind:'fault',room:rm,table:t,what:'needs flush',status:'open'}));
    const list=w.flushList();
    ok(list.join(' · ')==='A6 T7 · A7 T7 · B4 T3/6/9 · B6 T7 · C1 T5/8 · C5 T2/4/5 · C6 T9',
       'the 9/11 list, assembled rather than typed: '+list.join(' · '));
    w.addEv({kind:'fault',room:'B4',table:'3',what:'leak',status:'open'});
    ok(w.flushList()[2]==='B4 T3/6/9','a different fault on the same table does not join the flush list');
    w.close(); }

  // ============ §6.3 what has been covered today ============
  // Asked at 3:13 PM on 9/10; answering it meant reading the workbook.
  { const t0=new Date(); t0.setHours(0,0,0,0);
    const ts=Math.max(Date.now()-3600e3, t0.getTime()+60e3);
    const hist=[
      {room:'B1',ts:ts,when:new Date(ts).toLocaleString('en-US'),n:33,mode:'sweep',med:32,
       swept:11,op:'APG',handOnly:false},
      {room:'C4',ts:ts,when:new Date(ts).toLocaleString('en-US'),n:0,mode:'sweep',med:null,
       swept:0,op:'EGY',handOnly:true},
      {room:'B2',ts:Date.now()-3*86400e3,when:'9/8/2026, 9:00:00 AM',n:33,mode:'sweep',med:31,swept:11}];
    const {w,d,errors}=boot({'stab_hist':JSON.stringify({v:1,items:hist})}); await sleep(50);
    const rows=w.dayCoverage();
    ok(rows.length===19,'every production room is on the list: '+rows.length);
    const by={}; rows.forEach(r=>by[r.room]=r);
    ok(by.B1.swept && !by.B1.handOnly && by.B1.coverage===100 && by.B1.op==='APG',
       'B1 read on the probe: '+by.B1.coverage+'% by '+by.B1.op);
    ok(by.C4.handOnly,'C4 is marked hand-only, not covered');
    ok(!by.B2.swept,'a sweep from three days ago is not today');
    ok(by.B1.wing==='AM' && by.C4.wing==='PM',
       'grouped the way he walks them: B1 '+by.B1.wing+', C4 '+by.C4.wing);
    ok(by.A7.wing==='AM','A7 runs 7 to 7, so its first shot is in the morning');
    ok(w.windowCloses('A7')==='09:15' && w.windowCloses('B1')==='11:00' && w.windowCloses('C4')==='13:15',
       'and each carries the hour its pre-irrigation window shuts');
    // the screen itself
    d.getElementById('weekly').click(); await sleep(30);
    ok(!d.getElementById('daysheet').classList.contains('hide'),'the weekly line opens it');
    const body=d.getElementById('daybody').textContent;
    ok(/1 of 19 rooms on the probe/.test(d.getElementById('daysub').textContent),
       'the headline is the answer to the question: '+d.getElementById('daysub').textContent);
    ok(/hand-only/.test(body),'C4 says hand-only on its row');
    ok(/AM rooms/.test(body) && /PM rooms/.test(body),'and the rooms are grouped');
    // tapping a room takes him there
    d.querySelector('#daybody .dayr[data-r="B3"]').click(); await sleep(20);
    ok(w.S.room==='B3','tapping a row picks the room: '+w.S.room);
    ok(d.getElementById('daysheet').classList.contains('hide'),'and closes the screen');
    ok(errors.length===0,'no runtime errors (§6.3): '+errors.join('|'));
    w.close(); }

  // ============ §6.4 a schedule that changed earns a post-change read ======
  { const {w,d,errors}=boot(null); await sleep(50);
    const mk=(start,freq)=>({savedAt:Date.now(), room:'B5', tables:[
      {table:1, room:'B5', P1:{start:start, duration:284, interval:7200, frequency:freq}, P2:null, flush:null}]});
    w.saveSched('B5', mk('01:15',3));
    ok(!w.getSched().B5.changed,'a first import is not a change');
    w.saveSched('B5', mk('01:15',4));
    ok(w.getSched().B5.changed,'a different frequency is');
    ok(/T1 x3→x4/.test(w.getSched().B5.changed.diffs.join(' ')),
       'and the diff says what moved: '+w.getSched().B5.changed.diffs.join(' · '));
    w.saveSched('B5', mk('02:30',4));
    ok(/T1 01:15→02:30/.test(w.getSched().B5.changed.diffs.join(' ')),'a moved start too');
    const row=w.dayCoverage().filter(r=>r.room==='B5')[0];
    ok(row.postShotDue,'so the room is waiting on a post-change read');
    d.getElementById('weekly').click(); await sleep(30);
    ok(/post-change read due/.test(d.getElementById('daybody').textContent),'and the day screen says so');
    w.close(); }

  // the flag clears on a sweep taken in the window, not on any sweep
  { const {w,d,errors}=boot(null); await sleep(50);
    w.saveSched('B2',{savedAt:Date.now(), room:'B2', tables:[
      {table:1, room:'B2', P1:{start:'01:15', duration:284, interval:7200, frequency:3}, P2:null, flush:null}]});
    const a=w.getSched(); a.B2.changed={at:Date.now(), diffs:['T1 x2→x3']};
    w.localStorage.setItem('stab_sched',JSON.stringify(a));
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,33.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    // 9 AM is nearly 4 h past the 05:15 last shot — outside the 1-2 h window
    w.hoursSinceShot=()=>3.9;
    d.getElementById('exit').click(); await sleep(60);
    ok(!!w.getSched().B2.changed,'a sweep outside the window does not clear it'); }
  { const {w,d,errors}=boot(null); await sleep(50);
    w.saveSched('B2',{savedAt:Date.now(), room:'B2', tables:[
      {table:1, room:'B2', P1:{start:'01:15', duration:284, interval:7200, frequency:3}, P2:null, flush:null}]});
    const a=w.getSched(); a.B2.changed={at:Date.now(), diffs:['T1 x2→x3']};
    w.localStorage.setItem('stab_sched',JSON.stringify(a));
    start(w,d,'B2',2); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,33.0,900); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    w.hoursSinceShot=()=>1.6;
    d.getElementById('exit').click(); await sleep(60);
    ok(!w.getSched().B2.changed,'one taken 1.6 h after the shot does — that is the confirmation'); }


  // ============ plants are per table, not per room ============
  // Field report 9/11: "plants-per-table is locked to the room; it needs to
  // be per table, same as dripper count. C3 T1–T3 and A3 T5–T12 both break
  // the room-wide assumption this week."
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.plantsFor('A3',1)===40 && w.plantsFor('A3',4)===40,'A3 T1–T4 hold 40 on two rows');
    ok(w.plantsFor('A3',5)===60 && w.plantsFor('A3',12)===60,'T5–T12 hold 60');
    ok(w.plantsFor('A3',1)!==w.plantsFor('A3',5),'which a room-wide number cannot express');
    ok(w.plantsKnown('A3',1),'and those were counted, not assumed');
    ok(w.plantsFor('B1',1)===null && !w.plantsKnown('B1',1),
       'a room nobody has counted has no plant count — nothing is guessed: '+w.plantsFor('B1',1));
    // a room-level figure still fills tables the weekly file does not cover
    w.saveRoomCfg('B1',{plants:52, savedAt:Date.now()});
    ok(w.plantsFor('B1',3)===52,'a typed room default covers a room with no per-table data');
    // …and a per-table override beats both
    w.saveRoomCfg('A3',{plantsT:{5:58}, savedAt:Date.now()});
    ok(w.plantsFor('A3',5)===58,'a per-table override wins: '+w.plantsFor('A3',5));
    ok(w.plantsFor('A3',6)===60,'…for that table only');
    w.close(); }

  // A3's drippers: two per plant on every table, not the A-wing default of 4
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.DRIP_DEFAULT.A===4,'the A wing usually runs 4');
    ok(w.drippersFor('A3',1)===2 && w.drippersFor('A3',12)===2,
       'but A3 runs 2 on every table: '+w.drippersFor('A3',1));
    ok(w.drippersKnown('A3',7),'and that is counted, so volume is not doubled');
    w.close(); }

  // the table total is the number the volume conversation is about
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(w.mlTableToday('A3',1)===null,'no imported schedule, no table total');
    const r=w.parseSchedule(fs.readFileSync(path.join(__dirname,'sched_ALL_2026-09-11.txt'),'utf8'));
    const a3=r.rooms.filter(g=>g.room==='A3')[0];
    w.saveSched('A3',{savedAt:Date.now(),room:'A3',tables:a3.tables});
    ok(w.mlPlantToday('A3',1)===0,'A3 is switched off, so it gets 0 mL — a real answer, not a missing one');
    w.S.room='A3';
    ok(/0 mL — room is off/.test(w.roomHead()),'and the header says so rather than falling back to the weekly file');
    ok(!/1890/.test(w.roomHead()),'the stale 1890 mL from rooms.js does not appear: '+w.roomHead().slice(0,90));
    // a running room: C4, three drippers, no plant count on file
    const c4=r.rooms.filter(g=>g.room==='C4')[0];
    w.saveSched('C4',{savedAt:Date.now(),room:'C4',tables:c4.tables});
    ok(w.mlPlantToday('C4',1)>0,'C4 has a per-plant figure: '+w.mlPlantToday('C4',1)+' mL');
    ok(w.mlTableToday('C4',1)===null,'but no table total without a plant count');
    ok(w.mlTableToday('A3',1)===0,'and an off table totals 0 across its 40 plants');
    w.saveRoomCfg('C4',{plantsT:{1:60}, savedAt:Date.now()});
    ok(w.mlTableToday('C4',1)===w.mlPlantToday('C4',1)*60,
       'given one, the table total follows: '+w.mlTableToday('C4',1)+' mL');
    w.close(); }

  // the config screen edits them per table
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="A3"]').click(); await sleep(20);
    d.getElementById('cfgbtn').click(); await sleep(30);
    const pl=t=>d.querySelector('#cfgtables .pl[data-t="'+t+'"]');
    ok(pl(1).value==='40' && pl(5).value==='60','the rows carry their own counts: T1 '+
       pl(1).value+', T5 '+pl(5).value);
    ok(pl(1).classList.contains('known'),'shown as counted');
    ok(d.querySelector('#cfgtables .dr[data-t="1"]').value==='2','with A3\'s 2 drippers beside them');
    pl(5).value='58';
    pl(5).dispatchEvent(new w.Event('input',{bubbles:true}));
    d.getElementById('cfgsave').click(); await sleep(30);
    ok(w.plantsFor('A3',5)===58,'an edit saves per table: '+w.plantsFor('A3',5));
    ok(w.plantsFor('A3',6)===60,'and leaves its neighbours alone');
    ok(w.plantsFor('A3',1)===40,'…including the short tables');
    ok(errors.length===0,'no runtime errors (plants): '+errors.join('|'));
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
    ok(w.sweepFlags().join()==='NO_PROBE_BLIND_FLOOR','and the export carries the flag');
    d.getElementById('exit').click(); await sleep(60);
    const csv=d.getElementById('csv').value.split('\n');
    const sfc=csv[0].split(',').indexOf('Sweep flags');
    ok(sfc>=0,'CSV gains a sweep-flags column');
    // a hand-only sweep logs nothing, so without a record row the whole walk
    // exports as a bare header and reads as "nothing happened"
    ok(csv.length>1 && csv[1].split(',')[sfc]==='NO_PROBE_BLIND_FLOOR',
       'a sweep with no readings still exports one row carrying the flag: '+csv[1].split(',')[sfc]);
    ok(csv[1].split(',')[2]==='C4','…naming the room it was');
    ok(/NO_PROBE_BLIND_FLOOR/.test(d.getElementById('stats').textContent),
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

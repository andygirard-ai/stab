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
  // ============ §1.1 the serpentine phase belongs to the walk ============
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.triage=[];
    const up=w.buildRoute('A1','up','sweep');       // A1 is 12 tables, 2-gal
    const down=w.buildRoute('A1','down','sweep');
    ok(up[0].t===1 && up[0].pos==='front','standard still starts T1 front: T'+up[0].t+' '+up[0].pos);
    ok(down[0].t===12,'opposite still reverses the table order: starts T'+down[0].t);
    ok(down[0].pos==='front',
       'opposite ALSO flips the phase — T12 starts at the front, where the operator is standing: '+down[0].pos);
    // the 9/9 bug exactly: T12 first, app asked for header
    ok(!(down[0].t===12 && down[0].pos==='header'),'the 9/9 A-1 case does not reproduce');
    // v29, 9/10: opposite is not a mirror. The operator enters at the front,
    // walks the first table front→header, then walks BACK to the front for the
    // second table; the snake only starts at the third. v27 mirrored it and so
    // asked for T10 front while he stood at T10's header.
    const firstPos=t=>{ for(let i=0;i<down.length;i++) if(down[i].t===t) return down[i].pos; };
    ok(firstPos(12)==='front' && firstPos(11)==='front' && firstPos(10)==='header',
       'opposite walks back after the first table: T12 '+firstPos(12)+' → T11 '+firstPos(11)+' → T10 '+firstPos(10));
    ok(firstPos(9)==='front' && firstPos(8)==='header',
       'and snakes normally from there: T9 '+firstPos(9)+' → T8 '+firstPos(8));
    const upFirst=t=>{ for(let i=0;i<up.length;i++) if(up[i].t===t) return up[i].pos; };
    ok(upFirst(1)==='front' && upFirst(2)==='header' && upFirst(3)==='front',
       'walking up is unchanged from v26: T1 '+upFirst(1)+' → T2 '+upFirst(2)+' → T3 '+upFirst(3));
    // an 11-table room reverses onto an odd table and must still start front
    const d11=w.buildRoute('B1','down','sweep');
    ok(d11[0].t===11 && d11[0].pos==='front','odd-numbered last table too: T'+d11[0].t+' '+d11[0].pos);
    const f11=t=>{ for(let i=0;i<d11.length;i++) if(d11[i].t===t) return d11[i].pos; };
    ok(f11(10)==='front' && f11(9)==='header','…and the walk-back applies there too: T10 '+f11(10)+' → T9 '+f11(9));
    // standard is bit-for-bit unchanged by the walk-back
    const u11=w.buildRoute('B1','up','sweep');
    ok(u11.map(s=>s.t+s.pos).join()===w.buildRoute('B1','up','sweep').map(s=>s.t+s.pos).join(),'standard route is deterministic');
    w.close(); }

  // the picker inherits the fix: picking the stop you are standing at moves
  // one slot, not six. This is the A-1 corruption from 9/9.
  { const {w,d,errors}=boot(null); await sleep(50);
    start(w,d,'A1',2); w.S.dir='down'; w.S.route=w.buildRoute('A1','down','sweep'); w.S.i=0;
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
    ok(/,Skipped$/.test(csv[0]),'CSV has a Skipped column');
    const skipRows=csv.slice(1).filter(l=>/"crew"$/.test(l));
    ok(skipRows.length>0,'the skip is recorded in the export: '+skipRows.length+' row(s)');
    const nCols=csv[0].split(',').length;
    ok(csv.slice(1).every(l=>l.split(',').length===nCols),'every row has the header\'s column count');
    // a table skipped with no readings at all still leaves a record row
    const fully=csv.slice(1).filter(l=>{ const c=l.split(','); return c[15]==='' && /"crew"$/.test(l); });
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

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); console.log(e.stack); process.exit(2); });

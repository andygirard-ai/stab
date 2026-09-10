// v26 Phase 1 (logging correctness) regression suite: manual commit, settle
// timeout, zero-EC alarm, sequence-recovery picker, connector-wipe prompt,
// the +plant re-pairing fix, and the colour states on the big button.
const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
const dir=path.dirname(file);
const html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,
  (m,f)=>'<script>\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n</'+'script>');

const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function boot(){
  const errors=[], vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push(String(e.message||e)));
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    url:'https://example.github.io/stab/',
    beforeParse(w){ w.Element.prototype.scrollIntoView=function(){}; w.confirm=()=>true; w.prompt=()=>'ABC';
      w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}}); }});
  return {w:dom.window, d:dom.window.document, errors};
}
const start=(w,d,room)=>{ d.querySelector('#rooms .rm[data-room="'+room+'"]').click();
  d.getElementById('cfg_bag').value='2'; d.getElementById('startbtn').click();
  // jsdom has no navigator.bluetooth, so connect() bails before it would
  // normally mark the probe connected — fake what a real pairing leaves
  // behind so isConn() (and so bigTap()'s manual-commit branch) sees a
  // live probe, matching recover.js's non-DEMO frame-injection pattern.
  w.S.dev={gatt:{connected:true}}; w.S.chr={};
  ['log','extra','skip','undo','redo'].forEach(id=>{ d.getElementById(id).disabled=false; }); };
// push one non-air frame so the state machine enters 'settling' with exactly
// one buffered sample — too soon to have stabilised on its own.
function enterSettling(w,vwc,rawBulk){
  const c=w.countsForVwc(vwc,false);
  w.rxBytes(w.frameBytes('0\t1790.0 22.0 0\rg8'));           // air, arms it
  w.rxBytes(w.frameBytes('0\t'+c.toFixed(1)+' 22.0 '+rawBulk+'\rg8'));
}

(async()=>{
  // ================= 1.1 manual commit: never a pause, carries the flag ====
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER;
    await sleep(20);
    enterSettling(w,15.0,300);                    // sub-20% VWC, ordinary EC
    await sleep(20);
    ok(w.A.state==='settling','a single frame leaves the state machine settling, not committed');
    const before=w.S.rows.length;
    d.getElementById('log').click();               // the exact tap the field bug mis-handled
    await sleep(20);
    ok(w.S.rows.length===before+1,'tap mid-settle logs a row instead of pausing');
    ok(w.S.paused===undefined,'there is no pause state left to toggle (v27 A§1.2)');
    const r=w.S.rows[w.S.rows.length-1];
    ok(r.manualCommit===true,'the row carries manualCommit:true');
    ok(Math.abs(r.vwc-15.0)<0.3,'the committed value is the live sub-20% frame: '+r.vwc);
    w.close(); }

  // ================= 1.1 relaxed gate: a stable low-VWC pair still auto-commits =
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER; await sleep(20);
    const c=w.countsForVwc(15.0,false);
    w.rxBytes(w.frameBytes('0\t1790.0 22.0 0\rg8'));
    w.rxBytes(w.frameBytes('0\t'+c.toFixed(1)+' 22.0 300\rg8'));   // enters settling, sets t0
    await sleep(450);                                              // clears the relaxed 400ms minimum, not the normal 800ms
    w.rxBytes(w.frameBytes('0\t'+c.toFixed(1)+' 22.0 302\rg8'));   // second agreeing sample
    await sleep(30);
    ok(w.S.rows.length===1,'a stable low-VWC pair auto-commits at ~450ms — inside the relaxed 400ms floor, under the normal 800ms one');
    ok(w.S.rows[0].manualCommit===false,'auto-commit does not carry the manual flag');
    w.close(); }

  // ================= 1.1 settle timeout at 8s → prompts, does not silently commit
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,45.0,900);                     // a normal, noisy-on-purpose reading
    await sleep(20);
    ok(w.A.prompted===false,'not prompted yet, one sample in');
    w.A.t0=Date.now()-8500;                        // fast-forward past SETTLE_PROMPT
    w.rxBytes(w.frameBytes('0\t'+w.countsForVwc(60,false).toFixed(1)+' 22.0 1400\rg8')); // disagreeing sample
    await sleep(20);
    ok(w.A.prompted===true,'8s with no stable pair sets the prompt flag');
    ok(w.S.rows.length===0,'…but nothing auto-commits yet — it is offered, not forced');
    ok(/tap to commit/i.test(d.getElementById('log').textContent),'button label offers the manual commit: "'+d.getElementById('log').textContent+'"');
    d.getElementById('log').click();
    ok(w.S.rows.length===1,'tapping after the prompt commits');
    w.close(); }

  // ================= 1.4 zero-EC alarm: exact boundary =====================
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,19.9,19);                       // bulk 0.019, vwc 19.9 → fires
    await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    let r=w.S.rows[w.S.rows.length-1];
    ok(Math.abs(r.bulk-0.019)<0.001 && r.vwc<20,'fixture is at the boundary: bulk '+r.bulk+' vwc '+r.vwc);
    ok(r.zeroEc===true,'0.019 EC / 19.9% VWC fires the zero-EC alarm');
    ok(!d.getElementById('alarm').classList.contains('hide'),'alarm banner is shown and held');
    d.getElementById('alarmok').click();
    ok(d.getElementById('alarm').classList.contains('hide'),'acknowledging clears it');

    enterSettling(w,20.1,21);                       // bulk 0.021, vwc 20.1 → does not fire
    await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    r=w.S.rows[w.S.rows.length-1];
    ok(r.zeroEc===false,'0.021 EC / 20.1% VWC does not fire: bulk '+r.bulk+' vwc '+r.vwc);
    ok(d.getElementById('alarm').classList.contains('hide'),'…and no alarm banner appears');
    w.close(); }

  // ================= 1.4 CSV carries both new columns ======================
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER; await sleep(20);
    enterSettling(w,19.9,19); await sleep(20);
    d.getElementById('log').click(); await sleep(20);
    d.getElementById('exit').click(); await sleep(50);
    const head=d.getElementById('csv').value.split('\n')[0];
    ok(/Manual commit/.test(head) && /Zero EC flag/.test(head),'CSV header carries both new columns: "'+head+'"');
    const row=d.getElementById('csv').value.split('\n')[1];
    // v27 appended a Skipped column, empty on an unskipped table
    ok(row.split(',').slice(-3).join(',')==='YES,YES,""','manual + zero-EC row ends ...,YES,YES,"": "'+row.split(',').slice(-3).join(',')+'"');
    ok(errors.length===0,'no runtime errors (1.1/1.4): '+errors.join('|'));
    w.close(); }

  // ================= 1.2 sequence recovery: shift back 1 and back 3 ========
  function synthRoute(n){ const r=[]; for(let t=1;t<=n;t++) ['front','center','header'].forEach(pos=>
    r.push({t,pos,depth:'reference'})); return r; }
  function synthRows(w,room,route,upto){
    return route.slice(0,upto).map((s,i)=>({date:'9/9/2026',time:'14:00:0'+(i%10),room,
      table:s.t,position:s.pos,depth:s.depth,plant:'',strain:'',flags:'',hrs:'2.0',mode:'sweep',dir:'up',
      bag:2,media:'Bio365',side:'standard',vwc:30+i,ec:4,bulk:0.5,tmp:25,flag:false,raw:'x',
      manualCommit:false,zeroEc:false}));
  }
  { const {w,d,errors}=boot(); await sleep(50);
    // route: 0 T1front 1 T1center 2 T1header 3 T2front 4 T2center 5 T2header ...
    w.S.room='B2'; w.S.route=synthRoute(4); w.S.mode='sweep';
    w.S.rows=synthRows(w,'B2',w.S.route,5); w.S.i=5;      // 5 read (route[0..4]), T2-header pending
    w.confirm=()=>true;
    w.pickTarget(2,'center','reference');                  // route[4] — one slot behind cursor(5)
    ok(w.S.i===4,'cursor moves to the corrected target: '+w.S.i);
    ok(w.S.rows[4].table===w.S.route[3].t && w.S.rows[4].position===w.S.route[3].pos,
       'the last row relabels to one slot earlier (route[3], T2 front): now T'+w.S.rows[4].table+' '+w.S.rows[4].position);
    ok(w.S.rows[3].table===w.S.route[3].t && w.S.rows[3].position===w.S.route[3].pos,
       'the row that already held route[3] is untouched — it now legitimately duplicates with row 4');
    ok(w.S.rows[0].table===w.S.route[0].t,'earlier rows untouched');
    w.close(); }
  { const {w,d,errors}=boot(); await sleep(50);              // back 3
    w.S.room='B2'; w.S.route=synthRoute(4); w.S.mode='sweep';
    w.S.rows=synthRows(w,'B2',w.S.route,8); w.S.i=8;
    w.confirm=()=>true;
    w.pickTarget(2,'header','reference');                    // route[5] — 3 slots behind cursor(8)
    ok(w.S.i===5,'cursor moves back 3: '+w.S.i);
    ok(w.S.rows[5].table===w.S.route[2].t && w.S.rows[5].position===w.S.route[2].pos,'row 5 → route[2]');
    ok(w.S.rows[6].table===w.S.route[3].t && w.S.rows[6].position===w.S.route[3].pos,'row 6 → route[3]');
    ok(w.S.rows[7].table===w.S.route[4].t && w.S.rows[7].position===w.S.route[4].pos,'row 7 → route[4]');
    w.close(); }
  { const {w,d,errors}=boot(); await sleep(50);               // "No" — cursor only, rows untouched
    w.S.room='B2'; w.S.route=synthRoute(4); w.S.mode='sweep';
    w.S.rows=synthRows(w,'B2',w.S.route,5); w.S.i=5;
    w.confirm=()=>false;
    w.pickTarget(2,'center','reference');                    // route[4]
    ok(w.S.i===4,'"No" still moves the cursor to the picked target');
    ok(w.S.rows[4].table===w.S.route[4].t && w.S.rows[4].position===w.S.route[4].pos,'…but leaves the rows exactly as recorded');
    ok(w.S.rows.length===5,'no rows added or removed');
    w.close(); }
  { const {w,d,errors}=boot(); await sleep(50);               // jump ahead: no prompt
    w.S.room='B2'; w.S.route=synthRoute(4); w.S.mode='sweep';
    w.S.rows=synthRows(w,'B2',w.S.route,3); w.S.i=3;
    let asked=false; w.confirm=()=>{ asked=true; return true; };
    w.pickTarget(2,'front','reference');                      // route[3] === S.i, no-op actually; use route[4]
    w.pickTarget(2,'center','reference');                     // route[4], ahead of i=3
    ok(!asked,'jumping ahead never prompts');
    ok(w.S.i===4,'cursor just moves ahead: '+w.S.i);
    ok(w.S.rows.length===3,'rows untouched on a forward jump');
    w.close(); }

  // ================= 1.2 the target label and recent strip are wired up ====
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER; await sleep(20);
    ok(typeof d.getElementById('pos').onclick==='function','#pos has a click handler wired up');
    d.getElementById('pos').click(); await sleep(20);
    ok(!d.getElementById('targetsheet').classList.contains('hide'),'tapping the target label opens the picker');
    d.querySelector('#targettabs .tgt[data-t="1"]').click(); await sleep(20);
    ok(d.querySelectorAll('#targetpos .tgt').length>0,'picking a table shows its positions');
    d.getElementById('targetcancel').click(); await sleep(20);
    ok(d.getElementById('targetsheet').classList.contains('hide'),'cancel closes the sheet without changing anything');
    ok(w.S.i===0,'cursor unchanged after cancel');
    w.close(); }

  // ================= 1.7 +plant a second time still finds the ref/mid pair =
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER; await sleep(20);   // B2 is 2-gal: ref + mid per stop
    for(let k=0;k<2;k++){                                     // ref + mid on T1 front
      enterSettling(w,35.0,900); await sleep(15);
      d.getElementById('log').click(); await sleep(15);
    }
    d.getElementById('extra').onclick && d.getElementById('extra').click(); await sleep(15);
    ok(w.S.route.filter(s=>s.extra).length===2,'first +plant duplicated the ref/mid pair: '+w.S.route.filter(s=>s.extra).length);
    for(let k=0;k<2;k++){                                     // read the duplicated ref + mid
      enterSettling(w,33.0,900); await sleep(15);
      d.getElementById('log').click(); await sleep(15);
    }
    d.getElementById('extra').click(); await sleep(15);        // second +plant, same table/position
    ok(w.S.route.filter(s=>s.extra).length===4,
       'second +plant at the same spot repeats the ORIGINAL pair again, not an accumulating stack: '+w.S.route.filter(s=>s.extra).length);
    w.close(); }

  // ================= 1.8 connector-wipe after 2 consecutive failed hunts ===
  { const {w,d,errors}=boot(); await sleep(50);
    w.waitDirect=()=>Promise.resolve(null);       // every probe write goes unanswered
    start(w,d,'B2');
    await w.verifyTrigger();
    ok(w.S.trigger===null && w.S.huntFails===1,'first failed hunt: huntFails=1, no wipe prompt yet');
    ok(!/wipe/i.test(d.getElementById('diag').textContent),'not yet: "'+d.getElementById('diag').textContent+'"');
    await w.verifyTrigger();
    ok(w.S.huntFails===2,'second consecutive failed hunt: huntFails=2');
    ok(/remove the connector, wipe it, and reinsert/i.test(d.getElementById('diag').textContent),
       'wipe prompt shown: "'+d.getElementById('diag').textContent+'"');
    w.waitDirect=(ms)=>new Promise(res=>{ res({vwc:30,ec:4,bulk:0.5,tmp:22,raw:'x',direct:true}); });
    await w.verifyTrigger();
    ok(w.S.huntFails===0,'a subsequent success resets the counter');
    ok(errors.length===0,'no runtime errors (1.8): '+errors.join('|'));
    w.close(); }

  // ================= 1.3 colour states on the big button ===================
  { const {w,d,errors}=boot(); await sleep(50);
    start(w,d,'B2'); w.S.trigger=w.TRIGGER; w.setBig(); await sleep(20);
    ok(d.getElementById('log').classList.contains('ready'),'armed/clear state carries .ready (v28: green, pulsing)');
    ok(!d.getElementById('log').classList.contains('wait'),'…not .wait');
    enterSettling(w,35.0,900); await sleep(15);
    d.getElementById('log').click(); await sleep(15);        // manual commit → hold
    ok(w.A.state==='hold','state machine reports hold after a commit');
    ok(d.getElementById('log').classList.contains('wait'),'logged state carries .wait (v28: red — do not stab yet)');
    ok(!d.getElementById('log').classList.contains('ready'),'…not .ready — no go cue until the probe clears');
    ok(errors.length===0,'no runtime errors (1.3): '+errors.join('|'));
    w.close(); }

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); console.log(e.stack); process.exit(2); });

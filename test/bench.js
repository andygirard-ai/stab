// BENCH is a test fixture room: present in ROOMS, deliberately absent from
// SCHED, DOF, SCHED_ML, FEEDEC and RMAP. Every lookup over those must
// tolerate the gap, read as unknown rather than zero, and BENCH must stay
// out of the coverage count, the not-seen list and the EOD swept list.
const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
const html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,
  (m,f)=>'<script>\n'+fs.readFileSync(path.join(path.dirname(file),f),'utf8')+'\n</'+'script>');

const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BAD=/NaN|undefined|null|Infinity/;

function boot(storage){
  const errors=[], vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push(String(e.message||e)));
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    url:'https://example.github.io/stab/',
    beforeParse(w){ w.Element.prototype.scrollIntoView=function(){}; w.confirm=()=>true;
      w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}});
      if(storage) Object.keys(storage).forEach(k=>w.localStorage.setItem(k,storage[k])); }});
  return {w:dom.window, d:dom.window.document, errors};
}

(async()=>{
  // ---- 1. boots with BENCH present, and BENCH is genuinely missing from the tables ----
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(!!w.ROOMS.BENCH,'app boots with BENCH in ROOMS');
    ok(w.ROOMS.BENCH.t===4 && w.ROOMS.BENCH.bag===2 && /peat/i.test(w.ROOMS.BENCH.media),
       'BENCH is 4 tables, 2-gal, '+w.ROOMS.BENCH.media);
    ok(!w.SCHED.BENCH && !w.FLOWER_START.BENCH && !w.SCHED_ML.BENCH && !w.RMAP.BENCH &&
       w.FEEDEC.BENCH===undefined,'BENCH absent from SCHED/FLOWER_START/SCHED_ML/RMAP/FEEDEC as intended');
    ok(errors.length===0,'no runtime errors at boot: '+errors.join('|'));

    // the four lookups, called directly
    ok(w.dofNow('BENCH')==='','dofNow(BENCH) reads unknown ("") not 0');
    ok(w.hoursSinceShot('BENCH')===null,'hoursSinceShot(BENCH) reads unknown (null) not 0');
    ok(w.floorFor('BENCH')===22,'floorFor(BENCH) falls back to the 2-gal floor: '+w.floorFor('BENCH'));
    ok(w.FEEDEC.BENCH===undefined,'feed EC lookup is undefined, not NaN');
    w.close(); }

  // ---- 2. a short BENCH sweep builds a clean workbook block ----
  { const {w,d,errors}=boot(null); await sleep(50);
    // backlog §4: the practice room is not a tile any more. A "NOT A ROOM"
    // heading is a label doing a lock's job, and one mis-tap on a handed-over
    // phone puts a shift of stabs into a fixture.
    ok(!d.querySelector('#rooms .rm[data-room="BENCH"]'),'BENCH is not in the room grid');
    ok(!/NOT A ROOM/.test(d.getElementById('rooms').textContent),'and the grid has no fixture section left');
    const brand=d.querySelector('.brand');
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(60);
    ok(d.getElementById('setsheet').classList.contains('hide'),'a short press on the version does nothing');
    brand.dispatchEvent(new w.MouseEvent('mouseup',{bubbles:true}));
    brand.dispatchEvent(new w.MouseEvent('mousedown',{bubbles:true}));
    await sleep(800);
    ok(!d.getElementById('setsheet').classList.contains('hide'),'a long press on it opens settings');
    d.getElementById('benchgo').click(); await sleep(30);
    ok(w.S.room==='BENCH','and the practice room opens from there: '+w.S.room);
    ok(d.getElementById('setsheet').classList.contains('hide'),'settings closes behind it');
    d.getElementById('demo').click();
    d.getElementById('startbtn').click(); await sleep(50);
    ok(w.S.roomStarted && w.S.route.length===4*3*2,
       'BENCH route built as 4 tables × 3 positions × 2 depths: '+w.S.route.length);
    const hdr=d.getElementById('hside').textContent;
    ok(!BAD.test(hdr),'sweep header has no NaN/undefined: "'+hdr+'"');
    ok(/DOF —/.test(hdr),'header shows DOF — for a room with no DOF');
    // demo stabs settle on their own clock — poll like smoke.js does
    for(let i=0;i<4;i++){
      const before=w.S.rows.length;
      d.getElementById('log').click();
      let t=0; while(w.S.rows.length===before && t<8000){ await sleep(100); t+=100; }
      let u=0; while(w.A.state!=='air' && u<4000){ await sleep(100); u+=100; }
    }
    ok(w.S.rows.length===4,'4 stabs logged on BENCH: '+w.S.rows.length);
    d.getElementById('exit').click(); await sleep(50);
    // v27 A§3: the head no longer goes into the pasted room notes, so the
    // no-NaN check runs against buildWorkbook(), which is what history keeps.
    const wb=w.buildWorkbook();
    const paste=d.getElementById('wbroom').value+'\n'+d.getElementById('wbrow').value;
    const csv=d.getElementById('csv').value;
    ok(wb.length>0,'workbook block built for BENCH');
    ok(!BAD.test(wb),'workbook block has no NaN/undefined/null'+(BAD.test(wb)?': '+wb:''));
    ok(!BAD.test(paste),'neither paste box has NaN/undefined/null'+(BAD.test(paste)?': '+paste:''));
    ok(/DOF —/.test(wb.split('\n')[0]),'workbook head reads "DOF —": '+wb.split('\n')[0]);
    ok(!BAD.test(csv.split('\n').slice(1).join('\n')),'CSV rows have no NaN/undefined');
    ok(errors.length===0,'no runtime errors on a BENCH sweep: '+errors.join('|'));
    w.close(); }

  // ---- 3. BENCH stays out of coverage, not-seen and the EOD swept list ----
  { const day=86400000, now=Date.now();
    // BENCH swept today; one real room swept today; the rest untouched for weeks.
    // Clamp "an hour ago" into today — run just after midnight it fell on
    // yesterday and the swept-today count read 0, which looked like a bug in
    // the roll-up and was a bug in this fixture.
    const t0=new Date(); t0.setHours(0,0,0,0);
    const todayTs=Math.max(now-3600e3, t0.getTime()+60e3);
    const hist=[{room:'BENCH',ts:todayTs,when:new Date(todayTs).toLocaleString('en-US'),n:8,mode:'sweep',med:41.0},
                {room:'C2',   ts:todayTs,when:new Date(todayTs).toLocaleString('en-US'),n:66,mode:'sweep',med:38.0}];
    const {w,d,errors}=boot({'stab_hist':JSON.stringify({v:1,items:hist})}); await sleep(50);
    const wk=d.getElementById('weekly').textContent;
    ok(/1\/19 rooms/.test(wk),'weekly coverage counts 1 of 19 real rooms, BENCH excluded: "'+wk+'"');
    ok(!/BENCH/.test(wk),'BENCH not named in the weekly line');
    const eod=w.buildEOD();
    const swept=eod.split('\n').slice(eod.split('\n').findIndex(l=>/^SWEPT/.test(l)));
    ok(/^SWEPT  1 room$/.test(swept[0]),'EOD swept list counts 1 room, not 2: "'+swept[0]+'"');
    ok(!/BENCH/.test(eod),'BENCH appears nowhere in the EOD roll-up');
    const ns=(eod.split('\n').find(l=>/NOT SEEN IN 3 DAYS/.test(l))||'');
    ok(ns.length>0 && !/BENCH/.test(ns),'BENCH absent from the not-seen list: "'+ns.slice(0,60)+'…"');
    ok(errors.length===0,'no runtime errors building EOD: '+errors.join('|'));
    w.close(); }

  // ---- 4. out of reach of an accidental tap (backlog §4) ----
  { const {w,d,errors}=boot(null); await sleep(50);
    const wings=[].map.call(d.querySelectorAll('#rooms .wl'),x=>x.textContent);
    ok(wings.join('/')==='A WING/B WING/C WING','the grid is three wings and nothing else: '+wings.join(' / '));
    const all=[].map.call(d.querySelectorAll('#rooms .rm'),x=>x.dataset.room);
    ok(all.indexOf('BENCH')<0,'no fixture tile anywhere in it');
    ok(all.length===19,'nineteen production rooms, all of them real: '+all.length);
    // and the grid stays honest about what it does not cover
    ok(!/BENCH/.test(d.getElementById('weekly').textContent),'the weekly line ignores bench work');
    ok(errors.length===0,'no runtime errors: '+errors.join('|'));
    w.close(); }

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); process.exit(2); });

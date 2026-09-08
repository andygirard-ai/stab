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
    ok(!w.SCHED.BENCH && !w.DOF.BENCH && !w.SCHED_ML.BENCH && !w.RMAP.BENCH &&
       w.FEEDEC.BENCH===undefined,'BENCH absent from SCHED/DOF/SCHED_ML/RMAP/FEEDEC as intended');
    ok(errors.length===0,'no runtime errors at boot: '+errors.join('|'));

    // the four lookups, called directly
    ok(w.dofNow('BENCH')==='','dofNow(BENCH) reads unknown ("") not 0');
    ok(w.hoursSinceShot('BENCH')===null,'hoursSinceShot(BENCH) reads unknown (null) not 0');
    ok(w.floorFor('BENCH')===22,'floorFor(BENCH) falls back to the 2-gal floor: '+w.floorFor('BENCH'));
    ok(w.FEEDEC.BENCH===undefined,'feed EC lookup is undefined, not NaN');
    w.close(); }

  // ---- 2. a short BENCH sweep builds a clean workbook block ----
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="BENCH"]').click();
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
    const wb=d.getElementById('wbroom').value+'\n'+d.getElementById('wbrow').value;
    const csv=d.getElementById('csv').value;
    ok(wb.length>0,'workbook block built for BENCH');
    ok(!BAD.test(wb),'workbook block has no NaN/undefined/null'+(BAD.test(wb)?': '+wb:''));
    ok(/DOF —/.test(wb.split('\n')[1]),'workbook head reads "DOF —": '+wb.split('\n')[1]);
    ok(!BAD.test(csv.split('\n').slice(1).join('\n')),'CSV rows have no NaN/undefined');
    ok(errors.length===0,'no runtime errors on a BENCH sweep: '+errors.join('|'));
    w.close(); }

  // ---- 3. BENCH stays out of coverage, not-seen and the EOD swept list ----
  { const day=86400000, now=Date.now();
    // BENCH swept today; one real room swept today; the rest untouched for weeks
    const hist=[{room:'BENCH',ts:now-3600e3,when:new Date(now-3600e3).toLocaleString('en-US'),n:8,mode:'sweep',med:41.0},
                {room:'C2',   ts:now-7200e3,when:new Date(now-7200e3).toLocaleString('en-US'),n:66,mode:'sweep',med:38.0}];
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

  // ---- 4. labelled so it cannot be picked by accident ----
  { const {w,d,errors}=boot(null); await sleep(50);
    const b=d.querySelector('#rooms .rm[data-room="BENCH"]');
    ok(!!b,'BENCH is present in the room grid');
    ok(b.classList.contains('test'),'BENCH button carries the .test class');
    ok(/BENCH · test/.test(b.querySelector('.sub').textContent),
       'sub-label reads "BENCH · test": "'+b.querySelector('.sub').textContent+'"');
    const wings=[].map.call(d.querySelectorAll('#rooms .wl'),x=>x.textContent);
    ok(wings.indexOf('NOT A ROOM')>=0,'BENCH sits under its own heading, not in a wing: '+wings.join(' / '));
    const bWing=[].map.call(d.querySelectorAll('#rooms .wing')[1].querySelectorAll('.rm'),x=>x.dataset.room);
    ok(bWing.indexOf('BENCH')<0,'B WING holds only B rooms: '+bWing.join(','));
    ok(errors.length===0,'no runtime errors: '+errors.join('|'));
    w.close(); }

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); process.exit(2); });

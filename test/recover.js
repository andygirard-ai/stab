// Crash-recovery test: non-demo sweep, inject sensor frames directly, "crash", resume, finish.
const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs');
function inlineScripts(html, base){
  const path=require('path');
  return html.replace(/<script src="([^"?]+)[^"]*"><\/script>/g, (m,f)=>
    '<script>\n'+fs.readFileSync(path.join(path.dirname(base),f),'utf8')+'\n</'+'script>');
}

const file=process.argv[2]||'index.html'; const html=inlineScripts(fs.readFileSync(file,'utf8'),file);
const errors=[];
function boot(storage){
  const vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push('jsdomError: '+(e.message||e)));
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.github.io/stab/',virtualConsole:vc,
    beforeParse(w){ w.Element.prototype.scrollIntoView=function(){}; w.confirm=()=>true; w.prompt=()=>'ABC';
      w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}});
      if(storage) Object.keys(storage).forEach(k=>w.localStorage.setItem(k,storage[k]));
    }});
  dom.window.addEventListener('error',e=>errors.push('window error: '+e.message));
  return dom.window;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function inject(w,vwc,ec){ // push frames until a row commits
  const c=w.countsForVwc(vwc,false), bulk=w.bulkForEC(c,ec,22,2.90);
  const before=w.S.rows.length; let t=0;
  // air first so it re-arms
  w.rxBytes(w.frameBytes('0\t'+'1790.0 22.0 0\rg8')); await sleep(50);
  while(w.S.rows.length===before && t<15000){ w.rxBytes(w.frameBytes('0\t'+c.toFixed(1)+' 22.0 '+bulk+'\rg8')); await sleep(1250); t+=1250; }
  return w.S.rows.length===before+1;
}
(async()=>{
  const out=[]; const ok=(c,m)=>{ out.push((c?'PASS ':'FAIL ')+m); };
  let w=boot(null); const d=w.document, $=id=>d.getElementById(id);
  await sleep(50);
  d.querySelector('#rooms .rm[data-room="B2"]').click();
  $('cfg_bag').value='2'; $('cfg_ec').value='3.1'; $('cfg_ph').value='5.9';
  $('startbtn').click();
  w.S.trigger=w.TRIGGER; // pretend probe verified
  ok(w.S.roomStarted,'sweep started (no BLE in jsdom → step says so)');
  for(const [v,e] of [[45,4.0],[38,4.4],[41,3.9],[70,2.0],[5.5,0]]) ok(await inject(w,v,e),'injected reading '+v+'%');
  out.push('    rows now '+w.S.rows.length+' (70% and 5.5% are the implausible-flag cases)');
  $('note').click(); $('pegfree').value='left header dripper kinked'; d.querySelector('#pegs .chip').click(); $('pegdone').click();
  var _ss=JSON.parse(w.localStorage.getItem('stab_session')||'null');
  ok(_ss && _ss.v===22 && (_ss.rows||[]).length===w.S.rows.length,'session v22 single key persists rows');
  const snap={}; for(let i=0;i<w.localStorage.length;i++){ const k=w.localStorage.key(i); snap[k]=w.localStorage.getItem(k); }
  const rowsBefore=w.S.rows.length, freeBefore=JSON.stringify(w.S.free), feedBefore=w.S.feedEC+'/'+w.S.feedPH;
  w.close();
  // ---- crash & reboot ----
  w=boot(snap); const d2=w.document, $2=id=>d2.getElementById(id);
  await sleep(50);
  ok(!$2('resume').classList.contains('hide'),'resume banner shown: '+$2('rsub').textContent);
  $2('rgo').click(); w.S.trigger=w.TRIGGER;
  ok(w.S.rows.length===rowsBefore,'rows restored '+w.S.rows.length);
  ok(JSON.stringify(w.S.free)===freeBefore,'free text restored ('+JSON.stringify(w.S.free)+' vs '+freeBefore+')');
  ok((w.S.feedEC+'/'+w.S.feedPH)===feedBefore,'feed EC/pH restored ('+w.S.feedEC+'/'+w.S.feedPH+' vs '+feedBefore+')');
  ok(w.ROOMS.B2.bag===2,'bag still 2 after reload');
  ok(await inject(w,36,4.1),'post-resume reading logged');
  const last=w.S.rows[w.S.rows.length-1], first=w.S.rows[0];
  ok(last.feedEC===first.feedEC && last.feedPH===first.feedPH,'post-resume row carries same feed EC/pH as pre-crash rows ('+last.feedEC+'/'+last.feedPH+' vs '+first.feedEC+'/'+first.feedPH+')');
  $2('exit').click();
  ok(w.S.finished,'finished');
  const wb=$2('wbrow').value; out.push('    workbook notes line: '+(wb.split('\n').find(l=>/left header/.test(l))||'(free text MISSING from workbook)'));
  const csvl=$2('csv').value.split('\n'); out.push('    implausible col on 70% row: '+(csvl.find(l=>/,70\.?\d*,/.test(l)||/,70,/.test(l))||'').split(',').slice(-3).join('|'));
  const _h=JSON.parse(w.localStorage.getItem('stab_hist')); const hist=Array.isArray(_h)?_h:_h.items;
  ok(_h.v===1 && hist.length===1 && hist[0].room==='B2','history saved (v1 wrapper)');
  console.log(out.join('\n')); if(errors.length){ console.log('ERRORS:\n'+errors.join('\n')); process.exitCode=1; } else console.log('NO RUNTIME ERRORS');
  w.close(); process.exit();
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); process.exit(2); });

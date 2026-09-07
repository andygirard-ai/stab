// Headless smoke test: loads index.html in jsdom, runs a demo-mode sweep end to end.
// Usage: node smoke.js <index.html>
const {JSDOM}=require('jsdom'); const fs=require('fs');
const file=process.argv[2]||'index.html';
const html=inlineScripts(fs.readFileSync(file,'utf8'),file);
function inlineScripts(html, base){
  const path=require('path');
  return html.replace(/<script src="([^"?]+)[^"]*"><\/script>/g, (m,f)=>
    '<script>\n'+fs.readFileSync(path.join(path.dirname(base),f),'utf8')+'\n</'+'script>');
}

const errors=[];
const vc=new (require('jsdom').VirtualConsole)();
vc.on('jsdomError',e=>errors.push('jsdomError: '+(e.message||e)));
vc.on('error',(...a)=>errors.push('console.error: '+a.join(' ')));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://example.github.io/stab/',virtualConsole:vc,
  beforeParse(w){ w.Element.prototype.scrollIntoView=function(){}; w.confirm=()=>true; w.prompt=()=>'ABC';
    w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},});
  }});
const w=dom.window, d=w.document;
w.addEventListener('error',e=>errors.push('window error: '+e.message));
const $=id=>d.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function vis(id){ return !$(id).classList.contains('hide'); }
(async()=>{
  const log=[];
  const ok=(c,m)=>{ log.push((c?'PASS ':'FAIL ')+m); if(!c) errors.push('assert: '+m); };
  await sleep(50);
  // 19 production rooms; test fixtures carry .test and are counted apart
  const rmAll=d.querySelectorAll('#rooms .rm').length;
  const rmTest=d.querySelectorAll('#rooms .rm.test').length;
  ok(rmAll-rmTest===19,'19 production room buttons ('+rmAll+' total, '+rmTest+' fixture)');
  // pick C3, demo on, start
  d.querySelector('#rooms .rm[data-room="C3"]').click();
  ok(w.S.room==='C3','room picked');
  ok(vis('roomcfg'),'room cfg shown');
  $('cfg_bag').value='2'; $('cfg_ec').value='3.2'; $('cfg_ph').value='6.1';
  $('demo').click(); ok(w.DEMO===true,'demo on');
  $('startbtn').click();
  ok(w.S.roomStarted && w.S.route.length===66,'route built as 2-gal (66 stops): '+w.S.route.length);
  ok(w.ROOMS.C3.bag===2,'ROOMS.C3.bag mutated to 2');
  ok(w.S.feedEC===3.2 && w.S.feedPH===6.1,'feed EC/pH applied');
  // do N demo stabs
  const N=parseInt(process.env.N||'7',10);
  for(let k=0;k<N;k++){
    const before=w.S.rows.length;
    $('log').click();            // simStab
    let t=0; while(w.S.rows.length===before && t<8000){ await sleep(100); t+=100; }
    ok(w.S.rows.length===before+1,'stab '+(k+1)+' logged in '+t+'ms');
    // wait for sim to go back to air and app to re-arm
    t=0; while((w.A.state!=='air') && t<4000){ await sleep(100); t+=100; }
  }
  // peg sheet open/close
  $('note').click(); ok(vis('pegsheet') && w.S.pegsOpen,'peg sheet opens');
  d.querySelector('#pegs .chip').click(); $('pegfree').value='free text here';
  $('pegdone').click(); ok(!vis('pegsheet') && !w.S.pegsOpen,'peg sheet closes');
  ok(Object.keys(w.S.notes).length===1 && Object.keys(w.S.free).length===1,'notes+free saved');
  // log sheet open/close
  $('logbtn').click(); ok(vis('logsheet') && w.S.logOpen,'log sheet opens');
  $('logclose').click(); ok(!vis('logsheet') && !w.S.logOpen,'log sheet closes');
  // undo/redo
  const n0=w.S.rows.length; $('undo').click(); ok(w.S.rows.length===n0-1,'undo'); $('redo').click(); ok(w.S.rows.length===n0,'redo');
  // session saved? (demo never saves) 
  ok(w.localStorage.getItem('stab_session')===null,'demo does not write session');
  // finish
  $('exit').click();
  ok(w.S.finished && vis('done'),'finished → done screen');
  ok($('csv').value.split('\n').length===n0+1,'CSV rows = '+n0);
  ok($('wb').value.indexOf('CHECK')>0,'workbook block built');
  log.push('--- workbook head: '+$('wb').value.split('\n')[0]);
  log.push('--- csv header: '+$('csv').value.split('\n')[0]);
  console.log(log.join('\n'));
  if(errors.length){ console.log('\nERRORS:\n'+errors.join('\n')); process.exitCode=1; } else console.log('\nNO RUNTIME ERRORS');
  w.close(); process.exit();
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); process.exit(2); });

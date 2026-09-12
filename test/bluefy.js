// Bluefy-only API test: setScreenDimEnabled + backgroundstatechanged.
// jsdom has no navigator.bluetooth, so the other suites only ever prove the
// no-op path. This one stubs Bluefy and drives the real branches.
const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
const html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,
  (m,f)=>'<script>\n'+fs.readFileSync(path.join(path.dirname(file),f),'utf8')+'\n</'+'script>');

const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// jsdom refuses to navigate; discard/more legitimately call location.reload().
const NAV=/Not implemented: navigation/i;

function boot(opts){
  opts=opts||{};
  const errors=[], dim=[], vc=new VirtualConsole();
  vc.on('jsdomError',e=>{ const s=String(e.message||e); if(!NAV.test(s)) errors.push(s); });
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    url:'https://example.github.io/stab/',
    beforeParse(w){
      w.Element.prototype.scrollIntoView=function(){}; w.confirm=()=>true; w.prompt=()=>'ABC';
      w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}});
      const bt={
        addEventListener(type,fn){ (this._l[type]=this._l[type]||[]).push(fn); },
        removeEventListener(){}, _l:{},
        fire(type,ev){ (this._l[type]||[]).forEach(fn=>fn(ev)); },
        requestDevice(){ return Promise.reject(new Error('no probe in jsdom')); }
      };
      if(!opts.noDim) bt.setScreenDimEnabled=v=>dim.push(v);
      Object.defineProperty(w.navigator,'bluetooth',{value:bt,configurable:true});
    }});
  return {w:dom.window, d:dom.window.document, errors, dim, bt:dom.window.navigator.bluetooth};
}
const start=(d)=>{ d.querySelector('#rooms .rm[data-room="B2"]').click();
  d.getElementById('cfg_bag').value='2'; d.getElementById('startbtn').click(); d.getElementById('confirmgo').click(); };

(async()=>{
  // ---- 1. dim held off for the length of a sweep, given back at END ----
  { const {w,d,errors,dim}=boot(); await sleep(50);
    ok(w.BF.listening,'backgroundstatechanged listener registered at boot');
    ok(dim.length===0,'no dim call before a sweep starts');
    start(d); await sleep(50);
    ok(dim[dim.length-1]===false,'sweep start → setScreenDimEnabled(false), screen held bright');
    d.getElementById('exit').click(); await sleep(50);
    ok(w.S.finished && dim[dim.length-1]===true,'END → setScreenDimEnabled(true), dim given back');
    ok(errors.length===0,'no runtime errors (END): '+errors.join('|')); w.close(); }

  // ---- 2. discard is an exit too ----
  { const {w,d,errors,dim}=boot(); await sleep(50);
    start(d); await sleep(50);
    d.getElementById('exit').click(); await sleep(20);
    const n=dim.length; d.getElementById('discard').click(); await sleep(20);
    ok(dim.length>n && dim[dim.length-1]===true,'discard → dim given back before reload');
    ok(errors.length===0,'no runtime errors (discard): '+errors.join('|')); w.close(); }

  // ---- 3. abandoning the sweep screen must not leave the phone awake ----
  { const {w,d,errors,dim}=boot(); await sleep(50);
    start(d); await sleep(50);
    ok(dim[dim.length-1]===false,'sweep running, screen still held');
    w.dispatchEvent(new w.Event('pagehide')); await sleep(20);
    ok(dim[dim.length-1]===true,'pagehide on an abandoned sweep → dim given back');
    ok(errors.length===0,'no runtime errors (pagehide): '+errors.join('|')); w.close(); }

  // ---- 4. backgrounding saves the session there and then ----
  { const {w,d,errors,bt}=boot(); await sleep(50);
    start(d); await sleep(50);
    w.S.rows.push({room:'B2',table:1,position:'front',depth:'reference',vwc:44,ec:4.1,bulk:.9,
      tmp:22,flag:false,raw:'x',mode:'sweep',dir:'up',side:'standard',bag:2,media:'Bio365'});
    w.localStorage.removeItem('stab_session');
    ok(!w.localStorage.getItem('stab_session'),'session key cleared to prove the next write is the event');
    bt.fire('backgroundstatechanged',{background:true}); await sleep(20);
    const s=JSON.parse(w.localStorage.getItem('stab_session')||'null');
    ok(s && s.rows.length===1,'backgrounded → session saved immediately, not at the next reading');
    ok(errors.length===0,'no runtime errors (background): '+errors.join('|')); w.close(); }

  // ---- 5. on return, the step line says whether BLE survived ----
  { const {w,d,errors,bt}=boot(); await sleep(50);
    start(d); await sleep(50);
    // survived: pretend the GATT link is still up on the way back
    w.S.dev={gatt:{connected:true}}; w.S.chr={};
    bt.fire('backgroundstatechanged',{background:true}); await sleep(10);
    bt.fire('backgroundstatechanged',{background:false}); await sleep(10);
    ok(/still connected/.test(d.getElementById('diag').textContent),
       'return with link up → "'+d.getElementById('diag').textContent+'"');
    // dropped: connected going in, gone coming back
    bt.fire('backgroundstatechanged',{background:true}); await sleep(10);
    w.S.dev=null; w.S.chr=null;
    bt.fire('backgroundstatechanged',{background:false}); await sleep(10);
    ok(/dropped while backgrounded/.test(d.getElementById('diag').textContent),
       'return with link gone → "'+d.getElementById('diag').textContent+'"');
    ok(errors.length===0,'no runtime errors (step line): '+errors.join('|')); w.close(); }

  // ---- 6. a Bluefy build with the event but no dim setter must not throw ----
  { const {w,d,errors,dim,bt}=boot({noDim:true}); await sleep(50);
    start(d); await sleep(50);
    bt.fire('backgroundstatechanged',{background:true}); await sleep(10);
    bt.fire('backgroundstatechanged',{background:false}); await sleep(10);
    d.getElementById('exit').click(); await sleep(30);
    ok(dim.length===0 && w.S.finished,'setScreenDimEnabled absent → feature-detected away, sweep still finishes');
    ok(errors.length===0,'no runtime errors (no dim setter): '+errors.join('|')); w.close(); }

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); process.exit(2); });

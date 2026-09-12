// Probe identity (Weekend Plan 1.4): the bridge's own advertised name,
// captured on connect and shown on the pill before any battery reply
// arrives. jsdom has no navigator.bluetooth (bluefy.js already notes this),
// so this drives the real connect() chain with a minimal fake GATT stack
// rather than short-circuiting it the way the other suites' start() does.
const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
const html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,
  (m,f)=>'<script>\n'+fs.readFileSync(path.join(path.dirname(file),f),'utf8')+'\n</'+'script>');

const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// same literals as pure.js SVC/NTF/WRT — hardcoded because beforeParse runs
// before any script on the page, so window.SVC does not exist yet
const SVC='deca0001-10c7-43a8-8c9f-42b70e03808d';
const NTF='deca0003-10c7-43a8-8c9f-42b70e03808d';
const WRT='deca0002-10c7-43a8-8c9f-42b70e03808d';

function fakeDevice(name){
  const notifyChar={ addEventListener(){}, removeEventListener(){}, startNotifications:()=>Promise.resolve() };
  const writeChar={ writeValue:()=>Promise.resolve(), writeValueWithoutResponse:()=>Promise.resolve() };
  const svc={ getCharacteristic(u){
    if(u===NTF) return Promise.resolve(notifyChar);
    if(u===WRT) return Promise.resolve(writeChar);
    return Promise.reject(new Error('no such characteristic'));
  } };
  const gatt={ connected:true, connect:()=>Promise.resolve(gatt),
    getPrimaryService:u=>u===SVC?Promise.resolve(svc):Promise.reject(new Error('no service')) };
  return { name, gatt, addEventListener(){}, removeEventListener(){} };
}
function boot(devName){
  const errors=[], vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push(String(e.message||e)));
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    url:'https://example.github.io/stab/',
    beforeParse(w){
      w.Element.prototype.scrollIntoView=function(){}; w.confirm=()=>true; w.prompt=()=>'ABC';
      w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}});
      w.localStorage.setItem('stab_wlt','1');
      const bt={ requestDevice(){ return Promise.resolve(fakeDevice(devName)); } };
      Object.defineProperty(w.navigator,'bluetooth',{value:bt,configurable:true});
    }});
  return {w:dom.window, d:dom.window.document, errors};
}

(async()=>{
  { const {w,d,errors}=boot('ZSC08328'); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B2"]').click(); await sleep(20);
    d.getElementById('startbtn').click(); d.getElementById('confirmgo').click();
    await sleep(900);   // past the 700ms "connected — settling" delay
    ok(w.S.probeName==='ZSC08328','the bridge\'s own name is captured on connect: '+w.S.probeName);
    ok(d.getElementById('batt').textContent.indexOf('ZSC08328')>=0,
       'and shown on the pill before any battery reply arrives: "'+d.getElementById('batt').textContent+'"');
    ok(d.getElementById('batt').className==='ok','the pill reads live, not empty or stale-colored');
    w.S.roomStarted=false; }

  // a probe swap mid-day (Evan's arriving) shows up on the very next connect
  { const {w,d,errors}=boot('ZSC00142'); await sleep(50);
    d.querySelector('#rooms .rm[data-room="B2"]').click(); await sleep(20);
    d.getElementById('startbtn').click(); d.getElementById('confirmgo').click();
    await sleep(900);
    ok(w.S.probeName==='ZSC00142','a different bridge is named as itself, not carried over: '+w.S.probeName);
    w.S.roomStarted=false; }

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); console.log(e.stack); process.exit(2); });

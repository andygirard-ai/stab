const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
let html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,(m,f)=>'<script>\n'+fs.readFileSync(path.join(path.dirname(file),f),'utf8')+'\n</'+'script>');
function boot(storage){
  const errors=[]; const vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push(String(e.message||e)));
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.github.io/stab/',virtualConsole:vc,
    beforeParse(w){ w.Element.prototype.scrollIntoView=()=>{}; w.confirm=()=>true; w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}});
      if(storage) Object.keys(storage).forEach(k=>w.localStorage.setItem(k,storage[k])); }});
  return {w:dom.window,d:dom.window.document,errors};
}
const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
// 1. legacy v21 two-key session resumes
const route=[{t:1,pos:'front',depth:'reference'},{t:1,pos:'front',depth:'mid-bag'},{t:1,pos:'center',depth:'reference'}];
const legacy={ 'stab_session':JSON.stringify({v:21,room:'B2',side:'standard',dir:'up',mode:'sweep',op:'APG',i:2,notes:{},free:{'1':'old note'},route,startedAt:Date.now()-60000,feedEC:2.9,feedPH:6.0,triage:[],skips:0,unstable:0}),
  'stab_rows':JSON.stringify([{room:'B2',table:1,position:'front',depth:'reference',vwc:44,ec:4.1,bulk:.9,tmp:22,flag:false,raw:'x',mode:'sweep',dir:'up',side:'standard',bag:2,media:'Bio365'},
                              {room:'B2',table:1,position:'front',depth:'mid-bag',vwc:39,ec:3.9,bulk:.8,tmp:22,flag:false,raw:'x',mode:'sweep',dir:'up',side:'standard',bag:2,media:'Bio365'}]) };
{ const {w,d,errors}=boot(legacy);
  ok(!d.getElementById('resume').classList.contains('hide'),'legacy v21 session shows resume banner');
  ok(/2 readings saved/.test(d.getElementById('rsub').textContent),'legacy rows counted: '+d.getElementById('rsub').textContent);
  d.getElementById('rgo').click();
  ok(w.S.rows.length===2 && w.S.free['1']==='old note' && w.S.feedEC===2.9,'legacy hydrate: rows, free text, feedEC');
  ok(errors.length===0,'no runtime errors (legacy): '+errors.join('|')); }
// 2. demo band + dataage + old hist array + S9
{ const hist=[{room:'C3',ts:Date.now()-3600e3,when:'9/3/2026, 8:00:00 AM',n:6,mode:'triage',med:20.0},
              {room:'C3',ts:Date.now()-86400e3,when:'9/2/2026, 8:00:00 AM',n:66,mode:'sweep',med:40.0}];
  const {w,d,errors}=boot({'stab_hist':JSON.stringify(hist),'stab_prev':JSON.stringify({'C3|1|front|reference':{d:'9/2/2026',v:40,e:4}}),'stab_events':JSON.stringify([{kind:'fault',room:'C3',what:'leak',status:'open',ts:Date.now()}])});
  ok(d.getElementById('demoband').classList.contains('hide'),'band hidden at boot');
  ok(/room data as of 9\/3\/2026/.test(d.getElementById('dataage').textContent),'dataage text: '+d.getElementById('dataage').textContent);
  ok(w.getHist().length===2,'v0 bare-array history still reads');
  ok(w.getEv().length===1,'v0 bare-array events still read');
  ok(w.PREV._v===1,'PREV carries _v marker');
  d.querySelector('#rooms .rm[data-room="C3"]').click();
  ok(/open · C3 — leak/.test(d.getElementById('roomhist').textContent),'open fault shown on picker');
  d.getElementById('demo').click();
  ok(!d.getElementById('demoband').classList.contains('hide') && d.body.classList.contains('demo'),'band visible when demo on');
  d.getElementById('cfg_bag').value='2'; d.getElementById('startbtn').click();
  ok(!d.getElementById('demoband').classList.contains('hide'),'band still visible on sweep screen');
  w.S.rows.push({date:'9/4/2026',time:'09:00:00',hrs:'2.0',room:'C3',table:1,position:'front',depth:'reference',vwc:30,ec:4,bulk:.8,tmp:22,flag:false,raw:'x',mode:'sweep',strain:'Walkabout',flags:''});
  const wb=w.buildWorkbook();
  ok(/was 40\.0/.test(wb) && !/was 20\.0/.test(wb),'S9: delta baseline is the full sweep (40), not the triage (20): '+(wb.match(/median[^·]*/)||[''])[0]);
  ok(errors.length===0,'no runtime errors (demo/S9): '+errors.join('|')); }
console.log(out.join("\n")); process.exit(out.some(l=>l.startsWith("FAIL"))?1:0);

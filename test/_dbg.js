const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=path.join(__dirname,'..','index.html'); const dir=path.dirname(file);
const html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,
  (m,f)=>'<script>\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n</'+'script>');
const errors=[], vc=new VirtualConsole(); vc.on('jsdomError',e=>errors.push(String(e.message||e)));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
  url:'https://example.github.io/stab/', beforeParse(w){ w.Element.prototype.scrollIntoView=function(){};
    w.confirm=()=>true; w.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){}});
    w.localStorage.setItem('stab_wlt','1'); }});
const w=dom.window,d=w.document;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function enter(vwc,b){ const c=w.countsForVwc(vwc,false);
  w.rxBytes(w.frameBytes('0\t1790.0 22.0 0\rg8'));
  w.rxBytes(w.frameBytes('0\t'+c.toFixed(1)+' 22.0 '+(b==null?900:b)+'\rg8')); }
(async()=>{ await sleep(60);
  d.querySelector('#rooms .rm[data-room="B2"]').click();
  d.getElementById('startbtn').click(); await sleep(30);
  w.S.dev={gatt:{connected:true}}; w.S.chr={}; w.S.trigger=w.TRIGGER;
  ['log','extra','skip','undo','redo'].forEach(id=>{d.getElementById(id).disabled=false;});
  for(const v of [33,34]){ enter(v,900); await sleep(20); d.getElementById('log').click(); await sleep(20); }
  console.log('rows', w.S.rows.map(r=>r.table+' '+r.position+' '+r.vwc));
  console.log('DOF B2', w.dofNow('B2'), 'fc', w.fcFor('B2'), 'ceil', w.plausCeiling('B2',false));
  enter(52,900); await sleep(20); d.getElementById('log').click(); await sleep(30);
  const r=w.S.rows[2];
  console.log('third', r && (r.vwc+' implaus='+r.implaus+' flag='+r.flag+' out='+r._out));
  console.log('alarmQueue', JSON.stringify(w.S.alarmQueue));
  console.log('alarm hidden', d.getElementById('alarm').classList.contains('hide'));
  console.log('alarmundo exists', !!d.getElementById('alarmundo'));
  console.log('errors', errors);
})();

// v25: what gets written down. The two paste blocks, per-table skip reasons,
// the room access block, the reworked peg chips, and the removal of the voice
// readout. The load-bearing assertion is the false-collapse one: a room that
// was half skipped must not be reported as a room-level failure.
const {JSDOM,VirtualConsole}=require('jsdom'); const fs=require('fs'), path=require('path');
const file=process.argv[2]||path.join(__dirname,'..','index.html');
const dir=path.dirname(file);
const html=fs.readFileSync(file,'utf8').replace(/<script src="([^"?]+)[^"]*"><\/script>/g,
  (m,f)=>'<script>\n'+fs.readFileSync(path.join(dir,f),'utf8')+'\n</'+'script>');

const out=[]; const ok=(c,m)=>out.push((c?'PASS ':'FAIL ')+m);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const STAMP=/^\d{1,2}:\d{2} (AM|PM)$/;
const STAMP_G=/^\d{1,2}:\d{2} (AM|PM)/;

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
// a table of reference rows at one moisture, as doCommit would have left them
function rowsFor(w,room,spec,time){
  const o=[];
  Object.keys(spec).forEach(t=>{ for(let i=0;i<3;i++) o.push({date:'9/7/2026',time:time||'16:42:00',
    room,table:+t,position:'center',depth:'reference',plant:'',strain:'',flags:'',hrs:'2.0',
    mode:'sweep',dir:'up',bag:2,media:'Bio365',side:'standard',vwc:spec[t],ec:4,bulk:0.5,tmp:25,
    flag:spec[t]<w.floorFor(room),raw:'x'}); });
  return o;
}
async function demoStab(w,d){
  const before=w.S.rows.length;
  d.getElementById('log').click();
  let t=0; while(w.S.rows.length===before && t<8000){ await sleep(100); t+=100; }
  let u=0; while(w.A.state!=='air' && u<4000){ await sleep(100); u+=100; }
}

(async()=>{
  // ================= 1. the two paste blocks =================
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C3"]').click();
    d.getElementById('demo').click();
    d.getElementById('cfg_bag').value='2';
    d.getElementById('startbtn').click(); await sleep(50);
    for(let i=0;i<6;i++) await demoStab(w,d);
    d.getElementById('exit').click(); await sleep(50);
    const row=d.getElementById('wbrow').value, room=d.getElementById('wbroom').value;
    ok(STAMP_G.test(row.split('\n')[0]),'row notes lead with an inline sweep timestamp: "'+row.split('\n')[0]+'"');
    ok(STAMP.test(room.split('\n')[0]),'room notes lead with the sweep timestamp on its own line: "'+room.split('\n')[0]+'"');
    ok(/^T\d+  /.test(row.split('\n')[0].replace(STAMP_G,'').trim()),
       'stamp sits before the first word of the first row, not on its own line: "'+row.split('\n')[0]+'"');
    ok(row.split('\n')[0].match(STAMP_G)[0]===room.split('\n')[0],'row and room stamps carry the same time text');
    ok(!/CHECK/.test(row),'row notes carry no CHECK section');
    ok(!/below floor/.test(row),'row notes carry no summary line');
    ok(!/ROW NOTES|NOTES  \(/.test(row+room),'neither paste carries a column header');
    ok(/CHECK/.test(room),'room notes carry the CHECK section');
    ok(/median/.test(room.split('\n')[1]),'room notes line 2 is the summary: "'+room.split('\n')[1]+'"');
    ok(row.split('\n').slice(1).every(l=>/^T\d+  /.test(l)),'every row-note line after the first is T-prefixed');
    ok(errors.length===0,'no runtime errors (pastes): '+errors.join('|'));
    w.close(); }

  // ================= 2. a skipped table, with its reason =================
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C3"]').click();
    d.getElementById('demo').click();
    d.getElementById('cfg_bag').value='2';
    d.getElementById('startbtn').click(); await sleep(50);
    await demoStab(w,d);                       // one reading on T1
    const tbl=w.S.route[w.S.i].t;
    d.getElementById('skip').click(); await sleep(20);
    ok(!d.getElementById('skipsheet').classList.contains('hide'),'skip asks why before skipping');
    const chips=[].map.call(d.querySelectorAll('#skipbody .chip'),x=>x.dataset.w);
    ok(chips.join('|')==="spray REI|crew|can't reach|other",'skip reasons offered: '+chips.join(' · '));
    [].find.call(d.querySelectorAll('#skipbody .chip'),x=>x.dataset.w==='spray REI').click();
    await sleep(20);
    const allBtn=d.getElementById('skipall');
    ok(!!allBtn,'after the reason it offers the whole table');
    const iBefore=w.S.i, left=w.S.route.filter((x,k)=>k>=iBefore && x.t===tbl).length;
    ok(left>1,'T'+tbl+' has '+left+' stops left, so the offer is worth making');
    if(allBtn) allBtn.click(); await sleep(20);
    ok(d.getElementById('skipsheet').classList.contains('hide'),'sheet closes on pick');
    ok(w.S.i===iBefore+left,'one tap skipped all '+left+' remaining stops on T'+tbl);
    ok(!!w.S.route[w.S.i] && w.S.route[w.S.i].t!==tbl,'the next stop is a different table: T'+((w.S.route[w.S.i]||{}).t));
    ok(w.S.skipped[String(tbl)]==='spray REI','reason recorded against T'+tbl+': '+w.S.skipped[String(tbl)]);
    for(let i=0;i<4;i++) await demoStab(w,d);
    d.getElementById('exit').click(); await sleep(50);
    const row=d.getElementById('wbrow').value;
    const line=row.split('\n').find(l=>new RegExp('(^|'+STAMP_G.source+' )T'+tbl+'  ').test(l));
    ok(!!line && /— spray REI/.test(line),'skipped table shows its reason in row notes: "'+line+'"');
    ok(/Skipped T'+tbl+'|Skipped T/.test(d.getElementById('wbroom').value),'room notes name the skipped table');
    ok(errors.length===0,'no runtime errors (skip): '+errors.join('|'));
    w.close(); }

  // ================= 3. skipped tables must not manufacture a collapse =====
  { const {w,d,errors}=boot(null); await sleep(50);
    w.S.room='B2'; w.S.mode='sweep'; w.S.feedEC=null; w.S.notes={}; w.S.free={};
    // 5 tables measured and every one below the 22 floor; 6 tables skipped for crew.
    w.S.rows=rowsFor(w,'B2',{1:10,2:10,3:10,4:10,5:10});
    w.S.skipped={6:'crew',7:'crew',8:'crew',9:'crew',10:'crew',11:'crew'};
    let lines=w.checkLines();
    ok(!lines.some(l=>/^ROOM/.test(l)),'5 measured all bad + 6 skipped → NO room collapse');
    ok(lines.filter(l=>/table-level fault/.test(l)).length===5,'the 5 real table faults all survive');
    // same five tables, nothing skipped: 5 of 5 is a room
    w.S.skipped={};
    lines=w.checkLines();
    ok(lines.some(l=>/^ROOM/.test(l)),'same 5 tables with no skips DO collapse — the guard is the skips, not the count');
    // skipped tables stay out of other tables' medians
    w.S.rows=rowsFor(w,'B2',{1:30,2:30,3:30,4:30,5:90,6:30,7:30});
    w.S.skipped={5:'spray REI'};
    ok(w.checkLines().length===0,'a skipped table is not an outlier and does not drag the room median');
    // The >=4 guard counts MEASURED tables, not seen ones. Three tables read
    // and one skipped is four seen, and 3 > 4/2 — but three readings are not
    // a room, so the guard must still refuse. (This is the window where
    // nTab>=4 and nSeen>=4 disagree; with many skips they agree by accident.)
    w.S.rows=rowsFor(w,'B2',{1:10,2:10,3:10});
    w.S.skipped={4:'crew'};
    const g=w.checkLines();
    ok(!g.some(l=>/^ROOM/.test(l)),'3 measured + 1 skipped = 4 seen, but 3 readings are not a room');
    ok(g.filter(l=>/table-level fault/.test(l)).length===3,'…the 3 table faults still stand');
    // one more measured table and it is a room: 4 measured, 4 of 5 seen
    w.S.rows=rowsFor(w,'B2',{1:10,2:10,3:10,4:10});
    w.S.skipped={5:'crew'};
    ok(w.checkLines().some(l=>/^ROOM/.test(l)),'4 measured of 5 seen does collapse — the guard is the measured count');
    // and the denominator is not shrunk: 8 of 11 seen still collapses
    w.S.rows=rowsFor(w,'B2',{1:10,2:10,3:10,4:10,5:10,6:10,7:10,8:10});
    w.S.skipped={9:'spray REI',10:'spray REI',11:'spray REI'};
    const c=w.checkLines().find(l=>/^ROOM/.test(l));
    ok(!!c && /3 skipped/.test(c),'8 of 11 seen still collapses, scoped honestly: "'+c+'"');
    // below-floor counts exclude skipped rows from BOTH sides of the fraction
    // A partial table: real readings taken before the aisle shut. They are
    // measurements, so they count in the headline — the skip reason is about
    // access, not about whether the probe was telling the truth.
    w.S.rows=rowsFor(w,'B2',{1:40,2:40}).concat(rowsFor(w,'B2',{3:5}));
    w.S.skipped={3:"can't reach"};
    const head=w.roomHead();
    ok(/3\/9 below floor/.test(head),'readings taken on a skipped table still count below floor: "'+head+'"');
    ok(/1 table skipped/.test(head),'…and the head still says a table was skipped');
    ok(w.checkLines().length===0,'…but they still fire no CHECK rule');
    ok(w.S.rows.length===9,'the rows are in S.rows for the CSV');
    const para=w.roomPara();
    ok(/outside the CHECK rules; stabs taken there still count above/.test(para),
       'the paragraph says exactly what was and was not excluded');
    // a fully skipped table contributes nothing and says so plainly
    w.S.rows=rowsFor(w,'B2',{1:40,2:40});
    w.S.skipped={3:'spray REI'};
    ok(/0\/6 below floor/.test(w.roomHead()),'a table with no readings adds nothing to the counts');
    ok(!/stabs taken there/.test(w.roomPara()),'…and the paragraph does not claim otherwise');
    ok(errors.length===0,'no runtime errors (collapse): '+errors.join('|'));
    w.close(); }

  // ================= 4. room access block =================
  { const {w,d,errors}=boot(null); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C3"]').click();
    d.getElementById('accbtn').click(); await sleep(20);
    ok(!d.getElementById('accsheet').classList.contains('hide'),'access sheet opens from the setup bar');
    const ac=[].map.call(d.querySelectorAll('#accbody .chip'),x=>x.dataset.w);
    ok(ac.join('|')==='spray REI|crew working|other','access reasons offered: '+ac.join(' · '));
    d.getElementById('accnote').value='trim crew in until 3';
    [].find.call(d.querySelectorAll('#accbody .chip'),x=>x.dataset.w==='crew working').click();
    d.getElementById('accclose').click(); await sleep(20);
    ok(d.getElementById('accbtn').classList.contains('set'),'setup bar button shows access is set');
    ok(w.S.access && w.S.access.reason==='crew working','access held on state before Start');
    d.getElementById('demo').click();
    d.getElementById('cfg_bag').value='2';
    d.getElementById('startbtn').click(); await sleep(50);
    ok(w.S.access && w.S.access.reason==='crew working','Start commits it rather than clearing it');
    for(let i=0;i<3;i++) await demoStab(w,d);
    d.getElementById('exit').click(); await sleep(50);
    const room=d.getElementById('wbroom').value;
    ok(/Room access: crew working — trim crew in until 3/.test(room),'access appears in the room notes paragraph');
    ok(!/Room access/.test(d.getElementById('wbrow').value),'access does not leak into the row notes');
    ok(errors.length===0,'no runtime errors (access): '+errors.join('|'));
    w.close(); }

  // ================= 5. peg chips =================
  { const {w,d,errors}=boot(null); await sleep(50);
    const flat={}; w.PEGS.forEach(p=>p[1].forEach(x=>flat[x]=p[0]));
    ok(!flat['wilted']&&!flat['drooping']&&!flat['fading']&&!flat['necrosis'],'wilted/drooping/fading/necrosis removed');
    ok(flat['bleaching']==='bud'&&flat['foxtailing']==='bud'&&flat['herm']==='bud','bleaching, foxtailing and herm are the bud group');
    ok(flat['rolled shoulders']==='posture'&&flat['windburn']==='damage','rolled shoulders and windburn renamed');
    ok(w.PEGS.map(p=>p[1].join('|')).join('||').indexOf('dripper|emitter|line|crew')>=0,'blocked is dripper/emitter/line/crew');
    ok(w.ACCESS.indexOf('spray REI')>=0 && flat['spray REI']===undefined,'room-wide spray REI moved to the access sheet, off the chips');
    ok(errors.length===0,'no runtime errors (chips): '+errors.join('|'));
    w.close(); }

  // ================= 6. retired chip values from earlier sweeps still render =
  { // showHist lists everything after the newest entry, so seed two
    const hist=[{room:'B2',ts:Date.now()-1800e3,when:'9/7/2026, 9:00:00 AM',n:9,mode:'sweep',med:40.0,csv:'y',wb:'newer'},
                {room:'C3',ts:Date.now()-3600e3,when:'9/6/2026, 8:00:00 AM',n:6,mode:'sweep',med:33.0,
                 csv:'x', wb:'old combined block', notes:{'1':'drooping · fading'}, free:{'1':'old note'}}];
    const {w,d,errors}=boot({'stab_hist':JSON.stringify({v:1,items:hist}),
      'stab_prev':JSON.stringify({'C3|1|front|reference':{d:'9/6/2026',v:33,e:4}})}); await sleep(50);
    d.querySelector('#rooms .rm[data-room="C3"]').click();
    d.getElementById('demo').click(); d.getElementById('cfg_bag').value='2';
    d.getElementById('startbtn').click(); await sleep(50);
    await demoStab(w,d);
    d.getElementById('exit').click(); await sleep(50);
    const hb=d.querySelector('#hist .hb');
    if(hb){ hb.click(); await sleep(20);
      ok(/drooping/.test(d.getElementById('histnotes').textContent),'retired chip values still render in history');
      ok(d.getElementById('wbroom').value==='old combined block','an old entry with only the combined block lands in the room-notes box');
      ok(d.getElementById('wbrow').value==='','…and the row-notes box is left empty rather than showing the wrong half'); }
    else ok(false,'could not find a history button to restore');
    w.S.notes['1']='drooping · fading';
    w.openPegs(1); await sleep(20);
    const chips=[].map.call(d.querySelectorAll('#pegs .chip'),x=>x.dataset.w);
    ok(chips.indexOf('drooping')>=0 && chips.indexOf('fading')>=0,'retired values shown as chips so they are not invisibly sticky');
    ok(/from an earlier sweep/.test(d.getElementById('pegs').textContent),'…under their own heading');
    ok(errors.length===0,'no runtime errors (legacy): '+errors.join('|'));
    w.close(); }

  // ================= 7. the voice readout is gone, with no dead references ==
  { const {w,d,errors}=boot(null); await sleep(50);
    ok(typeof w.say==='undefined','say() is gone');
    ok(w.S.speech===undefined,'S.speech is gone');
    ok(w.PREF.voice===undefined,'PREF.voice is gone');
    ok(d.getElementById('voice')===null,'the voice toggle is gone from setup');
    ok(d.getElementById('pegdictate')===null,'the dictate button is gone from the note box');
    w.savePrefs();
    const pref=JSON.parse(w.localStorage.getItem('stab_setup')||'{}');
    ok(!('voice' in pref),'saved prefs carry no voice key: '+JSON.stringify(pref));
    // strip comments first: a changelog entry naming a deleted symbol is a
    // record of the removal, not a live reference to it
    const strip=t=>t.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
    const src=['app.js','pure.js'].map(f=>strip(fs.readFileSync(path.join(dir,f),'utf8'))).join('\n')+
      strip(fs.readFileSync(file,'utf8').replace(/<!--[\s\S]*?-->/g,''));   // raw markup, not the inlined build
    const dead=/speechSynthesis|SpeechSynthesisUtterance|S\.speech|PREF\.voice|pegdictate|voice readout/.exec(src);
    ok(!dead,'no dead voice references in the sources'+(dead?': '+dead[0]:''));
    ok(errors.length===0,'no runtime errors (voice): '+errors.join('|'));
    w.close(); }

  console.log(out.join('\n'));
  process.exit(out.some(l=>l.startsWith('FAIL'))?1:0);
})().catch(e=>{ console.log('HARNESS EXCEPTION',e); process.exit(2); });

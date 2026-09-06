const fs=require('fs');
const path=require('path');
const D=path.dirname(process.env.APP||'./pure.js');
const roomsSrc=fs.readFileSync(path.join(D,'rooms.js'),'utf8');
const pureSrc =fs.readFileSync(path.join(D,'pure.js'),'utf8');
// stub the app-side globals the pure half reaches for at call time
const pre=`var S={room:null,rows:[],notes:{},free:{},feedEC:null,feedPH:null,side:'standard',dir:'up',op:'APG',mode:'sweep',triage:[]};
var DEMO=false; var HIST=[]; function getHist(){return HIST;}`;
const code=pre+'\n'+roomsSrc+'\n'+pureSrc+
'\nmodule.exports={S,ROOMS,mergePrevText,prevTs,FLOOR,FEEDEC,floorFor,med,checkLines,buildWorkbook,feelWord,byTable,setHist:function(h){HIST=h;},hoursSinceShot,dofNow,buildRoute,poreEC,permCounts,vwcCounts,parseText,frameBytes,crc16,rxBytes};';
fs.writeFileSync('lib.js',code);
module.exports=require('./lib.js');
// CSV loader -> S.rows shape used by doCommit
function num(x){ return x===''?null:+x; }
function loadCsv(file){
  const txt=fs.readFileSync(file,'utf8').trim().split('\n');
  const head=txt[0].split(',');
  function parseLine(l){ const out=[];let cur='',q=false; for(let i=0;i<l.length;i++){const ch=l[i]; if(q){ if(ch==='"'){ if(l[i+1]==='"'){cur+='"';i++;} else q=false;} else cur+=ch;} else { if(ch==='"') q=true; else if(ch===','){out.push(cur);cur='';} else cur+=ch;}} out.push(cur); return out; }
  return txt.slice(1).map(l=>{ const c=parseLine(l); const o={}; head.forEach((h,i)=>o[h]=c[i]);
    const t=isNaN(+o.Table)?o.Table:+o.Table;
    return {date:o.Date,time:o.Time,room:o.Room,table:t,position:o.Position,depth:o.Depth,plant:o.Plant,strain:o.Strain,flags:o.Flags,
      hrs:o['Hrs since shot'],mode:o.Mode,dir:o.Dir,bag:+o['Bag gal'],media:o.Media,side:o.Side,vwc:+o.VWC,ec:num(o['Pore EC']),bulk:+o['Bulk EC'],
      tmp:(+o['Temp F']-32)*5/9,flag:o['Below floor']==='YES',raw:o.Raw,op:o.Operator,frame:o.Frame,batt:num(o.Batt),lat:num(o['Lat ms']),feedEC:num(o['Feed EC']||''),feedPH:num(o['Feed pH']||'')};
  });
}
module.exports.loadCsv=loadCsv;

const L=require('./harness.js'); const S=L.S; const fs=require('fs'); const path=require('path');
// Fixture CSVs live beside this script, not in whatever directory it was invoked from.
const files=fs.readdirSync(__dirname).filter(f=>/_2026-09-01_/.test(f)).sort();
for(const f of files){
  const rows=L.loadCsv(path.join(__dirname,f));
  S.room=rows[0].room; S.rows=rows; S.notes={}; S.free={}; S.feedEC=null; S.feedPH=null; S.mode=rows[0].mode;
  // notes from CSV row notes col are already merged; put them into S.notes by table
  rows.forEach(r=>{ /* Row notes col not loaded; skip */ });
  L.ROOMS[S.room].bag=rows[0].bag;
  const out=L.buildWorkbook();
  console.log('\n######## '+f+' ('+rows.length+' rows, bag '+rows[0].bag+', floor '+L.floorFor(S.room)+', tank '+(L.tankFor(S.room)||'none')+')');
  console.log(out);
}

const L=require('./harness.js'); const S=L.S;
function mk(room,rows,opts){ S.room=room; S.notes={}; S.free={}; S.feedEC=(opts&&opts.feed)||null; S.feedPH=null; S.mode=(opts&&opts.mode)||'sweep';
  S.rows=rows.map(function(r,i){ return Object.assign({date:'9/3/2026',time:'08:0'+(i%10)+':00',room:room,position:'center',depth:'reference',plant:'',strain:'',flags:'',hrs:'2.0',mode:S.mode,dir:'up',bag:L.ROOMS[room].bag,media:'Bio365',side:'standard',ec:4,bulk:0.5,tmp:25,flag:false,raw:''},r); });
  S.rows.forEach(function(r){ r.flag=r.vwc<L.floorFor(room); });
  return L.checkLines(); }
function show(t,lines){ console.log('\n== '+t); console.log(lines.length?lines.join('\n'):'nothing flagged'); }
// 1. triage: one table, all below floor
show('TRIAGE one table (T5) all below floor', mk('B2',[{table:5,vwc:12,position:'front'},{table:5,vwc:14},{table:5,vwc:13,position:'header'}],{mode:'triage'}));
// 2. triage: two tables, one wet one dry -> outlier symmetry
show('TRIAGE two tables T3=45 T5=18', mk('B2',[{table:3,vwc:44,position:'front'},{table:3,vwc:45},{table:3,vwc:46,position:'header'},{table:5,vwc:18,position:'front'},{table:5,vwc:18},{table:5,vwc:19,position:'header'}],{mode:'triage'}));
// 3. spot mode: table '?'
show('SPOT mode 6 spots, 4 below floor', mk('C4',[{table:'?',vwc:20,position:'spot'},{table:'?',vwc:18,position:'spot'},{table:'?',vwc:40,position:'spot'},{table:'?',vwc:25,position:'spot'},{table:'?',vwc:22,position:'spot'},{table:'?',vwc:41,position:'spot'}],{mode:'spot'}));
// 4. collapse swallowing an outlier: 11 tables, 8 mildly below floor (18-21), T7 at 9 (far below)
var rows=[]; for(var t=1;t<=11;t++){ var v=(t<=8)?19+(t%3):(t===11?9:30); [ 'front','center','header'].forEach(function(p){ rows.push({table:t,vwc:v+(p==='center'?1:0),position:p}); }); }
show('COLLAPSE: 8 tables at 19-21 (floor 22), T11 at 9, T9/T10 at 30 — does T11 survive?', mk('B2',rows));
// 5. inverted profile
show('INVERTED: mid 40 above ref 30 at 2h', mk('B2',[{table:2,vwc:30,position:'front'},{table:2,vwc:40,position:'front',depth:'mid-bag'},{table:2,vwc:31},{table:2,vwc:41,depth:'mid-bag'},{table:2,vwc:30,position:'header'},{table:2,vwc:39,position:'header',depth:'mid-bag'}]));
// 6. dilution with measured feed 3.2 vs constant 2.5: table EC 1.7 at moisture 28
show('DILUTION feed 3.2: EC 1.7 at 28% (floor 22)', mk('B2',[{table:4,vwc:28,ec:1.7,position:'front'},{table:4,vwc:29,ec:1.8},{table:4,vwc:27,ec:1.6,position:'header'},{table:6,vwc:30,ec:4},{table:8,vwc:31,ec:4}],{feed:3.2}));
show('same table with feed 2.5', mk('B2',[{table:4,vwc:28,ec:1.7,position:'front'},{table:4,vwc:29,ec:1.8},{table:4,vwc:27,ec:1.6,position:'header'},{table:6,vwc:30,ec:4},{table:8,vwc:31,ec:4}],{feed:2.5}));
// 7. water room (feed 0): no-feed rule silently disabled
show('WATER ROOM A3 (feed 0) with 3 near-zero-EC dry readings', mk('A3',[{table:1,vwc:15,bulk:0.05,ec:null},{table:1,vwc:14,bulk:0.04,ec:null},{table:1,vwc:16,bulk:0.05,ec:null},{table:2,vwc:35},{table:3,vwc:36},{table:4,vwc:34}]));
// 8. strain rule with 3 tables, one high one low
show('STRAIN 3 tables 25/37/23 (A1 Durban case)', mk('B2',[{table:1,vwc:25,strain:'X'},{table:2,vwc:37,strain:'X'},{table:3,vwc:23,strain:'X'},{table:4,vwc:30,strain:'Y'},{table:5,vwc:30,strain:'Y'}]));
// 9. one table only, sweep mode (e.g. ended early)
show('SWEEP ended after 1 table, 2 of 3 below floor', mk('B2',[{table:1,vwc:20,position:'front'},{table:1,vwc:21},{table:1,vwc:30,position:'header'}]));
// 10. numeric sort with '?' key mixed
show('MIXED spot rows + table rows (extra plant after spot?)', mk('B2',[{table:'?',vwc:20},{table:3,vwc:20},{table:3,vwc:21},{table:12,vwc:35}]));

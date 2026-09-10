/* =====================================================================
   rooms.js — the weekly facility data. EDIT THIS FILE ON MONDAYS.
   Nothing else needs touching for schedule changes, move-ins, strain
   maps or feed targets. Bump asOf when you edit; the setup screen
   shows it and warns past seven days.
   Load order: rooms.js -> pure.js -> app.js.
   ===================================================================== */
var ROOMDATA_ASOF='9/3/2026';

/* mL per plant per day, as punched into Growlink.
   C3 corrected 9/10/2026 from the operator's own schedule table: 997.5 across
   the room, with T7 and T8 raised to 1330 (14 min vs 10.5 at 95 mL/min/plant).
   This is the room figure; the per-table exception is in SCHED_ML_TABLE below.
   The other rooms here have not been re-checked against the portal since 9/3
   and C3 was wrong by a third, so treat them as unverified. */
var SCHED_ML={A1:996,A2:996,A3:1890,A4:2269,A5:1453,A6:1750,A7:1797,
 B1:1470,B2:997,B3:1480,B4:1292,B5:1798,B6:1688,
 C1:1713,C2:1245,C3:997.5,C4:4322,C5:2152,C6:1688};

/* Tables that differ from their room's figure. Only what has been confirmed
   table by table goes here — a room absent from this map is uniform as far
   as anyone has checked, which is not the same as known to be uniform. */
var SCHED_ML_TABLE={ C3:{7:1330, 8:1330} };

/* table count, bag size, media per room (bag can be overridden per room
   at sweep start; that override lives in stab_roomcfg, not here) */
var ROOMS={
 A1:{t:12,bag:2,media:'Bio365'}, A2:{t:12,bag:2,media:'Bio365'},
 A3:{t:12,bag:2,media:'Mother Earth coco'}, A4:{t:12,bag:1.25,media:'Bio365'},
 A5:{t:12,bag:1.25,media:'Bio365'}, A6:{t:12,bag:1.25,media:'Bio365'},
 A7:{t:12,bag:1.25,media:'Bio365'},
 B1:{t:11,bag:2,media:'Bio365'}, B2:{t:11,bag:2,media:'Bio365'},
 B3:{t:11,bag:1.25,media:'Bio365'}, B4:{t:11,bag:1.25,media:'Bio365'},
 B5:{t:11,bag:1.25,media:'Bio365'}, B6:{t:11,bag:2,media:'Bio365'},
 C1:{t:11,bag:2,media:'Bio365'}, C2:{t:11,bag:2,media:'Bio365'},
 C3:{t:11,bag:1.25,media:'Bio365'}, C4:{t:11,bag:1.25,media:'Bio365'},
 C5:{t:11,bag:1.25,media:'Bio365'}, C6:{t:11,bag:2,media:'Bio365'},

 /* Not a production room. A bench fixture for testing the probe and the
    app against a known bag. kind:'test' keeps it out of the coverage
    count, the not-seen list and the EOD swept list, and it is deliberately
    absent from SCHED, DOF, SCHED_ML, FEEDEC and RMAP — every lookup that
    reads those must tolerate a room that is missing, and read as unknown
    rather than invent a zero. */
 BENCH:{t:4,bag:2,media:'peat mix',kind:'test'}
};

/* strain by table + flags: U underlights, T saucer */
var RMAP={
 A1:{"1":["Purple Chem",""],"2":["Purple Chem","T"],"3":["Purple Chem",""],"4":["Durban Poison",""],"5":["Durban Poison",""],"6":["Durban Poison","T"],"7":["Wedding Cake",""],"8":["Wedding Cake",""],"9":["Wedding Cake","T"],"10":["Mule Fuel",""],"11":["Mule Fuel",""],"12":["Mule Fuel",""]},
 A2:{"1":["Sour Jack",""],"2":["Ballet Slipper",""],"3":["Pretty Privilege",""],"4":["Pretty Privilege",""],"5":["Toronja",""],"6":["Toronja",""],"7":["Cobra Kush",""],"8":["Cobra Kush",""],"9":["Cobra Kush",""],"10":["Gas Plant",""],"11":["Gas Plant",""],"12":["Gas Plant",""]},
 A3:{"1":["Gas Plant",""],"2":["Gas Plant",""],"3":["Gas Plant",""],"4":["Gas Plant","T"],"5":["King Louie OG",""],"6":["King Louie OG",""],"7":["King Louie OG","T"],"8":["King Louie OG",""],"9":["Strawberry C.R.E.A.M.","T"],"10":["Strawberry C.R.E.A.M.",""],"11":["Lemon Drop Top","T"],"12":["Lemon Drop Top",""]},
 A4:{"1":["Pineapple Express",""],"2":["Pineapple Express",""],"3":["Banana Sherbet",""],"4":["Banana Sherbet",""],"5":["Banana Sherbet","T"],"6":["Sugar Breath",""],"7":["Sour Jack",""],"8":["Ice Cream Mintz",""],"9":["King 2","T"],"10":["King 2",""],"11":["Rum Cake",""],"12":["Rum Cake",""]},
 A5:{"1":["Cobra Kush",""],"2":["Cobra Kush",""],"3":["Cobra Kush","T"],"4":["Purple Chem","T"],"5":["The Judge","T"],"6":["The Judge",""],"7":["The Judge",""],"8":["The Judge",""],"9":["Kush Mintz","T"],"10":["Kush Mintz",""],"11":["Kush Mintz",""],"12":["Kush Mintz",""]},
 A6:{"1":["Bazooka Haze",""],"2":["Biker Kush",""],"3":["Biker Kush","T"],"4":["Znowflakes",""],"5":["Mule Fuel","TU"],"6":["Mule Fuel",""],"7":["Durban Poison","T"],"8":["Durban Poison",""],"9":["King Louis OG",""],"10":["King Louis OG",""],"11":["Wedding Cake","T"],"12":["Wedding Cake","U"]},
 A7:{"1":["Cabernet","U"],"2":["Cabernet",""],"3":["White truffle","T"],"4":["Banana Kush",""],"5":["Banana Kush","T"],"6":["Honeymoon Diesel",""],"7":["Honeymoon Diesel","T"],"8":["Super Silver Haze","T"],"9":["Super Silver Haze",""],"10":["Super Silver Haze",""],"11":["GMO",""],"12":["GMO","U"]},
 B1:{"1":["Mikado",""],"2":["Mikado",""],"3":["Runna Gal","T"],"4":["Runna Gal",""],"5":["CsxLem",""],"6":["Super Runtz x Sherbanger","T"],"7":["Super Runtz x Sherbanger",""],"8":["Gelato 41",""],"9":["VOP Kush",""],"10":["VOP Kush/Lip Smackers","T"],"11":["Lip Smackers",""]},
 B2:{"1":["Trick Trick OG",""],"2":["Island Sunshine",""],"3":["Island Sunshine",""],"4":["Runna Gal",""],"5":["Sunshine Kush",""],"6":["Sunshine Kush",""],"7":["Runtz x Sunset Sherbert",""],"8":["Runtz x Sunset Sherbert",""],"9":["Kush Mintz P5",""],"10":["Kush Mintz P5",""],"11":["Gelato 41",""]},
 B3:{"1":["Sour D 2",""],"2":["Milk Bone",""],"3":["Milk Bone","T"],"4":["Glitter Bomb",""],"5":["Glitter Bomb",""],"6":["Sour D","T"],"7":["Sour D",""],"8":["Brown Sugar",""],"9":["Brown Sugar",""],"10":["MAC",""],"11":["Guavanade",""]},
 B4:{"1":["Ethanol #33",""],"2":["Cherry Paloma",""],"3":["Cherry Paloma",""],"4":["Lime Thai",""],"5":["Lime Thai","T"],"6":["Honeymoon Diesel",""],"7":["Honeymoon Diesel",""],"8":["Hot Sauce",""],"9":["Cap Junky","T"],"10":["Cap Junky",""],"11":["Pink Passionfruit",""]},
 B5:{"1":["Sour d 2",""],"2":["Sour d 2","T"],"3":["Chemlato",""],"4":["Hindu Kush","T"],"5":["IDK",""],"6":["IDK",""],"7":["The OG","T"],"8":["Cabernet",""],"9":["Cabernet",""],"10":["Sour D","T"],"11":["Sour D",""]},
 B6:{"1":["Pineapple Kush",""],"2":["Walkabout",""],"3":["GMO Punch",""],"4":["GMO Punch","U"],"5":["Super Boof",""],"6":["Super Boof",""],"7":["Blue Nerdz",""],"8":["Banana Kush","TU"],"9":["Banana Kush",""],"10":["Walkabout",""],"11":["Pineapple Kush",""]},
 C1:{"1":["Deep Space #6",""],"2":["Deep Space #6",""],"3":["Pink Passionfruit",""],"4":["Pink Passionfruit",""],"5":["Milk Bone",""],"6":["Milk Bone",""],"7":["Blue Nerdz",""],"8":["Blue Nerdz",""],"9":["Glitter Bomb",""],"10":["Glitter Bomb",""],"11":["Cap Junky",""]},
 C2:{"1":["Deep Space #6",""],"2":["Deep Space #6",""],"3":["Milk Bone",""],"4":["Milk Bone",""],"5":["Cherry Paloma",""],"6":["Hot Sauce",""],"7":["Hot sauce",""],"8":["Banana Kush",""],"9":["Banana Kush",""],"10":["Ethanol #33",""],"11":["Ethanol #33",""]},
 /* C3 re-mapped 9/10/2026 from the operator's own table list — the previous
    grow's strains were still here on 9/9 and produced a wrong tiering call.
    The saucer flags on T6 and T9 are the OLD grow's and are unconfirmed. */
 C3:{"1":["Kabuki Sour",""],"2":["Kabuki Sour",""],"3":["Kabuki Sour",""],"4":["GMO Punch",""],"5":["GMO Punch",""],"6":["GMO Punch","T"],"7":["Super Boof",""],"8":["Super Boof",""],"9":["Super Boof","T"],"10":["Triangle Kush",""],"11":["Triangle Kush",""]},
 C4:{"1":["Lemon Cherry Sherbert",""],"2":["Gello Gelato",""],"3":["Gello Gelato","T"],"4":["Chemdawg x Rainbowbeltz",""],"5":["Chemdawg x Rainbowbeltz",""],"6":["Young Gong","T"],"7":["Petro Chem",""],"8":["Purple Flamingo",""],"9":["OG Hurricane","T"],"10":["OG Hurricane",""],"11":["King Clem",""]},
 C5:{"1":["Kabuki Sour",""],"2":["Kabuki Sour","T"],"3":["Velvet Breath",""],"4":["Velvet Breath","T"],"5":["Blue Nerdz","T"],"6":["Runtz",""],"7":["Hellcat #15",""],"8":["Hellcat #15",""],"9":["Deep Space #6",""],"10":["Gorilla Glue #4",""],"11":["Gorilla Glue #4",""]},
 C6:{"1":["Mule Fuel","U"],"2":["Mule Fuel","T"],"3":["Mule Fuel / Cherry 96",""],"4":["Cabernet / Cap Junky / Guavanade / Bubba Kush",""],"5":["Guavanade",""],"6":["Cobra Kush","T"],"7":["Cap Junky",""],"8":["Cherry 96","U"],"9":["Cherry 96","T"],"10":["Cabernet",""],"11":["MAC","T"]}
};

/* first shot HH:MM, interval minutes, shots per day */
var SCHED={A1:['01:15',120,2],A2:['13:15',120,2],A3:['01:15',120,5],A4:['13:15',120,5],
 A5:['01:15',120,3],A6:['13:15',120,5],A7:['09:15',120,4],B1:['01:15',120,2],B2:['01:15',120,2],
 B3:['01:15',120,5],B4:['01:15',120,3],B5:['01:15',120,2],B6:['01:15',120,2],C1:['13:15',120,2],
 C2:['13:15',120,2],C3:['13:15',120,5],C4:['13:15',120,4],C5:['13:15',120,3],C6:['13:15',120,2]};

/* feed EC target by room; 0 = on water */
var FEEDEC={A1:2.5,A2:2.5,A3:0,A4:0,A5:2.6,A6:2.6,A7:2.6,
            B1:2.5,B2:2.5,B3:0,B4:2.5,B5:2.5,B6:2.5,
            C1:2.5,C2:2.5,C3:0,C4:2.5,C5:2.5,C6:2.5};
var DOF_REF=new Date(2026,7,28);
var DOF={A1:10,A2:9,A3:60,A4:57,A5:45,A6:38,A7:53,B1:17,B2:1,B3:64,B4:38,B5:29,B6:24,
         C1:16,C2:3,C3:63,C4:36,C5:29,C6:25};

/* Manual task durations as configured in Growlink 9/2/2026.
   Room flush = "all water". Rescue = "all feed" or an individual table. */
var MTASK={flush:{A:28,B:21,C:21}, rescue:12,
           note:'A2 splits: T1/T2 25 min, T3-T12 50 min — 4-drip vs 2-drip'};

/* Drippers per table, found in the field 9/9/2026. Identical runtimes deliver
   different volumes when the dripper count differs — A2 T1/T2 get twice what
   T3-T12 do — so volume cannot be derived from runtime without this. Flow is
   17.5 mL/dripper/min in A wing. Only the two rooms counted so far are here:
   a room absent from this map has an unknown count, not an assumed one, and
   nothing computes volume from it yet (Addendum A §4 / §6.6). */
var DRIPPERS={
 A2:{1:4,2:4,3:2,4:2,5:2,6:2,7:2,8:2,9:2,10:2,11:2,12:2},
 C3:{1:2,2:2,3:2,4:3,5:3,6:3,7:3,8:3,9:3,10:3,11:3}
};

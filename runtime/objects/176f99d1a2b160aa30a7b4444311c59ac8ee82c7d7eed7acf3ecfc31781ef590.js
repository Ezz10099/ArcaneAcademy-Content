import { CINDER_CELL, CINDER_WALK_DISTANCE } from './cinder-frames.js';

// Artwork order: front, front-left, left, rear-left, rear, rear-right, right, front-right.
export const CAMPUS_DIRECTIONS = ['S','SW','W','NW','N','NE','E','SE'];
export function campusHeading(dx, dy) {
  if (!dx && !dy) return 0;
  return (Math.round(Math.atan2(-dx, dy) / (Math.PI / 4)) + 8) % 8;
}
export function campusTurnDelta(from, to) {
  return ((to - from + 12) % 8) - 4;
}
const STAIR_EDGES = new Set([
  'frontFoot:frontTop','hallFoot:hallMid','hallMid:hallLanding',
  'libraryLanding:libraryStairs','libraryStairs:libraryTerrace',
  'dormFoot:dormMid','dormMid:dormDoor',
  'labLanding:labStairs','labStairs:labTerrace'
]);
function stairsBetween(a,b) {
  return STAIR_EDGES.has(a+':'+b) || STAIR_EDGES.has(b+':'+a);
}
// Ease only at real starts/stops; keep constant speed through ordinary waypoints.
function travelProgress(t, start, stop) {
  const ramp = .18;
  const clamp = n => Math.max(0, Math.min(1,n));
  t = clamp(t);
  const a = start ? Math.min(t,ramp) : 0;
  const b = stop ? Math.max(0,t-(1-ramp)) : 0;
  const area = t - a + a*a/(2*ramp) - b*b/(2*ramp);
  return clamp(area / (1 - (Number(start)+Number(stop))*ramp/2));
}

// Coordinates are authored against the full 920 x 1150 day/night campus artwork,
// not the horizontally scrolled viewport. Ground points are the sprite's soles.
// Outdoor links follow paved trails. Interior links are never walkable shortcuts.
const NODES = {
  "entrance": [
    470,
    1149
  ],
  "frontFoot": [
    472,
    1052
  ],
  "frontTop": [
    474,
    969
  ],
  "front": [
    474,
    937
  ],
  "frontLeft": [
    432,
    932
  ],
  "treePass": [
    406,
    923
  ],
  "southwest": [
    375,
    920
  ],
  "westRing": [
    335,
    908
  ],
  "westTurn": [
    282,
    887
  ],
  "westPath": [
    253,
    850
  ],
  "westBend": [
    257,
    825
  ],
  "westRear": [
    295,
    800
  ],
  "rearLeft": [
    340,
    785
  ],
  "rearCenter": [
    475,
    783
  ],
  "rearRight": [
    600,
    785
  ],
  "eastRear": [
    650,
    795
  ],
  "eastPath": [
    704,
    811
  ],
  "eastTurn": [
    751,
    832
  ],
  "hallFoot": [
    476,
    762
  ],
  "hallMid": [
    476,
    667
  ],
  "hallLanding": [
    478,
    601
  ],
  "hallDoor": [
    478,
    574
  ],
  "libraryFoot": [
    270,
    785
  ],
  "libraryLower": [
    235,
    758
  ],
  "libraryUpper": [
    154,
    585
  ],
  "libraryLanding": [
    166,
    603
  ],
  "libraryStairs": [
    201,
    640
  ],
  "libraryTerrace": [
    233,
    671
  ],
  "dormPath": [
    315,
    942
  ],
  "dormTurn": [
    280,
    960
  ],
  "dormFoot": [
    237,
    989
  ],
  "dormMid": [
    201,
    957
  ],
  "dormDoor": [
    165,
    925
  ],
  "labFoot": [
    680,
    786
  ],
  "labLower": [
    710,
    755
  ],
  "labUpper": [
    770,
    585
  ],
  "labLanding": [
    759,
    603
  ],
  "labStairs": [
    723,
    641
  ],
  "labTerrace": [
    700,
    671
  ],
  "trainingRear": [
    794,
    847
  ],
  "trainingPortal": [
    839,
    900
  ],
  "trainingLanding": [
    814,
    921
  ],
  "trainingCenter": [
    753,
    946
  ]
};
const TRAILS = [["entrance","frontFoot","frontTop","front","frontLeft","treePass","southwest","westRing","westTurn","westPath","westBend","westRear","rearLeft","rearCenter","rearRight","eastRear","eastPath","eastTurn","trainingRear"],["rearCenter","hallFoot","hallMid","hallLanding","hallDoor"],["westRear","libraryFoot","libraryLower"],["libraryUpper","libraryLanding","libraryStairs","libraryTerrace"],["westRing","dormPath","dormTurn","dormFoot","dormMid","dormDoor"],["eastRear","labFoot","labLower"],["labUpper","labLanding","labStairs","labTerrace"],["trainingPortal","trainingLanding","trainingCenter"]];
const LINKS = [["dormDoor","dormDoor",7000],["libraryLower","libraryUpper",6500],["libraryUpper","libraryLower",6500],["hallDoor","hallDoor",8500],["labLower","labUpper",6500],["labUpper","labLower",6500],["trainingRear","trainingPortal",4500],["trainingPortal","trainingRear",4500]];
const ITINERARY = [["walk","dormDoor"],["inside","dormDoor"],["walk","libraryLower"],["inside","libraryUpper"],["walk","libraryTerrace"],["wait",1200],["walk","libraryUpper"],["inside","libraryLower"],["walk","hallDoor"],["inside","hallDoor"],["walk","labLower"],["inside","labUpper"],["walk","labTerrace"],["wait",1200],["walk","labUpper"],["inside","labLower"],["walk","trainingRear"],["inside","trainingPortal"],["walk","trainingCenter"],["wait",2500],["walk","trainingPortal"],["inside","trainingRear"],["walk","entrance"],["wait",1200]];

export function findCampusPath(from,to){
  if(!NODES[from]||!NODES[to]) throw new Error(`Unknown campus node ${from} or ${to}`);
  const graph=new Map(Object.keys(NODES).map(n=>[n,[]]));
  for(const trail of TRAILS) for(let i=1;i<trail.length;i++){
    const a=trail[i-1],b=trail[i];
    const d=Math.hypot(NODES[a][0]-NODES[b][0],NODES[a][1]-NODES[b][1]);
    graph.get(a).push([b,d]);graph.get(b).push([a,d]);
  }
  const distance=new Map([[from,0]]),parent=new Map(),remaining=new Set(graph.keys());
  while(remaining.size){
    let node;for(const n of remaining) if(distance.has(n)&&(node===undefined||distance.get(n)<distance.get(node)))node=n;
    if(node===undefined)break;
    if(node===to){const path=[node];while(path[0]!==from)path.unshift(parent.get(path[0]));return path;}
    remaining.delete(node);
    for(const [next,length] of graph.get(node)){
      const total=distance.get(node)+length;
      if(remaining.has(next)&&total<(distance.get(next)??Infinity)){distance.set(next,total);parent.set(next,node);}
    }
  }
  throw new Error(`No outdoor path ${from} -> ${to}`);
}

export function buildCampusTour(start="entrance", itinerary=ITINERARY){
  let at=start;const stages=[];
  for(const [kind,target] of itinerary){
    if(kind==="walk"){
      const path=findCampusPath(at,target);
      for(let i=1;i<path.length;i++)stages.push({kind,from:path[i-1],to:path[i]});
      at=target;
    }else if(kind==="inside"){
      const link=LINKS.find(([a,b])=>a===at&&b===target);
      if(!link)throw new Error(`Invalid campus entrance connection ${at} -> ${target}`);
      stages.push({kind,from:at,to:target,duration:link[2]});at=target;
    }else if(kind==="wait"){
      stages.push({kind,from:at,to:at,duration:target});
    }else throw new Error(`Unknown campus action ${kind}`);
  }
  if(at!==start)throw new Error("Campus tour must finish at its starting point");
  return stages;
}

export function campusDepth(y){return .69+.43*Math.max(0,Math.min(1,(y-574)/(1150-574)));}

export function measureCampusTour(stages,width,height,baseWidth,cell,speed){
  const expanded=[];
  // Face according to the rendered map, which may be stretched by the viewport.
  const headingFor = s => {
    const a=NODES[s.from], b=NODES[s.to];
    return campusHeading((b[0]-a[0])*width/920,(b[1]-a[1])*height/1150);
  };
  const lastWalk=stages.findLast(s=>s.kind==='walk');
  let facing=lastWalk?headingFor(lastWalk):undefined;
  for (const [routeIndex,s] of stages.entries()) {
    if (s.kind === 'walk') {
      const heading=headingFor(s);
      const delta=facing===undefined?0:campusTurnDelta(facing,heading);
      const prior=expanded.at(-1);
      // Minor turns happen while walking. Pause only for a genuine reversal,
      // sharp turn, or when setting off again after a stationary visit.
      if (delta && (!prior || prior.kind==='wait' || Math.abs(delta)>=3) && prior?.kind!=='inside') {
        expanded.push({kind:'turn',from:s.from,to:s.from,duration:Math.abs(delta)*90,heading:facing,delta,routeIndex});
      }
      facing=heading;
      expanded.push({...s,heading,routeIndex,stairs:stairsBetween(s.from,s.to)});
    } else {
      expanded.push({...s,heading:facing??0,routeIndex});
      if(s.kind==='inside') facing=undefined;
    }
  }
  let end=0,walkDistance=0;
  return expanded.map((s,i)=>{
    const a=NODES[s.from],b=NODES[s.to];
    const start=[a[0]/920*width,a[1]/1150*height],finish=[b[0]/920*width,b[1]/1150*height];
    const scale=(campusDepth(a[1])+campusDepth(b[1]))/2;
    const moving=s.kind==='walk';
    const distance=moving?Math.hypot(finish[0]-start[0],finish[1]-start[1])/(baseWidth/cell*scale):0;
    const entry=moving&&expanded[i+1]?.kind==='inside';
    const exit=moving&&expanded[i-1]?.kind==='inside';
    const accelerate=moving&&expanded[i-1]?.kind!=='walk';
    const decelerate=moving&&expanded[i+1]?.kind!=='walk';
    const ease=1-(Number(accelerate)+Number(decelerate))*.09;
    // A forward stride projects to a shorter screen-space step than a sideways stride.
    // Keep the cadence stable while reducing projected speed on steep paths.
    const dx=finish[0]-start[0],dy=finish[1]-start[1];
    const projection=moving?1/Math.hypot(dx/Math.hypot(dx,dy),dy/(.70*Math.hypot(dx,dy))):1;
    const stride=projection*(s.stairs?.74:1);
    const duration=moving?distance/(speed*stride*ease)*1000:s.duration;
    const gaitDistance=distance/stride;
    const stairDirection=s.stairs?(dy<0?'up':'down'):null;
    // Start a new stride from contact after a true stop, not from the old
    // arbitrary gait phase. Consecutive path legs retain distance continuity.
    if(accelerate) walkDistance=0;
    const previousWalk=expanded[i-1]?.kind==='walk'?expanded[i-1]:null;
    const nextWalk=expanded[i+1]?.kind==='walk'?expanded[i+1]:null;
    const turnIn=previousWalk?campusTurnDelta(previousWalk.heading,s.heading):0;
    const turnOut=nextWalk?campusTurnDelta(s.heading,nextWalk.heading):0;
    const result={...s,start,finish,begin:end,end:end+duration,duration,distance:gaitDistance,walkDistance,entry,exit,accelerate,decelerate,turnIn,turnOut,stairDirection};
    end+=duration;walkDistance+=gaitDistance;return result;
  });
}

export function sampleCampusTour(tour,elapsed){
  const total=tour.at(-1)?.end;
  if(!total)return null;
  const time=elapsed>=0?elapsed%total:((elapsed%total)+total)%total;
  const s=tour.find(s=>time<s.end)||tour.at(-1);
  const local=time-s.begin;
  const fraction=Math.max(0,Math.min(1,local/s.duration));
  const progress=s.kind==='walk'?travelProgress(fraction,s.accelerate,s.decelerate):0;
  const x=s.start[0]+(s.finish[0]-s.start[0])*progress;
  const y=s.start[1]+(s.finish[1]-s.start[1])*progress;
  const mapY=NODES[s.from][1]+(NODES[s.to][1]-NODES[s.from][1])*progress;
  let opacity=s.kind==='inside'?0:1;
  if(s.entry)opacity=Math.min(opacity,Math.max(0,(s.duration-local)/Math.min(320,s.duration)));
  if(s.exit)opacity=Math.min(opacity,local/Math.min(320,s.duration));
  let angle=s.heading;
  if(s.kind==='turn') angle+=s.delta*fraction;
  if(s.kind==='walk') {
    // Anticipate a corner with a short half-turn across the two adjoining legs.
    // Position stays on the surveyed path, so steering never cuts through obstacles.
    const blend=Math.min(.24,110/s.duration);
    if(s.turnIn && fraction<blend) angle-=s.turnIn*.5*(1-fraction/blend);
    if(s.turnOut && fraction>1-blend) angle+=s.turnOut*.5*(1-(1-fraction)/blend);
  }
  const heading=(Math.round(angle)+8)%8;
  // Deceleration/acceleration near a real stop settles into a planted pose.
  // Ordinary path waypoints do not reset the gait.
  const settling=s.kind==='walk'&&((s.accelerate&&fraction<.035)||(s.decelerate&&fraction>.965));
  return {x,y,scale:campusDepth(mapY),opacity,heading,distance:s.walkDistance+s.distance*progress,moving:s.kind==='walk'&&!settling,turning:s.kind==='turn',turnProgress:fraction,turnSteps:Math.abs(s.delta??0),stairs:!!s.stairs,stairDirection:s.stairDirection,stage:s};
}

// Data-driven clip layout. Another combatant can supply different frame counts,
// a different atlas, sole anchor and stride cycle without changing navigation.
export const CINDER_CAMPUS_CLIPS=Object.freeze({
  walk:{atlas:'base',first:0,counts:[6,6,4,6,6,6,4,6]},
  idle:{atlas:'base',first:6,counts:[1,1,1,1,1,1,1,1]},
  pivot:{atlas:'special',first:12,counts:[4,4,4,4,4,4,4,4]},
  stairsUp:{atlas:'special',first:0,counts:[6,6,6,6,6,6,6,6]},
  stairsDown:{atlas:'special',first:6,counts:[6,6,6,6,6,6,6,6]},
});
export function campusMotionState(pose) {
  if(pose.turning) return 'pivot';
  if(!pose.moving) return 'idle';
  if(pose.stairs) return pose.stairDirection==='up'?'stairsUp':'stairsDown';
  return 'walk';
}
export function campusSpriteFrame(pose,cycle=CINDER_WALK_DISTANCE.at(-1),clips=CINDER_CAMPUS_CLIPS){
  const state=campusMotionState(pose),row=pose.heading;
  let clip=clips[state];
  let phase=((pose.distance%cycle)+cycle)%cycle/cycle;
  // Turning is time-driven: ground distance is zero during a planted pivot.
  // A complete weight-transfer phase occurs for each 45-degree turn step.
  if(state==='pivot'){
    const t=Math.max(0,Math.min(1,pose.turnProgress??0));
    if(t<.06||t>.94){clip=clips.idle;phase=0;}
    else phase=(t*(pose.turnSteps||1))%1;
  }
  const count=clip.counts[row];
  return {atlas:clip.atlas??'base',row,col:clip.first+Math.min(count-1,Math.floor(phase*count))};
}

const CINDER = {
  selector: '.campus-walker--cinder', url: './final-assets/academy/cinder-motion-v3.webp',
  specialUrl: './final-assets/academy/cinder-special-motion.webp',
  cell: CINDER_CELL, sourceCell: 128, sourceSole: 110.5, cycle: CINDER_WALK_DISTANCE.at(-1),
  speed: 165, sole: 329, frame: campusSpriteFrame, clips:CINDER_CAMPUS_CLIPS,
};

// Preserve route position between Academy renders, even when it is temporarily
// unmounted. This is ambient state only; it does not touch player saves.
const campusPositions=new Map();
export function campusPositionAt(tour, elapsed) {
  if(!tour?.length) return null;
  const t=((elapsed%tour.at(-1).end)+tour.at(-1).end)%tour.at(-1).end;
  const s=tour.find(stage=>t<stage.end)||tour.at(-1);
  return {routeIndex:s.routeIndex,kind:s.kind,fraction:(t-s.begin)/s.duration};
}
export function restoreCampusPosition(tour,position) {
  if(!position||!tour?.length) return 0;
  const s=tour.find(x=>x.routeIndex===position.routeIndex&&x.kind===position.kind);
  if(s) return s.begin+s.duration*Math.max(0,Math.min(.999999,position.fraction));
  // A different viewport can add or remove a sharp-turn pause. Match the
  // original route segment, not the shifted index in the expanded timeline.
  return tour.find(x=>x.routeIndex===position.routeIndex&&x.kind==='walk')?.begin??0;
}

// Surveyed foreground silhouettes in the common 920 x 1150 campus coordinates.
// This is a per-actor alpha mask, not a copied patch of background artwork.
// It therefore preserves water/lighting effects and works with multiple actors.
const CAMPUS_FOREGROUND=[{"name":"dorm-roof","depth":[244,842,244,920],"points":[[0,779],[18,749],[45,720],[77,710],[82,699],[94,710],[120,711],[153,730],[173,732],[199,756],[234,781],[244,806],[238,838],[206,849],[180,826],[157,818],[133,839],[100,836],[55,845],[0,844]]},{"name":"dorm-side-wall","depth":[208,949,244,912],"points":[[205,824],[224,812],[238,823],[235,908],[221,921],[209,940],[193,947],[192,900],[201,885]]},{"name":"dorm-left-door-pillar","depth":[133,948,150,932],"points":[[128,816],[144,805],[151,821],[151,925],[144,940],[132,950],[123,942],[123,844]]},{"name":"dorm-right-door-pillar","depth":[181,944,199,944],"points":[[180,817],[191,826],[199,850],[198,921],[191,940],[181,944],[176,931],[178,855]]},{"name":"dorm-stair-left-rail","depth":[145,934,201,993],"points":[[145,913],[157,922],[166,933],[177,951],[190,965],[197,968],[200,979],[200,993],[187,989],[172,975],[158,956],[146,940]]},{"name":"dorm-stair-right-rail","depth":[209,926,273,981],"points":[[206,909],[217,903],[226,909],[232,923],[248,943],[260,951],[272,956],[273,980],[260,976],[244,960],[227,941],[209,927]]},{"name":"dorm-front-garden","depth":[244,966,360,978],"points":[[246,903],[262,899],[276,906],[287,900],[303,906],[315,916],[332,920],[345,941],[360,959],[351,977],[333,981],[311,969],[290,960],[265,967],[244,959]]},{"name":"library-terrace-front-wall","depth":[58,683,150,663],"points":[[48,590],[145,590],[147,603],[139,608],[124,611],[111,613],[90,615],[66,615],[61,635],[56,662],[48,665]]},{"name":"library-stairs-left-rail","depth":[146,620,210,696],"points":[[139,580],[150,580],[159,590],[158,604],[165,614],[178,628],[189,645],[203,657],[207,655],[213,661],[213,695],[200,695],[199,672],[184,656],[172,638],[154,618],[145,607]]},{"name":"library-stairs-right-rail","depth":[208,609,273,679],"points":[[205,584],[218,584],[224,595],[224,613],[240,631],[256,647],[266,647],[274,655],[274,683],[262,684],[260,662],[244,645],[229,626],[214,612]]},{"name":"library-lower-door-column","depth":[213,766,232,766],"points":[[211,680],[223,673],[231,681],[233,755],[225,765],[211,766]]},{"name":"library-lower-right-pillar","depth":[257,769,271,769],"points":[[254,676],[264,667],[275,672],[276,747],[269,765],[257,768]]},{"name":"hall-left-stair-wall","depth":[420,604,394,767],"points":[[412,574],[424,575],[434,584],[434,600],[429,621],[425,640],[422,660],[418,684],[414,706],[410,730],[408,758],[396,768],[383,763],[385,738],[394,710],[399,683],[402,654],[405,628],[410,607]]},{"name":"hall-right-stair-wall","depth":[541,604,557,767],"points":[[529,574],[541,575],[551,583],[551,607],[547,625],[550,650],[551,676],[555,703],[559,732],[565,758],[560,768],[546,764],[540,737],[536,711],[532,685],[529,658],[527,633],[528,608]]},{"name":"hall-left-lamp","depth":[386,792,403,792],"points":[[385,753],[389,748],[390,737],[394,733],[399,737],[399,746],[405,752],[403,763],[400,768],[401,775],[406,780],[405,791],[382,793],[381,780],[388,775],[388,767]]},{"name":"hall-right-lamp","depth":[606,795,623,795],"points":[[605,753],[610,749],[610,738],[615,733],[620,738],[620,749],[625,753],[624,766],[621,770],[622,780],[629,783],[628,794],[602,795],[602,783],[608,780],[609,769]]},{"name":"alchemy-stair-left-rail","depth":[704,676,758,610],"points":[[694,652],[706,641],[717,628],[727,615],[738,602],[744,582],[755,582],[763,590],[764,608],[751,619],[740,634],[728,647],[716,660],[717,676],[705,681],[693,674]]},{"name":"alchemy-stair-right-rail","depth":[784,615,825,682],"points":[[789,583],[802,582],[808,590],[807,610],[802,620],[798,635],[793,648],[800,650],[813,647],[825,653],[825,681],[812,682],[810,665],[793,668],[783,654],[786,637],[791,620]]},{"name":"alchemy-lower-left-pillar","depth":[675,767,696,767],"points":[[675,689],[684,677],[694,682],[697,751],[688,765],[677,767]]},{"name":"alchemy-lower-right-pillar","depth":[734,769,756,769],"points":[[735,680],[748,674],[758,681],[758,753],[751,766],[734,769]]},{"name":"fountain-crystal","depth":[439,833,520,833],"points":[[473,737],[485,756],[491,775],[487,791],[500,779],[505,797],[515,792],[511,810],[519,822],[513,832],[495,837],[448,836],[435,826],[441,812],[432,802],[450,799],[447,781],[459,790],[457,769]]},{"name":"fountain-basin","depth":[316,856,636,856],"points":[[317,829],[331,818],[358,807],[388,802],[414,799],[446,797],[479,798],[514,800],[545,805],[575,811],[604,821],[624,833],[636,849],[632,864],[619,878],[599,891],[571,900],[539,909],[506,915],[471,919],[435,915],[401,910],[372,900],[347,889],[328,876],[318,861]]},{"name":"rear-west-cypress","depth":[375,809,393,809],"points":[[384,755],[388,766],[392,780],[395,797],[392,808],[374,809],[370,801],[374,783],[378,768]]},{"name":"rear-east-cypress","depth":[563,810,584,810],"points":[[572,754],[579,768],[582,785],[585,802],[581,810],[563,810],[561,799],[564,780]]},{"name":"west-cypress","depth":[283,886,306,886],"points":[[295,796],[302,817],[306,840],[306,864],[302,882],[283,885],[277,866],[283,845],[284,821]]},{"name":"east-cypress","depth":[644,884,666,884],"points":[[650,789],[657,808],[662,826],[666,850],[665,878],[644,883],[638,867],[642,843],[643,822]]},{"name":"front-left-cypress","depth":[396,947,426,947],"points":[[409,847],[416,862],[419,880],[424,901],[426,927],[423,943],[396,944],[391,927],[395,905],[398,881],[404,861]]},{"name":"front-right-cypress","depth":[533,947,560,947],"points":[[545,849],[551,866],[556,888],[560,912],[560,942],[533,945],[528,924],[532,906],[534,884],[540,862]]},{"name":"fountain-west-lamp","depth":[344,866,369,866],"points":[[348,807],[353,805],[354,790],[359,785],[363,790],[364,805],[369,810],[369,824],[364,831],[366,840],[372,844],[371,863],[347,865],[343,858],[344,844],[350,839],[351,829],[348,824]]},{"name":"fountain-east-lamp","depth":[580,868,607,868],"points":[[586,807],[590,804],[591,790],[596,786],[601,790],[601,804],[606,810],[606,823],[601,830],[602,840],[609,845],[608,865],[583,868],[579,860],[580,845],[586,838],[588,829],[585,823]]},{"name":"front-left-stair-post","depth":[391,1046,417,1046],"points":[[392,961],[398,956],[399,941],[405,934],[410,942],[410,955],[416,961],[415,979],[409,985],[410,996],[418,1001],[418,1044],[390,1045],[390,1001],[397,996],[398,984],[393,979]]},{"name":"front-right-stair-post","depth":[535,1046,559,1046],"points":[[534,961],[541,956],[541,942],[547,934],[552,942],[552,956],[558,961],[557,979],[552,984],[553,996],[562,1001],[562,1044],[532,1045],[532,1001],[540,996],[540,984],[535,979]]},{"name":"entrance-left-post","depth":[338,1114,369,1114],"points":[[342,1021],[347,1016],[349,1004],[354,998],[359,1004],[360,1016],[365,1021],[365,1038],[359,1044],[361,1055],[371,1063],[368,1112],[335,1114],[335,1065],[344,1056],[346,1044],[342,1038]]},{"name":"entrance-right-post","depth":[583,1114,618,1114],"points":[[588,1021],[594,1016],[595,1004],[601,998],[606,1004],[606,1016],[612,1021],[612,1038],[606,1044],[608,1055],[619,1063],[616,1112],[584,1114],[583,1065],[591,1056],[592,1044],[588,1038]]},{"name":"training-back-rail","depth":[596,938,810,899],"points":[[595,914],[606,908],[622,901],[639,894],[660,889],[681,884],[707,879],[732,875],[754,875],[778,878],[803,883],[810,900],[788,897],[770,894],[754,894],[732,893],[707,894],[682,899],[660,905],[637,913],[620,921],[604,932],[596,938]],"scope":"outside-deck"},{"name":"training-west-banner","depth":[607,931,636,931],"points":[[606,853],[612,847],[616,840],[620,846],[631,849],[637,859],[637,912],[624,927],[611,922],[608,906],[606,872]]},{"name":"training-back-banner","depth":[752,899,780,899],"points":[[752,842],[758,837],[762,831],[767,839],[777,842],[782,850],[781,890],[767,899],[755,889]],"scope":"outside-deck"},{"name":"training-arch","depth":[799,900,882,900],"points":[[797,862],[801,840],[813,823],[827,811],[841,805],[855,811],[870,823],[881,840],[886,859],[886,899],[873,904],[866,899],[866,862],[861,848],[851,839],[841,835],[830,840],[821,849],[816,864],[816,899],[800,904]]},{"name":"training-front-rail","depth":[589,983,919,983],"points":[[589,951],[598,955],[610,967],[629,978],[652,988],[680,997],[709,1004],[743,1006],[773,1007],[806,1002],[838,995],[866,984],[890,970],[907,955],[919,947],[919,974],[904,987],[883,1000],[857,1013],[827,1024],[797,1031],[768,1035],[739,1034],[707,1031],[676,1024],[650,1015],[624,1004],[604,991],[589,978]],"scope":"deck-front"},{"name":"training-front-left-post","depth":[646,1014,677,1014],"points":[[650,956],[656,950],[657,939],[663,934],[668,940],[668,950],[674,956],[673,968],[668,973],[670,985],[679,990],[678,1013],[645,1015],[644,990],[652,985],[653,973],[650,968]]},{"name":"training-front-right-banner","depth":[836,1010,869,1010],"points":[[836,921],[843,915],[847,907],[853,915],[864,919],[869,927],[869,984],[855,1005],[840,995],[836,980]]}];
const MASKS=CAMPUS_FOREGROUND.map(spec=>{
  const xs=spec.points.map(p=>p[0]),ys=spec.points.map(p=>p[1]);
  return {...spec,bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};
});
export function campusForegroundVisible(depth,groundY){return groundY<depth;}
function foregroundDepth(spec,x){
  const [x0,y0,x1,y1]=spec.depth;
  const t=x0===x1?0:Math.max(0,Math.min(1,(x-x0)/(x1-x0)));
  return y0+(y1-y0)*t;
}
function onTrainingDeck(stage){
  return [stage?.from,stage?.to].every(n=>['trainingPortal','trainingLanding','trainingCenter'].includes(n));
}
// Transform world-space polygons to the actor canvas. Select only objects
// that are in front of the soles AND can actually overlap the sprite rectangle.
export function campusOcclusionPolygons(pose,mapWidth,mapHeight,spriteWidth,spriteHeight,cell,sole){
  if(!mapWidth||!mapHeight||!spriteWidth||!spriteHeight||!pose.scale)return [];
  const x=pose.x/mapWidth*920,y=pose.y/mapHeight*1150;
  const w=spriteWidth*pose.scale/mapWidth*920,h=spriteHeight*pose.scale/mapHeight*1150;
  const left=x-w/2,top=y-h*sole/cell,right=left+w,bottom=top+h;
  const deck=onTrainingDeck(pose.stage);
  return MASKS.filter(spec=>{
    if(spec.scope==='outside-deck'&&deck)return false;
    if(spec.scope==='deck-front'&&!deck)return false;
    const [x0,y0,x1,y1]=spec.bounds;
    return right>x0&&left<x1&&bottom>y0&&top<y1&&campusForegroundVisible(foregroundDepth(spec,x),y);
  }).map(spec=>({name:spec.name,points:spec.points.map(([px,py])=>[(px-left)/w*cell,(py-top)/h*cell])}));
}
export function paintCampusOcclusion(ctx,polygons){
  if(!polygons.length)return;
  ctx.save();
  ctx.globalCompositeOperation='destination-out';
  ctx.fillStyle='#000';
  for(const {points} of polygons){
    ctx.beginPath();ctx.moveTo(...points[0]);
    for(const p of points.slice(1))ctx.lineTo(...p);
    ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

export function mountCampusWalker(map, actor = CINDER) {
  const walker = map?.querySelector(actor.selector);
  const canvas = walker?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return undefined;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const atlas = new Image();
  const special=actor.specialUrl?new Image():null;
  const stages = buildCampusTour();
  // Put the shadow in the same canvas as the character so occluders clip
  // both. Avoid a second post-composite CSS shadow bleeding over silhouettes.
  const shadowRule=document.createElement('style');
  shadowRule.textContent='.campus-walker--masked::before{content:none!important}';
  walker.after(shadowRule);
  walker.classList.add('campus-walker--masked');
  function refreshLighting(){
    walker.style.filter=map.dataset.lighting==='night'?'brightness(.74) saturate(.78)':'none';
  }
  refreshLighting();
  let tour, frame, previous, elapsed = 0, disposed = false, loaded = false;
  let spriteWidth=0,spriteHeight=0;
  let position=campusPositions.get(actor.selector);
  const sole = actor.sole / actor.cell * 100;
  walker.style.transformOrigin = '50% ' + sole + '%';

  function measure() {
    const width = walker.offsetWidth;
    if (!width || !map.clientWidth || !map.clientHeight) return;
    spriteWidth=width;spriteHeight=walker.offsetHeight||width;
    position=campusPositionAt(tour,elapsed)??position;
    tour=measureCampusTour(stages,map.clientWidth,map.clientHeight,width,actor.cell,actor.speed);
    elapsed=restoreCampusPosition(tour,position);
  }
  function draw(now) {
    frame = undefined;
    if (disposed || document.hidden || !tour) {
      previous = undefined;
      return;
    }
    if (reducedMotion.matches) {
      walker.classList.remove('campus-walker--ready');
      previous = undefined;
      return;
    }
    elapsed += previous === undefined ? 0 : Math.max(0, Math.min(80, now - previous));
    previous = now;
    const pose = sampleCampusTour(tour, elapsed);
    if (pose.opacity === 0) {
      walker.classList.remove('campus-walker--ready');
    } else {
      walker.style.left = pose.x + 'px';
      walker.style.top = pose.y + 'px';
      walker.style.transform = 'translate(-50%, -' + sole + '%) scale(' + pose.scale + ')';
      walker.style.opacity = String(pose.opacity);
      let selected = actor.frame(pose, actor.cycle, actor.clips);
      // Do not hide a character if an optional animation asset fails to load.
      if(selected.atlas==='special'&&!special?.naturalWidth){
        selected=actor.frame({...pose,turning:false,stairs:false},actor.cycle,actor.clips);
      }
      const art=selected.atlas==='special'?special:atlas;
      ctx.clearRect(0, 0, actor.cell, actor.cell);
      ctx.fillStyle='rgba(21,19,32,.30)';
      ctx.beginPath();ctx.ellipse(actor.cell/2,actor.sole,actor.cell*.18,actor.cell*.027,0,0,Math.PI*2);ctx.fill();
      const offset=actor.sole-actor.cell*(actor.sourceSole??actor.sourceCell*actor.sole/actor.cell)/actor.sourceCell;
      ctx.drawImage(art,selected.col*actor.sourceCell,selected.row*actor.sourceCell,
        actor.sourceCell,actor.sourceCell,0,offset,actor.cell,actor.cell);
      paintCampusOcclusion(ctx,campusOcclusionPolygons(pose,map.clientWidth,map.clientHeight,spriteWidth,spriteHeight,actor.cell,actor.sole));
      walker.classList.add('campus-walker--ready');
    }
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    if (!loaded || disposed || document.hidden || frame !== undefined) return;
    frame = requestAnimationFrame(draw);
  }
  function refresh() { measure(); sync(); }
  const resize = new ResizeObserver(refresh);
  resize.observe(map);
  const lighting = new MutationObserver(() => {
    // Day and night use the same architecture; never teleport at dusk.
    refreshLighting();
    refresh();
  });
  lighting.observe(map, { attributes: true, attributeFilter: ['data-lighting'] });
  function resume() {
    previous = undefined;
    if (reducedMotion.matches) walker.classList.remove('campus-walker--ready');
    else refresh();
  }
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', resume);
  atlas.src=actor.url;
  if(special) special.src=actor.specialUrl;
  Promise.all([atlas.decode(),special?special.decode().catch(()=>{}):Promise.resolve()])
    .then(() => { loaded=true; if(!disposed)refresh(); }).catch(()=>{});
  return () => {
    const lastPosition=campusPositionAt(tour,elapsed)??position;
    if(lastPosition)campusPositions.set(actor.selector,lastPosition);
    disposed = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
    resize.disconnect();
    lighting.disconnect();
    shadowRule.remove();
    walker.classList.remove('campus-walker--masked');
    walker.style.filter='';
    walker.classList.remove('campus-walker--ready');
    document.removeEventListener('visibilitychange', resume);
    reducedMotion.removeEventListener('change', resume);
  };
}

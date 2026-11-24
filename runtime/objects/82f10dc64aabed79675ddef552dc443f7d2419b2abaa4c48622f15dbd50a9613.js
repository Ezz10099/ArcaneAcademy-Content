import { CINDER_CELL, CINDER_WALK_DISTANCE, cinderDistanceFrame } from './cinder-frames.js';

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
  for (const s of stages) {
    if (s.kind === 'walk') {
      const heading=headingFor(s);
      const delta=facing===undefined?0:campusTurnDelta(facing,heading);
      const prior=expanded.at(-1);
      // Minor turns happen while walking. Pause only for a genuine reversal,
      // sharp turn, or when setting off again after a stationary visit.
      if (delta && (!prior || prior.kind==='wait' || Math.abs(delta)>=3) && prior?.kind!=='inside') {
        expanded.push({kind:'turn',from:s.from,to:s.from,duration:Math.abs(delta)*90,heading:facing,delta});
      }
      facing=heading;
      expanded.push({...s,heading,stairs:stairsBetween(s.from,s.to)});
    } else {
      expanded.push({...s,heading:facing??0});
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
    const duration=moving?distance/(speed*(s.stairs?.74:1)*ease)*1000:s.duration;
    const gaitDistance=distance/(s.stairs?.72:1);
    const previousWalk=expanded[i-1]?.kind==='walk'?expanded[i-1]:null;
    const nextWalk=expanded[i+1]?.kind==='walk'?expanded[i+1]:null;
    const turnIn=previousWalk?campusTurnDelta(previousWalk.heading,s.heading):0;
    const turnOut=nextWalk?campusTurnDelta(s.heading,nextWalk.heading):0;
    const result={...s,start,finish,begin:end,end:end+duration,duration,distance:gaitDistance,walkDistance,entry,exit,accelerate,decelerate,turnIn,turnOut};
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
  return {x,y,scale:campusDepth(mapY),opacity,heading,distance:s.walkDistance+s.distance*progress,moving:s.kind==='walk',turning:s.kind==='turn',stairs:!!s.stairs,stage:s};
}

// Six axial walk poses plus dedicated front/rear standing poses.
// Other headings retain four authored frames; no horizontal reflection.
export function campusSpriteFrame(pose, cycle=CINDER_WALK_DISTANCE.at(-1)) {
  const phase=((pose.distance%cycle)+cycle)%cycle/cycle;
  const axial=pose.heading===0||pose.heading===4;
  const east=pose.heading===6&&pose.moving;
  const count=axial?6:4;
  const col=pose.moving?Math.min(count-1,Math.floor(phase*count)):(axial?7:1);
  return east?{row:6,col,side:true,sideIndex:cinderDistanceFrame(phase*CINDER_WALK_DISTANCE.at(-1),CINDER_WALK_DISTANCE)}:{row:pose.heading,col};
}

const CINDER = {
  selector: '.campus-walker--cinder', url: './final-assets/academy/cinder-motion-v2.webp',
  sideUrl: './final-assets/academy/cinder-walk.webp',
  cell: CINDER_CELL, sourceCell: 128, sourceSole: 113, cycle: CINDER_WALK_DISTANCE.at(-1),
  speed: 165, sole: 329, frame: campusSpriteFrame,
};

// The foreground cypress overlaps the path between the dormitory and the front stairs.
// Copy only its silhouette above the actor, with the same lighting and map geometry.
function createCampusOccluder(map, walker) {
  const layer = document.createElement('span');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'absolute', inset: '0', pointerEvents: 'none',
    clipPath: 'polygon(44.4% 73.7%, 45.1% 76%, 45.6% 78.6%, 46% 81.7%, 45.5% 82.9%, 43% 82.9%, 42.2% 81.7%, 42.7% 78.8%, 43.5% 76%)',
    backgroundSize: '100% 100%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
  });
  walker.after(layer);
  function refresh() {
    layer.style.backgroundImage = getComputedStyle(map, '::before').backgroundImage;
  }
  refresh();
  return {
    refresh,
    // A foreground mask should only cover actors whose ground contact is behind it.
    setDepth: y => { layer.style.visibility=y<.832?'visible':'hidden'; },
    remove: () => layer.remove(),
  };
}

export function mountCampusWalker(map, actor = CINDER) {
  const walker = map?.querySelector(actor.selector);
  const canvas = walker?.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return undefined;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const atlas = new Image();
  const side = new Image();
  const stages = buildCampusTour();
  const occluder = createCampusOccluder(map, walker);
  let tour, frame, previous, elapsed = 0, disposed = false, loaded = false;
  const sole = actor.sole / actor.cell * 100;
  walker.style.transformOrigin = '50% ' + sole + '%';

  function measure() {
    const width = walker.offsetWidth;
    if (!width || !map.clientWidth || !map.clientHeight) return;
    const oldTime = tour ? elapsed % tour.at(-1).end : 0;
    const oldIndex = tour?.findIndex(s => oldTime < s.end) ?? -1;
    const oldStage = tour?.[oldIndex];
    const progress = oldStage ? (oldTime - oldStage.begin) / oldStage.duration : 0;
    tour = measureCampusTour(stages, map.clientWidth, map.clientHeight, width, actor.cell, actor.speed);
    if (oldStage) elapsed = tour[oldIndex].begin + progress * tour[oldIndex].duration;
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
      occluder.setDepth(pose.y/map.clientHeight);
      const selected = actor.frame(pose, actor.cycle);
      ctx.clearRect(0, 0, actor.cell, actor.cell);
      if (selected.side && side.naturalWidth) {
        const i=selected.sideIndex;
        ctx.drawImage(side,(i%4)*CINDER_CELL,Math.floor(i/4)*CINDER_CELL,
          CINDER_CELL,CINDER_CELL,0,0,actor.cell,actor.cell);
      } else {
        const offset=actor.sole-actor.cell*(actor.sourceSole??actor.sourceCell*actor.sole/actor.cell)/actor.sourceCell;
        ctx.drawImage(atlas,selected.col*actor.sourceCell,selected.row*actor.sourceCell,
          actor.sourceCell,actor.sourceCell,0,offset,actor.cell,actor.cell);
      }
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
    occluder.refresh();
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
  if(actor.sideUrl) side.src = actor.sideUrl;
  atlas.src = actor.url;
  Promise.all([atlas.decode(),actor.sideUrl?side.decode().catch(()=>{}):Promise.resolve()])
    .then(() => { loaded = true; if (!disposed) refresh(); }).catch(() => {});
  return () => {
    disposed = true;
    if (frame !== undefined) cancelAnimationFrame(frame);
    resize.disconnect();
    lighting.disconnect();
    occluder.remove();
    walker.classList.remove('campus-walker--ready');
    document.removeEventListener('visibilitychange', resume);
    reducedMotion.removeEventListener('change', resume);
  };
}

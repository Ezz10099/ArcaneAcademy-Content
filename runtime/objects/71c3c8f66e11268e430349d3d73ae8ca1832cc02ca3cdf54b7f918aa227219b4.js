import { EQUIPMENT_SLOTS, EQUIPMENT_TYPES, EQUIPMENT_RARITIES, syncEquipment } from './equipment.js';
import { getLocationById, getStagesForLocation, getStageById } from './data.js';
import { ENEMY_BALANCE_STAGES } from './enemy-balance.js';

const rarities=Object.keys(EQUIPMENT_RARITIES);
const types=['HEAVY','LIGHT','MAGICAL'];
const names={HEAVY:{WEAPON:'Blade',HELMET:'Greathelm',ARMOR:'Plate',BOOTS:'Greaves'},LIGHT:{WEAPON:'Dagger',HELMET:'Hood',ARMOR:'Vest',BOOTS:'Trail Boots'},MAGICAL:{WEAPON:'Staff',HELMET:'Cowl',ARMOR:'Robes',BOOTS:'Runeboots'}};
const prefixes=['Iron','Verdant','Runebound','Astral','Sovereign','Eternal'];
const duration=2*60*60*1000;
const safeInt=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const validItem=item=>item&&EQUIPMENT_SLOTS.includes(item.slot)&&types.includes(item.type)&&rarities.includes(item.rarity)&&typeof item.id==='string';
// Global progression, independent of region count and optional branch order.
export const GEAR_PROGRESSION=Object.freeze([
  {clears:0,enemyLevel:1,weights:[100,0,0,0,0,0]},
  {clears:10,enemyLevel:8,weights:[75,25,0,0,0,0]},
  {clears:30,enemyLevel:15,weights:[40,50,10,0,0,0]},
  {clears:100,enemyLevel:30,weights:[15,35,40,10,0,0]},
  {clears:220,enemyLevel:55,weights:[5,15,35,38,7,0]},
  {clears:400,enemyLevel:90,weights:[0,5,20,35,35,5]},
].map(row=>Object.freeze({...row,weights:Object.freeze(row.weights)})));
export function gearTier(clears,enemyLevel){
  return GEAR_PROGRESSION.reduce((cap,row,i)=>clears>=row.clears&&enemyLevel>=row.enemyLevel?i:cap,0);
}
export function stageGearLevel(stage){
  return Math.max(1,ENEMY_BALANCE_STAGES[stage?.id]?.baseLevel || (Number.isSafeInteger(stage?.equipmentBaseLevel)?stage.equipmentBaseLevel:1));
}
export function gearProgress(clearedIds, extraStage=null){
  const stages=new Map();
  for(const id of clearedIds||[]){
    const stage=getStageById(id);
    if(stage&&!stage.special)stages.set(id,stage);
  }
  if(extraStage&&!extraStage.special)stages.set(extraStage.id,extraStage);
  const enemyLevel=Math.max(1,...Array.from(stages.values(),stageGearLevel));
  return {clears:stages.size,enemyLevel,cap:gearTier(stages.size,enemyLevel)};
}
export function gearWeights(cap,special=false){
  const w=[...GEAR_PROGRESSION[cap].weights];
  if(!special||cap===0)return w;
  const top=w[cap], boosted=Math.min(100,top*2);
  for(let i=0;i<cap;i++)w[i]*=(100-boosted)/(100-top);
  w[cap]=boosted;
  return w;
}
export function gearRank(cap,randomValue,special=false){
  let target=Math.max(0,Math.min(.999999999,randomValue))*100;
  const weights=gearWeights(cap,special);
  for(let i=0;i<=cap;i++){target-=weights[i];if(target<0)return i;}
  return cap;
}
function makeItem(id,type,slot,rank,baseLevel=1) {
  return {id,name:prefixes[rank]+' '+names[type][slot],type,slot,rarity:rarities[rank],baseLevel,level:0,locked:false,heroId:null};
}
// Fixed hand-authored milestones: the opening three stages and their original shield remain intact.
const fixed={
 'forest-gate-4':[0,'HEAVY','WEAPON'], 'forest-gate-7':[0,'LIGHT','HELMET'], 'forest-gate-10':[1,'MAGICAL','WEAPON'],
 'sprite-grove-3':[1,'HEAVY','HELMET'], 'sprite-grove-6':[1,'LIGHT','WEAPON'], 'sprite-grove-9':[1,'MAGICAL','BOOTS'], 'sprite-grove-12':[2,'HEAVY','ARMOR'],
 'wolf-den-3':[1,'LIGHT','BOOTS'], 'wolf-den-6':[2,'LIGHT','ARMOR'],
 'ancient-roots-4':[2,'MAGICAL','HELMET'], 'ancient-roots-7':[2,'HEAVY','BOOTS'], 'ancient-roots-11':[2,'MAGICAL','ARMOR'], 'ancient-roots-15':[3,'HEAVY','WEAPON'],
 'deeper-woods-4':[2,'LIGHT','WEAPON'], 'deeper-woods-8':[3,'LIGHT','HELMET'], 'deeper-woods-13':[3,'MAGICAL','BOOTS'], 'deeper-woods-18':[4,'LIGHT','WEAPON'],
 'heart-of-the-curse-4':[3,'HEAVY','HELMET'], 'heart-of-the-curse-8':[3,'MAGICAL','WEAPON'], 'heart-of-the-curse-14':[3,'LIGHT','ARMOR'], 'heart-of-the-curse-21':[4,'MAGICAL','ARMOR'],
};
export function fixedEquipmentReward(stage,clearedIds=[]){
  if(!stage||stage.special) return {items:[],materials:0};
  const cap=gearProgress(clearedIds,stage).cap;
  // Preserve authored slots. Every future boss also gets a deterministic piece.
  const seed=Array.from(stage.id).reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0);
  const spec=fixed[stage.id] || (stage.encounterType==='BOSS'?[cap,types[seed%3],EQUIPMENT_SLOTS[Math.floor(seed/3)%4]]:null);
  const items=spec?[makeItem('clear-gear-'+stage.id,spec[1],spec[2],Math.min(cap,spec[0]),stageGearLevel(stage))]:[];
  const materials=stage.stage<3?0:stage.encounterType==='BOSS'?2+stage.locationOrder*2:spec?2+stage.locationOrder:stage.stage%3===0?1+Math.floor(stage.locationOrder/2):0;
  return {items,materials};
}
export function newAcquisitionState(){return {clearClaims:[],farm:null,sequence:0,specialReady:{}}}
function award(save,reward){
  for(const item of reward.items) if(!save.equipment.items.some(entry=>entry.id===item.id)) save.equipment.items.push({...item});
  save.equipment.materials=Math.min(Number.MAX_SAFE_INTEGER,save.equipment.materials+reward.materials);
  syncEquipment(save);
}
export function awardFirstClear(save,stage,clearedIds=save.expeditionProgress.clearedStageIds){
  const state=save.equipmentAcquisition;
  if(!stage||stage.special||state.clearClaims.includes(stage.id))return {items:[],materials:0};
  const reward=fixedEquipmentReward(stage,clearedIds);
  state.clearClaims.push(stage.id);
  award(save,reward);
  return reward;
}
export function normalizeAcquisition(save,incoming){
  const state=newAcquisitionState();
  state.clearClaims=Array.isArray(incoming?.clearClaims)?[...new Set(incoming.clearClaims.filter(id=>typeof id==='string'&&getStageById(id)&&!getStageById(id).special))]:[];
  state.sequence=safeInt(incoming?.sequence);
  for(const [id,time] of Object.entries(incoming?.specialReady||{})) if(getLocationById(id)&&safeInt(time))state.specialReady[id]=time;
  const farm=incoming?.farm;
  if(farm&&getLocationById(farm.locationId)&&safeInt(farm.startedAt)&&farm.readyAt===farm.startedAt+duration&&Array.isArray(farm.reward?.items)&&farm.reward.items.every(validItem)){
    state.farm={...farm,reward:{items:farm.reward.items.slice(0,1),materials:Math.min(20,safeInt(farm.reward.materials))}};
  }
  save.equipmentAcquisition=state;
  // Backfill once for existing players, without touching their original campaign currencies or shield.
  const history=[];
  for(const id of save.expeditionProgress.clearedStageIds){awardFirstClear(save,getStageById(id),history);history.push(id);}
}
const roll=(rng)=>Math.max(0,Math.min(.999999999,Number(rng())||0));
function localGearLevel(session,location){
  const cleared=session.getClearedStageIds();
  return Math.max(1,...getStagesForLocation(location.id).filter(s=>cleared.has(s.id)).map(stageGearLevel));
}
function randomReward(session,location,cap,chance,baseLevel,materials,source){
  const state=session.saveData.equipmentAcquisition;
  const items=[];
  if(roll(session.random)<chance){
    const rank=gearRank(cap,roll(session.random),source==='special');
    const type=types[Math.floor(roll(session.random)*types.length)],slot=EQUIPMENT_SLOTS[Math.floor(roll(session.random)*EQUIPMENT_SLOTS.length)];
    items.push(makeItem('gear-'+source+'-'+location.id+'-'+(++state.sequence),type,slot,rank,baseLevel));
  }
  return {items,materials};
}
export function farmingStatus(session,locationId,now=Date.now()){
  const location=getLocationById(locationId),progress=session.getLocationProgress(locationId);
  if(!location||!progress)return null;
  const gate=getStagesForLocation(locationId)[Math.min(location.stages,location.farmingUnlockStage)-1];
  // Old assignment numbers were much lower than the actual rebalanced enemy stats.
  const minimum=Math.max(location.minimumAssignmentPower,Math.floor((gate?.recommendedPower||0)*.65));
  const power=session.getRosterPower(),ratio=power/Math.max(1,minimum);
  const chance=Math.min(.35,.20+Math.max(0,ratio-1)*.15);
  const farm=session.saveData.equipmentAcquisition.farm;
  const ready=farm&&now>=farm.readyAt;
  return {minimum,power,chance,cap:gearProgress(session.getClearedStageIds()).cap,baseLevel:localGearLevel(session,location),unlocked:progress.unlocked&&progress.farmingUnlocked,canStart:!farm&&progress.unlocked&&progress.farmingUnlocked&&power>=minimum,farm,ready:Boolean(ready)};
}
export function startFarming(session,locationId,now=Date.now()){
  if(!Number.isSafeInteger(now)||now<=0)return {ok:false,message:'Invalid assignment time.'};
  const status=farmingStatus(session,locationId,now);
  if(!status?.canStart)return {ok:false,message:'Farming locked, squad power too low, or another assignment active.'};
  const location=getLocationById(locationId);
  const reward=randomReward(session,location,status.cap,status.chance,status.baseLevel,1+Math.floor(location.order/2),'farm');
  session.saveData.equipmentAcquisition.farm={locationId,startedAt:now,readyAt:now+duration,heroIds:session.getActiveHeroes().map(hero=>hero.id),power:status.power,reward};
  session.addLog('Farming assigned: '+location.name+'.');session.save();
  return {ok:true,message:'Farming assigned for 2 hours.'};
}
export function claimFarming(session,now=Date.now()){
  const state=session.saveData.equipmentAcquisition, farm=state.farm;
  if(!farm||!Number.isSafeInteger(now)||now<farm.readyAt)return {ok:false,message:'Farming is not ready.'};
  state.farm=null;award(session.saveData,farm.reward);
  const message=rewardSummary(farm.reward);
  session.addLog('Farming: '+message);session.save();
  return {ok:true,message,reward:farm.reward};
}
export function specialStatus(session,locationId,now=Date.now()){
  const location=getLocationById(locationId),progress=session.getLocationProgress(locationId);
  const readyAt=session.saveData.equipmentAcquisition.specialReady[locationId]||0;
  return {unlocked:Boolean(progress?.unlocked&&progress.complete),readyAt,canStart:Boolean(location&&progress?.unlocked&&progress.complete&&now>=readyAt),cap:gearProgress(session.getClearedStageIds()).cap,baseLevel:location&&progress?localGearLevel(session,location):1};
}
export function claimSpecial(session,stage,now=Date.now()){
  const status=specialStatus(session,stage.locationId,now);
  if(!status.canStart)return {items:[],materials:0};
  const location=getLocationById(stage.locationId);
  session.saveData.equipmentAcquisition.specialReady[location.id]=now+location.specialStage.resetHours*60*60*1000;
  const reward=randomReward(session,location,status.cap,.60,status.baseLevel,3+location.order,'special');
  award(session.saveData,reward);
  return reward;
}
export function rewardSummary(reward){
  return [...(reward?.items||[]).map(item=>item.name+' ('+item.rarity.toLowerCase()+', Lv '+(item.baseLevel||1)+')'),reward?.materials?reward.materials+' Enhancement Materials':''].filter(Boolean).join(' / ')||'No equipment rewards';
}

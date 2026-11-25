import { EQUIPMENT_SLOTS, EQUIPMENT_TYPES, EQUIPMENT_RARITIES, syncEquipment } from './equipment.js';
import { getLocationById, getStagesForLocation, getStageById } from './data.js';

const rarities=Object.keys(EQUIPMENT_RARITIES);
const types=['HEAVY','LIGHT','MAGICAL'];
const names={HEAVY:{WEAPON:'Blade',HELMET:'Greathelm',ARMOR:'Plate',BOOTS:'Greaves'},LIGHT:{WEAPON:'Dagger',HELMET:'Hood',ARMOR:'Vest',BOOTS:'Trail Boots'},MAGICAL:{WEAPON:'Staff',HELMET:'Cowl',ARMOR:'Robes',BOOTS:'Runeboots'}};
const prefixes=['Iron','Verdant','Runebound','Astral','Sovereign','Eternal'];
const duration=2*60*60*1000;
const safeInt=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const validItem=item=>item&&EQUIPMENT_SLOTS.includes(item.slot)&&types.includes(item.type)&&rarities.includes(item.rarity)&&typeof item.id==='string';
function makeItem(id,type,slot,rank) {
  return {id,name:prefixes[rank]+' '+names[type][slot],type,slot,rarity:rarities[rank],level:0,locked:false,heroId:null};
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
export function fixedEquipmentReward(stage) {
  if(!stage||stage.special) return {items:[],materials:0};
  const spec=fixed[stage.id];
  const items=spec?[makeItem('clear-gear-'+stage.id,spec[1],spec[2],spec[0])]:[];
  const materials=stage.stage<3?0:stage.encounterType==='BOSS'?2+stage.locationOrder*2:spec?2+stage.locationOrder:stage.stage%3===0?1+Math.floor(stage.locationOrder/2):0;
  return {items,materials};
}
export function newAcquisitionState(){return {clearClaims:[],farm:null,sequence:0,specialReady:{}}}
function award(save,reward){
  for(const item of reward.items) if(!save.equipment.items.some(entry=>entry.id===item.id)) save.equipment.items.push({...item});
  save.equipment.materials=Math.min(Number.MAX_SAFE_INTEGER,save.equipment.materials+reward.materials);
  syncEquipment(save);
}
export function awardFirstClear(save,stage){
  const state=save.equipmentAcquisition;
  if(!stage||stage.special||state.clearClaims.includes(stage.id))return {items:[],materials:0};
  const reward=fixedEquipmentReward(stage);
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
  for(const id of save.expeditionProgress.clearedStageIds)awardFirstClear(save,getStageById(id));
}
function capFor(location,progress,special=false){
  if(special) {
    if(location.order>=5)return 5;
    return [0,1,2,2,3][location.order]||3;
  }
  if(location.order===1)return progress.complete?1:0;
  if(location.order<=3)return progress.complete?2:1;
  if(location.order===4)return progress.complete?3:2;
  return progress.complete?4:3;
}
const roll=(rng)=>Math.max(0,Math.min(.999999999,Number(rng())||0));
function randomReward(session,location,cap,chance,topChance,materials,source){
  const state=session.saveData.equipmentAcquisition;
  const items=[];
  if(roll(session.random)<chance){
    const r=roll(session.random);
    const rank=cap===0?0:r<topChance?cap:r<topChance+.55?cap-1:Math.max(0,cap-2);
    const type=types[Math.floor(roll(session.random)*types.length)],slot=EQUIPMENT_SLOTS[Math.floor(roll(session.random)*EQUIPMENT_SLOTS.length)];
    items.push(makeItem('gear-'+source+'-'+location.id+'-'+(++state.sequence),type,slot,rank));
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
  return {minimum,power,chance,cap:capFor(location,progress),unlocked:progress.unlocked&&progress.farmingUnlocked,canStart:!farm&&progress.unlocked&&progress.farmingUnlocked&&power>=minimum,farm,ready:Boolean(ready)};
}
export function startFarming(session,locationId,now=Date.now()){
  if(!Number.isSafeInteger(now)||now<=0)return {ok:false,message:'Invalid assignment time.'};
  const status=farmingStatus(session,locationId,now);
  if(!status?.canStart)return {ok:false,message:'Farming locked, squad power too low, or another assignment active.'};
  const location=getLocationById(locationId);
  const reward=randomReward(session,location,status.cap,status.chance,.15,1+Math.floor(location.order/2),'farm');
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
  return {unlocked:Boolean(progress?.unlocked&&progress.complete),readyAt,canStart:Boolean(location&&progress?.unlocked&&progress.complete&&now>=readyAt),cap:location&&progress?capFor(location,progress,true):0};
}
export function claimSpecial(session,stage,now=Date.now()){
  const status=specialStatus(session,stage.locationId,now);
  if(!status.canStart)return {items:[],materials:0};
  const location=getLocationById(stage.locationId);
  session.saveData.equipmentAcquisition.specialReady[location.id]=now+location.specialStage.resetHours*60*60*1000;
  const reward=randomReward(session,location,status.cap,.60,status.cap===5?.08:.35,3+location.order,'special');
  award(session.saveData,reward);
  return reward;
}
export function rewardSummary(reward){
  return [...(reward?.items||[]).map(item=>item.name+' ('+item.rarity.toLowerCase()+')'),reward?.materials?reward.materials+' Enhancement Materials':''].filter(Boolean).join(' / ')||'No equipment rewards';
}

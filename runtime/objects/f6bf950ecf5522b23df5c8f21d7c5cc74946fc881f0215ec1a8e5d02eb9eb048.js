// Equipment inventory is authoritative; hero slot bonuses are derived, never trusted from saves.
export const EQUIPMENT_SLOTS = ['WEAPON', 'HELMET', 'ARMOR', 'BOOTS'];
export const EQUIPMENT_TYPES = Object.freeze({ GUARDIAN:'HEAVY', WARRIOR:'HEAVY', ASSASSIN:'LIGHT', STRIKER:'LIGHT', MAGE:'MAGICAL', MYSTIC:'MAGICAL', HEALER:'MAGICAL' });
export const EQUIPMENT_RARITIES = Object.freeze({
  COMMON:{color:'#a0a1a6',scale:1,cap:3},
  UNCOMMON:{color:'#69c785',scale:1.18,cap:5},
  RARE:{color:'#66a8ff',scale:1.4,cap:8},
  ELITE:{color:'#ba82ed',scale:1.65,cap:10},
  LEGENDARY:{color:'#e9bb62',scale:1.95,cap:12},
  MYTHIC:{color:'#e76a70',scale:2.3,cap:15},
});
export const LEGACY_SHIELD_ID = 'forest-gate-shield';
const base = { WEAPON:{damage:9}, HELMET:{hp:55}, ARMOR:{defense:18}, BOOTS:{speed:2,dodge:1} };
const types = ['HEAVY','LIGHT','MAGICAL'];
const integer = (n, max=Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n) ? Math.min(max,Math.max(0,n)) : 0;
const tier = item => Object.keys(EQUIPMENT_RARITIES).indexOf(item.rarity)+1;
export const canEquip = (hero,item) => Boolean(hero && item && EQUIPMENT_TYPES[hero.heroClass] === item.type);
export function equipmentStats(item) {
  const rarity = EQUIPMENT_RARITIES[item.rarity];
  if (!rarity || !base[item.slot]) return {};
  const level=integer(item.level,rarity.cap);
  const factor=rarity.scale*(1+.08*level);
  const stats=item.id===LEGACY_SHIELD_ID?{defense:35}:base[item.slot];
  return Object.fromEntries(Object.entries(stats).map(([key,value])=>[key,key==='dodge'?(Math.round(value*rarity.scale*10)+level)/10:Math.round(value*rarity.scale)+Math.max(level,Math.round(value*rarity.scale*.08*level))]));
}
export function upgradeCost(item) {
  const rarity = EQUIPMENT_RARITIES[item.rarity];
  if (!rarity || item.level >= rarity.cap) return null;
  return {gold: 60*tier(item)*(item.level+1), materials: 2*tier(item)*(item.level+1)};
}
export function recyclingReward(item) {
  let materials = tier(item)*4;
  for(let level=0;level<item.level;level++) materials += Math.floor(upgradeCost({...item,level}).materials*.75);
  return materials;
}
export function newEquipmentState() { return {items:[], materials:0, legacyShieldMigrated:false}; }
function cleanItem(item) {
  if (!item || typeof item.id !== 'string' || !item.id || !EQUIPMENT_SLOTS.includes(item.slot) || !types.includes(item.type)) return null;
  const rarity = item.rarity === 'EPIC' ? 'ELITE' : item.rarity;
  if (!Object.hasOwn(EQUIPMENT_RARITIES,rarity)) return null;
  return {id:item.id, name:String(item.name || item.slot).slice(0,100), slot:item.slot,type:item.type,rarity,level:integer(item.level,EQUIPMENT_RARITIES[rarity].cap),locked:item.locked===true,heroId:typeof item.heroId==='string'?item.heroId:null};
}
export function grantLegacyShield(save) {
  const equipment=save.equipment;
  if(equipment.legacyShieldMigrated || !save.forestGateShield?.owned) return;
  const holder=save.heroes.find(hero=>hero.id===save.forestGateShield.heroId);
  const type=EQUIPMENT_TYPES[holder?.heroClass] || 'HEAVY';
  if(!equipment.items.some(item=>item.id===LEGACY_SHIELD_ID)) equipment.items.push({id:LEGACY_SHIELD_ID,name:'Forest Gate Shield',slot:'ARMOR',type,rarity:'COMMON',level:0,locked:false,heroId:holder?.id||null});
  equipment.legacyShieldMigrated=true;
}
export function normalizeEquipment(save,incoming) {
  const seen=new Set(), occupied=new Set();
  const items=[];
  for(const raw of Array.isArray(incoming?.items)?incoming.items:[]) {
    const item=cleanItem(raw);
    if(!item || seen.has(item.id)) continue;
    seen.add(item.id);
    const hero=save.heroes.find(entry=>entry.id===item.heroId);
    const slotKey=item.heroId+':'+item.slot;
    if(!canEquip(hero,item)||occupied.has(slotKey)) item.heroId=null;
    else occupied.add(slotKey);
    items.push(item);
  }
  save.equipment={items,materials:integer(incoming?.materials),legacyShieldMigrated:incoming?.legacyShieldMigrated===true};
  grantLegacyShield(save);
  syncEquipment(save);
}
export function syncEquipment(save) {
  const items=save.equipment.items;
  for(const hero of save.heroes) {
    hero.equipmentSlots={};
    hero.equipmentBonuses={};
    for(const item of items.filter(item=>item.heroId===hero.id)) {
      hero.equipmentSlots[item.slot]=item.id;
      for(const [key,value] of Object.entries(equipmentStats(item))) hero.equipmentBonuses[key]=(hero.equipmentBonuses[key]||0)+value;
    }
    hero.shieldEquipped=hero.equipmentSlots.ARMOR===LEGACY_SHIELD_ID;
  }
  // Keep the old reward marker for the existing campaign and older save readers.
  save.forestGateShield.heroId=items.find(item=>item.id===LEGACY_SHIELD_ID)?.heroId||null;
}
const fail=message=>({ok:false,message});
const done=(session,message)=>{syncEquipment(session.saveData);session.save();return {ok:true,message};};
export function equipmentAction(session,action,id,heroId=null) {
  const state=session.saveData.equipment;
  const item=state.items.find(entry=>entry.id===id);
  if(!item) return fail('Equipment unavailable.');
  if(action==='equip') {
    const hero=session.getHero(heroId);
    if(!canEquip(hero,item)) return fail('Incompatible combatant class.');
    if(item.heroId && item.heroId!==heroId) return fail('Unequip this item first.');
    const prior=state.items.find(entry=>entry.heroId===heroId&&entry.slot===item.slot&&entry.id!==id);
    if(prior) prior.heroId=null;
    item.heroId=heroId;
    return done(session,item.name+' equipped.');
  }
  if(action==='unequip') {
    if(!item.heroId || (heroId && item.heroId!==heroId)) return fail('Item is not equipped here.');
    item.heroId=null;
    return done(session,item.name+' unequipped.');
  }
  if(action==='lock') {
    item.locked=!item.locked;
    return done(session,item.locked?'Equipment locked.':'Equipment unlocked.');
  }
  if(action==='upgrade') {
    const cost=upgradeCost(item);
    if(!cost) return fail('Maximum upgrade reached.');
    if(!session.canAfford('GOLD',cost.gold)||(!session.developerMode&&state.materials<cost.materials)) return fail('Not enough Gold or Enhancement Materials.');
    session.spend('GOLD',cost.gold);
    if(!session.developerMode) state.materials-=cost.materials;
    item.level++;
    return done(session,item.name+' upgraded to +'+item.level+'.');
  }
  if(action==='recycle') {
    if(item.heroId||item.locked) return fail('Unequip and unlock the item before recycling.');
    const reward=recyclingReward(item);
    if(!Number.isSafeInteger(state.materials+reward)) return fail('Material storage full.');
    state.items=state.items.filter(entry=>entry.id!==id);
    state.materials+=reward;
    return done(session,'Recovered '+reward+' Enhancement Materials.');
  }
  return fail('Unknown equipment action.');
}

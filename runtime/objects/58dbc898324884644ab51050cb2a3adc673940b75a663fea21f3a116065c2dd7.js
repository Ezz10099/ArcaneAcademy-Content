import { EQUIPMENT_RARITIES, EQUIPMENT_SLOTS, EQUIPMENT_TYPES, equipmentStats, upgradeCost, recyclingReward, canEquip, bestEquipmentPlan } from './equipment.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=value=>value.charAt(0)+value.slice(1).toLowerCase();
const keys={damage:'ATK',hp:'HP',defense:'DEF',speed:'SPD',dodge:'DODGE'};
const statText=item=>Object.entries(equipmentStats(item)).map(([key,value])=>'+'+value+(key==='dodge'?'%':'')+' '+keys[key]).join(' · ');
const art=(type,slot,item)=>'<img class="gear-art" src="'+(item?.id==='forest-gate-shield'?'final-assets/trainees/forest-gate-shield.webp':'final-assets/equipment/'+type.toLowerCase()+'-'+slot.toLowerCase()+'.svg')+'" alt="">';
const btn=(action,item,title,disabled=false,heroId='')=>'<button type="button" class="gear-action" data-action="gear-'+action+'" data-item="'+esc(item.id)+'" data-hero="'+esc(heroId)+'" '+(disabled?'disabled':'')+'>'+esc(title)+'</button>';
function itemCard(game,item,hero=null,forge=false) {
  const rarity=EQUIPMENT_RARITIES[item.rarity], cost=upgradeCost(item);
  const owner=game.getHero(item.heroId);
  const wornByOther=Boolean(hero&&item.heroId&&item.heroId!==hero.id);
  const canUpgrade=cost&&game.canAfford('GOLD',cost.gold)&&(game.developerMode||game.saveData.equipment.materials>=cost.materials);
  const meta=label(item.type)+' · '+label(item.rarity)+' · Lv '+(item.baseLevel||1)+' · +'+item.level+'/'+rarity.cap;
  return '<article class="gear-card" style="--gear-rarity:'+rarity.color+'"><div class="gear-card-head">'+art(item.type,item.slot,item)+'<div><strong>'+esc(item.name)+'</strong><small>'+esc(meta)+'</small><small>'+esc(statText(item))+'</small>'+(cost?'<small>Next: '+esc(statText({...item,level:item.level+1}))+'</small>':'')+(item.heroId?'<small class="gear-owner">Equipped by '+esc(owner?.name||'Combatant')+'</small>':'')+(hero&&!item.heroId?'<small class="gear-available">Available · unequipped</small>':'')+((forge||hero)&&item.locked?'<small class="gear-owner">Locked · protected</small>':'')+'</div></div>'+(wornByOther?'<p class="gear-assigned-note">Unequip from '+esc(owner?.name||'its owner')+' first.</p>':'<div class="gear-buttons">'
    +(hero?(item.heroId===hero.id?btn('unequip',item,'Unequip',false,hero.id):btn('equip',item,'Equip / replace',!!item.heroId,hero.id)):owner&&!forge?btn('unequip',item,'Unequip',false,owner.id):'')
    +btn('upgrade',item,cost?'Upgrade · '+cost.gold+' G / '+cost.materials+' M':'Max upgrade',!canUpgrade)
    +btn('lock',item,item.locked?'Unlock':'Lock')
    +(forge&&(item.heroId||item.locked)?'':btn('recycle',item,'Recycle · +'+recyclingReward(item)+' M',!!item.heroId||item.locked))
    +'</div>')+'</article>';
}
export function equipmentBalance(game) {
  return '<div class="gear-balance"><span>Gold <b>'+game.currencies.GOLD+'</b></span><span>Materials <b>'+game.saveData.equipment.materials+'</b></span></div>';
}
export function equipmentPanel(game,hero) {
  const type=EQUIPMENT_TYPES[hero.heroClass]||'HEAVY';
  return '<div class="gear-slots">'+EQUIPMENT_SLOTS.map(slot=>{
    const item=game.saveData.equipment.items.find(item=>item.heroId===hero.id&&item.slot===slot);
    return '<button type="button" class="gear-slot '+(item?'':'gear-empty')+'" style="--gear-rarity:'+(item?EQUIPMENT_RARITIES[item.rarity].color:'#647075')+'" data-action="show-dialog" data-dialog="gear-slot-'+slot+'" aria-haspopup="dialog" aria-label="'+label(slot)+(item?', '+esc(item.name):', empty')+'">'+art(type,slot,item)+'<span>'+label(slot)+'</span><small>'+(item?'Lv '+(item.baseLevel||1)+' · +'+item.level+' · '+label(item.rarity):'Empty')+'</small></button>';
  }).join('')+'</div>';
}
export function combatantEquipmentGroups(items,hero,slot) {
  const compatible=items.filter(item=>item.slot===slot&&canEquip(hero,item));
  return {current:compatible.filter(item=>item.heroId===hero.id),available:compatible.filter(item=>!item.heroId),other:compatible.filter(item=>item.heroId&&item.heroId!==hero.id)};
}
// Display order only; equipment data and slot IDs remain unchanged.
const gearBrowseOrder=['WEAPON','ARMOR','HELMET','BOOTS'];
export function adjacentGearSlot(slot,direction) {
  const i=gearBrowseOrder.indexOf(slot);
  return i<0||![-1,1].includes(direction)?null:gearBrowseOrder[(i+direction+gearBrowseOrder.length)%gearBrowseOrder.length];
}
export function equipmentSlotNavigation(slot) {
  const arrow=(direction,icon)=>{
    const next=adjacentGearSlot(slot,direction);
    return '<button type="button" class="gear-slot-arrow" data-action="gear-slot-nav" data-direction="'+direction+'" data-dialog="gear-slot-'+next+'" aria-label="'+(direction<0?'Previous: ':'Next: ')+label(next)+'">'+icon+'</button>';
  };
  return '<div class="gear-slot-navigation">'+arrow(-1,'&#8249;')+'<div class="gear-slot-heading"><h2>'+label(slot)+'</h2><small>'+(gearBrowseOrder.indexOf(slot)+1)+' / '+gearBrowseOrder.length+'</small></div>'+arrow(1,'&#8250;')+'</div>';
}
function autoEquipButton(game,hero) {
  const count=bestEquipmentPlan(game.saveData.equipment.items,hero).length;
  return '<button type="button" class="gear-auto-equip" data-action="gear-auto-equip" data-hero="'+esc(hero.id)+'" '+(count?'':'disabled')+'><span aria-hidden="true">&#10003;</span> '+(count?'Auto Equip · '+count+' slot'+(count===1?'':'s'):'Best equipment equipped')+'</button>';
}
export function equipmentDialogs(game,hero) {
  return EQUIPMENT_SLOTS.map(slot=>{
    const groups=combatantEquipmentGroups(game.saveData.equipment.items,hero,slot);
    const sections=[['current','Currently equipped','This slot is empty.'],['available','Available · unequipped','No unused compatible equipment.'],['other','Equipped by other combatants','No compatible equipment worn by others.']];
    const body=sections.map(([key,title,empty])=>'<section class="combatant-gear-group"><h3>'+title+' <span>'+groups[key].length+'</span></h3><div class="gear-list">'+(groups[key].length?groups[key].map(item=>itemCard(game,item,hero)).join(''):'<p class="gear-group-empty">'+empty+'</p>')+'</div></section>').join('');
    return '<dialog class="trainee-dialog trainee-gilded gear-dialog" id="gear-slot-'+slot+'" aria-label="'+label(slot)+' equipment">'+equipmentSlotNavigation(slot)+'<p>'+label(EQUIPMENT_TYPES[hero.heroClass]||'HEAVY')+' equipment</p>'+equipmentBalance(game)+autoEquipButton(game,hero)+body+'<p role="status" class="gear-message"></p><form method="dialog"><button type="submit">Close</button></form></dialog>';
  }).join('');
}
export function inventoryEquipment(game) {
  const items=game.saveData.equipment.items;
  return equipmentBalance(game)+'<div class="gear-list">'+(items.length?items.map(item=>itemCard(game,item)).join(''):'<p>No equipment yet.</p>')+'</div><p class="gear-message" role="status"></p>';
}

export function forgeEquipmentGroups(items) {
  return {unequipped:items.filter(i=>!i.heroId&&!i.locked),equipped:items.filter(i=>!!i.heroId),locked:items.filter(i=>!i.heroId&&i.locked)};
}
export function forgeEquipmentList(game,selection={}) {
  const groups=forgeEquipmentGroups(game.saveData.equipment.items);
  const filter=Object.hasOwn(groups,selection.filter)?selection.filter:'unequipped';
  const titles={unequipped:'Unequipped',equipped:'Equipped',locked:'Locked'};
  const help={unequipped:'Not worn or locked. Check the item before recycling.',equipped:'Worn by combatants, including reserves. Protected from recycling; unequip in Combatants or Inventory.',locked:'Unequipped, locked items are protected. Unlock deliberately to move them to Unequipped.'};
  return '<div class="forge-equipment-tabs" role="group" aria-label="Equipment status">'+Object.keys(groups).map(key=>'<button type="button" data-action="forge-filter" data-filter="'+key+'" aria-pressed="'+(key===filter)+'">'+titles[key]+' <b>'+groups[key].length+'</b></button>').join('')+'</div><p class="forge-equipment-help">'+help[filter]+'</p><div class="gear-list">'+(groups[filter].length?groups[filter].map(item=>itemCard(game,item,null,true)).join(''):'<p>No '+titles[filter].toLowerCase()+' equipment.</p>')+'</div>';
}
export function forgePanel(game,selection={}) {
 const f=game.getForgeStatus();
 if(!f.unlocked)return '<p>Unlock the Forge after '+f.unlockClears+' campaign clears ('+f.progress.clears+'/'+f.unlockClears+').</p>';
 const types=['HEAVY','LIGHT','MAGICAL'],rarities=Object.keys(EQUIPMENT_RARITIES).slice(0,f.cap+1);
 const type=types.includes(selection.type)?selection.type:types[0],slot=EQUIPMENT_SLOTS.includes(selection.slot)?selection.slot:EQUIPMENT_SLOTS[0],rarity=rarities.includes(selection.rarity)?selection.rarity:rarities.at(-1);
 const recipe=game.getForgeRecipe(type,slot,rarity),next=f.next;
 const options=(values,active)=>values.map(v=>'<option value="'+v+'" '+(v===active?'selected':'')+'>'+label(v)+'</option>').join('');
 const upgrade=next?'<div class="forge-upgrade"><div><strong>Forge level '+f.level+'</strong><small>Next: '+label(next.rarity)+' recipes · '+next.clears+' clears + rarity unlock</small></div><button class="gear-action" type="button" data-action="forge-upgrade" '+(next.eligible&&game.canAfford('GOLD',next.gold)&&(game.developerMode||game.saveData.equipment.materials>=next.materials)?'':'disabled')+'>Upgrade '+next.gold+' G / '+next.materials+' M</button></div>':'<p>Forge level '+f.level+' · maximum</p>';
 return equipmentBalance(game)+upgrade+
 '<div class="forge-select"><label>Type<select id="forge-type">'+options(types,type)+'</select></label><label>Slot<select id="forge-slot">'+options(EQUIPMENT_SLOTS,slot)+'</select></label><label>Rarity<select id="forge-rarity">'+options(rarities,rarity)+'</select></label></div>'+
 '<article class="gear-card" style="--gear-rarity:'+EQUIPMENT_RARITIES[rarity].color+'"><div class="gear-card-head">'+art(type,slot,recipe.item)+'<div><strong>'+esc(recipe.item.name)+'</strong><small>'+label(rarity)+' · Lv '+recipe.item.baseLevel+' · +0</small><small>'+esc(statText(recipe.item))+'</small></div></div><p>Guaranteed selected piece. Campaign and farming can yield higher base levels.</p><div class="gear-buttons"><button class="gear-action" data-action="forge-craft" type="button" '+(recipe.affordable?'':'disabled')+'>Craft · '+recipe.cost.gold+' G / '+recipe.cost.materials+' M</button></div></article>'+
 '<details open><summary>Enhance &amp; recycle equipment</summary>'+forgeEquipmentList(game,selection)+'</details><p class="gear-message" role="status">'+esc(selection.message||'')+'</p>';
}

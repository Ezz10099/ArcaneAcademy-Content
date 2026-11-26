import { EQUIPMENT_RARITIES, EQUIPMENT_SLOTS, EQUIPMENT_TYPES, equipmentStats, upgradeCost, recyclingReward, canEquip } from './equipment.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=value=>value.charAt(0)+value.slice(1).toLowerCase();
const keys={damage:'ATK',hp:'HP',defense:'DEF',speed:'SPD',dodge:'DODGE'};
const statText=item=>Object.entries(equipmentStats(item)).map(([key,value])=>'+'+value+(key==='dodge'?'%':'')+' '+keys[key]).join(' · ');
const art=(type,slot,item)=>'<img class="gear-art" src="'+(item?.id==='forest-gate-shield'?'final-assets/trainees/forest-gate-shield.webp':'final-assets/equipment/'+type.toLowerCase()+'-'+slot.toLowerCase()+'.svg')+'" alt="">';
const btn=(action,item,title,disabled=false,heroId='')=>'<button type="button" class="gear-action" data-action="gear-'+action+'" data-item="'+esc(item.id)+'" data-hero="'+esc(heroId)+'" '+(disabled?'disabled':'')+'>'+esc(title)+'</button>';
function itemCard(game,item,hero=null) {
  const rarity=EQUIPMENT_RARITIES[item.rarity], cost=upgradeCost(item);
  const owner=game.getHero(item.heroId);
  const canUpgrade=cost&&game.canAfford('GOLD',cost.gold)&&(game.developerMode||game.saveData.equipment.materials>=cost.materials);
  const meta=label(item.type)+' · '+label(item.rarity)+' · Lv '+(item.baseLevel||1)+' · +'+item.level+'/'+rarity.cap;
  return '<article class="gear-card" style="--gear-rarity:'+rarity.color+'"><div class="gear-card-head">'+art(item.type,item.slot,item)+'<div><strong>'+esc(item.name)+'</strong><small>'+esc(meta)+'</small><small>'+esc(statText(item))+'</small>'+(cost?'<small>Next: '+esc(statText({...item,level:item.level+1}))+'</small>':'')+(owner?'<small>Equipped by '+esc(owner.name)+'</small>':'')+'</div></div><div class="gear-buttons">'
    +(hero?(item.heroId===hero.id?btn('unequip',item,'Unequip',false,hero.id):btn('equip',item,'Equip / replace',!!item.heroId,hero.id)):owner?btn('unequip',item,'Unequip',false,owner.id):'')
    +btn('upgrade',item,cost?'Upgrade · '+cost.gold+' G / '+cost.materials+' M':'Max upgrade',!canUpgrade)
    +btn('lock',item,item.locked?'Unlock':'Lock')
    +btn('recycle',item,'Recycle · +'+recyclingReward(item)+' M',!!item.heroId||item.locked)
    +'</div></article>';
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
export function equipmentDialogs(game,hero) {
  return EQUIPMENT_SLOTS.map(slot=>{
    const items=game.saveData.equipment.items.filter(item=>item.slot===slot&&canEquip(hero,item)&&(!item.heroId||item.heroId===hero.id)).sort((a,b)=>Number(b.heroId===hero.id)-Number(a.heroId===hero.id));
    return '<dialog class="trainee-dialog trainee-gilded gear-dialog" id="gear-slot-'+slot+'" aria-label="'+label(slot)+' equipment"><h2>'+label(slot)+'</h2><p>'+label(EQUIPMENT_TYPES[hero.heroClass]||'HEAVY')+' equipment</p>'+equipmentBalance(game)+'<div class="gear-list">'+(items.length?items.map(item=>itemCard(game,item,hero)).join(''):'<p>No compatible equipment available.</p>')+'</div><p role="status" class="gear-message"></p><form method="dialog"><button type="submit">Close</button></form></dialog>';
  }).join('');
}
export function inventoryEquipment(game) {
  const items=game.saveData.equipment.items;
  return equipmentBalance(game)+'<div class="gear-list">'+(items.length?items.map(item=>itemCard(game,item)).join(''):'<p>No equipment yet.</p>')+'</div><p class="gear-message" role="status"></p>';
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
 '<details><summary>Enhance &amp; recycle equipment</summary>'+inventoryEquipment(game)+'</details><p class="gear-message" role="status">'+esc(selection.message||'')+'</p>';
}

// Recurring missions are separate from permanent campaign quests.
const DAY = 86400000;
const PERIODS = ['daily', 'weekly', 'monthly'];
const METRICS = ['visit', 'idleMs', 'wins', 'levels', 'recruits', 'upgrades', 'dailyChests'];
const task = (metric, target, points, title) => ({ id: metric + '-' + target, metric, target, points, title });
export const ACTIVITY_TASKS = {
 daily: [
  task('visit',1,20,'Check the mission board'),
  task('idleMs',60*60000,40,'Collect 1 hour of passive training'),
  task('idleMs',180*60000,40,'Collect 3 hours of passive training'),
  task('wins',1,30,'Win a battle'),
  task('levels',1,30,'Train a combatant by one level'),
  task('recruits',1,20,'Recruit a combatant'),
  task('upgrades',1,20,'Enhance a piece of equipment'),
 ],
 weekly: [
  task('dailyChests',2,30,'Claim the final daily chest on 2 days'),
  task('dailyChests',5,40,'Claim the final daily chest on 5 days'),
  task('idleMs',12*3600000,30,'Collect 12 hours of passive training'),
  task('wins',5,25,'Win 5 battles'),
  task('levels',5,20,'Train 5 combatant levels'),
  task('recruits',3,15,'Recruit 3 combatants'),
  task('upgrades',3,15,'Enhance equipment 3 times'),
 ],
 monthly: [
  task('dailyChests',8,30,'Claim the final daily chest on 8 days'),
  task('dailyChests',18,40,'Claim the final daily chest on 18 days'),
  task('idleMs',36*3600000,30,'Collect 36 hours of passive training'),
  task('wins',20,25,'Win 20 battles'),
  task('levels',20,20,'Train 20 combatant levels'),
  task('recruits',10,15,'Recruit 10 combatants'),
  task('upgrades',10,15,'Enhance equipment 10 times'),
 ],
};
export const ACTIVITY_CHESTS = {
 daily: [{gold:100},{scrolls:40},{crystals:25},{materials:2},{fragments:1}],
 weekly: [{gold:300},{scrolls:120},{crystals:75},{materials:6},{fragments:3}],
 monthly: [{gold:1200},{scrolls:400},{crystals:200},{materials:20},{fragments:5,lumens:50}],
};
export function activityWindows(now = Date.now()) {
 const d = new Date(now);
 const today = Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
 const monday = today - ((d.getUTCDay()+6)%7)*DAY;
 const month = Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1);
 const nextMonth = Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);
 const window = (start,end) => ({key:new Date(start).toISOString().slice(0,10),end});
 return {daily:window(today,today+DAY),weekly:window(monday,monday+7*DAY),monthly:window(month,nextMonth)};
}
const blank = key => ({key, counts:Object.fromEntries(METRICS.map(metric=>[metric,0])), claimed:[]});
const count = value => Number.isSafeInteger(value) && value>=0 ? value : 0;
export function normalizeActivity(raw, now = Date.now()) {
 const windows=activityWindows(now);
 return Object.fromEntries(PERIODS.map(period=>{
  const saved=raw?.[period], key=windows[period].key;
  if (!saved || typeof saved.key!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(saved.key) || saved.key<key) return [period,blank(key)];
  return [period,{key:saved.key,counts:Object.fromEntries(METRICS.map(metric=>[metric,count(saved.counts?.[metric])])),claimed:[...new Set((Array.isArray(saved.claimed)?saved.claimed:[]).filter(n=>[20,40,60,80,100].includes(n)))]}];
 }));
}
export function activityUnlocked(session) {
 return session.isStageCleared('forest-gate-5');
}
function sync(session,now) {
 const windows=activityWindows(now);
 session.saveData.recurringActivity=normalizeActivity(session.saveData.recurringActivity,now);
 const records=session.saveData.recurringActivity;
 return {windows,records,blocked:PERIODS.some(p=>records[p].key!==windows[p].key)};
}
export function recordActivity(session,metric,amount=1,now=Date.now()) {
 if(!activityUnlocked(session)||!METRICS.includes(metric)||metric==='dailyChests'||!Number.isSafeInteger(amount)||amount<=0)return false;
 const {records,blocked}=sync(session,now);
 if(blocked)return false;
 for(const period of PERIODS) {
  const c=records[period].counts;
  c[metric]=metric==='visit'?1:Math.min(Number.MAX_SAFE_INTEGER,count(c[metric])+amount);
 }
 return true;
}
function pointsFor(period,record) {
 return Math.min(100,ACTIVITY_TASKS[period].reduce((total,t)=>total+(count(record.counts[t.metric])>=t.target?t.points:0),0));
}
export function activityBoard(session,period='daily',now=Date.now()) {
 if(!PERIODS.includes(period))period='daily';
 if(!activityUnlocked(session))return {unlocked:false,period,points:0,tasks:[],chests:[]};
 const {windows,records,blocked}=sync(session,now);
 const record=records[period], points=pointsFor(period,record);
 const tasks=ACTIVITY_TASKS[period].map(t=>({...t,progress:Math.min(t.target,count(record.counts[t.metric])),complete:count(record.counts[t.metric])>=t.target}));
 const chests=ACTIVITY_CHESTS[period].map((rewards,i)=>{
  const threshold=(i+1)*20,claimed=record.claimed.includes(threshold);
  return {threshold,rewards,claimed,ready:!blocked&&!claimed&&points>=threshold};
 });
 return {unlocked:true,period,key:record.key,resetAt:windows[period].end,blocked,points,tasks,chests};
}
export function claimActivityChest(session,period,threshold,key,now=Date.now()) {
 const fail=message=>({ok:false,message});
 if(!PERIODS.includes(period))return fail('Unknown mission period.');
 const board=activityBoard(session,period,now);
 if(!board.unlocked)return fail('Missions unlock after Forest Gate 5.');
 if(board.blocked||key!==board.key)return fail('Mission period changed. Refresh the board.');
 const chest=board.chests.find(c=>c.threshold===threshold);
 if(!chest?.ready)return fail('Chest unavailable or already claimed.');
 const records=session.saveData.recurringActivity;
 const rewards=chest.rewards;
 for(const [name,currency] of Object.entries({gold:'GOLD',scrolls:'LESSON_SCROLLS',crystals:'CRYSTALS',fragments:'AWAKENING_SHARDS',lumens:'PREMIUM_CRYSTALS'})) {
  if(rewards[name])session.addCurrency(currency,rewards[name]);
 }
 if(rewards.materials)session.saveData.equipment.materials+=rewards.materials;
 records[period].claimed.push(threshold);
 if(period==='daily'&&threshold===100)for(const p of ['weekly','monthly']) {
  records[p].counts.dailyChests=count(records[p].counts.dailyChests)+1;
 }
 session.addLog('Claimed '+period+' mission chest: '+threshold+' points.');
 session.save();
 return {ok:true,message:'Reward claimed.',rewards};
}

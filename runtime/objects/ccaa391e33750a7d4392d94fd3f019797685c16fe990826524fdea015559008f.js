// Reviewed Wild Forest candidate. Fixed encounter profiles, not live roster scaling.
export const WILD_FOREST_LOCATION_IDS=Object.freeze(['forest-gate','sprite-grove','wolf-den','ancient-roots','deeper-woods','heart-of-the-curse']);
const first=[
[1,1,1,1,1.014,1.02,1.021,1.023,1.019,1.012],
[1.024,1.019,1.017,1.034,1.038,1.035,1.043,1.046,1.057,1.047,1.057,1.053],
[1.056,1.068,1.055,1.055,1.061,1.076],
[1.066,1.059,1.067,1.061,1.072,1.069,1.183,1.137,1.124,1.119,1.098,1.086,1.09,1.075,1.074],
[1.091,1.104,1.088,1.098,1.108,1.106,1.122,1.095,1.12,1.116,1.134,1.109,1.126,1.138,1.152,1.136,1.15,1.148],
[1.096,1.103,1.088,1.081,1.094,1.099,1.096,1.106,1.127,1.109,1.103,1.106,1.115,1.129,1.113,1.122,1.131,1.137,1.124,1.126,1.12]
];
const second={
 'deeper-woods':[1.376,1.402,1.357,1.373,1.387,1.376,1.399,1.352,1.386,1.372,1.404,1.343,1.406,1.405,1.385,1.363,1.361,1.396],
 'heart-of-the-curse':[1.287,1.308,1.303,1.277,1.303,1.272,1.294,1.274,1.301,1.291,1.277,1.274,1.275,1.297,1.271,1.269,1.268,1.263,1.254,1.265,1.261]
};
export const CAMPAIGN_LESSON_RATE=6.75;
export const CATCHUP_AFTER_MS=270*60*1000;
export const CATCHUP_LESSON_MULTIPLIER=2.5;
export function normalizedCatchupMs(value) {
 return Number.isSafeInteger(value)&&value>=0?Math.min(value,CATCHUP_AFTER_MS):0;
}
export function campaignEnemyScale(stage,otherRouteComplete=false) {
 if(!stage||stage.special)return 1;
 const index=WILD_FOREST_LOCATION_IDS.indexOf(stage.locationId);
 if(index<0)return 1;
 return (otherRouteComplete?second[stage.locationId]?.[stage.stage-1]:undefined)??first[index]?.[stage.stage-1]??1;
}
export function campaignLessonRate(base,complete,claimedMs) {
 return complete?base:Math.round(base*CAMPAIGN_LESSON_RATE*(normalizedCatchupMs(claimedMs)>=CATCHUP_AFTER_MS?CATCHUP_LESSON_MULTIPLIER:1));
}

// Candidate depth profiles; calibrated against complete-location orders.
export const DEPTH_PROFILES=Object.freeze({"forest-gate-1":{"0":1},"forest-gate-2":{"0":1},"forest-gate-3":{"0":1},"forest-gate-4":{"0":1},"forest-gate-5":{"0":1.014},"forest-gate-6":{"0":1.02},"forest-gate-7":{"0":1.021},"forest-gate-8":{"0":1.008},"forest-gate-9":{"0":1.016},"forest-gate-10":{"0":1.012},"sprite-grove-1":{"10":1.024,"16":1.097,"34":1.471},"wolf-den-1":{"10":0.948,"22":1.055,"40":1.382},"sprite-grove-2":{"10":1.019,"16":1.093,"34":1.447},"wolf-den-2":{"10":0.96,"22":1.065,"40":1.364},"sprite-grove-3":{"10":1.017,"16":1.091,"34":1.358},"wolf-den-3":{"10":0.951,"22":1.058,"40":1.408},"sprite-grove-4":{"10":1.023,"16":1.097,"34":1.518},"wolf-den-4":{"10":0.947,"22":1.054,"40":1.381},"sprite-grove-5":{"10":1.023,"16":1.12,"34":1.482},"wolf-den-5":{"10":0.928,"22":1.037,"40":1.442},"sprite-grove-6":{"10":1.02,"16":1.094,"34":1.403},"wolf-den-6":{"10":0.955,"22":1.061,"40":1.384},"sprite-grove-7":{"10":1.043,"16":1.138,"34":1.469},"deeper-woods-1":{"16":0.792,"22":0.824,"28":0.885,"43":1.086,"64":1.377},"sprite-grove-8":{"10":1.046,"16":1.094,"34":1.47},"deeper-woods-2":{"16":0.721,"22":0.89,"28":0.947,"43":1.108,"64":1.411},"sprite-grove-9":{"10":1.057,"16":1.127,"34":1.422},"deeper-woods-3":{"16":0.809,"22":0.809,"28":0.871,"43":1.075,"64":1.348},"sprite-grove-10":{"10":1.047,"16":1.095,"34":1.095},"deeper-woods-4":{"16":0.801,"22":0.832,"28":0.862,"43":1.095,"64":1.356},"sprite-grove-11":{"10":1.057,"16":1.127,"34":1.127},"deeper-woods-5":{"16":0.754,"22":0.754,"28":0.919,"43":1.113,"64":1.373},"sprite-grove-12":{"10":1.056,"16":1.103,"34":1.409},"deeper-woods-6":{"16":0.767,"22":0.865,"28":0.924,"43":1.118,"64":1.356},"deeper-woods-7":{"16":0.896,"22":0.896,"28":0.952,"43":1.111,"64":1.37},"deeper-woods-8":{"16":0.83,"22":0.922,"28":0.95,"43":1.11,"64":1.305},"deeper-woods-9":{"16":0.842,"22":0.932,"28":0.986,"43":1.139,"64":1.367},"deeper-woods-10":{"16":0.851,"22":0.851,"28":0.97,"43":1.074,"64":1.392},"deeper-woods-11":{"16":0.851,"22":0.97,"28":0.996,"43":1.147,"64":1.393},"deeper-woods-12":{"16":0.865,"22":0.952,"28":0.979,"43":1.132,"64":1.34},"ancient-roots-1":{"28":1.066,"46":1.365},"deeper-woods-13":{"16":0.766,"22":0.96,"28":0.986,"43":1.139,"64":1.388},"ancient-roots-2":{"28":1.059,"46":1.338},"deeper-woods-14":{"16":0.921,"22":0.921,"28":1.003,"43":1.153,"64":1.356},"ancient-roots-3":{"28":1.051,"46":1.357},"deeper-woods-15":{"16":0.911,"22":0.967,"28":0.994,"43":1.146,"64":1.392},"ancient-roots-4":{"28":1.061,"46":1.361},"deeper-woods-16":{"16":0.934,"22":0.961,"28":1.014,"43":1.138,"64":1.346},"ancient-roots-5":{"28":1.072,"46":1.413},"deeper-woods-17":{"16":0.937,"22":0.937,"28":0.937,"43":1.18,"64":1.335},"ancient-roots-6":{"28":1.069,"46":1.321},"deeper-woods-18":{"16":0.951,"22":0.951,"28":1.004,"43":1.154,"64":1.357},"ancient-roots-7":{"28":1.144,"46":1.452},"ancient-roots-8":{"28":1.119,"46":1.332},"ancient-roots-9":{"28":1.107,"46":1.303},"ancient-roots-10":{"28":1.119,"46":1.311},"ancient-roots-11":{"28":1.098,"46":1.274},"ancient-roots-12":{"28":1.086,"46":1.243},"ancient-roots-13":{"28":1.074,"46":1.256},"ancient-roots-14":{"28":1.043,"46":1.233},"ancient-roots-15":{"28":1.07,"46":1.23},"heart-of-the-curse-1":{"43":1.096,"61":1.272},"heart-of-the-curse-2":{"43":1.086,"61":1.288},"heart-of-the-curse-3":{"43":1.093,"61":1.275},"heart-of-the-curse-4":{"43":1.081,"61":1.261},"heart-of-the-curse-5":{"43":1.094,"61":1.271},"heart-of-the-curse-6":{"43":1.082,"61":1.262},"heart-of-the-curse-7":{"43":1.062,"61":1.247},"heart-of-the-curse-8":{"43":1.089,"61":1.267},"heart-of-the-curse-9":{"43":1.138,"61":1.301},"heart-of-the-curse-10":{"43":1.109,"61":1.326},"heart-of-the-curse-11":{"43":1.103,"61":1.277},"heart-of-the-curse-12":{"43":1.102,"61":1.276},"heart-of-the-curse-13":{"43":1.115,"61":1.265},"heart-of-the-curse-14":{"43":1.111,"61":1.284},"heart-of-the-curse-15":{"43":1.113,"61":1.285},"heart-of-the-curse-16":{"43":1.126,"61":1.275},"heart-of-the-curse-17":{"43":1.113,"61":1.264},"heart-of-the-curse-18":{"43":1.119,"61":1.268},"heart-of-the-curse-19":{"43":1.107,"61":1.259},"heart-of-the-curse-20":{"43":1.126,"61":1.274},"heart-of-the-curse-21":{"43":1.12,"61":1.29}});
export function campaignDepthScale(stage,depth){
 if(!stage||stage.special)return 1;
 const p=DEPTH_PROFILES[stage.id];if(!p)return campaignEnemyScale(stage,false);
 const keys=Object.keys(p).map(Number).sort((a,b)=>a-b);
 const lo=keys.filter(x=>x<=depth).at(-1)??keys[0],hi=keys.find(x=>x>=depth)??keys.at(-1);
 return lo===hi?p[lo]:p[lo]+(p[hi]-p[lo])*(depth-lo)/(hi-lo);
}

const PARTIAL_ROUTE_OFFSETS=Object.freeze({"wolf-den-2":-0.011,"wolf-den-3":0.014,"wolf-den-5":0.013,"sprite-grove-7":-0.023,"wolf-den-6":0.019,"sprite-grove-8":0.018,"deeper-woods-1":0.01,"deeper-woods-3":0.024,"sprite-grove-9":-0.017,"sprite-grove-10":0.018,"sprite-grove-11":0.016,"deeper-woods-5":0.012,"ancient-roots-3":0.026,"sprite-grove-12":0.019,"deeper-woods-6":0.027,"ancient-roots-4":0.041,"ancient-roots-5":0.016,"deeper-woods-9":-0.02,"ancient-roots-6":0.024,"ancient-roots-7":0.026,"deeper-woods-11":-0.024,"deeper-woods-12":-0.032,"deeper-woods-14":-0.025,"heart-of-the-curse-3":0.02,"deeper-woods-17":-0.023,"heart-of-the-curse-7":0.01,"deeper-woods-18":-0.016,"heart-of-the-curse-10":-0.027,"heart-of-the-curse-14":0.017,"heart-of-the-curse-18":0.016,"heart-of-the-curse-12":-0.009,"deeper-woods-4":0.019,"deeper-woods-13":-0.013,"deeper-woods-15":-0.018,"deeper-woods-16":-0.014,"deeper-woods-2":0.005,"sprite-grove-2":-0.003,"sprite-grove-5":-0.004});
export function campaignPartialScale(stage, outsidePartial){return (PARTIAL_ROUTE_OFFSETS[stage?.id]||0)*Math.min(1,Math.max(0,outsidePartial)/4);}

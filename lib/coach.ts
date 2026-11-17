/** Deterministic, conservative suggestions. No fabricated history. */
export type LoggedSet={date:string;exercise:string;set:number;weight:number;reps:number;rir:number;unit?:string};
export type Suggestion={title:string;detail:string;reason:string;confidence:'history'|'insufficient data'};
export function repBounds(input:string):[number,number]{const n=input.match(/\d+/g)?.map(Number)||[];return [n[0]||8,n[1]||n[0]||12];}
export function suggestLift(name:string,range:string,history:LoggedSet[],increment=5):Suggestion{
 const h=history.filter(s=>s.exercise===name&&s.weight>0&&s.reps>0).sort((a,b)=>b.date.localeCompare(a.date)||a.set-b.set);
 if(!h.length)return {title:'Establish a baseline',detail:'Choose a manageable starting load and log two working sets.',reason:'No valid prior sets for this exact exercise.',confidence:'insufficient data'};
 const last=h[0].date,sets=h.filter(s=>s.date===last).slice(0,2),[low,high]=repBounds(range),load=sets[0].weight;
 if(sets.length<2||sets.some(s=>s.weight!==load))return {title:'Repeat and complete both sets',detail:`Use approximately ${load} lb; record two comparable working sets.`,reason:'Two comparable sets are needed for a reliable progression.',confidence:'history'};
 if(sets.every(s=>s.reps>=high&&s.rir>=0&&s.rir<=2))return {title:'Increase load',detail:`Try ${load+increment} lb for ${low}–${high} reps, if your equipment supports that increment.`,reason:`Both sets reached ${high} reps at appropriate effort.`,confidence:'history'};
 if(sets.some(s=>s.reps<low))return {title:'Reduce load or fatigue',detail:`Consider ${Math.max(increment,load-increment)} lb or additional recovery; keep ${low}–${high} controlled reps.`,reason:'At least one set fell below the prescribed rep range.',confidence:'history'};
 return {title:'Keep the load; add reps',detail:`Stay near ${load} lb and aim to improve one or both sets within ${low}–${high} reps.`,reason:'The top of the range has not been earned on both sets.',confidence:'history'};
}
export type Run={date:string;distance:number;minutes:number;effort:string};
export function suggestRun(runs:Run[],kind:'easy'|'quality'|'long',fatigue:number):Suggestion{
 const valid=runs.filter(r=>r.distance>0&&r.minutes>0).sort((a,b)=>b.date.localeCompare(a.date));
 if(!valid.length)return {title:'Baseline run',detail:kind==='quality'?'Start with easy running and short controlled strides.':'Use an easy conversational effort; log distance, duration, and perceived exertion.',reason:'No run history yet.',confidence:'insufficient data'};
 const recent=valid.slice(0,6),longest=Math.max(...recent.map(r=>r.distance)),weekly=recent.reduce((a,r)=>a+r.distance,0);
 if(fatigue>=4)return {title:'Recovery-first adjustment',detail:'Replace quality work with easy running, or rest if symptoms or fatigue warrant it.',reason:'High self-reported fatigue.',confidence:'history'};
 if(kind==='long')return {title:'Conservative long run',detail:`Keep the next long run near your recent longest (${longest.toFixed(1)} mi); increase only after consistent, comfortable weeks.`,reason:'Avoid automatic mileage jumps from sparse history.',confidence:'history'};
 if(kind==='quality')return {title:'Controlled Thursday quality',detail:'Choose one interval, hill, or tempo session; include warm-up and cooldown. Keep the effort controlled.',reason:`Recent six logged runs total ${weekly.toFixed(1)} miles (not necessarily one calendar week).`,confidence:'history'};
 return {title:'Easy aerobic run',detail:'Run at conversational effort and prioritize freshness for your long run.',reason:'Easy days support recovery between harder sessions.',confidence:'history'};
}
export function suggestedCalories(weights:{date:string;weight:number}[],current:number):Suggestion{
 const byDate=[...weights].filter(x=>x.weight>0).sort((a,b)=>a.date.localeCompare(b.date));
 if(byDate.length<10)return {title:'Collect more weigh-ins',detail:`Keep your current ${current} kcal planning target while collecting at least 10 morning weights over 2+ weeks.`,reason:'Insufficient weight trend to adjust intake.',confidence:'insufficient data'};
 const last=byDate.slice(-7),prior=byDate.slice(-14,-7);if(prior.length<3)return {title:'More history needed',detail:'Continue weighing consistently before changing calories.',reason:'No comparable previous weight window.',confidence:'insufficient data'};
 const avg=(a:typeof last)=>a.reduce((s,x)=>s+x.weight,0)/a.length,delta=avg(last)-avg(prior);
 if(delta<0.15)return {title:'Consider a modest increase',detail:`If adherence is consistent, consider ${current+150} kcal/day and reassess after 2 weeks.`,reason:`Recent average weight change is ${delta.toFixed(2)} lb between available windows.`,confidence:'history'};
 if(delta>1)return {title:'Consider slowing the surplus',detail:`Consider ${Math.max(0,current-150)} kcal/day if the gain rate persists and exceeds your preference.`,reason:`Recent average weight change is ${delta.toFixed(2)} lb between available windows.`,confidence:'history'};
 return {title:'Maintain current intake',detail:`Continue around ${current} kcal/day and monitor the trend.`,reason:`Recent average weight change is ${delta.toFixed(2)} lb between available windows.`,confidence:'history'};
}
export function conflicts(day:string,activity:'heavy legs'|'quality run'|'long run',planned:{day:string;activity:string}[]):string[]{
 const order=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],index=order.indexOf(day);if(index<0)return [];
 return planned.filter(p=>{const d=Math.abs(order.indexOf(p.day)-index);return d<=1&&p.day!==day&&((activity==='heavy legs'&&/quality run|long run/i.test(p.activity))||(/quality run|long run/.test(activity)&&/heavy legs/i.test(p.activity)))}).map(p=>`${p.activity} on ${p.day} may conflict with recovery.`);
}

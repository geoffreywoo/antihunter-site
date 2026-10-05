import {readFile,writeFile} from 'node:fs/promises';
import {median} from './relaunch-baseline.mjs';
// Compile stored evidence only; this performs no X reads or external writes.
export function scorecard(report,progress,asOf){
 const episodes=(report.operatorOriginals||[]).filter(r=>r.campaign?.campaignId==='life-after-scarcity');
 const byId=new Map();for(const r of episodes)if(r.xTweetId)byId.set(r.xTweetId,r);
 const rows=[...byId.values()].map(r=>{const receipt=(progress.episodes||[]).find(e=>e.xPostId===r.xTweetId);return {xPostId:r.xTweetId,episode:r.campaign.episodeId,postedAt:r.postedAt,assistance:receipt?.assistance||'unknown',eligible:r.comparison?.eligible===true,reposts:r.comparison?.eligible?r.comparison.snapshot?.retweets??null:null,impressions:r.comparison?.eligible?r.comparison.snapshot?.impressions??null:null};});
 const reviewed=(progress.contributors||[]).filter(c=>c.verified===true&&c.sourceURL&&c.authorId&&c.episodeId);
 const people=new Map();for(const c of reviewed){const set=people.get(c.authorId)||new Set();set.add(c.episodeId);people.set(c.authorId,set);}
 const groups=['unassisted','assisted','unknown'].map(assistance=>{const p=rows.filter(r=>r.assistance===assistance);return {assistance,posts:p.length,eligible:p.filter(r=>r.eligible).length,medianReposts:median(p.map(r=>r.reposts)),medianImpressions:median(p.map(r=>r.impressions))};});
 return {campaign:'life-after-scarcity',asOf,startsAt:progress.startsAt,confirmedOriginals:rows.length,posts:rows,comparisonGroups:groups,postsWith10ConfirmedUnassistedReposts:rows.filter(r=>r.assistance==='unassisted'&&r.reposts>=10).length,verifiedSourceAccounts:reviewed.length?people.size:null,returningSourceAccounts:reviewed.length?[...people.values()].filter(v=>v.size>1).length:null,coverage:'Only verified stored 24–30h comparisons. Unreviewed participation and unrecorded assistance remain unknown. Source accounts are not automatically deduplicated humans.',creativeReviewDue:rows.length>=6,decision:null};
}
if(process.argv[1]?.endsWith('relaunch-scorecard.mjs')){if(process.argv.length<6)throw Error('Usage: report.json progress.json output.json collection-date');const [report,progress]=await Promise.all(process.argv.slice(2,4).map(p=>readFile(p,'utf8').then(JSON.parse)));const result=scorecard(report,progress,process.argv[5]);await writeFile(process.argv[4],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({confirmedOriginals:result.confirmedOriginals,eligible:result.posts.filter(p=>p.eligible).length}));}

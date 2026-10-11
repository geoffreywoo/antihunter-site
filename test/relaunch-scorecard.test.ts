import {test} from 'node:test';import assert from 'node:assert/strict';import {scorecard} from '../scripts/relaunch-scorecard.mjs';
test('unknown assistance and missing windows cannot qualify as organic success',()=>{
 const campaign={campaignId:'life-after-scarcity',episodeId:'one'};
 const s=scorecard({operatorOriginals:[{xTweetId:'1',campaign,comparison:{eligible:true,snapshot:{retweets:11}}},{xTweetId:'1',campaign,comparison:{eligible:true,snapshot:{retweets:11}}},{xTweetId:'2',campaign,performance:{retweets:30},comparison:{eligible:false}}]},{episodes:[{xPostId:'2',assistance:'unassisted'}],contributors:[]},'2026-10-05');
 assert.equal(s.confirmedOriginals,2);assert.equal(s.postsWith10ConfirmedUnassistedReposts,0);assert.equal(s.verifiedSourceAccounts,null);assert.equal(s.posts[1].reposts,null);
});

test('quotes retain earliest coverage and official receipt time without lifetime fallback',()=>{
 const campaign={campaignId:'life-after-scarcity',episodeId:'one'};
 const s=scorecard({operatorOriginals:[
 {xTweetId:'1',campaign,postedAt:'stored-time',comparison:{eligible:true,snapshot:{checkedAt:'earliest-time',quotes:0,publicMetricAvailability:{quotes:true}}}},
 {xTweetId:'2',campaign,performance:{quotes:99},comparison:{eligible:true,snapshot:{quotes:0,publicMetricAvailability:{quotes:false}}}},
 {xTweetId:'3',campaign,performance:{quotes:99},comparison:{eligible:false,snapshot:{quotes:4,publicMetricAvailability:{quotes:true}}}}
 ]},{episodes:[{xPostId:'1',postedAt:'official-time'}],contributors:[]},'2026-10-10');
 assert.equal(s.posts[0].postedAt,'official-time');assert.equal(s.posts[0].observedAt,'earliest-time');assert.equal(s.posts[0].quotes,0);
 assert.equal(s.posts[1].quotes,null);assert.equal(s.posts[2].quotes,null);assert.equal(s.posts[2].observedAt,null);
});


test('participation exposes reviewed references without inventing remixes or leaking source identities',()=>{
 const privateURL='https://example.test/private-artifact';
 const s=scorecard({}, {reviews:[{receipt:{artifactUrl:privateURL,sourceAuthorId:'private-author'}},{receipt:{artifactUrl:privateURL}},{receipt:{artifactUrl:null}}],contributors:[]},'2026-10-11');
 assert.equal(s.participation.reviewedArtifactURLs,1);
 assert.equal(s.participation.confirmedContributionRecords,0);
 assert.equal(s.participation.substantiveRemixes,null);
 assert.equal(s.participation.verifiedIndependentHumans,null);
 assert.equal(JSON.stringify(s).includes(privateURL),false);
 assert.equal(JSON.stringify(s).includes('private-author'),false);
});


test('visual jokes remain in all-original reporting but do not advance the six-episode review',()=>{
 const operatorOriginals=Array.from({length:6},(_,i)=>({xTweetId:String(i),campaign:{campaignId:'life-after-scarcity',episodeId:String(i)}}));
 const episodes=operatorOriginals.map((r,i)=>({xPostId:r.xTweetId,format:i<3?'story':'visual-joke'}));
 let result=scorecard({operatorOriginals},{episodes},'2026-10-11');
 assert.equal(result.confirmedOriginals,6);assert.equal(result.narrativeEpisodes,3);assert.equal(result.creativeReviewDue,false);
 result=scorecard({operatorOriginals},{episodes:episodes.map(e=>({...e,format:'story'}))},'2026-10-11');assert.equal(result.creativeReviewDue,true);
 assert.equal(scorecard({operatorOriginals},{},'2026-10-11').narrativeEpisodes,0);
});

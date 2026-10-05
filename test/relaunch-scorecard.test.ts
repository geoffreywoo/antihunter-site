import {test} from 'node:test';import assert from 'node:assert/strict';import {scorecard} from '../scripts/relaunch-scorecard.mjs';
test('unknown assistance and missing windows cannot qualify as organic success',()=>{
 const campaign={campaignId:'life-after-scarcity',episodeId:'one'};
 const s=scorecard({operatorOriginals:[{xTweetId:'1',campaign,comparison:{eligible:true,snapshot:{retweets:11}}},{xTweetId:'1',campaign,comparison:{eligible:true,snapshot:{retweets:11}}},{xTweetId:'2',campaign,performance:{retweets:30},comparison:{eligible:false}}]},{episodes:[{xPostId:'2',assistance:'unassisted'}],contributors:[]},'2026-10-05');
 assert.equal(s.confirmedOriginals,2);assert.equal(s.postsWith10ConfirmedUnassistedReposts,0);assert.equal(s.verifiedSourceAccounts,null);assert.equal(s.posts[1].reposts,null);
});

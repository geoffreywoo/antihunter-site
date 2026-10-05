import {test} from 'node:test';
import assert from 'node:assert/strict';
import {uniqueOriginals,baseline} from '../scripts/relaunch-baseline.mjs';
test('repeated snapshots cannot inflate originals and missing comparison stays unknown',()=>{
 const rows=[{xTweetId:'1',postedAt:'2026-10-01T00:00:00Z',performance:{checkedAt:'2026-10-02T00:00:00Z',retweets:50}},{xTweetId:'1',postedAt:'2026-10-01T00:00:00Z',performance:{checkedAt:'2026-10-03T00:00:00Z',retweets:60}},{xTweetId:'2',postedAt:'2026-10-02T00:00:00Z',comparison:{eligible:true,snapshot:{retweets:0,impressions:10}}}];
 assert.equal(uniqueOriginals(rows).length,2);assert.equal(uniqueOriginals(rows)[1].performance.retweets,60);
 const b=baseline({verifiedAt:'2026-10-05',operatorOriginals:rows});assert.equal(b.uniqueOriginals,2);assert.equal(b.eligibleComparisons,1);assert.equal(b.medianRepostsAt24To30Hours,0);assert.equal(b.posts[1].reposts,null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeCohort, recordInventedResults, compareCohorts } from '../src/lib/outcome-coverage.mjs';
const fixture = JSON.parse(readFileSync(new URL('../src/data/outcome-coverage.json', import.meta.url), 'utf8'));
const [a, b] = fixture.cohorts;
test('perfect among recorded outcomes leaves a wide fixed-cohort interval', () => {
  assert.deepEqual(summarizeCohort(a), {total:100,passed:20,failed:0,unknown:80,known:20,observedPassRate:1,outcomeCoverage:.2,minimumPassRate:.2,maximumPassRate:1});
});
test('less perfect among recorded outcomes has higher coverage and narrower bounds', () => {
  assert.deepEqual(summarizeCohort(b), {total:100,passed:70,failed:10,unknown:20,known:80,observedPassRate:.875,outcomeCoverage:.8,minimumPassRate:.7,maximumPassRate:.9});
});
test('compatible hidden outcomes can reverse the initial apparent ordering', () => {
  assert.equal(compareCohorts(a,b),'unresolved');
  assert.equal(compareCohorts(recordInventedResults(a,'passed',80),recordInventedResults(b,'failed',20)),'a_strictly_higher');
  assert.equal(compareCohorts(recordInventedResults(a,'failed',80),recordInventedResults(b,'passed',20)),'b_strictly_higher');
});
test('no recorded outcomes leaves the observed rate unknown, rather than zero', () => {
  const x=summarizeCohort({total:100,passed:0,failed:0,unknown:100});
  assert.equal(x.observedPassRate,null);assert.equal(x.outcomeCoverage,0);assert.equal(x.minimumPassRate,0);assert.equal(x.maximumPassRate,1);
});
test('an empty cohort has no defined rate or comparison', () => {
  const empty={total:0,passed:0,failed:0,unknown:0};const x=summarizeCohort(empty);
  for(const key of ['observedPassRate','outcomeCoverage','minimumPassRate','maximumPassRate'])assert.equal(x[key],null);
  assert.equal(compareCohorts(empty,a),'undefined');
});
test('invalid count types, overflow and inconsistent partitions are rejected', () => {
  for(const n of [-1,.5,'20',NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>summarizeCohort({...a,passed:n}));
  for(const bad of [{...a,unknown:79},{...a,failed:81},{...a,total:19},null])assert.throws(()=>summarizeCohort(bad));
});
test('recording invented results preserves the cohort, caps the last batch and does not mutate input', () => {
  const before=structuredClone(a);const partial=recordInventedResults(a,'failed',77),last=recordInventedResults(partial,'passed',10);
  assert.deepEqual(a,before);assert.equal(last.total,100);assert.equal(last.passed,23);assert.equal(last.failed,77);assert.equal(last.unknown,0);
  assert.deepEqual(recordInventedResults(last,'passed'),last);
  for(const count of [0,-1,.5,'10',Infinity])assert.throws(()=>recordInventedResults(a,'passed',count));
  assert.throws(()=>recordInventedResults(a,'unknown'));
});
test('a touching endpoint does not guarantee a strictly higher rate', () => {
  assert.equal(compareCohorts({total:10,passed:9,failed:0,unknown:1},{total:10,passed:8,failed:1,unknown:1}),'unresolved');
  assert.equal(compareCohorts({total:10,passed:9,failed:1,unknown:0},{total:20,passed:18,failed:2,unknown:0}),'equal');
});
test('near-equal large integer fractions compare exactly despite rounded display rates', () => {
  const n=Number.MAX_SAFE_INTEGER;
  assert.equal(compareCohorts({total:n,passed:n-1,failed:1,unknown:0},{total:n-1,passed:n-2,failed:1,unknown:0}),'a_strictly_higher');
});
test('each additional invented record narrows or preserves the possible interval', () => {
  for(const outcome of ['passed','failed']){let x=a;for(let i=0;i<8;i++){const before=summarizeCohort(x);x=recordInventedResults(x,outcome);const after=summarizeCohort(x);assert(after.minimumPassRate>=before.minimumPassRate);assert(after.maximumPassRate<=before.maximumPassRate);}assert.equal(x.unknown,0);}
});
test('small complete enumerations attain both endpoints and stay inside the bounds', () => {
  for(let total=1;total<=8;total++)for(let passed=0;passed<=total;passed++)for(let failed=0;failed<=total-passed;failed++){
    const unknown=total-passed-failed,x=summarizeCohort({total,passed,failed,unknown});
    const possible=Array.from({length:unknown+1},(_,n)=>(passed+n)/total);
    assert.equal(Math.min(...possible),x.minimumPassRate);assert.equal(Math.max(...possible),x.maximumPassRate);
    for(const rate of possible)assert(rate>=x.minimumPassRate&&rate<=x.maximumPassRate);
  }
});

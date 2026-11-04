import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dispatch } from '../src/lib/supply-timing.mjs';
const fixture=JSON.parse(readFileSync(new URL('../src/data/supply-timing.json',import.meta.url),'utf8'));
const handCases=[{"id":"flat-no-storage","input":{"generationMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":0,"chargeMW":0,"dischargeMW":0,"eta":1,"initialMWh":0}},"expected":{"generationMWh":24,"loadMWh":24,"servedMWh":24,"curtailedMWh":0,"unservedMWh":0,"finalStoredMWh":0}},{"id":"block-no-storage","input":{"generationMW":[2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":0,"chargeMW":0,"dischargeMW":0,"eta":1,"initialMWh":0}},"expected":{"servedMWh":12,"curtailedMWh":12,"unservedMWh":12,"finalStoredMWh":0}},{"id":"block-ideal-storage","input":{"generationMW":[2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":12,"chargeMW":1,"dischargeMW":1,"eta":1,"initialMWh":0}},"expected":{"directMWh":12,"chargedInputMWh":12,"dischargedOutputMWh":12,"servedMWh":24,"conversionLossMWh":0,"curtailedMWh":0,"unservedMWh":0,"finalStoredMWh":0}},{"id":"block-lossy-storage","input":{"generationMW":[2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":12,"chargeMW":1,"dischargeMW":1,"eta":0.8,"initialMWh":0}},"expected":{"directMWh":12,"chargedInputMWh":12,"dischargedOutputMWh":9.6,"servedMWh":21.6,"conversionLossMWh":2.4,"curtailedMWh":0,"unservedMWh":2.4,"finalStoredMWh":0}},{"id":"block-small-capacity","input":{"generationMW":[2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":6,"chargeMW":1,"dischargeMW":1,"eta":1,"initialMWh":0}},"expected":{"servedMWh":18,"curtailedMWh":6,"unservedMWh":6,"finalStoredMWh":0}},{"id":"block-slow-charge","input":{"generationMW":[2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":12,"chargeMW":0.5,"dischargeMW":1,"eta":0.8,"initialMWh":0}},"expected":{"servedMWh":16.8,"chargedInputMWh":6,"dischargedOutputMWh":4.8,"conversionLossMWh":1.2,"curtailedMWh":6,"unservedMWh":7.2,"finalStoredMWh":0}},{"id":"block-slow-discharge","input":{"generationMW":[2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":12,"chargeMW":1,"dischargeMW":0.5,"eta":1,"initialMWh":0}},"expected":{"servedMWh":18,"curtailedMWh":0,"unservedMWh":6,"finalStoredMWh":6}},{"id":"late-block-empty-start","input":{"generationMW":[0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2],"loadMW":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"storage":{"capacityMWh":12,"chargeMW":1,"dischargeMW":1,"eta":1,"initialMWh":0}},"expected":{"servedMWh":12,"curtailedMWh":0,"unservedMWh":12,"finalStoredMWh":12}}];
const spec={proposedCasesToVerify:handCases};
const inputFor=c=>structuredClone(c.input);
const close=(a,b)=>assert(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
function balances(input,result) {
  const {rows,totals:t}=result,s=input.storage;
  for(const row of rows){
    close(row.generationMWh,row.directMWh+row.chargedInputMWh+row.curtailedMWh);
    close(row.loadMWh,row.servedMWh+row.unservedMWh);
    close(row.storedAfterMWh,row.storedBeforeMWh+s.eta*row.chargedInputMWh-row.dischargedOutputMWh);
    assert(row.storedAfterMWh>=0&&row.storedAfterMWh<=s.capacityMWh);
    assert(row.chargedInputMWh<=s.chargeMW&&row.dischargedOutputMWh<=s.dischargeMW);
    assert(!(row.chargedInputMWh>0&&row.dischargedOutputMWh>0));
  }
  close(t.generationMWh+t.initialStoredMWh,t.servedMWh+t.curtailedMWh+t.conversionLossMWh+t.finalStoredMWh);
  close(t.loadMWh,t.servedMWh+t.unservedMWh);
}

test('all eight independently hand-worked specification cases match, including losses and carryout',()=>{
  for(const c of spec.proposedCasesToVerify){const input=inputFor(c),r=dispatch(input);for(const [key,value] of Object.entries(c.expected))close(r.totals[key],value);assert.equal(r.rows.length,24);balances(input,r);}
});
test('lossy case ends with a fractional discharge, with every initial/final balance visible',()=>{
  const r=dispatch(inputFor(spec.proposedCasesToVerify.find(x=>x.id==='block-lossy-storage')));
  close(r.rows[21].dischargedOutputMWh,.6);close(r.rows[21].unservedMWh,.4);close(r.rows[21].storedAfterMWh,0);
  close(r.rows[22].unservedMWh,1);close(r.rows[23].unservedMWh,1);close(r.totals.dischargedOutputMWh/r.totals.chargedInputMWh,.8);
});
test('same daily energy has a different finite-window outcome when the block occurs last',()=>{
  const early=dispatch(inputFor(spec.proposedCasesToVerify.find(x=>x.id==='block-ideal-storage'))),late=dispatch(inputFor(spec.proposedCasesToVerify.find(x=>x.id==='late-block-empty-start')));
  close(early.totals.generationMWh,late.totals.generationMWh);close(early.totals.servedMWh,24);close(late.totals.servedMWh,12);close(late.totals.finalStoredMWh,12);
});
test('initial reserves can serve load without current generation and must not become measured round-trip efficiency',()=>{
  const input={generationMW:[0,0],loadMW:[1,1],storage:{capacityMWh:2,chargeMW:1,dischargeMW:1,eta:.8,initialMWh:2}},r=dispatch(input);
  close(r.totals.servedMWh,2);close(r.totals.chargedInputMWh,0);close(r.totals.initialStoredMWh,2);close(r.totals.finalStoredMWh,0);assert(!('measuredEfficiency' in r.totals));balances(input,r);
});
test('zero load and a full account curtail excess supply, while capacity does not create charge',()=>{
  for(const initialMWh of [0,2]){
    const input={generationMW:[1,1],loadMW:[0,0],storage:{capacityMWh:2,chargeMW:.5,dischargeMW:1,eta:.8,initialMWh}},r=dispatch(input);balances(input,r);close(r.totals.servedMWh,0);
    if(initialMWh===2){close(r.totals.chargedInputMWh,0);close(r.totals.curtailedMWh,2);}else close(r.totals.finalStoredMWh,.8);
  }
});
test('invalid, missing, sparse, overflow-range and inconsistent inputs fail without coercion',()=>{
  const good=inputFor(spec.proposedCasesToVerify[3]);
  for(const bad of [-1,NaN,Infinity,'1',null,undefined,1_000_001]){
    assert.throws(()=>dispatch({...good,generationMW:[bad,...good.generationMW.slice(1)]}));
    assert.throws(()=>dispatch({...good,loadMW:[bad,...good.loadMW.slice(1)]}));
    assert.throws(()=>dispatch({...good,storage:{...good.storage,capacityMWh:bad}}));
  }
  for(const eta of [0,-.1,1.01,NaN,Infinity,'0.8',null])assert.throws(()=>dispatch({...good,storage:{...good.storage,eta}}));
  for(const input of [null,{...good,generationMW:[]},{...good,generationMW:Array(24)},{...good,loadMW:[1]},{...good,generationMW:Array(25).fill(1),loadMW:Array(25).fill(1)},{...good,storage:null},{...good,storage:{...good.storage,initialMWh:13}}])assert.throws(()=>dispatch(input));
});
test('simulation does not mutate inputs and scales with every energy and rate',()=>{
  const input=inputFor(spec.proposedCasesToVerify[3]),before=structuredClone(input),base=dispatch(input);assert.deepEqual(input,before);
  for(const factor of [.25,3,17]){
    const scaled={generationMW:input.generationMW.map(x=>x*factor),loadMW:input.loadMW.map(x=>x*factor),storage:{...input.storage,capacityMWh:input.storage.capacityMWh*factor,chargeMW:input.storage.chargeMW*factor,dischargeMW:input.storage.dischargeMW*factor}},r=dispatch(scaled);
    for(const key of Object.keys(base.totals))close(r.totals[key],base.totals[key]*factor);balances(scaled,r);
  }
});
test('seeded irregular profiles preserve physical accounting and every power/capacity limit',()=>{
  let seed=20261104;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32;};
  for(let i=0;i<1000;i++){
    const capacityMWh=random()*24,input={generationMW:Array.from({length:24},()=>random()*3),loadMW:Array.from({length:24},()=>random()*2),storage:{capacityMWh,chargeMW:random()*2,dischargeMW:random()*2,eta:.2+.8*random(),initialMWh:random()*capacityMWh}};
    balances(input,dispatch(input));
  }
});

// Independent feasible-flow oracle: enumerate direct/charge/discharge choices on
// a quarter-MWh grid, retain the best served total at each possible inventory.
// It has no direct-first or greedy policy, and no dispatch() calls internally.
function bestServed(generation,load,capacity,rate,eta) {
  let inventories=new Map([[0,0]]);
  for(let h=0;h<generation.length;h++){
    const next=new Map(),g=4*generation[h],l=4*load[h],cap=4*capacity,limit=4*rate;
    for(const [stored,served] of inventories)for(let direct=0;direct<=Math.min(g,l);direct++)for(let charge=0;charge<=Math.min(g-direct,limit);charge++){
      const added=eta*charge;if(!Number.isInteger(added))continue;
      for(let discharge=0;discharge<=Math.min(l-direct,limit,stored);discharge++){
        if(charge&&discharge)continue;const after=stored+added-discharge;if(after<0||after>cap)continue;
        next.set(after,Math.max(next.get(after)??-Infinity,served+direct+discharge));
      }
    }
    inventories=next;
  }
  return Math.max(...inventories.values())/4;
}
test('greedy totals match an independent feasible-flow search on 8,748 small three-hour cases',()=>{
  let count=0;
  for(let code=0;code<3**6;code++){
    let digits=code;const values=Array.from({length:6},()=>{const x=digits%3;digits=Math.floor(digits/3);return x;}),generationMW=values.slice(0,3),loadMW=values.slice(3);
    for(const capacityMWh of [0,1,2])for(const rate of [.5,1])for(const eta of [.5,1]){
      const input={generationMW,loadMW,storage:{capacityMWh,chargeMW:rate,dischargeMW:rate,eta,initialMWh:0}},r=dispatch(input);
      close(r.totals.servedMWh,bestServed(generationMW,loadMW,capacityMWh,rate,eta));balances(input,r);count++;
    }
  }
  assert.equal(count,8748);
});

 test("public complete fixture reproduces every input, hourly row, setting and total",()=>{assert.equal(fixture.cases.length,8);for(const c of fixture.cases){const result=dispatch(c.input);assert.deepEqual(result.rows,c.rows);assert.deepEqual(result.totals,c.totals);assert.deepEqual(result.settings,c.settings);assert.equal(c.rows.length,24);}});

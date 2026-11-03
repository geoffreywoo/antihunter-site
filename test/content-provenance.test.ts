import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';
const fixture=JSON.parse(readFileSync(new URL('../src/data/content-provenance-example.json',import.meta.url),'utf8'));
const bytes=(path:string)=>readFileSync(new URL('../public'+path,import.meta.url));
const sha=(value:Buffer)=>createHash('sha256').update(value).digest('hex');
test('two external captions load identical actual bytes, while changed artwork changes the declared digest',()=>{
  const original=bytes(fixture.asset.path),changed=bytes(fixture.changedAsset.path);
  assert.equal(original.length,fixture.asset.bytes);assert.equal(changed.length,fixture.changedAsset.bytes);
  assert.equal(sha(original),fixture.asset.sha256);assert.equal(sha(changed),fixture.changedAsset.sha256);assert.notEqual(sha(original),sha(changed));
  assert.equal(fixture.externalCaptions.length,2);assert.notEqual(fixture.externalCaptions[0].text,fixture.externalCaptions[1].text);
  for(const caption of fixture.externalCaptions){assert.deepEqual(bytes(caption.assetPath),original);assert(!original.toString().includes(caption.text));}
  assert.equal(changed.toString().replaceAll('#efb06e','#75c9ed'),original.toString());
});
test('original fixture files contain no active or external content and claim no signature or C2PA verification',()=>{
  for(const asset of [fixture.asset,fixture.changedAsset]){const source=bytes(asset.path).toString();assert(!/<script|<foreignObject|\son\w+=|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(source));assert(source.includes('not a photograph'));}
  assert.equal(fixture.C2PAVerificationPerformed,false);assert.equal(fixture.signedAsset,false);assert.equal(fixture.thirdPartyMedia,false);
});

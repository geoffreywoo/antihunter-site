// Invented-marker arithmetic only. This does not define a vendor's benchmark metrics.
export function summarizeSyntheticTiming({requestSentAtMs,recordedTokenArrivalsMs}) {
 if(typeof requestSentAtMs!=='number'||!Number.isFinite(requestSentAtMs)||requestSentAtMs<0)throw new TypeError('A finite nonnegative synthetic request timestamp is required.');
 if(!Array.isArray(recordedTokenArrivalsMs))throw new TypeError('A synthetic marker array is required.');
 let previous=requestSentAtMs;
 for(const arrival of recordedTokenArrivalsMs){if(typeof arrival!=='number'||!Number.isFinite(arrival)||arrival<previous)throw new RangeError('Synthetic arrivals must be finite, at or after request, and nondecreasing.');previous=arrival;}
 const n=recordedTokenArrivalsMs.length,gaps=Math.max(0,n-1),first=n?recordedTokenArrivalsMs[0]:null,last=n?recordedTokenArrivalsMs[n-1]:null,span=n>1?last-first:null;
 return {recordedTokenCount:n,recordedGapCount:gaps,requestToFirstRecordedTokenMs:first===null?null:first-requestSentAtMs,requestToLastRecordedTokenMs:last===null?null:last-requestSentAtMs,meanRecordedGapRatePerSecond:gaps>0&&span>0?gaps*1000/span:null,gapRateStatus:gaps===0?'insufficient_events':span===0?'zero_observed_span':'available'};
}

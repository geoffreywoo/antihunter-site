// Original constructed-count illustration. No measured classifier or future forecast.
const fields=['truePositive','falsePositive','falseNegative','trueNegative'];
function gcd(a,b){while(b){[a,b]=[b,a%b];}return a;}
function fraction(n,d){if(d===0)return null;const a=BigInt(n),b=BigInt(d),g=gcd(a,b);return {numerator:String(a/g),denominator:String(b/g)};}
export function summarizeCounts(cells){
 if(!cells||typeof cells!=='object'||Array.isArray(cells)||Object.keys(cells).length!==4||Object.keys(cells).some(k=>!fields.includes(k)))throw new TypeError('Four explicit cell counts required');
 for(const k of fields)if(!Number.isSafeInteger(cells[k])||cells[k]<0||cells[k]>1_000_000_000)throw new TypeError('Cell counts must be integers from 0 to 1000000000');
 const {truePositive:tp,falsePositive:fp,falseNegative:fn,trueNegative:tn}=cells;
 const actualTarget=tp+fn,actualOther=fp+tn,flagged=tp+fp,unflagged=fn+tn,total=actualTarget+actualOther;
 return {cells:{...cells},counts:{total,actualTarget,actualOther,flagged,unflagged},ratios:{prevalence:fraction(actualTarget,total),truePositiveRate:fraction(tp,actualTarget),falsePositiveRate:fraction(fp,actualOther),flaggedTargetShare:fraction(tp,flagged),flaggedOtherShare:fraction(fp,flagged),accuracy:fraction(tp+tn,total)}};
}
export function sameRatio(a,b){return a!==null&&b!==null&&BigInt(a.numerator)*BigInt(b.denominator)===BigInt(b.numerator)*BigInt(a.denominator);}
export const cases=[
 {id:'rare-target',label:'100 targets in 10,000 items',cells:{truePositive:90,falsePositive:99,falseNegative:10,trueNegative:9801}},
 {id:'common-target',label:'5,000 targets in 10,000 items',cells:{truePositive:4500,falsePositive:50,falseNegative:500,trueNegative:4950}},
];

// import { generateProof } from '@semaphore-protocol/proof';
// console.log('generateProof:', generateProof.toString());

// check-proof-version.js
const proofPkg = await import('@semaphore-protocol/proof/package.json', {
  assert: { type: "json" }
});
console.log('Semaphore proof version:', proofPkg.default.version);
const fs = require('fs');

const proof = JSON.parse(fs.readFileSync('proof.json'));
const publicSignals = JSON.parse(fs.readFileSync('public.json'));

const precomputedProof = {
  proof,
  publicSignals
};

fs.writeFileSync('precomputed_proof.json', JSON.stringify(precomputedProof, null, 2));

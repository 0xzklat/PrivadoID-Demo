// circuit.circom
pragma circom 2.2.2;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Circuit to prove age > 18 and residency (e.g., Mexico state code)
template AgeResidencyProof() {
    // Private inputs from scan module
    signal input birthYear; // e.g., 1985
    signal input birthMonth; // 1-12
    signal input birthDay; // 1-31
    signal input stateCode; // Hashed state code (field element)
    // Public inputs
    signal input currentYear; // e.g., 2025
    signal input expectedState; // Hashed state code (public)
    // Outputs (public signals)
    signal output ageValid; // 1 if age > 18, else 0
    signal output residencyValid; // 1 if state matches, else 0

    // Age proof: Compute years difference
    signal age;
    age <== currentYear - birthYear;
    component greaterThan = GreaterThan(32);
    greaterThan.in[0] <== age;
    greaterThan.in[1] <== 18;
    ageValid <== greaterThan.out;

    // Residency proof: Poseidon hash state code and compare
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== stateCode;
    component isEqual = IsEqual();
    isEqual.in[0] <== poseidon.out;
    isEqual.in[1] <== expectedState;
    residencyValid <== isEqual.out;

    // Full birthdate validation
    component monthGt0 = GreaterThan(4);
    monthGt0.in[0] <== birthMonth;
    monthGt0.in[1] <== 0;
    monthGt0.out === 1;

    component lessEq12 = LessEqThan(4);
    lessEq12.in[0] <== birthMonth;
    lessEq12.in[1] <== 12;
    lessEq12.out === 1;

    component dayGt0 = GreaterThan(5);
    dayGt0.in[0] <== birthDay;
    dayGt0.in[1] <== 0;
    dayGt0.out === 1;

    component lessEq31 = LessEqThan(5);
    lessEq31.in[0] <== birthDay;
    lessEq31.in[1] <== 31;
    lessEq31.out === 1;

    component yearGt1900 = GreaterThan(12);
    yearGt1900.in[0] <== birthYear;
    yearGt1900.in[1] <== 1900;
    yearGt1900.out === 1;

    component yearLtCurrent = LessThan(12);
    yearLtCurrent.in[0] <== birthYear;
    yearLtCurrent.in[1] <== currentYear;
    yearLtCurrent.out === 1;
}

component main {public [currentYear, expectedState]} = AgeResidencyProof();
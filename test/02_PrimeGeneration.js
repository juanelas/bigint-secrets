'use strict';

const expect = require('chai').expect;
const primes = require('../dist/bigint-secrets-latest.node');

const bitLengths = [
    256,
    512,
    1024,
    2048,
    3072
];

describe('Testing generation of prime numbers', function () {
    for (const bitLength of bitLengths) {
        describe(`Executing prime(${bitLength})`, function () {
            it(`should return a random ${bitLength}-bits probable prime`, async function () {
                let prime = await primes.prime(bitLength);
                const ret = await primes.isProbablyPrime(prime);
                expect(ret).to.equal(true);
                let bits = 1;
                do {
                    bits++;
                } while ((prime >>= BigInt(1)) > BigInt(1));
                expect(bits).to.equal(bitLength);
            });
        });
    }
});
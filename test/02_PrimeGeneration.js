'use strict';

const expect = require('chai').expect;
const primes = require('../src/main');

const bitLengths = [
    256,
    512,
    1024,
    1536,
    2048,
    3072,
    4096
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
                } while ((prime >>= 1n) > 1n)
                expect(bits).to.equal(bitLength);
            });
        });
    }
});
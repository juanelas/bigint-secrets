'use strict';

const modArith = require('bigint-mod-arith');

/**
 * Secure random bytes for both node and browsers
 * 
 * @param {number} byteLength The desired number of random bytes
 * @param {boolean} forceLength If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1
 * 
 * @returns {Promise} A promise that resolves to a Buffer/UInt8Array filled with cryptographically secure random bytes
 */
const randBytes = async function (byteLength, forceLength = false) {
	let buf;
	if (typeof window === 'undefined') {  // node
		const crypto = require('crypto');
		buf = Buffer.alloc(byteLength);
		crypto.randomFillSync(buf);
	} else { // browser
		buf = new Uint8Array(byteLength);
		window.crypto.getRandomValues(buf);
	}

	// If fixed length is required we put the first bit to 1 -> to get the necessary bitLength
	if (forceLength)
		buf[0] = buf[0] | 128;

	return buf;
};

/**
 * Returns a cryptographically secure random integer between [min,max]
 * @param {bigint} max Returned value will be < max
 * @param {bigint} min Returned value will be > max
 * 
 * @returns {Promise} A promise that resolves to a cryptographically secure random bigint between [min,max]
 */
const randBetween = async function (max, min = 1) {
	let bitLen = bitLength(max);
	let byteLength = bitLen >> 3;
	let remaining = bitLen - (byteLength * 8);
	let extraBits;
	if (remaining > 0) {
		byteLength++;
		extraBits = 2 ** remaining - 1;
	}

	let rnd;
	do {
		let buf = await randBytes(byteLength);
		// remove extra bits
		if (remaining > 0)
			buf[0] = buf[0] & extraBits;
		rnd = fromBuffer(buf);
	} while (rnd > max || rnd < min)
	return rnd;
};

/**
 * Miller-Rabin Probabilistic Primality Test. FIPS 186-4 C.3.1
 * 
 * @param {bigint} w An integer to be tested for primality
 * @param {number} iterations The number of iterations for the primality test. The value shall be consistent with Table C.1, C.2 or C.3
 * 
 * @return {Promise} A promise that resolve to a boolean that is either true (a probably prime number) or false (definitely composite)
 */
const isProbablyPrime = async function (w, iterations = 41) {
	/*
	PREFILTERING. Even values but 2 are not primes, so don't test. 
	1 is not a prime and the M-R algorithm needs w>1.
	*/
	if (w === 2n)
		return true;
	else if ((w & 1n) === 0n || w === 1n)
		return false;

	/*
	1. Let a be the largest integer such that 2**a divides w−1.
	2. m = (w−1) / 2**a.
	3. wlen = len (w).
	4. For i = 1 to iterations do
		4.1 Obtain a string b of wlen bits from an RBG.
		Comment: Ensure that 1 < b < w−1.
		4.2 If ((b ≤ 1) or (b ≥ w−1)), then go to step 4.1.
		4.3 z = b**m mod w.
		4.4 If ((z = 1) or (z = w − 1)), then go to step 4.7.
		4.5 For j = 1 to a − 1 do.
		4.5.1 z = z**2 mod w.
		4.5.2 If (z = w−1), then go to step 4.7.
		4.5.3 If (z = 1), then go to step 4.6.
		4.6 Return COMPOSITE.
		4.7 Continue.
		Comment: Increment i for the do-loop in step 4.
	5. Return PROBABLY PRIME.
	*/
	let a = 0n, d = w - 1n;
	while (d % 2n === 0n) {
		d /= 2n;
		++a;
	}

	let m = (w - 1n) / (2n ** a);

	loop: do {
		let b = await randBetween(w - 1n, 2);
		let z = modArith.modPow(b, m, w);
		if (z === 1n || z === w - 1n)
			continue;

		for (let j = 1; j < a; j++) {
			z = modArith.modPow(z, 2n, w);
			if (z === w - 1n)
				continue loop;
			if (z === 1n)
				break;
		}
		return false;
	} while (--iterations);

	return true;
};

/**
 * A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator
 *  
 * @param {number} bitLength The required bit lenght for the generated prime
 * @param {number} iterations The number of iterations for the Miller-Rabin Probabilistic Primality Test
 * 
 * @returns {Promise} A promise that resolves to a bigint probable prime of bitLength bits
 */
const prime = async function (bitLength, iterations = 41) {
	let rnd = 0n;
	do {
		rnd = fromBuffer(await randBytes(bitLength / 8, true));
	} while (! await isProbablyPrime(rnd, iterations))
	return rnd;
};


function fromBuffer(buf) {
	let ret = 0n;
	for (let i of buf.values()) {
		let bi = BigInt(i);
		ret = (ret << 8n) + bi;
	}
	return ret;
}

function bitLength(a) {
	let bits = 1;
	do {
		bits++;
	} while ((a >>= 1n) > 1n)
	return bits;
}

module.exports = {
	isProbablyPrime: isProbablyPrime,
	prime: prime,
	randBetween: randBetween,
	randBytes: randBytes
};
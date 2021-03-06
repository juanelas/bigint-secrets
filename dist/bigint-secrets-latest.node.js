'use strict';

const modArith = require('bigint-mod-arith');

/**
 * Secure random bytes for both node and browsers. Browser implementation uses WebWorkers in order to not lock the main process
 * 
 * @param {number} byteLength The desired number of random bytes
 * @param {boolean} forceLength If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1
 * 
 * @returns {Promise} A promise that resolves to a Buffer/UInt8Array filled with cryptographically secure random bytes
 */
const randBytes = async function (byteLength, forceLength = false) {
    return new Promise((resolve) => {
        let buf;
        const resolver = (err, buf) => {
            // If fixed length is required we put the first bit to 1 -> to get the necessary bitLength
            if (forceLength)
                buf[0] = buf[0] | 128;

            resolve(buf);
        };

        {  // node
            const crypto = require('crypto');
            buf = Buffer.alloc(byteLength);
            crypto.randomFill(buf, resolver);
        }
    });
};

/**
 * Returns a cryptographically secure random integer between [min,max]
 * @param {bigint} max Returned value will be <= max
 * @param {bigint} min Returned value will be >= min
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
    } while (rnd > max || rnd < min);
    return rnd;
};

/**
 * The test first tries if any of the first 250 small primes are a factor of the input number and then passes several iterations of Miller-Rabin Probabilistic Primality Test (FIPS 186-4 C.3.1)
 * 
 * @param {bigint} w An integer to be tested for primality
 * @param {number} iterations The number of iterations for the primality test. The value shall be consistent with Table C.1, C.2 or C.3
 * 
 * @return {Promise} A promise that resolve to a boolean that is either true (a probably prime number) or false (definitely composite)
 */
const isProbablyPrime = async function (w, iterations = 16) {
    /*
	PREFILTERING. Even values but 2 are not primes, so don't test. 
	1 is not a prime and the M-R algorithm needs w>1.
	*/
    if (w === BigInt(2))
        return true;
    else if ((w & BigInt(1)) === BigInt(0) || w === BigInt(1))
        return false;

    /*
    Test if any of the first 250 small primes are a factor of w. 2 is not tested because it was already tested above.
    */
    const firstPrimes = [
        3,
        5,
        7,
        11,
        13,
        17,
        19,
        23,
        29,
        31,
        37,
        41,
        43,
        47,
        53,
        59,
        61,
        67,
        71,
        73,
        79,
        83,
        89,
        97,
        101,
        103,
        107,
        109,
        113,
        127,
        131,
        137,
        139,
        149,
        151,
        157,
        163,
        167,
        173,
        179,
        181,
        191,
        193,
        197,
        199,
        211,
        223,
        227,
        229,
        233,
        239,
        241,
        251,
        257,
        263,
        269,
        271,
        277,
        281,
        283,
        293,
        307,
        311,
        313,
        317,
        331,
        337,
        347,
        349,
        353,
        359,
        367,
        373,
        379,
        383,
        389,
        397,
        401,
        409,
        419,
        421,
        431,
        433,
        439,
        443,
        449,
        457,
        461,
        463,
        467,
        479,
        487,
        491,
        499,
        503,
        509,
        521,
        523,
        541,
        547,
        557,
        563,
        569,
        571,
        577,
        587,
        593,
        599,
        601,
        607,
        613,
        617,
        619,
        631,
        641,
        643,
        647,
        653,
        659,
        661,
        673,
        677,
        683,
        691,
        701,
        709,
        719,
        727,
        733,
        739,
        743,
        751,
        757,
        761,
        769,
        773,
        787,
        797,
        809,
        811,
        821,
        823,
        827,
        829,
        839,
        853,
        857,
        859,
        863,
        877,
        881,
        883,
        887,
        907,
        911,
        919,
        929,
        937,
        941,
        947,
        953,
        967,
        971,
        977,
        983,
        991,
        997,
        1009,
        1013,
        1019,
        1021,
        1031,
        1033,
        1039,
        1049,
        1051,
        1061,
        1063,
        1069,
        1087,
        1091,
        1093,
        1097,
        1103,
        1109,
        1117,
        1123,
        1129,
        1151,
        1153,
        1163,
        1171,
        1181,
        1187,
        1193,
        1201,
        1213,
        1217,
        1223,
        1229,
        1231,
        1237,
        1249,
        1259,
        1277,
        1279,
        1283,
        1289,
        1291,
        1297,
        1301,
        1303,
        1307,
        1319,
        1321,
        1327,
        1361,
        1367,
        1373,
        1381,
        1399,
        1409,
        1423,
        1427,
        1429,
        1433,
        1439,
        1447,
        1451,
        1453,
        1459,
        1471,
        1481,
        1483,
        1487,
        1489,
        1493,
        1499,
        1511,
        1523,
        1531,
        1543,
        1549,
        1553,
        1559,
        1567,
        1571,
        1579,
        1583,
        1597,
    ];
    for (let i = 0; i < firstPrimes.length && (BigInt(firstPrimes[i]) <= w); i++) {
        const p = BigInt(firstPrimes[i]);
        if (w === p)
            return true;
        else if (w % p === BigInt(0))
            return false;
    }

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
    let a = BigInt(0), d = w - BigInt(1);
    while (d % BigInt(2) === BigInt(0)) {
        d /= BigInt(2);
        ++a;
    }

    let m = (w - BigInt(1)) / (BigInt(2) ** a);

    loop: do {
        let b = await randBetween(w - BigInt(1), 2);
        let z = modArith.modPow(b, m, w);
        if (z === BigInt(1) || z === w - BigInt(1))
            continue;

        for (let j = 1; j < a; j++) {
            z = modArith.modPow(z, BigInt(2), w);
            if (z === w - BigInt(1))
                continue loop;
            if (z === BigInt(1))
                break;
        }
        return false;
    } while (--iterations);

    return true;
};

/**
 * A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator
 *  
 * @param {number} bitLength The required bit length for the generated prime
 * @param {number} iterations The number of iterations for the Miller-Rabin Probabilistic Primality Test
 * 
 * @returns {Promise} A promise that resolves to a bigint probable prime of bitLength bits
 */
const prime = async function (bitLength, iterations = 16) {
    let rnd = BigInt(0);
    do {
        rnd = fromBuffer(await randBytes(bitLength / 8, true));
    } while (! await isProbablyPrime(rnd, iterations));
    return rnd;
};


function fromBuffer(buf) {
    let ret = BigInt(0);
    for (let i of buf.values()) {
        let bi = BigInt(i);
        ret = (ret << BigInt(8)) + bi;
    }
    return ret;
}

function bitLength(a) {
    let bits = 1;
    do {
        bits++;
    } while ((a >>= BigInt(1)) > BigInt(1));
    return bits;
}

module.exports = {
    isProbablyPrime: isProbablyPrime,
    prime: prime,
    randBetween: randBetween,
    randBytes: randBytes
};

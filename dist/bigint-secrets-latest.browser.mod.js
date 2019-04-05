/**
 * Absolute value. abs(a)==a if a>=0. abs(a)==-a if a<0
 *  
 * @param {number|bigint} a 
 * 
 * @returns {bigint} the absolute value of a
 */
const abs = function (a) {
    a = BigInt(a);
    return (a >= BigInt(0)) ? a : -a;
};

/**
 * Greatest-common divisor of two integers based on the iterative binary algorithm.
 * 
 * @param {number|bigint} a 
 * @param {number|bigint} b 
 * 
 * @returns {bigint} The greatest common divisor of a and b
 */
const gcd = function (a, b) {
    a = abs(a);
    b = abs(b);
    let shift = BigInt(0);
    while (!((a | b) & BigInt(1))) {
        a >>= BigInt(1);
        b >>= BigInt(1);
        shift++;
    }
    while (!(a & BigInt(1))) a >>= BigInt(1);
    do {
        while (!(b & BigInt(1))) b >>= BigInt(1);
        if (a > b) {
            let x = a;
            a = b;
            b = x;
        }
        b -= a;
    } while (b);

    // rescale
    return a << shift;
};

/**
 * The least common multiple computed as abs(a*b)/gcd(a,b)
 * @param {number|bigint} a 
 * @param {number|bigint} b 
 * 
 * @returns {bigint} The least common multiple of a and b
 */
const lcm = function (a, b) {
    a = BigInt(a);
    b = BigInt(b);
    return abs(a * b) / gcd(a, b);
};

/**
 * Finds the smallest positive element that is congruent to a in modulo n
 * @param {number|bigint} a An integer
 * @param {number|bigint} n The modulo
 * 
 * @returns {bigint} The smallest positive representation of a in modulo n
 */
const toZn = function (a, n) {
    n = BigInt(n);
    a = BigInt(a) % n;
    return (a < 0) ? a + n : a;
};

/**
 * @typedef {Object} egcdReturn A triple (g, x, y), such that ax + by = g = gcd(a, b).
 * @property {bigint} g
 * @property {bigint} x 
 * @property {bigint} y
 */
/**
 * An iterative implementation of the extended euclidean algorithm or extended greatest common divisor algorithm. 
 * Take positive integers a, b as input, and return a triple (g, x, y), such that ax + by = g = gcd(a, b).
 * 
 * @param {number|bigint} a 
 * @param {number|bigint} b 
 * 
 * @returns {egcdReturn}
 */
const eGcd = function (a, b) {
    a = BigInt(a);
    b = BigInt(b);
    let x = BigInt(0);
    let y = BigInt(1);
    let u = BigInt(1);
    let v = BigInt(0);

    while (a !== BigInt(0)) {
        let q = b / a;
        let r = b % a;
        let m = x - (u * q);
        let n = y - (v * q);
        b = a;
        a = r;
        x = u;
        y = v;
        u = m;
        v = n;
    }
    return {
        b: b,
        x: x,
        y: y
    };
};

/**
 * Modular inverse.
 * 
 * @param {number|bigint} a The number to find an inverse for
 * @param {number|bigint} n The modulo
 * 
 * @returns {bigint} the inverse modulo n
 */
const modInv = function (a, n) {
    let egcd = eGcd(a, n);
    if (egcd.b !== BigInt(1)) {
        return null; // modular inverse does not exist
    } else {
        return toZn(egcd.x, n);
    }
};

/**
 * Modular exponentiation a**b mod n
 * @param {number|bigint} a base
 * @param {number|bigint} b exponent
 * @param {number|bigint} n modulo
 * 
 * @returns {bigint} a**b mod n
 */
const modPow = function (a, b, n) {
    // See Knuth, volume 2, section 4.6.3.
    n = BigInt(n);
    a = toZn(a, n);
    b = BigInt(b);
    if (b < BigInt(0)) {
        return modInv(modPow(a, abs(b), n), n);
    }
    let result = BigInt(1);
    let x = a;
    while (b > 0) {
        var leastSignificantBit = b % BigInt(2);
        b = b / BigInt(2);
        if (leastSignificantBit == BigInt(1)) {
            result = result * x;
            result = result % n;
        }
        x = x * x;
        x = x % n;
    }
    return result;
};

var main = {
    abs: abs,
    gcd: gcd,
    lcm: lcm,
    modInv: modInv,
    modPow: modPow
};

/**
 * Asynchronous function to get random values on browser using WebWorkers
 *
 * @param {Uint8Array} buf The buffer where the number will be stored
 * @param {boolean} cb Callback executed after the number is computed
 *
 */
const getRandomValuesWorker = (function () {  // browser
        let currId = 0;
        const workerCallbacks = {};
        const worker = buildWorker(() => {
            onmessage = function (ev) {
                const buf = self.crypto.getRandomValues(ev.data.buf);
                self.postMessage({ buf, id: ev.data.id });
            };
        });

        return appendCallback;

        //////////

        function appendCallback(buf, cb) {
            workerCallbacks[currId] = cb;
            worker.postMessage({ buf, id: currId });
            currId++;
        }

        function buildWorker(workerCode) {
            const workerBlob = new window.Blob(['(' + workerCode.toString() + ')()'], { type: 'text/javascript' });
            const worker = new Worker(window.URL.createObjectURL(workerBlob));
            worker.onmessage = function (ev) {
                const { id, buf } = ev.data;
                if (workerCallbacks[id]) {
                    workerCallbacks[id](false, buf);
                    delete workerCallbacks[id];
                }
            };

            return worker;
        }
    })();


/**
 * Secure random bytes for both node and browsers
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

        { // browser
            buf = new Uint8Array(byteLength);
            getRandomValuesWorker(buf, resolver);
        }
    });
};

/**
 * Returns a cryptographically secure random integer between [min,max]
 * @param {bigint} max Returned value will be < max
 * @param {bigint} min Returned value will be > min
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
    if (w === BigInt(2))
        return true;
    else if ((w & BigInt(1)) === BigInt(0) || w === BigInt(1))
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
    let a = BigInt(0), d = w - BigInt(1);
    while (d % BigInt(2) === BigInt(0)) {
        d /= BigInt(2);
        ++a;
    }

    let m = (w - BigInt(1)) / (BigInt(2) ** a);

    loop: do {
        let b = await randBetween(w - BigInt(1), 2);
        let z = main.modPow(b, m, w);
        if (z === BigInt(1) || z === w - BigInt(1))
            continue;

        for (let j = 1; j < a; j++) {
            z = main.modPow(z, BigInt(2), w);
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
const prime = async function (bitLength, iterations = 41) {
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

var main$1 = {
    isProbablyPrime: isProbablyPrime,
    prime: prime,
    randBetween: randBetween,
    randBytes: randBytes
};
var main_1 = main$1.isProbablyPrime;
var main_2 = main$1.prime;
var main_3 = main$1.randBetween;
var main_4 = main$1.randBytes;

export default main$1;
export { main_1 as isProbablyPrime, main_2 as prime, main_3 as randBetween, main_4 as randBytes };
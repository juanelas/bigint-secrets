# bigint-secrets 

Secure random numbers and probable prime (Miller-Rabin primality test) generation/testing using native JS (stage 3) implementation of BigInt.

_The operations supported on BigInts are not constant time. BigInt is therefore **[unsuitable for use in cryptography](https://www.chosenplaintext.ca/articles/beginners-guide-constant-time-cryptography.html)**_

Many platforms provide native support for cryptography, such as [webcrypto](https://w3c.github.io/webcrypto/Overview.html) or [node crypto](https://nodejs.org/dist/latest/docs/api/crypto.html).

## Usage

```javascript
const secrets = require('bigingt-secrets');

// Generation of a probable prime of 2048 bits
const prime = await secrets.prime(2048);

// Testing if a prime is a probable prime (Miller-Ravin)
if ( await secrets.isProbablyPrime(prime) )
    return true;

// Get a cryptographically secure random number of between 1 and 2**256 bits.
const rnd = secrets.randBetween(2**256);
```

## Functions

<dl>
<dt><a href="#randBytes">randBytes(byteLength, forceLength)</a> ⇒ <code>Promise</code></dt>
<dd><p>Secure random bytes for both node and browsers</p>
</dd>
<dt><a href="#randBetween">randBetween(max, min)</a> ⇒ <code>Promise</code></dt>
<dd><p>Returns a cryptographically secure random integer between [min,max]</p>
</dd>
<dt><a href="#isProbablyPrime">isProbablyPrime(w, iterations)</a> ⇒ <code>Promise</code></dt>
<dd><p>Miller-Rabin Probabilistic Primality Test. FIPS 186-4 C.3.1</p>
</dd>
<dt><a href="#prime">prime(bitLength, iterations)</a> ⇒ <code>Promise</code></dt>
<dd><p>A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator</p>
</dd>
</dl>

<a name="randBytes"></a>

## randBytes(byteLength, forceLength) ⇒ <code>Promise</code>
Secure random bytes for both node and browsers

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise that resolves to a Buffer/UInt8Array filled with cryptographically secure random bytes  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| byteLength | <code>number</code> |  | The desired number of random bytes |
| forceLength | <code>boolean</code> | <code>false</code> | If we want to force the output to have a bit length of 8*byteLength. It basically forces the msb to be 1 |

<a name="randBetween"></a>

## randBetween(max, min) ⇒ <code>Promise</code>
Returns a cryptographically secure random integer between [min,max]

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise that resolves to a cryptographically secure random bigint between [min,max]  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| max | <code>bigint</code> |  | Returned value will be < max |
| min | <code>bigint</code> | <code>1</code> | Returned value will be > min |

<a name="isProbablyPrime"></a>

## isProbablyPrime(w, iterations) ⇒ <code>Promise</code>
Miller-Rabin Probabilistic Primality Test. FIPS 186-4 C.3.1

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise that resolve to a boolean that is either true (a probably prime number) or false (definitely composite)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| w | <code>bigint</code> |  | An integer to be tested for primality |
| iterations | <code>number</code> | <code>41</code> | The number of iterations for the primality test. The value shall be consistent with Table C.1, C.2 or C.3 |

<a name="prime"></a>

## prime(bitLength, iterations) ⇒ <code>Promise</code>
A probably-prime (Miller-Rabin), cryptographically-secure, random-number generator

**Kind**: global function  
**Returns**: <code>Promise</code> - A promise that resolves to a bigint probable prime of bitLength bits  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bitLength | <code>number</code> |  | The required bit length for the generated prime |
| iterations | <code>number</code> | <code>41</code> | The number of iterations for the Miller-Rabin Probabilistic Primality Test |


* * *
import { Buffer } from "buffer";
import * as sodium from 'libsodium-wrappers';
import { blake3 } from "@noble/hashes/blake3";
import { wordlist } from './wordlist.js';

//import { encodeBase64URL } from "./tools.js";
//import { CryptoImplementation, KeyPairEd25519, encodeBase64URL } from 's5-crypto-utils';
import { CryptoImplementation, KeyPairEd25519 } from 's5-crypto-utils';

export const SEED_LENGTH = 16;
export const SEED_WORDS_LENGTH = 13;
export const CHECKSUM_WORDS_LENGTH = 2;
export const PHRASE_LENGTH = SEED_WORDS_LENGTH + CHECKSUM_WORDS_LENGTH;

/**
 * Encodes a Uint8Array into a Base64URL string.
 * @param input - The Uint8Array to be encoded.
 * @returns The Base64URL-encoded string.
 */
export function encodeBase64URL(input: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...input));

  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Generate a seed from a mnemonic phrase.
 * @param {string} phrase - The mnemonic phrase.
 * @returns {Promise<Uint8Array>} - The generated seed as a Uint8Array.
 */
export async function generateSeedFromPhrase(phrase: string): Promise<Uint8Array> {
  const sanitizedPhrase = sanitizePhrase(phrase);
  const validatedPhrase = await validatePhrase(sanitizedPhrase);

  const hasher = await blake3.create({dkLen: 32});
  hasher.update(validatedPhrase);
  const b3Seed = hasher.digest(); 

  return b3Seed;
}

/**
 * Generates a random passphrase.
 * @returns A promise that resolves to the generated passphrase.
 */
export async function generatePhrase(): Promise<string> {
  await sodium.ready;
  const seedWords = new Uint16Array(SEED_WORDS_LENGTH);

  // Populate the seed words from the random values.
  for (let i = 0; i < SEED_WORDS_LENGTH; i++) {
    seedWords[i] = sodium.randombytes_uniform(wordlist.length);

    let numBits = 10;
    // For the 1st word, only the first 256 words are considered valid.
    if (i === 0) {
      numBits = 8;
    }
    seedWords[i] = seedWords[i] % (1 << numBits);
  }

  // Generate checksum from hash of the seed.
  const checksumWords = generateChecksumWordsFromSeedWords(
    seedWords
  );

  const phraseWords = new Array<string>(PHRASE_LENGTH);

  for (let i = 0; i < SEED_WORDS_LENGTH; i++) {
    phraseWords[i] = wordlist[seedWords[i]];
  }
  for (let i = 0; i < CHECKSUM_WORDS_LENGTH; i++) {
    phraseWords[i + SEED_WORDS_LENGTH] = wordlist[checksumWords[i]];
  }

  return phraseWords.join(" ");
}

/**
 * Sanitize the input phrase by trimming and converting to lowercase.
 * @param phrase - The input passphrase.
 * @returns The sanitized phrase.
 */
export function sanitizePhrase(phrase: string): string {
  return phrase.trim().toLowerCase();
}

/**
 * Validate and convert a passphrase into a Uint8Array seed.
 * @param phrase - The input passphrase.
 * @throws Error if the phrase is invalid.
 * @returns The Uint8Array seed.
 */
export async function validatePhrase(phrase: string): Promise<Uint8Array> {
  await sodium.ready;

  phrase = sanitizePhrase(phrase);
  const phraseWords = phrase.split(' ');

  if (phraseWords.length !== PHRASE_LENGTH) {
    throw new Error(`Phrase must be ${PHRASE_LENGTH} words long`);
  }

  // Build the seed from words.
  const seedWords = new Uint16Array(SEED_WORDS_LENGTH);

  let i = 0;
  for (const word of phraseWords) {
    // Check word length.
    if (word.length < 3) {
      throw new Error(`Word ${i + 1} is not at least 3 letters long`);
    }

    // Check word prefix.
    const prefix = word.substring(0, 3);
    let bound = wordlist.length;
    if (i === 0) {
      bound = 256;
    }
    let found = -1;
    for (let j = 0; j < bound; j++) {
      const curPrefix = wordlist[j].substring(0, 3);
      if (curPrefix === prefix) {
        found = j;
        break;
      }
    }
    if (found < 0) {
      if (i === 0) {
        throw new Error(`Prefix for word ${i + 1} must be found in the first 256 words of the wordlist`);
      } else {
        throw new Error(`Unrecognized prefix "${prefix}" at word ${i + 1}, not found in wordlist`);
      }
    }

    seedWords[i] = found;

    i++;
    if (i >= SEED_WORDS_LENGTH) break;
  }

  // Validate checksum.
  const checksumWords = generateChecksumWordsFromSeedWords(seedWords);
  for (let i = 0; i < CHECKSUM_WORDS_LENGTH; i++) {
    const prefix = wordlist[checksumWords[i]].substring(0, 3);
    if (phraseWords[i + SEED_WORDS_LENGTH].substring(0, 3) !== prefix) {
      throw new Error(`Word "${phraseWords[i + SEED_WORDS_LENGTH + 1]}" is not a valid checksum for the seed`);
    }
  }

  return seedWordsToSeed(seedWords);
}

/**
 * Generate checksum words from seed words.
 * @param seedWords - The seed words as Uint16Array.
 * @throws Error if the input seed is not of the expected length.
 * @returns The checksum words as Uint16Array.
 */
export function generateChecksumWordsFromSeedWords(seedWords: Uint16Array): Uint16Array {
  if (seedWords.length !== SEED_WORDS_LENGTH) {
    throw new Error(`Input seed was not of length ${SEED_WORDS_LENGTH}`);
  }

  const seed = seedWordsToSeed(seedWords);
  const h = blake3(seed, { dkLen: SEED_LENGTH});
  const checksumWords = hashToChecksumWords(h);

  return checksumWords;
}

/**
 * Convert a hash to checksum words.
 * @param h - The input hash as Uint8Array.
 * @returns The checksum words as Uint16Array.
 */
export function hashToChecksumWords(h: Uint8Array): Uint16Array {
  let word1 = (h[0] << 8);
  word1 += h[1];
  word1 >>= 6;
  let word2 = (h[1] << 10);
  word2 &= 0xffff;
  word2 += (h[2] << 2);
  word2 >>= 6;

  return new Uint16Array([word1, word2]);
}

/**
 * Convert seed words to a seed as Uint8Array.
 * @param seedWords - The seed words as Uint16Array.
 * @throws Error if the input seed words are not of the expected length.
 * @returns The seed as Uint8Array.
 */
export function seedWordsToSeed(seedWords: Uint16Array): Uint8Array {
  if (seedWords.length !== SEED_WORDS_LENGTH) {
    throw new Error(`Input seed was not of length ${SEED_WORDS_LENGTH}`);
  }

  // We are getting 16 bytes of entropy.
  const bytes = new Uint8Array(SEED_LENGTH);
  let curByte = 0;
  let curBit = 0;

  for (let i = 0; i < SEED_WORDS_LENGTH; i++) {
    const word = seedWords[i];
    let wordBits = 10;
    if (i === 0) {
      wordBits = 8;
    }

    // Iterate over the bits of the 10- or 8-bit word.
    for (let j = 0; j < wordBits; j++) {
      const bitSet = (word & (1 << (wordBits - j - 1))) > 0;

      if (bitSet) {
        bytes[curByte] |= (1 << (8 - curBit - 1));
      }

      curBit += 1;
      if (curBit >= 8) {
        curByte += 1;
        curBit = 0;
      }
    }
  }

  return bytes;
}

/**
 * Define the KeyPairAndSeed type.
 */
export interface KeyPairAndSeed {
  privateKey: string;
  publicKey: string;
  publicKeyRaw: string;
  seed: string;
}

/**
 * Generates a key pair and seed for cryptographic purposes.
 * @param length - The length of the seed (default: 32).
 * @returns An object containing the generated key pair and seed.
 */
export async function genKeyPairAndSeed(length = 32): Promise<KeyPairAndSeed> {
  await sodium.ready; // Make sure sodium is ready for use

  const crypto = new CryptoImplementation(); 
  const randomSeed =  await crypto.generateRandomBytes(length);
  const keyPair = await crypto.newKeyPairEd25519({ seed: randomSeed });

  return {
    privateKey: encodeBase64URL(await keyPair.extractBytes()),
    publicKey: encodeBase64URL(await keyPair.publicKey()),
    publicKeyRaw: encodeBase64URL((await keyPair.publicKey()).slice(1)),
    seed: Buffer.from(randomSeed).toString('hex'),
  };
}

/**
 * Define the KeyPair interface.
 */
export interface KeyPair {
  privateKey: string;
  publicKey: string;
  publicKeyRaw: string;
}

/**
 * Generates a key pair from a given seed using libsodium-wrappers.
 * @param seedString - The seedString as a string.
 * @returns A Promise that resolves to an object containing the generated public and private keys as hexadecimal strings.
 */
export async function genKeyPairFromSeed(seedString: string): Promise<KeyPair> {
  await sodium.ready;

  const seed = await generateSeedFromPhrase(seedString);

  const crypto = new CryptoImplementation(); 
  const keyPair = await crypto.newKeyPairEd25519({ seed: seed });

  return {
    privateKey: encodeBase64URL(await keyPair.extractBytes()),
    publicKey: encodeBase64URL(await keyPair.publicKey()),
    publicKeyRaw: encodeBase64URL((await keyPair.publicKey()).slice(1))
  }; 
}

/**
 * Derives an Ed25519 key pair from a master key and a data seed.
 * @param masterKey - The master key as a Uint8Array or string.
 * @param dataSeed - The data seed as a Uint8Array or string.
 * @param deriveLength - (Optional) The length of the derived key in bytes.
 * @returns A Promise that resolves to an object containing the derived Ed25519 key pair with publicKey and privateKey.
 */
export async function deriveEd25519(masterKey: Uint8Array | string, dataSeed: Uint8Array | string, deriveLength?: number): Promise<{ privateKey: string, publicKey: string }> {
  await sodium.ready;
  let hasher;
  if (deriveLength) {
    hasher = blake3.create({ dkLen: deriveLength });
  } else {
    hasher = blake3.create({});
  }

  const masterKeyBytes = typeof masterKey === "string" ? new TextEncoder().encode(masterKey) : masterKey;
  const dataSeedBytes = typeof dataSeed === "string" ? new TextEncoder().encode(dataSeed) : dataSeed;
  hasher.update(new Uint8Array([...masterKeyBytes, ...dataSeedBytes]));
  const saltEd25519Key = hasher.digest();
  const keyPair = sodium.crypto_sign_seed_keypair(saltEd25519Key);
  const kp = new KeyPairEd25519(keyPair.privateKey);

  return {
    privateKey: encodeBase64URL(await kp.extractBytes()),
    publicKey: encodeBase64URL(await kp.publicKey()),
  };
}


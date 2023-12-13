export declare const SEED_LENGTH = 16;
export declare const SEED_WORDS_LENGTH = 13;
export declare const CHECKSUM_WORDS_LENGTH = 2;
export declare const PHRASE_LENGTH: number;
/**
 * Encodes a Uint8Array into a Base64URL string.
 * @param input - The Uint8Array to be encoded.
 * @returns The Base64URL-encoded string.
 */
export declare function encodeBase64URL(input: Uint8Array): string;
/**
 * Generate a seed from a mnemonic phrase.
 * @param {string} phrase - The mnemonic phrase.
 * @returns {Promise<Uint8Array>} - The generated seed as a Uint8Array.
 */
export declare function generateSeedFromPhrase(phrase: string): Promise<Uint8Array>;
/**
 * Generates a random passphrase.
 * @returns A promise that resolves to the generated passphrase.
 */
export declare function generatePhrase(): Promise<string>;
/**
 * Sanitize the input phrase by trimming and converting to lowercase.
 * @param phrase - The input passphrase.
 * @returns The sanitized phrase.
 */
export declare function sanitizePhrase(phrase: string): string;
/**
 * Validate and convert a passphrase into a Uint8Array seed.
 * @param phrase - The input passphrase.
 * @throws Error if the phrase is invalid.
 * @returns The Uint8Array seed.
 */
export declare function validatePhrase(phrase: string): Promise<Uint8Array>;
/**
 * Generate checksum words from seed words.
 * @param seedWords - The seed words as Uint16Array.
 * @throws Error if the input seed is not of the expected length.
 * @returns The checksum words as Uint16Array.
 */
export declare function generateChecksumWordsFromSeedWords(seedWords: Uint16Array): Uint16Array;
/**
 * Convert a hash to checksum words.
 * @param h - The input hash as Uint8Array.
 * @returns The checksum words as Uint16Array.
 */
export declare function hashToChecksumWords(h: Uint8Array): Uint16Array;
/**
 * Convert seed words to a seed as Uint8Array.
 * @param seedWords - The seed words as Uint16Array.
 * @throws Error if the input seed words are not of the expected length.
 * @returns The seed as Uint8Array.
 */
export declare function seedWordsToSeed(seedWords: Uint16Array): Uint8Array;
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
export declare function genKeyPairAndSeed(length?: number): Promise<KeyPairAndSeed>;
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
export declare function genKeyPairFromSeed(seedString: string): Promise<KeyPair>;
/**
 * Derives an Ed25519 key pair from a master key and a data seed.
 * @param masterKey - The master key as a Uint8Array or string.
 * @param dataSeed - The data seed as a Uint8Array or string.
 * @param deriveLength - (Optional) The length of the derived key in bytes.
 * @returns A Promise that resolves to an object containing the derived Ed25519 key pair with publicKey and privateKey.
 */
export declare function deriveEd25519(masterKey: Uint8Array | string, dataSeed: Uint8Array | string, deriveLength?: number): Promise<{
    privateKey: string;
    publicKey: string;
}>;
//# sourceMappingURL=seed.d.ts.map
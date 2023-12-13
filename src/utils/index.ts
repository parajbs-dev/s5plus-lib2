/* istanbul ignore file */

// Main exports.

// seed exports.
export {
  SEED_LENGTH,
  SEED_WORDS_LENGTH,
  CHECKSUM_WORDS_LENGTH,
  PHRASE_LENGTH,
  generateSeedFromPhrase,
  generatePhrase,
  sanitizePhrase,
  validatePhrase,
  generateChecksumWordsFromSeedWords,
  hashToChecksumWords,
  seedWordsToSeed,
  genKeyPairAndSeed,
  genKeyPairFromSeed,
  deriveEd25519,
} from "./seed.js";

// crypto type exports.
export type {
  KeyPairAndSeed,
  KeyPair,
} from "./seed.js";


// wordlist exports.
export {
  uniquePrefixLen,
  wordlist,
} from "./wordlist.js";

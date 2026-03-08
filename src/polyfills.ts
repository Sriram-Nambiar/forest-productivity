/**
 * ⚠️ POLYFILLS — MUST be the first code that runs in the app.
 *
 * This file is imported from index.js BEFORE expo-router/entry
 * so that Buffer and crypto globals are available when
 * @solana/web3.js and related libraries are loaded.
 *
 * DO NOT import any Solana / web3 / crypto code above these lines.
 */

// 1. Crypto polyfill (provides crypto.getRandomValues for Uint8Array)
//    Must come BEFORE buffer, because some buffer internals may use crypto.
import "react-native-get-random-values";

// 2. Buffer polyfill
import { Buffer } from "buffer";

// Force-assign Buffer globally. @solana/web3.js expects `global.Buffer`.
// We do NOT use `||=` because global.Buffer is always undefined in React Native.
global.Buffer = Buffer;

// 3. If needed in the future, add other Node.js polyfills here:
//    - global.process = require('process');
//    - etc.

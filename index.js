/**
 * Custom entry point for Forest Focus Timer.
 *
 * This file loads polyfills (Buffer, crypto) BEFORE expo-router/entry
 * so that @solana/web3.js and related Solana libraries have access to
 * Node.js globals they depend on.
 *
 * ⚠️ DO NOT reorder these imports. Polyfills MUST come first.
 */

// Step 1: Load polyfills (Buffer + crypto.getRandomValues)
import "./src/polyfills";

// Step 2: Start the Expo Router app
import "expo-router/entry";

// ⚠️ MUST be imported BEFORE any @solana/web3.js usage
import "react-native-get-random-values";

import { Buffer } from "buffer";

// Ensure Buffer is globally available (required by @solana/web3.js)
global.Buffer = global.Buffer || Buffer;

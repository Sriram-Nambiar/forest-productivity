import {
    transact,
    type Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createInitializeMintInstruction,
    createMintToInstruction,
    getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { TREE_NFT_METADATA_URI, type SolanaCluster } from "./config";
import { getConnection } from "./connection";
import {
    authorizeWalletSession,
    extractSignature,
    normalizeErrorMessage,
} from "./mobileWallet";

// ─── Token Metadata Program (Metaplex v3) ───
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const TREE_NFT_NAME = "Forest Focus Tree";
const TREE_NFT_SYMBOL = "TREE";

/**
 * Derive the metadata PDA for a given mint.
 */
function getMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );
  return pda;
}

/**
 * Manually serialize the CreateMetadataAccountV3 instruction data.
 *
 * This avoids pulling in heavy Umi/Metaplex serializer dependencies
 * that have compatibility issues in React Native / Expo environments.
 *
 * Layout (Borsh-like):
 *  - discriminator: u8 = 33 (CreateMetadataAccountV3)
 *  - DataV2:
 *    - name: string (4-byte len + utf8)
 *    - symbol: string
 *    - uri: string
 *    - sellerFeeBasisPoints: u16
 *    - creators: Option<Vec<Creator>> = None (0x00)
 *    - collection: Option<Collection> = None (0x00)
 *    - uses: Option<Uses> = None (0x00)
 *  - isMutable: bool (0x01)
 *  - collectionDetails: Option<CollectionDetails> = None (0x00)
 */
function serializeCreateMetadataV3Data(
  name: string,
  symbol: string,
  uri: string,
): Buffer {
  const nameBytes = Buffer.from(name, "utf8");
  const symbolBytes = Buffer.from(symbol, "utf8");
  const uriBytes = Buffer.from(uri, "utf8");

  // Calculate total size
  const size =
    1 + // discriminator
    4 +
    nameBytes.length + // name string
    4 +
    symbolBytes.length + // symbol string
    4 +
    uriBytes.length + // uri string
    2 + // sellerFeeBasisPoints
    1 + // creators: None
    1 + // collection: None
    1 + // uses: None
    1 + // isMutable
    1; // collectionDetails: None

  const buf = Buffer.alloc(size);
  let offset = 0;

  // Discriminator: 33 = CreateMetadataAccountV3
  buf.writeUInt8(33, offset);
  offset += 1;

  // name
  buf.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  nameBytes.copy(buf, offset);
  offset += nameBytes.length;

  // symbol
  buf.writeUInt32LE(symbolBytes.length, offset);
  offset += 4;
  symbolBytes.copy(buf, offset);
  offset += symbolBytes.length;

  // uri
  buf.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  uriBytes.copy(buf, offset);
  offset += uriBytes.length;

  // sellerFeeBasisPoints = 0
  buf.writeUInt16LE(0, offset);
  offset += 2;

  // creators = None
  buf.writeUInt8(0, offset);
  offset += 1;

  // collection = None
  buf.writeUInt8(0, offset);
  offset += 1;

  // uses = None
  buf.writeUInt8(0, offset);
  offset += 1;

  // isMutable = true
  buf.writeUInt8(1, offset);
  offset += 1;

  // collectionDetails = None
  buf.writeUInt8(0, offset);

  return buf;
}

/**
 * Create the metadata instruction for the Token Metadata Program.
 */
function createMetadataInstruction(params: {
  mint: PublicKey;
  mintAuthority: PublicKey;
  payer: PublicKey;
  updateAuthority: PublicKey;
  metadataUri: string;
}): { metadata: PublicKey; instruction: TransactionInstruction } {
  const metadata = getMetadataPda(params.mint);

  const data = serializeCreateMetadataV3Data(
    TREE_NFT_NAME,
    TREE_NFT_SYMBOL,
    params.metadataUri,
  );

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: metadata, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.mintAuthority, isSigner: true, isWritable: false },
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: params.updateAuthority, isSigner: true, isWritable: false },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
    ],
    programId: TOKEN_METADATA_PROGRAM_ID,
    data,
  });

  return { metadata, instruction };
}

/**
 * Build the full mint-tree-NFT transaction.
 *
 * Steps:
 *  1. Create a new mint account (0 decimals for NFT)
 *  2. Initialize the mint
 *  3. Create the associated token account (ATA)
 *  4. Mint exactly 1 token to the ATA
 *  5. Attach Metaplex metadata
 *
 * Returns the transaction + the mint keypair (needs to sign).
 */
export async function buildMintTreeNftTransaction(
  ownerPublicKey: PublicKey,
  cluster: SolanaCluster,
  metadataUri: string = TREE_NFT_METADATA_URI,
): Promise<{ transaction: Transaction; mint: Keypair }> {
  const connection = getConnection(cluster);
  const mint = Keypair.generate();

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const lamportsForMint =
    await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  const ata = getAssociatedTokenAddressSync(mint.publicKey, ownerPublicKey);

  const { instruction: metadataIx } = createMetadataInstruction({
    mint: mint.publicKey,
    mintAuthority: ownerPublicKey,
    payer: ownerPublicKey,
    updateAuthority: ownerPublicKey,
    metadataUri,
  });

  const transaction = new Transaction({
    blockhash,
    lastValidBlockHeight,
    feePayer: ownerPublicKey,
  });

  // 1. Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: ownerPublicKey,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: lamportsForMint,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  // 2. Initialize mint (0 decimals = NFT)
  transaction.add(
    createInitializeMintInstruction(
      mint.publicKey,
      0,
      ownerPublicKey,
      ownerPublicKey,
    ),
  );

  // 3. Create ATA
  transaction.add(
    createAssociatedTokenAccountInstruction(
      ownerPublicKey,
      ata,
      ownerPublicKey,
      mint.publicKey,
    ),
  );

  // 4. Mint 1 token
  transaction.add(
    createMintToInstruction(mint.publicKey, ata, ownerPublicKey, 1),
  );

  // 5. Attach metadata
  transaction.add(metadataIx);

  // The mint keypair must partially sign
  transaction.partialSign(mint);

  return { transaction, mint };
}

/**
 * End-to-end: build, sign via MWA, and send a Tree NFT mint transaction.
 *
 * @returns The transaction signature string, or `null` if the mint failed.
 */
export async function mintTreeNFT(
  cluster: SolanaCluster,
  existingAuthToken: string | null,
  walletUriBase: string | null,
  onAuthUpdate?: (params: {
    publicKey: string;
    authToken: string;
    walletUriBase: string;
    accountLabel: string | null;
  }) => void,
): Promise<string | null> {
  try {
    const signatureStr = await transact(
      async (wallet: Web3MobileWallet) => {
        // Authorize / reauthorize
        const auth = await authorizeWalletSession(
          wallet,
          cluster,
          existingAuthToken,
        );

        // Notify caller of updated auth state
        onAuthUpdate?.({
          publicKey: auth.publicKey.toBase58(),
          authToken: auth.authToken,
          walletUriBase: auth.walletUriBase,
          accountLabel: auth.accountLabel,
        });

        // Build the NFT mint transaction
        const { transaction } = await buildMintTreeNftTransaction(
          auth.publicKey,
          cluster,
        );

        // Sign and send via wallet
        const signatures = await wallet.signAndSendTransactions({
          transactions: [transaction],
        });

        const sig = signatures[0];
        if (!sig) {
          throw new Error("Wallet returned no signature for NFT mint.");
        }

        return extractSignature(sig);
      },
      walletUriBase ? { baseUri: walletUriBase } : undefined,
    );

    console.log("[mintTreeNFT] Success, signature:", signatureStr);
    return signatureStr;
  } catch (error: unknown) {
    const message = normalizeErrorMessage(error);
    console.error("[mintTreeNFT] Failed:", message);
    return null;
  }
}

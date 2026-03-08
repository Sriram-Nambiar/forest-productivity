import { getCreateMetadataAccountV3InstructionDataSerializer } from "@metaplex-foundation/mpl-token-metadata";
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
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { TREE_NFT_METADATA_URI, type SolanaCluster } from "./config";
import { getConnection } from "./connection";
import { authorizeWalletSession, extractSignature } from "./mobileWallet";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

const TREE_NFT_NAME = "Forest Focus Tree";
const TREE_NFT_SYMBOL = "TREE";

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

function createMetadataInstruction(params: {
  mint: PublicKey;
  mintAuthority: PublicKey;
  payer: PublicKey;
  updateAuthority: PublicKey;
  metadataUri: string;
}) {
  const metadata = getMetadataPda(params.mint);

  const serializedData =
    getCreateMetadataAccountV3InstructionDataSerializer().serialize({
      data: {
        name: TREE_NFT_NAME,
        symbol: TREE_NFT_SYMBOL,
        uri: params.metadataUri,
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null,
      },
      isMutable: true,
      collectionDetails: null,
    });

  return {
    metadata,
    instruction: {
      keys: [
        { pubkey: metadata, isSigner: false, isWritable: true },
        { pubkey: params.mint, isSigner: false, isWritable: false },
        { pubkey: params.mintAuthority, isSigner: true, isWritable: false },
        { pubkey: params.payer, isSigner: true, isWritable: true },
        { pubkey: params.updateAuthority, isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: TOKEN_METADATA_PROGRAM_ID,
      data: Buffer.from(serializedData),
    },
  };
}

export async function buildMintTreeNftTransaction(
  ownerPublicKey: PublicKey,
  cluster: SolanaCluster,
  metadataUri: string = TREE_NFT_METADATA_URI,
): Promise<{ transaction: Transaction; mint: Keypair }> {
  const connection: Connection = getConnection(cluster);
  const mint = Keypair.generate();
  const associatedTokenAddress = getAssociatedTokenAddressSync(
    mint.publicKey,
    ownerPublicKey,
  );

  const mintRent =
    await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const metadataIx = createMetadataInstruction({
    mint: mint.publicKey,
    mintAuthority: ownerPublicKey,
    payer: ownerPublicKey,
    updateAuthority: ownerPublicKey,
    metadataUri,
  });

  const transaction = new Transaction({
    feePayer: ownerPublicKey,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.createAccount({
      fromPubkey: ownerPublicKey,
      newAccountPubkey: mint.publicKey,
      lamports: mintRent,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mint.publicKey,
      0,
      ownerPublicKey,
      ownerPublicKey,
    ),
    createAssociatedTokenAccountInstruction(
      ownerPublicKey,
      associatedTokenAddress,
      ownerPublicKey,
      mint.publicKey,
    ),
    createMintToInstruction(
      mint.publicKey,
      associatedTokenAddress,
      ownerPublicKey,
      1,
    ),
    new TransactionInstruction({
      keys: metadataIx.instruction.keys,
      programId: metadataIx.instruction.programId,
      data: metadataIx.instruction.data,
    }),
  );

  transaction.partialSign(mint);

  return { transaction, mint };
}

export async function mintTreeNFT(params: {
  ownerPublicKey: string;
  cluster: SolanaCluster;
  authToken?: string | null;
  walletUriBase?: string | null;
  metadataUri?: string;
  onAuthorizationUpdated: (authorization: {
    publicKey: string;
    authToken: string;
    walletUriBase: string;
    accountLabel: string | null;
  }) => void;
}): Promise<{ signature: string; mintAddress: string }> {
  const owner = new PublicKey(params.ownerPublicKey);
  const { transaction, mint } = await buildMintTreeNftTransaction(
    owner,
    params.cluster,
    params.metadataUri,
  );

  const signatureResult = await transact(
    async (wallet: Web3MobileWallet) => {
      const authorization = await authorizeWalletSession(
        wallet,
        params.cluster,
        params.authToken,
      );

      params.onAuthorizationUpdated({
        publicKey: authorization.publicKey.toBase58(),
        authToken: authorization.authToken,
        walletUriBase: authorization.walletUriBase,
        accountLabel: authorization.accountLabel,
      });

      const signatures = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      return signatures[0];
    },
    params.walletUriBase ? { baseUri: params.walletUriBase } : undefined,
  );

  return {
    signature: extractSignature(signatureResult),
    mintAddress: mint.publicKey.toBase58(),
  };
}

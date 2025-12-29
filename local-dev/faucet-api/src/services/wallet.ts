
import * as ledger from '@midnight-ntwrk/ledger-v6';
import type { DefaultV1Configuration as DustConfiguration } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { WalletFacade, CombinedTokenTransfer } from '@midnight-ntwrk/wallet-sdk-facade';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import type { DefaultV1Configuration as ShieldedConfiguration } from '@midnight-ntwrk/wallet-sdk-shielded/v1';
import {
    createKeystore,
    InMemoryTransactionHistoryStorage,
    PublicKey as UnshieldedPublicKey,
    type UnshieldedKeystore,
    UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { Buffer } from 'buffer';
import * as rx from 'rxjs';

const NODE_URL = process.env['NODE_URL'] ?? 'ws://node:9944';
const INDEXER_HTTP_URL = process.env['INDEXER_HTTP_URL'] ?? 'http://indexer:8088/api/v3/graphql';
const INDEXER_WS_URL = process.env['INDEXER_WS_URL'] ?? 'ws://indexer:8088/api/v3/graphql/ws';
const PROOF_SERVER_URL = process.env['PROOF_SERVER_URL'] ?? 'http://proof-server:6300';

const configuration: ShieldedConfiguration & DustConfiguration & { indexerUrl: string } = {
    networkId: 'undeployed',
    costParameters: {
        additionalFeeOverhead: 300_000_000_000_000_000n,
        feeBlocksMargin: 5,
    },
    relayURL: new URL(NODE_URL),
    provingServerUrl: new URL(PROOF_SERVER_URL),
    indexerClientConnection: {
        indexerHttpUrl: INDEXER_HTTP_URL,
        indexerWsUrl: INDEXER_WS_URL,
    },
    indexerUrl: INDEXER_WS_URL,
};

export interface WalletInitResult {
    wallet: WalletFacade;
    shieldedSecretKeys: ledger.ZswapSecretKeys;
    dustSecretKey: ledger.DustSecretKey;
    unshieldedKeystore: UnshieldedKeystore;
}

export const initWalletWithSeed = async (
    seed: Buffer,
): Promise<WalletInitResult> => {
    const hdWallet = HDWallet.fromSeed(Uint8Array.from(seed));

    if (hdWallet.type !== 'seedOk') {
        throw new Error('Failed to initialize HDWallet');
    }

    const derivationResult = hdWallet.hdWallet
        .selectAccount(0)
        .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
        .deriveKeysAt(0);

    if (derivationResult.type !== 'keysDerived') {
        throw new Error('Failed to derive keys');
    }

    hdWallet.hdWallet.clear();

    const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(
        derivationResult.keys[Roles.Zswap],
    );
    const dustSecretKey = ledger.DustSecretKey.fromSeed(derivationResult.keys[Roles.Dust]);
    const unshieldedKeystore = createKeystore(
        derivationResult.keys[Roles.NightExternal],
        configuration.networkId,
    );

    const shieldedWallet = ShieldedWallet(configuration).startWithSecretKeys(
        shieldedSecretKeys,
    );
    const dustWallet = DustWallet(configuration).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
    );
    const unshieldedWallet = UnshieldedWallet({
        ...configuration,
        txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    }).startWithPublicKey(UnshieldedPublicKey.fromKeyStore(unshieldedKeystore));

    const facade: WalletFacade = new WalletFacade(
        shieldedWallet,
        unshieldedWallet,
        dustWallet,
    );
    await facade.start(shieldedSecretKeys, dustSecretKey);
    return { wallet: facade, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};

export const TRANSFER_AMOUNT = BigInt(
    process.env['TRANSFER_AMOUNT']?.replace(/_/g, '') ?? '1000000000',
);

export interface FundOptions {
    shieldedAddress?: string;
    unshieldedAddress?: string;
}

export async function fundAddresses(
    sender: WalletInitResult,
    options: FundOptions,
): Promise<string> {
    await rx.firstValueFrom(
        sender.wallet.state().pipe(rx.filter((s: { isSynced: boolean }) => s.isSynced)),
    );

    const outputs: CombinedTokenTransfer[] = [];

    if (options.unshieldedAddress) {
        outputs.push({
            type: 'unshielded',
            outputs: [
                {
                    amount: TRANSFER_AMOUNT,
                    receiverAddress: options.unshieldedAddress,
                    type: ledger.unshieldedToken().raw,
                },
            ],
        });
    }

    if (options.shieldedAddress) {
        outputs.push({
            type: 'shielded',
            outputs: [
                {
                    amount: TRANSFER_AMOUNT,
                    receiverAddress: options.shieldedAddress,
                    type: ledger.shieldedToken().raw,
                },
            ],
        });
    }

    if (outputs.length === 0) {
        throw new Error('No addresses provided to fund');
    }

    const recipe = await sender.wallet.transferTransaction(
        sender.shieldedSecretKeys,
        sender.dustSecretKey,
        outputs,
        new Date(Date.now() + 30 * 60 * 1000),
    );

    const tx = await sender.wallet.signTransaction(
        recipe.transaction,
        (payload: Uint8Array) => sender.unshieldedKeystore.signData(payload),
    );

    const transaction = await sender.wallet.finalizeTransaction({
        type: 'TransactionToProve',
        transaction: tx,
    });

    const txHash = await sender.wallet.submitTransaction(transaction);
    return txHash;
}


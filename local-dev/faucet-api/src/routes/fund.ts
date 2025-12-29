import { Hono } from 'hono';
import type { Context } from 'hono';
import * as bip39 from 'bip39';
import { Buffer } from 'buffer';
import { MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';
import * as rx from 'rxjs';
import { initWalletWithSeed, fundAddresses } from '../services/wallet.js';
import type { FundRequest, FundResponse } from '../types.js';

const fund = new Hono();

const GENESIS_WALLET_SEED = Buffer.from(
    '6661756365740000000000000000000000000000000000000000000000000000',
    'hex',
);

function validateAddress(address: string, type: 'shielded' | 'unshielded'): boolean {
    const expectedPrefix =
        type === 'shielded' ? 'mn_shield-addr_undeployed' : 'mn_addr_undeployed';
    return address.startsWith(expectedPrefix);
}

fund.post('/', async (c: Context) => {
    try {
        const body = await c.req.json<FundRequest>();

        if (!body.mnemonic && !body.shieldedAddress && !body.unshieldedAddress) {
            return c.json<FundResponse>(
                {
                    success: false,
                    error: 'At least one of mnemonic, shieldedAddress, or unshieldedAddress must be provided',
                },
                400,
            );
        }

        let shieldedAddress = body.shieldedAddress;
        let unshieldedAddress = body.unshieldedAddress;

        if (body.mnemonic) {
            if (!bip39.validateMnemonic(body.mnemonic)) {
                return c.json<FundResponse>(
                    {
                        success: false,
                        error: 'Invalid BIP-39 mnemonic',
                    },
                    400,
                );
            }

            const seed: Buffer = await bip39.mnemonicToSeed(body.mnemonic);
            const takeSeed = seed.subarray(0, 32);
            const receiver = await initWalletWithSeed(takeSeed);

            try {
                const derivedShieldedAddress: string = await rx.firstValueFrom(
                    receiver.wallet.state().pipe(
                        rx.filter((s: { isSynced: boolean }) => s.isSynced),
                        rx.map((s: { shielded: { address: Uint8Array } }) =>
                            MidnightBech32m.encode('undeployed', s.shielded.address).toString(),
                        ),
                    ),
                );
                const derivedUnshieldedAddress: string =
                    receiver.unshieldedKeystore.getBech32Address().toString();

                shieldedAddress = derivedShieldedAddress;
                unshieldedAddress = derivedUnshieldedAddress;

                await receiver.wallet.stop();
            } catch (err) {
                await receiver.wallet.stop();
                throw err;
            }
        }

        if (shieldedAddress && !validateAddress(shieldedAddress, 'shielded')) {
            return c.json<FundResponse>(
                {
                    success: false,
                    error: `Invalid shielded address. Expected prefix: mn_shield-addr_undeployed`,
                },
                400,
            );
        }

        if (unshieldedAddress && !validateAddress(unshieldedAddress, 'unshielded')) {
            return c.json<FundResponse>(
                {
                    success: false,
                    error: `Invalid unshielded address. Expected prefix: mn_addr_undeployed`,
                },
                400,
            );
        }

        const sender = await initWalletWithSeed(GENESIS_WALLET_SEED);

        try {
            const txHash = await fundAddresses(sender, {
                shieldedAddress,
                unshieldedAddress,
            });

            const response: FundResponse = {
                success: true,
                txHash,
            };

            if (body.mnemonic) {
                response.shieldedAddress = shieldedAddress;
                response.unshieldedAddress = unshieldedAddress;
            }

            return c.json<FundResponse>(response, 200);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return c.json<FundResponse>(
                {
                    success: false,
                    error: `Failed to fund addresses: ${errorMessage}`,
                },
                500,
            );
        } finally {
            await sender.wallet.stop();
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        return c.json<FundResponse>(
            {
                success: false,
                error: `Request processing failed: ${errorMessage}`,
            },
            500,
        );
    }
});

export default fund;


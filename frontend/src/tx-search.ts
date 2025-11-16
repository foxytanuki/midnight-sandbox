/**
 * Transaction Search Utilities
 * トランザクション検索のためのユーティリティ関数
 */

import type { RpcClient } from "./rpc-client";

export interface BlockInfo {
	hash: string;
	number: number;
	extrinsics: string[];
}

export interface TransactionSearchResult {
	blockHash: string;
	blockNumber: number;
	extrinsicIndex: number;
	extrinsic: string;
}

/**
 * ブロック内のextrinsicハッシュを計算（簡易版）
 * 実際の実装では、extrinsicのハッシュを正確に計算する必要があります
 */
function calculateExtrinsicHash(extrinsic: string): string {
	// 実際の実装では、extrinsicをデコードしてハッシュを計算する必要があります
	// ここでは簡易的にextrinsicの文字列からハッシュを生成します
	// 注意: これは正確なハッシュではない可能性があります
	return extrinsic;
}

/**
 * ブロックを取得してextrinsicを検索
 */
export async function findTransactionInBlock(
	client: RpcClient,
	blockHash: string,
	txHash: string,
): Promise<TransactionSearchResult | null> {
	try {
		const block = await client.call<{
			block: {
				header: { number: string };
				extrinsics: string[];
			};
		}>("chain_getBlock", [blockHash]);

		if (!block?.block?.extrinsics) {
			return null;
		}

		const blockNumber = parseInt(block.block.header.number, 16);

		for (let i = 0; i < block.block.extrinsics.length; i++) {
			const extrinsic = block.block.extrinsics[i];
			// 簡易的なマッチング（実際にはextrinsicのハッシュを正確に計算する必要があります）
			if (
				extrinsic.includes(txHash) ||
				calculateExtrinsicHash(extrinsic) === txHash
			) {
				return {
					blockHash,
					blockNumber,
					extrinsicIndex: i,
					extrinsic,
				};
			}
		}

		return null;
	} catch (error) {
		throw new Error(
			`Failed to search block ${blockHash}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * ブロック範囲を検索してトランザクションを見つける
 */
export async function searchTransactionByHash(
	client: RpcClient,
	txHash: string,
	options?: {
		startBlock?: number;
		endBlock?: number;
		maxBlocks?: number;
	},
): Promise<TransactionSearchResult | null> {
	const maxBlocks = options?.maxBlocks ?? 1000;
	const startBlock = options?.startBlock;
	const endBlock = options?.endBlock;

	try {
		// 最新ブロックの番号を取得
		const latestBlockHash = await client.call<string>("chain_getFinalizedHead");
		const latestBlock = await client.call<{
			block: { header: { number: string } };
		}>("chain_getBlock", [latestBlockHash]);

		if (!latestBlock?.block?.header?.number) {
			throw new Error("Failed to get latest block number");
		}

		const latestBlockNumber = parseInt(latestBlock.block.header.number, 16);
		const searchEndBlock = endBlock ?? latestBlockNumber;
		const searchStartBlock =
			startBlock ?? Math.max(0, searchEndBlock - maxBlocks);

		// 後ろから検索（最新のトランザクションから）
		for (
			let blockNum = searchEndBlock;
			blockNum >= searchStartBlock;
			blockNum--
		) {
			try {
				const blockHash = await client.call<string>("chain_getBlockHash", [
					`0x${blockNum.toString(16)}`,
				]);
				if (!blockHash) {
					continue;
				}

				const result = await findTransactionInBlock(client, blockHash, txHash);
				if (result) {
					return result;
				}
			} catch (_error) {}
		}

		return null;
	} catch (error) {
		throw new Error(
			`Failed to search transaction: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

/**
 * アカウントアドレスに関連するトランザクションを検索
 */
export async function searchTransactionsByAccount(
	client: RpcClient,
	accountAddress: string,
	options?: {
		startBlock?: number;
		endBlock?: number;
		maxBlocks?: number;
	},
): Promise<TransactionSearchResult[]> {
	const maxBlocks = options?.maxBlocks ?? 100;
	const startBlock = options?.startBlock;
	const endBlock = options?.endBlock;

	const results: TransactionSearchResult[] = [];

	try {
		// 最新ブロックの番号を取得
		const latestBlockHash = await client.call<string>("chain_getFinalizedHead");
		const latestBlock = await client.call<{
			block: { header: { number: string } };
		}>("chain_getBlock", [latestBlockHash]);

		if (!latestBlock?.block?.header?.number) {
			throw new Error("Failed to get latest block number");
		}

		const latestBlockNumber = parseInt(latestBlock.block.header.number, 16);
		const searchEndBlock = endBlock ?? latestBlockNumber;
		const searchStartBlock =
			startBlock ?? Math.max(0, searchEndBlock - maxBlocks);

		// 後ろから検索
		for (
			let blockNum = searchEndBlock;
			blockNum >= searchStartBlock;
			blockNum--
		) {
			try {
				const blockHash = await client.call<string>("chain_getBlockHash", [
					`0x${blockNum.toString(16)}`,
				]);
				if (!blockHash) {
					continue;
				}

				const block = await client.call<{
					block: {
						header: { number: string };
						extrinsics: string[];
					};
				}>("chain_getBlock", [blockHash]);

				if (!block?.block?.extrinsics) {
					continue;
				}

				const blockNumber = parseInt(block.block.header.number, 16);

				for (let i = 0; i < block.block.extrinsics.length; i++) {
					const extrinsic = block.block.extrinsics[i];
					// 簡易的なマッチング（実際にはextrinsicをデコードしてアカウントアドレスを確認する必要があります）
					if (extrinsic.includes(accountAddress)) {
						results.push({
							blockHash,
							blockNumber,
							extrinsicIndex: i,
							extrinsic,
						});
					}
				}
			} catch (_error) {}
		}

		return results;
	} catch (error) {
		throw new Error(
			`Failed to search transactions by account: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

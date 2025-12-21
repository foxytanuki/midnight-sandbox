import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  bid(context: __compactRuntime.CircuitContext<T>, amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  close_bidding(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  reveal(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_highest_bid(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_bid_count(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  is_revealed(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  bid(context: __compactRuntime.CircuitContext<T>, amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  close_bidding(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  reveal(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_highest_bid(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_bid_count(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  is_revealed(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type Ledger = {
  readonly highestBid: bigint;
  readonly bidCount: bigint;
  readonly isOpen: boolean;
  readonly isRevealed: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;

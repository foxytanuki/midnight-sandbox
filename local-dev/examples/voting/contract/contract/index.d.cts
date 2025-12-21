import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  vote_yes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  vote_no(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  close_voting(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_yes_votes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_no_votes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_total_votes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  vote_yes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  vote_no(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  close_voting(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_yes_votes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_no_votes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_total_votes(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
}

export type Ledger = {
  readonly yesVotes: bigint;
  readonly noVotes: bigint;
  readonly totalVotes: bigint;
  readonly isOpen: boolean;
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

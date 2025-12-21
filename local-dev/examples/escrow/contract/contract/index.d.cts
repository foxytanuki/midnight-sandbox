import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  fund(context: __compactRuntime.CircuitContext<T>, depositAmount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  release(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  refund(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_state(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_amount(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  is_completed(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  fund(context: __compactRuntime.CircuitContext<T>, depositAmount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  release(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  refund(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_state(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_amount(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  is_completed(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type Ledger = {
  readonly state: bigint;
  readonly amount: bigint;
  readonly isFunded: boolean;
  readonly isCompleted: boolean;
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

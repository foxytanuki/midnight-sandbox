import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  enter(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  close_entry(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  draw(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_participant_count(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_winner(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  is_drawn(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  enter(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  close_entry(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  draw(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  get_participant_count(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  get_winner(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  is_drawn(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type Ledger = {
  readonly participantCount: bigint;
  readonly winnerNumber: bigint;
  readonly isDrawn: boolean;
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

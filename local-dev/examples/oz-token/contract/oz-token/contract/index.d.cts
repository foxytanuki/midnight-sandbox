import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
}

export type ImpureCircuits<T> = {
  transfer(context: __compactRuntime.CircuitContext<T>,
           to_0: { is_left: boolean,
                   left: { bytes: Uint8Array },
                   right: { bytes: Uint8Array }
                 },
           value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  mint(context: __compactRuntime.CircuitContext<T>,
       to_0: { is_left: boolean,
               left: { bytes: Uint8Array },
               right: { bytes: Uint8Array }
             },
       amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  burn(context: __compactRuntime.CircuitContext<T>,
       account_0: { is_left: boolean,
                    left: { bytes: Uint8Array },
                    right: { bytes: Uint8Array }
                  },
       amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  pause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  unpause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  balanceOf(context: __compactRuntime.CircuitContext<T>,
            account_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       }): __compactRuntime.CircuitResults<T, bigint>;
  totalSupply(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  owner(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, { is_left: boolean,
                                                                                           left: { bytes: Uint8Array
                                                                                                 },
                                                                                           right: { bytes: Uint8Array
                                                                                                  }
                                                                                         }>;
  isPaused(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  transfer(context: __compactRuntime.CircuitContext<T>,
           to_0: { is_left: boolean,
                   left: { bytes: Uint8Array },
                   right: { bytes: Uint8Array }
                 },
           value_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  mint(context: __compactRuntime.CircuitContext<T>,
       to_0: { is_left: boolean,
               left: { bytes: Uint8Array },
               right: { bytes: Uint8Array }
             },
       amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  burn(context: __compactRuntime.CircuitContext<T>,
       account_0: { is_left: boolean,
                    left: { bytes: Uint8Array },
                    right: { bytes: Uint8Array }
                  },
       amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  pause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  unpause(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, []>;
  balanceOf(context: __compactRuntime.CircuitContext<T>,
            account_0: { is_left: boolean,
                         left: { bytes: Uint8Array },
                         right: { bytes: Uint8Array }
                       }): __compactRuntime.CircuitResults<T, bigint>;
  totalSupply(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, bigint>;
  owner(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, { is_left: boolean,
                                                                                           left: { bytes: Uint8Array
                                                                                                 },
                                                                                           right: { bytes: Uint8Array
                                                                                                  }
                                                                                         }>;
  isPaused(context: __compactRuntime.CircuitContext<T>): __compactRuntime.CircuitResults<T, boolean>;
}

export type Ledger = {
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>,
               _name_0: string,
               _symbol_0: string,
               _decimals_0: bigint,
               _recipient_0: { is_left: boolean,
                               left: { bytes: Uint8Array },
                               right: { bytes: Uint8Array }
                             },
               _amount_0: bigint,
               _initOwner_0: { is_left: boolean,
                               left: { bytes: Uint8Array },
                               right: { bytes: Uint8Array }
                             }): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;

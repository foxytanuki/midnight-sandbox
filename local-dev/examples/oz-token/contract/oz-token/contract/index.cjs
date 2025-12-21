'use strict';
const __compactRuntime = require('@midnight-ntwrk/compact-runtime');
const expectedRuntimeVersionString = '0.9.0';
const expectedRuntimeVersion = expectedRuntimeVersionString.split('-')[0].split('.').map(Number);
const actualRuntimeVersion = __compactRuntime.versionString.split('-')[0].split('.').map(Number);
if (expectedRuntimeVersion[0] != actualRuntimeVersion[0]
     || (actualRuntimeVersion[0] == 0 && expectedRuntimeVersion[1] != actualRuntimeVersion[1])
     || expectedRuntimeVersion[1] > actualRuntimeVersion[1]
     || (expectedRuntimeVersion[1] == actualRuntimeVersion[1] && expectedRuntimeVersion[2] > actualRuntimeVersion[2]))
   throw new __compactRuntime.CompactError(`Version mismatch: compiled code expects ${expectedRuntimeVersionString}, runtime is ${__compactRuntime.versionString}`);
{ const MAX_FIELD = 52435875175126190479447740508185965837690552500527637822603658699938581184512n;
  if (__compactRuntime.MAX_FIELD !== MAX_FIELD)
     throw new __compactRuntime.CompactError(`compiler thinks maximum field value is ${MAX_FIELD}; run time thinks it is ${__compactRuntime.MAX_FIELD}`)
}

const _descriptor_0 = new __compactRuntime.CompactTypeBoolean();

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

class _ZswapCoinPublicKey_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_2 = new _ZswapCoinPublicKey_0();

class _ContractAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_3 = new _ContractAddress_0();

class _Either_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_2.alignment().concat(_descriptor_3.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_0.fromValue(value_0),
      left: _descriptor_2.fromValue(value_0),
      right: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.is_left).concat(_descriptor_2.toValue(value_0.left).concat(_descriptor_3.toValue(value_0.right)));
  }
}

const _descriptor_4 = new _Either_0();

const _descriptor_5 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

const _descriptor_6 = new __compactRuntime.CompactTypeOpaqueString();

const _descriptor_7 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_8 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      transfer: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`transfer: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const to_0 = args_1[1];
        const value_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('transfer',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 26 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        if (!(typeof(to_0) === 'object' && typeof(to_0.is_left) === 'boolean' && typeof(to_0.left) === 'object' && to_0.left.bytes.buffer instanceof ArrayBuffer && to_0.left.bytes.BYTES_PER_ELEMENT === 1 && to_0.left.bytes.length === 32 && typeof(to_0.right) === 'object' && to_0.right.bytes.buffer instanceof ArrayBuffer && to_0.right.bytes.BYTES_PER_ELEMENT === 1 && to_0.right.bytes.length === 32)) {
          __compactRuntime.type_error('transfer',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'oz-token.compact line 26 char 1',
                                      'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                      to_0)
        }
        if (!(typeof(value_0) === 'bigint' && value_0 >= 0n && value_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.type_error('transfer',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'oz-token.compact line 26 char 1',
                                      'Uint<0..340282366920938463463374607431768211455>',
                                      value_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_4.toValue(to_0).concat(_descriptor_5.toValue(value_0)),
            alignment: _descriptor_4.alignment().concat(_descriptor_5.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._transfer_1(context,
                                          partialProofData,
                                          to_0,
                                          value_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      mint: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`mint: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const to_0 = args_1[1];
        const amount_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('mint',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 35 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        if (!(typeof(to_0) === 'object' && typeof(to_0.is_left) === 'boolean' && typeof(to_0.left) === 'object' && to_0.left.bytes.buffer instanceof ArrayBuffer && to_0.left.bytes.BYTES_PER_ELEMENT === 1 && to_0.left.bytes.length === 32 && typeof(to_0.right) === 'object' && to_0.right.bytes.buffer instanceof ArrayBuffer && to_0.right.bytes.BYTES_PER_ELEMENT === 1 && to_0.right.bytes.length === 32)) {
          __compactRuntime.type_error('mint',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'oz-token.compact line 35 char 1',
                                      'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                      to_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.type_error('mint',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'oz-token.compact line 35 char 1',
                                      'Uint<0..340282366920938463463374607431768211455>',
                                      amount_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_4.toValue(to_0).concat(_descriptor_5.toValue(amount_0)),
            alignment: _descriptor_4.alignment().concat(_descriptor_5.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._mint_0(context, partialProofData, to_0, amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      burn: (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`burn: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const account_0 = args_1[1];
        const amount_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('burn',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 45 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        if (!(typeof(account_0) === 'object' && typeof(account_0.is_left) === 'boolean' && typeof(account_0.left) === 'object' && account_0.left.bytes.buffer instanceof ArrayBuffer && account_0.left.bytes.BYTES_PER_ELEMENT === 1 && account_0.left.bytes.length === 32 && typeof(account_0.right) === 'object' && account_0.right.bytes.buffer instanceof ArrayBuffer && account_0.right.bytes.BYTES_PER_ELEMENT === 1 && account_0.right.bytes.length === 32)) {
          __compactRuntime.type_error('burn',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'oz-token.compact line 45 char 1',
                                      'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                      account_0)
        }
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0n && amount_0 <= 340282366920938463463374607431768211455n)) {
          __compactRuntime.type_error('burn',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'oz-token.compact line 45 char 1',
                                      'Uint<0..340282366920938463463374607431768211455>',
                                      amount_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_4.toValue(account_0).concat(_descriptor_5.toValue(amount_0)),
            alignment: _descriptor_4.alignment().concat(_descriptor_5.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._burn_0(context,
                                      partialProofData,
                                      account_0,
                                      amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      pause: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`pause: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('pause',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 54 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._pause_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      unpause: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`unpause: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('unpause',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 60 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._unpause_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      balanceOf: (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`balanceOf: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const account_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('balanceOf',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 66 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        if (!(typeof(account_0) === 'object' && typeof(account_0.is_left) === 'boolean' && typeof(account_0.left) === 'object' && account_0.left.bytes.buffer instanceof ArrayBuffer && account_0.left.bytes.BYTES_PER_ELEMENT === 1 && account_0.left.bytes.length === 32 && typeof(account_0.right) === 'object' && account_0.right.bytes.buffer instanceof ArrayBuffer && account_0.right.bytes.BYTES_PER_ELEMENT === 1 && account_0.right.bytes.length === 32)) {
          __compactRuntime.type_error('balanceOf',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'oz-token.compact line 66 char 1',
                                      'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                      account_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_4.toValue(account_0),
            alignment: _descriptor_4.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._balanceOf_1(context, partialProofData, account_0);
        partialProofData.output = { value: _descriptor_5.toValue(result_0), alignment: _descriptor_5.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      totalSupply: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`totalSupply: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('totalSupply',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 71 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._totalSupply_1(context, partialProofData);
        partialProofData.output = { value: _descriptor_5.toValue(result_0), alignment: _descriptor_5.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      owner: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`owner: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('owner',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 76 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._owner_1(context, partialProofData);
        partialProofData.output = { value: _descriptor_4.toValue(result_0), alignment: _descriptor_4.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      isPaused: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`isPaused: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined)) {
          __compactRuntime.type_error('isPaused',
                                      'argument 1 (as invoked from Typescript)',
                                      'oz-token.compact line 81 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        }
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._isPaused_1(context, partialProofData);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      }
    };
    this.impureCircuits = {
      transfer: this.circuits.transfer,
      mint: this.circuits.mint,
      burn: this.circuits.burn,
      pause: this.circuits.pause,
      unpause: this.circuits.unpause,
      balanceOf: this.circuits.balanceOf,
      totalSupply: this.circuits.totalSupply,
      owner: this.circuits.owner,
      isPaused: this.circuits.isPaused
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 7) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 7 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const _name_0 = args_0[1];
    const _symbol_0 = args_0[2];
    const _decimals_0 = args_0[3];
    const _recipient_0 = args_0[4];
    const _amount_0 = args_0[5];
    const _initOwner_0 = args_0[6];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(_decimals_0) === 'bigint' && _decimals_0 >= 0n && _decimals_0 <= 255n)) {
      __compactRuntime.type_error('Contract state constructor',
                                  'argument 3 (argument 4 as invoked from Typescript)',
                                  'oz-token.compact line 12 char 1',
                                  'Uint<0..255>',
                                  _decimals_0)
    }
    if (!(typeof(_recipient_0) === 'object' && typeof(_recipient_0.is_left) === 'boolean' && typeof(_recipient_0.left) === 'object' && _recipient_0.left.bytes.buffer instanceof ArrayBuffer && _recipient_0.left.bytes.BYTES_PER_ELEMENT === 1 && _recipient_0.left.bytes.length === 32 && typeof(_recipient_0.right) === 'object' && _recipient_0.right.bytes.buffer instanceof ArrayBuffer && _recipient_0.right.bytes.BYTES_PER_ELEMENT === 1 && _recipient_0.right.bytes.length === 32)) {
      __compactRuntime.type_error('Contract state constructor',
                                  'argument 4 (argument 5 as invoked from Typescript)',
                                  'oz-token.compact line 12 char 1',
                                  'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                  _recipient_0)
    }
    if (!(typeof(_amount_0) === 'bigint' && _amount_0 >= 0n && _amount_0 <= 340282366920938463463374607431768211455n)) {
      __compactRuntime.type_error('Contract state constructor',
                                  'argument 5 (argument 6 as invoked from Typescript)',
                                  'oz-token.compact line 12 char 1',
                                  'Uint<0..340282366920938463463374607431768211455>',
                                  _amount_0)
    }
    if (!(typeof(_initOwner_0) === 'object' && typeof(_initOwner_0.is_left) === 'boolean' && typeof(_initOwner_0.left) === 'object' && _initOwner_0.left.bytes.buffer instanceof ArrayBuffer && _initOwner_0.left.bytes.BYTES_PER_ELEMENT === 1 && _initOwner_0.left.bytes.length === 32 && typeof(_initOwner_0.right) === 'object' && _initOwner_0.right.bytes.buffer instanceof ArrayBuffer && _initOwner_0.right.bytes.BYTES_PER_ELEMENT === 1 && _initOwner_0.right.bytes.length === 32)) {
      __compactRuntime.type_error('Contract state constructor',
                                  'argument 6 (argument 7 as invoked from Typescript)',
                                  'oz-token.compact line 12 char 1',
                                  'struct Either<is_left: Boolean, left: struct ZswapCoinPublicKey<bytes: Bytes<32>>, right: struct ContractAddress<bytes: Bytes<32>>>',
                                  _initOwner_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = stateValue_0;
    state_0.setOperation('transfer', new __compactRuntime.ContractOperation());
    state_0.setOperation('mint', new __compactRuntime.ContractOperation());
    state_0.setOperation('burn', new __compactRuntime.ContractOperation());
    state_0.setOperation('pause', new __compactRuntime.ContractOperation());
    state_0.setOperation('unpause', new __compactRuntime.ContractOperation());
    state_0.setOperation('balanceOf', new __compactRuntime.ContractOperation());
    state_0.setOperation('totalSupply', new __compactRuntime.ContractOperation());
    state_0.setOperation('owner', new __compactRuntime.ContractOperation());
    state_0.setOperation('isPaused', new __compactRuntime.ContractOperation());
    const context = {
      originalState: state_0,
      currentPrivateState: constructorContext_0.initialPrivateState,
      currentZswapLocalState: constructorContext_0.initialZswapLocalState,
      transactionContext: new __compactRuntime.QueryContext(state_0.data, __compactRuntime.dummyContractAddress())
    };
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(0n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue({ is_left: false, left: { bytes: new Uint8Array(32) }, right: { bytes: new Uint8Array(32) } }),
                                                                            alignment: _descriptor_4.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(1n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(false),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(2n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(false),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(3n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(4n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(5n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(0n),
                                                                            alignment: _descriptor_5.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(6n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(''),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(7n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(''),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(8n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(0n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(9n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(false),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    this._initialize_0(context, partialProofData, _initOwner_0);
    this._initialize_2(context,
                       partialProofData,
                       _name_0,
                       _symbol_0,
                       _decimals_0);
    this.__mint_0(context, partialProofData, _recipient_0, _amount_0);
    state_0.data = context.transactionContext.state;
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _left_0(value_0) {
    return { is_left: true, left: value_0, right: { bytes: new Uint8Array(32) } };
  }
  _ownPublicKey_0(context, partialProofData) {
    const result_0 = __compactRuntime.ownPublicKey(context);
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_2.toValue(result_0),
      alignment: _descriptor_2.alignment()
    });
    return result_0;
  }
  _burnAddress_0() { return this._left_0({ bytes: new Uint8Array(32) }); }
  _initialize_0(context, partialProofData, initialOwner_0) {
    this._initialize_1(context, partialProofData);
    __compactRuntime.assert(!this._isKeyOrAddressZero_0(initialOwner_0),
                            'Ownable: invalid initial owner');
    this.__transferOwnership_0(context, partialProofData, initialOwner_0);
    return [];
  }
  _owner_0(context, partialProofData) {
    this._assertInitialized_0(context, partialProofData);
    return _descriptor_4.fromValue(Contract._query(context,
                                                   partialProofData,
                                                   [
                                                    { dup: { n: 0 } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_7.toValue(0n),
                                                                               alignment: _descriptor_7.alignment() } }] } },
                                                    { popeq: { cached: false,
                                                               result: undefined } }]).value);
  }
  _assertOnlyOwner_0(context, partialProofData) {
    this._assertInitialized_0(context, partialProofData);
    const caller_0 = this._ownPublicKey_0(context, partialProofData);
    __compactRuntime.assert(this._equal_0(caller_0,
                                          _descriptor_4.fromValue(Contract._query(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_7.toValue(0n),
                                                                                                              alignment: _descriptor_7.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value).left),
                            'Ownable: caller is not the owner');
    return [];
  }
  __transferOwnership_0(context, partialProofData, newOwner_0) {
    this._assertInitialized_0(context, partialProofData);
    __compactRuntime.assert(!this._isContractAddress_0(newOwner_0),
                            'Ownable: unsafe ownership transfer');
    this.__unsafeUncheckedTransferOwnership_0(context,
                                              partialProofData,
                                              newOwner_0);
    return [];
  }
  __unsafeUncheckedTransferOwnership_0(context, partialProofData, newOwner_0) {
    this._assertInitialized_0(context, partialProofData);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(0n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(newOwner_0),
                                                                            alignment: _descriptor_4.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _initialize_1(context, partialProofData) {
    this._assertNotInitialized_0(context, partialProofData);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(1n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(true),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _assertInitialized_0(context, partialProofData) {
    __compactRuntime.assert(_descriptor_0.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_7.toValue(1n),
                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value),
                            'Initializable: contract not initialized');
    return [];
  }
  _assertNotInitialized_0(context, partialProofData) {
    __compactRuntime.assert(!_descriptor_0.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_7.toValue(1n),
                                                                                                 alignment: _descriptor_7.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value),
                            'Initializable: contract already initialized');
    return [];
  }
  _isKeyOrAddressZero_0(keyOrAddress_0) {
    if (this._isContractAddress_0(keyOrAddress_0)) {
      return this._equal_1({ bytes: new Uint8Array(32) }, keyOrAddress_0.right);
    } else {
      return this._equal_2({ bytes: new Uint8Array(32) }, keyOrAddress_0.left);
    }
  }
  _isContractAddress_0(keyOrAddress_0) { return !keyOrAddress_0.is_left; }
  _isPaused_0(context, partialProofData) {
    return _descriptor_0.fromValue(Contract._query(context,
                                                   partialProofData,
                                                   [
                                                    { dup: { n: 0 } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_7.toValue(2n),
                                                                               alignment: _descriptor_7.alignment() } }] } },
                                                    { popeq: { cached: false,
                                                               result: undefined } }]).value);
  }
  _assertPaused_0(context, partialProofData) {
    __compactRuntime.assert(_descriptor_0.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_7.toValue(2n),
                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value),
                            'Pausable: not paused');
    return [];
  }
  _assertNotPaused_0(context, partialProofData) {
    __compactRuntime.assert(!_descriptor_0.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_7.toValue(2n),
                                                                                                 alignment: _descriptor_7.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value),
                            'Pausable: paused');
    return [];
  }
  __pause_0(context, partialProofData) {
    this._assertNotPaused_0(context, partialProofData);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(2n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(true),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  __unpause_0(context, partialProofData) {
    this._assertPaused_0(context, partialProofData);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(2n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(false),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _initialize_2(context, partialProofData, name__0, symbol__0, decimals__0) {
    this._initialize_3(context, partialProofData);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(6n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(name__0),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(7n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(symbol__0),
                                                                            alignment: _descriptor_6.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(8n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(decimals__0),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _totalSupply_0(context, partialProofData) {
    this._assertInitialized_1(context, partialProofData);
    return _descriptor_5.fromValue(Contract._query(context,
                                                   partialProofData,
                                                   [
                                                    { dup: { n: 0 } },
                                                    { idx: { cached: false,
                                                             pushPath: false,
                                                             path: [
                                                                    { tag: 'value',
                                                                      value: { value: _descriptor_7.toValue(5n),
                                                                               alignment: _descriptor_7.alignment() } }] } },
                                                    { popeq: { cached: false,
                                                               result: undefined } }]).value);
  }
  _balanceOf_0(context, partialProofData, account_0) {
    this._assertInitialized_1(context, partialProofData);
    if (!_descriptor_0.fromValue(Contract._query(context,
                                                 partialProofData,
                                                 [
                                                  { dup: { n: 0 } },
                                                  { idx: { cached: false,
                                                           pushPath: false,
                                                           path: [
                                                                  { tag: 'value',
                                                                    value: { value: _descriptor_7.toValue(3n),
                                                                             alignment: _descriptor_7.alignment() } }] } },
                                                  { push: { storage: false,
                                                            value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(account_0),
                                                                                                         alignment: _descriptor_4.alignment() }).encode() } },
                                                  'member',
                                                  { popeq: { cached: true,
                                                             result: undefined } }]).value))
    {
      return 0n;
    } else {
      return _descriptor_5.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_7.toValue(3n),
                                                                                 alignment: _descriptor_7.alignment() } }] } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_4.toValue(account_0),
                                                                                 alignment: _descriptor_4.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    }
  }
  _transfer_0(context, partialProofData, to_0, value_0) {
    this._assertInitialized_1(context, partialProofData);
    __compactRuntime.assert(!this._isContractAddress_1(to_0),
                            'FungibleToken: Unsafe Transfer');
    return this.__unsafeTransfer_0(context, partialProofData, to_0, value_0);
  }
  __unsafeTransfer_0(context, partialProofData, to_0, value_0) {
    this._assertInitialized_1(context, partialProofData);
    const owner_0 = this._left_0(this._ownPublicKey_0(context, partialProofData));
    this.__unsafeUncheckedTransfer_0(context,
                                     partialProofData,
                                     owner_0,
                                     to_0,
                                     value_0);
    return true;
  }
  __unsafeUncheckedTransfer_0(context, partialProofData, from_0, to_0, value_0)
  {
    this._assertInitialized_1(context, partialProofData);
    __compactRuntime.assert(!this._isKeyOrAddressZero_1(from_0),
                            'FungibleToken: invalid sender');
    __compactRuntime.assert(!this._isKeyOrAddressZero_1(to_0),
                            'FungibleToken: invalid receiver');
    this.__update_0(context, partialProofData, from_0, to_0, value_0);
    return [];
  }
  __update_0(context, partialProofData, from_0, to_0, value_0) {
    this._assertInitialized_1(context, partialProofData);
    if (this._isKeyOrAddressZero_1(from_0)) {
      const MAX_UINT128_0 = 340282366920938463463374607431768211455n;
      let t_0;
      __compactRuntime.assert((t_0 = _descriptor_5.fromValue(Contract._query(context,
                                                                             partialProofData,
                                                                             [
                                                                              { dup: { n: 0 } },
                                                                              { idx: { cached: false,
                                                                                       pushPath: false,
                                                                                       path: [
                                                                                              { tag: 'value',
                                                                                                value: { value: _descriptor_7.toValue(5n),
                                                                                                         alignment: _descriptor_7.alignment() } }] } },
                                                                              { popeq: { cached: false,
                                                                                         result: undefined } }]).value),
                               (__compactRuntime.assert(!(MAX_UINT128_0 < t_0),
                                                        'result of subtraction would be negative'),
                                MAX_UINT128_0 - t_0))
                              >=
                              value_0,
                              'FungibleToken: arithmetic overflow');
      const tmp_0 = ((t1) => {
                      if (t1 > 340282366920938463463374607431768211455n) {
                        throw new __compactRuntime.CompactError('FungibleToken.compact line 445 char 31: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 340282366920938463463374607431768211455');
                      }
                      return t1;
                    })(_descriptor_5.fromValue(Contract._query(context,
                                                               partialProofData,
                                                               [
                                                                { dup: { n: 0 } },
                                                                { idx: { cached: false,
                                                                         pushPath: false,
                                                                         path: [
                                                                                { tag: 'value',
                                                                                  value: { value: _descriptor_7.toValue(5n),
                                                                                           alignment: _descriptor_7.alignment() } }] } },
                                                                { popeq: { cached: false,
                                                                           result: undefined } }]).value)
                       +
                       value_0);
      Contract._query(context,
                      partialProofData,
                      [
                       { push: { storage: false,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(5n),
                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                       { push: { storage: true,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                       { ins: { cached: false, n: 1 } }]);
    } else {
      const fromBal_0 = this._balanceOf_0(context, partialProofData, from_0);
      __compactRuntime.assert(fromBal_0 >= value_0,
                              'FungibleToken: insufficient balance');
      const tmp_1 = (__compactRuntime.assert(!(fromBal_0 < value_0),
                                             'result of subtraction would be negative'),
                     fromBal_0 - value_0);
      Contract._query(context,
                      partialProofData,
                      [
                       { idx: { cached: false,
                                pushPath: true,
                                path: [
                                       { tag: 'value',
                                         value: { value: _descriptor_7.toValue(3n),
                                                  alignment: _descriptor_7.alignment() } }] } },
                       { push: { storage: false,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(from_0),
                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                       { push: { storage: true,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_1),
                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                       { ins: { cached: false, n: 1 } },
                       { ins: { cached: true, n: 1 } }]);
    }
    if (this._isKeyOrAddressZero_1(to_0)) {
      let t_1;
      const tmp_2 = (t_1 = _descriptor_5.fromValue(Contract._query(context,
                                                                   partialProofData,
                                                                   [
                                                                    { dup: { n: 0 } },
                                                                    { idx: { cached: false,
                                                                             pushPath: false,
                                                                             path: [
                                                                                    { tag: 'value',
                                                                                      value: { value: _descriptor_7.toValue(5n),
                                                                                               alignment: _descriptor_7.alignment() } }] } },
                                                                    { popeq: { cached: false,
                                                                               result: undefined } }]).value),
                     (__compactRuntime.assert(!(t_1 < value_0),
                                              'result of subtraction would be negative'),
                      t_1 - value_0));
      Contract._query(context,
                      partialProofData,
                      [
                       { push: { storage: false,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(5n),
                                                                              alignment: _descriptor_7.alignment() }).encode() } },
                       { push: { storage: true,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_2),
                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                       { ins: { cached: false, n: 1 } }]);
    } else {
      const toBal_0 = this._balanceOf_0(context, partialProofData, to_0);
      const tmp_3 = ((t1) => {
                      if (t1 > 340282366920938463463374607431768211455n) {
                        throw new __compactRuntime.CompactError('FungibleToken.compact line 457 char 47: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 340282366920938463463374607431768211455');
                      }
                      return t1;
                    })(toBal_0 + value_0);
      Contract._query(context,
                      partialProofData,
                      [
                       { idx: { cached: false,
                                pushPath: true,
                                path: [
                                       { tag: 'value',
                                         value: { value: _descriptor_7.toValue(3n),
                                                  alignment: _descriptor_7.alignment() } }] } },
                       { push: { storage: false,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(to_0),
                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                       { push: { storage: true,
                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_3),
                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                       { ins: { cached: false, n: 1 } },
                       { ins: { cached: true, n: 1 } }]);
    }
    return [];
  }
  __mint_0(context, partialProofData, account_0, value_0) {
    this._assertInitialized_1(context, partialProofData);
    __compactRuntime.assert(!this._isContractAddress_1(account_0),
                            'FungibleToken: Unsafe Transfer');
    this.__unsafeMint_0(context, partialProofData, account_0, value_0);
    return [];
  }
  __unsafeMint_0(context, partialProofData, account_0, value_0) {
    this._assertInitialized_1(context, partialProofData);
    __compactRuntime.assert(!this._isKeyOrAddressZero_1(account_0),
                            'FungibleToken: invalid receiver');
    this.__update_0(context,
                    partialProofData,
                    this._burnAddress_0(),
                    account_0,
                    value_0);
    return [];
  }
  __burn_0(context, partialProofData, account_0, value_0) {
    this._assertInitialized_1(context, partialProofData);
    __compactRuntime.assert(!this._isKeyOrAddressZero_1(account_0),
                            'FungibleToken: invalid sender');
    this.__update_0(context,
                    partialProofData,
                    account_0,
                    this._burnAddress_0(),
                    value_0);
    return [];
  }
  _initialize_3(context, partialProofData) {
    this._assertNotInitialized_1(context, partialProofData);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_7.toValue(9n),
                                                                            alignment: _descriptor_7.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(true),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _assertInitialized_1(context, partialProofData) {
    __compactRuntime.assert(_descriptor_0.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_7.toValue(9n),
                                                                                                alignment: _descriptor_7.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value),
                            'Initializable: contract not initialized');
    return [];
  }
  _assertNotInitialized_1(context, partialProofData) {
    __compactRuntime.assert(!_descriptor_0.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_7.toValue(9n),
                                                                                                 alignment: _descriptor_7.alignment() } }] } },
                                                                      { popeq: { cached: false,
                                                                                 result: undefined } }]).value),
                            'Initializable: contract already initialized');
    return [];
  }
  _isKeyOrAddressZero_1(keyOrAddress_0) {
    if (this._isContractAddress_1(keyOrAddress_0)) {
      return this._equal_3({ bytes: new Uint8Array(32) }, keyOrAddress_0.right);
    } else {
      return this._equal_4({ bytes: new Uint8Array(32) }, keyOrAddress_0.left);
    }
  }
  _isContractAddress_1(keyOrAddress_0) { return !keyOrAddress_0.is_left; }
  _transfer_1(context, partialProofData, to_0, value_0) {
    this._assertNotPaused_0(context, partialProofData);
    return this._transfer_0(context, partialProofData, to_0, value_0);
  }
  _mint_0(context, partialProofData, to_0, amount_0) {
    this._assertOnlyOwner_0(context, partialProofData);
    this._assertNotPaused_0(context, partialProofData);
    this.__mint_0(context, partialProofData, to_0, amount_0);
    return [];
  }
  _burn_0(context, partialProofData, account_0, amount_0) {
    this._assertNotPaused_0(context, partialProofData);
    this.__burn_0(context, partialProofData, account_0, amount_0);
    return [];
  }
  _pause_0(context, partialProofData) {
    this._assertOnlyOwner_0(context, partialProofData);
    this.__pause_0(context, partialProofData);
    return [];
  }
  _unpause_0(context, partialProofData) {
    this._assertOnlyOwner_0(context, partialProofData);
    this.__unpause_0(context, partialProofData);
    return [];
  }
  _balanceOf_1(context, partialProofData, account_0) {
    return this._balanceOf_0(context, partialProofData, account_0);
  }
  _totalSupply_1(context, partialProofData) {
    return this._totalSupply_0(context, partialProofData);
  }
  _owner_1(context, partialProofData) {
    return this._owner_0(context, partialProofData);
  }
  _isPaused_1(context, partialProofData) {
    return this._isPaused_0(context, partialProofData);
  }
  _equal_0(x0, y0) {
    {
      let x1 = x0.bytes;
      let y1 = y0.bytes;
      if (!x1.every((x, i) => y1[i] === x)) { return false; }
    }
    return true;
  }
  _equal_1(x0, y0) {
    {
      let x1 = x0.bytes;
      let y1 = y0.bytes;
      if (!x1.every((x, i) => y1[i] === x)) { return false; }
    }
    return true;
  }
  _equal_2(x0, y0) {
    {
      let x1 = x0.bytes;
      let y1 = y0.bytes;
      if (!x1.every((x, i) => y1[i] === x)) { return false; }
    }
    return true;
  }
  _equal_3(x0, y0) {
    {
      let x1 = x0.bytes;
      let y1 = y0.bytes;
      if (!x1.every((x, i) => y1[i] === x)) { return false; }
    }
    return true;
  }
  _equal_4(x0, y0) {
    {
      let x1 = x0.bytes;
      let y1 = y0.bytes;
      if (!x1.every((x, i) => y1[i] === x)) { return false; }
    }
    return true;
  }
  static _query(context, partialProofData, prog) {
    var res;
    try {
      res = context.transactionContext.query(prog, __compactRuntime.CostModel.dummyCostModel());
    } catch (err) {
      throw new __compactRuntime.CompactError(err.toString());
    }
    context.transactionContext = res.context;
    var reads = res.events.filter((e) => e.tag === 'read');
    var i = 0;
    partialProofData.publicTranscript = partialProofData.publicTranscript.concat(prog.map((op) => {
      if(typeof(op) === 'object' && 'popeq' in op) {
        return { popeq: {
          ...op.popeq,
          result: reads[i++].content,
        } };
      } else {
        return op;
      }
    }));
    if(res.events.length == 1 && res.events[0].tag === 'read') {
      return res.events[0].content;
    } else {
      return res.events;
    }
  }
}
function ledger(state) {
  const context = {
    originalState: state,
    transactionContext: new __compactRuntime.QueryContext(state, __compactRuntime.dummyContractAddress())
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
  };
}
const _emptyContext = {
  originalState: new __compactRuntime.ContractState(),
  transactionContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({ });
const pureCircuits = {};
const contractReferenceLocations = { tag: 'publicLedgerArray', indices: { } };
exports.Contract = Contract;
exports.ledger = ledger;
exports.pureCircuits = pureCircuits;
exports.contractReferenceLocations = contractReferenceLocations;
//# sourceMappingURL=index.cjs.map

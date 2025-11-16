# midnight-sandbox

[Midnight](https://midnight.network/) Hands-on Notes


## Setup Prerequisites

```
❯ docker --version
Docker version 28.3.3, build 980b856

❯ docker search midnightnetwork
NAME                                      DESCRIPTION   STARS     OFFICIAL
midnightnetwork/proof-server                            4
midnightnetwork/midnight-node                           3
midnightnetwork/midnight-pubsub-indexer                 1
midnightnetwork/compactc                                3
```

### Setup Lace Wallet and Get Testnet Tokens

> You must use the Chrome web browser or its derivatives to complete web-based transactions on the Midnight testnet.

https://chromewebstore.google.com/detail/lace-midnight-preview/hgeekaiplokcnmakghbdfbgnlfheichg

I followed the instruction in [the tutorial](https://docs.midnight.network/develop/tutorial/using/chrome-ext) and generated the wallet address like the below:


`mn_shield-addr_test187fpj5ryfsea7gwaa8d0rr6kpruq44kt9s0e2f6unqnngj73q2asxq86hc8q56dm4snlxeanet6hy39rrp0fet8rxtfwrjtkgq5mxve95yzdl8yv`

Then, got test tokens from [a faucet](https://midnight.network/test-faucet) 

Here's a tx hash of the transfer: `00000000f58097d65ae3670c308fff5529c3c7ac83f5122b841589b98453ebd4becb4bba`, but I couldn't find any links of explorers for now.

### Setup Proof Server

> ZK functionality provided by a Midnight proof server, which generates proofs locally that will be verified on-chain.

https://docs.midnight.network/develop/tutorial/using/proof-server

**Note:** The proof-server should be run on the same machine where the Chrome extension (Lace Wallet) is installed. Running the proof-server on a remote development machine may cause connectivity issues with the extension.

Pull the proof-server image:

```
docker pull midnightnetwork/proof-server:latest
```

Run proof-server:

```
docker run -p 6300:6300 midnightnetwork/proof-server -- 'midnight-proof-server --network testnet'
```

## Build a DApp

```
❯ node -v
v22.15.1
```

Install the developer tools

```
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
```

Update

```
❯ compact update
compact: x86_64-unknown-linux-musl -- 0.25.0 -- installed
compact: x86_64-unknown-linux-musl -- 0.25.0 -- default.
```

```
❯ compact compile --version
0.25.0
```

Cloned the example repository as described in [the official documentation](https://docs.midnight.network/develop/tutorial/building/examples-repo)

It says "You will be using Yarn" but the following tutorial documents are using npm, so I decided to use npm.

### Build the counter DApp

https://docs.midnight.network/develop/tutorial/building/counter-build

**Note:** The official documentation instructs to run `npm run compile` in the `contract` folder, but there is no `compile` script defined.  
Instead, use the following command to compile and test the contract:

```
npm run compact && npm run build
```

--

```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
        "jsonrpc": "2.0",
        "method": "system_chain",
        "params": [],
        "id": 1
      }' \
  https://rpc.testnet-02.midnight.network/
```




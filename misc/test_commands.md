# Commands to test the App

## Interacting with WA

### Mutations

First set one of the inputs

- Send Rives replay

```shell
input=0x1789cd6300000000000000000000000070ac08179605af2d9e75782b8decdd3c22aa4d0c00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000224456c9a94692f2ffe5d9299521e3a75611c3659d218babaec50b1e0f4107c2f204ffe779d1874d72ed2cfef8f1925fafe183f29b60eeb5d380f8b13aa1f3550852668f8da00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000da010108039e00000036000000ca000000848382558c3d4fc3301884efce766ce7ab711aa0244869279090808101a91348203a74ee5febcfede00cedabf7eea493ee01080004410802014280ae1a4200240824980d527e929496092840b7a97c0b592021619104490000653898f924108e7ef7f8a6e836f49a68b5b6951a377255bf8499f7ecedce14f654fde8299ed98607fdbad67e777fa1351f73bc6b0e5dd7aecb72fbb9924c3286496492512235d0f1b54f7dace3f06fbe58ef9f19436db62c38aad23eb9b19c7b3fbd4f9b7088c5d055dedb21946a18dc05000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
```

- Send Achievements replay

```shell
input=
```

- Create Achievement (with replay)

```shell
```

- Collect Moment

```shell
input=
```

- Drop Moment

```shell
input=
```

Then send the input with:

```shell
sunodo send generic --chain-id=31337 --rpc-url=http://127.0.0.1:8545 \
    --mnemonic-index=0 --mnemonic-passphrase='test test test test test test test test test test test junk'\
    --dapp=0x70ac08179605AF2D9e75782b8DEcDD3c22aA4D0C --input=$input
```

### Queries

List of achievements (and with filters)

```shell
curl -s "http://localhost:8080/inspect/achievements/achievements" | jq -r '.reports[0].payload' | xxd -r -p | jq
curl -s "http://localhost:8080/inspect/achievements/achievements?player=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" | jq -r '.reports[0].payload' | xxd -r -p | jq
curl -s "http://localhost:8080/inspect/achievements/achievements?order_by=popular&order_dir=desc" | jq -r '.reports[0].payload' | xxd -r -p | jq
```

Achievement info

```shell
curl -s "http://localhost:8080/inspect/achievements/achievement_info?id=2cb2870d0aeb05d6de548ba57c1a564d28dc0892810ffc6e350294a4d0a25eed" | jq -r '.reports[0].payload' | xxd -r -p | jq
```

Cartridge binary (could get from graphql with indexer too once inserted)

```shell
curl -s http://localhost:8080/inspect/app/cartridge?id=4429c48c5c15205b66056fd426b7c72940c2b366a7f746a7989b53730d52bb5c | jq -r '.reports[0].payload'
```

Gameplays

```shell
curl -s "http://localhost:8080/inspect/achievements/gameplays" | jq -r '.reports[0].payload' | xxd -r -p | jq
curl -s "http://localhost:8080/inspect/achievements/gameplays?cartridge_id=" | jq -r '.reports[0].payload' | xxd -r -p | jq
curl -s "http://localhost:8080/inspect/achievements/gameplays?order_by=popular&order_dir=desc" | jq -r '.reports[0].payload' | xxd -r -p | jq
```

Cartridge scoreboard score

```shell
curl -s "http://localhost:8080/inspect/app/scores?scoreboard_id=a7a39b72f29718e653e73503210fbb597057b7a1c77d1fe321a1afcff041d4e1" | jq -r '.reports[0].payload' | xxd -r -p | jq
```

indexer queries

```shell
curl -s http://localhost:8080/inspect/indexer/indexer_query?tags=score | jq -r '.reports[0].payload' | xxd -r -p
curl -s "http://localhost:8080/inspect/indexer/indexer_query?tags=replay&msg_sender=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" | jq -r '.reports[0].payload' | xxd -r -p
```

Indexer score from scoreboard

```shell
indexer_result=$(curl -s http://localhost:8080/inspect/indexer/indexer_query?tags=score | jq -r '.reports[0].payload' | xxd -r -p | jq)
curl -s -H 'Content-Type: application/json' -X POST "http://localhost:8080/graphql" -d "{ \"query\":\"query { notice(inputIndex:$(echo $indexer_result | jq -r '.[0].input_index'),noticeIndex:$(echo $indexer_result | jq -r '.[0].output_index')) { payload}}\"}}" | jq -r '.data.notice.payload' | sed -r 's/^0x//' | tr -d '\n' | xxd -c 32
```

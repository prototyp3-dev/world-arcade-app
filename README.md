# Achievements

```
Cartesi Rollups Node version: 1.2.x (sunodo version 0.10.x)
```

Made it project integrates with Rives gameplay verification to allow a complete ecosystem based on the game achievements and moments. Users can create achievements based on the output of games, players can get the achievements, and collectors can collect to display on their gallery.

DISCLAIMERS

For now, this is not a final product and should not be used as one.

## Requirements

- [npm](https://docs.npmjs.com/cli/v9/configuring-npm/install) to install dependencies and run the frontend
- [Sunodo](https://github.com/sunodo/sunodo) to build and run the DApp backend
- [Metamask](https://metamask.io/) to sign transactions in the frontend
- [cartesapp](https://github.com/prototyp3-dev/cartesapp/), an interface to cartesi rollups framework

To build the DApp, two images are also required: `riv/toolchain` and `sunodo/sdk:0.2.0-riv`.

- To generate `riv/toolchain`, clone [RIV repository](https://github.com/edubart/riv) and in its directory do:
```shell
make toolchain
```

- To generate `sunodo/sdk:0.2.0-riv`, in the `world-arcade` project directory do:
```shell
docker build --tag sunodo/sdk:0.2.0-riv . --target sunodo-riv --progress plain .
```

## Building

Build backend with:

```shell
sunodo build
```

You should also install the frontend dependencies. First install [cartesi client](https://github.com/prototyp3-dev/cartesi-client), then run:

```shell
cd frontend
yarn
npm link cartesi-client
```

## Running

Run the DApp environment with:

```shell
sunodo run
```

Finally, run the frontend

```shell
cd frontend
yarn dev
```

## Running on Host Machine

Run

```shell
sunodo run --no-backend
```

and on another terminal

```shell
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
RIVEMU_PATH=path/to/riv/rivemu/rivemu ROLLUP_HTTP_SERVER_URL=http://localhost:8080/rollup cartesapp run app achievements --log-level debug
```

"""
Acceptance tests for the application requirements.
"""
import json
import os

import pytest

from cartesi.testclient import TestClient
from cartesi.abi import encode_model, get_abi_types_from_model, decode_to_model
from cartesi.models import ABIFunctionSelectorHeader

from cartesapp.manager import Manager
from cartesapp.wallet.dapp_wallet import DepositErc20Payload

from app.cartridge import generate_cartridge_id
from app.replay import Replay

from achievements.achievement import ReplayAchievements, AcquiredAchievement

import logging
logger = logging.getLogger(__name__)


with open('misc/antcopter.sqfs', 'rb') as fin:
    cartridge_data = fin.read()

ANTCOPTER_ID = generate_cartridge_id(cartridge_data)

# finished level 5
ANTCOPTER_LOG1 = '0x010108039e00000036000000ca000000848382558c3d4fc3301884efce766ce7ab711aa0244869279090808101a91348203a74ee5febcfede00cedabf7eea493ee01080004410802014280ae1a4200240824980d527e929496092840b7a97c0b592021619104490000653898f924108e7ef7f8a6e836f49a68b5b6951a377255bf8499f7ecedce14f654fde8299ed98607fdbad67e777fa1351f73bc6b0e5dd7aecb72fbb9924c3286496492512235d0f1b54f7dace3f06fbe58ef9f19436db62c38aad23eb9b19c7b3fbd4f9b7088c5d055dedb21946a18dc05'
ANTCOPTER_OUTHASH1 = '0x1874d72ed2cfef8f1925fafe183f29b60eeb5d380f8b13aa1f3550852668f8da'

# died on level 2 without berries
ANTCOPTER_LOG2 = '0x01010c034200000022000000360200008483824dc9318ac2501806c0f9fe647d59f25c5790208a0822f61ec2c64b7b350b1b61ba812489c88710514a95aa7c57a250f549c5eca1d9daf8d3ac95b56665b2185dc4228e4627e5aafc1b9cc5cbe0a674dd5eb7f563673059d9991d348b8d2eba72f6abcc8e06cd683179ba4f6f'
ANTCOPTER_OUTHASH2 = '0x1afcab8891cb41213c768e0fd1c1089826a4b508a64e84985cfcaf99867c0018'

ANTCOPTER_OUTHASH_BLANK = '0x' + '0'*64


@pytest.fixture(scope='session')
def dapp_client() -> TestClient:
    # set required environment 
    os.environ["DEBUSSY"] = "1"

    # Mimics the run command to set up the manager
    m = Manager()
    m.add_module('app')
    m.add_module('achievements')
    m.setup_manager()
    client = TestClient(m.dapp)
    return client


@pytest.fixture()
def rives_antcopter_replay1_payload() -> bytes:

    model = Replay(
        cartridge_id    = bytes.fromhex(ANTCOPTER_ID),
        outcard_hash    = bytes.fromhex(ANTCOPTER_OUTHASH1[2:]),
        args            = '',
        in_card         = b'',
        log             = bytes.fromhex(ANTCOPTER_LOG1[2:]),
        user_alias      = ''
    )

    return encode_model(model, packed=False)


def test_should_send_replay(
        dapp_client: TestClient,
        rives_antcopter_replay1_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="app.replay",
        argument_types=get_abi_types_from_model(Replay)
    ).to_bytes()

    hex_payload = '0x' + (header + rives_antcopter_replay1_payload).hex()
    print("test_should_send_replay payload")
    print(hex_payload)
    dapp_client.send_advance(hex_payload=hex_payload)

    assert dapp_client.rollup.status

    # 1 replay and 2 screenshots
    assert len(dapp_client.rollup.reports) == 3 

    # 2 achievements events
    assert len(dapp_client.rollup.notices) == 2

    achievement_acquired = decode_to_model(model=AcquiredAchievement,data=bytes.fromhex(dapp_client.rollup.notices[0]['data']['payload'][2:]))
    print(achievement_acquired)
    assert achievement_acquired.frame==1242
    assert achievement_acquired.achievement_id==b'\x17}]n\xca\xcd\x99\xf7t!Ygz,\x82P\x01\x97h\xfeX\xff\xc7\x0e\x16\xe0\xf9\x95\xf3\xdc\xa4\xab'
    
@pytest.mark.order(after="test_should_send_replay")
def test_should_reject_replay1_after_first(
        dapp_client: TestClient,
        rives_antcopter_replay1_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="app.replay",
        argument_types=get_abi_types_from_model(Replay)
    ).to_bytes()

    hex_payload = '0x' + (header + rives_antcopter_replay1_payload).hex()
    dapp_client.send_advance(hex_payload=hex_payload)

    assert not dapp_client.rollup.status

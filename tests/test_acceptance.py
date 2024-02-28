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

from achievements.achievement import ReplayAchievements, CreateAchievementsPayload, AcquiredAchievement, AchievementsOutput, AchievementInfo
from achievements.gameplay import GameplaysOutput
from achievements.moment import CollectMomentPayload

import logging
logger = logging.getLogger(__name__)


# setup tests variables

with open('misc/antcopter.sqfs', 'rb') as fin:
    cartridge_data = fin.read()


with open('misc/achievement-icon.jpeg', 'rb') as fin:
    icon = fin.read()

ANTCOPTER_ID = generate_cartridge_id(cartridge_data)

# finished level 5
ANTCOPTER_LOG1 = '0x010108039e00000036000000ca000000848382558c3d4fc3301884efce766ce7ab711aa0244869279090808101a91348203a74ee5febcfede00cedabf7eea493ee01080004410802014280ae1a4200240824980d527e929496092840b7a97c0b592021619104490000653898f924108e7ef7f8a6e836f49a68b5b6951a377255bf8499f7ecedce14f654fde8299ed98607fdbad67e777fa1351f73bc6b0e5dd7aecb72fbb9924c3286496492512235d0f1b54f7dace3f06fbe58ef9f19436db62c38aad23eb9b19c7b3fbd4f9b7088c5d055dedb21946a18dc05'
ANTCOPTER_OUTHASH1 = '0x1874d72ed2cfef8f1925fafe183f29b60eeb5d380f8b13aa1f3550852668f8da'

# died on level 2 without berries
ANTCOPTER_LOG2 = '0x01010c034200000022000000360200008483824dc9318ac2501806c0f9fe647d59f25c5790208a0822f61ec2c64b7b350b1b61ba812489c88710514a95aa7c57a250f549c5eca1d9daf8d3ac95b56665b2185dc4228e4627e5aafc1b9cc5cbe0a674dd5eb7f563673059d9991d348b8d2eba72f6abcc8e06cd683179ba4f6f'
ANTCOPTER_OUTHASH2 = '0x1afcab8891cb41213c768e0fd1c1089826a4b508a64e84985cfcaf99867c0018'

OUTHASH_BLANK = '0x' + '0'*64

ICON = icon

NEW_ACHIEVEMT_NAME = 'First Steps'
CREATED_ACHIEVEMENT_ID = None

SECOND_USER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
CREATED_GAMEPLAY_ID = None

USER_ACHIEVEMENT_ID = None

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
def rives_antcopter_replay1_payload_wrong_outhash() -> bytes:

    model = Replay(
        cartridge_id    = bytes.fromhex(ANTCOPTER_ID),
        outcard_hash    = bytes.fromhex('faca'*16),
        args            = '',
        in_card         = b'',
        log             = bytes.fromhex(ANTCOPTER_LOG1[2:]),
        user_alias      = ''
    )

    return encode_model(model, packed=False)

def test_should_send_replay_wrong_outhash(
        dapp_client: TestClient,
        rives_antcopter_replay1_payload_wrong_outhash: bytes):

    header = ABIFunctionSelectorHeader(
        function="app.replay",
        argument_types=get_abi_types_from_model(Replay)
    ).to_bytes()

    hex_payload = '0x' + (header + rives_antcopter_replay1_payload_wrong_outhash).hex()
    dapp_client.send_advance(hex_payload=hex_payload)

    assert not dapp_client.rollup.status


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

@pytest.mark.order(after="test_should_send_replay_wrong_outhash")
def test_should_send_replay(
        dapp_client: TestClient,
        rives_antcopter_replay1_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="app.replay",
        argument_types=get_abi_types_from_model(Replay)
    ).to_bytes()

    last_reports_len = len(dapp_client.rollup.reports)
    last_notices_len = len(dapp_client.rollup.notices)
    hex_payload = '0x' + (header + rives_antcopter_replay1_payload).hex()
    dapp_client.send_advance(hex_payload=hex_payload)

    assert dapp_client.rollup.status

    # 1 replay and 2 screenshots
    assert len(dapp_client.rollup.reports) - last_reports_len == 3

    # 2 achievements events
    assert len(dapp_client.rollup.notices) - last_notices_len == 2

    achievement_acquired = decode_to_model(model=AcquiredAchievement,data=bytes.fromhex(dapp_client.rollup.notices[0]['data']['payload'][2:]))
    
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


@pytest.fixture()
def create_achievement_replay2_payload() -> bytes:

    model = CreateAchievementsPayload(
        cartridge_id    = bytes.fromhex(ANTCOPTER_ID),
        outcard_hash    = bytes.fromhex(OUTHASH_BLANK[2:]),
        args            = '',
        in_card         = b'',
        log             = bytes.fromhex(ANTCOPTER_LOG2[2:]),
        name            = NEW_ACHIEVEMT_NAME,
        description     = 'Complete Level 1',
        expression      = 'level > 1',
        icon            = ICON
    )

    return encode_model(model, packed=False)

@pytest.mark.order(after="test_should_send_replay")
def test_should_create_achievement(
        dapp_client: TestClient,
        create_achievement_replay2_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="achievements.create_achievement",
        argument_types=get_abi_types_from_model(CreateAchievementsPayload)
    ).to_bytes()

    hex_payload = '0x' + (header + create_achievement_replay2_payload).hex()
    dapp_client.send_advance(hex_payload=hex_payload,msg_sender=SECOND_USER)

    assert dapp_client.rollup.status


@pytest.mark.order(after="test_should_create_achievement")
def test_should_retrieve_new_achievement(dapp_client: TestClient):

    achievement_partial_name = NEW_ACHIEVEMT_NAME.lower()[:5]
    path = f'achievements/achievements?name={achievement_partial_name}'
    inspect_payload = '0x' + path.encode('ascii').hex()
    dapp_client.send_inspect(hex_payload=inspect_payload)

    assert dapp_client.rollup.status

    report = dapp_client.rollup.reports[-1]['data']['payload']
    report = bytes.fromhex(report[2:])
    report = json.loads(report.decode('utf-8'))
    assert isinstance(report, dict)

    output = AchievementsOutput.parse_obj(report)

    assert output.total == 1
    
    global CREATED_ACHIEVEMENT_ID
    CREATED_ACHIEVEMENT_ID = output.data[0].id


@pytest.fixture()
def achievement_antcopter_replay1_payload() -> bytes:
    model = ReplayAchievements(
        cartridge_id    = bytes.fromhex(ANTCOPTER_ID),
        outcard_hash    = bytes.fromhex(OUTHASH_BLANK[2:]),
        args            = '',
        in_card         = b'',
        log             = bytes.fromhex(ANTCOPTER_LOG1[2:]),
        achievements    = [bytes.fromhex(CREATED_ACHIEVEMENT_ID)]
    )

    return encode_model(model, packed=False)

@pytest.mark.order(after="test_should_retrieve_new_achievement")
def test_should_revalidate_replay1(
        dapp_client: TestClient,
        achievement_antcopter_replay1_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="achievements.achievements_replay",
        argument_types=get_abi_types_from_model(ReplayAchievements)
    ).to_bytes()

    last_notices_len = len(dapp_client.rollup.notices)
    hex_payload = '0x' + (header + achievement_antcopter_replay1_payload).hex()
    dapp_client.send_advance(hex_payload=hex_payload)

    assert dapp_client.rollup.status

    assert len(dapp_client.rollup.notices) - last_notices_len == 1


@pytest.mark.order(after="test_should_create_achievement")
def test_should_retrieve_new_gameplay(dapp_client: TestClient):

    path = f'achievements/gameplays?user_address={SECOND_USER}'
    inspect_payload = '0x' + path.encode('ascii').hex()
    dapp_client.send_inspect(hex_payload=inspect_payload)

    assert dapp_client.rollup.status

    report = dapp_client.rollup.reports[-1]['data']['payload']
    report = bytes.fromhex(report[2:])
    report = json.loads(report.decode('utf-8'))
    assert isinstance(report, dict)

    output = GameplaysOutput.parse_obj(report)

    assert output.total == 1
    
    global CREATED_GAMEPLAY_ID
    CREATED_GAMEPLAY_ID = output.data[0].id


@pytest.mark.order(after="test_should_retrieve_new_achievement")
def test_should_retrieve_new_achievement_info(dapp_client: TestClient):

    path = f'achievements/achievement_info?id={CREATED_ACHIEVEMENT_ID}'
    inspect_payload = '0x' + path.encode('ascii').hex()
    dapp_client.send_inspect(hex_payload=inspect_payload)

    assert dapp_client.rollup.status

    report = dapp_client.rollup.reports[-1]['data']['payload']
    report = bytes.fromhex(report[2:])
    report = json.loads(report.decode('utf-8'))
    assert isinstance(report, dict)

    output = AchievementInfo.parse_obj(report)

    assert len(output.users) > 0
    
    global USER_ACHIEVEMENT_ID
    USER_ACHIEVEMENT_ID = output.users[0].id


@pytest.fixture()
def create_moment_replay2_payload() -> bytes:

    # No special frame
    model = CollectMomentPayload(
        cartridge_id    = bytes.fromhex(ANTCOPTER_ID),
        outcard_hash    = bytes.fromhex(OUTHASH_BLANK[2:]),
        args            = '',
        in_card         = b'',
        log             = bytes.fromhex(ANTCOPTER_LOG2[2:]),
        gameplay_id     = bytes.fromhex(CREATED_GAMEPLAY_ID),
        frame           = 0,
        user_achievement= 0
    )

    return encode_model(model, packed=False)

@pytest.mark.order(after="test_should_create_achievement")
def test_create_moment_on_replay2(
        dapp_client: TestClient,
        create_moment_replay2_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="achievements.collect_moment",
        argument_types=get_abi_types_from_model(CollectMomentPayload)
    ).to_bytes()

    last_notices_len = len(dapp_client.rollup.notices)
    hex_payload = '0x' + (header + create_moment_replay2_payload).hex()
    dapp_client.send_advance(hex_payload=hex_payload)

    assert dapp_client.rollup.status

    assert len(dapp_client.rollup.notices) - last_notices_len == 1


@pytest.fixture()
def create_moment_frame_replay2_payload() -> bytes:

    # special frame
    model = CollectMomentPayload(
        cartridge_id    = bytes.fromhex(ANTCOPTER_ID),
        outcard_hash    = bytes.fromhex(OUTHASH_BLANK[2:]),
        args            = '',
        in_card         = b'',
        log             = bytes.fromhex(ANTCOPTER_LOG2[2:]),
        gameplay_id     = bytes.fromhex(CREATED_GAMEPLAY_ID),
        frame           = 200,
        user_achievement= 0
    )

    return encode_model(model, packed=False)

@pytest.mark.order(after="test_should_create_achievement")
def test_create_moment_on_replay2(
        dapp_client: TestClient,
        create_moment_frame_replay2_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="achievements.collect_moment",
        argument_types=get_abi_types_from_model(CollectMomentPayload)
    ).to_bytes()

    last_notices_len = len(dapp_client.rollup.notices)
    hex_payload = '0x' + (header + create_moment_frame_replay2_payload).hex()
    dapp_client.send_advance(hex_payload=hex_payload)

    assert dapp_client.rollup.status

    assert len(dapp_client.rollup.notices) - last_notices_len == 1


@pytest.fixture()
def create_moment_achievement_replay2_payload() -> bytes:

    # special frame
    model = CollectMomentPayload(
        cartridge_id    = bytes.fromhex(ANTCOPTER_ID),
        outcard_hash    = bytes.fromhex(OUTHASH_BLANK[2:]),
        args            = '',
        in_card         = b'',
        log             = bytes.fromhex(ANTCOPTER_LOG2[2:]),
        gameplay_id     = bytes.fromhex(CREATED_GAMEPLAY_ID),
        frame           = 0,
        user_achievement= USER_ACHIEVEMENT_ID
    )

    return encode_model(model, packed=False)

@pytest.mark.order(after="test_should_create_achievement")
def test_create_moment_on_replay2(
        dapp_client: TestClient,
        create_moment_achievement_replay2_payload: bytes):

    header = ABIFunctionSelectorHeader(
        function="achievements.collect_moment",
        argument_types=get_abi_types_from_model(CollectMomentPayload)
    ).to_bytes()

    last_notices_len = len(dapp_client.rollup.notices)
    hex_payload = '0x' + (header + create_moment_achievement_replay2_payload).hex()
    dapp_client.send_advance(hex_payload=hex_payload)

    assert dapp_client.rollup.status

    assert len(dapp_client.rollup.notices) - last_notices_len == 1

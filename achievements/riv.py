import subprocess
import os
from pathlib import Path
import tempfile

from app.settings import AppSettings
from app.riv import STORAGE_PATH

def replay_hist(cartridge_id,log,riv_args,in_card):
    if AppSettings.rivemu_path is None: # use riv os
        replay_path = "/run/replaylog"
        # outcard_path = "/run/outcard"
        incard_path = "/run/incard"
        outhash_path = "/run/outhash"
        # screenshot_path = "/run/screenshot"
        outhist_path = "/run/outhist"
        
        replay_file = open(replay_path,'wb')
        replay_file.write(log)
        replay_file.close()

        if os.path.exists(outhist_path): os.remove(outhist_path)
        if os.path.exists(outhash_path): os.remove(outhash_path)
        # if os.path.exists(screenshot_path): os.remove(screenshot_path)

        if in_card is not None and len(in_card) > 0:
            incard_file = open(incard_path,'wb')
            incard_file.write(in_card)
            incard_file.close()

        run_args = []
        run_args.append("riv-chroot")
        run_args.append("/rivos")
        run_args.extend(["--setenv", "RIV_CARTRIDGE", f"/{AppSettings.cartridges_path}/{cartridge_id}"])
        run_args.extend(["--setenv", "RIV_REPLAYLOG", replay_path])
        # run_args.extend(["--setenv", "RIV_OUTCARD", outcard_path])
        run_args.extend(["--setenv", "RIV_OUTHIST", outhist_path])
        run_args.extend(["--setenv", "RIV_OUTHASH", outhash_path])
        # run_args.extend(["--setenv", "RIV_SAVE_SCREENSHOT", screenshot_path])
        if in_card is not None and len(in_card) > 0:
            run_args.extend(["--setenv", "RIV_INCARD", incard_path])
        run_args.extend(["--setenv", "RIV_NO_YIELD", "y"])
        run_args.append("riv-run")
        if riv_args is not None and len(riv_args) > 0:
            run_args.extend(riv_args.split())
        result = subprocess.run(run_args)
        if result.returncode != 0:
            raise Exception(f"Error processing replay: {str(result.stderr)}")

        # outcard_raw = open(outcard_path, 'rb').read()
        # os.remove(outcard_path)

        outhash = bytes.fromhex(open(outhash_path, 'r').read())
        os.remove(outhash_path)

        # screenshot = open(screenshot_path,'rb').read()
        # os.remove(screenshot_path)

        outhist_raw = open(outhist_path, 'rb').read()
        os.remove(outhist_path)

        return outhist_raw, outhash

    # use rivemu
    replay_temp = tempfile.NamedTemporaryFile()
    replay_file = replay_temp.file
    incard_temp = tempfile.NamedTemporaryFile()
    incard_file = incard_temp.file
    # outcard_temp = tempfile.NamedTemporaryFile()
    outhist_temp = tempfile.NamedTemporaryFile()
    outhash_temp = tempfile.NamedTemporaryFile(mode='w+')
    # screenshot_temp = tempfile.NamedTemporaryFile()

    replay_file.write(log)
    replay_file.flush()
    
    if in_card is not None and len(in_card) > 0:
        incard_file.write(in_card)
        incard_file.flush()

    incard_path = len(in_card) > 0 and incard_temp.name or None

    absolute_cartridge_path = os.path.abspath(f"{AppSettings.cartridges_path}/{cartridge_id}")
    cwd = str(Path(AppSettings.rivemu_path).parent.parent.absolute())
    run_args = []
    run_args.append(AppSettings.rivemu_path)
    run_args.append(f"-cartridge={absolute_cartridge_path}")
    run_args.append(f"-verify={replay_temp.name}")
    # run_args.append(f"-save-outcard={outcard_temp.name}")
    run_args.append(f"-save-outhash={outhash_temp.name}")
    run_args.append(f"-save-outhist={outhist_temp.name}")
    run_args.append(f"-speed=1000000")
    # run_args.append(f"-save-screenshot={screenshot_temp.name}")
    if in_card is not None and len(in_card):
        run_args.append(f"-load-incard={incard_temp.name}")
    if riv_args is not None and len(riv_args) > 0:
        run_args.extend(riv_args.split())

    result = subprocess.run(run_args, cwd=cwd)
    if result.returncode != 0:
        raise Exception(f"Error processing replay: {str(result.stderr)}")

    # outcard_raw = outcard_temp.file.read()
    outhash = bytes.fromhex(outhash_temp.file.read())
    # screenshot = screenshot_temp.file.read()
    outhist_raw = outhist_temp.file.read()

    replay_temp.close()
    # outcard_temp.close()
    incard_temp.close()
    outhash_temp.close()
    outhist_temp.close()
    # screenshot_temp.close()

    return outhist_raw, outhash

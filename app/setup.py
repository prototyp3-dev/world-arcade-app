import os
from cartesapp.setup import setup
from .settings import AppSettings

@setup()
def setup_rivemu():
    AppSettings.rivemu_path = os.getenv('RIVEMU_PATH')


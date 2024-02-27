
# Cartesapp Framework settings

# Files with definitions to import
FILES = ['achievement','gameplay'] # * Required

# Index outputs in inspect indexer queries
INDEX_OUTPUTS = False # Defaul: False

# Enable endpoint to get address from Dapp relay contract
ENABLE_DAPP_RELAY = True # Defaul: False

# Enable endpoint to accept portal deposits and also add withdraw and transfer endpoints
ENABLE_WALLET = True # Defaul: False (required to set ENABLE_DAPP_RELAY)

# Path dir to database
STORAGE_PATH = None # Defaul: False

# List of endpoints to disable (useful for cascading)
DISABLED_ENDPOINTS = ['app.create_scoreboard',"app.clean_scoreboards","app.scoreboard_replay","app.scoreboards","app.scores","app.replay"] # Defaul: []

# List of modules to disable outputs  (useful for cascading)
DISABLED_MODULE_OUTPUTS = ['app'] # Defaul: []

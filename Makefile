# Makefile

# Include deploy parameters from ENV file
include ENV

# Define variables
OUTPUT_DIR=./dist
TAR_FILE=o1v96-mixer.tar.gz
REMOTE_DIR=~/projects/o1v96-mixer
DIST_FILE=$(OUTPUT_DIR)/$(TAR_FILE)

# Default target
all: package deploy

# Package the output files
package:
	@echo "Packaging files..."
	tar --disable-copyfile -czv --no-xattrs \
	--exclude node_modules --exclude dist --exclude '.DS_Store' \
	-f $(DIST_FILE) * 

# Deploy the package to the remote server
deploy: package
	@echo "Creating directory on remote server..."
	ssh $(SSH_USER)@$(SSH_HOST) "mkdir -p $(REMOTE_DIR)"
	@echo "Deploying to $(SSH_HOST)..."
	scp $(DIST_FILE) $(SSH_USER)@$(SSH_HOST):$(REMOTE_DIR)

.PHONY: package deploy

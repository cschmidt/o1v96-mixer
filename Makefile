# Makefile

# Include deploy parameters from ENV file
include ENV

# Define variables
PACKAGE_NAME=o1v96-mixer
OUTPUT_DIR=./dist
TAR_FILE=$(PACKAGE_NAME).tar.gz
REMOTE_DIR=~/projects/o1v96-mixer



# Default target
all: build package


build:
	rm -rf $(OUTPUT_DIR)
	mkdir -p $(OUTPUT_DIR)/node_modules
	npm install
	npm run build-client 
	npm run build-server

# Package the output files
package: build
	@echo "Packaging files..."
	rm -f $(OUTPUT_DIR)/$(TAR_FILE)
	tar --disable-copyfile -cz --no-xattrs \
	--exclude node_modules --exclude '.DS_Store' \
	-f $(OUTPUT_DIR)/$(TAR_FILE) dist/*

# Deploy the package to the remote server
deploy: package
	@echo "Creating directory on remote server..."
	ssh $(SSH_USER)@$(SSH_HOST) "mkdir -p $(REMOTE_DIR)"
	@echo "Deploying to $(SSH_HOST)..."
	scp $(OUTPUT_DIR)/$(TAR_FILE) $(SSH_USER)@$(SSH_HOST):$(REMOTE_DIR)

run: build
	node $(OUTPUT_DIR)/server.js

.PHONY: build package deploy run

export
OUTPUT_DIR = dist

.PHONY: build-src
build-src:
	npm run build

.PHONY: build-public-files
build-public-files:
	cp -r public/* ${OUTPUT_DIR}/

.DEFAULT_GOAL := default
.PHONY: default
default: build-src build-public-files

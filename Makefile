RAW_VERSION?=$(shell node scripts/get-version.js)
FULL_VERSION=v$(RAW_VERSION)

build:
	rm -rf dist
	yarn build

upload-for-analytics:
	# make sure sentry can retrieve current commit on remote
	git push --tags
	yarn sentry-cli releases new "$(FULL_VERSION)"
	yarn sentry-cli releases set-commits "$(FULL_VERSION)" --auto
	yarn sentry-cli releases files "$(FULL_VERSION)" upload-sourcemaps dist --no-rewrite
	yarn sentry-cli releases finalize "$(FULL_VERSION)"

compress:
	rm -f dist/Gitako.zip
	cd dist && zip -r Gitako.zip * -x *.map -x *.DS_Store

rename-compressed:
	cd dist && mv Gitako.zip Gitako-$(FULL_VERSION).zip

release:
	$(MAKE) build
	$(MAKE) upload-for-analytics
	$(MAKE) compress
	$(MAKE) rename-compressed
	$(MAKE) compress-source

compress-source:
	git archive -o dist/source-$(FULL_VERSION).zip HEAD

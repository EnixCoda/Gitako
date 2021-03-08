RAW_VERSION?=$(shell node scripts/get-version.js)
FULL_VERSION=v$(RAW_VERSION)

pull-icons:
	git clone git@github.com:vscode-icons/vscode-icons.git vscode-icons --depth=1

build:
	rm -rf dist
	yarn build

safari:
	rm -rf Safari/Gitako/Gitako\ Extension/Resources/*
	cd dist && cp -r . ../Safari/Gitako/Gitako\ Extension/Resources

test:
	yarn test

upload-for-analytics:
	# make sure sentry can retrieve current commit on remote, push both branch and tag
	git push
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
	$(MAKE) test
	$(MAKE) upload-for-analytics
	$(MAKE) compress
	$(MAKE) rename-compressed
	$(MAKE) compress-source
	$(MAKE) compress-env
	$(MAKE) compress-icons-into-source-for-mz-review

compress-source:
	git archive -o dist/source-$(FULL_VERSION).zip HEAD

compress-env:
	zip dist/source-$(FULL_VERSION).zip .env

compress-icons-into-source-for-mz-review:
	zip -r dist/source-$(FULL_VERSION).zip vscode-icons/icons

.PHONY: safari

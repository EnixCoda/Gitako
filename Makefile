build:
	rm -rf dist
	yarn build

upload-for-analytics:
	VERSION=v$(node scripts/get-version.js)
	# make sure sentry can retrieve current commit on remote
	git push --tags
	yarn sentry-cli releases new "$(VERSION)"
	yarn sentry-cli releases set-commits "$(VERSION)" --auto
	yarn sentry-cli releases files "$(VERSION)" upload-sourcemaps dist --no-rewrite
	yarn sentry-cli releases finalize "$(VERSION)"

compress:
	rm -f dist/gitako.zip
	cd dist && zip -r gitako.zip * -x *.map

release:
	$(MAKE) build
	$(MAKE) upload-for-analytics
	$(MAKE) compress

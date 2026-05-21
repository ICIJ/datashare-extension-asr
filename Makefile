VERSION = $(shell cat pom.xml | grep '<version>[0-9.]\+' | cut -d ' ' -f 5 | sed 's/<version>\([0-9.]\+\)<\/version>/\1/g' | tr -d '[:space:]')
ASR_WORKER_VERSION = $(shell mvn help:evaluate -Dexpression=asr-worker.version -q -DforceStdout)

clean:
	mvn clean

download-models:
	mkdir -p src/main/resources
	curl -fsSL "https://github.com/ICIJ/datashare-python/releases/download/asr-worker-$(ASR_WORKER_VERSION)/available-models.json" \
		-o src/main/resources/available-models.json

.PHONY: dist
dist: download-models
	mvn validate package -Dmaven.test.skip=true

install:
	mvn install

release:
	mvn versions:set -DnewVersion=${NEW_VERSION}
	git commit -am "[release] ${NEW_VERSION}"
	git tag ${NEW_VERSION}
	echo "If everything is OK, you can push with tags i.e. git push origin main --tags"

unit:
	mvn test


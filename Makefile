ESLINT_FILES = $(shell ls -S `find . -type f -not -path "*/node_modules/*" -not -path "./dist/*" -name "*.[js][jsx]"`)
TEST = $(shell ls -S `find test -type f -name "*.test.js"`)

install:
	@tnpm install

eslint:
	@echo 'eslint doing...'
	@if [ ! -f "./node_modules/.bin/eslint" ]; then \
    npm install eslint eslint-config-aliyun eslint-plugin-react --registry=https://registry.npm.taobao.org; \
  fi
	@./node_modules/.bin/eslint ${ESLINT_FILES}
	@echo 'eslint done!'

build: eslint
	@echo 'eslint building...'
	@if [ ! -f "./node_modules/.bin/honeypack" ]; then \
    npm install honeypack --registry=http://registry.npm.alibaba-inc.com; \
    npm install damo-cli-docco-plugin --registry=http://registry.npm.alibaba-inc.com; \
  fi
	@./node_modules/.bin/honeypack build -c webpack.build.js
	@echo 'eslint build done!'

auto_test: build
	@echo 'to do...'

publish:
	@$(eval VERSION=`node -e 'console.log(require("./package.json").version)'`)
	@$(eval TAG='publish/'${VERSION})
	@git tag ${TAG}
	git push origin ${TAG}
	npm publish --registry=http://registry.npmjs.org

test:
	@npm test

.PHONY: test

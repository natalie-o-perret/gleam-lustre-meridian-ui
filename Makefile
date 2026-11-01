.PHONY: check format-check browser-check site-check

check: format-check
	gleam format --check src test examples/catalogue/src
	npm run check:icons
	gleam check
	gleam test
	node --test test/*_test.mjs
	npm run check:engines
	$(MAKE) site-check

format-check:
	npm exec --yes --package=prettier@3.9.10 -- prettier --check --ignore-path .gitignore --ignore-path .prettierignore .

browser-check:
	gleam test
	npm run test:browser
	npm run build:site
	npm run test:site:browser

site-check:
	npm run build:site
	npm run test:site

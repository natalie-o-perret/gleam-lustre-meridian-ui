.PHONY: check format-check browser-check

check: format-check
	gleam format --check src test
	gleam check
	gleam test
	node --test test/*_test.mjs
	npm run check:engines

format-check:
	npm exec --yes --package=prettier@3.9.10 -- prettier --check --ignore-path .gitignore --ignore-path .prettierignore .

browser-check:
	gleam test
	npm run test:browser

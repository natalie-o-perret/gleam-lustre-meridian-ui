.PHONY: check format-check

check: format-check
	gleam format --check src test
	gleam check
	gleam test
	node --test test/*_test.mjs

format-check:
	npm exec --yes --package=prettier@3.9.10 -- prettier --check --ignore-path .gitignore .

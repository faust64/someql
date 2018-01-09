MYSQL_ADMPASS :=
MYSQL_ADMUSER := root
MYSQL_DATABASE := circle_test
MYSQL_HOST := localhost
MYSQL_PASSWORD := test
MYSQL_USER := ubuntu
POSTGRES_ADMUSER := postgres
POSTGRES_DATABASE := circle_test
POSTGRES_PASSWORD := test
POSTGRES_USER := ubuntu

check-test:
	@@if ! test -x ./node_modules/.bin/mocha; then \
	    NODE_ENV=dev npm install; \
	    if ! test -x ./node_modules/.bin/mocha; then \
		echo ERROR: mocha missing >&2; \
		exit 1; \
	    fi; \
	fi

clean-common:
	@@if test -s .gitignore; then \
	    while read pattern; \
		do \
		    if test "$$pattern" = / -o "$$pattern" = '*' -o "$$pattern" = '/*'; then \
			echo "WARNING: suspicous-looking gitignore entry - skipping $$pattern" >&2; \
		    elif echo "$$pattern" | grep '^/' >/dev/null; then \
			rm -fr ".$$pattern"; \
		    else \
			rm -fr "$$pattern"; \
		    fi; \
		done <.gitignore; \
	    echo "NOTICE: done dropping items matching gitignore entries"; \
	fi

clean-npm:
	@@if test -s .npmignore; then \
	    while read pattern; \
		do \
		    if test "$$pattern" = / -o "$$pattern" = '*' -o "$$pattern" = '/*'; then \
			echo "WARNING: suspicous-looking npmignore entry - skipping $$pattern" >&2; \
		    elif echo "$$pattern" | grep '^/' >/dev/null; then \
			rm -fr ".$$pattern"; \
		    else \
			rm -fr "$$pattern"; \
		    fi; \
		done <.npmignore; \
	    echo "NOTICE: done dropping items matching npmignore entries"; \
	fi

prep-test-mysql:
	@@if test -z "$$TEST_MYSQL"; then \
	    return 0; \
	fi; \
	if test "$(MYSQL_ADMPASS)" = ""; then \
	    if ! echo "SHOW TABLES" | mysql "-u$(MYSQL_ADMUSER)" "-h$(MYSQL_HOST)" mysql >/dev/null 2>&1; then \
		echo "ERROR: failed connecting to MySQL!" >&2; \
		exit 1; \
	    fi; \
	elif ! echo "SHOW TABLES" | mysql "-u$(MYSQL_ADMUSER)" "-p$(MYSQL_ADMPASS)" "-h$(MYSQL_HOST)" mysql >/dev/null 2>&1; then \
	    echo "ERROR: failed connecting to MySQL!" >&2; \
	    exit 1; \
	fi; \
	if test "$$CIRCLECI" -o "$$CI"; then \
	    if test "$(MYSQL_ADMPASS)" = ""; then \
		echo "SET PASSWORD for '$(MYSQL_USER)'@'$(MYSQL_HOST)' = PASSWORD('$(MYSQL_PASSWORD)') ; FLUSH PRIVILEGES" | mysql "-u$(MYSQL_ADMUSER)" "-h$(MYSQL_HOST)"; \
	    else \
		echo "SET PASSWORD for '$(MYSQL_USER)'@'$(MYSQL_HOST)' = PASSWORD('$(MYSQL_PASSWORD)') ; FLUSH PRIVILEGES" | mysql "-u$(MYSQL_ADMUSER)" "-p$(MYSQL_ADMPASS)" "-h$(MYSQL_HOST)"; \
	    fi; \
	    echo "NOTICE: initialized MySQL user $(MYSQL_USER) password on $(MYSQL_HOST)"; \
	fi; \
	if test "$(MYSQL_ADMPASS)" = ""; then \
	    if echo "SHOW TABLES" | mysql "-u$(MYSQL_ADMUSER)" "-h$(MYSQL_HOST)" "$(MYSQL_DATABASE)" >/dev/null 2>&1; then \
		echo "SHOW TABLES" | mysql "-u$(MYSQL_ADMUSER)" "-h$(MYSQL_HOST)" "$(MYSQL_DATABASE)" 2>/dev/null | while read _table; \
		    do \
			echo "DROP TABLE $$_table;" | mysql "-u$(MYSQL_ADMUSER)" "-h$(MYSQL_HOST)" "$(MYSQL_DATABASE)" >/dev/null 2>&1; \
		    done; \
		echo "NOTICE: done dropping tables from $(MYSQL_DATABASE)@$(MYSQL_HOST)"; \
	    fi; \
	elif echo "SHOW TABLES" | mysql "-u$(MYSQL_ADMUSER)" "-p$(MYSQL_ADMPASS)" "-h$(MYSQL_HOST)" "$(MYSQL_DATABASE)" >/dev/null 2>&1; then \
	    echo "SHOW TABLES" | mysql "-u$(MYSQL_ADMUSER)" "-p$(MYSQL_ADMPASS)" "-h$(MYSQL_HOST)" "$(MYSQL_DATABASE)" 2>/dev/null | while read _table; \
		do \
		    echo "DROP TABLE $$_table CASCADE;" | mysql "-u$(MYSQL_ADMUSER)" "-p$(MYSQL_ADMPASS)" "-h$(MYSQL_HOST)" "$(MYSQL_DATABASE)" >/dev/null 2>&1; \
		done; \
	    echo "NOTICE: done dropping tables from mysql:$(MYSQL_DATABASE)@$(MYSQL_HOST)"; \
	fi

prep-test-postgres:
	@@if test -z "$$TEST_POSTGRES"; then \
	    return 0; \
	fi; \
	if ! sudo -su "$(POSTGRES_ADMUSER)" -- psql -c '\d' >/dev/null 2>&1; then \
	    echo "ERROR: failed connecting to PostgreSQL!" >&2; \
	    exit 1; \
	fi; \
	if test "$$CIRCLECI" -o "$$CI"; then \
	    if test "$(POSTGRES_PASSWORD)" = ""; then \
		sudo -su "$(POSTGRES_ADMUSER)" -- psql -c "ALTER USER $(POSTGRES_USER) WITH PASSWORD NULL"; \
	    else \
		sudo -su "$(POSTGRES_ADMUSER)" -- psql -c "ALTER USER $(POSTGRES_USER) WITH PASSWORD '$(POSTGRES_PASSWORD)'"; \
	    fi; \
	    echo "NOTICE: initialized PostgreSQL user $(POSTGRES_USER) password on localhost"; \
	fi; \
	if sudo -su "$(POSTGRES_ADMUSER)" -- psql -c '\d' "$(POSTGRES_DATABASE)" >/dev/null 2>&1; then \
	    sudo -su "$(POSTGRES_ADMUSER)" -- psql -c '\d' "$(POSTGRES_DATABASE)" 2>/dev/null | awk '/ table /{print $$3}' | while read _table; \
		do \
		    sudo -su "$(POSTGRES_ADMUSER)" -- psql -c "DROP TABLE $$_table CASCADE;" -d "$(POSTGRES_DATABASE)" >/dev/null; \
		done; \
	    echo "NOTICE: done dropping local tables from postgres:$(POSTGRES_DATABASE)"; \
	    cat db/init.psql db/update.*.psql 2>/dev/null | awk '/^[cC][rR][eE][aA][tT][eE][ \t][sS][eE][qQ]|eE][nN][cC][eE][ \t]/{print $$3}' | while read _seq; \
		do \
		    sudo -su "$(POSTGRES_ADMUSER)" -- psql -c "DROP SEQUENCE $$_seq;" -d "$(POSTGRES_DATABASE)" >/dev/null || continue; \
		done; \
	    echo "NOTICE: done dropping local sequences from postgres:$(POSTGRES_DATABASE)"; \
	fi

prep-test-sqlite:
	@@if test -z "$$TEST_SQLITE"; then \
	    return 0; \
	fi; \
	if test -s default.sqlite; then \
	    rm -f default.sqlite; \
	    echo "NOTICE: done dropping tables from sqlite:default.sqlite"; \
	fi

prep-test-cassandra:
	@@echo FIXME

prep-test: prep-test-mysql prep-test-postgres prep-test-sqlite

unit-test:
	for _t in tests/*.js; \
	    do \
		./node_modules/.bin/mocha --exit $$_t || exit 1; \
	    done

test: check-test prep-test unit-test clean-common

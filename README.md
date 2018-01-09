# SQL Abstraction Library

 * Last tests against master on CircleCI: [![CircleCI](https://circleci.com/gh/faust64/someql.svg?style=svg)](https://circleci.com/gh/faust64/someql)

 * Install with: `npm install someql`

 * Write backend-agnostic code:

```
// cassandra
const db = require'someql')({ driver: 'cassandra', database: 'tests', username: 'casuser', password: 'caspass', host: '3.4.5.6' });
// mysql
const db = require('someql')({ driver: 'mysql', database: 'tests', username: 'myuser', password: 'mypass', host: '2.3.4.5' });
// postgres
const db = require('someql')({ driver: 'postgres', database: 'tests', username: 'pguser', password: 'pgpass', host: '1.2.3.4', ssl: true });
// defaults to sqlite
const db = require('someql')({ database: './default.sqlite' });

db.read(`SELECT * from sometable`)
    .then((rsp) => {
	    if (rsp !== undefined && rsp[0] !== undefined) {
		for (let i = 0, i < rsp.length; i++) {
		    doSomethingWith(rsp[0]);
		}
		return db.write(`INSERT INTO othertable (name, otherfield) VALUES ('toto', false)`);
	    }
	})
    .then(() => whatver())
    .catch((e) => {
	    console.error('failed querying DB');
	    console.error(e);
	});
```

describe('test database connector', () => {
	if (process.env.TEST_SQLITE) {
	    it('sqlite read & write', (done) => {
		    let db = require('../index.js')({ driver: 'sqlite' });
		    db.write('CREATE TABLE unittest (id INTEGER, value TEXT)')
			.then(() => db.write(`INSERT INTO unittest VALUES (1, 'toto')`))
			.then(() => db.read('SELECT * FROM unittest'))
			.then((rslt) => {
				if (rslt.length !== 1) {
				    throw new Error(`sqlite returned ${rslt.length} instead of our single test record`);
				} else if (rslt[0].id !== 1 || rslt[0].value !== 'toto') {
				    throw new Error(`sqlite returned inconsistent record back from our test table`);
				}
				return db.write('DROP TABLE unittest');
			    })
			.then(() => done())
			.catch((e) => done(e))
		});
	}
	if (process.env.TEST_MYSQL) {
	    it('mysql read & write', (done) => {
		    let db = require('../index.js')({ driver: 'mysql' });
		    db.write('CREATE TABLE unittest (id INTEGER, value VARCHAR(32))')
			.then(() => db.write(`INSERT INTO unittest VALUES (1, 'toto')`))
			.then(() => db.read('SELECT * FROM unittest'))
			.then((rslt) => {
				if (rslt.length !== 1) {
				    throw new Error(`mysql returned ${rslt.length} instead of our single test record`);
				} else if (rslt[0].id !== 1 || rslt[0].value !== 'toto') {
				    throw new Error(`mysql returned inconsistent record back from our test table`);
				}
				return db.write('DROP TABLE unittest');
			    })
			.then(() => done())
			.catch((e) => done(e))
		});
	}
	if (process.env.TEST_POSTGRES) {
	    it('postgres read & write', (done) => {
		    let db = require('../index.js')({ driver: 'postgres' });
		    db.write('CREATE TABLE unittest (id INT, value VARCHAR(32))')
			.then(() => db.write(`INSERT INTO unittest VALUES (1, 'toto')`))
			.then(() => db.read('SELECT * FROM unittest'))
			.then((rslt) => {
				if (rslt.length !== 1) {
				    throw new Error(`postgres returned ${rslt.length} instead of our single test record`);
				} else if (rslt[0].id !== 1 || rslt[0].value !== 'toto') {
				    throw new Error(`postgres returned inconsistent record back from our test table`);
				}
				return db.write('DROP TABLE unittest');
			    })
			.then(() => done())
			.catch((e) => done(e))
		});
	}
	if (process.env.TEST_CASSANDRA) {
	    it('cassandra read & write', (done) => {
		    let db = require('../index.js')({ driver: 'cassandra' });
		    db.write('CREATE TABLE unittest (id INT, value VARCHAR)')
			.then(() => db.write('INSERT INTO unittest VALUES (1, "toto")'))
			.then(() => db.read('SELECT * FROM unittest'))
			.then((rslt) => {
				if (rslt.length !== 1) {
				    throw new Error(`cassandra returned ${rslt.length} instead of our single test record`);
				} else if (rslt[0].id !== 1 || rslt[0].value !== 'toto') {
				    throw new Error(`cassandra returned inconsistent record back from our test table`);
				}
				return db.write('DROP TABLE unittest');
			    })
			.then(() => done())
			.catch((e) => done(e))
		});
	}
    });

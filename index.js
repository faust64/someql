const valid = [ 'cassandra', 'mysql', 'postgres', 'sqlite' ];

module.exports = (forceConnector) => {
	let driver = 'sqlite';
	if (forceConnector !== undefined) {
	    if (valid.indexOf(forceConnector) >= 0) { driver = forceConnector; }
	} else if (process.env.DB_CONNECTOR !== undefined) {
	    if (valid.indexOf(process.env.DB_CONNECTOR) >= 0) { driver = process.env.DB_CONNECTOR; }
	}
	if (driver === 'sqlite') {
	    const sqlite = require('./sqlite.js');
	    return sqlite();
	} else if (driver === 'cassandra') {
	    const cassandra = require('./cassandra.js');
	    return cassandra();
	} else if (driver === 'mysql') {
	    const mysql = require('./mysql.js');
	    return mysql();
	} else if (driver === 'postgres') {
	    const postgres = require('./postgres.js');
	    return postgres();
	}
	return new Error('unsupported DB driver ' + driver);
    };

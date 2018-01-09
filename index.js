const valid = [ 'cassandra', 'mysql', 'postgres', 'sqlite' ];

module.exports = (opts) => {
	let driver = 'sqlite';
	opts = opts || {};
	if (opts.driver !== undefined) {
	    if (valid.indexOf(opts.driver) >= 0) { driver = opts.driver; }
	} else if (process.env.DB_CONNECTOR !== undefined) {
	    if (valid.indexOf(process.env.DB_CONNECTOR) >= 0) { driver = process.env.DB_CONNECTOR; }
	}
	if (opts.paginationMin === undefined) { opts.paginationMin = process.env.PAGINATION_MIN || 100; }
	if (driver === 'sqlite') {
	    const sqlite = require('./sqlite.js');
	    if (opts.database === undefined) { opts.database = process.env.SQLITE_DBFILE || './default.sqlite'; }
	    return sqlite(opts);
	} else if (driver === 'cassandra') {
	    if (opts.host === undefined) { opts.host = process.env.CASSANDRA_HOST || [ '127.0.0.1' ]; }
	    if (typeof opts.host === 'string') { opts.host = opts.host.split(','); }
	    if (opts.database === undefined) { opts.database = process.env.CASSANDRA_KEYSPACE || 'sessions'; }
	    if (opts.readConsistency === undefined) { opts.readConsistency = process.env.CASSANDRA_READ_CONSISTENCY || 'one'; }
	    if (opts.writeConsistency === undefined) { opts.writeConsistency = process.env.CASSANDRA_WRITE_CONSISTENCY || 'one'; }
	    if (opts.username === undefined && process.env.CASSANDRA_USER !== undefined) { opts.username = process.env.CASSANDRA_USER; }
	    if (opts.password === undefined && process.env.CASSANDRA_PASSWORD !== undefined) { opts.password = process.env.CASSANDRA_PASSWORD; }
	    const cassandra = require('./cassandra.js');
	    return cassandra(opts);
	} else if (driver === 'mysql') {
	    const mysql = require('./mysql.js');
	    if (opts.database === undefined) { opts.database = process.env.MYSQL_DATABASE || 'sessions'; }
	    if (opts.maxConn === undefined) { opts.maxConn = process.env.MYSQL_MAX_CONN || 64; }
	    if (opts.host === undefined) { opts.host = process.env.MYSQL_HOST || '127.0.0.1'; }
	    if (opts.password === undefined && process.env.MYSQL_PASSWORD !== undefined) { opts.password = process.env.MYSQL_PASSWORD; }
	    if (opts.port === undefined) { opts.port = process.env.MYSQL_PORT || 3306; }
	    if (opts.username === undefined) { opts.username = process.env.MYSQL_USER || 'root'; }
	    return mysql(opts);
	} else if (driver === 'postgres') {
	    const postgres = require('./postgres.js');
	    if (opts.connTimeout === undefined) { opts.connTimeout = process.env.POSTGRES_CONN_TIMEOUT || 1000; }
	    if (opts.database === undefined) { opts.database = process.env.POSTGRES_DATABASE || 'sessions'; }
	    if (opts.maxConn === undefined) { opts.maxConn = process.env.POSTGRES_MAX_CONN || 64; }
	    if (opts.idleTimeout === undefined) { opts.idleTimeout = process.env.POSTGRES_IDLE_TIMEOUT || 1000; }
	    if (opts.host === undefined) { opts.host = process.env.POSTGRES_HOST || '127.0.0.1'; }
	    if (opts.password === undefined && process.env.POSTGRES_PASSWORD !== undefined) { opts.password = process.env.POSTGRES_PASSWORD; }
	    if (opts.port === undefined) { opts.port = process.env.POSTGRES_PORT || 5432; }
	    if (opts.username === undefined) { opts.username = process.env.POSTGRES_USER || 'postgres'; }
	    if (opts.ssl === undefined) { opts.ssl = (process.env.POSTGRES_SSL !== undefined && process.env.POSTGRES_SSL !== 'false'); }
	    return postgres(opts);
	}
	return new Error('unsupported DB driver ' + driver);
    };

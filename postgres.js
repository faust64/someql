const Promise = require('bluebird');
const logger = require('wraplog')('postgres-handler');

class Postgres {
    constructor(opts) {
	try {
	    const pool = require('pg-pool');
	    let popts = {
		    connectionTimeoutMillis: opts.connTimeout || 8000,
		    database: opts.database || 'template42',
		    host: opts.host || '127.0.0.1',
		    idleTimeoutMillis: opts.idleTimeout || 12000,
		    max: opts.maxConn || 256,
		    min: 32,
		    port: opts.port || 5432,
		    user: opts.username || 'postgres'
		};
	    if (opts.password !== undefined) { popts.password = opts.password; }
	    if (opts.ssl !== undefined) { popts.ssl = opts.ssl; }
	    this._db = new pool(popts);
	    this._opts = opts;
	} catch(e) {
	    logger.error(e);
	    process.exit(1);
	}
    }

    get handlers() {
	return {
		write: (qry) => {
			let self = this;
			return new Promise((resolve, reject) => {
				let cleanup = false;
				self._db.connect()
				    .then((socket) => {
					    cleanup = socket;
					    logger.debug(qry);
					    return socket.query(qry);
					})
				    .then(() => cleanup.release())
				    .then(() => resolve(true))
				    .catch((e) => {
					    if (cleanup !== false) { cleanup.release(); }
					    logger.error(e);
					    reject({ code: 500, msg: 'failed writing to database' });
					});
			    });
		    },
		read: (qry, limit, offset) => {
			let self = this;
			return new Promise((resolve, reject) => {
				let cleanup = false;
				self._db.connect()
				    .then((socket) => {
					    let mylimit = limit || self._opts.paginationMin || 100;
					    let myoffset = offset || 0;
					    if (qry.indexOf(' LIMIT ') < 0 && mylimit !== 'none') {
						qry += ` LIMIT ${mylimit} OFFSET ${myoffset}`;
					    }
					    cleanup = socket;
					    logger.info(qry);
					    return socket.query(qry);
					})
				    .then((resp) => {
					    cleanup.release();
					    if (resp.rows !== undefined && resp.rows.length >= 0) {
						resolve(resp.rows);
					    } else {
						logger.error('malformatted response object from db');
						logger.error(resp.rows);
						reject({ code: 500, msg: 'malformatted response object from db' });
					    }
					})
				    .catch((e) => {
					    if (cleanup !== false) { cleanup.release(); }
					    logger.error(e);
					    reject({ code: 500, msg: 'failed querying database' });
					});
			    });
		    },
		close: () => {
			let self = this;
			self._db.endAsync();
			self._db = undefined;
		    }
	    };
    }
}

module.exports = (opts) => new Postgres(opts).handlers;

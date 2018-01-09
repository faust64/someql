const Promise = require('bluebird');
const logger = require('wraplog')('postgres-handler');

module.exports = (opts) => {
	try {
	    const pool = require('pg-pool');
	    let popts = {
		    connectionTimeoutMillis: opts.connTimeout || 1000,
		    database: opts.database || 'template42',
		    host: opts.host || '127.0.0.1',
		    idleTimeoutMillis: opts.idleTimeout || 1000,
		    max: opts.maxConn || 64,
		    port: opts.port || 5432,
		    user: opts.username || 'postgres'
		};
	    if (opts.password !== undefined) { popts.password = opts.password; }
	    if (opts.ssl !== undefined) { popts.ssl = opts.ssl; }
	    this._db = new pool(popts);
	} catch(e) {
	    logger.error(e);
	    process.exit(1);
	}
	let self = this;

	return {
		write: (qry) => {
		    return new Promise((resolve, reject) => {
			    self._db.connect()
				.then((socket) => {
					logger.debug(qry);
					return socket.query(qry);
				    })
				.then(() => resolve(true))
				.catch((e) => {
					logger.error(e);
					reject({ code: 500, msg: 'failed writing to database' });
				    });
			});
		    },
		read: (qry, limit, offset) => {
		    return new Promise((resolve, reject) => {
			    self._db.connect()
				.then((socket) => {
					let mylimit = limit || process.env.PAGINATION_MIN || 100;
					let myoffset = offset || 0;
					if (qry.indexOf(' LIMIT ') < 0 && mylimit !== 'none') {
					    qry += ` LIMIT ${mylimit} OFFSET ${myoffset}`;
					}
					logger.debug(qry);
					return socket.query(qry);
				    })
				.then((resp) => {
					if (resp.rows !== undefined && resp.rows.length >= 0) {
					    resolve(resp.rows);
					} else {
					    logger.error('malformatted response object from db');
					    logger.error(resp.rows);
					    reject({ code: 500, msg: 'malformatted response object from db' });
					}
				    })
				.catch((e) => {
					logger.error(e);
					reject({ code: 500, msg: 'failed querying database' });
				    });
			});
		    },
		close: () => {
			self._db.endAsync();
			self._db = undefined;
		    }
	    };
    };

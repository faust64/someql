const Promise = require('bluebird');
const logger = require('logger')('postgres-handler');

module.exports = () => {
	try {
	    const pool = require('pg-pool');
	    let opts = {
		    connectionTimeoutMillis: process.env.POSTGRES_CONN_TIMEOUT || 1000,
		    database: process.env.POSTGRES_DATABASE || 'template42',
		    host: process.env.POSTGRES_HOST || '127.0.0.1',
		    idleTimeoutMillis: process.env.POSTGRES_IDLE_TIMEOUT || 1000,
		    max: process.env.POSTGRES_MAX_CONN || 64,
		    port: process.env.POSTGRES_PORT || 5432,
		    user: process.env.POSTGRES_USER || 'postgres'
		};
	    if (process.env.POSTGRES_PASSWORD !== undefined && process.env.POSTGRES_PASSWORD !== '') {
		opts.password = process.env.POSTGRES_PASSWORD;
	    }
	    if (process.env.POSTGRES_SSL !== undefined && process.env.POSTGRES_SSL !== 'false') {
		opts.ssl = true;
	    }
	    this._db = new pool(opts);
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

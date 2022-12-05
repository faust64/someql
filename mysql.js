const logger = require('wraplog')('mysql-handler');

class MySQL {
    constructor(opts) {
	try {
	    let mysql = require('mysql2'), myopts = {
		    connectionLimit: opts.maxConn || 64,
		    database: opts.database || 'default',
		    host: opts.host || '127.0.0.1',
		    port: opts.port || 3306,
		    user: opts.username || 'root'
		};
	    if (opts.password !== undefined) { myopts.password = opts.password; }
	    this._db = mysql.createPool(myopts);
	    //this._db.on('connection', connection => connection.query('SET SESSION auto_increment_increment=1'));
	    this._db.on('enqueue', () => logger.info('waiting for mysql socket'));
	    this._opts = opts;
	    let self = this;
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
				logger.debug(qry);
				self._db.query(qry, (e, rows, fields) => {
					if (e) {
					    logger.error(e);
					    reject({ code: 500, msg: 'failed writing to database' });
					} else { resolve(); }
				    });
			    });
		    },
		read: (qry, limit, offset) => {
			let self = this;
			return new Promise((resolve, reject) => {
				let mylimit = limit || self._opts.paginationMin || 100;
				let myoffset = offset || 0;
				if (qry.indexOf(' LIMIT ') < 0 && mylimit !== 'none') {
				    qry += ` LIMIT ${myoffset}, ${mylimit}`;
				}
				logger.debug(qry);
				self._db.query(qry, (e, rows, fields) => {
					if (e) {
					    logger.error(e);
					    reject({ code: 500, msg: 'failed writing to database' });
					} else if (rows !== undefined && rows.length > 0) { resolve(rows); }
					else { reject({ code: 500, msg: 'malformatted response object from db' }); }
				    });
			    });
		    },
		close: () => {
			let self = this;
			self._db.end();
			self._db = undefined;
		    }
	    };
    }
}

module.exports = (opts) => new MySQL(opts).handlers;

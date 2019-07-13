const Promise = require('bluebird');
const logger = require('wraplog')('sqlite-handler');

class Sqlite {
    constructor(opts) {
	try {
	    const sqlite = require('better-sqlite3');
	    this._db = new sqlite(opts.database || './default.sqlite');
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
				try {
				    logger.debug(qry);
				    let r = self._db.exec(qry);
				    resolve(true);
				} catch(e) {
				    logger.error(e);
				    reject({ code: 500, msg: 'failed writing to database' });
				}
			    });
		    },
		read: (qry, limit, offset) => {
			let self = this;
			return new Promise((resolve, reject) => {
				try {
				    let mylimit = limit || self._opts.paginationMin || 100;
				    let myoffset = offset || 0;
				    if (qry.indexOf(' LIMIT ') < 0 && mylimit !== 'none') {
					qry += ` LIMIT ${myoffset}, ${mylimit}`;
				    }
				    logger.debug(qry);
				    let r = self._db.prepare(qry).all();
				    resolve(r);
				} catch(e) {
				    logger.error(e);
				    reject({ code: 500, msg: 'failed querying database' });
				}
			    });
		    },
		close: () => {
			let self = this;
			self._db.close();
			self._db = undefined;
		    }
	    };
    }
}

module.exports = (opts) => new Sqlite(opts).handlers;

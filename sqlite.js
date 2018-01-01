const Promise = require('bluebird');
const logger = require('logger')('sqlite-handler');

module.exports = () => {
	try {
	    const sqlite = require('better-sqlite3');
	    this._db = new sqlite(process.env.SQLITE_DBFILE || './default.sqlite');
	} catch(e) {
	    logger.error(e);
	    process.exit(1);
	}
	let self = this;
	return {
		write: (qry) => {
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
		    return new Promise((resolve, reject) => {
			    try {
				let mylimit = limit || process.env.PAGINATION_MIN || 100;
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
			self._db.close();
			self._db = undefined;
		    }
	    };
    };

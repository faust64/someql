const Promise = require('bluebird');
const logger = require('wraplog')('mysql-handler');

module.exports = (opts) => {
	try {
	    let mysql = require('mysql'), myopts = {
		    connectionLimit: opts.maxConn || 64,
		    database: opts.database || 'default',
		    host: opts.host || '127.0.0.1',
		    port: opts.port || 3306,
		    user: opts.username || 'root'
		};
	    if (opts.password !== undefined) { myopts.password = opts.password; }
	    Promise.promisifyAll(mysql);
	    Promise.promisifyAll(require("mysql/lib/Connection").prototype);
	    Promise.promisifyAll(require("mysql/lib/Pool").prototype);
	    this._db = mysql.createPool(myopts);
	    this._db.on('connection', connection => connection.query('SET SESSION auto_increment_increment=1'));
	    this._db.on('enqueue', () => logger.info('waiting for mysql socket'));
	} catch(e) {
	    logger.error(e);
	    process.exit(1);
	}
	let self = this;
	const getSocket = () => { return self._db.getConnectionAsync().disposer(connection => connection.release()) };

	return {
		write: (qry) => {
			return Promise.using(getSocket(), socket => {
				    logger.debug(qry);
				    return socket.queryAsync(qry)
				})
			    .catch((e) => {
				    logger.error(e);
				    throw { code: 500, msg: 'failed writing to database' };
				});
		    },
		read: (qry, limit, offset) => {
			return Promise.using(getSocket(), socket => {
				    let mylimit = limit || opts.paginationMin || 100;
				    let myoffset = offset || 0;
				    if (qry.indexOf(' LIMIT ') < 0 && mylimit !== 'none') {
					qry += ` LIMIT ${myoffset}, ${mylimit}`;
				    }
				    logger.debug(qry);
				    return socket.queryAsync(qry);
				})
			    .then((resp) => {
				    if (resp !== undefined && resp.length >= 0) {
					return resp;
				    } else {
					logger.error('malformatted response object from db');
					logger.error(resp);
					throw { code: 500, msg: 'malformatted response object from db' };
				    }
				})
			    .catch((e) => {
				    logger.error(e);
				    throw { code: 500, msg: 'failed querying database' };
				});
		    },
		close: () => {
			self._db.endAsync();
			self._db = undefined;
		    }
	    };
    };

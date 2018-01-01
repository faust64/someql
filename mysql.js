const Promise = require('bluebird');
const logger = require('logger')('mysql-handler');

module.exports = () => {
	try {
	    let mysql = require('mysql'), opts = {
		    connectionLimit: process.env.MYSQL_MAX_CONN || 64,
		    database: process.env.MYSQL_DATABASE || 'default',
		    host: process.env.MYSQL_HOST || '127.0.0.1',
		    port: process.env.MYSQL_PORT || 3306,
		    user: process.env.MYSQL_USER || 'root'
		};
	    if (process.env.MYSQL_PASSWORD !== undefined && process.env.MYSQL_PASSWORD !== '') {
		opts.password = process.env.MYSQL_PASSWORD;
	    }
	    Promise.promisifyAll(mysql);
	    Promise.promisifyAll(require("mysql/lib/Connection").prototype);
	    Promise.promisifyAll(require("mysql/lib/Pool").prototype);
	    this._db = mysql.createPool(opts);
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
				    let mylimit = limit || process.env.PAGINATION_MIN || 100;
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

const Promise = require('bluebird');
const logger = require('wraplog')('cassandra-handler');

class Cassandra {
    constructor(opts) {
	let copts = opts || { contactPoints: [ '127.0.0.1' ], keyspace: 'sessions' };
	try {
	    this._drv = require('cassandra-driver');
	    if (opts.username !== undefined && opts.password !== undefined) {
		copts = new this._drv.auth.PlainTextAuthProvider(opts.username, opts.password);
	    }
	    this._db = new this._drv.Client(copts);
	    this._opts = opts;
	} catch(e) {
	    logger.error(e);
	    process.exit(1);
	}
	let self = this;
	this._resolveConsistency = (str) => {
		if (str === 'any' || str === 'ANY') { return self._drv.types.consistencies.any; }
		else if (str === 'one' || str === 'ONE') { return self._drv.types.consistencies.one; }
		else if (str === 'two' || str === 'TWO') { return self._drv.types.consistencies.two; }
		else if (str === 'three' || str === 'THREE') { return self._drv.types.consistencies.three; }
		else if (str === 'quorum' || str === 'QUORUM') { return self._drv.types.consistencies.quorum; }
		else if (str === 'all' || str === 'ALL') { return self._drv.types.consistencies.all; }
		else if (str === 'localQuorum' || str === 'LOCAL_QUORUM') { return self._drv.types.consistencies.localQuorum; }
		else if (str === 'eachQuorum' || str === 'EACHL_QUORUM') { return self._drv.types.consistencies.eachQuorum; }
		else if (str === 'serial' || str === 'SERIAL') { return self._drv.types.consistencies.serial; }
		else if (str === 'localSerial' || str === 'LOCAL_SERIAL') { return self._drv.types.consistencies.localSerial; }
		else if (str === 'localOne' || str === 'LOCAL_ONE') { return self._drv.types.consistencies.localOne; }
		else { return self._drv.types.consistencies.one; }
	    };
	this._fmtConsistency = (str) => {
		const policy = self._resolveConsistency(str);
		return { consistency: policy };
	    };
    }

    get handlers() {
	return {
		write: (qry) => {
			let self = this;
			return new Promise((resolve, reject) => {
				logger.debug(qry);
				self._db.execute(qry, [], self._fmtConsistency(self._opts.writeConsistency))
				    .then((resp) => { resolve(true); })
				    .catch((e) => {
					    logger.error(e);
					    reject('failed writing to database');
					});
			    });
		    },
	       read: (qry, limit, offset) => {
			let self = this;
			return new Promise((resolve, reject) => {
				let mylimit = limit || self._opts.paginationMin || 100;
				if (qry.indexOf(' LIMIT ') < 0 && mylimit !== 'none') {
				    qry += " LIMIT " + mylimit;
				}
				logger.debug(qry);
				self._db.execute(qry, [], self._fmtConsistency(self._opts.readConsistency))
				    .then((resp) => {
					    if (resp.rows !== undefined && resp.rows.length >= 0) {
						resolve(resp.rows);
					    } else {
						logger.error('malformatted response object from db');
						logger.error(resp.rows);
						reject('malformatted response object from db');
					    }
					})
				    .catch((e) => {
					    logger.error(e);
					    reject('failed writing to database');
					});
			});
		    },
		close: () => {
			let self = this;
			self._db.closeAsync();
			self._db = undefined;
		    }
	    };
    }
}

module.exports = (opts) => new Cassandra(opts).handlers;

const Promise = require('bluebird');
const logger = require('wraplog')('cassandra-handler');

module.exports = (opts) => {
	let copts = opts || { contactPoints: [ '127.0.0.1' ], keyspace: 'sessions' };
	try {
	    const drv = require('cassandra-driver');
	    const resolveConsistency = (str) => {
		    if (str === 'any' || str === 'ANY') { return drv.types.consistencies.any; }
		    else if (str === 'one' || str === 'ONE') { return drv.types.consistencies.one; }
		    else if (str === 'two' || str === 'TWO') { return drv.types.consistencies.two; }
		    else if (str === 'three' || str === 'THREE') { return drv.types.consistencies.three; }
		    else if (str === 'quorum' || str === 'QUORUM') { return drv.types.consistencies.quorum; }
		    else if (str === 'all' || str === 'ALL') { return drv.types.consistencies.all; }
		    else if (str === 'localQuorum' || str === 'LOCAL_QUORUM') { return drv.types.consistencies.localQuorum; }
		    else if (str === 'eachQuorum' || str === 'EACHL_QUORUM') { return drv.types.consistencies.eachQuorum; }
		    else if (str === 'serial' || str === 'SERIAL') { return drv.types.consistencies.serial; }
		    else if (str === 'localSerial' || str === 'LOCAL_SERIAL') { return drv.types.consistencies.localSerial; }
		    else if (str === 'localOne' || str === 'LOCAL_ONE') { return drv.types.consistencies.localOne; }
		    else { return drv.types.consistencies.one; }
		};
	    const fmtConsistency = (str) => {
		    const policy = resolveConsistency(str);
		    return { consistency: policy };
		};
	    if (opts.username !== undefined && opts.password !== undefined) {
		copts = new drv.auth.PlainTextAuthProvider(opts.username, opts.password);
	    }
	    this._db = new drv.Client(copts);
	} catch(e) {
	    logger.error(e);
	    process.exit(1);
	}
	let self = this;

	return {
		write: (qry) => {
		    return new Promise((resolve, reject) => {
			    logger.debug(qry);
			    self._db.execute(qry, [], fmtConsistency(opts.writeConsistency))
				.then((resp) => { resolve(true); })
				.catch((e) => {
					logger.error(e);
					reject('failed writing to database');
				    });
			});
		    },
	       read: (qry, limit, offset) => {
			return new Promise((resolve, reject) => {
				let mylimit = limit || opts.paginationMin || 100;
				if (qry.indexOf(' LIMIT ') < 0 && mylimit !== 'none') {
				    qry += " LIMIT " + mylimit;
				}
				logger.debug(qry);
				self._db.execute(qry, [], fmtConsistency(opts.readConsistency))
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
			self._db.closeAsync();
			self._db = undefined;
		    }
	    };
    };

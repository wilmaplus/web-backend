const resUtils = require("../utils/response_utilities")
const fs = require('fs');

function serversHandler(req, res) {
    let cacheFileName = __dirname+'/.wilmaservers_cache';
    try {
        fs.stat(cacheFileName, function (err, status) {

            if (err) {
                if (err.code === 'ENOENT') {
                    resUtils.responseStatus(res, 500, false, {'cause': 'Cache file hasn\'t been generated yet', 'localization': 'servers-cache'})
                } else {
                    resUtils.responseStatus(res, 500, false, {'cause': err.toString()})
                }
            } else {
                fs.readFile(cacheFileName, function (err, data) {
                    try {
                        let servers = JSON.parse(data);
                        resUtils.responseStatus(res, 200, true, {'servers': servers});
                    } catch (e) {
                        resUtils.responseStatus(res, 500, false, {'cause': "Error: "+e.toString()})
                    }
                })
            }
        });
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {'cause': "Error: "+e.toString()})
    }
}

module.exports = {
    serversHandler: serversHandler
}
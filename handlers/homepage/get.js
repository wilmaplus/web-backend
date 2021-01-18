const resUtils = require("../../utils/response_utilities")
const wilmaApi = require('../../wilma_api/api')
const validUrl = require('valid-url');

function homepage(req, res) {
    try {
        if (req.body.session && req.body.server) {
            const session = req.body.session;
            const server = req.body.server;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 1024) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            wilmaApi.homepage(session, server, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response) {
                if (response.error) {
                    resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                    return;
                }
                resUtils.responseStatus(res, 200, true, {response: response});
            })
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}

module.exports = {
    homepage
}


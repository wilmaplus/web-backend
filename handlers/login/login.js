const resUtils = require("../../utils/response_utilities")
const keyUtils = require('../../utils/wilma_apikey');
const wilmaApi = require('../../wilma_api/api')
const validUrl = require('valid-url');

function signIn(req, res) {
    try {
        if (req.body.username && req.body.password && req.body.loginId && req.body.server) {
            const username = req.body.username;
            const password = req.body.password;
            const server = req.body.server;
            const loginId = req.body.loginId;
            if (username.length > 512) {
                resUtils.responseStatus(res, 400, false, {cause: 'username is too long!'});
                return;
            }
            if (password.length > 512) {
                resUtils.responseStatus(res, 400, false, {cause: 'password is too long!'});
                return;
            }
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (loginId.length > 1024) {
                resUtils.responseStatus(res, 400, false, {cause: 'loginId is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            const calculatedToken = keyUtils.calculateKey(username, loginId, global.config.use_reserve ? global.config.reserve_api_key : global.config.wilma_apikey);
            wilmaApi.login(server, username, password, loginId, calculatedToken, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response, cookie) {
                if (response.error) {
                    resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                    return;
                }
                resUtils.responseStatus(res, 200, true, {response: response, session: cookie});
            })
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}


module.exports = {
    signIn
}
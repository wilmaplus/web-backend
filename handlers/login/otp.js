const resUtils = require("../../utils/response_utilities")
const wilmaApi = require('../../wilma_api/api')
const validUrl = require('valid-url');

function applyOtp(req, res) {
    try {
        if (req.body.session && req.body.otpCode && req.body.formKey && req.body.server) {
            const session = req.body.session;
            const otpCode = req.body.otpCode;
            const formKey = req.body.formKey;
            const server = req.body.server;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 4096) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }
            if (otpCode.length > 4096) {
                resUtils.responseStatus(res, 400, false, {cause: 'otpCode is too long!'});
                return;
            }
            if (formKey.length > 4096) {
                resUtils.responseStatus(res, 400, false, {cause: 'formKey is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            let sessionName = "Wilma Plus Web";
            if (req.useragent) {
                sessionName += " - "+(req.useragent.browser||req.useragent.platform)
            }
            wilmaApi.applyOTP(session, otpCode, formKey,sessionName, server, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response, cookie) {
                if (response.error) {
                    resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                    return;
                }
                if (response.payload && response.payload.success) {
                    if (cookie === undefined) {
                        resUtils.responseStatus(res, 500, false, {cause: 'Unable to retrieve OTP Token!'});
                        return;
                    }
                    resUtils.responseStatus(res, 200, true, {otpToken: cookie});
                } else {
                    resUtils.responseStatus(res, 403, false, {cause: 'OTP Code is invalid!', localization: 'otp_invalid'});
                }
            })
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}


module.exports = {
    applyOtp
}
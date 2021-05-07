const resUtils = require("../../utils/response_utilities")
const wilmaApi = require('../../wilma_api/api')
const validUrl = require('valid-url');
const parser = require('../../utils/schedule_parser')
const vismaDatePattern = /(\d{2})\.(\d{2})\.(\d{4})/;

function schedule(req, res) {
    try {
        if (req.body.session && req.body.server) {
            const session = req.body.session;
            const server = req.body.server;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 4096) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            wilmaApi.schedule(session, server, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response, date) {

                try {
                    if (response.error) {
                        resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                        return;
                    }
                    let schedule = [];
                    let terms = [];
                    if (response.Schedule) {
                        schedule = parser.parse(new Date(date.replace(vismaDatePattern,'$3-$2-$1')), response.Schedule);
                    }
                    if (response.Terms) {
                        terms = parser.parseTerms(response.Terms);
                    }
                    resUtils.responseStatus(res, 200, true, {schedule: schedule, terms: terms});
                } catch (e) {
                    console.error(e);
                    resUtils.responseStatus(res, 500, false, {cause: e.toString()});
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
    schedule
}
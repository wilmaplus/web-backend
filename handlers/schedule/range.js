const resUtils = require("../../utils/response_utilities")
const wilmaApi = require('../../wilma_api/api')
const validUrl = require('valid-url');
const parser = require('../../utils/schedule_parser')
const vismaDatePattern = /(\d{2})\.(\d{2})\.(\d{4})/;
const asIt = require('../../asynciterator/iterator');

function schedule(req, res) {
    try {
        if (req.body.session && req.body.server && req.body.start && req.body.end) {
            const session = req.body.session;
            const server = req.body.server;
            const start = req.body.start;
            const end = req.body.end;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 1024) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }

            if (start.length > 64) {
                resUtils.responseStatus(res, 400, false, {cause: 'start date is too long!'});
                return;
            }
            if (isNaN(new Date(start))) {
                resUtils.responseStatus(res, 400, false, {cause: 'Invalid start date!'});
                return;
            }

            if (end.length > 64) {
                resUtils.responseStatus(res, 400, false, {cause: 'end date is too long!'});
                return;
            }
            if (isNaN(new Date(end))) {
                resUtils.responseStatus(res, 400, false, {cause: 'Invalid end date!'});
                return;
            }

            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }

            // Collecting all weeks
            let weekNums = parser.getWeekNumsInRange(new Date(start), new Date(end));
            let asyncIterator = new asIt.AsyncIterator(null, null, weekNums);
            let schedule = [];
            let terms = [];
            asyncIterator.callback = function (item) {
                wilmaApi.scheduleWithDate(item, session, server, function (error, localization) {
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
                        if (response.Schedule) {
                            parser.parse(new Date(date.replace(vismaDatePattern,'$3-$2-$1')), response.Schedule).forEach((item) => schedule.push(item));
                        }
                        if (response.Terms && terms.length < 1) {
                            terms.push(parser.parseTerms(response.Terms));
                        }
                        asyncIterator.nextItem();
                    } catch (e) {
                        console.error(e);
                        resUtils.responseStatus(res, 500, false, {cause: e.toString()});
                    }

                });
            };
            asyncIterator.endCallback = function () {
                resUtils.responseStatus(res, 200, true, {schedule: schedule, terms: terms});
            };
            asyncIterator.nextItem();
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        console.error(e);
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}

module.exports = {
    schedule
}
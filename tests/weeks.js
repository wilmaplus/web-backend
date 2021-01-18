const scheduleParser = require('../utils/schedule_parser');

console.log(scheduleParser.getWeekNumsInRange(new Date("2021-01-01"), new Date("2021-01-18")));

console.log(scheduleParser.getFirstWeekDate(new Date("2021-01-01")));
console.log(scheduleParser.getFirstWeekDate(new Date("2020-12-27")));
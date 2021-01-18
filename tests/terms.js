const scheduleParser = require('../utils/schedule_parser');

let terms = [
    {StartDate: '2020-01-01', EndDate: '2020-01-09', Name: '1. jakso'},
    {StartDate: '2020-01-19', EndDate: '2020-01-28', Name: '1. jakso'},
    {StartDate: '2020-01-10', EndDate: '2020-01-18', Name: '1. jakso'},
    {StartDate: '2020-02-01', EndDate: '2020-02-09', Name: '2. jakso'},
    {StartDate: '2020-02-10', EndDate: '2020-02-18', Name: '2. jakso'},
    {StartDate: '2020-02-19', EndDate: '2020-02-28', Name: '2. jakso'},
];

console.log(terms);

let parsed = scheduleParser.parseTerms(terms);

console.log(parsed);

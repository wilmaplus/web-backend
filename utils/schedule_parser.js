function getFirstWeekDate(date) {
    var day = date.getDay() || 7;
    if( day !== 1 )
        date.setHours(-24 * (day-2));
    return date;
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.getWeekNumber = function(){
    var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};


function setTime(date, time) {
    let cloneDate = new Date(date.getTime());
    cloneDate.setHours(time.getHours(), time.getMinutes());
    return cloneDate;
}

/**
 * Restructuring a teacher or room
 * @param object
 * @returns {{codeName: null, name: null, id: number}}
 */
function restructureTeacherOrRoom(object) {
    let newObject = {id: -1, codeName: null, name: null};
    if (object.Id)
        newObject.id = object.Id;
    if (object.Caption)
        newObject.codeName = object.Caption;
    if (object.LongCaption)
        newObject.name = object.LongCaption;
    return newObject;
}

/**
 * Restructuring object of a group
 * @param group
 * @returns {{rooms: [], teachers: [], codeName: null, name: null, id: number, courseId: number, class: null, shortCode: null}}
 */
function restructureGroup(group) {
    let newGroup = {
        id: -1,
        courseId: -1,
        shortCode: null,
        codeName: null,
        name: null,
        class: null,
        teachers: [],
        rooms: []
    }
    if (group.Id)
        newGroup.id = group.Id;
    if (group.CourseId)
        newGroup.courseId = group.CourseId;
    if (group.ShortCaption)
        newGroup.shortCode = group.ShortCaption;
    if (group.Caption)
        newGroup.codeName = group.Caption;
    if (group.FullCaption)
        newGroup.name = group.FullCaption;
    if (group.Class)
        newGroup.class = group.Class;
    if (group.Teachers) {
        group.Teachers.forEach(function (item) {
            newGroup.teachers.push(restructureTeacherOrRoom(item));
        });
    }
    if (group.Rooms) {
        group.Rooms.forEach(function (item) {
            newGroup.rooms.push(restructureTeacherOrRoom(item));
        });
    }
    return newGroup;
}

/**
 * Restructuring object of reservation
 * @param date
 * @param reservation
 * @returns {{date: null, reservationId: number, start: null, groups: [], end: null, class: null, scheduleId: number}}
 */
function restructure(date, reservation) {
    let newReservation = {
        reservationId: -1,
        scheduleId: -1,
        date: null,
        start: null,
        end: null,
        class: null,
        groups: []
    };
    // Misc items
    if (reservation.ReservationID)
        newReservation.reservationId = reservation.ReservationID;
    if (reservation.ScheduleID)
        newReservation.scheduleId = reservation.ScheduleID;
    if (reservation.Class)
        newReservation.class = reservation.Class;
    if (reservation.Groups) {
        reservation.Groups.forEach(function (item) {
            newReservation.groups.push(restructureGroup(item));
        });
    }
    // Setting date
    newReservation.date = date;

    // Parsing start and end times
    if (reservation.Start && reservation.End) {
        let start = new Date("1970-01-01 "+reservation.Start);
        let end = new Date("1970-01-01 "+reservation.End);
        if (start != null)
            newReservation.start = setTime(date, start);
        if (end != null)
            newReservation.end = setTime(date, end);
    }
    return newReservation;
}

/**
 * Parses Visma's schedule to cleaner code
 * @param date Date
 * @param schedule Schedule JSON
 */
function parse(date, schedule) {
    const monday = getFirstWeekDate(date);
    let reservationMap = new Map();
    let currentDay = 0;
    let lastDay = 0;
    schedule.forEach(function (scheduleReservation) {
        // If day changed, adding currentDay
        if (scheduleReservation.Day > lastDay) {
            if (lastDay !== 0) {
                currentDay++;
            }
            lastDay = scheduleReservation.Day;
        }
        // Getting date
        let correctedDate = new Date(monday.getTime()).addDays(currentDay);
        let restructuredReservation = restructure(correctedDate, scheduleReservation);
        if (reservationMap.has(correctedDate.getTime())) {
            let array = reservationMap.get(correctedDate.getTime());
            array.push(restructuredReservation);
            reservationMap.set(correctedDate.getTime(), array);
        } else {
            let array = [restructuredReservation];
            reservationMap.set(correctedDate.getTime(), array);
        }
    });

    // Creating final object
    let days = [];
    reservationMap.forEach(function (value, key) {
        days.push({date: new Date(key), reservations: value});
    });
    // Sorting
    days = days.sort((a, b) => a.date - b.date);
    return days;
}

/**
 * Reconstructing a term
 * @param term Term
 * @returns {{name: null, start: null, end: null}}
 */
function reconstructTerm(term) {
    let newTerm = {
        name: null, start: null, end: null
    };
    if (term.Name)
        newTerm.name = term.Name;
    if (term.StartDate)
        newTerm.start = new Date(term.StartDate);
    if (term.EndDate)
        newTerm.end = new Date(term.EndDate);
    return newTerm;
}

/**
 * Converts terms, which are split to weeks, i.e. term 1, which is split from 01.01.2020-01.02.2020 by weeks in between.
 * (Term 1) 01.01.2020 - 09.01.2020
 * (Term 1) 09.01.2020 - 17.01.2020
 * (Term 2) 18.01.2020 - 24.01.2020
 * This makes them to be:
 * (Term 1) 01.01.2020 - 17.01.2020
 * etc.
 *
 * Squashing them into one single object for one term, to keep it simple
 * @param terms
 */
function parseTerms(terms) {
    let termsMap = new Map();
    let lastTerm = null;
    terms.forEach(function (vismaTerm) {
        let term = reconstructTerm(vismaTerm);
        if (lastTerm != null) {
            if (lastTerm.name && term.name && lastTerm.name.toLowerCase().includes("jakso") && term.name.toLowerCase().includes("jakso")) {
                // Parsing terms' numbers
                let firstJaksoNumber = parseInt(term.name) || -1;
                let secondJaksoNumber = parseInt(term.name) || -1;

                lastTerm = term;
                
                // If same term, adding to same bundle
                if (firstJaksoNumber === secondJaksoNumber) {
                    if (termsMap.has(firstJaksoNumber)) {
                        let termsArray = termsMap.get(firstJaksoNumber);
                        termsArray.push(term);
                        termsMap.set(firstJaksoNumber, termsArray);
                    } else {
                        termsMap.set(firstJaksoNumber, [term]);
                    }
                }
            }
        } else if (term.name && term.name.toLowerCase().includes("jakso")) {
            // To avoid skipping first term, adding it here
            let jaksoNumber = parseInt(term.name);
            lastTerm = term;
            if (termsMap.has(jaksoNumber)) {
                let termsArray = termsMap.get(jaksoNumber);
                termsArray.push(term);
                termsMap.set(jaksoNumber, termsArray);
            } else {
                termsMap.set(jaksoNumber, [term]);
            }
        }
    });
    
    let finalTerms = [];
    termsMap.forEach(function (value, key) {
        let dates = [];
        value.forEach(function (value) {
            dates.push(value.start);
            dates.push(value.end);
        });
        dates.sort(function (a, b) {return a.getTime() - b.getTime()});
        if (dates.length > 0) {
            finalTerms.push({name: key+". {{term}}",start: dates[0], end: dates[dates.length-1]});
        }
    });
    if (finalTerms.length < 1) {
        terms.forEach(function (item) {
            finalTerms.push(reconstructTerm(item));
        })
    }
    return finalTerms;
}

function getWeekNumsInRange(startDate, endDate) {
    let dates = [],
        currentDate = startDate,
        addDays = function(days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        };
    while (currentDate <= endDate) {
        dates.push(currentDate);
        currentDate = addDays.call(currentDate, 1);
    }
    let weeks = new Map();
    dates.forEach(function (date) {
        if (!weeks.has(date.getWeekNumber()))
            weeks.set(date.getWeekNumber(), date);
    });

    let finalDates = [];
    weeks.forEach(function (value) {
        finalDates.push(getFirstWeekDate(value));
    })
    return finalDates;
}


module.exports = {
    parse,
    parseTerms,
    getWeekNumsInRange,
    getFirstWeekDate
}
var app = angular.module("JhHub", ['ui.bootstrap', 'ngResource']);
var today = new Date();
var timeStep = 15;

var timeSettings = {
    startTime: {
        min: '07:00',
        max: '10:00'
    },
    endTime: {
        min: '16:00',
        max: '19:00'
    }
}

app.controller("FlexiTimeCtrl", function ($scope, $http) {

    $scope.currentDate = new Date();
    $scope.updatePeriod = function(month, year, user) {

        $http({
            url: '/flexi-time-rest',
            method: 'GET',
            params: {
                y: year,
                m: month
            }
        }).success(function(data) {
            $scope.records      = data.bookings;
            $scope.totals       = data.bookings.totals;
            $scope.pagination   = data.pagination;
            var user = {
                fName   : data.bookings.user.name.split(' ')[0],
                email   : data.bookings.user.email,
                name    : data.bookings.user.name,
                id      : data.bookings.user.id
            }
            $scope.user     = user;
            $scope.date     = new Date(data.date.date.split(" ")[0]);
            $scope.today    = new Date(data.today.date.split(" ")[0]);
        });

    };

    $scope.loadUserRecords = function() {
        $http.get('/flexi-time-rest').success(function(data) {
            $scope.records      = data.bookings;
            $scope.totals       = data.bookings.totals;
            $scope.pagination   = data.pagination;
            var user = {
                fName   : data.bookings.user.name.split(' ')[0],
                email   : data.bookings.user.email,
                name    : data.bookings.user.name,
                id      : data.bookings.user.id
            }
            $scope.user     = user;
            $scope.date     = new Date(data.date.date.split(" ")[0]);
            $scope.today    = new Date(data.today.date.split(" ")[0]);
        });
    }
    $scope.loadUserRecords();

});

app.factory('Booking', ['$resource',
    function($resource){
        return $resource('/flexi-time-rest/:id', { 'id': '@id'}, {
            'update' : {'method' : 'PUT'}
        });
    }]
);

app.controller("BookingCtrl", function($scope, Booking, $filter, timeStep, timeSettings) {

    $scope.showEditRow = false;

    $scope.saving = false;

    $scope.deleting = false;


    $scope.toggleEditRow = function() {
        $scope.showEditRow = !$scope.showEditRow;
    };

    $scope.timeSettings = {
        timeStep : timeStep,
        startTime: timeSettings.startTime
    }

    $scope.newBooking = function() {
        //filter date
        var date = $filter('isoDate')($scope.day.date.date);
        var date = $filter('date')(date, 'yyyy-MM-dd');

        $scope.booking = new Booking({
            date: date,
            startTime: '07:00',
            endTime: '16:00'
        });
    };

    if($scope.day.booking) {
        $scope.booking = new Booking({
            id:  $scope.day.booking.id,
            date: $scope.day.booking.date,
            startTime: $scope.day.booking.startTime,
            endTime: $scope.day.booking.endTime,
            total: $scope.day.booking.total,
            notes: $scope.day.booking.notes
        });
    } else {
        $scope.newBooking();
    }

    $scope.save = function() {
        $scope.saving = true;

        if($scope.booking.id) {
            $scope.booking.$update().then(function(result) {
                $scope.saving = false;
                $scope.booking = new Booking(result.booking);
                $scope.bookingForm.$setPristine();
                $scope.toggleEditRow();
            });
        } else {
            $scope.booking.$save().then(function(result) {
                $scope.saving = false;
                $scope.booking = new Booking(result.booking);
                $scope.toggleEditRow();
            });
        }

    };

    $scope.delete = function() {
        $scope.deleting = true;
        $scope.booking.$delete().then(function(result) {
            $scope.newBooking();
            $scope.deleting = false;
            $scope.toggleEditRow();
        });
    }
});

app.config(function($provide) {
    $provide.provider('today', function() {
        this.$get = function() {
            return today;
        };
    });
});

app.config(function($provide) {
    $provide.provider('timeStep', function() {
        this.$get = function() {
            return timeStep;
        };
    });
});

app.config(function($provide) {
    $provide.provider('timeSettings', function() {
        this.$get = function() {
            return timeSettings;
        };
    });
});

app.filter('isoDate', function() {
    return function(input) {
        input = input.split(" ")[0];
        input = new Date(input).toISOString();
        return input;
    };
});

app.filter('signTotal', function() {
    return function(input) {
        input = "" + input;
        if(input >= 0) {
            return  "+ " + input;
        }

        return input.replace("-", "- ");
    };
});

app.filter('bookingClasses', function(today) {
    return function(booking) {
        var date = new Date(booking.date);
        var classes = [];

        if(
            date.getDate() ===  today.getDate() &&
                date.getMonth() ===  today.getMonth() &&
                date.getYear() ===  today.getYear()
            ) {
            classes.push('today');
        }

        if(!booking.id) {
            classes.push('no-booking');

            if(date > today) {
                classes.push('no-booking-future');
            } else if(date < today) {
                classes.push('no-booking-past');
            }
        }
        return classes.join(" ");
    }
});



app.directive('timeRange', function() {
    return {
        require: 'ngModel',
        scope: {
            rangeMin: '@',
            rangeMax: '@'
        },
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {

                if(viewValue === undefined) {
                    ctrl.$setValidity('timeRange', false);
                    return undefined;
                }

                var valid = true;
                //if min validation is enabled
                if(scope.rangeMin) {
                    if(viewValue < scope.rangeMin) {
                        valid = false;
                    }
                }

                //if max validation is enabled
                if(scope.rangeMax) {
                    if(viewValue > scope.rangeMax) {
                        valid = false;
                    }
                }

                ctrl.$setValidity('timeRange', valid);
                return viewValue;

            });
        }
    };
});

app.directive('timeStep', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {

                if(viewValue === undefined) {
                    ctrl.$setValidity('timeStep', false);
                    return undefined;
                }

                var parts   = viewValue.split(":");
                var minutes = parts[1];

                //Check the time is a valid minutes step
                if (minutes % 15 === 0) {
                    // it is valid
                    ctrl.$setValidity('timeStep', true);
                    return viewValue;
                } else {
                    // it is invalid, return undefined (no model update)
                    ctrl.$setValidity('timeStep', false);
                    return undefined;
                }
            });
        }
    };
});

app.directive('padHours', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {

                //convert single digits to double
                //eg 9:00 - 09:00
                var parts   = viewValue.split(":");
                var hours   = parts[0];
                var minutes = parts[1];

                if(hours.length == 1) {
                    hours = "0" + hours;
                }

                var time = hours + ":" + minutes;
                return time;
            });
        }
    };
});

app.directive('timeFormat', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {

                if (viewValue.match(/^\d{1,2}:\d\d$/)) {
                    // it is valid
                    ctrl.$setValidity('timeFormat', true);
                    return viewValue;
                } else {
                    // it is invalid, return undefined (no model update)
                    ctrl.$setValidity('timeFormat', false);
                    return undefined;
                }
            });
        }
    };
});
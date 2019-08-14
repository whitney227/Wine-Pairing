
app.filter('phone', function () {
    return function (number) {
        if (!number) { return ''; }

        number = String(number);

        var strippedNumber = number.replace(/\D/g, '');

        if (number == strippedNumber) {

            // Will return formattedNumber.
            // If phonenumber isn't longer than an area code, just show number
            var formattedNumber = number;

            // if the first character is '1', strip it out and add it back
            var c = (number[0] === '1') ? '1 ' : '';
            number = number[0] === '1' ? number.slice(1) : number;

            // # (###) ###-#### as c (area) front-end
            var area = number.substring(0, 3);
            var front = number.substring(3, 6);
            var end = number.substring(6, 10);

            if (front) {
                formattedNumber = (c + '(' + area + ') ' + front);
            }
            if (end) {
                formattedNumber += ('-' + end);
            }

            return formattedNumber;
        }

        return number;
    };
});

app.filter('postalcode', function () {
    return function (code, format) {
        if (!code) { return ''; }

        code = String(code);

        if (!format) {
            if (code.length == 9) {
                format = '99999-9999';
            }
            else if (code.length == 6) {
                format = 'L0L 0L0';
            }
        }

        if (format == '99999-9999' && code.length == 9) {
            code = String(code).slice(0, 5) + '-' + String(code).slice(5);
        }
        else if (format == 'L0L 0L0' && code.length == 6) {
            code = String(code).slice(0, 3) + ' ' + String(code).slice(3);
        }

        return code;
    };
});

app.filter('range', function () {
    var filter =
        function (arr, lower, upper) {
            for (var i = lower; i <= upper; i++) {
                arr.push(i.toString().substring(2, 4))
            }
            return arr
        };

    return filter;
});

app.filter('getLastFour', function () {
    return function (number) {
        if (number) {
            return number.substr(number.length - 4);
        }
        else {
            return '';
        }
    }
});

app.filter('currencyFormat', function () {
    var filter =
        function (number, currencyTypeID) {
            return idstc().formatNumberToCurrency(number, currencyTypeID);
        };

    return filter;
});

app.filter('currencyFormatTest', function () {
    var filter =
        function (number, format, culture) {
            format = format || 'c'; //set default to 'c' if no format passed in
            //culture = culture || idstc().getCultureForLoggedInUser(); //set to culture for user if no culture passed in
            culture = 'en-US';

            return kendo.toString(number, format, culture);
        };

    return filter;
});

app.filter('numberFormat', function () {
    var filter =
        function (number, format, culture) {
            format = format || 'n'; //set default to 'n' if no format passed in

            return kendo.toString(number, format, culture);
        };

    return filter;
});

app.filter('orderCurrencyFormat', function () {
    //format a number given it's currency ID
    var filter =
        function (number, currencyID, absolute) {
            if (absolute) {
                number = Math.abs(number);
            }
            return idstc().formatNumberToCurrency(number, currencyID);
        };

    return filter;
});

app.filter('dateFormat', function () {
    var filter = function (date, format, culture, isStatic) {
        if (typeof date === 'string') {
            //microsoft's json serializer comes back with this weird date format sometimes.
            //http://stackoverflow.com/questions/206384/how-do-i-format-a-microsoft-json-date
            var regex = /\/Date\(\d+\)\//;
            if (regex.test(date)) {
                date = new Date(parseInt(date.substr(6)));
            }
            else {
                date = new Date(moment(date));
            }
        }

        if (isStatic) {
            date = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        }

        format = format || 'd'; //set default to 'd' if no format passed in
        culture = culture || 'en-US'; //set to culture for user if no culture passed in

        if (typeof date == 'undefined') {
            date = new Date();
        }

        //get the culture script since we might have passed a culture we don't have a script for yet        
        return kendo.toString(date, format, culture);
    };

    return filter;
});

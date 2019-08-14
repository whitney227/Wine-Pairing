////#region Global Methods

var $ = jQuery.noConflict();

//#endregion

//#region  Global Functions / Properties that should probably either be moved into IDSTC object or to another location

var HideIDSTCNotifyTimeout;

//WebsiteChange -- website global 
var apiRoot = idstc_setting_apiurl;
var acutaSiteRoot = idstc_setting_baseurl;
var consultantPortalRootPath = idstc_setting_consultantportalurl; // this will usually be an external URL 
var customerPortalRootPath = idstc_setting_customerportalurl; // this will usually be an external URL 
var siteRoot = idstc_setting_baseurl; // this will usually be an external URL 
var websiteGlobal = {
    //   appName: "mysite"
    appName: idstc_setting_appname
};
var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

//end website global

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}

function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function getNotificationsArray() {
    var strNotifications = getCookie("notifications");

    if (strNotifications.length > 0) {
        return JSON.parse(strNotifications);
    }
    else {
        return [];
    }
}

function hideNotification(e, hideOnlyIfOld) {
    clearTimeout(HideIDSTCNotifyTimeout);

    var timestamp = $(e).data("timestamp");

    if (hideOnlyIfOld) {
        var diff = Math.abs(Date.now() - timestamp);
        if (diff < 5000) {
            return;
        }
    }

    $(e).closest(".k-notification").remove();

    var notifications = getNotificationsArray();
    var index = notifications.indexOf(notifications.filter(function (item) {
        return item.timestamp === timestamp;
    })[0]);

    if (index != null && index >= 0) {
        notifications.splice(index, 1);
        document.cookie = "notifications=" + JSON.stringify(notifications) + "; path=/";

        if (notifications.length === 0) {
            $("#sidebar-wrapper", window.parent.document).removeClass("active");
            $("#notification").removeClass("flash");
        }
    }
}

function getNotificationDetails(e) {
    var notification = $(e).closest(".k-notification");
    alert(notification.find('p').text());
}

//#endregion

//#region Global on load stuff ( Load notifications from cookie (if any), attach events, etc.
jQuery(document).ready(function ($) {
    $(function () {
        var notifications = getNotificationsArray();

        var anyToShowNow = false;

        $.each(notifications, function () {
            if ($("div[data-timestamp='" + this.timestamp + "']").length === 0) {
                if (this.showNext) {
                    anyToShowNow = true;
                    this.showNext = false;
                }

                idstc().notify(
                    { message: this.message, success: this.type, fromCookie: true, timestamp: this.timestamp },
                    null
                );
            }
        });

        if (anyToShowNow) {
            var wp = window.parent.document;

            $("#sidebar-wrapper", wp).addClass("active");

            document.cookie = "notifications=" + JSON.stringify(notifications) + "; path=/";
        }
    });
});
//#endregion

//#region Instantiate the idstc object --  requires dependency to jquery

var idstc = function (container) {
    // if a container is specified return that object or window if none specified.
    if (container) {

        if (window === this) {
            return new idstc(container);
        }

        this.el = $(container);
        return this;

    }
    else {
        // return window object if no identifier specified.

        return new idstc(window);
    }
};
//#endregion

//#region Notification Templates
idstc.templates = function (type, o) {
    var template = "";
    if (type === "successerrorwarn") {
        //#region Success/Error/Warn Template
        template = "<div class='row notify-row notify-wrapper-#= type #'>" +
            "<div class='col-md-2 col-xs-2 notify text-center notify-#= type #' onclick='getNotificationDetails(this);'>" +
            "<i class='fa fa-warning mega'></i>" +
            "</div>" +
            "<div class='col-md-10 col-xs-10 dark'>" +
            "<div class='col-md-11 col-xs-11 half-pad-top no-pad-right no-pad-left'>" +
            "<p>#= message #</p>" +
            "</div>" +
            "<div class='col-md-1 col-xs-1 no-pad-right half-pad-top no-pad-left'>" +
            "<div data-timestamp='#= timestamp #' onclick='hideNotification(this);' class='pull-right mega mega-x'>" +
            "<i class='glyphicon glyphicon-remove'></i>" +
            "</div>" +
            "</div>" +
            "<div class='clearfix'></div>" +
            "<div class='row'>" +
            "<p class='text-right half-pad-right time'>#= age # minutes</p>" +
            "</div>" +
            "</div>" +
            "</div>";
        //#endregion
    }
    else if (type === "confirm") {
        template = "<div id='confirm-dialog'>" +
            "<p class='confirm-message'>" + o.message + "</p>" +
            "<div class='padding'></div>" +
            "<div class='confirm-actions'>" +
            "<button class='pull-left btn btn-" + (o.cancelBtnClass ? o.cancelBtnClass : "warning") + " btncancel'>" + (o.cancelText ? o.cancelText : "Cancel") + "</button>" +
            "<button class='pull-right btn btn-" + (o.continueBtnClass ? o.continueBtnClass : "primary") + " btnconfirm'>" + (o.continueText ? o.continueText : "Continue") + "</button>" +
            "</div>" +
            "</div>";
    }
    else if (type === "confirmandresponse") {
        template = "<div id='confirm-dialog'>" +
            "<p class='confirm-message'>" + o.message + "</p>" +
            "<textarea class='form-control confirmandresponse-textarea'></textarea>" +
            "<div class='padding'></div>" +
            "<div class='confirm-actions'>" +
            "<button class='pull-left btn btn-" + (o.cancelBtnClass ? o.cancelBtnClass : "warning") + " btncancel'>" + (o.cancelText ? o.cancelText : "Cancel") + "</button>" +
            "<button class='pull-right btn btn-" + (o.continueBtnClass ? o.continueBtnClass : "primary") + " btnconfirm'>" + (o.continueText ? o.continueText : "Continue") + "</button>" +
            "</div>" +
            "</div>";
    }
    else if (type === "alert") {
        template = "<div id='confirm-dialog'><p class='confirm-message'>" + o.message + "</p>" +
            "<div class='padding'></div>" +
            "<div class='confirm-actions center'>" +
            "<button class='center btn btn-primary btncancel'>" + idstc().translate('general', 'Continue', 'Continue') + "</button>" +
            "</div>" +
            "</div > ";
    }

    return template;
};
//#endregion

idstc.prototype = function () {
    var validation = {};

    var removeAllNotifications = function () {
        jQuery.each($(".k-notification"), function (i, val) {
            hideNotification(val);
        });

        document.cookie = "notifications=; path=/";
    }

    var getURLParam = function (name) {
        var url = window.location.href;
        var results = new RegExp('[\\?&]' + name + '=([^&#]*)', 'i').exec(url);

        if (!results) {
            return null;
        }
        return results[1] || undefined;
    }

    var translate = function (container, prop, defaultText) {
        var translations = JSON.parse(localStorage.getItem(container + '-Translations'));

        if (translations != null) {
            if (translations[container] != null) {
                if (translations[container][prop] != null) {
                    return translations[container][prop];
                }
                else {
                    prop = prop.toLowerCase();
                    if (translations[container][prop] != null) {
                        return translations[container][prop];
                    }
                }
            }
        }

        return defaultText;
    }

    var getTranslationsFromServer = function (container) {
        var translations = JSON.parse(localStorage.getItem(container + '-Translations'));

        if (translations == null) {
            $.getJSON(apiRoot + 'api/translation/GetTranslations?container=' + container).done(
                function (data) {
                    localStorage.setItem(container + '-Translations', JSON.stringify(data));
                });
        }
    };

    var formatNumberToCurrency = function (number, currencyTypeID) {
        var formattedNumber = String(number);

        // The following currency type id logic is a catchall intended to match that
        // which was added for the portal.  This code will ensure any currencytypeid
        // value passed in is a valid number (regardless of type) and set to
        // the default of '1' if it is not.
        if (!isNaN(currencyTypeID) && typeof (currencyTypeID) !== 'number') {
            //we have a valid numeric value but its not of type numeric so convert it
            currencyTypeID = Number(currencyTypeID);
        }

        if (!currencyTypeID || isNaN(currencyTypeID)) {
            //fallback to usd if the currency type isn't is null or a bad parameter
            currencyTypeID = 1;
        }

        if (storage.get('CurrencyTypes') && currencyTypeID) {

            var currencyTypes = storage.get('CurrencyTypes').currencyTypes;

            // get the currency type info that will be used to format the number
            var index = currencyTypes.indexOf(currencyTypes.filter(function (CurrencyType) {
                return CurrencyType.CurrencyTypeID == currencyTypeID;
            })[0]);

            if (index >= 0) {
                // get the individual parts of the number passed in
                var numberArray = formattedNumber.split(".");

                var decimalValue = "";
                var numberValue = "";

                if (numberArray.length > 0) {
                    numberValue = numberArray[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, currencyTypes[index].SeparatorSymbol.Symbol);
                    if (numberArray.length > 1) {
                        decimalValue = (numberArray[1] + Array(currencyTypes[index].DecimalDigits.DecimalDigits).join('0')).substring(0, currencyTypes[index].DecimalDigits.DecimalDigits);
                    }
                    else {
                        //                              decimalValue = Array(currencyTypes[index].DecimalDigits.DecimalDigits).join('0');
                        decimalValue = (new Array(currencyTypes[index].DecimalDigits.DecimalDigits + 1)).join('0');
                    }
                }
                else {
                    numberValue = numberArray.toString().replace(/\B(?=(\d{3})+(?!\d))/g, currencyTypes[index].SeparatorSymbol.Symbol);
                    decimalValue = Array(currencyTypes[index].DecimalDigits.DecimalDigits).join('0');
                }

                formattedNumber = numberValue + currencyTypes[index].DecimalSymbol.Symbol + decimalValue;

                if (currencyTypes[index].SymbolDisplayLocation.SymbolDisplayLocationID == 1) {
                    formattedNumber = currencyTypes[index].Symbol + formattedNumber;
                }
                else {
                    formattedNumber = formattedNumber + currencyTypes[index].Symbol;
                }
            }
        }

        return formattedNumber;
    }

    var formatDateFromUTC = function (date, dateTypeID) {
        /***
            dataTypeID: 1 - Get date only, no time nor seconds
            dataTypeID: 2 - Get date and time (no seconds) with utc offset
            Anything else: Get date and time (with seconds)
        */
        var formattedDate = String(date);
        var browserOffset = (new Date().getTimezoneOffset()) / 60;
        var format = storage.get('DateFormatString').dateFormat;

        format = format.replace("dd", "DD");
        format = format.replace("yyyy", "YYYY");

        if (storage.get('UTCOffset') != null) {
            var offset = storage.get('UTCOffset').offset;
            var timeFormat = ' LT';

            if (storage.get('TimeFormat') != null) {
                if (storage.get('TimeFormat').timeFormat == '24') {
                    timeFormat = ' HH:mm';
                }
            }
            else {
                var valueToSave = {
                    timeFormat: '12',
                    dateTime: new Date().getTime()  //set timestamp for cache  
                };
                storage.set('TimeFormat', valueToSave);
            }

            if (dateTypeID == 1) {  // date only
                var dateTime = new Date(moment(formattedDate));
                formattedDate = moment(dateTime).format(format);
            }
            else if (dateTypeID == 2) {  // datetime with offset
                format = format + timeFormat;
                var dateTime = new Date(moment.utc(formattedDate));
                dateTime.setHours(dateTime.getHours() + offset);
                formattedDate = moment.utc(dateTime).format(format);
            }
            else if (dateTypeID == 3) { // datetime with no offset (including seconds)
                if (timeFormat == 'HH:mm') {
                    format = format + timeFormat + ':ss';
                }
                else {
                    format = format + timeFormat + 'S';
                }

                var dateTime = new Date(moment(formattedDate));
                formattedDate = moment(dateTime).format(format);
            }
            else if (dateTypeID == 4) {  // utc date only

                var dateTime = new Date(moment.utc(formattedDate));
                formattedDate = moment.utc(dateTime).format(format);
            }
        }

        return (formattedDate == "Invalid date") ? "" : formattedDate;
    }

    var formatDateToUTC = function (date, dateTypeID) {
        var formattedDate = String(date);

        if (storage.get('UTCOffset') != null) {
            var offset = storage.get('UTCOffset').offset;
            formattedDate = moment(formattedDate).utc().utcOffset(offset).format("YYYY-MM-DD HH:mm:ss")
        }

        return formattedDate;
    }

    var processResponse = function (oArgs) {
        if (oArgs && oArgs.showNotifications) {
            if (oArgs.response.statusCode != 0) {
                if (oArgs.response.Notifications == null || oArgs.response.Notifications.length == 0) {
                    if (oArgs.response.valResults != null && oArgs.response.valResults.length > 0) {
                        oArgs.response.Notifications = [];

                        for (var i = 0; i < oArgs.response.valResults.length; i++) {
                            oArgs.response.messages.push({
                                Message: oArgs.response.valResults[i].ErrorMessage,
                                NotificationType: 1
                            });
                        }
                    }
                }

                idstc().notifyServerResponse(oArgs.response);

                return false;
            }
            else {
                idstc().notifyServerResponse(oArgs.response);
            }
        }

        return true;
    }

    var processError = function (oArgs) {
        // check for standard exception
        if (oArgs.error && oArgs.error.data && oArgs.error.data.ExceptionMessage && oArgs.showNotifications) {
            oArgs.response = {};
            oArgs.response.Notifications = [];
            oArgs.response.messages = [];

            oArgs.response.messages.push({
                Message: oArgs.error.data.ExceptionMessage,
                NotificationType: 1,
                ShowNext: oArgs.showNext
            });

            idstc().notifyServerResponse(oArgs.response);
        }
        else if (oArgs.error && oArgs.error.data && oArgs.error.data.messages && oArgs.error.data.messages.length > 0 && oArgs.showNotifications) {
            oArgs.response = {};
            oArgs.response.Notifications = [];
            oArgs.response.messages = oArgs.error.data.messages;

            idstc().notifyServerResponse(oArgs.response);
        }
        else {
            // check for http exception
            if (oArgs.error && oArgs.error.status && oArgs.error.statusText && oArgs.showNotifications) {
                oArgs.response = {};
                oArgs.response.Notifications = [];
                oArgs.response.messages = [];

                oArgs.response.messages.push({
                    Message: oArgs.error.statusText,
                    NotificationType: 1,
                    ShowNext: oArgs.showNext
                });

                idstc().notifyServerResponse(oArgs.response);
            }
            else {
                if (oArgs.error && oArgs.error.messages) {
                    oArgs.response = {};
                    oArgs.response.Notifications = [];
                    oArgs.response.messages = [];

                    oArgs.response.messages = oArgs.error.messages;

                    idstc().notifyServerResponse(oArgs.response);
                }
            }
        }


    }

    // get an expirable local storage variable.  these variables are set to expire in 24 hours.
    var getExpirableLocalStorageVar = function (varName, expireMinutes) {
        var lsVariable = localStorage.getItem(varName);
        lsVariable = JSON.parse(lsVariable);

        if (lsVariable != null) {
            if (lsVariable.dateTime !== undefined && lsVariable.dateTime != null) {
                var diffTime = new Date().getTime() - lsVariable.dateTime;
                var diffInMinutes = Math.floor(diffTime / 1000 / 60); //get minutes from time                                   

                if (diffInMinutes >= expireMinutes) { //cache for the amount of minutes passed in; if expired then remove from local storage
                    localStorage.removeItem(varName);
                    return null;
                }

                return lsVariable.value;
            }
            else {
                localStorage.removeItem(varName);
                return null;
            }
        }
        else {
            return null;
        }
    };

    var setExpirableLocalStorageVar = function (varName, value) {

        var valueToSave = {
            value: value,
            dateTime: new Date().getTime()  //set timestamp for cache  
        };
        var jsonValue = JSON.stringify(valueToSave);
        localStorage.setItem(varName, jsonValue);
    };

    // get an expirable session storage variable.  these variables are set to expire in 1 hours.
    var getExpirableSessionStorageVar = function (varName, expireMinutes) {
        var lsVariable = sessionStorage.getItem(varName);
        lsVariable = JSON.parse(lsVariable);

        if (lsVariable != null) {
            if (lsVariable.dateTime !== undefined && lsVariable.dateTime != null) {
                var diffTime = new Date().getTime() - lsVariable.dateTime;
                var diffInMinutes = Math.floor(diffTime / 1000 / 60); //get minutes from time                                   

                if (diffInMinutes >= expireMinutes) { //cache for the amount of minutes passed in; if expired then remove from session storage
                    sessionStorage.removeItem(varName);
                    return null;
                }

                return lsVariable.value;
            }
            else {
                sessionStorage.removeItem(varName);
                return null;
            }
        }
        else {
            return null;
        }
    };

    var setExpirableSessionStorageVar = function (varName, value) {

        var valueToSave = {
            value: value,
            dateTime: new Date().getTime()  //set timestamp for cache  
        };
        var jsonValue = JSON.stringify(valueToSave);
        sessionStorage.setItem(varName, jsonValue);
    };

    // framework functions
    // *******************
    var responseMessage = function (messages, data, statusCode, success, valResults, origObj) {
        this.messages = messages;
        this.statusCode = statusCode;
        this.success = success || "error";
        this.data = data;
        this.valResults = valResults;
        this.originalObject = origObj;

        return this;
    }

    //#region Notification Panel
    var toggleNotificationPanel = function (close, log, forceShow, o) {
        var wp = window.parent.document;

        if (log) {
            console.log(log);
        }

        if (forceShow) {
            $("#sidebar-wrapper", wp).addClass("active");

            return true;
        }

        if (close) {
            clearTimeout(HideIDSTCNotifyTimeout);

            $("#sidebar-wrapper", wp).removeClass("active");

            return true;
        }
        else {
            clearTimeout(HideIDSTCNotifyTimeout);

            if (!o.fromCookie) {
                $("#sidebar-wrapper", wp).addClass("active");

                if (o && o.success.toLowerCase() === "success") {
                    HideIDSTCNotifyTimeout = setTimeout(function () {
                        idstc().toggleNotificationPanel(true, null);
                        $("#notification").removeClass("flash");
                    }, 5000);
                }
            }
        }
    }
    //#endregion

    //#region Common Dialog Helpers
    var notifyServerResponse = function (response, callback) {

        if (response && response.data && response.data.messages) {
            response = response.data;
        }

        if (response && response.data && response.data.ExceptionMessage) {
            response = response.data;
        }

        if (response && response.data && response.data.Notifications) {
            response = response.data;
        }

        if (response && response.Notifications && response.messages == null) {
            //In case the return response hasn't been converted from server format; do it now
            var r = response;
            response = new idstc().responseMessage(r.Notifications, r.Value, r.ResultCode, "success", r.ValidationResults);
        }

        if (response && response.messages) {
            $.each(response.messages, function () {
                var errortype;

                if (this.NotificationType === 0) {
                    errortype = "success";
                }
                else if (this.NotificationType === 1) {
                    errortype = "error";
                }
                else if (this.NotificationType === 2 || this.NotificationType === 3) {
                    errortype = "warn";
                }

                // if (this.NotificationType != 3) {
                idstc().notify(
                    { message: this.Message, success: errortype, showNext: this.ShowNext },
                    callback
                );
                // }
            });
        }
    }

    var notifyServerResponseHelp = function () {
        var help = {
            inputs: "idstc ServerResponse object, callback()",
            requiredProperties: "idstc serverreponse object",
            description: "Call this method after using $http get and post methods. Get and Post return a client side " +
                "server response object that may contain notifications. For each notification in the server response this method will display " +
                "a notification as the corresponding type returned from the server. Success = 0, Warn =2, Error = 1"
        }

        console.log(help);
    }
    //#endregion

    //#region Common Dialog
    var notify = function (o, callback) {
        o.type = "notification";
        dialog(o, callback);
    }

    var notifyHelp = function () {
        console.log("this method overloads dialog with a type of 'notification'. Run dialogHelp for detailed information.");
    }

    var dialog = function (o, callback) {
        var wp = window.parent.document;

        if (!o.type) {
            o.type = "confirm";
        }

        if (o.type.toLowerCase() === "notification") {
            // #region Notification            
            var n;

            if (!o.message) {
                throw "Supply a message property for notification";
            }

            if (!o.success) {
                throw "Supply a success property for notification";
            }

            if (o.success.toLowerCase() === "success" || o.success.toLowerCase() === "warn" || o.success.toLowerCase() === "error" || o.success.toLowerCase() === "alert") {

            } else throw "Unacceptable success value from response. success, warn, error are supported.";

            if (o.template) {
                n = $("#notification-wrapper", wp).kendoNotification({
                    appendTo: $("#sidebar-wrapper", wp),
                    autoHideAfter: o.template.autoHideAfter,
                    stacking: o.template.stacking,
                    templates: o.template.templates,
                    button: true,
                    hideOnClick: false
                });
            }
            else {
                jQuery.each($('[data-timestamp]'), function (i, val) {
                    hideNotification(val, true);
                });

                var timestamp = o.timestamp || Date.now();

                n = $("#notification-wrapper", wp).kendoNotification({
                    appendTo: $("#sidebar-wrapper", wp),
                    autoHideAfter: 0,
                    stacking: "up",
                    allowHideAfter: 1000,
                    button: true,
                    hideOnClick: false,
                    templates: [
                        {
                            type: "successerrorwarn",
                            template: idstc.templates("successerrorwarn")
                        }
                    ]
                }).data("kendoNotification");

                if (!o.fromCookie) {
                    // Only add notification to cookie if it needs to be displayed on next page load
                    if (o.showNext) {
                        var notification = { message: o.message, type: o.success, timestamp: timestamp, showNext: o.showNext };
                        var notifications = getNotificationsArray();

                        notifications.push(notification);

                        document.cookie = "notifications=" + JSON.stringify(notifications) + "; path=/";
                    }
                }

                if ($("div[data-timestamp='" + timestamp + "']").length === 0) {
                    var diff = Math.abs(Date.now() - timestamp);

                    o.age = Math.floor((diff / 1000) / 60);

                    if (n) {
                        n.show(
                            {
                                type: o.success || "",
                                message: o.message || "",
                                age: o.age || "0",
                                timestamp: timestamp
                            },
                            "successerrorwarn"
                        );

                        idstc().toggleNotificationPanel(false, null, null, o);

                        if (!o.fromCookie) {
                            $("#notification").addClass("flash");
                        }
                    }
                }

                // run callback
                if (callback && typeof (callback) === "function") {
                    callback();
                }
            }
            // #endregion
        }
        else if (o.type.toLowerCase().indexOf("confirm") > -1) {
            // #region Confirm            

            var winEl = $("#confirmDialog");

            var kendoWindow = winEl.kendoWindow({
                title: o.title,
                resizable: false,
                modal: true
            });

            if (o.type.toLowerCase() === "confirm") {
                var kWindow = kendoWindow.data("kendoWindow");
                kWindow.wrapper.addClass("confirmWindow");
                kWindow.content(
                    idstc.templates("confirm", o)
                ).center().open();
            } else {
                if (o.type.toLowerCase() === 'confirmandresponse') {
                    var kWindow = kendoWindow.data("kendoWindow");
                    kWindow.wrapper.addClass("confirmResponseWindow");
                    kWindow.content(
                        idstc.templates('confirmandresponse', o)
                    ).center().open();
                }
                else {
                    var kWindow = kendoWindow.data("kendoWindow");
                    kWindow.wrapper.addClass("confirmResponseInputWindow");
                    kWindow.content(
                        idstc.templates('confirmandresponseinput', o)
                    ).center().open();
                }
            }

            if (o.cancelButtonText != null) {
                $('.confirm-actions > .btncancel').text(o.cancelButtonText);
            }

            if (o.confirmButtonText != null) {
                $('.confirm-actions > .btnconfirm').text(o.confirmButtonText);
            }

            $(".confirm-actions").on("click", ".btnconfirm", function () {
                // run whatever method was passed in on confirm
                if ($(this).hasClass("btnconfirm")) {
                    // run callback
                    if (callback && typeof (callback) === "function") {
                        callback(true, $(this));
                    }

                }

                winEl.data("kendoWindow").close();

                return this;
            });

            $(".confirm-actions").on("click", ".btncancel", function () {

                winEl.data("kendoWindow").close();

                if (callback && typeof (callback) === "function") {
                    callback(false, $(this));
                }

                return this;

            });
            // #endregion
        }
        else if (o.type.toLowerCase() === "alert") {
            // #region Alert                        
            var winEl = $("#confirmDialog");

            var kendoWindow = winEl.kendoWindow({
                title: o.title,
                resizable: false,
                modal: true,
                actions: ["Close"],
                close: function () {
                    if (callback && typeof (callback) === "function") {
                        callback(false, $(this));
                    }
                },
            });

            var kWindow = kendoWindow.data("kendoWindow");
            kWindow.wrapper.addClass("alertWindow");
            kWindow.content(
                idstc.templates("alert", o)
            ).center().open();

            $(".confirm-actions").on("click", ".btncancel", function () {

                winEl.data("kendoWindow").close();

                if (callback && typeof (callback) === "function") {
                    callback(false, $(this));
                }

                return this;

            });
            // #endregion
        }
        else {
            if (o.type) {
                throw "incorrect dialog type specified. expecting confirm, or notification";
            }
            else {
                throw "no dialog type specified.";
            }
        }

        return this;
    }

    var dialogHelp = function () {
        var help = {
            inputs: "object{ type, success, message, title, kendoNotificationTemplate{}, continueText, cancelText, continueBtnClass, cancelBtnClass }",
            requiredProperties: "success, message",
            defaults: "type = confirm, title = '', continueText = 'Continue', cancelText = 'Cancel', continueBtnClass = 'primary', cancelBtnClass = 'warn'",
            kendoTemplateDefault: {
                appendTo: "#notificationpanel",
                autoHideAfter: 4800,
                stacking: "up",
                templates: [
                    {
                        type: "successerrorwarn",
                        template: idstc.templates("successerrorwarn")
                    }
                ]
            },
            overrides: "use notify which overrides dialog to a notification type.",
            notes: "pass an anonymous fn() to run code after dialog"
        };

        console.log(help);
    }
    //#endregion



    var spinner = function () {

    }

    //#region Method Returns
    return {
        validation: validation,
        removeAllNotifications: removeAllNotifications,
        getURLParam: getURLParam,
        notify: notify,
        notifyHelp: notifyHelp,
        dialog: dialog,
        dialogHelp: dialogHelp,
        processResponse: processResponse,
        processError: processError,
        responseMessage: responseMessage,
        toggleNotificationPanel: toggleNotificationPanel,
        notifyServerResponse: notifyServerResponse,
        notifyServerResponseHelp: notifyServerResponseHelp,
        formatNumberToCurrency: formatNumberToCurrency,
        formatDateFromUTC: formatDateFromUTC,
        formatDateToUTC: formatDateToUTC,
        getExpirableLocalStorageVar: getExpirableLocalStorageVar,
        setExpirableLocalStorageVar: setExpirableLocalStorageVar,
        getExpirableSessionStorageVar: getExpirableSessionStorageVar,
        setExpirableSessionStorageVar: setExpirableSessionStorageVar,
        getTranslationsFromServer: getTranslationsFromServer,
        translate: translate
    };
    //#endregion

}();

//#region   Validation object to append to idstc object
idstc.prototype.validation = {

    getCreditCardType: function (number, allowedCardTypes) {
        var card, card_type, card_types, get_card_type;

        //#region Card_Types array        
        card_types = [];

        if (allowedCardTypes == null) allowedCardTypes = [1, 2, 3, 4];

        if (allowedCardTypes.indexOf(1) > -1) {
            card_types.push({
                id: '1',
                name: 'Visa',
                pattern: /^4/,
                valid_length: [16]
            });
        }
        if (allowedCardTypes.indexOf(2) > -1) {
            card_types.push({
                id: '2',
                name: 'MasterCard',
                pattern: /^5[1-5]/,
                valid_length: [16]
            });
        }
        if (allowedCardTypes.indexOf(3) > -1) {
            card_types.push({
                id: '3',
                name: 'AmericanExpress',
                pattern: /^3[47]/,
                valid_length: [15]
            });
        }
        if (allowedCardTypes.indexOf(4) > -1) {
            card_types.push({
                id: '4',
                name: 'Discover',
                pattern: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/,
                valid_length: [16]
            });
        }

        //#endregion

        var options = {};

        get_card_type = function (number) {
            var _j, _len1, _ref2;
            _ref2 = (function () {
                var _k, _len1, _ref2, _results;
                _results = [];
                for (_k = 0, _len1 = card_types.length; _k < _len1; _k++) {
                    card = card_types[_k];
                    if (_ref2 = card.name) {
                        _results.push(card);
                    }
                }
                return _results;
            })();
            for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                card_type = _ref2[_j];
                if (number.match(card_type.pattern)) {
                    return card_type;
                }
            }
            return null;
        };

        return get_card_type(number);
    }
};
//#endregion
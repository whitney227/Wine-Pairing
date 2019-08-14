var providers = {};

var app = angular.module('app', ['kendo.directives', 'ui.router'], function ($controllerProvider, $compileProvider, $provide) {
    providers = {
        $controllerProvider: $controllerProvider,
        $compileProvider: $compileProvider,
        $provide: $provide
    };
});

//Expose our idstc object into angular for injection
app.constant('idstc', window.idstc);

//Add transform from idstc() library
app.config(function ($httpProvider, idstc) {

    $httpProvider.defaults.transformResponse.push(function (data, headersGetter) {

        //Handling types such as: application/json; charset=utf-8
        if (/application\/json;/.test(headersGetter('Content-Type'))) {

            return ProcessIdstcResponseObject(data);
        } else {
            return data;
        }
    });

    //Hoisting makes this available to the above transform function
    function isIdstcResponseObject(o) {
        if (angular.isObject(o)) {
            return o.hasOwnProperty('ResultCode') && o.hasOwnProperty('Notifications') && o.hasOwnProperty('ValidationResults');
        }

        return false;
    }

    function ProcessIdstcResponseObject(o) {

        if (isIdstcResponseObject(o)) {

            //If we get this far, must have been a success. If not, I modified the standard responseMessage fn to default to 'error'
            var actualNewObject = {};

            //SD: Not sure the idstc object is doing the right thing here so i'm explicitly setting 'this' to a brand new object
            return new idstc().responseMessage.call(actualNewObject, o.Notifications, o.Value, o.ResultCode, 'success', o.ValidationResults, o);
        }

        return o;
    }
});

//Decorator pattern to capture errors and put into our notifications. (easier troubleshooting)
app.config(function ($provide) {
    $provide.decorator('$exceptionHandler', function ($delegate, $injector) {
        return function (exception, cause) {

            $delegate(exception, cause);

            var idstc = $injector.get('idstc');

            JL('Angular').fatalException(cause, exception);

            idstc().notify({ message: exception.message, title: 'Error Notification', success: 'error' });
        };
    });
});


// Handle routing for the client support app
app.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false
    });
}]);

app.run(['$rootScope', '$location', '$state', '$stateParams', function ($rootScope, $location, $state, $stateParams) {
    //Client-side security. Server-side framework MUST add it's
    //own security as well since client-based security is easily hacked
    $rootScope.$on('$stateChangeStart',
        function (event, toState, toParams, fromState, fromParams) {
            $(document).progressStart();
        }
    );

    $rootScope.$on('$stateChangeSuccess',
        function (event, toState, toParams, fromState, fromParams) {
            $(document).progressFinish();
        }
    );

    // It's very handy to add references to $state and $stateParams to the $rootScope
    // so that you can access them from any scope within your applications.For example,
    // <li ng-class='{ active: $state.includes('contacts.list') }'> will set the <li>
    // to active whenever 'contacts.list' or one of its decendents is active.
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
}]);

function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

$(document).ready(function ($) {

    var consultant = $.parseJSON(sessionStorage.getItem('consultant'));

    // Store our _invokeQueue length before loading our controllers/directives/services
    // This is just so we don't re-register anything
    var queueLen = angular.module('app')._invokeQueue.length;

    // Load javascript file with controllers/directives/services
    angular.module('app')
        .controller('siteController', function ($scope, $rootScope, $http, $q, appService) {
            var vm = this;

            appService.scope = $scope;
            vm.appService = appService;

            vm.init = function () {
                var promises = [appService.makeReady()];

                $q.all(promises).then(function (result) {

                });
            }

            vm.init();
        })
        .factory('appService', function ($http, $q, $sce, $compile, $location) {
            var service = this;

            service.consultant = null;
            service.apiToken = null;
            service.getAPITokenPromise = null;
            service.currencyTypePromise = null;
            service.dateFormatPromise = null;
            service.timeFormatPromise = null;
            service.utcOffsetPromise = null;
            service.businessUnitIDPromise = null;
            service.getConsultantPromise = null;

            service.loggedIn = idstc().getExpirableLocalStorageVar('loggedIn', 60);
            service.translatedPageNames = JSON.parse(translatedPageNames);

            service.logout = function (gotoHome) {
                $http.defaults.headers.common['Authorization'] = null;

                localStorage.removeItem('Authorization');
                localStorage.removeItem('loggedIn');
                localStorage.removeItem('CartID');
                localStorage.removeItem('CustomerCartID');
                localStorage.removeItem('CartItemQuantity');
                localStorage.removeItem('displayCategoryId');
                localStorage.removeItem('subSkuForWeb');
                sessionStorage.removeItem('displayCategories');
                sessionStorage.removeItem('translations');

                if (gotoHome == null || gotoHome == true) {
                    window.location = '/';
                }
            }

            if ($location.search().logout == '1') {
                service.logout();
            }

            service.makeReady = function () {
                var promise = $.Deferred();

                var promises = [];
                var newAuthToken = localStorage.getItem('newAuthToken');

                return $q.all(promises).then(function (result) {
                    if (newAuthToken != null || service.tokenValid) {
                        if (newAuthToken != null) {
                            newAuthToken = newAuthToken.replace('bearer ', '');

                            idstc().setExpirableLocalStorageVar('Authorization', newAuthToken);
                            idstc().setExpirableLocalStorageVar('loggedIn', true);

                            localStorage.removeItem('newAuthToken');

                            service.apiToken = newAuthToken;
                            service.loggedIn = true;
                            service.tokenValid = true;
                        }
                    }

                    var repUrl = getParameterByName('u');

                    if (repUrl == null || repUrl == '') {
                        repUrl = localStorage.getItem('replicatedSiteUrl');
                    }

                    if ((repUrl != null && repUrl != '') && (consultant == null || consultant.Url == null || consultant.Url.toLowerCase() != repUrl.toLowerCase())) {
                        promises.push(service.getConsultant(repUrl));
                    }
                    else if (consultant != null) {
                        service.consultant = consultant;
                    }
                    else if (idstc_setting_businessunitsenabled) {
                        promises.push(service.getDefaultBusinessUnitID());
                    }

                    $q.all(promises).then(function (result) {
                        if (newAuthToken == null || !service.tokenValid) {
                            promises = [service.getAPIToken()];
                        }
                        else {
                            promises = [];
                        }

                        $q.all(promises).then(function (result) {
                            $http.defaults.withCredentials = true;
                            $http.defaults.headers.common['Authorization'] = 'bearer ' + service.apiToken;

                            promises = [service.getCurrencyTypes(), service.getUTCOffset(), service.getDateFormat(), service.getTimeFormat(), service.getCountries()];

                            if (newAuthToken != null) {
                                var cartId = idstc().getExpirableLocalStorageVar('CartID', 1440);

                                // Now try to get the replicated site owner for this customer
                                promises.push(service.getReplicatedSiteOwner());

                                promises.push(service.setCurrentPerson(cartId));
                            }

                            return $q.all(promises).then(function (result) {
                                if (service.consultant != null && service.consultant.Url != null) {
                                    let repUrlParam = getParameterByName('u') || '';

                                    if (repUrlParam == '') {
                                        let path = window.location.pathname || '';
                                        let queryString = window.location.search || '';
                                        let newPath = path + queryString;
                                        let appendText = 'u=' + service.consultant.Url;

                                        if (queryString == '') {
                                            appendText = '?' + appendText;
                                        }
                                        else {
                                            appendText = '&' + appendText;
                                        }

                                        window.history.replaceState(null, null, newPath + appendText);
                                    }

                                    //Also - set the body class to let site know we are replicated in case styling should be different
                                    $('body').removeClass('non-replicated');
                                    $('body').addClass('replicated');
                                }

                                promise.resolve();

                                return;
                            });
                        });
                    });

                    return promise;
                });
            }

            service.setOrderPerson = function (cartId) {
                var promises = [];

                // Now try to get the replicated site owner for this customer
                promises.push(service.getReplicatedSiteOwner());

                $q.all(promises).then(function (result) {
                    if (cartId != null) {
                        return $http.post(apiRoot + 'api/Shopping/SetOrderPerson?cartId=' + cartId).then(
                            function (results) {
                                // success
                            });
                    }
                });
            }

            service.setCurrentPerson = function (cartId) {
                if (cartId != null) {
                    return $http.post(apiRoot + 'api/Shopping/SetCurrentPerson?cartId=' + cartId).then(
                        function (results) {
                            // success
                        });
                }
            }

            service.getReplicatedSiteOwner = function () {
                return $http.get(apiRoot + 'api/Shopping/GetReplicatedSiteOwnerUrl').then(
                    function (result) {
                        // The "idstc_setting_corporateconsultanturl" variable is written to page via the php_vars.js (wordpress method of getting server variables to client script).
                        // We will default to the corporate site owner when the newly-logged-in customer's replicated site owner can't be found or is not active (BlockWebsite flag is true).
                        var url = idstc_setting_corporateconsultanturl;

                        if (result.data != null && result.data != '') {
                            url = result.data;
                        }

                        return service.getConsultant(url);
                    });
            }

            service.getAPIToken = function () {
                service.apiToken = idstc().getExpirableLocalStorageVar('Authorization', 1440);
                existingLanguageCode = localStorage.getItem('languageCode');

                // language code comes from polylang and is stored in php_vars variable
                // the first 2 digits should match the language code in idstc
                if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
                    languageCode = php_vars.languageCode.substring(0, 2);
                }

                if (languageCode != null && languageCode != existingLanguageCode) {
                    if (!service.loggedIn) {
                        service.apiToken = null;
                    }                    
                    sessionStorage.removeItem('translations');
                    sessionStorage.removeItem('displayCategories');
                }

                var existingCountryCode = localStorage.getItem('countryCode');

                // country code comes from polylang and is stored in php_vars variable
                // the last 2 digits should match the country code abbreviation in idstc
                if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
                    countryCode = php_vars.languageCode.substring(3, 5);
                }

                if (existingCountryCode != countryCode) {
                    localStorage.removeItem('CartID');
                    localStorage.removeItem('CustomerCartID');
                    localStorage.removeItem('JoinCartID');
                    localStorage.removeItem('CartItemQuantity');
                    localStorage.removeItem('provinceID');
                }

                if (service.getAPITokenPromise) {
                    return service.getAPITokenPromise;
                }
                else if (service.apiToken) {
                    return;
                }

                service.getAPITokenPromise = service.getAPITokenFromServer();

                return service.getAPITokenPromise;
            }

            service.getAPITokenFromServer = function () {
                var url = apiRoot + 'api/WebsiteSession/GetBaseSiteData?languageCode=' + languageCode;
                if (idstc_setting_businessunitsenabled) {
                    var businessUnitID = sessionStorage.getItem('businessUnitID');
                    if (typeof businessUnitID != 'undefined' && businessUnitID != null && businessUnitID != '') {
                        url = url + '&businessUnitID=' + businessUnitID;
                    }
                }
                return $http.get(url).then(
                    function (successResult) {
                        var dto = successResult.data;

                        var apiJSONObject = $.parseJSON(dto.APIToken); // needs to be parsed to remove "Access_Token" stuff;
                        service.apiToken = apiJSONObject.access_token;
                        idstc().setExpirableLocalStorageVar('Authorization', service.apiToken);

                        localStorage.setItem('languageCode', languageCode);

                        service.storeCountries(dto.Countries);
                        service.storeCurrencyTypes(dto.CurrencyTypes);
                        service.storeDateFormat(dto.DateFormat);
                        service.storeTimeFormat(dto.TimeFormat);
                        service.storeUTCOffset(dto.UTCOffset);

                        var existingCountryCode = localStorage.getItem('countryCode');
                        // country code comes from polylang and is stored in php_vars variable
                        // the last 2 digits should match the country code abbreviation in idstc
                        if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
                            countryCode = php_vars.languageCode.substring(3, 5);
                        }

                        // if has not changed then just set new person (possibly anonymous) on order
                        // otherwise, clear cart info which will allow new cart to be created
                        if (existingCountryCode == countryCode) {
                            var cartId = idstc().getExpirableLocalStorageVar('CartID', 1440);
                            if (typeof cartId != 'undefined' && cartId != null && cartId != '') {
                                $http.defaults.withCredentials = true;
                                $http.defaults.headers.common['Authorization'] = "bearer " + service.apiToken;
                                return service.setCurrentPerson(cartId);
                            }
                        }
                        else {
                            localStorage.setItem('countryCode', countryCode);
                            localStorage.removeItem('provinceID');
                        }
                    });
            }

            service.getConsultant = function (replSite) {
                if (replSite != null && replSite != '' && replSite != 'null') {
                    if (service.getConsultantPromise) {
                        return service.getConsultantPromise;
                    }

                    service.getConsultantPromise = service.getConsultantFromServer(replSite);

                    return service.getConsultantPromise;
                }
            }

            service.getConsultantFromServer = function (replSite) {
                return $http.post(apiRoot + 'api/Website/GetConsultantReplicationSiteInfo?url=' + replSite).then(
                    function (successResult) {
                        service.setConsultant(successResult.data);
                        service.getConsultantPromise = null;
                        return;
                    });
            }

            service.getDefaultBusinessUnitID = function () {
                var businessUnitID = sessionStorage.getItem('businessUnitID');

                if (service.businessUnitIDPromise) {
                    return service.businessUnitIDPromise;
                }

                if (typeof businessUnitID == 'undefined' || businessUnitID == null || businessUnitID != '') {
                    service.businessUnitIDPromise = service.getAndStoreBusinessUnitID();
                }

                return service.businessUnitIDPromise;
            }

            service.getAndStoreBusinessUnitID = function () {
                return $http.get(apiRoot + 'api/Website/GetDefaultBusinessUnitID').then(
                    function (successResult) {
                        sessionStorage.setItem('businessUnitID', successResult.data);
                    });
            }

            service.convertJsonToUrlEncoded = function (obj) {
                var str = [];
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
                    }
                }
                return str.join('&');
            }

            service.loginPortal = function () {
                var url = apiRoot + 'api/CustomerPortal/LoginPortal';

                // Generate a new external login provider key for the currently logged in customer via the API
                $http.post(url, null).then(
                    function (resp) {
                        var loginRootPath = customerPortalRootPath;
                        var loginForm = document.getElementById('loginPortalForm');

                        if (loginForm != null) {
                            // Update form inputs and then programmatically post the hidden form to push user to portal
                            document.getElementById('IDSTCPortalProviderKey').value = resp.data.ProviderKey;
                            document.getElementById('IDSTCPortalUserId').value = resp.data.UserId;

                            loginForm.action = loginRootPath + 'Account/ExternalLoginRedirect';
                            loginForm.submit();
                        }

                        $(document).progressFinish();
                    },
                    function (err) {
                        idstc().notifyServerResponse(err.data);
                        $(document).progressFinish();
                    });
            }

            service.setConsultant = function (consultant) {
                localStorage.setItem('replicatedSiteUrl', consultant.Url);
                sessionStorage.setItem('consultant', JSON.stringify(consultant));
                sessionStorage.setItem('businessUnitID', consultant.BusinessUnitID);
                service.consultant = consultant;
            }

            service.getCurrencyTypes = function (force) {
                var currencyTypes = JSON.parse(localStorage.getItem('CurrencyTypes'));

                if (service.currencyTypePromise) {
                    return service.currencyTypePromise;
                }

                if (currencyTypes != null) {
                    var diffTime = new Date().getTime() - currencyTypes.dateTime;
                    var diffInMinutes = Math.floor(diffTime / 1000 / 60); //get minutes from time

                    if (diffInMinutes >= 30 && !force) { //cache for 30 minutes
                        service.currencyTypePromise = service.getCurrencyTypes(true);
                    };

                    if (localStorage.getItem('CurrencyTypes') == null || !currencyTypes.dateTime || force) { //reset currency types
                        service.currencyTypePromise = service.getAndStoreCurrencyTypes();
                    }
                }
                else {
                    service.currencyTypePromise = service.getAndStoreCurrencyTypes();
                }

                return service.currencyTypePromise;
            }

            service.getAndStoreCurrencyTypes = function () {
                return $http.get(apiRoot + 'api/CurrencyTypes/GetCurrencyTypes').then(
                    function (successResult) {
                        service.storeCurrencyTypes(successResult.data);
                    });
            }

            service.storeCurrencyTypes = function (currencyTypes) {
                var valueToSave = {
                    currencyTypes: currencyTypes,
                    dateTime: new Date().getTime()  //set timestamp for cache
                };

                localStorage.setItem('CurrencyTypes', JSON.stringify(valueToSave));
            }

            service.getCountries = function (force) {
                var countries = JSON.parse(localStorage.getItem('Countries'));

                if (service.countryPromise) {
                    return service.countryPromise;
                }

                if (countries != null) {
                    var diffTime = new Date().getTime() - countries.dateTime;
                    var diffInMinutes = Math.floor(diffTime / 1000 / 60); //get minutes from time

                    if (diffInMinutes >= 30 && !force) { //cache for 30 minutes
                        service.countryPromise = service.getCountries(true);
                    };

                    if (localStorage.getItem('Countries') == null || !countries.dateTime || force) { //reset currency types
                        service.countryPromise = service.getAndStoreCountries();
                    }
                }
                else {
                    service.countryPromise = service.getAndStoreCountries();
                }

                return service.countryPromise;
            }

            service.getAndStoreCountries = function () {
                return $http.get(apiRoot + 'api/CountryProvinces/GetCountriesForDropdown').then(
                    function (successResult) {
                        service.storeCountries(successResult.data);
                    });
            }

            service.storeCountries = function (countries) {
                var valueToSave = {
                    countries: countries,
                    dateTime: new Date().getTime()  //set timestamp for cache
                };

                localStorage.setItem('Countries', JSON.stringify(valueToSave));
            }

            service.getDateFormat = function (force) {
                var format = JSON.parse(localStorage.getItem('DateFormatString'));

                if (service.dateFormatPromise) {
                    return service.dateFormatPromise;
                }

                if (format != null) {
                    var diffTime = new Date().getTime() - format.dateTime;
                    var diffInMinutes = Math.floor(diffTime / 1000 / 60); //get minutes from time

                    if (diffInMinutes >= 30 && !force) { //cache for 30 minutes
                        service.dateFormatPromise = service.getDateFormat(true);
                    };

                    if (localStorage.getItem('DateFormatString') === undefined || !format.dateTime || force) { //reset UTC offset
                        service.dateFormatPromise = service.getAndStoreDateFormat();
                    }
                }
                else {
                    service.dateFormatPromise = service.getAndStoreDateFormat();
                }

                return service.dateFormatPromise;
            }

            service.getAndStoreDateFormat = function () {
                return $http.get(apiRoot + 'api/DateTime/GetDateFormatString').then(
                    function (successResult) {
                        service.storeDateFormat(successResult.data);
                    });
            }

            service.storeDateFormat = function (dateFormat) {
                var valueToSave = {
                    dateFormat: dateFormat,
                    dateTime: new Date().getTime()  //set timestamp for cache
                };

                localStorage.setItem('DateFormatString', JSON.stringify(valueToSave));
            }

            service.getUTCOffset = function (force) {
                var offset = JSON.parse(localStorage.getItem('UTCOffset'));

                if (service.utcOffsetPromise) {
                    return service.utcOffsetPromise;
                }

                if (offset != null) { //offset is in localstorage
                    var diffTime = new Date().getTime() - offset.dateTime;
                    var diffInMinutes = Math.floor(diffTime / 1000 / 60); //get minutes from time

                    if (diffInMinutes >= 30 && !force) { //cache offset value for this user for 30 minutes
                        service.utcOffsetPromise = service.getUTCOffset(true);
                    };

                    if (localStorage.getItem('UTCOffset') == null || !offset.dateTime || force) { //reset UTC offset
                        service.utcOffsetPromise = service.getAndStoreUTCOffset();
                    }
                } else { //offset is not in localStorage
                    service.utcOffsetPromise = service.getAndStoreUTCOffset();
                }

                return service.utcOffsetPromise;
            }

            service.getAndStoreUTCOffset = function () {
                return $http.get(apiRoot + 'api/DateTime/GetUTCOffset').then(
                    function (successResult) {
                        service.storeUTCOffset(successResult.data);
                    });
            }

            service.storeUTCOffset = function (utcOffset) {
                var valueToSave = {
                    offset: utcOffset,
                    dateTime: new Date().getTime()  //set timestamp for cache
                };

                localStorage.setItem('UTCOffset', JSON.stringify(valueToSave));
            }

            service.getTimeFormat = function (force) {
                var TimeFormat = JSON.parse(localStorage.getItem('TimeFormat'));

                if (service.timeFormatPromise) {
                    return service.timeFormatPromise;
                }

                if (TimeFormat != null) { //permissions are in localStorage
                    var diffTime = new Date().getTime() - TimeFormat.dateTime;
                    var diffInMinutes = Math.floor(diffTime / 1000 / 60); //get minutes from time

                    if (diffInMinutes >= 30 && !force) { //cache permissions for this user for 30 minutes
                        service.timeFormatPromise = service.getTimeFormat(true);
                    };

                    if (localStorage.getItem('TimeFormat') == null || !TimeFormat.dateTime || force) { //reset UTC offset
                        service.timeFormatPromise = service.getAndStoreTimeFormat();
                    }
                }
                else { //currency types are not in localStorage
                    service.timeFormatPromise = service.getAndStoreTimeFormat();
                }

                return service.timeFormatPromise;
            }

            service.getAndStoreTimeFormat = function () {
                return $http.get(apiRoot + 'api/DateTime/GetTimeFormat').then(
                    function (successResult) {
                        service.storeTimeFormat(successResult.data);
                    });
            }

            service.storeTimeFormat = function (timeFormat) {
                var valueToSave = {
                    timeFormat: timeFormat,
                    dateTime: new Date().getTime()  //set timestamp for cache
                };

                localStorage.setItem('TimeFormat', JSON.stringify(valueToSave));
            }

            service.renderHTML = function (html_code) {
                return $sce.trustAsHtml(html_code);
            };

            return service;
        })
        .directive('testDirective', function () {
            return function (scope, elem) {
                $(elem).text('Directives also work');
            }
        });

    // Load html file with content which uses above content
    $('body').attr('ng-controller', 'siteController as siteCtrl');
    $('body').addClass('non-replicated');

    $('<div class="body slide" id="SlideBody"><div class="sidebar-wrapper" id="sidebar-wrapper"><span id="notification-wrapper"></span></div></div><div id="screen-overlay"></div><div class="loader"><div class="cp-spinner cp-round"></div><span class="sr-only">Loading...</span></div>').prependTo('body');

    // Bootstrap app
    angular.bootstrap($('body'), ['app']);

    // Register the controls/directives/services we just loaded
    var queue = angular.module('app')._invokeQueue;
    for (var i = queueLen; i < queue.length; i++) {
        var call = queue[i];
        // call is in the form [providerName, providerFunc, providerArguments]
        var provider = providers[call[0]];
        if (provider) {
            // e.g. $controllerProvider.register("Ctrl", function() { ... })
            provider[call[1]].apply(provider, call[2]);
        }
    }

    // compile the new element
    $('body').injector().invoke(function ($compile, $rootScope) {
        // CMH:  I thought this would be needed to force the dynamic site-wide angular "app" to compile...but this does not appear to be the case (it is actually causing)
        //$compile($('body'))($rootScope);
        //$rootScope.$apply();
    });
});

// Polyfill for "startsWith" for Internet Explorer
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

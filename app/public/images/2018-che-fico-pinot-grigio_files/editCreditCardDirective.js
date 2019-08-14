
angular.module('app')
    .directive('editCreditCard', function ($q, $http, $parse, securityService, translationService, $sce, $window, $location, appService) {
        return {
            restrict: 'E',
            scope: {
                card: '=card',  // The other information this form is editing
                securityContext: '=?securityContext',   // The security context under which to operate                            
                validationContext: '=?validationContext',  // The validation context (form) under which to operate
                showDefaultField: '=?showDefaultField',  // Set to true to show the "Set as Default" field
                disableDefaultField: '=?disableDefaultField', // Set to true to disable the "Set as Default" field - This would be when editing the card that is currently set as default for a person
                addressToCopy: "=?addressToCopy",  // Pass true if there is a corresponding address that can be copied
                displayCvv: "=?displayCvv", // Pass true to show the CVV field
                showTwoColumns: "=?showTwoColumns", // Pass true to show the address directive in a second column
                setHostedProfilePageUrlFn: '&',  // Function to call to get information to send when getting the hosted profile page (if being used)
                setSubmitHostedProfilePageFn: '&', // Function to submit the hosted profile page (if being used)
                continueSaveProcessFn: '&', // Function to call after the host profile page responds with a token
                addressConfirmed: '=?addressConfirmed',
                displayOnlyMode: '=?displayOnlyMode'
            },
            template: '<div ng-show="dataReady"> <help-text key="credit-card-hosted-profile-page-instructions" ng-if="hostedProfilePageInfo.HostedProfilePageToken != null && !displayOnlyMode"></help-text> <div class="form-group name-on-card-field" ng-if="!NameOnCardNoAccess && (hostedProfilePageInfo.HostedProfilePageToken == null || displayOnlyMode)"> <label class="control-label col-md-4"> <translate-content container="credit-card" key="name-on-card" default-content="Name On Card"></translate-content> <span class="text-danger required-mark" ng-show="NameOnCardRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="cc-name" ng-model="card.NameOnCard" ng-disabled="NameOnCardReadonly" name="NameOnCard" id="NameOnCard" ng-required="NameOnCardRequired" ng-if="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{card.NameOnCard}}</p> </div> </div> <div class="form-group card-number-field" ng-if="!CardNumberNoAccess && (hostedProfilePageInfo.HostedProfilePageToken == null || displayOnlyMode)"> <label class="control-label col-md-4"> <translate-content container="credit-card" key="card-number" default-content="Card Number"></translate-content> <span class="text-danger required-mark" ng-show="CardNumberRequired">*</span> </label> <div class="col-md-8"> <input type="text" pattern="[0-9]{13,16}" ng-change="cardNumberChanged()" class="form-control" autocomplete="cc-number" ng-model="card.CardNumber" ng-disabled="CardNumberReadonly" maxlength="16" name="CardNumber" id="CardNumber" ng-required="CardNumberRequired" ng-if="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">**** **** **** {{card.CardNumber | getLastFour}}</p> </div> </div> <div class="form-group card-type-field" ng-if="!CreditCardTypeIDNoAccess && (hostedProfilePageInfo.HostedProfilePageToken == null || displayOnlyMode)"> <div class="col-sm-offset-4 col-sm-8"> <div ng-repeat="ccType in ccTypes" class="CreditCardIcon" ng-click="ccType_Clicked(ccType)" ng-class="ccType.Selected ? \'{{ccType.Value}}_Selected\' : \'{{ccType.Value}}\'"></div> </div> </div> <div class="form-group display-number-field" ng-if="!DisplayNumberNoAccess && CardNumberNoAccess && (hostedProfilePageInfo.HostedProfilePageToken == null || displayOnlyMode)"> <label class="control-label col-md-4"> <translate-content container="credit-card" key="display-number" default-content="Display Number"></translate-content> </label> <div class="col-md-8"> <input type="text" class="form-control" ng-model="card.DisplayNumber" ng-disabled="true" /> </div> </div> <div class="form-group expiration-date-field" ng-if="!ExpirationDateNoAccess && (hostedProfilePageInfo.HostedProfilePageToken == null || displayOnlyMode)"> <label class="control-label col-md-4"> <translate-content container="credit-card" key="expiration-date" default-content="Expiration Date"></translate-content> <span class="text-danger required-mark" ng-show="ExpirationDateRequired">*</span> </label> <div class="col-md-8 form-inline"> <select class="form-control cc-exp-month-input" id="ExpirationMonth" autocomplete="cc-exp-month" name="ExpirationMonth" ng-disabled="ExpirationDateReadonly" ng-required="ExpirationDateRequired" ng-change="valCreditCardExp()" ng-model="card.ExpirationMonth" ng-options="o as o for o in expirationMonthOptions" ng-if="!displayOnlyMode"></select> <div class="padding-sm visible-xs"></div> <select class="form-control cc-exp-year-input" id="ExpirationYear" autocomplete="cc-exp-year" name="ExpirationYear" ng-disabled="ExpirationDateReadonly" ng-required="ExpirationDateRequired" ng-change="valCreditCardExp()" ng-model="card.ExpirationYear" ng-options="o.value as o.name for o in expirationYearOptions" ng-if="!displayOnlyMode"></select> <div ng-show="form.ExpirationYear.$error.min"> <div class="padding-xs"></div> <span class="text-danger"><translate-content container="credit-card" key="ExpirationDateVal" default-content="Expiration Date Must be a date in the future"></translate-content></span> </div> <p ng-show="displayOnlyMode" class="form-control-static">{{card.ExpirationMonth}}/{{card.ExpirationYear}}</p> </div> </div> <div class="form-group cvv-field" ng-if="displayCvv && hostedProfilePageInfo.HostedProfilePageToken == null && !displayOnlyMode"> <label class="control-label col-md-4"> <translate-content container="credit-card" key="cvv" default-content="CVV"></translate-content> <span class="text-danger required-mark" ng-show="CVVRequired">*</span> </label> <div class="clearfix visible-sm visible-xs"></div> <div class="col-md-8 form-inline text-right-xs"> <input type="tel" id="CVV" name="CVV" class="form-control" autocomplete="cc-csc" ng-model="card.CVV" ng-disabled="CVVReadonly" ng-required="CVVRequired" max="4" min="000" minlength="3" maxlength="4" pattern="\\d*" /> <div class="padding-xs visible-xs"></div> <a ng-click="cvvWindow.open(); cvvWindow.center();"><i class="fa fa-fw fa-question-circle" aria-hidden="true"></i></a> </div> </div> <div class="form-group set-default-cc-field" ng-if="showDefaultField && !DefaultPaymentMethodNoAccess"> <label class="control-label col-md-4"><translate-content container="credit-card" key="set-as-default" default-content="Set as Default"></translate-content></label> <div class="col-md-8"> <input type="checkbox" ng-model="card.DefaultPaymentMethod" ng-disabled="DefaultPaymentMethodReadonly || disableDefaultField" name="DefaultPaymentMethod" id="DefaultPaymentMethod" /> </div> </div> <div class="text-center"> <button type="button" class="btn btn-primary btn-copy-shipping-address" ng-click="copyAddress()" ng-if="addressToCopy != null && !addressConfirmed"> <i class="fa fa-fw fa-clipboard" aria-hidden="true"></i> <translate-content container="credit-card" key="copy-shipping-address" default-content="Copy Shipping Address"></translate-content> </button> <div class="padding-xs"></div> </div> <edit-address address="card.Address" address-type="billing" security-context="securityContext" validation-context="validationContext" show-special-instructions-field="false" show-valid-field="false" ng-show="!addressConfirmed"> </edit-address> <div ng-show="addressConfirmed"> <label class="control-label col-md-4"> <translate-content container="credit-card" key="billing-address" default-content="Billing Address"></translate-content> </label> <div class="col-md-8"> <p class="form-control-static"> <read-only-address address="card.Address" display-name="{{card.Address.FirstName + \' \' + card.Address.LastName}}"> </read-only-address> </p> </div> </div> <div class="clearfix"></div> <div class="panel panel-success hosted-payment-panel" ng-show="hostedProfilePageInfo.HostedProfilePageToken != null && addressConfirmed && !displayOnlyMode"> <div class="panel-heading"> <h3 class="panel-title text-right"> <translate-content container="credit-card" key="secure-payment-form" default-content="Secure Payment Form"></translate-content> <i class="fa fa-fw fa-lock" aria-hidden="true"></i> </h3> </div> <div class="panel-body hosted-payment-panel"> <div class="hosted-profile-page-blocker" ng-if="hostedProfilePageInfo.HostedProfilePageToken != null && card.ProfilePaymentToken!=null && addressConfirmed"></div> <iframe class="hosted-profile-page" id="creditCardHostedProfilePageFrm" type="text/html" ng-src="{{hostedProfilePageUrl}}"></iframe> </div> </div></div><div kendo-window="cvvWindow" k-title="translationService.Translations[\'credit-card\'][\'what-is-cvv\'] || \'What is CVV?\'" k-width="505" k-visible="false" k-on-open="cvvWindowvisible = true" k-on-close="cvvWindowvisible = false" class="cvv-window-field"> <translate-content container="credit-card" key="cvv-explanation" default-content="CVV stands for Credit Card Verification Value. The CVV is a 3 or 4 digit code embossed or imprinted on the signature panel on the reverse side of Visa, MasterCard and Discover cards and on the front of American Express cards. This code is used as an extra security measure to ensure that you have access and/or physical possession of the credit card itself."></translate-content></div>',
            require: ['^form'],
            link: function (scope, element, attrs, ctrls) {
                scope.form = ctrls[0];
                scope.dataReady = false;

                if (scope.showTwoColumns == null) scope.showTwoColumns = true;

                if (scope.card == null) scope.card = {};
                if (scope.displayOnlyMode == null) {
                    scope.addressConfirmed = false;
                }
                if (scope.displayOnlyMode == null) {
                    scope.displayOnlyMode = false;
                }

                scope.hostedProfilePageInfo = null;
                scope.eventHostedProfilePageListenerCreated = false;

                scope.translationService = translationService;

                scope.expirationMonthOptions = [
                    '01',
                    '02',
                    '03',
                    '04',
                    '05',
                    '06',
                    '07',
                    '08',
                    '09',
                    '10',
                    '11',
                    '12'
                ];

                scope.expirationYearOptions = [];

                var currentYear = (new Date().getFullYear()).toString().substring(2);
                var currentMonth = new Date().getMonth();

                var yearPlusTwenty = Number(currentYear) + 20;
                for (var i = currentYear; i <= yearPlusTwenty; i++) {
                    scope.expirationYearOptions.push({ 'name': '20' + i.toString(), 'value': i.toString() });
                }

                scope.$on("person.loaded", function (e, person) {
                    scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                    securityService.setSecurity(scope.securityContext, scope);
                    securityService.setValidation(scope.validationContext, scope);
                    scope.setExpirationDate();
                });

                scope.minExpDate = new Date('20' + currentYear, currentMonth, 1);

                scope.$watch('card', function (value) {
                    if (typeof scope.card != 'undefined' && scope.card != null) {
                        $(document).progressStart();
                        if (typeof scope.card.BusinessUnitID != 'undefined') {
                            scope.BusinessUnitID = scope.card.BusinessUnitID;
                            if (typeof scope.card.Address != 'undefined') {
                                scope.card.Address.BusinessUnitID = scope.card.BusinessUnitID;
                            }
                        }

                        var promises = [securityService.setSecurity(scope.securityContext, scope), securityService.setValidation(scope.validationContext, scope)];

                        $q.all(promises).then(function () {
                            scope.getHostedProfilePageUrl();
                        });
                    }
                });

                scope.$watch('displayOnlyMode', function (value) {
                    if (typeof value != undefined && value) {
                        scope.addressConfirmed = true;
                    }
                });

                scope.setExpirationDate = function () {
                    if (scope.card != null) {
                        if (scope.card.ExpirationMonth == null) {
                            var pad = '00';
                            var workingMonth = (currentMonth + 1).toString();
                            workingMonth = pad.substring(0, pad.length - workingMonth.length) + workingMonth;
                            scope.card.ExpirationMonth = workingMonth;
                        }
                        if (scope.card.ExpirationYear == null) {
                            scope.card.ExpirationYear = currentYear.toString();
                        }

                        scope.valCreditCardExp();
                    }
                }

                scope.initNonhostedProfilePage = function () {
                    scope.card.useHostedProfilePage = false;

                    var promises = [scope.getCreditCardTypes()];

                    $q.all(promises).then(function () {
                        scope.setExpirationDate();
                        scope.setSelectedCCType();

                        scope.dataReady = true;
                        $(document).progressFinish();
                    });
                }

                scope.copyAddress = function () {
                    $(document).progressStart();

                    var originalAddressId = scope.card.Address.AddressID;
                    scope.card.Address = angular.copy(scope.addressToCopy);
                    scope.card.Address.AddressID = originalAddressId;

                    $(document).progressFinish();
                }

                scope.getCreditCardTypes = function () {
                    if (typeof scope.ccTypes == 'undefined' || scope.ccTypes == null) {
                        return $http.get(apiRoot + 'api/Translation/GetEnabledCreditCardTypes').then(
                            function (resp) {
                                scope.ccTypes = resp.data;

                                for (var i = 0; i < scope.ccTypes.length; i++) {
                                    scope.ccTypes[i].Value = scope.ccTypes[i].Value.replace(" ", "");
                                }
                            },
                            function (error) {
                                idstc().processError({ error: error, showNotifications: true });
                            }
                        );
                    }
                }

                scope.setSelectedCCType = function () {
                    if (scope.ccTypes && scope.card) {
                        for (var i = 0; i < scope.ccTypes.length; i++) {
                            if (scope.ccTypes[i].Key == scope.card.CreditCardTypeID) {
                                scope.ccTypes[i].Selected = true;
                            }
                            else {
                                scope.ccTypes[i].Selected = false;
                            }
                        }
                    }
                }

                scope.valCreditCardExp = function () {
                    var expDate = new Date('20' + scope.card.ExpirationYear, scope.card.ExpirationMonth - 1, 28);

                    if (expDate < scope.minExpDate) {
                        if (scope.form.ExpirationMonth) scope.form.ExpirationMonth.$setValidity('min', false);
                        if (scope.form.ExpirationYear) scope.form.ExpirationYear.$setValidity('min', false);
                        scope.card.ExpirationDate = null;
                    }
                    else {
                        if (scope.form.ExpirationMonth) scope.form.ExpirationMonth.$setValidity('min', true);
                        if (scope.form.ExpirationYear) scope.form.ExpirationYear.$setValidity('min', true);
                        scope.card.ExpirationDate = expDate;
                    }
                }

                scope.cardNumberChanged = function () {
                    $("#CardNumber").attr('maxlength', '16');

                    if (scope.card.CardNumber) {
                        var allowedCardTypes = [];
                        for (var i = 0; i < scope.ccTypes.length; i++) {
                            allowedCardTypes.push(scope.ccTypes[i].Key);
                        };
                        var result = idstc().validation.getCreditCardType(scope.card.CardNumber, allowedCardTypes);

                        if (result) {
                            scope.card.CreditCardTypeID = result.id;

                            if (scope.card.CreditCardTypeID == 3) {
                                // For AMEX (American Express) card type, only allow 15 digits
                                $("#CardNumber").attr('maxlength', '15');
                            }
                        }
                        else {
                            scope.card.CreditCardTypeID = 0;
                        }
                    }
                    else {
                        scope.card.CreditCardTypeID = 0;
                    }

                    scope.setSelectedCCType();
                }

                scope.ccType_Clicked = function (ccType) {
                    if (!scope.CreditCardTypeIDReadonly) {
                        scope.card.CreditCardTypeID = ccType.Key;
                        scope.setSelectedCCType();
                    }
                }

                scope.getHostedProfilePageUrl = function () {
                    if (typeof scope.card.Address != 'undefined') {
                        scope.hostedProfilePageInfo = {};
                        scope.dataReady = false;
                        scope.hostedProfilePageUrl = "";

                        var businessUnitID = null;
                        if (typeof scope.businessUnitID != 'undefined') {
                            businessUnitID = scope.businessUnitID;
                        }

                        var RequireCvv = false;
                        if (typeof scope.CVVRequired != 'undefined') {
                            RequireCvv = scope.CVVRequired;
                        }

                        var ShowCvv = true;
                        if (typeof scope.displayCvv != 'undefined') {
                            ShowCvv = scope.displayCvv;
                        }
                        if (typeof scope.CVVNoAccess != 'undefined') {
                            ShowCvv = !scope.CVVNoAccess;
                        }

                        var customCartTheme = null;
                        if (typeof idstc_setting_customcarttheme != 'undefined') {
                            customCartTheme = idstc_setting_customcarttheme;
                        }

                        var postVar = {
                            BusinessUnitID: businessUnitID,
                            Address: angular.copy(scope.card.Address),
                            CssFile: customCartTheme,
                            RequireCvv: RequireCvv,
                            ShowCvv: ShowCvv,
                            GatewayTypeID: 3  // credit card
                        };

                        if (typeof scope.card.NameOnCard != 'undefined' && scope.card.NameOnCard != null && scope.card.NameOnCard.length != 0) {
                            postVar.Address.DisplayName = scope.card.NameOnCard;
                        }

                        return $http.post(apiRoot + "api/Shopping/GetHostedProfilePageToken", postVar).then(
                            function (resp) {
                                if (resp.data != null && resp.data.HostedProfilePageUrl != null && resp.data.HostedProfilePageUrl.length > 0) {

                                    scope.hostedProfilePageInfo = resp.data;
                                    scope.hostedProfilePageUrl = $sce.trustAsResourceUrl(scope.hostedProfilePageInfo.HostedProfilePageUrl);
                                    scope.card.useHostedProfilePage = true;
                                    scope.card.ProfilePaymentToken = null;
                                }
                                else {
                                    scope.initNonhostedProfilePage();
                                }
                            },
                            function (error) {
                                $(document).progressFinish();
                                idstc().processError({ error: error, showNotifications: true });
                            }
                        );
                    }
                    else {
                        $(document).progressFinish();
                    }
                }

                scope.setHostedProfilePageUrlFn({ theSetDirFn: scope.getHostedProfilePageUrl });

                scope.submitHostedProfilePage = function () {
                    if (scope.card.useHostedProfilePage && (typeof scope.card.HostedProfilePageToken == 'undefined' || scope.card.HostedProfilePageToken == null)) {
                        var iFrame = window.document.getElementById('creditCardHostedProfilePageFrm');
                        iFrame.contentWindow.postMessage('posted', scope.hostedProfilePageInfo.HostedProfilePageDomain);
                    }
                    else {
                        $(document).progressStart();
                        scope.continueSaveProcessFn();
                    }
                }

                scope.setSubmitHostedProfilePageFn({ theSubmitDirFn: scope.submitHostedProfilePage });

                scope.init = function () {
                    var promises = [appService.makeReady()];
                    $q.all(promises).then(function (result) {
                        promises[translationService.getTranslations('credit-card')];
                        $q.all(promises).then(function (result) {
                            scope.getCreditCardTypes();
                        });                        
                    });
                }

                scope.windowEventMessageReceived = function (event) {
                    if (scope.hostedProfilePageInfo != null && event.origin === scope.hostedProfilePageInfo.HostedProfilePageDomain && event.data.event == 'cardSaved') {
                        $(document).progressStart();

                        // if successful, add the information to the card object and call the continueSaveProcess() so the 
                        // controller using the directive can save the rest of the information.
                        for (var i = 0; i < scope.ccTypes.length; i++) {
                            if (scope.ccTypes[i].Value.toLowerCase() == event.data.data.cardType.toLowerCase()) {
                                scope.card.CreditCardTypeID = scope.ccTypes[i].Key;
                                break;
                            }
                            else { // have to handle american express seperately.. you have to send 'amex' as the type but they return 'americanexpress' 
                                if (event.data.data.cardType.toLowerCase() == 'americanexpress' && scope.ccTypes[i].Value.toLowerCase() == 'amex') {
                                    scope.card.CreditCardTypeID = scope.ccTypes[i].Key;
                                    break;
                                }
                            }
                        }

                        // split the cardholder name for the first and last name of the address.  the cms iframe does not have seperate fields in the iframe

                        var cardHolderNameArray = event.data.data.card.cardHolderName.split(' ');
                        var firstName = '';
                        var lastName = '';
                        if (cardHolderNameArray.length == 1) {
                            lastName = event.data.data.card.cardHolderName;
                        }
                        else {
                            if (cardHolderNameArray.length > 1) {
                                firstName = cardHolderNameArray[0];
                                for (var i = 1; i < cardHolderNameArray.length; i++) {
                                    if (lastName == '') {
                                        lastName = cardHolderNameArray[i];
                                    }
                                    else {
                                        lastName = lastName + ' ' + cardHolderNameArray[i];
                                    }
                                }
                            }
                        }

                        scope.card.DisplayNumber = event.data.data.token.lastFour;
                        scope.card.NameOnCard = event.data.data.card.cardHolderName;
                        scope.card.ExpirationMonth = event.data.data.card.expirationMonth;
                        scope.card.ExpirationYear = event.data.data.card.expirationYear;
                        scope.card.ExpirationDate = new Date(event.data.data.card.expirationYear, event.data.data.card.expirationMonth - 1, 1);
                        scope.card.ProfilePaymentToken = event.data.data.token.token;
                        scope.card.Address.FirstName = firstName;
                        scope.card.Address.LastName = lastName;
                        scope.card.Address.Street1 = event.data.data.data.customer.billToAddressOne;
                        scope.card.Address.Street2 = event.data.data.data.customer.billToAddressTwo;
                        scope.card.Address.City = event.data.data.data.customer.billToCity;
                        scope.card.Address.ProvinceAbbreviation = event.data.data.data.customer.billToState;
                        scope.card.Address.ProvinceID = null;
                        scope.card.Address.PostalCode = event.data.data.data.customer.billToPostal;
                        scope.card.Address.CountryTwoLetterISO = event.data.data.data.customer.billToCountry;
                        scope.card.Address.CountryID = null;
                        scope.card.GatewayInfoID = scope.hostedProfilePageInfo.GatewayInfoID;

                        var postVar = {
                            RequestSent: idstc().translate('credit-card', 'CreditCardIFrameRequest', 'Credit Card IFrame Request'),
                            Action: idstc().translate('credit-card', 'SubmitSaveCardIframe', 'Submit Save Card Iframe'),
                            ProcessingUrl: scope.hostedProfilePageInfo.HostedProfilePageUrl,
                            PaymentProfileToken: scope.card.ProfilePaymentToken,
                            ResponseReceived: JSON.stringify(event.data.data),
                            GatewayInfoID: scope.hostedProfilePageInfo.GatewayInfoID,
                            ReferenceId: event.data.data.token.customerRefNumber
                        };

                        $http.post(apiRoot + "api/Shopping/LogGatewayConversation", postVar).then(
                            function (resp) {
                                // do nothing.. success or failure does not matter for the sake of the user.
                            }
                        );

                        scope.continueSaveProcessFn();
                    }

                    if (scope.hostedProfilePageInfo != null && event.origin === scope.hostedProfilePageInfo.HostedProfilePageDomain && event.data.event == 'error') {
                        scope.getHostedProfilePageUrl();
                        idstc().dialog({ type: 'alert', message: idstc().translate('credit-card', 'InvalidCreditCardInfo', 'Your credit card information is invalid.  Please re-enter and try again.'), title: '', success: 'error' });

                        var postVar = {
                            RequestSent: idstc().translate('credit-card', 'CreditCardIFrameRequest', 'Credit Card IFrame Request'),
                            Action: idstc().translate('credit-card', 'SubmitSaveCardIframe', 'Submit Save Card Iframe'),
                            ProcessingUrl: scope.hostedProfilePageInfo.HostedProfilePageUrl,
                            ErrorCode: event.data.data.error,
                            ResponseReceived: JSON.stringify(event.data.data),
                            ErrorText: event.data.data.message,
                            GatewayInfoID: scope.hostedProfilePageInfo.GatewayInfoID
                        };

                        $http.post(apiRoot + "api/Shopping/LogGatewayConversation", postVar).then(
                            function (resp) {
                                // do nothing.. success or failure does not matter for the sake of the user.
                            }
                        );

                        $(document).progressFinish();
                    }

                    if (scope.hostedProfilePageInfo != null && event.origin === scope.hostedProfilePageInfo.HostedProfilePageDomain && event.data.event == 'loaded') {
                        scope.dataReady = true;
                        scope.$apply();
                        $(document).progressFinish();

                    }

                    if (scope.hostedProfilePageInfo != null && event.origin === scope.hostedProfilePageInfo.HostedProfilePageDomain && event.data.event == 'formValidations') {
                        $(document).progressFinish();

                    }
                }

                $window.addEventListener('message', scope.windowEventMessageReceived);

                scope.$on('$destroy', function () {
                    $window.removeEventListener('message', scope.windowEventMessageReceived);
                });

                scope.init();
            },
        };
    });
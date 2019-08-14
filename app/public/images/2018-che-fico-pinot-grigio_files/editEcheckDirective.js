
angular.module('app')
    .directive('editEcheck', function ($q, $http, $parse, securityService, translationService, $sce, $window, $location, appService) {
        return {
            restrict: 'E',
            scope: {
                echeck: '=echeck',  // The other information this form is editing
                securityContext: '=?securityContext',   // The security context under which to operate                            
                validationContext: '=?validationContext',  // The validation context (form) under which to operate
                showDefaultField: '=?showDefaultField',  // Set to true to show the "Set as Default" field
                disableDefaultField: '=?disableDefaultField', // Set to true to disable the "Set as Default" field - This would be when editing the echeck that is currently set as default for a person
                addressToCopy: "=?addressToCopy",  // Pass true if there is a corresponding address that can be copied
                showTwoColumns: "=?showTwoColumns", // Pass true to show the address directive in a second column
                setHostedProfilePageUrlFn: '&',  // Function to call to get information to send when getting the hosted profile page (if being used)
                setSubmitHostedProfilePageFn: '&', // Function to submit the hosted profile page (if being used)
                continueSaveProcessFn: '&', // Function to call after the host profile page responds with a token
                addressConfirmed: '=?addressConfirmed',
                displayOnlyMode: '=?displayOnlyMode'
            },
            template: '<div ng-show="dataReady"><help-text key="echeck-hosted-profile-page-instructions" ng-if="hostedProfilePageInfo.HostedProfilePageToken != null && !displayOnlyMode"></help-text><div ng-if="hostedProfilePageInfo.HostedProfilePageToken != null"><div class="form-group" ng-if="!BankNameNoAccess"><label class="control-label col-sm-4"> <translate-content container="echeck" key="bank-name" default-content="Bank Name"></translate-content><span class="text-danger" ng-show="BankNameRequired">*</span></label><div class="col-sm-8"> <input type="text" class="form-control" ng-model="echeck.BankName" ng-disabled="BankNameReadonly" name="BankName" id="BankName" ng-required="BankNameRequired" ng-if="!displayOnlyMode && !addressConfirmed" /><div ng-show="(displayOnlyMode || addressConfirmed)">{{echeck.BankName}}</div></div></div><div class="form-group" ng-if="!EcheckAccountTypeIDNoAccess"><label class="control-label col-sm-4"><translate-content container="echeck" key="account-type" default-content="Account Type"></translate-content><span class="text-danger" ng-show="EcheckAccountTypeIDRequired">*</span></label><div class="col-sm-8"><select class="form-control echeck-account-type-input" name="EcheckAccountTypeID" ng-disabled="EcheckAccountTypeIDReadonly" ng-required="EcheckAccountTypeIDRequired" ng-model="echeck.EcheckAccountTypeID" ng-options="accountType.Key as accountType.Value for accountType in echeckAccountTypes" ng-change="echeckAccountTypeChanged()" style="min-width: 60px;" ng-if="!displayOnlyMode && !addressConfirmed"></select><div ng-show="displayOnlyMode || addressConfirmed">{{echeck.EcheckAccountTypeName}}</div></div></div><div class="form-group"><div class="col-sm-8 col-sm-offset-4"><div class="checkbox" ng-if="showDefaultField && !DefaultPaymentMethodNoAccess"><label><input type="checkbox" ng-model="echeck.DefaultPaymentMethod" ng-disabled="DefaultPaymentMethodReadonly || disableDefaultField" name="DefaultPaymentMethod" id="DefaultPaymentMethod" /><translate-content container="echeck" key="SetAsDefault" default-content="Set as Default"></translate-content></label></div></div></div><div class="text-center"><button type="button" class="btn btn-primary" ng-click="copyAddress()" ng-if="addressToCopy != null && !addressConfirmed"><i class="fa fa-fw fa-clipboard" aria-hidden="true"></i><translate-content container="echeck" key="UsePrimaryAddressForBilling" default-content="Use Primary Address For Billing"></translate-content></button><div class="padding-xs"></div></div><edit-address address="echeck.Address" address-type="billing" security-context="securityContext" validation-context="validationContext" show-special-instructions-field="false" show-valid-field="false" ng-show="!addressConfirmed"> </edit-address><div class="form-group" ng-show="addressConfirmed"><label class="control-label col-md-4"><translate-content container="echeck" key="billing-address" default-content="Billing Address"></translate-content></label><div class="col-md-8"><p class="form-control-static"><read-only-address address="echeck.Address" display-name="{{echeck.Address.FirstName + \' \' + echeck.Address.LastName}}"> </read-only-address></p></div></div><div class="clearfix"></div><div class="panel panel-success hosted-payment-panel" ng-show="hostedProfilePageInfo.HostedProfilePageToken != null && addressConfirmed && !displayOnlyMode"><div class="panel-heading"><h3 class="panel-title text-right"><translate-content container="echeck" key="secure-payment-form" default-content="Secure Payment Form"></translate-content><i class="fa fa-fw fa-lock" aria-hidden="true"></i></h3></div><div class="panel-body hosted-payment-panel" ng-if="hostedProfilePageUrl"><div><img ng-src="{{checkImageURL}}" class="half-image img-responsive center" /></div><div class="hosted-profile-page-blocker" ng-if="hostedProfilePageInfo.HostedProfilePageToken != null && echeck.ProfilePaymentToken!=null && addressConfirmed"></div><iframe class="hosted-profile-page" id="echeckHostedProfilePageFrm" type="text/html" ng-src="{{hostedProfilePageUrl}}"></iframe></div></div></div>',
            require: ['^form'],
            link: function (scope, element, attrs, ctrls) {
                scope.form = ctrls[0];
                scope.checkImageURL = '';
                scope.dataReady = false;

                if (scope.showTwoColumns == null) scope.showTwoColumns = true;

                if (scope.echeck == null) scope.echeck = {};
                if (scope.displayOnlyMode == null) {
                    scope.addressConfirmed = false;
                }
                if (scope.displayOnlyMode == null) {
                    scope.displayOnlyMode = false;
                }

                scope.hostedProfilePageInfo = null;
                scope.eventHostedProfilePageListenerCreated = false;

                scope.translationService = translationService;

                scope.$on("person.loaded", function (e, person) {
                    scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                    securityService.setSecurity(scope.securityContext, scope);
                    securityService.setValidation(scope.validationContext, scope);
                });

                scope.$watch('echeck', function (value) {
                    if (typeof scope.echeck != 'undefined' && scope.echeck != null) {
                        $(document).progressStart();
                        if (typeof scope.echeck.BusinessUnitID != 'undefined') {
                            scope.BusinessUnitID = scope.echeck.BusinessUnitID;
                            if (typeof scope.echeck.Address != 'undefined') {
                                scope.echeck.Address.BusinessUnitID = scope.echeck.BusinessUnitID;
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

                scope.copyAddress = function () {
                    $(document).progressStart();

                    var originalAddressId = scope.echeck.Address.AddressID;
                    scope.echeck.Address = angular.copy(scope.addressToCopy);
                    scope.echeck.Address.AddressID = originalAddressId;

                    $(document).progressFinish();
                };

                scope.getEcheckAccountTypes = function () {
                    if (typeof scope.echeckAccountTypes == 'undefined' || scope.ccTypes == null) {
                        return $http.get(apiRoot + 'api/Translation/GetEcheckAccountTypesTranslatedForReference?echeckAccountTypeID=&enabledOnly=true').then(
                            function (resp) {
                                scope.echeckAccountTypes = resp.data;

                                for (var i = 0; i < scope.echeckAccountTypes.length; i++) {
                                    scope.echeckAccountTypes[i].Value = scope.echeckAccountTypes[i].Value.replace(" ", "");
                                }
                            },
                            function (error) {
                                idstc().processError({ error: error, showNotifications: true });
                            }
                        );
                    }
                }; 

                scope.getHostedProfilePageUrl = function () {
                    if (typeof scope.echeck.Address != 'undefined') {
                        scope.hostedProfilePageInfo = {};
                        scope.dataReady = false;
                        scope.hostedProfilePageUrl = "";

                        var businessUnitID = null;
                        if (typeof scope.businessUnitID != 'undefined') {
                            businessUnitID = scope.businessUnitID;
                        }

                        var customCartTheme = null;
                        if (typeof idstc_setting_customcarttheme != 'undefined') {
                            customCartTheme = idstc_setting_customcarttheme;
                        }

                        if (typeof scope.echeck.Address.CountryTwoLetterISO !== 'undefined' && scope.echeck.Address.CountryTwoLetterISO != null && scope.echeck.Address.CountryTwoLetterISO != '') {
                            scope.checkImageURL = location.protocol + '//' + location.hostname + '/wp-content/plugins/idstc-acuta/content/images/check_' + scope.echeck.Address.CountryTwoLetterISO.toLowerCase() + '.png';
                        }
                        else {
                            scope.checkImageURL = '';
                        }

                        var postVar = {
                            BusinessUnitID: businessUnitID,
                            Address: angular.copy(scope.echeck.Address),
                            CssFile: customCartTheme,
                            GatewayTypeID: 5  // echeck
                        };

                        if (typeof scope.echeck.NameOnAccount != 'undefined' && scope.echeck.NameOnAccount != null && scope.echeck.NameOnAccount.length != 0) {
                            postVar.Address.DisplayName = scope.echeck.NameOnAccount;
                        }

                        return $http.post(apiRoot + "api/Shopping/GetHostedProfilePageToken", postVar).then(
                            function (resp) {
                                if (resp.data != null && resp.data.HostedProfilePageUrl != null && resp.data.HostedProfilePageUrl.length > 0) {

                                    scope.hostedProfilePageInfo = resp.data;
                                    scope.hostedProfilePageUrl = $sce.trustAsResourceUrl(scope.hostedProfilePageInfo.HostedProfilePageUrl);
                                    scope.echeck.useHostedProfilePage = true;
                                    scope.echeck.ProfilePaymentToken = null;
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
                };

                scope.setHostedProfilePageUrlFn({ theSetDirFn: scope.getHostedProfilePageUrl });

                scope.submitHostedProfilePage = function () {
                    if (typeof scope.echeck.HostedProfilePageToken == 'undefined' || scope.echeck.HostedProfilePageToken == null) {
                        var iFrame = window.document.getElementById('echeckHostedProfilePageFrm');
                        iFrame.contentWindow.postMessage('posted', scope.hostedProfilePageInfo.HostedProfilePageDomain);
                    }
                    else {
                        $(document).progressStart();
                        scope.continueSaveProcessFn();
                    }
                };

                scope.setSubmitHostedProfilePageFn({ theSubmitDirFn: scope.submitHostedProfilePage });

                scope.init = function () {
                    var promises = [appService.makeReady()];
                    $q.all(promises).then(function (result) {
                        promises[translationService.getTranslations('echeck')];
                        $q.all(promises).then(function (result) {
                            scope.getEcheckAccountTypes();
                        });
                    });
                };

                scope.windowEventMessageReceived = function (event) {
                    if (scope.hostedProfilePageInfo != null && event.origin === scope.hostedProfilePageInfo.HostedProfilePageDomain && event.data.event == 'eCheckSaved') {
                        $(document).progressStart();

                        // split the accountholder name for the first and last name of the address.  the cms iframe does not have seperate fields in the iframe

                        var accountHolderNameArray = event.data.data.bank.accountHolderName.split(' ');
                        var firstName = '';
                        var lastName = '';
                        if (accountHolderNameArray.length == 1) {
                            lastName = event.data.data.bank.accountHolderName;
                        }
                        else {
                            if (accountHolderNameArray.length > 1) {
                                firstName = accountHolderNameArray[0];
                                for (var i = 1; i < accountHolderNameArray.length; i++) {
                                    if (lastName == '') {
                                        lastName = accountHolderNameArray[i];
                                    }
                                    else {
                                        lastName = lastName + ' ' + accountHolderNameArray[i];
                                    }
                                }
                            }
                        }

                        scope.echeck.DisplayNumber = event.data.data.token.lastFour;
                        scope.echeck.RoutingNumber = event.data.data.bank.routingNumber;
                        scope.echeck.NameOnAccount = event.data.data.bank.accountHolderName;
                        scope.echeck.ProfilePaymentToken = event.data.data.token.token;
                        scope.echeck.Address.FirstName = firstName;
                        scope.echeck.Address.LastName = lastName;
                        scope.echeck.Address.Street1 = event.data.data.data.customer.billToAddressOne;
                        scope.echeck.Address.Street2 = event.data.data.data.customer.billToAddressTwo;
                        scope.echeck.Address.City = event.data.data.data.customer.billToCity;
                        scope.echeck.Address.ProvinceAbbreviation = event.data.data.data.customer.billToState;
                        scope.echeck.Address.ProvinceID = null;
                        scope.echeck.Address.PostalCode = event.data.data.data.customer.billToPostal;
                        scope.echeck.Address.CountryTwoLetterISO = event.data.data.data.customer.billToCountry;
                        scope.echeck.Address.CountryID = null;
                        scope.echeck.GatewayInfoID = scope.hostedProfilePageInfo.GatewayInfoID;

                        var postVar = {
                            RequestSent: idstc().translate('echeck', 'EcheckIFrameRequest', 'Echeck IFrame Request'),
                            Action: idstc().translate('echeck', 'SubmitSaveEcheckIframe', 'Submit Save Echeck Iframe'),
                            ProcessingUrl: scope.hostedProfilePageInfo.HostedProfilePageUrl,
                            PaymentProfileToken: scope.echeck.ProfilePaymentToken,
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
                        idstc().dialog({ type: 'alert', message: idstc().translate('echeck', 'InvalidEcheckInfo', 'Your echeck information is invalid.  Please re-enter and try again.'), title: '', success: 'error' });

                        var errorPostVar = {
                            RequestSent: idstc().translate('credit-echeck', 'EcheckIFrameRequest', 'Echeck IFrame Request'),
                            Action: idstc().translate('credit-echeck', 'SubmitSaveEcheckIframe', 'Submit Save Echeck Iframe'),
                            ProcessingUrl: scope.hostedProfilePageInfo.HostedProfilePageUrl,
                            ErrorCode: event.data.data.error,
                            ResponseReceived: JSON.stringify(event.data.data),
                            ErrorText: event.data.data.message,
                            GatewayInfoID: scope.hostedProfilePageInfo.GatewayInfoID
                        };

                        $http.post(apiRoot + "api/Shopping/LogGatewayConversation", errorPostVar).then(
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
                };

                $window.addEventListener('message', scope.windowEventMessageReceived);

                scope.$on('$destroy', function () {
                    $window.removeEventListener('message', scope.windowEventMessageReceived);
                });

                scope.echeckAccountTypeChanged = function () {
                    var foundAccountType = _.find(scope.echeckAccountTypes, function (accountType) { return accountType.Key === scope.echeck.EcheckAccountTypeID; });

                    if (foundAccountType != null) {
                        scope.echeck.EcheckAccountTypeName = foundAccountType.Value;
                    }
                };

                scope.init();
            }
        };
    });
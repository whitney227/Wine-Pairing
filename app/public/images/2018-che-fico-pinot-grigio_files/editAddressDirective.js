angular.module('app')
    .directive('editAddress', function (appService, $q, $http, $timeout, securityService, translationService) {
        return {
            restrict: 'E',
            scope: {
                address: '=?address',  // The address this form is editing
                addressType: '@addressType', // The type of address this directive is representing. Current types are 'billing' and 'shipping'.
                securityContext: '=?securityContext',   // The security context under which to operate
                validationContext: '=?validationContext',  // The validation context (form) under which to operate
                showNameFields: '=?showNameFields',  // Pass true to show the name fields
                showPrimaryField: '=?showPrimaryField',  // Pass true to show the Primary checkbox
                disablePrimaryField: '=?disablePrimaryField',  // Pass true to disable the the Primary checkbox -- This is used from the person centers to prevent a user from un-setting the address that is currently marked as primary
                showValidField: '=?showValidField',   // Pass true to show the Validated dropdown
                showResidentialField: '=?showResidentialField', //  Pass true to show the Residential dropdown
                showSpecialInstructionsField: '=?showSpecialInstructionsField', //  Pass true to show the speical instructions text area
                phoneNumberOptions: '=?phoneNumberOptions', //  This is used to pass back the phone number masking options when the country is changed                
                selectFirstCountry: '=?' // If true (default), then select the first country in the ilst
            },
            template: '<form><div ng-form="editAddressForm"><div class="form-group nickname-field" ng-if="showNameFields && !NickNameNoAccess"><label class="control-label col-md-4"> <translate-content container="address" key="Nickname" default-content="Nickname"></translate-content> <span class="text-danger required-mark" ng-show="NickNameRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="nickname" ng-model="address.NickName" ng-disabled="NickNameReadonly" name="NickName" ng-required="NickNameRequired" /> </div> </div> <div class="form-group first-name-field" ng-if="showNameFields && !FirstNameNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="FirstName" default-content="First name"></translate-content> <span class="text-danger required-mark" ng-show="FirstNameRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="given-name" ng-model="address.FirstName" ng-disabled="FirstNameReadonly" name="FirstName" ng-required="FirstNameRequired" /> </div> </div> <div class="form-group last-name-field" ng-if="showNameFields && !LastNameNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="LastName" default-content="Last name"></translate-content> <span class="text-danger required-mark" ng-show="LastNameRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="family-name" ng-model="address.LastName" ng-disabled="LastNameReadonly" name="LastName" ng-required="LastNameRequired" /> </div> </div> <div class="form-group last-name2-field" ng-if="showNameFields && address.DisplayLastName2 && !LastName2NoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="LastName2" default-content="Last name 2"></translate-content> <span class="text-danger required-mark" ng-show="LastName2Required">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" ng-model="address.LastName2" ng-disabled="LastName2Readonly" name="LastName2" ng-required="LastName2Required" /> </div> </div> <div class="form-group company-field" ng-if="showNameFields && !CompanyNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Company" default-content="Company"></translate-content> <span class="text-danger required-mark" ng-show="CompanyRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="organization" ng-model="address.Company" ng-disabled="CompanyReadonly" name="Company" ng-required="CompanyRequired" /> </div> </div> <div class="form-group country-field" ng-if="!CountryIDNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Country" default-content="Country"></translate-content> <span class="text-danger required-mark" ng-show="CountryIDRequired">*</span> </label> <div class="col-md-8"> <select class="form-control" autocomplete="country-name" ng-model="address.CountryID" ng-disabled="CountryIDReadonly" ng-required="CountryIDRequired" ng-options="Country.CountryID as Country.Name for Country in countries" ng-change="CountryDDChange();" name="CountryID"></select> </div> </div> <div class="form-group street1-field" ng-if="!Street1NoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Street1" default-content="Street 1"></translate-content> <span class="text-danger required-mark" ng-show="Street1Required">*</span> </label> <div class="col-md-8"> <input type="text" name="Street1" class="form-control" autocomplete="address-line1" ng-model="address.Street1" ng-disabled="Street1Readonly" ng-required="Street1Required" /> </div> </div> <div class="form-group street2-field" ng-if="!Street2NoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Street2" default-content="Street 2"></translate-content> <span class="text-danger required-mark" ng-show="Street2Required">*</span> </label> <div class="col-md-8"> <input type="text" name="Street2" class="form-control" autocomplete="address-line2" ng-model="address.Street2" ng-disabled="Street2Readonly" ng-required="Street2Required" /> </div> </div> <div class="form-group street3-field" ng-if="address.DisplayStreet3 && !Street3NoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Street3" default-content="Street 3"></translate-content> <span class="text-danger required-mark" ng-show="Street3Required">*</span> </label> <div class="col-md-8"> <input type="text" name="Street3" class="form-control" autocomplete="address-line3" ng-model="address.Street3" ng-disabled="Street3Readonly" ng-required="Street3Required" /> </div> </div> <div class="form-group street4-field" ng-if="address.DisplayStreet4 && !Street4NoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Street4" default-content="Street 4"></translate-content> <span class="text-danger required-mark" ng-show="Street4Required">*</span> </label> <div class="col-md-8"> <input type="text" name="Street4" class="form-control" autocomplete="address-line4" ng-model="address.Street4" ng-disabled="Street4Readonly" ng-required="Street4Required" /> </div> </div> <div class="form-group city-field" ng-if="!CityNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="City" default-content="City"></translate-content> <span class="text-danger required-mark" ng-show="CityRequired">*</span> </label> <div class="col-md-8"> <input type="text" name="City" class="form-control" autocomplete="address-level2" ng-model="address.City" ng-disabled="CityReadonly" ng-required="CityRequired" /> </div> </div> <div class="form-group province-field" ng-if="!ProvinceIDNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Province" default-content="State/Province"></translate-content> <span class="text-danger required-mark" ng-show="ProvinceIDRequired">*</span> </label> <div class="col-md-8"> <select class="form-control" autocomplete="address-level1" ng-disabled="ProvinceIDReadonly" ng-required="ProvinceIDRequired" ng-model="address.ProvinceID" ng-options="Province.ProvinceID as Province.Name for Province in filteredProvinces" name="ProvinceID"> <option value="">{{selectStateText}}</option> </select> </div> </div> <div class="form-group postalcode-field" ng-show="address.DisplayPostalCode && !PostalCodeNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="PostalCode" default-content="Postal Code"></translate-content> <span class="text-danger required-mark" ng-show="PostalCodeRequired && address.DisplayPostalCode && !PostalCodeNoAccess">*</span> </label> <div class="col-md-8"> <input kendo-masked-text-box="PostalCode" autocomplete="postal-code" name="PostalCode" k-change="PostalCodeChanged" ng-model="address.PostalCode" ng-disabled="PostalCodeReadonly" ng-required="PostalCodeRequired && address.DisplayPostalCode && !PostalCodeNoAccess" k-options="postalCodeOptions" k-rebind="postalCodeOptions" /> </div> </div> <div class="form-group region-field" ng-if="address.DisplayRegion && !RegionNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Region" default-content="Region"></translate-content> <span class="text-danger required-mark" ng-show="RegionRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" ng-model="address.Region" ng-disabled="RegionReadonly" name="Region" ng-required="RegionRequired" /> </div> </div> <div class="form-group phonenumber-field" ng-if="!PhoneNumberNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="PhoneNumber" default-content="Phone number"></translate-content> <span class="text-danger required-mark" ng-show="PhoneNumberRequired">*</span> </label> <div class="col-md-8"> <input kendo-masked-text-box="PhoneNumber" ng-model="address.PhoneNumber" name="EditPhoneNumber" k-options="phoneNumberOptions" k-rebind="phoneNumberOptions" ng-blur="validatePhoneNumber()" class="PhoneNumber" autocomplete="tel-national" ng-disabled="PhoneNumberReadonly" ng-required="PhoneNumberRequired" /> </div> </div> <div class="form-group validated-field" ng-if="showValidField && !IsValidNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Validated" default-content="Validated"></translate-content> <span class="text-danger required-mark" ng-show="IsValidRequired">*</span> </label> <div class="col-md-8"> <select class="form-control col-sm-4" ng-disabled="IsValidReadonly" ng-required="IsValidRequired" ng-model="address.IsValid" ng-options="o.v as o.n for o in [{ n: \'Unknown\', v: null }, { n: \'Yes\', v: true }, { n: \'No\', v: false }]" name="IsValid"></select> </div> </div> <div class="form-group residential-field" ng-if="showResidentialField && !ResidentialNoAccess"> <label class="control-label col-md-4"> <translate-content container="address" key="Residential" default-content="Residential"></translate-content> <span class="text-danger required-mark" ng-show="ResidentialRequired">*</span> </label> <div class="col-md-8"> <select class="form-control col-sm-4" ng-disabled="ResidentialReadonly" ng-model="address.Residential" ng-required="ResidentialRequired" ng-options="o.v as o.n for o in [{ n: \'Yes\', v: true }, { n: \'No\', v: false }]" name="Residential"></select> </div> </div> <div class="form-group specialinstructions-field" ng-if="showSpecialInstructionsField && !SpecialInstructionsNoAccess"> <label for="specialInstructions" class="col-md-4 control-label"> <translate-content container="address" key="SpecialInstructions" default-content="Special Instructions"></translate-content> <span class="text-danger required-mark" ng-show="SpecialInstructionsRequired">*</span> </label> <div class="col-md-8"> <textarea class="form-control" rows="3" ng-model="address.SpecialInstructions" ng-disabled="SpecialInstructionsReadonly" ng-required="SpecialInstructionsRequired"></textarea> </div> </div> <div class="form-group primary-field" ng-if="showPrimaryField && !PrimaryNoAccess"> <label class="control-label col-xs-4"> <translate-content container="address" key="Primary" default-content="Primary"></translate-content> <span class="text-danger required-mark" ng-show="PrimaryRequired">*</span> </label> <div class="col-xs-8"> <div class="checkbox checkbox-right"> <input type="checkbox" ng-model="address.Primary" ng-disabled="PrimaryReadonly || disablePrimaryField" name="Primary" /> </div> </div> </div> </div></form>',

            link: function (scope, element, attrs) {

                scope.filteredProvinces = [];

                if (scope.selectFirstCountry == null) scope.selectFirstCountry = true; // Default to selecting the first country in the list that should have been provided sorted by Country.DisplayOrder

                scope.$watch('address', function (newValue, oldValue) {
                    if ((oldValue == null) || (oldValue != null && newValue != null && newValue.CountryID != null)) {
                        scope.setDisplayOptions();
                        scope.setFilteredProvinces(false);
                    }

                    securityService.setSecurity(scope.securityContext, scope);
                    securityService.setValidation(scope.validationContext, scope);
                });

                if (scope.showSpecialInstructionsField == null) scope.showSpecialInstructionsField = true;
                if (scope.showResidentialField == null) scope.showResidentialField = false;
                if (scope.showNameFields == null) scope.showNameFields = false;
                if (scope.showValidField == null) scope.showValidField = false;
                if (scope.showPrimaryField == null) scope.showPrimaryField = false;

                scope.init = function () {
                    var promises = [appService.makeReady()];

                    $q.all(promises).then(function () {
                        scope.$on("person.loaded", function (e, person) {
                            scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                            securityService.setSecurity(scope.securityContext, scope);
                            securityService.setValidation(scope.validationContext, scope);
                        });

                        if (scope.addressType == 'billing') {
                            if (appService.countriesForDropdownBilling == null) {
                                promises.push(scope.getCountries());
                            }
                            else {
                                scope.countries = angular.copy(appService.countriesForDropdownBilling);
                            }
                        }
                        else if (scope.addressType == 'shipping') {
                            if (appService.countriesForDropdownShipping == null) {
                                promises.push(scope.getCountries());
                            }
                            else {
                                scope.countries = angular.copy(appService.countriesForDropdownShipping);
                            }
                        }
                        else {
                            if (appService.countriesForDropdown == null) {
                                promises.push(scope.getCountries());
                            }
                            else {
                                scope.countries = angular.copy(appService.countriesForDropdown);
                            }
                        }

                        promises = [translationService.getTranslations('address')];

                        if (scope.addressType == 'billing') {
                            if (appService.countriesForDropdownBilling == null) {
                                promises.push(scope.getCountries());
                            }
                            else {
                                scope.countries = angular.copy(appService.countriesForDropdownBilling);
                            }
                        }
                        else if (scope.addressType == 'shipping') {
                            if (appService.countriesForDropdownShipping == null) {
                                promises.push(scope.getCountries());
                            }
                            else {
                                scope.countries = angular.copy(appService.countriesForDropdownShipping);
                            }
                        }
                        else {
                            if (appService.countriesForDropdown == null) {
                                promises.push(scope.getCountries());
                            }
                            else {
                                scope.countries = angular.copy(appService.countriesForDropdown);
                            }
                        }

                        if (appService.provincesForDropdown == null) {
                            promises.push(scope.getProvinces());
                        }
                        else {
                            scope.provinces = angular.copy(appService.provincesForDropdown);
                        }

                        $q.all(promises).then(function () {
                            scope.dataReady = true;

                            scope.selectStateText = translationService.translations['address']['SelectYourState'] || 'Select your state';;

                            if (scope.address != null && scope.address.CountryID != null) {
                                scope.setDisplayOptions();
                                scope.setFilteredProvinces(false);
                            }
                            else {
                                if (scope.address == null) scope.address = {};

                                scope.address.DisplayPostalCode = true;

                                // Set defaults for address form
                                scope.filteredProvinces = [];

                                if (scope.selectFirstCountry && scope.countries && scope.countries.length > 0) {
                                    scope.address.CountryID = scope.countries[0].CountryID;
                                    scope.setDisplayOptions();
                                    scope.setFilteredProvinces(false);
                                }
                                else {
                                    scope.address.DisplayLastName2 = false;
                                    scope.address.DisplayStreet3 = false;
                                    scope.address.DisplayStreet4 = false;
                                    scope.address.DisplayRegion = false;
                                    scope.address.DisplayDeliveryOffice = false;
                                    scope.phoneMask = null;
                                    scope.postalCodeMask = null;
                                }

                                scope.address.Province = null;
                                scope.address.ProvinceID = null;
                            }
                        });
                    });
                };
                    
                // We have to watch for changes from outside to handle for copying addresses
                scope.$watch('address.CountryID', function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        scope.setFilteredProvinces(false);
                    }
                }, true);

                scope.getCountries = function () {
                    var countriesFromStorage = localStorage.getItem('Countries');

                    if (countriesFromStorage != null) {
                        scope.countries = JSON.parse(countriesFromStorage).countries;

                        if (scope.addressType == 'billing') {
                            appService.countriesForDropdownBilling = [];

                            for (var i = 0; i < scope.countries.length; i++) {
                                if (scope.countries[i].BillingAddressAllowed) {
                                    appService.countriesForDropdownBilling.push(scope.countries[i]);
                                }
                            }
                        }
                        else if (scope.addressType == 'shipping') {
                            appService.countriesForDropdownShipping = [];

                            for (var i = 0; i < scope.countries.length; i++) {
                                if (scope.countries[i].ShippingAddressAllowed) {
                                    appService.countriesForDropdownShipping.push(scope.countries[i]);
                                }
                            }
                        }
                        else {
                            appService.countriesForDropdown = angular.copy(scope.countries);
                        }
                    }
                    else {
                        var url = apiRoot + 'api/CountryProvinces/GetCountriesForDropdown';

                        if (scope.addressType != null) {
                            url += '?addressType=' + scope.addressType;
                        }

                        return $http.get(url).then(
                            function (resp) {
                                scope.countries = resp.data;

                                if (scope.addressType == 'billing') {
                                    appService.countriesForDropdownBilling = angular.copy(scope.countries);
                                }
                                else if (scope.addressType == 'shipping') {
                                    appService.countriesForDropdownShipping = angular.copy(scope.countries);
                                }
                                else {
                                    appService.countriesForDropdown = angular.copy(scope.countries);
                                }
                            },
                            function (error) {
                                idstc().processError({ error: error, showNotifications: true });
                            }
                        );
                    }
                };

                scope.getProvinces = function () {
                    var url = apiRoot + 'api/CountryProvinces/GetProvincesForDropdown';

                    return $http.get(url).then(
                        function (resp) {
                            scope.provinces = resp.data;
                            appService.provincesForDropdown = angular.copy(scope.provinces);
                        },
                        function (error) {
                            idstc().processError({ error: error, showNotifications: true });
                        }
                    );
                };

                scope.PostalCodeChanged = function () {
                    scope.address.PostalCode = this.raw();
                };

                // Filter the provinces dropdown based on the selected country
                scope.setFilteredProvinces = function (clearValue) {
                    // Wipe selected province if any
                    scope.filteredProvinces = [];

                    if (scope.address) {
                        if (clearValue) {
                            scope.address.Province = null;
                            scope.address.ProvinceID = null;
                        }

                        if (scope.provinces) {
                            for (var p = 0; p < scope.provinces.length; p++) {
                                if (scope.provinces[p].CountryID === scope.address.CountryID) {
                                    scope.filteredProvinces.push(scope.provinces[p]);
                                }
                            }
                        }
                    }
                };

                // Set the display options based on the selected country
                scope.setDisplayOptions = function () {
                    if (scope.countries != null && scope.address != null) {
                        for (var c = 0; c < scope.countries.length; c++) {
                            if (scope.address.CountryID == scope.countries[c].CountryID) {
                                scope.address.DisplayLastName2 = scope.countries[c].DisplayLastName2;
                                scope.address.DisplayPostalCode = scope.countries[c].DisplayPostalCode;
                                scope.address.DisplayStreet3 = scope.countries[c].DisplayStreet3;
                                scope.address.DisplayStreet4 = scope.countries[c].DisplayStreet4;
                                scope.address.DisplayRegion = scope.countries[c].DisplayRegion;
                                scope.address.DisplayDeliveryOffice = scope.countries[c].DisplayDeliveryOffice;
                                scope.address.CountryName = scope.countries[c].Name;
                                scope.address.CountryTwoLetterISO = scope.countries[c].Abbreviation;

                                if (scope.address.Province != null) {
                                    scope.address.Province.CountryName = scope.countries[c].Name;
                                }

                                scope.phoneMask = scope.countries[c].PhoneMask;
                                scope.postalCodeMask = scope.countries[c].PostalCodeMask;

                                scope.postalCodeOptions = {
                                    mask: scope.postalCodeMask
                                };

                                // Need to pass back the phone number options of the selected country in case something else is using it on this page
                                scope.phoneNumberOptions = {
                                    mask: scope.phoneMask
                                };

                                break;
                            }
                        }
                    }

                    if (scope.provinces != null && scope.address != null) {
                        for (var p = 0; p < scope.provinces.length; p++) {
                            if (scope.address.ProvinceID == scope.provinces[p].ProvinceID) {
                                scope.address.ProvinceName = scope.provinces[p].Name;

                                if (scope.address.Province != null) {
                                    scope.address.Province.Abbreviation = scope.provinces[p].Abbreviation;
                                    scope.address.Province.Name = scope.provinces[p].Name;
                                }

                                break;
                            }
                        }
                    }
                };

                scope.validatePhoneNumber = function () {
                    if (scope.address.PhoneNumber != null && scope.address.PhoneNumber != '') {
                        var phoneNumber = scope.address.PhoneNumber.replace(/\D/g, '');

                        if (scope.phoneNumberOptions != null && scope.phoneNumberOptions.mask != null) {
                            var maskNumbers = scope.phoneNumberOptions.mask.replace(/\D/g, '');

                            if (phoneNumber.length == maskNumbers.length) {
                                scope.editAddressForm.EditPhoneNumber.$setValidity('mask', true);
                            }
                            else {
                                scope.editAddressForm.EditPhoneNumber.$setValidity('mask', false);
                            }
                        }
                        else {
                            scope.editAddressForm.EditPhoneNumber.$setValidity('mask', true);
                        }
                    }
                    else {
                        scope.editAddressForm.EditPhoneNumber.$setValidity('mask', true);
                    }
                };

                scope.CountryDDChange = function () {
                    scope.setDisplayOptions();
                    scope.setFilteredProvinces(true);
                };

                scope.init();
            }
        };
    });
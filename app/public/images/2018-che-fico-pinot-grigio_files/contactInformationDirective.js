(function () {
    'use strict';

    angular.module('app').directive('contactInformation', function (securityService) {
        return {
            restrict: 'E',
            scope: {
                contactinformation: '=contactinformation',
                displayOnlyMode: '=?displayOnlyMode',
                emailReadonlyVar: '=?emailReadonlyVar',
                emailVisibleVar: '=?emailVisibleVar',
                securityContext: '=?securityContext',   // The security context under which to operate                            
                validationContext: '=?validationContext'  // The validation context (form) under which to operate
            }, //WebsiteChange
            template: '<div class="form-group first-name-field" ng-if="!FirstNameNoAccess"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="first-name" default-content="First Name"></translate-content> <span class="text-danger required-mark" ng-show="FirstNameRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="given-name" ng-model="contactinformation.FirstName" ng-required="FirstNameRequired" ng-disabled="FirstNameReadonly" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{contactinformation.FirstName}}</p> </div></div><div class="form-group last-name-field" ng-if="!LastNameNoAccess"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="last-name" default-content="Last Name"></translate-content> <span class="text-danger required-mark" ng-show="LastNameRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="family-name" ng-model="contactinformation.LastName" ng-required="LastNameRequired" ng-disabled="LastNameReadonly" ng-show="!displayOnlyMode"/> <p ng-show="displayOnlyMode" class="form-control-static">{{contactinformation.LastName}}</p> </div></div><div class="form-group last-name2-field" id="FormLastName2" ng-if="!LastName2NoAccess"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="last-name-2" default-content="Last Name 2"></translate-content> <span class="text-danger required-mark" ng-show="LastName2Required">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" ng-model="contactinformation.LastName2" ng-required="LastName2Required" ng-disabled="LastName2Readonly" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{contactinformation.LastName2}}</p> </div></div><div class="form-group company-name-field" ng-if="!CompanyNameNoAccess"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="company-name" default-content="Company Name"></translate-content> <span class="text-danger required-mark" ng-show="CompanyNameRequired">*</span> </label> <div class="col-md-8"> <input type="text" class="form-control" autocomplete="organization" ng-model="contactinformation.CompanyName" ng-required="CompanyNameRequired" ng-disabled="CompanyNameReadonly" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{contactinformation.CompanyName}}</p> </div></div><div class="form-group email-field" ng-if="!EmailNoAccess && emailVisibleVar"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="Email" default-content="Email"></translate-content> <span class="text-danger required-mark" ng-show="EmailRequired">*</span> </label> <div class="col-md-8"> <input type="email" ng-pattern="emailRegEx" class="form-control" autocomplete="email" ng-model="contactinformation.Email" ng-required="EmailRequired" ng-disabled="EmailReadonly || emailReadonlyVar" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{contactinformation.Email}}</p> </div></div><div class="form-group first-phone-field" ng-if="!PhoneNoAccess"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="home-phone" default-content="Home Phone"></translate-content> <span class="text-danger required-mark" ng-show="PhoneNumberRequired && (contactinformation.HomePhonePrimary || (!contactinformation.HomePhonePrimary && !contactinformation.CellPhonePrimary ))">*</span> </label> <div class="col-md-4"> <input type="text" class="form-control" autocomplete="tel-national home" ng-model="contactinformation.HomePhone" ng-required="PhoneNumberRequired && (contactinformation.HomePhonePrimary || (!contactinformation.HomePhonePrimary && !contactinformation.CellPhonePrimary ))" ng-disabled="PhoneNumberReadonly" ng-show="!displayOnlyMode"/> <p ng-show="displayOnlyMode" class="form-control-static">{{contactinformation.HomePhone}}</p> </div> <div class="checkbox col-md-4"> <label> <input type="checkbox" ng-model="contactinformation.HomePhonePrimary" ng-change="homePhonePrimaryChanged()" ng-disabled="displayOnlyMode" /> <translate-content container="person-create-edit" key="make-primary" default-content="Make Primary"></translate-content> </label> </div></div><div class="form-group second-phone-field" ng-if="!PhoneNoAccess"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="cell-phone" default-content="Cell Phone"></translate-content> <span class="text-danger required-mark" ng-show="PhoneNumberRequired && contactinformation.CellPhonePrimary">*</span> </label> <div class="col-md-4"> <input type="text" class="form-control" autocomplete="tel-national mobile" ng-model="contactinformation.CellPhone" ng-required="PhoneNumberRequired && contactinformation.CellPhonePrimary" ng-disabled="PhoneNumberReadonly" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{contactinformation.CellPhone}}</p> </div> <div class="checkbox col-md-4"> <label> <input type="checkbox" ng-model="contactinformation.CellPhonePrimary" ng-change="cellPhonePrimaryChanged()" ng-disabled="displayOnlyMode"/><translate-content container="person-create-edit" key="make-primary" default-content="Make Primary"></translate-content> </label> </div></div>',
            link: function (scope, element, attrs) {
                scope.emailRegEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                if (scope.displayOnlyMode == null) {
                    scope.displayOnlyMode = false;
                }

                if (scope.emailVisibleVar == null) {
                    scope.emailVisibleVar = true;
                }

                if (scope.emailVisibleVar == null) {
                    scope.emailVisibleVar = true;
                }

                scope.$on("person.loaded", function (e, person) {
                    if (person.Person_OtherInformation != null) {
                        scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                    }
                    else if (person.BusinessUnitID != null) {
                        scope.BusinessUnitID = person.BusinessUnitID;
                    }

                    securityService.setSecurity(scope.securityContext, scope);
                    securityService.setValidation(scope.validationContext, scope);
                });

                scope.$emit('contactInformationLoaded', element, attrs);

                scope.homePhonePrimaryChanged = function () {
                    scope.contactinformation.CellPhonePrimary = !scope.contactinformation.HomePhonePrimary;
                };

                scope.cellPhonePrimaryChanged = function () {
                    scope.contactinformation.HomePhonePrimary = !scope.contactinformation.CellPhonePrimary;
                };

            }
        };
    });
})();
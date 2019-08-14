(function () {
    'use strict';

    angular.module('app').directive('accountInformation', function (securityService) {
        return {
            restrict: 'E',
            scope: {
                accountinformation: '=accountinformation',
                displayOnlyMode: '=?displayOnlyMode',
                showUsername: '=showUsername',
                showReplsite: '=showReplsite',
                personType: '<personType', // Consultant, Customer, or Employee
                securityContext: '=?securityContext',   // The security context under which to operate
                validationContext: '=?validationContext'  // The validation context (form) under which to operate
            },
            template: '<form id="frmAccountInformation" class="form-horizontal"> <div class="form-group username-field" ng-show="showUsername" ng-if="!UsernameNoAccess"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="Username" default-content="Username"></translate-content> <span class="text-danger required-mark" ng-show="UsernameRequired">*</span> </label> <div class="col-md-8"> <input id="Username" type="text" class="form-control" autocomplete="username" ng-model="accountinformation.Username" ng-blur="UsernameChanged()" ng-required="UsernameRequired" ng-disabled="UsernameReadonly" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{accountinformation.Username}}</p> </div> </div> <edit-password password-container="accountinformation" label-class="control-label col-md-4" input-class="col-md-8" person-type="personType" security-context="securityContext" validation-context="validationContext" ng-cloak ng-show="!displayOnlyMode"></edit-password> <div ng-show="showReplsite" ng-if="!ReplicatedSiteURLNoAccess"> <div class="alert alert-info" ng-show="!displayOnlyMode"> <translate-content container="person-create-edit" key="replicated-site-help" default-content="Please choose a name that will be added to the site URL for people to shop and join on your personalized site i.e. https://companydomain.com/yourname. You cannot use a name that is already in use. This name cannot contain special characters, punctuation or spaces."></translate-content> </div> <div class="form-group replicated-site-url-field"> <label class="control-label col-md-4"> <translate-content container="person-create-edit" key="replicated-site-url" default-content="Replicated Site URL"></translate-content> <span class="text-danger required-mark" ng-show="ReplicatedSiteURLRequired">*</span> </label> <div class="col-md-8"> <input id="ReplicatedSiteURL" type="text" class="form-control" ng-model="accountinformation.ReplicatedSiteURL" ng-required="ReplicatedSiteURLRequired" ng-disabled="ReplicatedSiteURLReadonly" pattern="^[a-zA-Z0-9]+$" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{accountinformation.ReplicatedSiteURL}}</p> </div> </div> </div></form>',
            link: function (scope, element, attrs) {
                if (scope.displayOnlyMode == null) {
                    scope.displayOnlyMode = false;
                }

                scope.$on('person.loaded', function (e, person) {
                    scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                    securityService.setSecurity(scope.securityContext, scope);
                    securityService.setValidation(scope.validationContext, scope);
                });

                scope.$watch('UsernameRequired', function (newValue, oldValue) {
                    if (scope.showUsername == false) {
                        scope.UsernameRequired = false;
                    }
                });

                scope.$emit('accountInformationLoaded', element, attrs);

                var form = $('#frmAccountInformation').removeData('validator').removeData('unobtrusiveValidation');
                $.validator.unobtrusive.parse(form);

                scope.UsernameChanged = function () {
                    if ($('#Username').valid()) {
                        $('#Username').parent().parent().addClass('has-success');
                    }
                    else {
                        $('#Username').parent().parent().removeClass('has-success');
                    }
                }

                scope.PasswordChanged = function () {
                    if ($('#Password').val().length >= 6) {
                        if ($('#Password').valid()) {
                            $('#Password').parent().parent().addClass('has-success');
                        }
                        else {
                            $('#Password').parent().parent().removeClass('has-success');
                        }
                    }
                    else {
                        $('#Password').parent().parent().removeClass('has-success');
                    }
                };

                scope.ConfirmPasswordChanged = function () {
                    if ($('#ConfirmPassword').val().length >= $('#Password').val().length) {
                        if ($('#ConfirmPassword').valid()) {
                            $('#ConfirmPassword').parent().parent().addClass('has-success');
                        }
                        else {
                            $('#ConfirmPassword').parent().parent().removeClass('has-success');
                        }
                    }
                    else {
                        $('#ConfirmPassword').parent().parent().removeClass('has-success');
                    }
                };
            }
        };
    });
})();
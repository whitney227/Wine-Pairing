angular.module('app')
    .directive('editOtherInformation', function ($q, $http, securityService) {
        return {
            restrict: 'E',
            scope: {
                displayOnlyMode: '=?displayOnlyMode',
                otherInfo: '=otherInfo',  // The other information this form is editing
                securityContext: '=securityContext',   // The security context under which to operate            
                validationContext: '=?validationContext'  // The validation context (form) under which to operate
            },
            template: '<div class="form-group" ng-if="!DateOfBirthNoAccess"> <label class="control-label col-sm-4"> <translate-content container="person-create-edit" key="DateOfBirth" default-content="Date of Birth"></translate-content> <span class="text-danger required-mark" ng-show="DateOfBirthRequired">*</span> </label> <div class="col-md-8"> <input kendo-date-picker id="dateOfBirthPicker" ng-model="otherInfo.DateOfBirth" ng-disabled="DateOfBirthReadonly" ng-required="DateOfBirthRequired" style="width: 100%;" autocomplete="bday" k-max="currentDate" ng-show="!displayOnlyMode"/> <p ng-show="displayOnlyMode" class="form-control-static">{{otherInfo.DateOfBirth | dateFormat}}</p> </div></div>',
            link: function (scope, element, attrs) {
                if (scope.displayOnlyMode == null) {
                    scope.displayOnlyMode = false;
                }

                if (scope.otherInfo == null) scope.otherInfo = {};

                scope.currentDate = new Date();

                scope.$on('person.loaded', function (e, person) {
                    scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                    securityService.setSecurity(scope.securityContext, scope);
                    securityService.setValidation(scope.validationContext, scope);
                });

                scope.init = function () {

                }

                scope.init();
            },
        };
    });
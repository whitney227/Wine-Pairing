
angular.module('app')
    .directive('editIdentification', function ($q, $http, securityService) {
        return {
            restrict: 'E',
            scope: {
                displayOnlyMode: '=?displayOnlyMode',
                idInfo: '=idInfo',  // The identification this form is editing
                securityContext: '=securityContext',   // The security context under which to operate            
                validationContext: '=?validationContext'  // The validation context (form) under which to operate
            },
            template: '<div class="form-group" ng-if="!SSNNoAccess"> <label class="control-label col-md-4"><translate-content container="person-create-edit" key="SSN" default-content="SSN" ></label> <div class="col-md-8"> <input kendo-masked-text-box="SSN" k-mask="\'999-99-9999\'" ng-model="idInfo.SSN" ng-disabled="SSNReadonly" ng-required="SSNRequired" id="ssn" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{idInfo.SSN | getLastFour}}</p> </div></div><div class="form-group" ng-if="!EINNoAccess"> <label class="control-label col-md-4"><translate-content container="person-create-edit" key="EIN" default-content="EIN"></label> <div class="col-md-8"> <input kendo-masked-text-box="EIN" k-mask="\'99-9999999\'" ng-model="idInfo.EIN" ng-disabled="EINReadonly" ng-required="EINRequired" id="ein" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{idInfo.EIN}}</p> </div></div><div class="form-group" ng-if="!SINNoAccess"> <label class="control-label col-md-4"><translate-content container="person-create-edit" key="SIN" default-content="SIN"></label> <div class="col-md-8"> <input kendo-masked-text-box="SIN" k-mask="\'99-9999999\'" ng-model="idInfo.SIN" ng-disabled="SINReadonly" ng-required="SINRequired" id="sin" ng-show="!displayOnlyMode" /> <p ng-show="displayOnlyMode" class="form-control-static">{{idInfo.SIN}}</p> </div></div>',
            link: function (scope, element, attrs) {
                if (scope.displayOnlyMode == null) {
                    scope.displayOnlyMode = false;
                }

                if (scope.idInfo == null) scope.idInfo = {};

                securityService.setSecurity(scope.securityContext, scope);
                securityService.setValidation(scope.validationContext, scope);

                scope.$on("person.loaded", function (e, person) {
                    scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                    securityService.setSecurity(scope.securityContext, scope);
                    securityService.setValidation(scope.validationContext, scope);                    
                });

                scope.countryId = 1;  // This is only used to filter the DL State to US states
                scope.filteredprovinces = [];

                scope.init = function () {
                    //var promises = [scope.getProvinces()];

                    //$q.all(promises).then(function () {
                    //    scope.dataReady = true;                                                
                    //});
                }

                //scope.getProvinces = function () {
                //    return $http.get(apiRoot + "api/CountryProvinces/GetProvincesForDropdown").then(
                //         function (resp) {
                //             scope.provinces = resp.data;
                //             scope.setFilteredProvinces();
                //         },
                //         function (error) {
                //             idstc().processError({ error: error, showNotifications: true });
                //         }
                //    );
                //}                               

                //// Filter the provinces dropdown based on the selected country
                //scope.setFilteredProvinces = function () {
                //    // Wipe selected province if any
                //    scope.filteredprovinces = [];

                //    for (var p = 0; p < scope.provinces.length; p++) {
                //        if (scope.provinces[p].CountryID === scope.countryId) {
                //            scope.filteredprovinces.push(scope.provinces[p]);
                //        }
                //    }
                //}

                scope.init();
            },
        };
    });
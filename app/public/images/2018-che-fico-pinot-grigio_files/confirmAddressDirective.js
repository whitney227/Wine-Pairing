angular
    .module('app')
    .directive('confirmAddress', confirmAddress);

confirmAddress.$inject = ['$http', '$filter', '$sce', 'addressValidationService', 'translationService', 'securityService', 'appService', '$q'];

function confirmAddress($http, $filter, $sce, addressValidationService, translationService, securityService, appService, $q) {
    return {
        restrict: 'E',
        scope: {
            windowTitle: '@windowTitle',
            confirmAddressWindow: '=confirmAddressWindow',
            validationResult: '=validationResult',
            addressSelect: '&addressSelect',
            securityContext: '@securityContext'
        },
        template: '<div kendo-window="confirmAddressWindow" k-visible="false"> <div class="alert alert-warning" role="alert"> <i class="fa fa-exclamation-triangle" aria-hidden="true"></i> <translate-content container="confirm-address" key="ConfrimAddressHeader" default-content="Looks like the address information you entered is not accurate. Please either choose to re-enter your address information or continue with the matching verified address information provided below."></translate-content> </div> <div class="row"> <div class="col-sm-6"> <div class="well well-sm"> <div class="checkbox"> <label> <input type="radio" ng-click="selectedAddressChanged(originalAddress)" ng-checked="selectedAddress == originalAddress" /> <strong><translate-content container="confirm-address" key="EnteredAddress" default-content="Entered Address"></translate-content></strong> </label> <div class="pad-left"> <div class="padding-xs"></div> <read-only-address security-context="{{securityContext}}" address="originalAddress"></read-only-address> </div> </div> </div> </div> <div class="col-sm-6"> <div class="alert alert-danger" ng-show="validationResult.ValidationMessages.length > 0 && validationResult.ValidatedAddresses == 0"> <strong><translate-content container="confirm-address" key="Errors" default-content="Errors"></translate-content></strong> <div ng-repeat="validationMessage in validationResult.ValidationMessages"> {{validationMessage}} </div> </div> <div ng-show="validationResult.ValidatedAddresses.length > 0"> <div ng-repeat="address in validationResult.ValidatedAddresses" class="well well-sm"> <div class="checkbox"> <label> <input type="radio" ng-click="selectedAddressChanged(address)" ng-checked="selectedAddress == address" /> <strong><translate-content container="confirm-address" key="ValidatedAddress" default-content="Validated Address"></translate-content></strong> </label> <div class="pad-left"> <div class="padding-xs"></div> <read-only-address security-context="{{securityContext}}" address="address"></read-only-address> </div> </div> </div> </div> </div> </div> <div class="padding"></div> <button type="button" ng-click="saveSelectedAddress()" class="btn btn-primary pull-right btnSaveChanges"> <i class="fa fa-fw fa-check-circle-o" aria-hidden="true"></i> <translate-content container="confirm-address" key="ContinueWithSelectedAddress" default-content="Continue with selected address."></translate-content> </button></div>',
        link: function (scope, element, attrs) {
            securityService.setSecurity(scope.securityContext, scope);

            var init = function () {
                var promises = [appService.makeReady()];

                $q.all(promises).then(function () {
                    promises = [translationService.getTranslations("confirm-address")];
                    $q.all(promises).then(function () {
                        var defaultTitle = 'Confirm Address';

                        if (translationService.translations['confirm-address']) {
                            if (translationService.translations['confirm-address']['ConfirmAddress']) {
                                defaultTitle = translationService.translations['confirm-address']['ConfirmAddress'];

                            }
                        }

                        var titleToShow = defaultTitle;
                        if (scope.windowTitle) {
                            titleToShow = scope.windowTitle;
                        }

                        if (scope.confirmAddressWindow) {
                            scope.confirmAddressWindow.title(defaultTitle);
                        }

                        if (scope.validationResult) {
                            chooseSelectedAddress(scope.validationResult);
                        }
                    });
                });
            };

            scope.$watch('windowTitle', function (newValue) {
                if (scope.confirmAddressWindow && newValue) {
                    scope.confirmAddressWindow.title(newValue);
                }
            });

            var chooseSelectedAddress = function (validationResult) {
                if (validationResult != null) {
                   
                    if (validationResult.ValidatedAddresses.length > 0) {
                        scope.selectedAddress = validationResult.ValidatedAddresses[0];
                    }
                    else {
                        scope.selectedAddress = scope.originalAddress;
                    }
                }
            };

            scope.$watch('validationResult', function (newValue) {
                if (newValue != null) {
                    scope.originalAddress = newValue.OriginalAddress;
                }

                chooseSelectedAddress(newValue);
            });

            scope.selectedAddressChanged = function (addressSelected) {
                scope.selectedAddress = addressSelected;
            };

            scope.saveSelectedAddress = function () {
                if (scope.selectedAddress == scope.originalAddress) {
                    scope.selectedAddress.IsValid = false;
                }
                else {
                    scope.selectedAddress.IsValid = true;
                }

                scope.addressSelect({ addressSelected: scope.selectedAddress });
                scope.confirmAddressWindow.close()
            }

            init();
        }
    }
}
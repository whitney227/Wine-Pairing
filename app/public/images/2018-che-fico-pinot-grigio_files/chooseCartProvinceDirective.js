(function () {
    'use strict';

    var app = angular.module('app');

    app.directive('chooseCartProvince', function ($timeout, $q, $location, shoppingCartModel) {
        return {
            restrict: 'E',
            scope: {
                provinces: '=',
                provinceSelected: '&'
            },
            template: '<div class="row"><div class="col-md-6 col-sm-12 col-md-offset-3"><div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><translate-content container="shopping-cart" key="choose-your-province" default-content="Choose Your State or Province"></translate-content></h3></div><div class="panel-body form-inline"><help-text class="shopping-cart-choose-province-helptext" key="shopping-cart-choose-province-instructions"></help-text><div class="text-center"><div class="form-group"><select class="form-control" autocomplete="country-name" ng-model="provinceID" ng-required="true" ng-options="Province.ProvinceID as Province.Name for Province in provinces" name="provinceID"></select></div>&nbsp;<button class="btn btn-primary" ng-click="selectProvince(provinceID)"><translate-content container="shopping-cart" key="use-this-province" default-content="Start Shopping"></translate-content></button></div></div></div></div></div>',
            link: function (scope, element, attributes) {

                scope.shoppingCartModel = shoppingCartModel;

                scope.selectProvince = function (provinceID) {
                    if (typeof provinceID == 'undefined' || provinceID == null) {
                        idstc().dialog({ type: 'alert', message: idstc().translate('shopping-cart', 'YouMustSelectAProvinceState', 'You must select a Province/State in order to continue to the shopping cart.'), title: '', success: 'success' });
                    }
                    else {
                        localStorage.setItem('provinceID', provinceID);
                        var foundProvince = _.find(scope.provinces, function (province) { return province.ProvinceID === provinceID; });
                        if (foundProvince != null) {
                            localStorage.setItem('provinceName', foundProvince.Name);
                        }
                        scope.provinceSelected();  //bubble up that this province was selected
                    }
                };                
            }
        };
    });
})();
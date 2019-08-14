(function () {
    'use strict';

    var app = angular.module('app');

    app.directive('viewCartLink', function ($timeout, $q, $location, appService, translationService, shoppingCartModel, $rootScope) {
        return {
            restrict: 'E',
            scope: {
                cart: '='
            },
            replace: true,
            template: '<a ng-href="{{shoppingCartModel.translatedPageNames.viewCart}}"><div ng-if="shoppingCartModel.cart.CartID == shoppingCartModel.customerCartID || shoppingCartModel.cart.CartID == null"><i class="fa fa-shopping-cart" aria-hidden="true"></i> {{shoppingCartModel.cartItemCount || 0 }}</div></a>',
            link: function (scope, element, attributes) {

                scope.dataReady = false;                
                scope.shoppingCartModel = shoppingCartModel;
                scope.expanded = false;

                scope.$on("cart.cartIDChanged", function (e, cartID) {
                    shoppingCartModel.cart.CartID = idstc().getExpirableLocalStorageVar('CartID', 1440);
                    shoppingCartModel.customerCartID = idstc().getExpirableLocalStorageVar('CustomerCartID', 1440);
                });

                scope.init = function () {
                   shoppingCartModel.cart.CartID = idstc().getExpirableLocalStorageVar('CartID', 1440);

                    if (localStorage.getItem('CustomerCartID') != null && localStorage.getItem('CartID') != 'null') {
                        var promises = [appService.makeReady()];

                        $q.all(promises).then(function (result) {
                            if (localStorage.getItem('CartItemQuantity') != null && localStorage.getItem('CartItemQuantity') != 'null') {
                                shoppingCartModel.cartItemCount = localStorage.getItem('CartItemQuantity');
                            }
                            else {
                                shoppingCartModel.cartItemCount = 0;
                            }
                            shoppingCartModel.customerCartID = idstc().getExpirableLocalStorageVar('CustomerCartID', 1440);
                            if (typeof shoppingCartModel.cart.CartID == 'undefined' || shoppingCartModel.cart.CartID == null) {
                                shoppingCartModel.cart.CartID = shoppingCartModel.customerCartID;
                            }
                            scope.dataReady = true;
                        });
                    }
                    else {
                        scope.dataReady = true;
                    }
                }
                scope.init();
            }
        }
    });
})();
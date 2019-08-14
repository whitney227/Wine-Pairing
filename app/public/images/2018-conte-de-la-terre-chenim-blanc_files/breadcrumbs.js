(function (angular) {
    'use strict';

    var app = angular.module('app');

    app.directive('breadcrumbs', function (shoppingCartModel, $location) {
        return {
            restrict: 'E',
            scope: {
                crumbs: '=',
                doRedirect: '=',
                product: '='
            },
            template: '<ol class="breadcrumb"><li><a href="/"><translate-content container="shopping-cart" key="BreadcrumbHome" default-content="Home"></translate-content></a></li><li ng-repeat="crumb in crumbs">' +
            '<a style="cursor: pointer" ng-if="doRedirect" ng-href="{{crumb.link}}/{{crumb.urlExtension}}">{{crumb.name}}</a>' +
            '<a style="cursor: pointer" ng-if="!doRedirect" ng-click="goToCategory(crumb.id)">{{crumb.name}}</a>' +
            '</li><li ng-if="product">{{product}}</li></ol>',
            link: function (scope, element, attributes) {
                scope.goToCategory = function (categoryId) {
                    if (categoryId != shoppingCartModel.selectedCategoryId) {
                        $(document).progressStart();
                        shoppingCartModel.setSelectedCategory(categoryId, true);
                    }
                }
            }
        }
    })
})(angular);
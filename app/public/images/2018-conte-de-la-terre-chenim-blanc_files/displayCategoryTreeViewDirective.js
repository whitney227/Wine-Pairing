(function () {
    'use strict';

    var app = angular.module('app');

    app.directive('displayCategoryTreeView', function ($timeout, $q, $location, $route, appService, shoppingCartModel, $rootScope, $window) {
        return {
            restrict: 'E',
            scope: {
                selectedCategoryId: '=',
                doRedirect: '=',  // set to true from the product detail page so it can do full redirect to cart (multi-product) page;  set to false if just loading new category on cart page.
                currentPage: '=?',
                loadProducts: '=?'
            },
            replace: true,
            template: '<div kendo-tree-view="displayCategoryTreeView" k-options="treeOptions" k-data-source="treeViewCategories" k-data-text-field="\'Name\'" k-ng-delay="treeViewCategories"></div>',
            link: function (scope, element, attributes) {

                scope.lsCartID = idstc().getExpirableLocalStorageVar('CartID', 1440);
                scope.categories = shoppingCartModel.categories;
                scope.flatCategories = shoppingCartModel.flatCategoriesList;

                if (scope.loadProducts == null) scope.loadProducts = false;

                scope.dataReady = false;
                scope.subtotal = 0;
                scope.CartID = shoppingCartModel.cart.CartID;

                scope.treeOptions = {
                    loadOnDemand: false,
                    template: '<span ng-click="categoryChanged(dataItem)">#= item.Name #</span>'
                };

                scope.init = function () {
                    var promises = [appService.makeReady()];

                    $q.all(promises).then(function (result) {

                        promises = [shoppingCartModel.verifyAndSetCart()];

                        $q.all(promises).then(function (result) {

                            if (shoppingCartModel.categories != null && shoppingCartModel.categories.length > 0) {
                                scope.setCategories();
                            }

                            scope.dataReady = true;

                            $timeout(function () {

                                if (scope.selectedCategoryId == null) {

                                }
                                else {
                                    scope.setSelectedCategory(scope.selectedCategoryId);
                                }
                            }, 100);
                        });
                    });
                }

                scope.setCategories = function () {
                    scope.categories = shoppingCartModel.categories;
                    scope.flatCategories = shoppingCartModel.flatCategoriesList;
                    scope.treeViewCategories = new kendo.data.HierarchicalDataSource({
                        data: scope.categories,

                        schema: {
                            model: {
                                id: 'DisplayCategoryID',
                                hasChildren: 'Children',
                                children: 'Children'
                            }
                        }
                    });

                    shoppingCartModel.treeViewCategories = scope.treeViewCategories;

                }

                scope.$on('displayCategoriesUpdated', function (e, kvp) {
                    scope.setCategories();
                });

                scope.$watch('selectedCategoryId', function (newValue, oldValue) {
                    scope.setSelectedCategory(newValue);
                });


                // The selected display category has been changed (handle it)
                // This can be triggered programatically or by the user clicking a category
                scope.categoryChanged = function (dataItem) {
                    if (dataItem != null) {
                        if (scope.doRedirect) {
                            $window.location.href = '/' + shoppingCartModel.translatedPageNames.products + '/' + dataItem.URLExtension;
                        }
                        else {
                            if (shoppingCartModel.searchingProduct == false) {
                                if (scope.selectedCategoryId != dataItem.DisplayCategoryID || $location.path() == '/order/' || $location.path().toLowerCase().indexOf(dataItem.URLExtension.toLowerCase()) == -1) {
                                    $(document).progressStart();
                                    shoppingCartModel.cartItemsUpdating = true;

                                    scope.selectedCategoryId = dataItem.DisplayCategoryID;
                                    shoppingCartModel.searchText = '';
                                    $location.search('search', null);
                                    $location.search('pg', 1);

                                    if ($location.path().toLowerCase() == '/order' || $location.url().toLowerCase().indexOf('/order/') != -1) {
                                        if ($location.search().pg == null) {
                                            $location.search('pg', getCookie('idstcItemCurrentPage') || 1);
                                        }
                                        if ($location.search().items == null) {
                                            $location.search('items', getCookie('idstcItemsPerPage') || 24);
                                        }

                                        $location.path('/' + shoppingCartModel.translatedPageNames.products + '/' + dataItem.URLExtension);
                                    }

                                    var promises = [shoppingCartModel.setSelectedCategory(scope.selectedCategoryId, scope.loadProducts)];

                                    $q.all(promises).then(function (result) {
                                        $(document).progressFinish();
                                        shoppingCartModel.cartItemsUpdating = false;
                                        return;
                                    });
                                }
                            }
                            else {
                                shoppingCartModel.searchingProduct = false;
                                scope.categoryChanged(dataItem);
                            }
                        }
                    }
                }

                // Set the selected item on the actual tree view (highlight it to user)
                // This is needed when defaulting to a particular category id on load
                scope.setSelectedCategory = function (categoryId) {
                    if (scope.displayCategoryTreeView != null) {
                        if (categoryId == null) {
                            scope.displayCategoryTreeView.select($());
                        }
                        else {
                            var getitem = scope.displayCategoryTreeView.dataSource.get(categoryId);

                            if (getitem != null) {
                                scope.displayCategoryTreeView.findByUid(getitem.uid);
                                var selectitem = scope.displayCategoryTreeView.findByUid(getitem.uid);
                                scope.displayCategoryTreeView.select(selectitem);
                                scope.displayCategoryTreeView.expandTo(getitem);
                            }

                            var searchObject = {
                                CartID: scope.lsCartID,
                                DisplayCategoryID: categoryId
                            };
                        }
                    }
                }

                if (scope.lsCartID == null) {
                    if (typeof scope.CartID == 'undefined') {
                        $rootScope.$on('CartID', function (event, args) {
                            scope.init();
                        });
                    }
                }
                else {
                    scope.init();
                }
            }
        }
    });
})();
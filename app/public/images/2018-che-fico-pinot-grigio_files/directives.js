(function () {
    'use strict';

    var app = angular.module('app');

    app.directive('acutaCategoryTree', function ($timeout) {
        return {
            restrict: 'E',

            transclude: true, //We can take in a kendo template!
            scope: {
                treeView: '=',
                categories: '=',
                categoryChanged: '&',
                setUnselectAndCollapseAllCategoriesFn: '&',
                setSelectCategoryFn: '&'
            },
            replace: true,
            template: '<div kendo-tree-view="treeView"  k-data-source="categories"  k-on-select="didselect(kendoEvent)" k-on-data-bound="databoundhappened(kendoEvent)" k-on-change="categoryChanged({currentCategory: dataItem})" ><ng-transclude></ng-transclude></div>',
            link: function (scope, element, attributes) {
                //Kendoi still not ready after this.
                //$timeout(function () {
                //DOM has finished rendering

                //    scope.treeView.dataSource.bind("requestEnd", scope.handleDataSourceCompletion);
                //});

                scope.handleDataSourceCompletion = function (e) {

                    //if 0, nothing selected yet.                    

                    //If the tree is collapsed, this will not find the node we need. May need to file a bug
                    if (scope.treeView) {
                        var item = scope.treeView.findByText("Sub Category 4");

                        if (item && item.length > 0) {
                            //scope.treeView.expandPath([1, 4]);
                            scope.treeView.expandTo(item[0]);
                            scope.treeView.select(item[0].text);
                        }
                    }
                };

                scope.unselectAndCollapseAllCategories = function () {
                    scope.treeView.select($());
                    //scope.treeView.collapse(".k-item");
                };

                scope.setUnselectAndCollapseAllCategoriesFn({ theDirFN: scope.unselectAndCollapseAllCategories });

                scope.selectCategory = function (Id) {
                    //scope.treeView.expand(".k-item");

                    var dataSource = scope.treeView.dataSource;
                    var node = scope.findTreeviewNodeById(dataSource.data(), Id);
                    if (node != null) {
                        var foundnode = scope.treeView.findByUid(node.uid);
                        scope.treeView.select(foundnode);
                    }
                };

                scope.setSelectCategoryFn({ theDirFN: scope.selectCategory });

                scope.findTreeviewNodeById = function (nodedata, Id) {
                    var node = null;

                    for (var i = 0; i < nodedata.length; i++) {
                        nodedata[i].load();
                        if (nodedata[i].id === Id) {
                            node = nodedata[i];
                        }
                        else if (nodedata[i].hasChildren) {
                            node = scope.findTreeviewNodeById(nodedata[i].children.data(), Id);
                        }

                        if (node != null)
                            if (node != nodedata[i]) {
                                var foundnode = scope.treeView.findByUid(nodedata[i].uid);
                                scope.treeView.expand(foundnode);
                            }
                        break;
                    }

                    return node;
                }
            }
        }
    });

    app.directive('acutaCategoryHeader', function () {

        return {
            restrict: 'E',
            //priority: 99,
            scope: {
                imgSrc: '=categoryImage',
                header: '=',
                description: '='
            },
            replace: true,
            template: ''
            + '   <div class="media">                                              '
            + '     <div class="media-left">                                       '
            + '       <a href="/order">                                                 '
            + '         <img class="media-object" ng-src="{{imgSrc}}" >             '
            + '       </a>                                                         '
            + '     </div>                                                         '
            + '     <div class="media-body">                                       '
            + '       <h4 class="media-heading">{{header}}</h4>                 '
            + '       {{description}}                                                         '
            + '     </div>                                                         '
            + '   </div>                                                           '


        }
    });

    app.directive('acutaRewardsHeader', function () {

        return {
            restrict: 'E',
            scope: {
                gotoStandardShopping: '&gotoStandardShopping'
            },
            replace: true,
            template: ''
            + '   <div class="well well-sm">                                              '
            + '       <h3><translate-content container="shopping-cart" key="ShoppingForRewards" default-content="Shopping For Rewards"></translate-content></h3>'
            + '       <p><translate-content container="shopping-cart" key="ShoppingForRewardsDescription" default-content="You are shopping for your rewards.  When you have chosen your rewards, you can continue to shop the entire catalog."></translate-content></p>'
            + '       <button type="button" class="btn btn-warning pull-right" ng-click="leaveRewardShopping()"><translate-content container="shopping-cart" key="LeaveRewardShopping" default-content="Leave Reward Shopping"></translate-content></button> '
            + '       <div class="clearfix"></div>                                                     '
            + '   </div>                                                           ',
            link: function (scope, el, attr) {

                scope.leaveRewardShopping = function () {
                    scope.gotoStandardShopping();
                };
            }
        }
    });

    // This is the Display Icon widget so the user can choose between list and grid layouts on the cart product display
    app.directive('appView', function () {
        return {
            restrict: 'A',
            scope: {
                appView: '=' // <= link view property of directive's scope to some property in the parent scope (scope of appController) specified in app-view attribute of root element of directive
            },
            replace: true,
            template: '<div class="btn-group"><button class="btn btn-default btn-inline-form" ng-repeat="v in views" ng-click="switchView(v)"><i ng-class="v.icon" aria-hidden="true"></i></button></div>',
            link: function (scope, el, attr) {
                scope.views = [
                    {
                        name: 'List',
                        template: 'list.html',
                        icon: 'fa fa-list'
                    }, {
                        name: 'Grid',
                        template: 'grid.html',
                        icon: 'fa fa-th'
                    }
                ];
            },
            controller: function ($scope) {
                $scope.switchView = function (view) {
                    $scope.appView = view.template; // <- modify parent scope view
                    document.cookie = "idstcItemView=" + view.template + "; path=/";
                }
            }
        }
    });

    // This is used to add css class to variation type options that do not have a matching product based on the other current selections
    app.directive('optionsClass', function ($parse) {
        return {
            require: 'select',
            link: function (scope, elem, attrs, ngSelect) {

                var parts = attrs.ngOptions.split(' ');
                var optionsSourceStr = parts[parts.indexOf('in') + 1];
                var getOptionsClass = $parse(attrs.optionsClass);

                scope.$watchCollection(optionsSourceStr, function (items) {
                    scope.$$postDigest(function () {
                        angular.forEach(items, function (item, index) {
                            var classes = getOptionsClass(item);
                            var option = elem.find('option[value="number:' + item.VariationTypeOptionID + '"]');

                            angular.forEach(classes, function (add, className) {
                                if (!item.Selectable) {
                                    angular.element(option).addClass('not-selectable');
                                }
                            });
                        });
                    });
                });
            }
        };
    });
})();
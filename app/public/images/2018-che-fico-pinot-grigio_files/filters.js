(function () {
    'use strict';

    var app = angular.module('app');

    app.filter('filterByDisplayCategory', function () {

        return function (products, currentDisplayCategory) {

            return (products || []).filter(function (product) {

                if (typeof currentDisplayCategory === 'undefined' || currentDisplayCategory === null) { //if no cats, show all product. Likely will be used from search
                    return true;
                }

                var hasDisplayCategory = function (displayCategory) {
                    return displayCategory.displayCategoryID == parseInt(currentDisplayCategory, 10);
                }

                if (product != null && product.displayCategories != null && product.displayCategories.length > 0) {
                    return product.displayCategories.some(hasDisplayCategory)
                }

                return false;
            });
        };
    });
})();
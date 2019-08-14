(function () {
    'use strict';

    angular.module('app').directive('associatedProducts', function () {
        return {
            restrict: 'E',
            scope: {
                products: '=products',
                cart: '=cart',
                page: '=page'
            }, //WebsiteChange
            template: '<span ng-if="products.length"> <link href="//cdn.jsdelivr.net/jquery.slick/1.6.0/slick.css" rel="stylesheet" /></span><div class="AssociatedProductsContainer" ng-hide="!products.length"> <hr> <h3><translate-content container="shopping-cart" key="other-items" default-content="Other Items You May Like"></translate-content></h3> <div id="AssociatedProductsSlider" class="row"> <div class="col-lg-2 col-md-4 col-sm-6 pad-bottom text-center AssociatedProducts" ng-repeat="product in products" associated-products-loaded> <a href="/{{page}}/{{product.CartUrl}}" class="AssociatedProductsLink"> <div class="product-thumbnail"> <img ng-src="{{product.ProductImage }}" class="AssociatedProductsImage product-thumbnails img-responsive center-block" /> </div> <div class="product-name"> {{product.ProductDisplayName}} </div> </a> <small> <s ng-hide="!product.ComparePrice">{{product.ComparePrice | currencyFormat: cart.CurrencyTypeID}}</s> {{product.BasePrice | currencyFormat: cart.CurrencyTypeID}} </small> </div> </div></div>',
            link: function (scope, element, attrs) {
                scope.$on('associatedProductsLoaded', function (scope, element, attrs) {
                    //Destroy the slick slider if already created
                    if ($('#AssociatedProductsSlider').hasClass('slick-initialized')) {
                        $('#AssociatedProductsSlider').slick("unslick");
                    }

                    $('#AssociatedProductsSlider').slick({
                        arrows: true,
                        infinite: false,
                        slidesToShow: 4,
                        slidesToScroll: 4,
                        responsive: [
                        {
                            breakpoint: 992,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 2
                            }
                        },
                        {
                            breakpoint: 480,
                            settings: {
                                slidesToShow: 1,
                                slidesToScroll: 1
                            }
                        }
                        ]
                    });
                });
            }
        };
    });

    //CMH - This allows an event to be triggered when the last associated product is loaded in the ng-repeat of the associatedProducts directive
    angular.module('app').directive('associatedProductsLoaded', function () {
        return function (scope, element, attrs) {
            if (scope.$last) setTimeout(function () {
                scope.$emit('associatedProductsLoaded', element, attrs);
            }, 1);

            if (scope.$last) setTimeout(function () {
                scope.$emit('associatedProductsLoaded', element, attrs);
            }, 1000);
        };
    })
})();
angular
    .module('app')
    .directive('checkCryptoImage', checkCryptoImage);

checkCryptoImage.$inject = ['$http'];

function checkCryptoImage($http) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            attrs.$observe('ngSrc', function (ngSrc) {
                $http.get(ngSrc).success(function () {
                }).error(function () {
                    element.attr('src', 'content/images/cryptoicons/NoImage.png'); // set default image
                });
            });
        }
    };
};
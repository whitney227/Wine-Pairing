(function ($) {
    angular.module('app').requires.push('ngRoute');
    angular.module('app').requires.push('ngAnimate');
    angular.module('app').requires.push('angularUtils.directives.dirPagination');

    // Handle routing errors and success events
    angular.module('app').run(['$route', function ($route) {
        // Include $route to kick start the router.
    }]);

    angular.module('app').run(['$rootScope', '$location', function ($rootScope, $location) {
        $rootScope.$on("$routeChangeStart", function (event, next, current) {
            $(this).progressStart();
        });

        $rootScope.$on("$routeChangeSuccess", function (scope, next, current) {
            $(this).progressFinish();
        });
    }]);
}(jQuery));

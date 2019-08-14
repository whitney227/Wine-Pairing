(function () {
    'use strict';

    var injectParams = ['$location', '$rootScope', '$http', '$templateCache', '$q', '$document', '$scope', 'shoppingCartModel'];

    shell.$inject = injectParams;

    angular.module('app').controller('shell', shell);

    function shell($location, $rootScope, $http, $templateCache, $q, $document, $scope, shoppingCartModel) {
        var vm = this;

        vm.busyMessage = 'Please wait ...';
        vm.isBusy = true;
        vm.appReady = false;
        vm.getInfo = false;
        vm.shoppingCartModel = shoppingCartModel;
        vm.cartReady = '';

        idstc().getTranslationsFromServer('general');

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        //adds notificaiton functions to the supplied object (likely the vm or $scope)
        //ex. vm.showSuccess('yay', 'title goes here');
        (function createNotificationProxy(m) {
            var notificationTypes = ['success', 'warn', 'error', 'alert'];

            notificationTypes.forEach(function (element, index, array) {

                m['show' + capitalizeFirstLetter(element)] = function (message, title) {
                    idstc().notify({ message: message, title: title, success: element });
                }
            });
        })(vm);

        vm.init = function () {
            // Use promises to wait for all data before displaying form

            var promises = [];

            $q.all(promises).then(function () {
                vm.appReady = true;
            });

        }

        vm.init();

        $scope.$on('$locationChangeStart',
            function (event, next, current) {
                //var nextPath = $location.path();                
                //if (nextPath == '/checkout') { }
            }
        );

    };

})();
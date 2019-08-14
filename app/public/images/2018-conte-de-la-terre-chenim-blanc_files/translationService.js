(function () {
    'use strict';

    angular.module('app').service('translationService', ['$http', '$q', 'appService', function ($http, $q, appService) {

        var service = this;

        // Public property so that directives/controllers can use this data globally
        service.translations = {};

        service.getTranslations = function (container) {
            var containerTranslations;
            var translations = idstc().getExpirableSessionStorageVar('translations', 60);

            if (translations == null) {
                translations = {};
            }
            else {
                translations = JSON.parse(translations);
                containerTranslations = translations[container];
            }

            if (containerTranslations == null) {
                if (service[container + 'promise']) {
                    return service[container + 'promise'];
                }

                service[container + 'promise'] = $http.get(apiRoot + 'api/translation/getTranslations?container=' + container).then(
                    function (resp) {
                        // Get from storage again in case another call caused an update while waiting for this response from server
                        var translations = idstc().getExpirableSessionStorageVar('translations', 60);
                        if (translations == null) {
                            translations = {};
                        }
                        else {
                            translations = JSON.parse(translations);
                        }

                        translations[container] = resp.data; // Set to local variable and use that for session storage (doesn't seem to like stringify'ing the angular scope variable)
                        service.translations[container] = resp.data;

                        idstc().setExpirableSessionStorageVar('translations', JSON.stringify(translations));    
                    },
                    function (error) {
                        idstc().processError({ error: error, showNotifications: true });
                    });

                return service[container + 'promise'];
            }
            else {
                service.translations[container] = containerTranslations
            }
        }

        service.init = function () {
            var promises = [appService.makeReady()];

            $q.all(promises).then(function (result) {
                service.getTranslations('general');
            });
        }

        service.init();
    }]);
})();

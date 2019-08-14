
angular.module('app')
    .directive('translateContent', function ($http, translationService) {
        return {
            restrict: 'E,A',
            scope: {
                container: '@container', // The key container (used to allow the same key to be translated differently for different containers)
                key: '@key',  // The key of the translatable content
                defaultContent: '@defaultContent'   // The default content in case the key does not return any content and to help make the implementation human-readable/searchable                
            },
            template: '{{translations[container][key] || translations[container][key.toLowerCase()] || defaultContent}}',
            link: function (scope, element, attrs) {                                
                scope.translations = translationService.translations;                                
            }
        };
    });
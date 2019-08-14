angular
    .module('app')
    .directive('helpText', helpText);

helpText.$inject = ['$http', '$filter', '$sce', 'appService'];

function helpText($http, $filter, $sce, appService) {
    return {
        restrict: 'E',
        scope: {
            key: '@key',
        },
        template: '<div class="help-text-group" ng-show="helpTextType == 0 && trustedHelpTextDescription != null && trustedHelpTextDescription != \'\'"> <div class="alert alert-info help-accordion"> <div class="col-md-1 text-center"> <i class="fa fa-question-circle fa-3x"></i> </div> <div class="col-md-11"> <div ng-bind-html="trustedHelpTextDescription"></div> </div> <div class="clearfix"></div> </div> </div> <span ng-show="helpTextType == 1"> <i class="fa fa-question" id="help-text-popover" data-toggle="popover" data-content="{{helpTextDescription}}"></i> </span>',
        link: function (scope, element, attrs) {
            var readMoreTranslated = idstc().translate('help-text', 'help-text-link', 'Read more');

            var setPopupInfo = function () {
                //some hacky stuff below. when using the bootstrap popover, anguarjs isn't recognized, so let's do every thing manually

                var template = undefined;

                if (scope.articleID == null) {
                    template = '<div role="tooltip" class="popover"><div class="arrow"></div><div class="popover-content"></div></div>';
                }

                var popOverOptions = {
                    html: true,
                    template: template,
                    trigger: 'click hover',
                    animation: false
                };

                var popOverElement = angular.element(document.getElementById('help-text-popover'));
                popOverElement.popover(popOverOptions);
            }

            var setData = function () {
                var data = appService[scope.keyCleaned];

                scope.helpTextDescription = data.Description;
                scope.trustedHelpTextDescription = $sce.trustAsHtml(scope.helpTextDescription);
                scope.helpTextType = data.Type;
                scope.helpTextEnabled = data.Enabled;

                if (!scope.helpTextEnabled) {
                    //remove the directive from the dom
                    element.remove();
                    return;
                }

                var toolTipType = 1;
                if (scope.helpTextType == toolTipType) {
                    setPopupInfo();
                }
            }

            var getHelpTextForKey = function (key) {
                //-1 is a placeholder key. This means we are changing the help text key and applying it's new values
                if (key != null && key != '' && key != '-1') {
                    var keyCleaned = key.replace('-', '');
                    scope.keyCleaned = keyCleaned;

                    if (appService[keyCleaned] == null) {
                        $http.get(apiRoot + '/HelpText/GetHelpTextToDisplay/' + key).then(
                            function (response) {
                                appService[scope.keyCleaned] = response.data;
                                setData();
                            },
                            function (error) {
                                //if we got an error, show default help text
                                console.log(error);
                                scope.helpTextType = 0;
                            });
                    }
                    else {
                        setData();
                    }
                }
                else {
                    //set default values for help text if the key isn't valid or a placeholder
                    var data = {
                        Description: '',
                        Type: 0,
                        Enabled: true
                    }

                    scope.keyCleaned = '-1'; //just a placeholder
                    appService[scope.keyCleaned] = data;
                    setData();
                }
            };

            getHelpTextForKey(scope.key);

            scope.$watch('key', function (newKey, oldKey) {
                //if the help text key changes, re-do the usual steps to apply the help text description
                if (newKey != oldKey) {
                    getHelpTextForKey(newKey);
                }
            });
        }
    }
}
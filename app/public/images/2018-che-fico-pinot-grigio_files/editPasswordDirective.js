angular.module('app')
    .directive('editPassword', function (appService, $q, $http, securityService, translationService, shoppingCartModel) {

        return {
            restrict: 'E',
            scope: {
                passwordContainer: '=',
                labelClass: '@labelClass',
                inputClass: '@inputClass',
                personType: '<personType', // Consultant, Customer
                securityContext: '=?securityContext',    // The security context under which to operate
                validationContext: '=?validationContext'  // The validation context (form) under which to operate
            },
            template: '<style>\
                        .close-password-button { float: right; cursor: pointer; }\
                       </style>\
                <div class= "form-group password-field" ng-if= "!PasswordNoAccess">\
                    <label class="{{labelClass}} control-label col-md-4">\
                    <translate-content container="person-create-edit" key="Password" default-content="Password"></translate-content>\
                    <span class="text-danger required-marker" ng-show="PasswordRequired">*</span>\
                    </label>\
                <div class="{{inputClass}} col-md-8">\
                    <input type="password"\
            class="form-control"\
                        autocomplete="new-password"\
                        ng-model="passwordContainer.Password"\
                        ng-disabled="PasswordReadonly"\
                        ng-required="PasswordRequired"\
                        ng-keyup="passwordKeyUp()"\
                        ng-focus="showPasswordRequirements = true; validatePassword();"\
                        ng-blur="showPasswordRequirements = false"\
                        name="password"\
                        id="password" />\
                    <div ng-show="showPasswordRequirements" id="pswd_info">\
                        <span id="close" ng-click="showPasswordRequirements = false" class="modal-close-button close-password-button">x</span>\
                        <h4><translate-content container="person-create-edit" key="PasswordRequirements" default-content="Password must meet the following requirements:"></h4>\
                            <ul>\
                                <li id="minLetter" class="{{minLetterClass}}" ng-hide="securitySettings.PasswordMinLetters<1">{{ minLettersMsg }}</li>\
                                <li id="minUpper" class="{{minUpperClass}}" ng-hide="securitySettings.PasswordMinUppercase<1">{{ minUpperLettersMsg }}</li>\
                                <li id="munNumber" class="{{ minNumberClass }}" ng-hide="securitySettings.PasswordMinNumbers<1">{{ minNumbersMsg }}</li>\
                                <li id="minLength" class="{{ minLengthClass }}" ng-hide="securitySettings.PasswordMinLength<1">{{ minLengthMsg }}</li>\
                                <li id="minSpecialChars" class="{{minSpecialCharClass}}" ng-hide="securitySettings.PasswordMinSpecialChars<1">{{ minSpecialCharsMsg }}</li>\
                            </ul>\
        </div>\
                    </div>\
                </div>\
                <div class= "form-group confirm-password-field" ng-if= "!PasswordNoAccess">\
                    <label class="{{labelClass}} control-label col-md-4">\
        <translate-content container="person-create-edit" key="ConfirmPassword" default-content="Confirm Password"></translate-content>\
        <span class="text-danger required-marker" ng-show="PasswordRequired">*</span>\
                    </label>\
        <div class="{{inputClass}} col-md-8">\
                        <input type="password" class="form-control" ng-model="passwordContainer.ConfirmPassword" ng-disabled="PasswordReadonly" ng-required="PasswordRequired" name="confirmPassword" id="confirmPassword" />\
                    </div>\
                </div> ',
            link: function (scope, element, attrs) {
                scope.$watch('personType', function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        scope.init();
                    }
                }, true);

                scope.init = function () {
                    var promises = [appService.makeReady()];

                    $q.all(promises).then(function () {

                        scope.$on('person.loaded', function (e, person) {
                            scope.BusinessUnitID = person.Person_OtherInformation.BusinessUnitID;
                            securityService.setSecurity(scope.securityContext, scope);
                            securityService.setValidation(scope.validationContext, scope);

                            if (shoppingCartModel && shoppingCartModel.cart && shoppingCartModel.cart.SubjectTypeID) {
                                if (shoppingCartModel.cart.SubjectTypeID == 2 && sessionStorage.getItem('CartSubjectClassificationTypeID') == '3') {
                                    scope.PasswordRequired = false;
                                }
                            }
                        });

                        scope.$watch('PasswordRequired', function (newValue, oldValue) {
                            if (shoppingCartModel && shoppingCartModel.cart && shoppingCartModel.cart.SubjectTypeID) {
                                if (shoppingCartModel.cart.SubjectTypeID == 2 && sessionStorage.getItem('CartSubjectClassificationTypeID') == '3') {
                                    scope.PasswordRequired = false;
                                }
                            }
                        });

                        if (scope.personType == null || scope.personType.toLowerCase() == 'customer') {
                            scope.personTypeId = 2; // Customer
                        }
                        else {
                            scope.personTypeId = 1; // Consultant
                        }

                        promises = [translationService.getTranslations('person-create-edit')];

                        $q.all(promises).then(function () {
                            promises = [scope.getUserLoginSecuritySettings()];

                            $q.all(promises).then(function () {
                                scope.dataReady = true;

                                scope.$emit('editPasswordLoaded', element, attrs);
                            });
                        });
                    });
                }

                scope.getUserLoginSecuritySettings = function () {
                    return $http.get(apiRoot + 'api/Security/GetUserLoginSecuritySettings/?personTypeId=' + scope.personTypeId).then(
                        function (resp) {
                            scope.securitySettings = resp.data;

                            scope.minLettersMsg = translationService.translations['person-create-edit']['PasswordMinLettersMsg'] || 'At least {{PasswordMinLetters}} letter(s).';
                            scope.minUpperLettersMsg = translationService.translations['person-create-edit']['PasswordMinUpperMsg'] || 'At least {{PasswordMinUppercase}} uppercase letter(s).';
                            scope.minNumbersMsg = translationService.translations['person-create-edit']['PasswordMinNumbersMsg'] || 'At least {{PasswordMinNumbers}} number(s).';
                            scope.minSpecialCharsMsg = translationService.translations['person-create-edit']['PasswordSpecialCharsMsg'] || 'At least {{PasswordMinSpecialChars}} special character(s).';
                            scope.minLengthMsg = translationService.translations['person-create-edit']['PasswordMinLengthMsg'] || 'At least {{PasswordMinLength}} characters in length.';

                            scope.minLettersMsg = scope.minLettersMsg.replace('{{PasswordMinLetters}}', scope.securitySettings.PasswordMinLetters);
                            scope.minUpperLettersMsg = scope.minUpperLettersMsg.replace('{{PasswordMinUppercase}}', scope.securitySettings.PasswordMinUppercase);
                            scope.minNumbersMsg = scope.minNumbersMsg.replace('{{PasswordMinNumbers}}', scope.securitySettings.PasswordMinNumbers);
                            scope.minSpecialCharsMsg = scope.minSpecialCharsMsg.replace('{{PasswordMinSpecialChars}}', scope.securitySettings.PasswordMinSpecialChars);
                            scope.minLengthMsg = scope.minLengthMsg.replace('{{PasswordMinLength}}', scope.securitySettings.PasswordMinLength);
                        },
                        function (error) {
                            idstc().processError({ error: error, showNotifications: true });
                        }
                    );
                }

                scope.passwordKeyUp = function () {
                    scope.showPasswordRequirements = true;
                    scope.validatePassword();

                }

                scope.validatePassword = function () {
                    if (scope.passwordContainer.Password == null) scope.passwordContainer.Password = '';

                    scope.minLengthClass = (scope.passwordContainer.Password.length < scope.securitySettings.PasswordMinLength) ? 'invalid' : 'valid';
                    scope.minLetterClass = ((scope.passwordContainer.Password.match(/[a-zA-Z]/g) || []).length < scope.securitySettings.PasswordMinLetters) ? 'invalid' : 'valid';
                    scope.minUpperClass = ((scope.passwordContainer.Password.match(/[A-Z]/g) || []).length < scope.securitySettings.PasswordMinUppercase) ? 'invalid' : 'valid';
                    scope.minNumberClass = ((scope.passwordContainer.Password.match(/[0-9]/g) || []).length < scope.securitySettings.PasswordMinNumbers) ? 'invalid' : 'valid';
                    scope.minSpecialCharClass = ((scope.passwordContainer.Password.match(/[@#$%^&*()_+\-!=\[\]{};':"\\|,.<>\/?]/g) || []).length < scope.securitySettings.PasswordMinSpecialChars) ? 'invalid' : 'valid';
                }

                scope.init();
            },
        };
    });
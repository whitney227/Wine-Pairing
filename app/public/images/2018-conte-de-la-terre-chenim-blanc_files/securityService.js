(function () {
    'use strict';

    angular.module('app').service('securityService', ['$rootScope', '$http', '$q', function ($rootScope, $http, $q) {

        var service = this;

        // This is called from angular controllers/directives to gather the field validations for the provided form context/key.
        // This will eventually gather from the Field and FieldValidation tables searching for the FieldValidation.Form key that matches the context provided.
        // Or it will get the data from local sessionStorage.
        // Once, gathered, it will loop through the retrieved values and set the following values to the provided scope based on the Field name:
        //     {{Field.Name}}Required
        //     {{Field.Name}}NoAccess        
        // It uses the same "NoAccess" scope variable as the security implementation.
        // This means that field validation must be applied AFTER applying field-level security.        
        service.setValidation = function (context, scope) {
            var validations;

            if (context != null && context.length > 0) {
                validations = idstc().getExpirableSessionStorageVar('idstc-vals-' + context, 60);

                if (validations == null) {
                    var promises = [service.getValidationsFromServer(context)];

                    $q.all(promises).then(function (result) {
                        validations = idstc().getExpirableSessionStorageVar('idstc-vals-' + context, 60);
                        validations = JSON.parse(validations);
                        service.setPropertyValidation(validations, scope);
                    });
                }
                else {
                    validations = JSON.parse(validations);
                    service.setPropertyValidation(validations, scope);
                }
            }
        }

        service.getValidationsFromServer = function (context) {
            var contextPromiseName = context.replace('-', '');

            if (service[contextPromiseName]) {
                return service[contextPromiseName];
            }

            service[contextPromiseName] = $http.get(apiRoot + '/api/Security/GetClientFieldValidation?validationContext=' + context).then(
                function (response) {
                    var validations = response.data;
                    idstc().setExpirableSessionStorageVar('idstc-vals-' + context, JSON.stringify(validations));                  
                },
                function () {
                    console.log('error getting validations');
                });

            return service[contextPromiseName];
        }

        service.setPropertyValidation = function (validations, scope) {
            if (validations != null) {
                for (var i = 0; i < validations.length; i++) {
                    var fieldValidation = validations[i];

                    if (fieldValidation != null && fieldValidation.FieldDisplayed == false) {
                        scope[fieldValidation.FieldName + 'NoAccess'] = true;
                    }
                    else if (fieldValidation != null && fieldValidation.FieldRequired == true) {
                        scope[fieldValidation.FieldName + 'Required'] = true;
                    }
                }
            }
        }

        // This is called from angular controllers/directives to gather the field-level security for the provided form context/key.
        // This will eventually gather from the Fields and RoleFieldGroups searching for the FieldValidation.Form key that matches the context provided.
        // Or it will get the data from local sessionStorage.
        // Once, gathered, it will loop through the retrieved values and set the following values to the provided scope based on the Field name:
        //     {{Field.Name}}Required
        //     {{Field.Name}}Readonly                
        // It uses the same "NoAccess" scope variable as the security implementation.
        // This means that field validation must be applied AFTER applying field-level security.
        service.setSecurity = function (context, scope) {
            var securityRights;

            if (context != null && context.length > 0) {
                securityRights = idstc().getExpirableSessionStorageVar('idstc-sec-' + context, 60);

                if (securityRights == null) {
                    return $http.get(apiRoot + '/api/Security/GetClientFieldSecurity?clientContext=' + context).then(
                        function (response) {
                            securityRights = response.data;
                            idstc().setExpirableSessionStorageVar('idstc-sec-' + context, JSON.stringify(securityRights));   

                            service.setPropertyAccess(securityRights, scope);
                        },
                        function () {
                            console.log('error getting security rights');
                        });
                }
                else {
                    securityRights = JSON.parse(securityRights);
                    service.setPropertyAccess(securityRights, scope);
                }
            }
        }

        service.setPropertyAccess = function (securityRights, scope) {
            if (securityRights != null) {
                for (var i = 0; i < securityRights.length; i++) {
                    var fieldRight = securityRights[i];
                    if (fieldRight != null && fieldRight.AccessType == 1) {
                        scope[fieldRight.Name + 'NoAccess'] = true;
                    }
                    else if (fieldRight != null && fieldRight.AccessType == 2) {
                        scope[fieldRight.Name + 'Readonly'] = true;
                    }
                }
            }
        }
    }]);
})();

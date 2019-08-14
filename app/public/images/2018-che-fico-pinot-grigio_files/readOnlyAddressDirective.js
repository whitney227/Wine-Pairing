angular.module('app')
    .directive('readOnlyAddress', function (securityService) {
        return {
            restrict: 'E',
            scope: {
                address: '=address',
                displayName: '@displayName',
                email: '@email',
                securityContext: '@securityContext'
            },
            template:
                '<div class="center-mobile" >' +
                '<div ng-if="displayName">' +
                '<strong>{{ displayName }}</strong><span ng-show="address.Company.length > 0"><br />{{ address.Company }}</span>' +
                '</div>' +
                '<div ng-if="address.hasOwnProperty(\'DisplayDeliveryOffice\') ? address.DisplayDeliveryOffice : true">{{ address.DeliveryOffice }}</div>' +
                '<div>{{ address.Street1 }}</div>' +
                '<div>{{ address.Street2 }}</div>' +
                '<div ng-if="address.hasOwnProperty(\'DisplayStreet3\') ? address.DisplayStreet3 : true">{{ address.Street3 }}</div>' +
                '<div ng-if="address.hasOwnProperty(\'DisplayStreet4\') ? address.DisplayStreet4 : true">{{ address.Street4 }}</div>' +
                '<div>' +
                '{{ address.City }}<span ng-if="address.City">,</span> <span>{{ getProvinceForDisplay() }}</span> <span ng-if="address.hasOwnProperty(\'DisplayPostalCode\') ? address.DisplayPostalCode : true">{{ address.PostalCode | postalcode }}</span>' +
                '</div>' +
                '<div>{{ getCountryForDisplay() }}</div>' +
                '<div class="phone" ng-if="address.PhoneNumber">' +
                '{{ address.PhoneNumber | phone }}' +
                '</div>' +
                '<div ng-if="email"><a href="mailto:{{ email }}">{{ email }}</a></div>' +
                '</div>',
            link: function (scope, element, attrs) {
                securityService.setSecurity(scope.securityContext, scope);

                scope.getProvinceForDisplay = function () {

                    if (!scope.address) {
                        return '';
                    }

                    if (scope.address.Region) {
                        if (scope.address.hasOwnProperty('DisplayRegion')) {
                            if (scope.address.DisplayRegion) {
                                return scope.address.Region;
                            }
                        }
                    }

                    if (scope.address.ProvinceName) {
                        return scope.address.ProvinceName;
                    }

                    if (scope.address.Province) {
                        return scope.address.Province.Name;
                    }

                    if (scope.address.ProvinceAbbreviation) {
                        return scope.address.ProvinceAbbreviation;
                    }

                    return '';
                };

                scope.getCountryForDisplay = function () {

                    if (!scope.address) {
                        return '';
                    }

                    if (scope.address.CountryName) {
                        return scope.address.CountryName;
                    }

                    if (scope.address.Province) {
                        return scope.address.Province.CountryName;
                    }

                    if (scope.address.CountryTwoLetterISO) {
                        return scope.address.CountryTwoLetterISO;
                    }

                    return '';
                };
            }
        };
    });
(function () {
    'use strict';

    angular
        .module('app')
        .service('addressValidationService', addressValidationService);

    addressValidationService.$inject = ['$http'];

    function addressValidationService($http) {

        var service = this;

        service.validateAddress = function (addressToValidate) {
            $(document).progressStart();
            return $http.post(apiRoot + 'api/AddressValidation/ValidateAddress', addressToValidate).then(
                function (response) {
                    $(document).progressFinish();

                    var validationResult = response.data;
                    addressToValidate.IsValid = validationResult.IsValidated;
                    return validationResult;
                },
                function (error) {
                    $(document).progressFinish();
                    idstc().processError({ error: error, showNotifications: true });
                    throw error;
                }
            );
        };

        /**
            Updates an address with the new address' information.
        */
        service.updateAddress = function (addressToUpdate, newAddress) {
            addressToUpdate.City = newAddress.City;
            addressToUpdate.CountryID = newAddress.CountryID;
            addressToUpdate.CountryName = newAddress.CountryName;
            addressToUpdate.CountryTwoLetterISO = newAddress.CountryTwoLetterISO;
            addressToUpdate.ProvinceID = newAddress.ProvinceID;
            addressToUpdate.PostalCode = newAddress.PostalCode;
            addressToUpdate.ProvinceAbbreviation = newAddress.ProvinceAbbreviation;
            addressToUpdate.ProvinceName = newAddress.ProvinceName;
            addressToUpdate.Street1 = newAddress.Street1;
            addressToUpdate.Street2 = newAddress.Street2;
            addressToUpdate.Street3 = newAddress.Street3;
            addressToUpdate.Street4 = newAddress.Street4;
            addressToUpdate.Region = newAddress.Region;
            addressToUpdate.IsValid = newAddress.IsValid;
            addressToUpdate.AddressID = newAddress.AddressID;
        };
    }
})();

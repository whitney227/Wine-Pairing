angular.module('app').service('shoppingCartModel', ['$q', '$http', '$sce', '$rootScope', '$location', '$filter', '$timeout', 'appService', function ($q, $http, $sce, $rootScope, $location, $filter, $timeout, appService) {

    var service = this;

    service.cart = {};
    service.viewCartInfo = {};
    service.product = {};
    service.dataReady = false;
    service.cartItemsUpdating = false;
    service.productsRetrieved = false;
    service.paymentMethods = [];
    service.cryptoCurrencyTypes = [];
    service.cartItemCount = 0;
    service.userAccounts = null;    
    service.cartProvinces = [];

    service.cartConfiguration = {
        shoppingCartId: 1,
        websiteId: idstc_setting_websiteid,
        countryId: 1,  //These cannot be trusted!! we may not need them on the client but they may be useful for formatting/translations/etc
        currencyId: 1  //but do not use to pull things like pricing or available product!
    };

    //Current User is the physical person using the cart.
    //This may be different than the Order user below (think a rep placing a cust order in the party system. or a CSR at corporate).
    service.cartCurrentUser = {
        applicationUserId: null //could make one for each person coming in OR use a generic Guest user to start with if not known
        , personId: null  //will be set after login if possible BUT may never exist (CSR at corp)
        , isOrderUser: function () { return isCurrentUserEqualToOrder(); }
    };

    service.cartOrderUser = {
        applicationUserId: null
        , personId: null  //will be set after login
        , orderOwnerDisplayId: null
        , isCurrentUser: function () { return service.isCurrentUserEqualToOrder(); }
    };

    service.order = {
        orderId: null
        , countryId: 1 //1  //These cannot be trusted!! we may not need them on the client but they may be useful for formatting/translations/etc
        , currencyId: 1 //but do not use to pull things like pricing or available product!
        , orderLines: []
    }
    //Cart - Shared Data and State
    service.verifyAndSetCartPromise = null;
    service.getCartPromise = null;
    service.getViewCartInfoPromise = null;
    service.getProductsPromise = null;
    service.getCategoriesPromise = null;
    service.products = [];
    service.categories = [];
    service.flatCategoriesList = [];
    service.billingMethods = [];
    service.shippingAddresses = [];
    service.selectedCategoryId = null;
    service.selectedCategory = null; //Selected category may become null IF user decides to execute a search.
    service.breadcrumbs = [];
    service.creditCard = null;
    //this is for if the user is previously logged in and added a subscription
    service.bypassLoginForSub = false;
    //used when clicking the 'add subscription' button on the product detail page as a website user.
    //gets referrenced later to handle page logic.
    service.subSkuForWeb = '';
    service.translatedPageNames = JSON.parse(translatedPageNames);
    service.searchText = '';
    service.searchingProduct = false;
    service.rewardsShopping = false;
    service.forceProductRefresh = false;

    var rewardSelection = sessionStorage.getItem('rewardSelection');
    if (rewardSelection != null) {
        service.rewardsShopping = true;
        service.forceProductRefresh = true;
    }

    service.setFlatCategoriesList = function () {
        service.list = [];

        service.getFlattenedCategories(service.categories);
        angular.copy(service.list, service.flatCategoriesList);
    }

    service.renderHtml = function (html_code) {
        return $sce.trustAsHtml(html_code);
    };

    service.getFlattenedCategories = function (items) {
        items.forEach(function (item) {
            service.list.push(item);

            if (item.Children) {
                service.getFlattenedCategories(item.Children);
            }
        });
    }

    service.setBreadcrumbs = function () {
        service.breadcrumbs = [];

        if (service.selectedCategory != null && service.flatCategoriesList != null && service.flatCategoriesList.length > 0) {
            service.recurseCategories(service.selectedCategory);
        }
    }

    // We are walking up the category tree from the selected category to build the breadcrumbs
    service.recurseCategories = function (cat) {
        service.breadcrumbs.unshift({
            id: cat.DisplayCategoryID,
            link: service.translatedPageNames.products,
            name: cat.Name,
            urlExtension: cat.URLExtension
        });

        if (cat.ParentDisplayCategoryID != null) {
            for (var i = 0; i < service.flatCategoriesList.length; i++) {
                if (service.flatCategoriesList[i].DisplayCategoryID == cat.ParentDisplayCategoryID) {
                    service.recurseCategories(service.flatCategoriesList[i]);
                }
            }
        }
    }

    service.refreshCart = function () {
        service.cart = {};
        return service.getCart();
    }

    service.getCart = function () {
        if (service.getCartPromise) {
            return service.getCartPromise;
        }

        var cartId = idstc().getExpirableLocalStorageVar('CartID', 1440);
        service.getCartPromise = $http({
            method: 'GET',
            url: apiRoot + 'api/shopping/getCartInfo?cartId=' + cartId,
            headers: {
                'Authorization': undefined
            }
        }).then(
            function (successResult) {
                service.cart = angular.copy(successResult.data);

                return service.cart;
            },
            function (errorResult) {
                if (errorResult.data.ExceptionType == 'IDSTC.Core.Common.CustomExceptions.IdstcValidateCartOrderException') {
                    service.verifyAndSetCartPromise = null;
                    return service.verifyAndSetCart(true);
                }
                else {
                    return errorResult;
                }
            });

        return service.getCartPromise;
    }

    service.exitRewardShopping = function () {
        sessionStorage.removeItem('rewardSelection');
        sessionStorage.removeItem('displayCategories')
        service.rewardsShopping = false;
        service.forceProductRefresh = true;
    };

    service.getViewCartInfo = function () {
        // always want to use the customer cart id.. this is called when showing the view cart widget
        // and the view cart page.  The customer cart id is populated when you start a new customer
        // shopping cart.

        var cartID = idstc().getExpirableLocalStorageVar('CustomerCartID', 1440);
        idstc().setExpirableLocalStorageVar('CartID', cartID);

        if (service.getViewCartInfoPromise) {
            return service.getViewCartInfoPromise;
        }

        var url = apiRoot + 'api/shopping/GetViewCartInfo?cartId=' + cartID;

        if (service.getLanguageCode() != null && service.getLanguageCode() != '') {
            url += '&languageCode=' + service.getLanguageCode();
        }

        service.getViewCartInfoPromise = $http({
            method: 'GET',
            url: url
        }).then(
            function (successResult) {
                service.viewCartInfo = angular.copy(successResult.data);
                service.updateViewCartDisplay();

                // Clear the promise so subsequent calls will actually be made
                service.getViewCartInfoPromise = null;

                return service.viewCartInfo;
            },
            function (errorResult) {
                return errorResult;
            });

        return service.getViewCartInfoPromise;
    }

    service.updateViewCartDisplay = function () {
        if (service.viewCartInfo != null) {
            service.viewCartInfoRetrieved = true;
            service.cartItemCount = 0;
            service.subtotal = 0;

            if (service.viewCartInfo.OrderLines != null && service.viewCartInfo.OrderLines.length > 0) {
                for (var i = 0; i < service.viewCartInfo.OrderLines.length; i++) {
                    var line = service.viewCartInfo.OrderLines[i];

                    service.cartItemCount += line.Quantity;

                    service.subtotal += line.DisplayPrice * line.Quantity;
                    service.subtotalConverted = idstc().formatNumberToCurrency(service.subtotal, service.viewCartInfo.CurrencyTypeID);

                    service.formatPersonalizations(line);
                }
            }

            localStorage.setItem('CartItemQuantity', service.cartItemCount);
        }
    }

    service.formatPersonalizations = function (line) {
        if (line.Personalizations != null && line.Personalizations.length > 0) {
            for (var x = 0; x < line.Personalizations.length; x++) {
                var cfv = line.Personalizations[x];

                if (cfv.DateTimeAccuracy == 1) {
                    cfv.PersonalizationValue = $filter('dateFormat')(cfv.DateTimeValue, 'g', null, true);
                }
                else if (cfv.DateTimeAccuracy == 2) {
                    cfv.PersonalizationValue = $filter('dateFormat')(cfv.DateTimeValue, 'd', null, false);
                }
                else if (cfv.DateTimeAccuracy == 3) {
                    cfv.PersonalizationValue = $filter('dateFormat')(cfv.DateTimeValue, 'MM yyyy', null, false);
                }
                else if (cfv.DateTimeAccuracy == 4) {
                    cfv.PersonalizationValue = $filter('dateFormat')(cfv.DateTimeValue, 'yyyy', null, false);
                }
            }
        }
    }

    service.convertJsonToUrlEncoded = function (obj) {
        var str = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                str.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
            }
        }
        return str.join('&');
    }

    service.getProducts = function (searchObject) {
        // Do not allow searching without a display category or a search value.
        if ((searchObject.SearchValue == null || searchObject.SearchValue == '') &&
            searchObject.DisplayCategoryID == null) {
            service.products = [];
            return [];
        }

        var reward = JSON.parse(sessionStorage.getItem('rewardSelection'));
        if (reward != null) {
            searchObject.RewardsCart = true;
            if (reward.RewardSKU != null && reward.RewardSKU != '') {
                searchObject.SKUs = [];
                searchObject.SKUs.push(reward.RewardSKU);
            }
            if (reward.RewardProductClassificationID != null && reward.RewardProductClassificationID > 0) {
                searchObject.ProductClassificationIDs = [];
                searchObject.ProductClassificationIDs.push(reward.RewardProductClassificationID);
            }
        }

        if (service.getProductsPromise) {
            return service.getProductsPromise;
        }

        if (service.getLanguageCode() != null && service.getLanguageCode() != '') {
            searchObject.languageCode = service.getLanguageCode();
        }

        var urlEncodedSearchObject = service.convertJsonToUrlEncoded(searchObject);

        service.getProductsPromise = $http({
            method: 'POST',
            url: apiRoot + 'api/shopping/GetProductsForCart',
            data: urlEncodedSearchObject,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': undefined
            }
        }).then(
            function (successResult) {
                service.products = angular.copy(successResult.data);
                service.getProductsPromise = null;
                service.productsRetrieved = true;
                return service.products;
            },
            function (errorResult) {
                service.getProductsPromise = null;
                return errorResult;
            });

        return service.getProductsPromise;
    }

    service.getProductDetail = function (sku, orderLineId) {
        var reward = JSON.parse(sessionStorage.getItem('rewardSelection'));
        var rewardsCart = false;
        if (reward != null) {
            rewardsCart = true;
        }

        var url = apiRoot + 'api/shopping/GetProductDetail?cartId=' + service.cart.CartID + '&sku=' + sku + '&rewardsCart=' + rewardsCart;
        if (service.getLanguageCode() != null && service.getLanguageCode() != '') {
            url += '&languageCode=' + service.getLanguageCode();
        }

        if (orderLineId != null) {
            url += '&orderLineId=' + orderLineId;
        }

        return $http({
            method: 'GET',
            url: url,
            headers: {
                'Authorization': undefined
            }
        }).then(
            function (successResult) {
                service.product = angular.copy(successResult.data);

                return service.product;
            },
            function (errorResult) {
                return errorResult;
            });
    }

    service.getCategories = function () {
        if (sessionStorage.getItem('displayCategories') != null) {
            service.categories = JSON.parse(sessionStorage.getItem('displayCategories'));

            service.setFlatCategoriesList();
            $rootScope.$broadcast('displayCategoriesUpdated');

            return service.categories;
        }
        else if (service.getCategoriesPromise) {
            return service.getCategoriesPromise;
        }

        var postVar = {};

        postVar.CartID = service.cart.CartID;
        postVar.LanguageCode = service.getLanguageCode();

        var reward = JSON.parse(sessionStorage.getItem('rewardSelection'));
        if (reward != null) {
            postVar.RewardsCart = true;
            if (reward.RewardSKU != null && reward.RewardSKU != '') {
                postVar.SKUs = [];
                postVar.SKUs.push(reward.RewardSKU);
            }
            if (reward.RewardProductClassificationID != null && reward.RewardProductClassificationID > 0) {
                postVar.ProductClassificationIDs = [];
                postVar.ProductClassificationIDs.push(reward.RewardProductClassificationID);
            }
        }

        var url = apiRoot + 'api/shopping/GetCartDisplayCategories';

        service.getCategoriesPromise = $http({
            method: 'POST',
            url: url,
            data: postVar,
            headers: {
                'Authorization': undefined
            }
        }).then(
            function (successResult) {
                service.categories = angular.copy(successResult.data);
                sessionStorage.setItem('displayCategories', JSON.stringify(service.categories));

                service.setFlatCategoriesList();

                $rootScope.$broadcast('displayCategoriesUpdated');

                return service.categories;
            },
            function (errorResult) {
                return errorResult;
            });

        return service.getCategoriesPromise;
    }

    service.setSelectedCategory = function (categoryId, getProducts) {
        var searchObject = {
            CartID: service.cart.CartID,
            DisplayCategoryID: categoryId
        };

        if (getProducts == null) {
            getProducts = true;
        }

        localStorage.setItem('displayCategoryId', categoryId);

        if (getProducts && (service.searchText == null || service.searchText == '')) {
            return service.getProducts(searchObject).then(
                function () {
                    service.setSelectedCategoryFromList(categoryId);
                });
        }
        else {
            return service.setSelectedCategoryFromList(categoryId);
        }
    }

    service.setSelectedCategoryFromList = function (categoryId) {
        for (var i = 0; i < service.flatCategoriesList.length; i++) {
            var cat = service.flatCategoriesList[i];

            if (isNaN(categoryId) == false) {
                if (cat.DisplayCategoryID == categoryId) {
                    service.selectedCategoryId = cat.DisplayCategoryID;
                    service.selectedCategory = cat;
                    service.setBreadcrumbs();
                    break;
                }
            }
            else {
                if (cat.Name == categoryId || cat.URLExtension == categoryId) {
                    service.selectedCategoryId = cat.DisplayCategoryID;
                    service.selectedCategory = cat;
                    service.setBreadcrumbs();
                    break;
                }
            }
        }
    }

    service.getBillingMethods = function () {
        return $http.get(apiRoot + 'api/Shopping/GetCartPaymentAccounts?cartId=' + service.cart.CartID).then(
            function (successResult) {
                service.billingMethods = [];
                if (successResult.data.CreditCards != null) {
                    service.billingMethods = service.billingMethods.concat(successResult.data.CreditCards);
                }
                if (successResult.data.Echecks != null) {
                    service.billingMethods = service.billingMethods.concat(successResult.data.Echecks);
                }

                if (service.billingMethods && service.billingMethods.length > 0) {
                    for (var i = 0; i < service.billingMethods.length; i++) {
                        if (service.billingMethods[i].DefaultPaymentMethod) {
                            service.billingMethods[i].selected = true;
                        }
                        service.billingMethods[i].BusinessUnitID = service.cart.BusinessUnitID;
                    }
                }

                return service.billingMethods;
            },
            function (errorResult) {
                idstc().processError({ error: errorResult, showNotifications: true });
            });
    }

    service.getShippingAddresses = function () {
        return $http.get(apiRoot + 'api/Shopping/GetCartShippingMethods?cartId=' + service.cart.CartID).then(
            function (successResult) {
                service.shippingAddresses = successResult.data;

                return service.shippingAddresses;
            },
            function (errorResult) {
                idstc().processError({ error: errorResult, showNotifications: true });
            });
    }

    service.getPaymentMethods = function () {
        var url = apiRoot + 'api/Shopping/GetCartPaymentMethods?cartId=' + service.cart.CartID;

        return $http.get(url).then(
            function (successResult) {
                service.paymentMethods = successResult.data;
                return service.paymentMethods;
            },
            function (errorResult) {
                idstc().processError({ error: errorResult, showNotifications: true });
            });
    }

    service.getCryptoCurrencyTypes = function () {
        var url = apiRoot + 'api/CurrencyTypes/GetEnabledCryptoCurrencyTypesTranslated?cryptoCurrencyTypeID=null';

        return $http.get(url).then(
            function (successResult) {
                service.cryptoCurrencyTypes = successResult.data;
                for (var i = 0; i < service.cryptoCurrencyTypes.length; i++) {
                    service.cryptoCurrencyTypes[i].Image = 'content/images/cryptoicons/' + service.cryptoCurrencyTypes[i].Abbreviation.toLowerCase() + '.png';
                }
                return service.cryptoCurrencyTypes;
            },
            function (errorResult) {
                idstc().processError({ error: errorResult, showNotifications: true });
            });
    }

    service.isCurrentUserEqualToOrder = function () {
        return (service.applicationUserId !== null && service.applicationUserId === service.cartCurrentUser.applicationUserId);
    }

    service.cartCanGetProducts = function () {
        var cartId = idstc().getExpirableLocalStorageVar('CartID', 1440);

        existingCountryCode = localStorage.getItem('countryCode');

        // country code comes from polylang and is stored in php_vars variable
        // the last 2 digits should match the country code abbreviation in idstc
        if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
            countryCode = php_vars.languageCode.substring(3, 5);
        }

        if (existingCountryCode == null) {
            existingCountryCode = countryCode;
            localStorage.setItem('countryCode', countryCode);
        }

        // Get cart information if you can
        if (cartId != null && cartId != 'null' && existingCountryCode == countryCode) {
            return true;
        }

        return false;
    }

    service.verifyAndSetCart = function (forceNewCart) {
        if (forceNewCart == null) {
            forceNewCart = false;
        }

        if (service.verifyAndSetCartPromise && !forceNewCart) {
            return service.verifyAndSetCartPromise;
        }

        service.cart.CartID = idstc().getExpirableLocalStorageVar('CartID', 1440);
        service.cartItemCount = localStorage.getItem('CartItemQuantity') || 0;

        existingCountryCode = localStorage.getItem('countryCode');

        // country code comes from polylang and is stored in php_vars variable
        // the last 2 digits should match the country code abbreviation in idstc
        if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
            countryCode = php_vars.languageCode.substring(3, 5);
        }

        if (existingCountryCode == null) {
            existingCountryCode = countryCode;
            localStorage.setItem('countryCode', countryCode);
        }        

        var existingProvinceID = sessionStorage.getItem('provinceID') || localStorage.getItem('provinceID');
        var cartRequireProvinceEnabled = (idstc_setting_cartrequireprovinceenabled == 'on' || idstc_setting_cartrequireprovinceenabled == 'true');

        // Get cart information if you can
        if (service.cart.CartID != null && service.cart.CartID != 'null' && existingCountryCode == countryCode && (existingProvinceID != null || !cartRequireProvinceEnabled)  && !forceNewCart) {
            service.verifyAndSetCartPromise = service.getCart().then(function () {
                if (existingProvinceID != null) {
                    localStorage.setItem('provinceID', existingProvinceID);
                }
                return service.cart.CartID;
            });
        }
        else {
            var currentTime = '/Date(' + Date.now().toString() + ')/';
            var foundCountry;

            // get the country id from the local storage country list
            // unless a country has already been set in the session storage (portal login may do this)
            countryCode = sessionStorage.getItem('countryCode') || countryCode;
            var countries = JSON.parse(localStorage.getItem('Countries'));
            for (i = 0; i < countries.countries.length; i++) {
                if (countries.countries[i].Abbreviation.toLowerCase() == countryCode.toLowerCase()) {
                    foundCountry = countries.countries[i];
                    break;
                }
            }            

            var shoppingCartID = service.getCurrentCustomerShoppingCart();

            var postVar = {
                OrderEffectiveDate: currentTime,
                PersonTypeID: 2,
                SubjectClassificationTypeID: 1,
                SubjectID: null,
                CountryID: sessionStorage.getItem('countryId') || idstc_setting_defaultcartcountry,
                ProvinceID: existingProvinceID || idstc_setting_defaultcartprovince,
                CurrencyTypeID: sessionStorage.getItem('currencyTypeId'),
                OrderPersonID: '',
                ShoppingCartID: shoppingCartID,
                WebsiteID: idstc_setting_websiteid,
                PersonID: 0,
                BypassCheckout: false,
                ShopFor: 'new',
                SubjectIDText: ''
            };

            // if the countryid equals the default country id then send in the default province and currency..
            // if not, let the server determine the defaults for the given country.
            if (foundCountry != null && foundCountry.CountryID != postVar.CountryID) {
                postVar.CountryID = foundCountry.CountryID;
                postVar.ProvinceID = existingProvinceID || 0;
                postVar.CurrencyTypeID = 0;
                sessionStorage.removeItem('userLanguageCode');
            }

            service.verifyAndSetCartPromise = $http.post(apiRoot + 'api/Shopping/StartNewCart', postVar).then(
                function (successResult) {
                    // Save cart id to local storage
                    idstc().setExpirableLocalStorageVar('CartID', successResult.data.CartID);
                    idstc().setExpirableLocalStorageVar('CustomerCartID', successResult.data.CartID);
                    localStorage.setItem('countryCode', countryCode);                    

                    sessionStorage.removeItem('selectedBillingMethodCVV');
                    sessionStorage.removeItem('payPalClientID');
                    sessionStorage.removeItem('rewardSelection');

                    service.cartItemCount = 0;
                    localStorage.setItem('CartItemQuantity', 0);

                    service.cart = successResult.data;
                    return successResult.data.CartID;
                },
                function (errorResult) {
                    $(document).progressFinish();
                });
        }

        return service.verifyAndSetCartPromise;
    }

    service.verifyAndSetJoinCart = function () {
        service.cart.CartID = idstc().getExpirableLocalStorageVar('JoinCartID', 1440);
        existingCountryCode = localStorage.getItem('countryCode');

        // country code comes from polylang and is stored in php_vars variable
        // the last 2 digits should match the country code abbreviation in idstc
        if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
            countryCode = php_vars.languageCode.substring(3, 5);
        }

        // Get cart information if you can
        if (service.cart.CartID != null && service.cart.CartID != 'null' && existingCountryCode == countryCode) {
            service.getCart().then(function () {
                $rootScope.$broadcast('joincart.loaded', service.cart);
                return service.cart.CartID;
            });
        }
        else {
            var currentTime = '/Date(' + Date.now().toString() + ')/';
            var foundCountry;

            // get the country id from the local storage country list
            var countries = JSON.parse(localStorage.getItem('Countries'));
            for (i = 0; i < countries.countries.length; i++) {
                if (countries.countries[i].Abbreviation.toLowerCase() == countryCode.toLowerCase()) {
                    foundCountry = countries.countries[i];
                    break;
                }
            }

            var postVar = {
                OrderEffectiveDate: currentTime,
                PersonTypeID: 1,
                SubjectClassificationTypeID: 5,
                SubjectID: null,
                CountryID: idstc_setting_defaultcartcountry,
                ProvinceID: idstc_setting_defaultcartprovince,
                CurrencyTypeID: sessionStorage.getItem('currencyTypeId'),
                OrderPersonID: '',
                ShoppingCartID: 90, // Consultant Join shopping cart
                WebsiteID: idstc_setting_websiteid,
                PersonID: 0,
                BypassCheckout: false,
                ShopFor: 'new',
                SubjectIDText: ''
            };

            // if the countryid equals the default country id then send in the default province and currency..
            // if not, let the server determine the defaults for the given country.
            if (foundCountry != null && foundCountry.CountryID != idstc_setting_defaultcartcountry) {
                postVar.CountryID = foundCountry.CountryID;
                postVar.ProvinceID = 0;
                postVar.CurrencyTypeID = 0;
            }

            return $http.post(apiRoot + 'api/Shopping/StartNewCart', postVar).then(
                function (successResult) {
                    // Save cart id to local storage
                    idstc().setExpirableLocalStorageVar('CartID', successResult.data.CartID);
                    idstc().setExpirableLocalStorageVar('JoinCartID', successResult.data.CartID);
                    localStorage.setItem('countryCode', countryCode);

                    sessionStorage.removeItem('selectedBillingMethodCVV');
                    sessionStorage.removeItem('payPalClientID');
                    sessionStorage.removeItem('rewardSelection');

                    service.cart = successResult.data;
                    $rootScope.$broadcast('joincart.loaded', service.cart);
                    return successResult.data.CartID;
                },
                function (errorResult) {
                    $(document).progressFinish();
                });
        }
    }

    service.login = function (username, password, returnUrl, personTypeId, loginGuid) {
        $(document).progressStart();
        service.dataReady = false;

        var postVar = {
            Username: username,
            Password: password,
            RememberMe: false,
            LoginGuid: loginGuid,
            PersonTypeID: personTypeId
        };

        return $http.post(apiRoot + 'api/Website/LoginVerification', postVar).then(
            function (successResult) {
                if (successResult.data != null && successResult.data.data != null && successResult.data.data.length > 1 && loginGuid == null) {
                    //more than one matching user account
                    service.userAccounts = successResult.data.data;
                    service.dataReady = true;
                }
                else {
                    if (successResult.data.statusCode == 0) {
                        var ajaxPostVar = {
                            action: 'get_token',
                            username: username,
                            password: password
                        };

                        var url = '/wp-admin/admin-ajax.php';

                        $.ajax({
                            type: 'POST',
                            url: url,
                            data: ajaxPostVar,
                            success: function (successResult) {
                                if (successResult == null) {

                                }
                                else {
                                    //set cart and redirect to existing checkout
                                    var token = successResult.replace(/"/g, '');

                                    idstc().setExpirableLocalStorageVar('Authorization', token);
                                    $http.defaults.headers.common['Authorization'] = 'bearer ' + token;

                                    var cartId = idstc().getExpirableLocalStorageVar('CartID', 1440);

                                    idstc().setExpirableLocalStorageVar('loggedIn', true);

                                    $timeout(service.setOrderPerson(cartId, true, returnUrl), 200);
                                }
                            }
                        });
                    }
                    else {
                        idstc().processError({ error: successResult, showNotifications: true });
                        $(document).progressFinish();
                        service.dataReady = true;
                        return false;
                    }
                }
            },
            function (errorResult) {
                idstc().processError({ error: errorResult, showNotifications: true });
                $(document).progressFinish();
                service.dataReady = true;
                return false;
            });
    }

    service.setOrderPerson = function (cartID, status, returnUrl) {
        var promises = [];

        // If not yet on a replicated site, try to get the replicated site owner for this customer
        repUrl = localStorage.getItem('replicatedSiteUrl');

        if (repUrl == null || repUrl == '') {
            promises.push(appService.getReplicatedSiteOwner());
        }

        $q.all(promises).then(function (result) {
            if (cartID != null) {
                var setOrderPersonUrl = apiRoot + 'api/Shopping/SetOrderPerson?cartId=' + cartID;

                $http.post(setOrderPersonUrl).then(
                    function (results) {
                        service.cart.CartID = cartID;
                        service.getCart().then(function () {
                            if (status) {
                                path = returnUrl || service.translatedPageNames.existingCheckout;
                            } else {
                                if (appService.consultant == null) {
                                    path = returnUrl || service.translatedPageNames.consultantSearch + '?checkout=true';
                                }
                                else {
                                    path = returnUrl || service.translatedPageNames.createPerson;
                                }
                            }
                            if (typeof subSKU == 'undefined' || subSKU == '') {
                                if (path.indexOf('http') >= 0) {
                                    window.location = path;
                                }
                                else {
                                    window.location = '/' + path;
                                }
                            } else {
                                service.redirectToSub();
                            }
                        });
                    });
            }
            else {
                window.location = returnUrl || '/';
            }
        });
    }

    service.redirectToSub = function () {
        var form = $('form[name="loginForm"]');
        var returnPath = '';
        service.bypassLoginForSub = true;

        if (service.cart.SubjectTypeID == 1) {
            returnPath = '/SubscriptionEdit/0?sku=' + subSKU;
        } else {
            returnPath = '/SubscriptionEdit/0?sku=' + subSKU;
        }

        window.location = returnPath;
    }

    service.getParameterByName = function (name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    service.getCurrentCustomerShoppingCart = function () {
        // default for corporate website
        var shoppingCartID = 1;

        // check to see if there is replicated site owner.. if so, check to see if the
        // owner has a parent for genealogy type id 1 (default genealogy type).  If there
        // is no replicated site owner and/or no parent for genealogy type 1 then the user
        // is on the corporate website.
        if (appService.consultant != null && appService.consultant.GenealogyParents != null) {
            var result = appService.consultant.GenealogyParents.filter(function (obj) {
                return obj.Key == 1;
            });
            if (result != null) {
                // user is on a replicated website
                shoppingCartID = 2;
            }

        }

        return shoppingCartID;
    };

    service.getLanguageCode = function () {
        return sessionStorage.getItem('userLanguageCode') || languageCode;
    };

    service.getProvincesForCartCountryCode = function () {
        existingCountryCode = localStorage.getItem('countryCode');

        // country code comes from polylang and is stored in php_vars variable
        // the last 2 digits should match the country code abbreviation in idstc
        if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
            countryCode = php_vars.languageCode.substring(3, 5);
        }

        if (existingCountryCode == null) {
            existingCountryCode = countryCode;
            localStorage.setItem('countryCode', countryCode);
        }

        var url = apiRoot + 'api/CountryProvinces/GetProvincesForDropdown?countryAbbrev=' + existingCountryCode;

        return $http.get(url).then(
            function (resp) {
                service.cartProvinces = resp.data;
            },
            function (error) {
                idstc().processError({ error: error, showNotifications: true });
            }
        );
    };

    service.getCartCountryName = function () {
        existingCountryCode = localStorage.getItem('countryCode');

        // country code comes from polylang and is stored in php_vars variable
        // the last 2 digits should match the country code abbreviation in idstc
        if (php_vars && php_vars.languageCode && php_vars.languageCode.length > 0) {
            countryCode = php_vars.languageCode.substring(3, 5);
        }

        if (existingCountryCode == null) {
            existingCountryCode = countryCode;
            localStorage.setItem('countryCode', countryCode);
        }

        var countries = JSON.parse(localStorage.getItem('Countries'));
        var foundCountry = _.find(countries.countries, function (country) {return country.Abbreviation.toLowerCase() === existingCountryCode.toLowerCase();});
        if (foundCountry != null) {
            return foundCountry.Name;
        }   

        return '';
    };
}]);

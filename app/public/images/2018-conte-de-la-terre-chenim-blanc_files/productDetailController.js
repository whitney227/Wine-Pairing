(function () {

    var injectParams = ['$scope', '$location', '$q', '$http', '$timeout', '$filter', 'appService', 'translationService', 'shoppingCartModel'];

    productDetailController.$inject = injectParams;

    angular.module('app').controller('productDetailController', productDetailController);

    function productDetailController($scope, $location, $q, $http, $timeout, $filter, appService, translationService, shoppingCartModel) {
        var vm = this;        

        vm.productValidForCart = true;
        vm.shoppingCartModel = shoppingCartModel;
        vm.numericInputOptions = { min: 1, format: '#', decimals: 0 };
        vm.sku = productSKUQ;
        vm.doneLoadingComponents = false;
        vm.getCustomFieldDataUrl = apiRoot + 'api/Shopping/GetOrderLineCustomFieldValues?displayId=';
        vm.customFieldAccessor = {};
        vm.cartProvinceID = null;
        vm.cartProvinceName = null;
        vm.forceNewCart = null;
        vm.cartRequireProvinceEnabled = (idstc_setting_cartrequireprovinceenabled == 'on' || idstc_setting_cartrequireprovinceenabled == 'true');

        //WebsiteChange
        vm.siteName = websiteGlobal.appName;
        vm.imgURL = templateUrl;
        vm.joining = false;

        //Need to scroll to top of window when user is navigating from multi-product display page
        document.body.scrollTop = document.documentElement.scrollTop = 0;

        vm.init = function () {
            $(document).progressStart();

            var joinCartID = idstc().getExpirableLocalStorageVar('JoinCartID', 1440);
            var currentCartID = idstc().getExpirableLocalStorageVar('CartID', 1440);

            if (appService.loggedIn && joinCartID == currentCartID) {
                appService.logout(false);
            }

            var promises = [appService.makeReady()];

            $q.all(promises).then(function (result) {
                promises = [translationService.getTranslations('shopping-cart')];

                var existingProvinceID = localStorage.getItem('provinceID');
                if ((existingProvinceID === undefined || existingProvinceID == null || existingProvinceID == '0') && vm.cartRequireProvinceEnabled) {
                    promises.push(shoppingCartModel.getProvincesForCartCountryCode());

                    $q.all(promises).then(function (result) {
                        vm.cartProvinces = shoppingCartModel.cartProvinces;
                        $(document).progressFinish();
                    });
                }
                else {
                    if (vm.cartRequireProvinceEnabled) {
                        vm.cartProvinceID = existingProvinceID;
                        vm.cartProvinceName = localStorage.getItem('provinceName');
                        vm.cartCountryName = vm.shoppingCartModel.getCartCountryName();
                    }

                    vm.lineId = vm.getUrlParameter('lineId');

                    var joinOption = JSON.parse(sessionStorage.getItem('JoinOption'));

                    if (joinOption != null) {
                        vm.joining = true;
                    }
                    else {
                        var customerCartID = idstc().getExpirableLocalStorageVar('CustomerCartID', 1440);
                        if (customerCartID != null) {
                            idstc().setExpirableLocalStorageVar('CartID', customerCartID);
                        }
                    }

                    var canGetProducts = vm.shoppingCartModel.cartCanGetProducts();

                    if (!canGetProducts) {
                        vm.forceNewCart = sessionStorage.getItem('forceNewCart');
                        if (vm.forceNewCart == 'true') {
                            vm.forceNewCart = true;
                        }
                        else {
                            vm.forceNewCart = false;
                        }

                        promises.push(vm.shoppingCartModel.verifyAndSetCart(vm.forceNewCart));
                    }

                    $q.all(promises).then(function (result) {
                        vm.forceNewCart = false;
                        sessionStorage.removeItem('forceNewCart');

                        promises = [vm.shoppingCartModel.getCategories(), vm.getProductDetail()];

                        $q.all(promises).then(function (result) {
                            promises = [];

                            $q.all(promises).then(function (result) {
                                var displayCategory = vm.getUrlParameter('displayCategory');
                                if (displayCategory != null && displayCategory != '') {
                                    vm.shoppingCartModel.setSelectedCategory(displayCategory, false);
                                }
                                else {
                                    if (localStorage.getItem('displayCategoryId') != null) {
                                        vm.shoppingCartModel.setSelectedCategory(localStorage.getItem('displayCategoryId'), false);
                                    }
                                }

                                var shareUrl = location.protocol + '//' + location.hostname + '/';
                                if (php_vars && php_vars.languageCode) {
                                    shareUrl += php_vars.languageCode + '/';
                                }

                                shareUrl += 'productshare/' + vm.cartUrl + '/og';

                                if (appService.consultant != null && appService.consultant.Url != null) {
                                    shareUrl += '/?u=' + appService.consultant.Url;
                                }

                                // Uncomment for testing purposes
                                //shareUrl = 'https://www.acutabeta.com/productshare/ATF100?u=Corp';

                                vm.shareUrlEncoded = encodeURIComponent(shareUrl);

                                vm.shareUrl = shareUrl;

                                if (typeof twttr != "undefined") {
                                    twttr.widgets.createShareButton(
                                        '/',
                                        document.getElementById('socialMediaLinksIdstc'),
                                        {
                                            text: vm.shareUrl
                                        }
                                    );
                                }

                                vm.dataReady = true;
                                $(document).progressFinish();

                                $timeout(function () {
                                    vm.doneLoadingComponents = true;
                                }, 100);

                            });
                        });
                    });
                }
            });
        }

        vm.facebookClicked = function () {
            var fbpopup = window.open('https://www.facebook.com/sharer/sharer.php?u=' + vm.shareUrl, 'pop', 'width=600, height=400, scrollbars=no');
        }

        vm.pinterestClicked = function () {
            PinUtils.pinOne({
                media: vm.product.ProductImage,
                url: vm.shareUrl,
                description: vm.product.ProductDisplayName
            });
        }

        vm.twitterClicked = function () {
            var twitterpopup = window.open('https://twitter.com/intent/tweet?text=' + vm.product.ProductDisplayName + '&url=' + vm.shareUrlEncoded, 'pop', 'width=600, height=400, scrollbars=no');
        }

        vm.getUrlParameter = function (name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            var results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };

        vm.getProductDetail = function () {
            if (vm.sku != null) {
                return shoppingCartModel.getProductDetail(vm.sku, vm.lineId)
                    .then(function (successResult) {
                        vm.originalProduct = angular.copy(shoppingCartModel.product); 
                        vm.product = shoppingCartModel.product;                        
                        vm.quantity = 1;
                        vm.cartUrl = angular.copy(vm.sku);
                        vm.sku = shoppingCartModel.product.ProductSKU;  // CMH - This might be the cartUrl and not the sku, so let's make sure it is the SKU proper.

                        if (vm.product != null) {
                            vm.priceWithoutComponents = angular.copy(vm.product.Price);

                            if (vm.product.ProductImage == null || vm.product.ProductImage == '') {
                                vm.product.ProductImage = templateUrl + 'content/images/NoImageAvailable.png';
                            }

                            if (vm.product.AssociatedProducts != null && vm.product.AssociatedProducts.length > 0) {
                                for (var i = 0; i < vm.product.AssociatedProducts.length; i++) {
                                    if (vm.product.AssociatedProducts[i].ProductImage == null) {
                                        vm.product.AssociatedProducts[i].ProductImage = templateUrl + 'content/images/NoImageAvailable.png';
                                    }
                                }
                            }

                            // Determine if any variation options are selectable
                            var hasSelectable = false;
                            if (vm.product.VariationTypes != null && vm.product.VariationTypes.length > 0) {
                                for (var i = 0; i < vm.product.VariationTypes.length; i++) {
                                    var vt = vm.product.VariationTypes[i];
                                    for (var x = 0; x < vt.VariationTypeOptions.length; x++) {
                                        if (vt.VariationTypeOptions[x].Selectable) {
                                            hasSelectable = true;
                                        }
                                    }
                                    shoppingCartModel.product.VariationTypes[i].ddOptions = {
                                        dataSource: vt.VariationTypeOptions,
                                        dataTextField: "Name",
                                        dataValueField: "VariationTypeOptionID",
                                        template: "<span class='#=data.Selectable ? 'is-selectable' : 'not-selectable'#'>#:data.Name#</span>"
                                    }; 
                                }                                
                            }
                            
                            if (vm.product.BuildableComponents != null && vm.product.BuildableComponents.length > 0) {
                                for (var i = 0; i < vm.product.BuildableComponents.length; i++) {
                                    var component = vm.product.BuildableComponents[i];

                                    component.QuantitySelected = 1;

                                    for (var x = 0; x < component.Products.length; x++) {
                                        var product = component.Products[x];

                                        product.DropdownText = product.ProductDisplayName;

                                        if (product.PriceAdjustment != 0 && !component.HidePriceAdjustments) {
                                            if (product.PriceAdjustment > 0) {
                                                product.DropdownText += ' +' + $filter('orderCurrencyFormat')(product.PriceAdjustment, vm.shoppingCartModel.cart.CurrencyTypeID, true);
                                            }
                                            else {
                                                product.DropdownText += ' -' + $filter('orderCurrencyFormat')(product.PriceAdjustment, vm.shoppingCartModel.cart.CurrencyTypeID, true);
                                            }
                                        }

                                        if (product.Selected) {
                                            component.selectedProductId = product.ProductID;
                                            component.QuantitySelected = product.QuantitySelected;
                                        }
                                    }
                                }

                                vm.updatePrice();
                            }
                        }
                        else {
                            vm.productDetailNotFound = true;
                        }
                    });
            }
            else {
                idstc().notify({ message: translationService.translations['shopping-cart']['ProductNotFound'] || 'Product not found.', success: 'error' });
                vm.productDetailNotFound = true;
            }
        }

        vm.searchForProduct = function () {
            if (vm.searchText && vm.searchText.displayName && vm.searchText.displayName != '') {
                window.location = '/' + vm.shoppingCartModel.translatedPageNames.products + '/?search=' + vm.searchText.displayName;
            }
        }

        vm.updateSelectedVariation = function (variationType, index, previousOptionId) {
            var foundOption = _.find(variationType.VariationTypeOptions, function (option) { return option.VariationTypeOptionID === variationType.SelectedVariationTypeOptionID; });

            if (foundOption.Selectable == false) {
                // invalid selection.. set the selection back to the previous variation type option
                variationType.SelectedVariationTypeOptionID = previousOptionId;
                for (var i = 0; i < vm.product.VariationTypes.length; i++) {
                    for (var x = 0; x < vm.product.VariationTypes[i].VariationTypeOptions.length; x++) {
                        if (vm.product.VariationTypes[i].VariationTypeOptions[x].VariationTypeOptionID == previousOptionId) {
                            variationType.SelectedVariationTypeOption = vm.product.VariationTypes[i].VariationTypeOptions[x];
                            if (variationType.SelectedVariationTypeOption.Selectable == true) {
                                variationType.displayClass = "is-selectable";
                            }
                            else {
                                variationType.displayClass = "not-selectable";
                            }
                            break;
                        }
                    }
                }
                return;
            }

            vm.productVariationChanging = true;

            var postVar = {
                CartID: shoppingCartModel.cart.CartID,
                VariationTypes: vm.product.VariationTypes,
                LastSelectedOption: {},
                LastSKU: vm.sku
            };

            // set the last selected option to pass to the server
            for (var i = 0; i < vm.originalProduct.VariationTypes.length; i++) {
                for (var x = 0; x < vm.originalProduct.VariationTypes[i].VariationTypeOptions.length; x++) {
                    if (vm.originalProduct.VariationTypes[i].VariationTypeOptions[x].VariationTypeOptionID == previousOptionId) {
                        postVar.LastSelectedOption = vm.originalProduct.VariationTypes[i];
                        postVar.LastSelectedOption.SelectedVariationTypeOptionID = vm.originalProduct.VariationTypes[i].VariationTypeOptions[x].VariationTypeOptionID;
                        break;
                    }
                }
            }

            var reward = JSON.parse(sessionStorage.getItem('rewardSelection'));
            if (reward != null) {
                postVar.RewardsCart = true;
            }

            $http.post(apiRoot + 'api/Shopping/GetProductByVariation', postVar).then(
                function (successResult) {
                    vm.productVariationChanging = false;

                    if (successResult.data && successResult.data != null) {
                        vm.product = successResult.data;
                        vm.sku = vm.product.ProductSKU;
                        vm.productValidForCart = true;
                        vm.priceWithoutComponents = angular.copy(vm.product.Price);
                        if (vm.product.VariationTypes != null && vm.product.VariationTypes.length > 0) {
                            for (var i = 0; i < vm.product.VariationTypes.length; i++) {
                                var vt = vm.product.VariationTypes[i];
                                vm.product.VariationTypes[i].ddOptions = {
                                    dataSource: vt.VariationTypeOptions,
                                    dataTextField: "Name",
                                    dataValueField: "VariationTypeOptionID",
                                    template: "<span class='#=data.Selectable ? 'is-selectable' : 'not-selectable'#'>#:data.Name#</span>"
                                };
                                if (vm.productValidForCart == true) {
                                    for (var x = 0; x < vt.VariationTypeOptions.length; x++) {
                                        if (vt.SelectedVariationTypeOptionID == vt.VariationTypeOptions[x].VariationTypeOptionID && vt.VariationTypeOptions[x].Selectable == false) {
                                            vm.productValidForCart = false;
                                            break;
                                        }
                                    }
                                }
                                for (var x = 0; x < vt.VariationTypeOptions.length; x++) {
                                    if (vt.SelectedVariationTypeOptionID == vt.VariationTypeOptions[x].VariationTypeOptionID) {
                                        vt.SelectedVariationTypeOption = vt.VariationTypeOptions[x];
                                        if (vt.SelectedVariationTypeOption.Selectable == true) {
                                            vt.displayClass = "is-selectable";
                                        }
                                        else {
                                            vt.displayClass = "not-selectable";
                                        }
                                        break;
                                    }
                                }
                            }
                            if (vm.productValidForCart == false) {
                                idstc().notify({ message: translationService.translations['shopping-cart']['ProductDetailNotFound'] || 'Product not found', success: 'warn' });
                            }
                            else {
                                idstc().removeAllNotifications(); 
                            }
                        } 
                    }
                    else {
                        // set all child selections as unselectable since the option that was changed does not correspond to an availabe product
                        vm.productValidForCart = false;
                        var changedOptionFound = false;
                        if (vm.product.VariationTypes != null && vm.product.VariationTypes.length > 0) {
                            for (var i = 0; i < vm.product.VariationTypes.length; i++) {
                                if (changedOptionFound == false) {
                                    var foundType = _.find(vm.originalProduct.VariationTypes, function (type) { return type.VariationTypeID === vm.product.VariationTypes[i].VariationTypeID; });
                                    if (foundType.VariationTypeOptionID = !vm.product.VariationTypes[i].VariationTypeOptionID) {
                                        changedOptionFound = true;
                                    }
                                }
                                else {
                                    for (var x = 0; x < vm.product.VariationTypes[i].VariationTypeOptions.length; x++) {
                                        vm.product.VariationTypes[i].displayClass = "not-selectable";
                                    }
                                }
                            }
                        }

                        idstc().notify({ message: translationService.translations['shopping-cart']['ProductDetailNotFound'] || 'Product not found', success: 'warn' });
                    }                                                
                },
                function (errorResult) {
                    idstc().processError({ error: errorResult, showNotifications: true });
                    vm.productVariationChanging = false;
                    vm.productValidForCart = false;
                });
        }

        vm.updateProductImage = function (model) {
            var imageURL = model.image.ImageURL;
            vm.product.ProductImage = imageURL;
        };

        vm.showFullImage = function () {
            vm.fullImageWindow.center().open();
        }

        vm.showComponentFullImage = function (product) {
            vm.componentProductImage = product.ProductImage;
            vm.componentFullImageWindow.center().open();
        }

        vm.addToCart = function () {
            var isValid = true;

            var postVar = {
                CartID: shoppingCartModel.cart.CartID,
                SKU: vm.sku,
                Quantity: vm.quantity,
                BuildableComponents: [],
                CustomFields: [],
                OrderLineID: vm.lineId
            };

            var reward = JSON.parse(sessionStorage.getItem('rewardSelection'));

            if (reward != null) {
                postVar.RewardID = reward.RewardGroupRewardID;

                if (reward.CouponCode != null) {
                    postVar.CouponCode = reward.CouponCode;
                }
            }

            if (vm.product.customFields != null && vm.product.customFields.length > 0) {
                isValid = vm.customFieldAccessor.validate();

                if (isValid) {
                    for (var i = 0; i < vm.product.customFields.length; i++) {
                        var cf = vm.product.customFields[i];
                        postVar.CustomFields.push(cf);
                    }
                }
            }

            if (vm.product.BuildableComponents != null && vm.product.BuildableComponents.length > 0) {
                for (var i = 0; i < vm.product.BuildableComponents.length; i++) {
                    var bc = vm.product.BuildableComponents[i];

                    var cDto = {
                        BuildableComponentID: bc.BuildableComponentID,
                        Products: []
                    };

                    for (var x = 0; x < bc.Products.length; x++) {
                        var bcp = bc.Products[x];

                        if (bcp.Selected) {
                            var pDto = {
                                SKU: bcp.SKU,
                                QuantitySelected: bcp.QuantitySelected
                            };

                            cDto.Products.push(pDto);
                        }
                    }

                    postVar.BuildableComponents.push(cDto);
                }
            }

            var joinOption = JSON.parse(sessionStorage.getItem('JoinOption'));

            if (!isValid) {
                return;
            }

            $(document).progressStart();

            if (joinOption != null) {
                joinOption.BuildableComponents = postVar.BuildableComponents;

                // send data to the server
                $http.post(apiRoot + 'api/shopping/AddJoinOptionProductToCart', joinOption).then(
                    function (successResult) {
                        sessionStorage.removeItem('JoinOption');

                        if (appService.consultant == null) {
                            if (idstc_setting_checkoutconsultantsearchenabled) {
                                window.location = '/' + vm.shoppingCartModel.translatedPageNames.consultantSearch + '?checkout=true';
                            }
                            else {
                                $(document).progressStart();
                                appService.getConsultant(idstc_setting_corporateconsultanturl).then(function () {
                                    $(document).progressFinish();
                                    window.location = '/' + vm.shoppingCartModel.translatedPageNames.createPerson;
                                });
                            }      
                        }
                        else {
                            window.location = '/' + vm.shoppingCartModel.translatedPageNames.createPerson;
                        }
                    },
                    function (errorResult) {
                        idstc().processError({ error: errorResult, showNotifications: true });
                        $(document).progressFinish();
                    });
            }
            else {
                $http.post(apiRoot + 'api/shopping/AddToCart', postVar).then(
                    function (successResult) {
                        shoppingCartModel.viewCartInfo = null; // Clear view cart info so it will be refreshed                                        
                        window.location = '/' + vm.shoppingCartModel.translatedPageNames.viewCart;
                    },
                    function (errorResult) {
                        idstc().processError({ error: errorResult, showNotifications: true });
                        $(document).progressFinish();
                    });
            }
        }

        vm.updatePrice = function (component, product) {
            var adjustment = 0;

            if (product != null) {
                product.Selected = !product.Selected;
            }

            if (component != null) {
                for (var x = 0; x < component.Products.length; x++) {
                    var bcp = component.Products[x];

                    if (bcp.ProductID == component.selectedProductId) {
                        bcp.Selected = true;

                        if (component.QuantitySelected) {
                            bcp.QuantitySelected = component.QuantitySelected;
                        }
                    }
                    else {
                        bcp.Selected = false;
                        bcp.QuantitySelected = 1;
                    }
                }
            }

            if (vm.product.BuildableComponents != null && vm.product.BuildableComponents.length > 0) {
                for (var i = 0; i < vm.product.BuildableComponents.length; i++) {
                    var bc = vm.product.BuildableComponents[i];
                    for (var x = 0; x < bc.Products.length; x++) {
                        var bcp = bc.Products[x];

                        if (bcp.Selected) {
                            adjustment += bcp.QuantitySelected * bcp.PriceAdjustment;
                        }
                    }
                }
            }

            vm.product.Price = vm.priceWithoutComponents + adjustment;
        }

        //WebsiteChange
        vm.addSubscription = function () {
            var type = '';
            var location = '';
            var existingSub = null;

            if (shoppingCartModel.cart.OrderPersonID != null) { //person is logged in
                if (shoppingCartModel.cart.SubjectTypeID == 1) { // consultant
                    type = 'Consultants';
                } else { //customer
                    type = 'Customer';
                }

                $http.post(apiRoot + 'api/Website/CheckForExistingSubscription?personDisplayId=' + shoppingCartModel.cart.OrderPersonDisplayID + '&personTypeId=' + shoppingCartModel.cart.SubjectTypeID + '&sku=' + vm.sku).then(
                    function (successResult) {
                        existingSub = successResult.data;
                        var subInfo = { 'DisplayID': shoppingCartModel.cart.OrderPersonDisplayID, 'PersonID': shoppingCartModel.cart.OrderPersonID, 'PersonTypeID': shoppingCartModel.cart.SubjectTypeID, 'ExistingSub': existingSub };

                        if (existingSub != null) {
                            idstc(this).dialog({
                                message: idstc().translate('shopping-cart', 'ExistingSubscriptionForProduct', 'There is an existing active subscription with this product.  Do you want to create a new subscription with this product or modify the existing one?'),
                                title: idstc().translate('shopping-cart', 'ExistingSubscriptionForProductTitle', 'Product Already On Subscription'),
                                cancelButtonText: idstc().translate('shopping-cart', 'CreateNewSubscription', 'Create New Subscription'),
                                confirmButtonText: idstc().translate('shopping-cart', 'ModifyExistingSubscription', 'Modify Existing Subscription')
                            }, function (confirm) {
                                if (!confirm) {
                                    subInfo.ExistingSub = null;
                                }
                                storage.set('subInfo', subInfo);
                                window.location = '/' + vm.shoppingCartModel.translatedPageNames.subscriptions + '?sku=' + vm.sku;
                            });
                        }
                        else {                            
                            storage.set('subInfo', subInfo);
                            window.location = '/' + vm.shoppingCartModel.translatedPageNames.subscriptions + '?sku=' + vm.sku;
                        }
                    },
                    function (errorResult) {
                        idstc().processError({ error: errorResult, showNotifications: true });
                    });

                // var subInfo = { 'DisplayID': shoppingCartModel.cart.OrderPersonDisplayID, 'PersonID': shoppingCartModel.cart.OrderPersonID, 'PersonTypeID': shoppingCartModel.cart.SubjectTypeID, 'ExistingSub': existingSub };
                // storage.set('subInfo', subInfo);
                // window.location = '/subscriptionedit?sku=' + vm.sku;
            } else { //send to login page
                window.location = '/' + vm.shoppingCartModel.translatedPageNames.checkOut + '/?sub=' + vm.sku;
            }
        }

        // remove the reward selection from session storage so that the cart
        // will behave as a standard cart rather than a reward cart
        vm.gotoStandardShopping = function () {
            shoppingCartModel.exitRewardShopping();
        }

        vm.continueShopping = function () {
            if (vm.shoppingCartModel.breadcrumbs && vm.shoppingCartModel.breadcrumbs.length > 0) {
                var lastBreadCrumb = vm.shoppingCartModel.breadcrumbs[vm.shoppingCartModel.breadcrumbs.length - 1];
                window.location = '/' + shoppingCartModel.translatedPageNames.products + '/' + lastBreadCrumb.urlExtension;
            }
            else {
                window.location = '/' + shoppingCartModel.translatedPageNames.products;
            }
        }

        vm.provinceSelected = function () {
            sessionStorage.setItem('forceNewCart', true);
            window.location = '/' + shoppingCartModel.translatedPageNames.products;
        }

        vm.changeProvince = function () {
            idstc().dialog({ message: translationService.translations['shopping-cart']['confirm-change-province'] || 'Changing your province/state will clear any items in your cart and return you to the beginning of the shopping process.  Are you sure you want to change your province/state and start over?', title: translationService.translations['general']['confirm'] || 'Confirm' }, function (confirm) {
                if (confirm) {
                    $(document).progressStart();
                    vm.cartProvinceID = null;
                    vm.cartProvinceName = null;
                    localStorage.removeItem('provinceID');
                    localStorage.removeItem('provinceName');
                    vm.init();
                }
            });
        }

        vm.init();
    };
}());


angular
    .module('app')
    .directive('editCustomFieldValues', editCustomFieldValues);

editCustomFieldValues.$inject = ['$http', '$rootScope', '$filter', 'translationService'];

function editCustomFieldValues($http, $rootScope, $filter, translationService) {
    return {
        restrict: 'E',
        require: ['^form'],
        scope: {
            entityType: '=entityType', //  The value of the CustomFieldEntityTypeEnum for the entity you are working with
            entityDisplayId: '=entityDisplayId', // The display id of the entity you are working with
            saveEntity: '=?', // need this hack to get account records to save correctly
            getDataUrl: '=?', // Override the url used to get the custom fields and values
            saveDataUrl: '=?', // Override the url used to save the custom field values
            allowSave: '=?',
            disableReload: '=?',
            accountTypeId: '=?',
            orderLineId: '=?', // This is used when editing an order line product personalization in the shopping cart.
            accessor: '=?',
            window: '=?',
            allowUpdate: '=?',
            formHorizontal: '=?', // Set to true to add Bootstrap columns to form elements
            showDescription: '=?', // Set to true to show the custom field description underneath the label/input.  This is used for product personalization display in the shopping cart product detail page.
            customFields: '=?', // Allow two-way binding to the list of custom field values so that the field values can be used/saved outside of this directive
            customFieldInputs: '@',
            creatingEntity: '=?', // If true, then this directive is being used on a creation action (not an update of an existing entity)
            displayOnlyMode: '=?displayOnlyMode',
            useBootstrapFormClasses: '=?useBootstrapFormClasses'
        },
        template: '<div ng-form="editCustomFieldValuesForm" class="custom-fields"> <div ng-class="{\'form-group\': useBootstrapFormClasses}" ng-repeat="customField in customFields" class="custom-field"> <label class="custom-field-label" ng-class="{\'control-label\': useBootstrapFormClasses, \'col-sm-4\': formHorizontal}"> {{customField.Name}} <span ng-class="{\'text-danger\': useBootstrapFormClasses}" class="required-mark" ng-show="customField.Required">*</span> </label> <div ng-if="!customField.Editable || displayOnlyMode"> {{customField.DisplayValue}} </div> <div ng-class="{\'col-sm-8\': formHorizontal}" ng-if="customField.Editable && !displayOnlyMode"> <!--Textbox--> <input ng-if="customField.CustomFieldTypeID == 1" kendo-masked-text-box ng-class="{\'form-control\': useBootstrapFormClasses}" k-mask="\'{{customField.TextboxMask}}\'" maxlength="{{customField.TextboxMaxLength}}" ng-model="customField.StringValue" ng-required="customField.Required" name="textBox{{customField.CustomFieldID}}" /> <!--Checkbox--> <div class="custom-field-checkbox" ng-class="{\'checkbox\': vm.leadCaptureForm.EnableBootstrapCSS}" ng-if="customField.CustomFieldTypeID == 2"> <label> <input type="checkbox" ng-model="customField.BooleanValue" ng-required="customField.Required" /> </label> </div> <!--Dropdown--> <select ng-if="customField.CustomFieldTypeID == 3" ng-options="option.CustomFieldSelectOptionID as option.Description for option in customField.SelectOptions" ng-model="customField.CustomFieldSelectOptionID" ng-required="customField.Required" ng-class="{\'form-control\': useBootstrapFormClasses}"></select> <!--DateTime--> <div ng-if="customField.CustomFieldTypeID == 4" class="custom-field-input-wrapper"> <!--MM/DD/YYYY TT:TT--> <input ng-if="customField.DateTimeAccuracy == 1" kendo-date-time-picker k-depth="\'month\'" k-start="\'month\'" k-format="\'{{customField.DateTimeFormat}}\'" k-min="customField.DateTimeMinValue" k-max="customField.DateTimeMaxValue" k-ng-model="customField.DateTimeValue" ng-required="customField.Required" placeholder="{{customField.DateTimeFormat}}" name="datePicker{{customField.CustomFieldID}}" /> <!--MM/DD/YYYY--> <input ng-if="customField.DateTimeAccuracy == 2" kendo-date-picker k-scope-field="datePicker" k-depth="\'month\'" k-start="\'month\'" k-format="\'{{customField.DateTimeFormat}}\'" placeholder="{{customField.DateTimeFormat}}" k-min="customField.DateTimeMinValue" k-max="customField.DateTimeMaxValue" ng-model="customField.DateTimeValue" ng-required="customField.Required" name="datePicker{{customField.CustomFieldID}}" /> <!--MM/YYYY--> <input ng-if="customField.DateTimeAccuracy == 3" kendo-date-picker="datePicker{{customField.CustomFieldID}}" k-depth="\'year\'" k-start="\'year\'" k-format="\'MMMM yyyy\'" placeholder="MMMM yyyy" k-min="customField.DateTimeMinValue" k-max="customField.DateTimeMaxValue" ng-model="customField.DateTimeValue" ng-required="customField.Required" name="datePicker{{customField.CustomFieldID}}" /> <!--YYYY--> <input ng-if="customField.DateTimeAccuracy == 4" kendo-date-picker k-depth="\'decade\'" k-start="\'decade\'" k-format="\'yyyy\'" placeholder="yyyy" k-min="customField.DateTimeMinValue" k-max="customField.DateTimeMaxValue" k-ng-model="customField.DateTimeValue" ng-required="customField.Required" name="datePicker{{customField.CustomFieldID}}" /> </div> <!--Radio Buttons--> <div ng-if="customField.CustomFieldTypeID == 5" class="custom-field-radio-wrapper"> <div ng-repeat="option in customField.SelectOptions" ng-class="{\'radio\': useBootstrapFormClasses}"> <label class="custom-field-radio-label"> <input type="radio" name="customField{{customField.CustomFieldID}}" ng-model="customField.CustomFieldSelectOptionID" ng-value="option.CustomFieldSelectOptionID" ng-required="customField.Required" /> {{option.Description}} </label> </div> </div> <!--Numeric Input--> <input ng-if="customField.CustomFieldTypeID == 6" kendo-numeric-text-box k-min="customField.NumericInputMinValue" k-max="customField.NumericInputMaxValue" k-format="\'n{{customField.NumericInputDecimalPlaces}}\'" k-spinners="false" k-decimals="{{customField.NumericInputDecimalPlaces}}" " ng-model="customField.DecimalValue" ng-required="customField.Required" /> </div> <div ng-class="{\'col-sm-8 col-sm-offset-4\': formHorizontal}" ng-if="showDescription"> <span ng-class="{\'help-block\': useBootstrapFormClasses}"> {{customField.Description}} </span> </div> <div ng-class="{\'clearfix\': useBootstrapFormClasses}"></div> </div> <div ng-if="showCustomFieldSaveButton"> <button type="button" class="custom-field-submit" ng-class="{\'btn btn-primary center-block\': useBootstrapFormClasses}" ng-click="saveCustomFieldValues()" ng-disabled="!allowUpdate" title="{{allowUpdate ? \'\' : cannotEditEntityMessage}}"><i class="fa fa-fw fa-check-circle-o custom-field-icon" aria-hidden="true"></i> <translate-content container="edit-custom-field" key="Save" default-content="Save"></translate-content></button> </div></div>',
        link: function (scope, element, attrs, ctrls) {
            scope.form = ctrls[0];
            scope.showCustomFieldSaveButton = false;

            if (scope.displayOnlyMode == null) {
                scope.displayOnlyMode = false;
            }

            if (scope.useBootstrapFormClasses == null) {
                scope.useBootstrapFormClasses = true;
            }
            
            translationService.getTranslations('edit-custom-field-value');

            if (scope.allowSave == null) scope.allowSave = true;
            if (scope.allowUpdate == null) scope.allowUpdate = true;
            if (scope.disableReload == null) scope.disableReload = false;
            if (scope.creatingEntity == null) scope.creatingEntity = false;
            if (scope.showDescription == null) scope.showDescription = false;

            scope.$watch('entityDisplayId', function (value) {
                if (scope.creatingEntity) {
                    scope.entityDisplayId = '';
                }

                if (!scope.disableReload && typeof value != 'undefined') {
                    scope.loadCustomFields();
                }
            });

            scope.$watch('accountTypeId', function (value) {
                if (scope.creatingEntity) {
                    scope.entityDisplayId = '';
                }

                if (!scope.disableReload && typeof value != 'undefined') {
                    scope.loadCustomFields();
                }
            });

            scope.$watch('orderLineId', function (value) {
                if (!scope.disableReload && typeof value != 'undefined') {
                    scope.loadCustomFields();
                }
            });

            scope.$watch('displayOnlyMode', function (value) {
                if (typeof value != 'undefined' && value) {
                    for (i = 0; i < scope.customFields.length; i++) {
                        if (scope.customFields[i].CustomFieldTypeID == 1) {
                            scope.customFields[i].DisplayValue = scope.customFields[i].StringValue;
                        }
                        if (scope.customFields[i].CustomFieldTypeID == 2) {
                            if (scope.customFields[i].BooleanValue) {
                                scope.customFields[i].DisplayValue = idstc().translate('general', 'Yes', 'Yes');
                            }
                            else {
                                scope.customFields[i].DisplayValue = idstc().translate('general', 'No', 'No');
                            }
                        }
                        if (scope.customFields[i].CustomFieldTypeID == 3 || scope.customFields[i].CustomFieldTypeID == 5) {
                            var foundOption = _.find(scope.customFields[i].SelectOptions, function (option) { return option.CustomFieldSelectOptionID === scope.customFields[i].CustomFieldSelectOptionID; });
                            if (foundOption != null) {
                                scope.customFields[i].DisplayValue = foundOption.Description;
                            }                                                        
                        }
                        if (scope.customFields[i].CustomFieldTypeID == 4) {
                            scope.customFields[i].DisplayValue = scope.customFields[i].DateTimeValue;
                        }
                        if (scope.customFields[i].CustomFieldTypeID == 6) {
                            scope.customFields[i].DisplayValue = scope.customFields[i].DecimalValue;
                        }
                    }
                }
            });

            // Custom fields are retrieved and saved via entity-type-specific calls to apply security to each entity differently, so call the correct api based on the entityType
            scope.getEntityTypeName = function () {
                //Just add an s to the enumeration name (this convention works so far)
                var entityTypeName = scope.entityType + 's';

                return entityTypeName;
            }

            scope.$watch('entityType', function (value) {
		        if (!scope.disableReload) {
                	scope.loadCustomFields();
		        }
            });

            scope.applyCustomFieldInputs = function (inputs) {
                scope.customFields = inputs;

                scope.customFieldsToSave = [];

                for (i = 0; i < scope.customFields.length; i++) {
                    var cfv = scope.customFields[i];

                    if (cfv.Editable) {
                        if (cfv.CustomFieldTypeID == 4 && cfv.DateTimeValue != null) {
                            if (cfv.DateTimeAccuracy == 1) {
                                cfv.DateTimeValue = $filter('dateFormat')(cfv.DateTimeValue, 'g', null, true);
                            }
                            else if (cfv.DateTimeAccuracy == 2) {
                                cfv.DateTimeValue = $filter('dateFormat')(cfv.DateTimeValue, 'd', null, false);
                            }
                        }

                        scope.customFieldsToSave.push(cfv);
                    }
                }

                if (scope.customFieldsToSave.length > 0 && scope.allowSave) {
                    scope.showCustomFieldSaveButton = true;
                }

                if (scope.window) {
                    scope.window.center();
                }
            }

            // Get the custom fields and values for a given entity type (Consultant,Customer,Order, etc.) and display id combination
            scope.loadCustomFields = function () {
                if (scope.accessor) {
                    scope.accessor.validate = function () {
                        return scope.validate();
                    };

                    scope.accessor.saveCustomFieldValues = function () {
                        return scope.saveCustomFieldValues();
                    };
                }

                if (scope.entityDisplayId != null && scope.entityDisplayId != $rootScope.customFieldEntityDisplayId) {
                    $rootScope.customFieldEntityDisplayId = scope.entityDisplayId;
                    entityDisplayId: scope.entityDisplayId
                };

                if (scope.entityDisplayId != null && (scope.entityDisplayId != '' || scope.creatingEntity) && typeof scope.entityType != 'undefined') {
                    var url = apiRoot + 'api/' + scope.getEntityTypeName() + '/GetCustomFieldValues?displayId=';
                    if (scope.getDataUrl != null) {
                        url = scope.getDataUrl;
                    }

                    if (scope.customFieldInputs != null) {
                        var inputs = angular.copy(JSON.parse(scope.customFieldInputs));
                        scope.applyCustomFieldInputs(inputs);
                        return;
                    }

                    url += scope.entityDisplayId;

                    if (scope.accountTypeId != null) url += '&accountTypeId=' + scope.accountTypeId;
                    if (scope.orderLineId != null) url += '&orderLineId=' + scope.orderLineId;

                    $(document).progressStart();

                    $http.get(url).then(
                        function (successResult) {
                            var inputs = angular.copy(successResult.data);
                            scope.applyCustomFieldInputs(inputs);                          
                            $(document).progressFinish();
                        },
                        function (errorResult) {
                            idstc().processError({ error: errorResult, showNotifications: true });
                            $(document).progressFinish();
                        });
                }
            }

            scope.validate = function () {
                var saveValid = true;
                var focusOnElement = null;

                if (scope.customFieldsToSave != null && scope.customFieldsToSave.length > 0) {
                    for (i = 0; i < scope.customFieldsToSave.length; i++) {
                        // validate required fields are populated
                        var requiredMissing = false;
                        var customField = scope.customFieldsToSave[i];

                        if (customField.Required) {
                            if (customField.CustomFieldTypeID == 1 && (customField.StringValue == null || customField.StringValue == '')) {
                                requiredMissing = true;
                            }
                            else if ((customField.CustomFieldTypeID == 3 || customField.CustomFieldTypeID == 5) && (customField.CustomFieldSelectOptionID == null || customField.CustomFieldSelectOptionID == '' || customField.CustomFieldSelectOptionID == 0)) {
                                requiredMissing = true;
                            }
                            else if (customField.CustomFieldTypeID == 4 && (customField.DateTimeValue == null || customField.DateTimeValue == '')) {

                                var datePickerName = 'datePicker' + customField.CustomFieldID;
                                focusOnElement = $('input[name="' + datePickerName + '"]').data('kendoDatePicker').element;
                                requiredMissing = true;
                            }
                            else if (customField.CustomFieldTypeID == 6 && customField.DecimalValue == null) {
                                requiredMissing = true;
                            }
                        }

                        if (requiredMissing) {
                            scope.editCustomFieldValuesForm.$setSubmitted();
                            saveValid = false;
                            idstc().notify({
                                message: (translationService.translations['edit-custom-field-value']['CustomFieldRequired'] || '{{CustomFieldName}} is required.').replace('{{CustomFieldName}}', customField.Name),
                                success: 'error'
                            }, null);
                            break;
                        }
                        else {
                            // validate date fields contain valid dates
                            if (customField.CustomFieldTypeID == 4) {
                                // null/empty is allowed at this point.. if the field was required, it would have already been caught
                                if (customField.DateTimeValue != null && customField.DateTimeValue != '') {
                                    var dateValid = false;

                                    if (kendo.parseDate(customField.DateTimeValue) != null) {
                                        dateValid = true;
                                    }

                                    if (!dateValid) {
                                        scope.editCustomFieldValuesForm.$setSubmitted();
                                        saveValid = false;
                                        idstc().notify({
                                            message: (translationService.translations['edit-custom-field-value']['DateTimeCustomFieldInvalid'] || '{{CustomFieldName}} is invalid.').replace('{{CustomFieldName}}', customField.Name),
                                            success: 'error'
                                        }, null);

                                        var datePickerName = 'datePicker' + customField.CustomFieldID;
                                        focusOnElement = $('input[name="' + datePickerName + '"]').data('kendoDatePicker').element;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    if (focusOnElement != null) {
                        focusOnElement.focus();
                    }
                }

                return saveValid;
            }

            scope.saveCustomFieldValues = function () {
                var saveValid = scope.validate();

                if (scope.customFieldsToSave.length > 0) {
                    if (saveValid) {
                        $(document).progressStart();

                        var url = apiRoot + 'api/' + scope.getEntityTypeName() + '/SaveCustomFieldValues?displayId=';
                        if (scope.saveDataUrl != null) {
                            url = scope.saveDataUrl;
                        }

                        if (scope.saveEntity != null) {
                            url += scope.saveEntity.displayId;
                        }
                        else {
                            url += scope.entityDisplayId;
                        }

                        return $http.post(url, scope.customFieldsToSave).then(
                            function (successResult) {
                                idstc().processResponse({ response: successResult.data, showNotifications: true });
                                $(document).progressFinish();
                                scope.form.$setPristine();
                            },
                            function (errorResult) {
                                idstc().processError({ error: errorResult, showNotifications: true });
                                $(document).progressFinish();
                            });
                    }
                }
            };

        }
    };
};

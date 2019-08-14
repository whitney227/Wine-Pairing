//Modified version of http://demo.tutorialzine.com/2013/10/buttons-built-in-progress-meters/
(function ($) {

    var progressInterval;   

    // progressStart simulates activity on the progress meter. Call it first,
    // if the progress is going to take a long time to finish.

    $.fn.progressStart = function () {
        $(".loader, #screen-overlay").show();

        return;
    };

    $.fn.progressFinish = function () {
        $(".loader, #screen-overlay").hide();

        return;
    };

    $.fn.progressIncrement = function (val) {

        val = val || 10;

        var button = this.first();

        button.trigger('progress', [val])

        return this;
    };

    $.fn.progressSet = function (val) {
        val = val || 10;

        var finish = false;
        if (val >= 100) {
            finish = true;
        }

        return this.first().trigger('progress', [val, true, finish]);
    };

})(jQuery);
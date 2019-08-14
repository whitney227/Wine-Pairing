$(function () {
    $("#menu-close").on("click", function (e) {
        e.preventDefault();
        $("#sidebar-wrapper").toggleClass("active");
    });

    $("#menu-toggle").on("click", function (e) {
        e.preventDefault();
        $("#sidebar-wrapper").toggleClass("active");
    });    

    $("#menu-toggle-remove-all").on("click", function (e) {
        e.preventDefault();
        idstc().removeAllNotifications();                
    });

    $().on("click", function (e) {
        e.preventDefault();
        getNotificationDetails(e);
    })

    $(".sub-nav").hover(
        function () {
            $(this).prev("a").addClass("hover");
        },
        function () {
            $(this).prev("a").removeClass("hover");
        }
    );

    $(".new-win").hover(
        function () {
            $(this).prev("a").addClass("hover");
            // $(this).prev("ul").css("display","block");

        },
        function () {
            $(this).prev("a").removeClass("hover");
        }
    );

    $("#menu-desktop").on("click", function () {
        $("#navbar-collapse-1").toggleClass("dropIn");
    });    
});

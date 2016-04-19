$(document).ready(function () {

    var $doc = $(document);
    var lo = window.location;
    var website = lo.origin;
    var config = {
        TIME: 0,
        apiUrl: website + '/send-feedback-api/'
    };

    var surveySlug = parse('survey');
    var optionSlug = parse('option');

    getSurvey();

    function getSurvey() {
        if (surveySlug && optionSlug) {
            $.ajax({
                url: config.apiUrl,
                type: 'GET',
                data: {
                    survey: surveySlug
                },
                dataType: 'json',
                success: function (data) {
                    if (data.status == 1) {
                        window.survey = data.survey;
                        sendAjax();
                    }
                }
            });
        }
    }

    function sendAjax() {
        var optionText = '';
        var redirectLink = '';
        for (var i in window.survey.options) {
            if (optionSlug == window.survey.options[i].slug) {
                optionText = window.survey.options[i].title;
                redirectLink = window.survey.options[i].redirectLink;
            }
        }

        $.ajax({
            url: config.apiUrl,
            type: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            data: {
                'survey': surveySlug,
                'option_slug': optionSlug,
                'option_text': optionText,
                'website': website,
            },
            success: function (data) {
                console.log(data)
                countDownRedirect(config.TIME, redirectLink);
            },
            error: function (err) {
                console.log(err)
                countDownRedirect(config.TIME, redirectLink);
            }
        })
    }

    function countDownRedirect(time, redirectLink) {
        if (time > 0) {
            var ele = $('#fb-time');
            setTimeout(function () {
                time--;
                var str = time > 1 ? time + ' seconds' : time + ' second';
                ele.html(str);

                countDownRedirect(time);
            }, 1000);
        } else {
            var redi = redirectLink ? redirectLink : '/';
            if (!redi) redi = '/';
            window.location = redi;
        }
    }

    function parse(val) {
        var result = null,
            tmp = [];
        var items = location.search.substr(1).split("&");
        for (var index = 0; index < items.length; index++) {
            tmp = items[index].split("=");
            if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
        }
        return result;
    }
});

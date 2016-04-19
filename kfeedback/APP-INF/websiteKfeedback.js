/**
 * get survey detail controlller
 * @param {Page} page
 * @param {Json} params
 */
function getSurvey(page, params) {
    var jsonDB = page.find(JSON_DB);
    var db = jsonDB.find(dbName);

    var surveySlug = params.survey;
    var result = {
        status: 0,
        msg: 'Survey is not exist'
    };

    if (db === null || surveySlug == null) {
        return views.textView(JSON.stringify({
            status: 0,
            msg: 'Survey is not exist'
        }));
    } else {
        var exists = db.child(surveySlug);
        log.warn(JSON.parse(exists.jsonObject));
        if (exists !== null) {
            result = {
                status: 1,
                survey: JSON.parse(exists.jsonObject)
            };
        }
    }

    return views.textView(JSON.stringify(result));
}


/**
 * create feedback controlller
 * @param {Page} page
 * @param {Json} params
 */
function createFeedback(page, params) {
    var jsonDB = page.find(JSON_DB);
    var db = jsonDB.child(dbName);

    if (db === null) {
        db = jsonDB.createDb(dbName, dbTitle, dbType);

        log.info("Start create access");
        var createdDB = page.find(JSON_DB + '/' + dbName);
        transactionManager.begin();
        createdDB.setAllowAccess(true);
        createdDB.setAllowRest(true);
        transactionManager.commit();
        log.info("End create access");

        return views.textView(JSON.stringify({
            status: 0,
            msg: 'Please update and set allow access for database before use'
        }));
    }

    var cur = (new Date).getTime();


    var surveyId = params.survey;
    if (!surveyId) {
        return views.textView(JSON.stringify({
            status: 0,
            msg: 'Please send survey id'
        }));
    }

    var feedback = {
        option_slug: params.option_slug,
        option_text: params.option_text,
        website: params.website,
        created: cur
    };

    securityManager.runAsUser(dbUser, function () {
        db.createNew(cur, JSON.stringify(feedback), TYPE_FEEDBACK + '-' + surveyId);
    });

    return views.textView(JSON.stringify({
        status: 1,
        feedback: feedback
    }));
}

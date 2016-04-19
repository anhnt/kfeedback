/**
 * get all survey for admin controlller
 * @param {Page} page
 * @param {Json} params
 */
function getAllSurveys(page, params) {
    var jsonDB = page.find(JSON_DB);
    var db = jsonDB.child(dbName);

    if (db === null) {
        return views.textView(JSON.stringify([]));
    }

    var ret = db.findByType(TYPE_SURVEY);

    var result = [];
    for (var i in ret) {
        var d = ret[i].jsonObject;
        result.push(JSON.parse(d));
    }

    return views.jsonObjectView(result);
}

/**
 * create survey controller
 * @param {Page} page
 * @param {Json} params
 */
function createSurvey(page, params) {
    var jsonDB = page.find(JSON_DB);
    var db = jsonDB.child(dbName);

    if (db === null) {
        db = jsonDB.createDb(dbName, dbTitle, dbType);

        log.info("Start create access");
        var createdDB = page.find(JSON_DB + '/' + dbName);
        transactionManager.begin();
        createdDB.setAllowRest(true);
        transactionManager.commit();
        log.info("End create access");
    }

    //log.warn(params);
    var op = params.option;

    var survey = {
        id: params.slug,
        slug: params.slug,
        name: params.name,
        question: params.question,
        created: params.created,
        options: JSON.parse(op)
    };

    var exists = db.child(survey.id);
    if (exists !== null) {
        return page.jsonResult(false, 'Survey already exists');
    }

    db.createNew(survey.id, JSON.stringify(survey), TYPE_SURVEY);

    return views.textView(JSON.stringify(survey));
}


/**
 * get all feedback with survey id
 * @param {Page} page
 * @param {Json} params
 */
function getFeedbackBySurvey(page, params) {
    var jsonDB = page.find(JSON_DB);
    var db = jsonDB.child(dbName);
    var id = params.id;

    if (db === null || !id) {
        return views.textView(JSON.stringify([]));
    }

    var ret = db.findByType(TYPE_FEEDBACK + '-' + id);

    var result = [];
    for (var i in ret) {
        var d = ret[i].jsonObject;
        result.push(JSON.parse(d));
    }

    return views.textView(JSON.stringify(result));
}

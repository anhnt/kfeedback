controllerMappings
    .adminController()
    .path("/kfeedback/")
    .enabled(true)
    .defaultView(views.templateView("kfeedback/index.html"))
    .build();

controllerMappings
    .adminController()
    .path("/kfeedback/feedbacks/")
    .enabled(true)
    .addMethod("GET", "getFeedbackBySurvey")
    .build();

controllerMappings
    .adminController()
    .path("/kfeedback/surveys/")
    .enabled(true)
    .addMethod("GET", "getAllSurveys")
    .addMethod("POST", "createSurvey")
    .build();

/**
 * front end mapping
 */
controllerMappings
    .websiteController()
    .path("/send-feedback/")
    .enabled(true)
    .isPublic(true)
    .defaultView(views.templateView("kfeedback/index.html"))
    .build();

controllerMappings
    .websiteController()
    .path("/send-feedback-api/")
    .enabled(true)
    .isPublic(true)
    .addMethod("GET", "getSurvey")
    .addMethod("POST", "createFeedback")
    .postPriviledge("READ_CONTENT")
    .build();


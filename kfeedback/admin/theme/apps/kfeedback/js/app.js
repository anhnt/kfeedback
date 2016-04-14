+(function(window) {
  var lo = window.location;

  window.appConfig = {
    rootUrl: '/',
    appId: lo.hostname.replace(/\./g, ''),
    baseUrl: lo.hostname.indexOf('olhub') > -1 ? '/theme/apps/kfeedback/ang-app/' : '/ang-app/',
    jsonDb: '/jsondb/kfeedback/',
    api: '/kfeedback/'
  };
})(window);

+(function(appName) {
  window.App = angular.module(appName, [
      'ui.router',
      'ngSanitize',
      'mgcrea.ngStrap',
      'ngTable',
      'angularMoment',
      'ngClipboard',
      'highcharts-ng'
  ]);
  App.value('config', window.appConfig);


})('App');


+App.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
    var $rootApp = window.appConfig.baseUrl;
    $urlRouterProvider.otherwise('/surveys/list');
    $locationProvider.hashPrefix('\!');


    $stateProvider.state('site', {
      abstract: true,
      views: {
        "@": {
          controller: 'SiteCtrl',
          templateUrl: $rootApp + '/views/site.html',
        },
      }
    });
    lazyRouteParser({
      'home': {
        url: '/',
        views: {
          '@site': {
            controller: 'IndexCtrl',
            templateUrl: $rootApp + '/views/index.html'
          }
        },
        resolve: {
          surveys: ['Surveys', function (Surveys) {
            return Surveys.getAll();
          }],
        }
      },
      'surveys': {
        abstract: true,
      },
      'surveys.list': {
        url: '/list',
        resolve: {
          surveys: ['Surveys', function (Surveys) {
            return Surveys.getAll();
          }],
        }
      },
      'surveys.detail': {
        url: '/detail/?id',
        resolve: {
          survey : ['Surveys', '$stateParams', function(Surveys, $stateParams) {
            if(!$stateParams.id || $stateParams.id == '') return null;

            return Surveys.get($stateParams.id);
          }]
        },
      },
      'surveys.view': {
        url: '/:id',
        resolve: {
          survey : ['Surveys', '$stateParams', function(Surveys, $stateParams) {
            return Surveys.get($stateParams.id);
          }],
          feedbacks : ['Feedbacks', '$stateParams', function(Feedbacks, $stateParams) {
            return Feedbacks.getBySurvey($stateParams.id);
          }]
        }
      }
    });

    /**
     * @description
     * Why called lazy?
     * Actually, the router isn't lazy at all,
     * but the developer is, pretty lazy, I would say.
     * So we have the naming-convention for the correspondence
     * between state-controller-view, it's a good idea to
     * let the machine auto-parse it by itself.
     * Why would we wanna repeat ourselves?
     */
    function lazyRouteParser(routes) {
        angular.forEach(routes, function(stateConfig, state) {
            var parentState = state.replace(/(^|\.)[^.]+$/, '')
              , templateUrl = $rootApp + 'views/' + state + '.html'
              , controller = state.replace(/(^|\.|-)(.)/g, function() {
                    return arguments[2].toUpperCase()
                }) + 'Ctrl';
            
            //console.log(parentState, templateUrl, controller)
            //console.log(stateConfig);

            parentState = parentState || 'site'

            var defaultStateConfig = { views: {} };
            defaultStateConfig['parent'] = parentState;
            defaultStateConfig['url'] = '^/' + state;
            defaultStateConfig['views']['@' + parentState] = {
                templateUrl: templateUrl,
                controller: controller,
                controllerAs: controller
            };
            defaultStateConfig['title'] = state
                .replace(/\b(out|in|single)\b|\.|-/g, ' ') // Stripping stop words
                .replace(/^\s+|\s+$/g, '') // Trim, ofcourse
                .replace(/\b(.)/g, function() {
                    return arguments[0].toUpperCase();
                })
                .toUpperCase();

            // A single state require an :id suffix in URL,
            //   and doesn't extend from its parent view
            //   but its parent-of-parent view, yep.
            if(/\.single$/.test(state)) {
                defaultStateConfig['url'] = defaultStateConfig['url'] + '/:id';

                defaultStateConfig['views']['@' + parentState.replace(/\.[^.]+$/, '')] = defaultStateConfig['views']['@' + parentState];
                delete defaultStateConfig['views']['@' + parentState];
            }

            $stateProvider.state(
                state,
                angular.copy(
                    angular.extend(
                        defaultStateConfig,
                        stateConfig
                    ),
                    stateConfig
                )
            );

            return null;
        });
    }
 
});

+App.controller('IndexCtrl', function($scope, $stateParams, surveys, Feedbacks, Chart) {
  $scope.surveys = surveys;
  $scope.chartOptions = {};

  angular.forEach(surveys, function(value, key) {
    $scope.chartOptions[value.slug] = Chart.getOption(value);
    getFeedbackSeries(value);
  });

  $scope.getChart = function(survey) {
    return $scope.chartOptions[survey.slug];
  }

  function getFeedbackSeries(survey) {
    Chart.getSeries(survey).then(function(series) {
      $scope.chartOptions[survey.slug].series = series;
    })
  }
});

+App.controller('SiteCtrl', function() {});

+App.controller('SurveysDetailCtrl', function($scope, $state, Surveys, $stateParams, survey) {
  $scope.edit = false;
  $scope.submitText = 'Submit';

  if(survey != null) {
    $scope.edit = true;
    $scope.survey = survey;
  } else {
    $scope.survey = {
      id: '',
      slug: '',
      name: '',
      question: '',
      redirect_link: '',
      options: [
        {
          title: 'Happy',
          emoji: 'http://minda.olhub.com/theme/apps/kfeedback/emoji/happy.png',
          slug: 'happy'
        },
        {
          title: 'Neutral',
          emoji: 'http://minda.olhub.com/theme/apps/kfeedback/emoji/neutral.png',
          slug: 'neutral'
        },
        {
          title: 'Sad',
          emoji: 'http://minda.olhub.com/theme/apps/kfeedback/emoji/sad.png',
          slug: 'sad'
        }
      ]
    }
  }

  $scope.addOption = function() {
    return false;
    $scope.survey.options.push({
      title: '',
      slug: '',
    })
  }

  $scope.$watch('survey.name', function() {
    if($scope.edit) return;
    $scope.survey.slug = $scope.survey.name.toLowerCase()
                                           .replace(/[^\w ]+/g,'')
                                           .replace(/ +/g,'-')
                                           ;
  });

  $scope.save = function() {
    if($scope.survey.name != ''
       && $scope.survey.question != ''
       && $scope.survey.options.length > 0) {

      //slugOptions();
      $scope.submitText = 'Submiting...'
      if($scope.edit) {
        $scope.updateExist();
      } else {
        $scope.create();
      }
    }
  }

  $scope.updateExist = function() {
    Surveys.update($scope.survey).then(function(data) {
      $state.go('surveys.view', {id : $scope.survey.slug});
    });
  }

  $scope.create = function() {
    $scope.survey.id = $scope.survey.created = (new Date).getTime();
    Surveys.create($scope.survey).then(function(data) {
      $state.go('surveys.view', {id : $scope.survey.slug});
    });
  }

  function slugOptions() {
    angular.forEach($scope.survey.options, function(value, key) {
     $scope.survey.options[key].slug = key + '-' + $scope.survey.options[key].title.toLowerCase()
                                           .replace(/[^\w ]+/g,'')
                                           .replace(/ +/g,'-')
                                           ;
    });
  }
});

+App.controller('SurveysCtrl', function() {});

+App.controller('SurveysListCtrl', function($scope, $stateParams, Surveys, surveys, $http, NgTableParams) {

  $scope.showComplete = false;
  $scope.surveys = surveys;

  $scope.tableParams = new NgTableParams({
    filter: { name: "" },
    page: 1,
    count: 10,
  }, {
    data: surveys,
  });

  $scope.remove = function(group, index, option) {
    var proj = $scope.surveys[option.survey.id];

    $scope[group].splice(index, 1);
    proj.options.splice(option.indexes, 1);
    Surveys.update(proj);
  }
});

+App.controller('SurveysViewCtrl', function($scope, $state, Surveys, $stateParams, survey, feedbacks, NgTableParams, Chart) {
  $scope.survey = survey;
  //$scope.website = window.location.origin.replace('admin.', '');
  $scope.website = 'http://minda.olhub.com';
  $scope.kApp = '/send-feedback/?survey=' + survey.slug + '&option=';

  $scope.getEmailTemplate = function() {
    return Surveys.getEmailTemplate($scope.website, $scope.kApp, $scope.survey);
  }

  $scope.tableFeedbacks = new NgTableParams({
    filter: {},
    page: 1,
    count: 25,
  }, {
    data: feedbacks,
  });

  $scope.chartOption = Chart.getOption(survey);
  Chart.getSeries(survey).then(function(series) {
    $scope.chartOption.series = series;
  });
});

+App.directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                        scope.$apply(function(){
                                scope.$eval(attrs.ngEnter);
                        });
                        
                        event.preventDefault();
                }
            });
        };
});

+App.service('Chart', function($q, Feedbacks) {
  this.series = {};

  this.getOption= function(survey) {
    return {
      options: {
        chart: {
          zoomType: 'x'
        },
        rangeSelector: {
          enabled: true
        },
        navigator: {
          enabled: true
        },
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'top',
          y: 20,
          floating: true,
          borderWidth: 0
        },
      },
      series: [{
          data: []
      }],
      title: {
        text: survey.name
      },
      subtitle: {
        text: survey.question
      },
      useHighStocks: true,
      loading: false
    }
  };

  this.getSeries= function(survey) {
    if(this.series[survey.slug] != undefined) {
      return $q.when(this.series[survey.slug]);
    }

    var _self = this;
    var deferred = $q.defer();

    Feedbacks.getBySurvey(survey.id).then(function(fbs) {
      var series = [];
      for(var i in survey.options) {
        var data = {};
        var slug = survey.options[i].slug;
        for(var j in fbs) {
          if(fbs[j].option_slug == slug) {
            var d = new Date(fbs[j].created);
            d.setHours(0, 0, 0, 0);
            var idx = d.getTime() + 86400000;
            if(data[idx]) {
              data[idx]++;
            } else {
              data[idx] = 1;
            }
          }
        }

        var hData = [];
        for(var k in data) {
          hData.push([parseInt(k), data[k]]);
        }

        series.push({
          id: i,
          name: survey.options[i].title,
          data: hData
        });
      }

      _self.series[survey.slug] = series;
      deferred.resolve(series);
    }, function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }
})

+App.service('Feedbacks', function($q, config, $http) {
  var self = this;
  self.feedbacks = [];

  /**
   * get all feedback response to a survey
   * @param {String} surveyId
   */
  this.getBySurvey = function (surveyId) {
    /*
    return $q.when([
      {
        email: 'minhnt@ownego.com',
        option_text: 'Bad',
        option_slug: 'bad',
        website: 'http://sonnh.olhub.com',
        created: 1147651200000
      },
      {
        email: 'minhnt@ownego.com',
        option_text: 'Bad',
        option_slug: 'bad',
        website: 'http://sonnh.olhub.com',
        created: 1147910400000
      },
      {
        email: 'minhnt@ownego.com',
        option_text: 'Bad',
        option_slug: 'bad',
        website: 'http://sonnh.olhub.com',
        created: 1147910400000
      },
      {
        email: 'minhnt@ownego.com',
        option_text: 'Bad',
        option_slug: 'bad',
        website: 'http://sonnh.olhub.com',
        created: 1147996800000
      },
      {
        email: 'minhnt@ownego.com',
        option_text: 'Good',
        option_slug: 'bad',
        website: 'http://sonnh.olhub.com',
        created: 1456213386087
      },
      {
        email: 'minhnt@ownego.com',
        option_text: 'Good',
        option_slug: 'good',
        website: 'http://sonnh.olhub.com',
        created: 1456213386087
      },
    ]);
    */

    var deferred = $q.defer();
    $http({
      url: config.api + 'feedbacks/',
      method: 'GET',
      params: { id: surveyId },
      responseType: 'json'
    }).then(function(res) {
      var feedbacks = [];
      var data = res.data;
      for(var i in data) {
        feedbacks.push(data[i]);
      }
      deferred.resolve(feedbacks);
    }, function(err) {
      deferred.reject(err);
      //self.surveys = [];
      //deferred.resolve(self.surveys);
    });

    return deferred.promise;
  };
})

+App.service('Surveys', function($q, config, $http, config) {
  var self = this;

  
  /*
  this.surveys = [
    {
      id: 1234,
      slug: 'survey-1',
      name: 'Ask a question',
      question: 'How to do this application?',
      created: 1455880749910,
      options: [
        {
          title: 'Bad',
          slug: 'bad',
        },
        {
          title: 'Normal',
          slug: 'normal',
        },
        {
          title: 'Good',
          slug: 'good',
        }
      ]
    },
    {
      id: 1334,
      slug: 'survey-2',
      name: 'Ask a another question',
      question: 'How to do with another questions?',
      created: 1455880149910,
      options: [
        {
          title: 'Bad',
          slug: 'bad',
        },
        {
          title: 'Normal',
          slug: 'normal',
        },
        {
          title: 'Good',
          slug: 'good',
        }
      ]
    },
  ];
  */
  

  this.getAll = function(force) {

    if ((this.surveys!=undefined) && (force != true)) {
      return $q.when(this.surveys);
    }

    var deferred = $q.defer();
    $http({
      url: config.api + 'surveys/',
      method: 'GET',
      responseType: 'json'
    }).then(function(res) {
      self.surveys = [];
      var data = res.data;
      for(var i in data) {
        self.surveys.push(data[i]);
      }
      deferred.resolve(self.surveys);
    }, function(err) {
      deferred.reject(err);
     // self.surveys = [];
     // deferred.resolve(self.surveys);
    });

    return deferred.promise;
  }


  this.create = function(survey) {
    survey.option = JSON.stringify(survey.options);
    return $http({
      url: config.api + 'surveys/',
      method: 'POST',
      data: $.param(survey),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).then(function(data) {
      self.getAll(true);
      return data;
    });
  }

  this.update = function(survey) {
    return $http({
      url: config.jsonDb +survey.id,
      method: 'POST',
      data: $.param({json: JSON.stringify(survey)}),
      headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).then(function(data) {
      self.getAll(true);
      return data;
    });
  }

  this.get = function(id) {
    var deferred = $q.defer();
    $http.get(config.jsonDb + id).then(function(res) {
      deferred.resolve(res.data);
    }, function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }


  this.getOptionLink = function(website, app, option) {
    //var link = $scope.website + $scope.kApp + option.slug + '&@{login}';
    var link = website + app + option.slug;
    var img = '<img src="'+option.emoji+'" width="40" height="40" alt="'+option.title+'" />';
    var html = '<a href="'+link+'">'+img+'</a>'
    return html;
  }

  this.getEmailTemplate = function(website, app, survey) {
    var spacing = 20;
    var width = 40;
    var len = survey.options.length;
    var w = len*width + (len-1) * spacing;

    var template = '<table width="'+w+'" border="0" cellspacing="'+spacing+'" cellpadding="0" bgcolor="#fff"><tr>';

    for(var i in survey.options) {
      template+= '<td align="center" >'+ this.getOptionLink(website, app, survey.options[i])+'</td>';
    }
    template+= '</tr></table>';
    return template;
  }

})

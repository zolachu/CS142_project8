'use strict';

var cs142App = angular.module('cs142App',['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/users', {
                templateUrl: 'components/user-list/user-listTemplate.html',
                controller: 'UserListController'
            }).
            when('/users/:userId', {
                templateUrl: 'components/user-detail/user-detailTemplate.html',
                controller: 'UserDetailController'
            }).
            when('/photos/:userId', {
                templateUrl: 'components/user-photos/user-photosTemplate.html',
                controller: 'UserPhotosController'
            }).
            when('/comments/:userId', {
                templateUrl: 'components/user-comments/user-commentsTemplate.html',
                controller: 'UserCommentsController'
            }).
            when('/login-register', {
                templateUrl: 'components/login-register/login-registerTemplate.html',
                controller: 'login-registerController'
            }).
            otherwise({
                redirectTo: '/users'
            });
    }]);

cs142App.controller('MainController', ['$rootScope', '$scope' , '$http', '$resource','$location',
  function ($rootScope, $scope, $http, $resource, $location) {
        $rootScope.loggedIn = false;

        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
           if (!$rootScope.loggedIn) {
             if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                 $location.path("/login-register");
             }
           } else {
             if(next.templateUrl === "components/login-register/login-registerTemplate.html"){
                $location.path("/users/" + $rootScope.user._id);
             }
           }
        });
        $scope.main = {};
        $scope.main.title = 'Users';
        $scope.main.appName = 'ZB';
        $scope.main.name = 'here';
        $scope.main.myName = 'Zolboo Chuluunbaatar';
        $scope.main.search = '';
        $scope.main.text = 'hello';
        $scope.users = 'Users';
        $scope.main.nameShown = '';
        $scope.checkbox='';
        $scope.main.login = 'Please Login';
        var User = $resource('/test/:param', {param: '@id'});
        User.get({param: 'info'}).$promise.then(function(param) {
        $scope.main.verInfo = param.version;
        });
        User.get({param: 'counts'}).$promise.then(function(param) {
                console.log(param.user);
                console.log(param.photo);
                console.log(param.schemaInfo);
       });


       $rootScope.logout = function() {
          var resource = $resource('/admin/logout');
          resource.get({}, function() {
//              $scope.loggedIn = false;
              $rootScope.loggedIn = false;
              $location.path("/login-register");
          });
      }

      $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        if (!$rootScope.loggedIn) {
        // no logged user, redirect to /login-register unless already there
            if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                $location.path("/login-register");
            }
        }
        if ($rootScope.loggedIn) {
            if (next.templateUrl === "components/login-register/login-registerTemplate.html") {
                $location.path("/users/" + $rootScope.user._id);
            }
        }
      });

      var selectedPhotoFile = '';   // Holds the last file selected by the user

    // Called on file selection - we simply save a reference to the file in selectedPhotoFile
    $scope.inputFileNameChanged = function (element) {
        selectedPhotoFile = element.files[0];
    };

    // Has the user selected a file?
    $scope.inputFileNameSelected = function () {
        return !!selectedPhotoFile;
    };

    // Upload the photo file selected by the user using a post request to the URL /photos/new
    $rootScope.uploadPhoto = function () {
        if (!$scope.inputFileNameSelected()) {
            console.error("uploadPhoto called will no selected file");
            return;
        }
        console.log('fileSubmitted', selectedPhotoFile);

        // Create a DOM form and add the file to it under the name uploadedphoto
        var domForm = new FormData();
        domForm.append('uploadedphoto', selectedPhotoFile);

        // Using $http to POST the form
        $http.post('/photos/new', domForm, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        }).then(function successCallback(response){
            // The photo was successfully uploaded. XXX - Do whatever you want on success.
            alert("uploaded");
            console.log($rootScope.user);
            $location.path("/photos/" + $rootScope.user._id);

        }, function errorCallback(response){
            // Couldn't upload the photo. XXX  - Do whatever you want on failure.
            console.error('ERROR uploading photo', response);
            alert("couldn;t upload");
        });

    };

}]);



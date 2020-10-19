'use strict';

cs142App.controller('login-registerController', ['$rootScope', '$scope', '$routeParams', '$resource', '$location',
  function($rootScope, $scope, $routeParams, $resource, $location) {

    $scope.lg = {};
    $scope.lg.login = function() {
      var resource = $resource('/admin/login');
      console.log($scope.login_name);
      console.log($scope.password);
      resource.save({login_name: $scope.login_name, password: $scope.password}, function(info) {
        console.log(info);
        if(info._id === undefined) {
          $scope.lg.login_error = "Login Error";
        } else {
          console.log(info._id, "id");
          $rootScope.user = info;
          $location.path('/users/' + info._id);
          $rootScope.loggedIn = true;
        }
      }, function(err) {
          console.log(err);
          alert("user name or password is incorrect!");
      });
    }

    $scope.lg.register = function() {
      var resource = $resource('/user');
        console.log($scope.lg.register_password);
      resource.save({
       login_name: $scope.register_login_name,
       password: $scope.register_password,
       first_name: $scope.first_name,
       last_name: $scope.last_name,
       occupation: $scope.occupation,
       description: $scope.description,
       location: $scope.location
      }, function(info) {
        $rootScope.user = info;
          if(info._id === undefined) {
            $scope.lg.register_error = "register error";
          } else {
            console.log(info);
            $rootScope.user = info;
            $location.path('/users/' + info._id);
            $rootScope.loggedIn = true;
          }
        }, function(err) {
            console.log(err);
            alert("user name or password is incorrect!");
    });
    }
  }]);


'use strict';

cs142App.controller('recent-popularController', ['$rootScope', '$scope', '$routeParams', '$resource', '$location', '$http',
  function($rootScope, $scope, $routeParams, $resource, $location, $http) {
    var userId = $routeParams.userId;
    console.log(userId);

    console.log($rootScope.chosenPhoto);


}]);





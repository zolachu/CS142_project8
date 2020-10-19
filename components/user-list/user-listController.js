'use strict';

cs142App.controller('UserListController', ['$rootScope', '$scope','$resource', '$location',
    function ($rootScope, $scope, $resource, $location) {
        var users = $resource('/user/list');
        $scope.list = {};
        $scope.list.users = users.query();
}]);

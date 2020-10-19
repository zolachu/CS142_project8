'use strict';

cs142App.controller('UserCommentsController', ['$rootScope', '$scope', '$routeParams', '$resource', '$location',
  function($rootScope, $scope, $routeParams, $resource, $location) {
    /*
     * Since the route is specified as '/comments/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    $scope.comments = {};

    var User = $resource('/user/:userId', {userId: '@id'});
    User.get({userId: userId}).$promise.then(function(user) {
        $scope.main.nameShown = "Comments of " + user.first_name;
        $scope.comments.user_name = user.first_name + ' ' + user.last_name;
    });

    var Comments = $resource('/commentsOfUser/:userId', {userId: '@id'});
    Comments.query({userId: userId}).$promise.then(function(info) {
        console.log("comments");
        $scope.comments.commentList = info;
        console.log(info.length);
    });
}]);

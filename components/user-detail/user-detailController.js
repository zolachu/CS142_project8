'use strict';

cs142App.controller('UserDetailController', ['$rootScope', '$scope','$routeParams','$resource', '$location',
  function ($rootScope, $scope, $routeParams, $resource, $location) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    var User = $resource('/user/:userId', {userId: '@id'});
        User.get({userId: userId}).$promise.then(function(user) {
            $scope.detail = user;
            $scope.main.nameShown = user.first_name + ' ' + user.last_name;
        });

    $scope.photos = {};
    $scope.photos.popularComment = '';
    $scope.photos.maxLength = 0;
    var Photos = $resource('/photosOfUser/:userId', {userId: '@id'});
    Photos.query({userId: userId}).$promise.then(function(info) {
        $scope.photos.photoList = info;
        if (info.length === 0) {
            $rootScope.noPhotos = true;
        } else {
            $rootScope.noPhotos = false;
            var recentPhoto = info[info.length - 1];
            $scope.photos.photo = recentPhoto;
            var date = new Date(recentPhoto.date_time);
            $scope.photos.date_time = date.getFullYear()+'-' + (date.getMonth()+1) + '-'+date.getDate();
            $scope.photos.commentList = recentPhoto.comments;

            console.log(info.length);
            console.log(info[length - 1]);
            for (var i = 0; i < info.length; i++) {
                if ($scope.photos.maxLength <= info[i].comments.length) {
                    $scope.photos.popularPhoto = info[i];
                    $scope.photos.maxLength = info[i].comments.length;
                }
            }

        }
    });


    $scope.choose= function(photo)  {
        $rootScope.chosenPhoto = photo;
    }


    $scope.delete = function() {
      var resource = $resource("/delete/"+userId);
      resource.save(function() {
        $rootScope.user = null;
        $rootScope.loggedIn = false;
        $location.path("/login-register");
      });
    }

     $scope.userMatch = function() {
        if($rootScope.user._id === userId) {
            return true;
        }
        return false;
    }
}]);







'use strict';

cs142App.controller('UserPhotosController', ['$rootScope', '$scope', '$routeParams', '$resource', '$location', '$http',
  function($rootScope, $scope, $routeParams, $resource, $location, $http) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    $scope.photos = {};
    var User = $resource('/user/:userId', {userId: '@id'});
    User.get({userId: userId}).$promise.then(function(user) {
        $scope.main.nameShown = "Photos of " + user.first_name;
    });

    $rootScope.addComment = function(photo) {
        var resource = $resource('/commentsOfPhoto/' + photo._id, {
            get: {
                cache: true, // set as true, the result will be cached
                method: 'GET'
            },
            update: { // we want the resource to be refreshed after update
                method: 'POST',
                params: {
                    uncache: true // attach a 'uncache' flag to the request body
                }
            }
        });
        resource.save({comment : $scope.photos.text}, function(){
            $rootScope.$broadcast('commented');
            $location.path("/users/" + photo.user_id);
        });
        $location.path('/photos/' + photo.user_id);
    }

    $scope.photos.like = function(photo) {
      var resource = $resource('/likesOfPhoto/' + photo._id);
        resource.save({user_id: $rootScope.user._id}, function(){
            $rootScope.$broadcast('liked');
            $location.path('/photos/' + photo.user_id);
        });
        var e = document.getElementById(photo._id);
        var el = document.getElementById("like" + photo._id);
        var resource = $resource('/likesOfPhoto/' +  photo._id);
        resource.get().$promise.then(function(user) {
            e.innerHTML = "likes: " + user.likes.length;
        });
        var resource = $resource('/likesOfPhoto/' +  photo._id);
        var found = false;
        resource.get().$promise.then(function(user) {
            for (var i = 0; i < user.likes.length; i++) {
                if (user.likes[i].user_id == $rootScope.user._id) {
                    el.innerHTML = "UNLIKE";
                    found = true;
                    break;
                }
            }
        });
        if (!found) {
              el.innerHTML = "LIKE";
        }
    }


    $scope.photos.userMatch = function(id) {
        if($rootScope.user._id === id) {
            return true;
        }
        return false;
    }

     $scope.deletePhoto = function(photo) {
        var resource = $resource('/deletePhoto/' + photo._id);
        resource.save({}, function() {
            $location.path("/users/" + photo.user_id);
        });
    };


     $scope.deleteComment = function(photo, comment) {
        var resource = $resource('/deleteComment/' + photo._id);
        resource.save({comment: comment}, function() {
            $location.path("/users/" + photo.user_id);
        });
    };


    var Photos = $resource('/photosOfUser/:userId', {userId: '@id'});
    Photos.query({userId: userId}).$promise.then(function(user) {
        $scope.photos.permissionList = [];
        $scope.photos.photoList = user;
        for (var i = 0; i < user.length; i++) {
            if (user[i].permission.indexOf($rootScope.user._id) !== -1){
                $scope.photos.photoList.splice(i, 1);
            }
        }

        $scope.photos.clicked = 0;
        $scope.photos.next = $scope.photos.photoList.length - 1;
        $scope.photos.photo = $scope.photos.photoList[0];
        $scope.photos.clickedNext = function() {
            if ($scope.photos.clicked < $scope.photos.next) {
                $scope.photos.clicked++;
            }
            $scope.photos.photo = $scope.photos.photoList[$scope.photos.clicked];
        };
        $scope.photos.clickedPrev = function() {
            if ($scope.photos.clicked > 0) {
                $scope.photos.clicked--;
            } else {
                $scope.photos.end = 'End of Photos';
            }
            $scope.photos.photo = $scope.photos.photoList[$scope.photos.clicked];
        };
    });

    $scope.choose= function(photo)  {
        $rootScope.chosenPhoto = photo;
    }
}]);

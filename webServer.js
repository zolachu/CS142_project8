"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');

var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

var fs = require("fs");

mongoose.connect('mongodb://localhost/cs142project6');
app.use(express.static(__dirname));

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }
            // We got the object - return it in JSON format.
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));
            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
    } else {
        User.find({}, { _id: 1, first_name: 1, last_name: 1}, function(err, info) {
            if (err) {
                response.status(400).send('Not found');
                return;
            }
            var users = JSON.parse(JSON.stringify(info));
            response.status(200).send(users);
        });
    }
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
    } else {
        var id = request.params.id;
        var query = {"_id" : id};
        User.find(query, { __v: 0}, function(err, info) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            if (info === null) {
                response.status(400).send('Not found');
                return;
            }
            var user = JSON.parse(JSON.stringify(info[0]));
            response.status(200).send(user);
        });
    }
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 *   _id, user_id, comments, file_name, date_time
 */
app.get('/photosOfUser/:id', function (request, response) {
     if(!request.session) {
        response.status(401).send("User Error");
    } else {
        var id = request.params.id;
        Photo.
        find({'user_id' : id}).
        select({_id: 1, user_id: 1, comments: 1, file_name: 1, date_time: 1, likes: 1, permission : 1}).
        exec(function(err, info) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            var photos = JSON.parse(JSON.stringify(info));
            if (!photos) {
                response.status(400).send(photos);
                return;
            }
            async.each(photos, function (photo, callback1) {
                async.each(photo.comments, function (comment, callback2) {
                    var comQuery = {_id : comment.user_id};
                    User.findOne(comQuery, '_id first_name last_name', function(err, user) {
                        if (err) {
                            callback2(err);
                            return;
                        }
                        if (!user || user.length === 0) {
                                response.status(400).send('User with _id:' + id + ' not found');
                                return;
                        }
                        comment.user = user;
                        delete comment.user_id;
                        callback2(err);
                    });
                }, function (err) {
                    callback1(err);
                });
            }, function (err) {
                if (err) {
                    response.status(400).send(JSON.stringify(err));
                } else {
                    response.status(200).send(photos);
                }
            });
        });
    }
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 *   _id, user_id, comments, file_name, date_time
 */
app.get('/commentsOfUser/:id', function (request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
    } else {
        var id = request.params.id;
        var user;
        var query = {"_id" : id};
        User.find(query, function(err, info) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            if (info === null) {
                response.status(400).send('Not found');
                return;
            }
            user = info[0];
        });


        console.log('comments of user _id= ', id);
        var comments = [];
        Photo.
        find({}).
        select({_id: 1, user_id: 1, comments: 1, file_name: 1, date_time: 1}).
        exec(function(err, info) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            var photos = JSON.parse(JSON.stringify(info));
            if (photos.length === 0) {
                response.status(400).send('Not found');
                return;
            }
            async.each(photos, function (photo, callback1) {
                async.each(photo.comments, function (comment, callback2) {
                    if (err) {
                        callback2(err);
                        return;
                    }
                    if (comment.length === 0) {
                        response.status(400).send('Not found');
                        return;
                    }
                    if (comment.user_id === id) {
                        comments.push(comment);
                    }
                    callback2(err);
                }, function (err) {
                    callback1(err);
                });
            }, function (err) {
                if (err) {
                    response.status(400).send(JSON.stringify(err));
                } else {
                    response.status(200).send(comments);
                }
            });
        });
    }
});

/*
 * URL /admin/login
 */
app.post('/admin/login', function (request, response) {
    var login_name = request.body.login_name;
    var password = request.body.password;
    var query = {login_name: login_name};
    User.findOne(query, function(err, user) {
        if(err) {
             response.status(400).send(JSON.stringify(err));
             return;
        }
        if(!user || !password || password !== user.password) {
            response.status(400).send("Incorrect Password or User Name");
        } else {
            request.session.user = user;
            console.log(user);
            response.status(200).send(user);
        }
    });
});


/*
 * URL logout
 */
app.get('/admin/logout', function(request, response) {
    if (!request.session) {
        request.status(400).send("User Error");
        return;
    }
    request.session.destroy(function(err) {
        if(err) {
            response.status(401).send(JSON.stringify(err));
            return;
        }
        response.status(200).send();
        return;
    });
})

app.post('/commentsOfPhoto/:photo_id', function(request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
    } else {
        if (!request.body.comment) {
            response.status(400).send("bad request");
            return;
        }
        var photo_id = request.params.photo_id;
        var query = {_id: photo_id};
        Photo.findOne(query, function (err, photo) {
            if (err) {
                response.status(401).send(JSON.stringify(err));
                return;
            }
            console.log(photo);
            var timestamp = new Date().valueOf();
            var comments = photo.comments;
            comments.push({date_time: timestamp, user_id: request.session.user._id, comment: request.body.comment});
            photo.comments = comments;
            photo.save();
            response.status(200).send();

        });
    }
})

app.post('/photos/new', function(request,response) {
    console.log("here");
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send("File Upload Error");
            return;
        }
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            if(err) {
                console.log("err");
                response.status(401).send(JSON.stringify(err));
                return;
            }
            var query = {file_name: filename, user_id: request.session.user._id, comments: [], likes: [], permission: [] ,date_time: timestamp};
            Photo.create(query, function(err, photo) {
                if (err) {
                    response.status(400).send("New Photo Error");
                    return;
                }
                photo.save();
                response.status(200).send();
            })
        });
    });
})

/*
 * URL register
 */
app.post('/user', function (request, response) {
    var query = {
            login_name: request.body.login_name,
            password: request.body.password,
            first_name: request.body.first_name,
            last_name: request.body.last_name,
            location: request.body.location,
            description: request.body.description,
            occupation: request.body.occupation,
        }
    User.create(query, function(err, user) {
        if(err) {
                response.status(401).send(JSON.stringify(err));
                return;
            }

        request.session.user = user;
        request.session.user._id = user._id;
        user.save();
        response.status(200).send(user);
    });
});


/* new likes
*/
app.post('/likesOfPhoto/:photo_id', function(request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
    } else {
        var photo_id = request.params.photo_id;
        var query = {_id: photo_id};
        Photo.findOne(query, function (err, photo) {
            if (err) {
                response.status(401).send(JSON.stringify(err));
                return;
            }
            var timestamp = new Date().valueOf();
            var likes = photo.likes;
            var alreadyLiked = false;
            for(var i = 0; i < likes.length; i++) {
                if (likes[i].user_id == request.session.user._id) {
                    alreadyLiked = true;
                    likes.splice(i, 1);
                    photo.likes = likes;
                    photo.save();
                    break;
                }
            }
            if (!alreadyLiked) {
                likes.push({date_time: timestamp, user_id: request.session.user._id});
                photo.likes = likes;
                photo.save();
            }
            response.status(200).send(photo);
        });
    }
})


/* new likes
*/
app.get('/likesOfPhoto/:photo_id', function(request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
    } else {
        var photo_id = request.params.photo_id;
        var query = {_id: photo_id};
        Photo.findOne(query, function (err, photo) {
            if (err) {
                response.status(401).send(JSON.stringify(err));
                return;
            }
            response.status(200).send(photo);
        });
    }
})


app.post('/deletePhoto/:photo_id', function(request, response) {
    console.log("here");
    if(!request.session) {
        response.status(401).send("User error");
        return;
    }

    var photo_id = request.params.photo_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if(err) {
            response.status(401).send(JSON.stringify(err));
            return;
        }

        if (photo === null) {
            response.status(401).send("photo error");
            return;
        }

        if(photo.user_id == request.session.user._id) {
            Photo.remove({_id: photo_id}, function(err) {
                if(err){
                    response.status(401).send("Error");
                    return;
                }

                response.status(200).send();
            });
        } else {
            response.status(401).send("error");
        }
    });

});


app.post('/deleteComment/:photo_id', function(request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
        return;
    }
    var photo_id = request.params.photo_id;
    var comment = request.body.comment;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if(err) {
           response.status(401).send(JSON.stringify(err));
            return;
        }

        if (photo === null) {
            response.status(401).send("Photo error");
            return;
        }

        if(comment.user._id == request.session.user._id) {
            var comments = photo.comments;
            comments = comments.filter(function(info) {
                if(info._id != comment._id) {
                    return true;
                }
                return false;
            });
            photo.comments = comments;
            photo.save();
            response.status(200).send();
        } else {
            response.status(401).send("error");
        }
    });

});


app.post("/delete/:id", function(request, response) {
    if(!request.session) {
        response.status(401).send("User Error");
        return;
    }
    if(request.session.user._id !== request.params.id) {
        response.status(401).send("error");
        return;
    }

    Photo.remove({user_id: request.params.id}, function(err) {
        if(err) {
            response.status(401).send(JSON.stringify(err));
            return;
        }
    });
    Photo.find({}, function (err, photos) {
          if (err) {
            response.status(401).send(JSON.stringify(err));
            return;
          }
          for(var i = 0; i < photos.length; i++) {
            photos[i].comments = photos[i].comments.filter(function(info) {
                if(info.user_id == request.params.id) {
                    return false;
                }
                return true;
            });
            photos[i].save();
          }
    });

    User.remove({_id: request.params.id}, function(err) {
        if(err) {
            response.status(401).send(JSON.stringify(err));
            return;
        }
        request.session.destroy(function(err1) {
            if(err1) {
                response.status(401).send(JSON.stringify(err1));
                return;
            }
            response.status(200).send();
        });
    });


});

/*------------------------------------------------------------------*/

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


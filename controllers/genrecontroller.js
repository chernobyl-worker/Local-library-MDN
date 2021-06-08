var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const {body,validationResult} = require('express-validator');

exports.genre_list = function(req, res) {
    Genre.find().sort([['name','ascending']])
    .exec(function(err, genre_list) {
        if(err) return next(err);

        res.render('genre_list', {title: 'Genre List', genre_list: genre_list});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    res.render('genre_form', { title: 'Create Genre' });
  };

// Handle Genre create on POST.
exports.genre_create_post =  [

    // Validate and santize the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (er) {
                 if (er) { return next(er); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

exports.genre_delete_get = function(req, res, next) {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      book: function(callback) {
        Book.find({'genre': req.params.id}).exec(callback);
      }
    }, function(err, result) {
      if(err) {return next(err)}
      if(result.genre == null) {
        let er = new Error('Genre not found');
        er.status = 404;
        return next(er);
      }

      res.render('genre_delete', {title: "Genre Delete", genre: result.genre, genre_books: result.book});
    });
};

exports.genre_delete_post = function(req, res, next) {
    async.parallel({
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      book: function(callback) {
        Book.find({'genre': req.params.id}).exec(callback);
      }
    }, function(err, result) {
      if(err) {return next(err)}
      if(result.book.length > 0)
        res.render('genre_delete', {title: "Genre Delete", genre: result.genre, genre_books: result.book});
      else
        Genre.findByIdAndDelete(req.params.id, function(er) {
          if(er) {return next(er)}
          res.redirect('/catalog/genre')
        })
    });
};

exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id).exec(function(err,result) {
      if(err) {return next(err)}
      if(result == null) {
        err = new Error('Genre not found');
        err.status = 404;
        return next(err);
      }
      res.render('genre_form', {title: 'Genre update', genre: result});
    });
};

exports.genre_update_post = [
  body('name', "Genre name must contain at least 3 characters").trim().isLength({ min:3 }).escape(),

  (req,res,next) => {
    const error = validationResult();

    var genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    });

    if(!error.isEmpty()) {
      res.render('genre_form', {title: 'Genre update', genre: result, errors: errors.array()});
    } else {
      Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
        if (err) { return next(err); }
           res.redirect(thegenre.url);
        });
    }
  }
]

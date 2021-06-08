var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { body,validationResult } = require('express-validator');
var async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
      });
  
  };

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance:  bookinstance});
    });

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });

};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate and sanitise fields.
    body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601().toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id).
    populate('book').exec(
        function(err, result) {
            if(err) {return next(err)}
            if(result == null) {
                err = new Error("BookInstance not found !");
                err.status = 404;
                return next(err);
            }

            res.render('bookinstance_delete', {title: "Delete Book Instance", bookinstance: result});
        }
    );
}

exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndDelete(req.params.id, function(err) {
        if(err) {return next(err)}

        res.redirect('/catalog/bookinstances');
    });
};

exports.bookinstance_update_get = function(req, res, next) {
   async.parallel({
       book: function(callback) {
           Book.find(callback);
       },
       bookinstance: function(callback) {
           BookInstance.findById(req.params.id).populate('book').exec(callback);
       }
   }, function(err, result) {
       if(err) {return next(err);}
       if(result.bookinstance == null) {
           let er = new Error('BookInstance not found !')
           er.status = 404;
           return next(er);
       }
       res.render('bookinstance_form', {title: 'BookInstance Update', book_list: result.book, selected_book: result.bookinstance.book._id, bookinstance: result.bookinstance});
   });
};

exports.bookinstance_update_post = [
    body('book', "Book must be specified").trim().isLength({min: 1}).escape(),
    body('imprint', "Imprint must be specified").trim().isLength({min: 1}).escape(),
    body('status').escape(),
    body('due_back', "Invalid Date").optional({checkFalsy: true}).isISO8601().toDate(),
    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance({
            body: req.body.body,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        });

        if(!errors.isEmpty()) {
            Book.find({},'title')
            .exec(function (err, books) {
                if (err) { return next(err); }
                res.render('bookinstance_form', { title: 'Update BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
        } else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
                if (err) { return next(err); }
                   res.redirect(thebookinstance.url);
            });
        }
    }
]
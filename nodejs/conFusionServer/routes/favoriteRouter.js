const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('./cors');
const Favorites = require('../models/favorites');
var authenticate = require('../authenticate');
const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route('/')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .populate('dishes')
      .populate('user')
      .then(
        (favorites) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorites);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then(
      (favorite) => {
        if (favorite) {
          for (var i = 0; i < req.body.length; i++) {
            if (favorite.dishes.indexOf(req.body[i]._id < 0))
              favorite.dishes.push(req.body[i]._id);
          }

          favorite.save().then(
            (favorite) => {
              Favorites.findById(favorite._id)
                .populate('dishes')
                .populate('user')
                .then((favorite) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorite);
                });
            },
            (err) => {
              return next(err);
            }
          );
        } else {
          var favorite = new Favorites({
            user: req.user._id,
            dishes: req.body,
          });

          favorite.save().then((favorite) => {
            Favorites.findById(favorite._id)
              .populate('dishes')
              .populate('user')
              .then(
                (favorite) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorite);
                },
                (err) => {
                  return next(err);
                }
              );
          });
        }
      },
      (err) => {
        return next(err);
      }
    );
  })
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,

    (req, res, next) => {
      res.statusCode = 403;
      res.end('PUT operation not supported on /Favorites');
    }
  )
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({})
      .then(
        (resp) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

favoriteRouter
  .route('/:dishId')
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
      .then((favorites) => {
        if (!favorites) {
          res.statusCode = 200;
          setHeader('Content-type', 'application/json');
          return res.json({ exists: false, favorites: favorites });
        } else {
          if (favorites.dishes.indexOf(req.params.dishId) < 0) {
            res.statusCode = 200;
            setHeader('Content-type', 'application/json');
            return res.json({ exists: false, favorites: favorites });
          } else {
            res.statusCode = 200;
            setHeader('Content-type', 'application/json');
            return res.json({ exists: true, favorites: favorites });
          }
        }
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id }).then(
      (favorite) => {
        if (favorite) {
          if (
            !favorite.dishes.some((val) => {
              return val.equals(req.params.dishId);
            })
          ) {
            favorite.dishes.push(req.params.dishId);
          }

          favorite.save().then(
            (favorite) => {
              Favorites.findById(favorite._id)
                .populate('dishes')
                .populate('user')
                .then((favorite) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorite);
                });
            },
            (err) => {
              return next(err);
            }
          );
        } else {
          var favorite = new Favorites({
            user: req.user._id,
            dishes: [req.params.dishId],
          });

          favorite.save().then((favorite) => {
            Favorites.findById(favorite._id)
              .populate('dishes')
              .populate('user')
              .then(
                (favorite) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.json(favorite);
                },
                (err) => {
                  return next(err);
                }
              );
          });
        }
      },
      (err) => {
        return next(err);
      }
    );
  })
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,

    (req, res, next) => {
      res.statusCode = 403;
      res.end('PUT operation not supported on /Favorites/:dishId');
    }
  )
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({
      user: req.user._id,
    }).then((favorite) => {
      if (favorite != null) {
        var index = favorite.dishes.indexOf(req.params.dishId);
        if (index >= 0) {
          favorite.dishes.splice(index, 1);
          favorite
            .save()
            .then(
              (favorite) => {
                Favorites.findOne({
                  user: req.user._id,
                })
                  .populate('Dish')
                  .populate('User')
                  .then((favorite) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                  });
              },
              (err) => next(err)
            )
            .catch((err) => {
              return next(err);
            });
        }
      } else {
        err = new Error(
          'Specific dish ' + req.params.dishId + ' is not present'
        );
        err.status = 404;
        return next(err);
      }
    });
  });

module.exports = favoriteRouter;

'use strict';

const utils = require('../utils');

// Берем только пользователей у которых есть страница
// Офк, если будет другой api так уже не пойдет, но сейчас можно так
const users = require('../data/users')
  .filter((user) => user.page)
  .map((user) => {
    user.search = {};
    user.search.original = user.page;
    user.search.translite = utils.toTranslite(user.page);

    return user
  });

module.exports = function Api(app) {

  app.get('/api/users-by-page/:page', function (req, res) {
    let page = req.params.page.trim();

    if (!page) {
      res.send({ error: 'Поиск не должен быть пустым' });
      return;
    }

    page = utils.getAllVariations(page);

    const foundedUsers = users
      // Находим пользователей соответствующих условию
      .filter(function(user) {
        // Ищем по всем вариантам написания(с транскрипцией и неправильной раскладкой)
        return page.some(function(str) {
          return (
            user.search.original.indexOf(str) !== -1 ||
            user.search.translite.indexOf(str) !== -1
          );
        });
      })
      .map(function(user) {
        return String(user.id);
      });

    res.send(foundedUsers);
  });

  app.get('/api/*', function (req, res) {
    res.sendStatus(404);
  });

};

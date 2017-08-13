var requestsCache = {};

/**
 * Делает запрос на сервер
 *
 * @param {String} url - урл запроса
 * @param {Function} onSuccess - колбек при успешной операции
 * @param {Function} onError - колбек при ошибке
 */
function makeRequest(url, onSuccess, onError) {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', url);
  xhr.send();

  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) {
      return;
    }

    if (xhr.status === 200) {
      onSuccess(xhr.responseText);
    } else {
      onError({ error: 'Неполучилось достать данные' });
    }
  };
}

/**
 * Получает список id пользователей, имеющих соответсвующую короткую страницу
 *
 * @param {String} search - строка поиска
 * @param {Function} onSuccess - колбек при успешной операции
 * @param {Function} onError - колбек при ошибке
 */
function searchByPage(search, onSuccess, onError) {
  search = search.trim().toLowerCase();

  // Если поиск пустой, не надо ничего запрашивать
  if (!search) {
    return onSuccess([]);
  }

  // Пробуем достать из кэша
  if (requestsCache[search]) {
    return onSuccess(requestsCache[search]);
  }

  // Делаем запрос в апи
  makeRequest('/api/users-by-page/' + encodeURIComponent(search.trim()), function(data) {
    try {
      data = JSON.parse(data);
    } catch(e) {
      onError({ error: 'Проблема с данными' });
      return;
    }

    if (data.error) {
      onError(data);
      return;
    }

    // Запоминаем ответ для запроса
    requestsCache[search] = data;
    onSuccess(data);
  }, onError);
}

/**
 * Оборачивает ф-ию, которая будет делать единственные отложенный вызов через N сек
 * все вызовы в этот период будут обновлять таймер и параметры с которыми будет вызвана ф-ия
 *
 * @param {Function} func - функция, которую надо обернуть
 * @param {Number} time - время, через которое будет сделан реальный вызов
 * @param {Object} [context] - контекст, в котором будет сделан вызов
 * @return {Function} - ф-ия с отложенным вызовом
 */
function bounce(func, time, context) {
  var timer;

  return function() {
    var that = context || this;
    var args = arguments;

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(function() {
      func.apply(that, args);
      timer = null;
    }, time);
  };
}

module.exports.getAllVariations = require('../../utils').getAllVariations;
module.exports.fixKeyboardMistake = require('../../utils').fixKeyboardMistake;
module.exports.toTranslite = require('../../utils').toTranslite;
module.exports.searchByPage = searchByPage;
module.exports.bounce = bounce;

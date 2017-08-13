// Тут самые простые 1 to 1 преобразования
// В продакшене, конечно, надо делать более сложные, с множественными
// вариациями написания, возможными ошибками, регистром и всем этим

var enRu = require('./keyboard-miss');
var transliteEnRu = require('./translite');

// Подготавлияем наборы символов
var regEnRu = getLettersRegExp(enRu);
var regTransliteEnRu = getLettersRegExp(transliteEnRu);

var ruEn = flip(enRu);
var transliteRuEn = flip(transliteEnRu);
var regRuEn = getLettersRegExp(ruEn);
var regTransliteRuEn = getLettersRegExp(transliteRuEn);

/**
 * Меняет у объекта "ключи <-> значения" местами
 *
 * @param {Object} obj
 * @return {Object}
 */
function flip(obj) {
  return Object.keys(obj).reduce(function(flipperd, key) {
    flipperd[obj[key]] = key;

    return flipperd;
  }, {});
}

/**
 * Генерит regexp для набора символов, где выделяет их в группу
 *
 * @param {Object} letters
 * @return {RegExp}
 */
function getLettersRegExp(letters) {
  return new RegExp(
    '(' + Object.keys(letters).join('|') + ')',
    'g'
  );
}

/**
 * Определяет язык ввода по первой букве
 *
 * @param {String} str
 * @return {Boolean}
 */
function isEn(str) {
  return str.search(/[a-z]/) !== -1;
}

/**
 * Возвращает набор всех вариаций написания для строки
 *
 * @param {String} str
 * @return {String[]}
 */
function getAllVariations(str) {
  return [
    str,
    fixKeyboardMistake(str),
    toTranslite(str)
  ];
}

/**
 * Возвращает строку соответствующей другой раскладке для данной строки
 *
 * @param {String} str
 * @return {String}
 */
function fixKeyboardMistake(str) {
  return transformStr(str, {
    letters: enRu,
    reg: regEnRu,
  }, {
    letters: ruEn,
    reg: regRuEn,
  });
}

/**
 * Переводит строку в транслит или обратно в зависимости от языка
 *
 * @param {String} str
 * @return {String}
 */
function toTranslite(str) {
  return transformStr(str, {
    letters: transliteEnRu,
    reg: regTransliteEnRu,
  }, {
    letters: transliteRuEn,
    reg: regTransliteRuEn,
  });
}

/**
 * Заменяет символы в строке на соответствующие из переданного набора в зависимости от языка
 *
 * @param {String} str
 * @param {Object} en
 * @param {Object} ru
 * @return {String}
 */
function transformStr(str, en, ru) {
  var sets = isEn(str) ? en : ru;

  return str.replace(sets.reg, function(letter) {
    return sets.letters[letter] || letter;
  });
}

module.exports.getAllVariations = getAllVariations;
module.exports.fixKeyboardMistake = fixKeyboardMistake;
module.exports.toTranslite = toTranslite;

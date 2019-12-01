module.exports = function({
  express
}) {
  const router = express.Router();

  /**
   * Маршрут для отображения главной страницы веб-приложения
   * @name /
   * @category server
   * @description Маршрут для отображения главной страницы приложения Path: "/"
   * @function
   */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Информационная системы "Курсы валют"' });
  });

  return router;
};
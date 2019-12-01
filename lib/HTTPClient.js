module.exports = function({events, request, wlogger, iconv}) {
  const {once, EventEmitter} = events;


  /**
   * @class HTTPClient
   * @category server
   * @description HTTP клиент для получения данных с сервера ЦБРФ с задержкой
   */
  class HTTPClient {
    /**
     * Конструктор класса
     * @param {number} interval - минимальный интерал между запросами
     * @param {boolean} noQueue - направлять запросы посредством очереди с заданным интервалом
     */
    constructor(interval, noQueue = false) {
      this.requests = [];
      this.noQueue = noQueue;

      this.interval = setInterval(() => {
        (async () => {
          let req = this.requests.shift();
          if (req) {

            try {
              let response = await request(req.options);
              wlogger.log({
                level: 'info',
                message: `HTTP REQUEST ${new Date()} - ${JSON.stringify(req.options)}`
              });
              req.ee.emit(Symbol.for('event'), response);
            } catch(err) {
              if (err instanceof Error) {
                throw err;
              } else {
                throw new Error(err);
              }
            }
          }
        })();
      }, interval)
    }

    /**
     * Внутренний (приватный метод) для добавления нового запроса в очередь на отправку
     * @param {object} options - параметры запроса, см. пакет request
     * @returns {Promise<*>}
     * @private
     */
    async _queueRequest(options) {
      const ee = new EventEmitter();
      this.requests.push({
        options,
        ee
      });
      return once(ee, Symbol.for('event'));
    }

    /**
     * Метод для добавления в очередь отправки ( или отправки) запроса
     * @param {string} url - URL запрос
     * @param {number|null} timeout - Интервал направления запросов
     * @param {string|null} encoding - используемая кодировка
     * @returns {Promise<string|*>} - возвращает тело запроса
     */
    async httpRequest(url, timeout = 90000, encoding = 'windows-1251') {
      let options = {url, timeout, encoding: (encoding === 'windows-1251') ? null: encoding};

      try {
        let body = null;
        if (!this.noQueue) {
          let response = await this._queueRequest(options);
          body = response[0];

        } else {
          body = await request(options);
          wlogger.log({
            level: 'info',
            message: `HTTP REQUEST ${new Date()} - ${JSON.stringify(options)}`
          });
        }

        if (encoding === 'windows-1251') {
          return iconv.encode(iconv.decode(body, 'windows-1251'), 'utf-8').toString();
        } else {
          return body;
        }

      } catch (err) {
        if (err instanceof Error) {
          throw err;
        } else {
          throw new Error(err);
        }
      }
    }
  }

  return HTTPClient;
};
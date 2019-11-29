module.exports = function({events, request, wlogger, iconv}) {
  const {once, EventEmitter} = events;

  class HTTPClient {
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

    async _queueRequest(options) {
      const ee = new EventEmitter();
      this.requests.push({
        options,
        ee
      });
      return once(ee, Symbol.for('event'));
    }

    async httpRequest(url, timeout = 1500, encoding = 'windows-1251') {
      let options = {url, timeout, encoding: (encoding === 'windows-1251') ? null: encoding};

      try {
        let response = null;
        if (!this.noQueue) {
          response = await this._queueRequest(options);
        } else {
          response = await request(options);
        }

        let body = response[0];
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
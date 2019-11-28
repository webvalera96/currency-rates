module.exports = function(events, request, wlogger) {
  const {once, EventEmitter} = events;

  class Repeater {
    constructor(interval) {
      this.requests = [];

      this.interval = setInterval(() => {
        (async () => {
          let req = this.requests.shift();
          if (req) {
            let response = {
              body: null,
              err: null
            };
            try {
              response.body = await request(req.options);
            } catch(err) {
              response.err = err;
              wlogger.log({
                level: 'error',
                message: err.stack
              });
              req.ee.emit(Symbol.for('event'), err.response);
            }
            wlogger.log({
              level: 'info',
              message: `HTTP REQUEST ${new Date()} - ${JSON.stringify(req.options)}`
            });
            req.ee.emit(Symbol.for('event'), response);
          }
        })();
      }, interval)
    }

    async request(options) {
      const ee = new EventEmitter();
      this.requests.push({
        options,
        ee
      });
      return once(ee, Symbol.for('event'));
    }

    stop() {
      clearInterval(this.interval);
    }
  }

  return Repeater;
};


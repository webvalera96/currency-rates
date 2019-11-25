module.exports = function (moment, xml2js, models, httpGet) {
  const parseString = xml2js.parseString;

  return {
    // получить весь список валют с сайта ЦБ РФ
    getFcMarketLib: async function() {
      const requestUrl = 'http://www.cbr.ru/scripts/XML_valFull.asp';

      // получаем данные с сайта ЦБ РФ
      let xmlData = null;
      try {
        xmlData = await httpGet(requestUrl);
      } catch(e) {
        console.error(e);
      }


      return new Promise((resolve, reject) => {
        // преобразуем данные в формате XML в объект JavaScript
        parseString(xmlData, (err, data) => {
          if (!err) {
            let valutes = data.Valuta.Item;
            let valutesArray = [];

            valutes.forEach((valute) => {

              const valuteName = valute.Name["0"];
              const charCode = valute.ISO_Char_Code["0"];

              if (charCode !== '') {
                valutesArray.push([
                  valuteName,
                  charCode
                ]);
              }
            });

            let vData = {
              data: valutesArray
            };

            // преобразуем объект JavaScript в данные JSON
            resolve(JSON.stringify(vData));
          } else {
            // в случае, если произошла ошибка при преобразовании данных
            // возвращаем объект ошибки
            reject(err);
          }
        })
      })
    },
    // получает котировки на заданный день и сохраняет их (или обновляет) в хранилище
    // date: базовый объект JavaScrip [Date]
    getQuotesByDate : async function (date) {
      // форматируем строковое представление даты, в соответствие с требованиями сайта
      let formatedDate =  moment(date).format("DD/MM/YYYY");
      // формируем HTTP запрос для получения котировок на текущий день с сайта ЦБ РФ
      const requestURL = `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${formatedDate}`;
      // отправляем запрос
      let xmlData = null;
      try {
        xmlData = await httpGet(requestURL);
      } catch (e) {
        console.error(e);
      }


      // извлекаем из полученного ответа данные в формате XML (в кодировке UTF-8)
      return new Promise((resolve, reject) => {
        // преобразуем данные в формате XML в JavaScript объект
        parseString(xmlData, (err, data)=> {
          if (!err) {



            // выбираем данные, подлежащие хранению
            let valutes = data.ValCurs.Valute;
            let valutesArray = [];
            valutes.forEach( function(valute, i, index) {
              valutesArray.push(
                [
                  valute.NumCode["0"],
                  valute.CharCode["0"],
                  valute.Nominal["0"],
                  valute.Name["0"],
                  valute.Value["0"].replace(",", ".")
                ]
              );
            });
            let vData = {
              data: valutesArray
            };
            let savingData = JSON.stringify(vData);

            db.get(formatedDate, function(err, value) {
              // если запись в хранилище на указанную дату не найдена
              if (err) {
                // поместить в хранилище данные
                db.put(formatedDate, savingData, function(err) {
                  if (err){
                    reject(err);
                  } else {
                    resolve(true);
                  }
                }.bind(this));
              } else {
                resolve(true);
              }
            }.bind(this));
          } else {
            reject(err);
          }
        });
      });
    }
  }
};

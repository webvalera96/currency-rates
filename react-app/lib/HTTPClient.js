import axios from 'axios';

/**
 * Вспомогательный метод для формирования данных, для построения графика
 * @category client
 * @param {object} dataSet - Набор точек для построения графика
 * @param {string} currency - Наименование валюты
 * @returns {object}
 */
export function createChartData(dataSet, currency) {
  if (dataSet && dataSet.dates && dataSet.values && currency) {
    return {
      labels: dataSet.dates,
      datasets: [{
        label: currency,
        data: dataSet.values,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    }
  } else {
    return null;
  }
}

/**
 * Вспомогательный метод для формирования данных, для построения таблицы
 * @category client
 * @param {object} quotesData - Набор данных для таблицы
 * @returns {object}
 */
export function createTableData(quotesData) {
  return {
    "destroy": true,
    "autoWidth": false,
    data: quotesData,
    "language":  {
      "processing": "Подождите...",
      "search": "Поиск:",
      "lengthMenu": "Показать _MENU_ записей",
      "info": "Записи с _START_ до _END_ из _TOTAL_ записей",
      "infoEmpty": "Записи с 0 до 0 из 0 записей",
      "infoFiltered": "(отфильтровано из _MAX_ записей)",
      "infoPostFix": "",
      "loadingRecords": "Загрузка записей...",
      "zeroRecords": "Записи отсутствуют.",
      "emptyTable": "В таблице отсутствуют данные",
      "paginate": {
        "first": "Первая",
        "previous": "Предыдущая",
        "next": "Следующая",
        "last": "Последняя"
      },
      "aria": {
        "sortAscending": ": активировать для сортировки столбца по возрастанию",
        "sortDescending": ": активировать для сортировки столбца по убыванию"
      },
      "select": {
        "rows": {
          "_": "Выбрано записей: %d",
          "0": "Кликните по записи для выбора",
          "1": "Выбрана одна запись"
        }
      }
    },
    "columns": [
      {"type": "num"},
      {"type": "string"},
      {"type": "num"},
      {"type": "string"},
      {"type": "num"}
    ]
  }
}

/**
 * Клиент для взаимодейтсивя с сервером бэкэнда
 * @class HTTPClient
 * @category client
 */
class HTTPClient {
  /**
   * Создать экземпляр клиента
   */
  constructor() {
    this.dateFormat = "DD/MM/YYYY";
  }

  /**
   * Метод, запршаивающий данные с сервера бэкэнда для построения графика динамики изменения курса валюты
   * @param {moment} startDate - Начальная дата
   * @param {moment} endDate - Конечная дата
   * @param {string} currency - Валюта
   * @returns {Promise<AxiosResponse<T>>}
   */
  fetchChartDataSet(startDate, endDate, currency) {
    if (startDate && endDate && currency) {
      let formattedStartDate = startDate.format(this.dateFormat);
      let formattedEndDate = endDate.format(this.dateFormat);
      let query = `begin_date=${formattedStartDate}&end_date=${formattedEndDate}&char_code=${currency}`;

      return axios.get(`/db/chart/get/dataset?${query}`)
        .then(function(response) {
          let dataSet = response.data;
          return dataSet;
        }).catch(function(error) {
          alert('Потребуется больше времени для построения графика! Зайдите позже.')
          return error;
        })

    }
  }

  /**
   * Метод, запрашивающий данные с сервера бэкэнда, для отображения в таблице котировок валют на указанную дату
   * @param {moment} date - Дата, на которую запрашиваются котировки для валюты
   * @returns {Promise<unknown>}
   */
  fetchQuotesDataForDate(date) {
    if (date) {
      let formattedDate = date.format("DD/MM/YYYY");
      let query = `date_req=${formattedDate}`;

      return new Promise(function(resolve, reject) {
        axios.get(`/db/quotes?${query}`)
          .then(function(response) {
            let quotesData = response.data;
            resolve(quotesData);
          }.bind(this)).catch(function(error) {
          reject(error);
        });
      });
    }
  }
}

export default HTTPClient;
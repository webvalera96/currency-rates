import axios from 'axios';


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

class HTTPClient {

  constructor() {
    this.dateFormat = "DD/MM/YYYY";
  }

  fetchChartDataSet(startDate, endDate, currency) {
    if (startDate && endDate && currency) {
      let formatedStartDate = startDate.format(this.dateFormat);
      let formatedEndDate = endDate.format(this.dateFormat);
      let query = `begin_date=${formatedStartDate}&end_date=${formatedEndDate}&char_code=${currency}`;

      return axios.get(`/chart/get/dataset?${query}`)
        .then(function(response) {
          let dataSet = response.data;
          return dataSet;
        }).catch(function(error) {
          return error;
        })

    }
  }

  fetchQuotesDataForDate(date) {
    if (date) {
      let formatedDate = date.format("DD/MM/YYYY");
      let query = `date_req=${formatedDate}`;

      return axios.get(`/quotes?${query}`)
        .then(function(response) {
          let quotesData = response.data;
          return quotesData;
        }).catch(function(error) {
          return error;
        })

    }
  }
}

export default HTTPClient;
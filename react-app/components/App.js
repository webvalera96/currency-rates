import React, {Component} from 'react';
import $ from 'jquery';
import {
  Form, Row, Col,
  Table, Container, Button,
} from 'react-bootstrap';
import axios from 'axios';
import 'react-dates/initialize';
import {SingleDatePicker,DateRangePicker, isInclusivelyBeforeDay} from "react-dates";
import Chart from 'chart.js';

import moment from 'moment';
moment.locale('ru');

import 'datatables.net-bs4/js/dataTables.bootstrap4';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'datatables.net-bs4/css/dataTables.bootstrap4.css';
import 'react-dates/lib/css/_datepicker.css';
import '../styles/App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.clearDb = this.clearDb.bind(this);
  }

  clearDb(event) {
    event.preventDefault();
    axios.delete('/db')
      .then(function(response) {
        if (response.status === 200) {
          alert('Хранилище очищено. Страница будет перезагружена.');

        } else {
          alert('Ошибка при очистке хранилища. Страница будет перезагружена.');
        }
        document.location.reload();
      })
  }
  render() {
    return (
      <Container fluid={true}>
        <Row style={{
          borderBottom: "solid 2px",
          paddingBottom: "5px"
        }}>
          <Col>
            <div >

                <h1>Информационная система "Курсы валют"</h1>
                <div>
                  <small><em>Разработал</em>: Цыплаков Валерий Сергеевич (<a href="mailto:webvalera96@gmail.com">webvalera96@gmail.com</a>)</small>
                </div>
                <div>
                  <small><em>Репозиторий</em>: <a href="https://github.com/webvalera96/currency-rates">https://github.com/webvalera96/currency-rates</a></small>
                </div>

            </div>
          </Col>
        </Row>
        <Row >
          <Col style={{
            borderBottom: "solid 2px",
            paddingBottom: "5px"
          }}>
            <QuotesDataTables />
          </Col>
          <Col style={{
            borderBottom: "solid 2px",
            paddingBottom: "5px"
          }}>
            <CurrencyChart />
          </Col>
        </Row>
        <Row>
          <Button style={{
            margin:"5px 0 0 5px"
          }} variant="danger" onClick={this.clearDb}>Очистить хранилище</Button>
        </Row>

      </Container>

    )
  }
}

class QuotesDataTables extends Component {

  constructor(props) {
    super(props);
    this.state = {
      date: moment(new Date()),
      focused: false
    };
    this.dateChange = this.dateChange.bind(this);
    this.updateDataTable = this.updateDataTable.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  componentDidMount() {
    this.updateDataTable(this.state.date);
  }

  componentWillUnmount() {
    $('#quotes-table')
      .find('table')
      .DataTable()
      .destroy(true);
  }

  updateDataTable(date) {
    $('#quotes-table').DataTable({
      "AutoWidth": false,
      "destroy": true,
      "ajax": `/quotes?date_req=${date.format("DD/MM/YYYY")}`,
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
    });
  }

  dateChange(date) {
    this.setState({date});
    this.updateDataTable(date);
  }

  render() {
    return (
      <Container>
        <Row>
          <Col>
            <Form>
              <Form.Row>
                <Form.Group as={Col}>
                  <Form.Label>
                    Дата
                  </Form.Label>
                  <SingleDatePicker
                    date={this.state.date}
                    onDateChange={this.dateChange}
                    focused={this.state.focused}
                    onFocusChange={({ focused }) => this.setState({ focused })}
                    isOutsideRange={day => !isInclusivelyBeforeDay(day, moment())}
                    block={true}
                    small={true}
                    placeholder={"Дата"}
                    readOnly={true}
                  />
                </Form.Group>
              </Form.Row>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <Table id="quotes-table">
              <thead>
              <tr>
                <th>Код</th>
                <th>Cимвольный код</th>
                <th>Единиц</th>
                <th>Валюта</th>
                <th>Курс ЦБ РФ</th>
              </tr>
              </thead>
            </Table>
          </Col>
        </Row>
      </Container>
    )
  }
}

class CurrencyChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chart: null,
      fclist: null,

      currency: null,
      startDate: moment(new Date()).subtract(30, 'days'),
      endDate: moment(new Date()),
      focusedInput: null,
      jsonReport: ''
    };

    this.componentDidMount = this.componentDidMount.bind(this);
    this.currencySelectChange = this.currencySelectChange.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.plotChart = this.plotChart.bind(this);

  }

  componentDidMount() {
    const ctx = $('#currencyChart');

    axios.get('/fc/list')
      .then(function (response) {
        const fclist = response.data.data;
        this.setState({
          fclist: fclist.map(function(fc, index) {
            return <option id={index} value={`${fc[1]}`}>{`${fc[0]} (${fc[1]})`}</option>
          }),
          currency: fclist[0][1]
        });
        this.plotChart(this.state.startDate, this.state.endDate, fclist[0][1]);
      }.bind(this));

    this.setState({
      chart:  new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
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
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      })
    })
  }

  makeReport(dataSet, currency) {
    let report = {
      [currency] : []
    };

    for(let i = 0; i < dataSet.dates.length; i++) {
      report[currency].push({
        "date": dataSet.dates[i],
        "value": dataSet.values[i]
      });
    }
    return JSON.stringify(report, undefined, 2)
  }

  plotChart(startDate, endDate, currency) {
    if (startDate && endDate && currency) {
      axios.get(`/chart/get/dataset?begin_date=${startDate.format("DD/MM/YYYY")}&end_date=${endDate.format("DD/MM/YYYY")}&char_code=${currency}`)
        .then(function(response) {
          let dataSet = response.data;


          // обработаем полученные данные для построения графика
          dataSet.values = dataSet.values.map(function(value) {
            return Number.parseFloat(value);
          });

          for(let i = 0; i < dataSet.dates.length-1; i++) {
            for(let j = 0; j < dataSet.dates.length-i; j++)
            {
              if (moment(dataSet.dates[j+1], "DD/MM/YYYY").toDate() < moment(dataSet.dates[j], "DD/MM/YYYY").toDate()) {
                // меняем даты
                let temp = dataSet.dates[j+1];
                dataSet.dates[j+1] = dataSet.dates[j];
                dataSet.dates[j] = temp;

                // меняем данные
                temp = dataSet.values[j+1];
                dataSet.values[j+1] = dataSet.values[j];
                dataSet.values[j] = temp;
              }
            }
          }

          // сформируем отчет в формате JSON
          this.setState({
            jsonReport: this.makeReport(dataSet, currency)
          });

          // перестроим график, в соответствии с полученными данными
          this.state.chart.destroy();

          const ctx = document.getElementById('currencyChart');
          this.setState({
            chart:  new Chart(ctx, {
              type: 'line',
              data: {
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
              },
              options: {
                responsive: true,
                scales: {
                  yAxes: [{
                    ticks: {
                      beginAtZero: false
                    }
                  }]
                }
              }
            })
          });
        }.bind(this));
    } else {
      alert('Не заданы параметры построения графика!');
    }
  }

  updateChart(event) {
    event.preventDefault();
    const startDate = this.state.startDate;
    const endDate = this.state.endDate;
    const currency = this.state.currency;
    this.plotChart(startDate, endDate, currency);
  }

  currencySelectChange(event) {
    this.setState({
      currency: event.target.value
    });
  }

  render() {
    return (
      <React.Fragment>
        <Form>
          <Form.Row>
            <Form.Group as={Col}>
              <Form.Label>
                Валюта
              </Form.Label>
              <Form.Control id="currency" name="currency" as="select" onChange={this.currencySelectChange}>
                {this.state.fclist}
              </Form.Control>
            </Form.Group>

            <Form.Group as={Col}>
              <Form.Label>
                Период
              </Form.Label>
              <DateRangePicker
                startDate={this.state.startDate}
                startDateId="startDateId"
                endDate={this.state.endDate}
                endDateId="endDateId"
                onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })}
                focusedInput={this.state.focusedInput}
                onFocusChange={focusedInput => this.setState({ focusedInput })}
                block={true}
                small={true}
                startDatePlaceholderText="Нач. дата"
                endDatePlaceholderText="Кон. дата"
                isOutsideRange={day => !isInclusivelyBeforeDay(day, moment())}
              />

            </Form.Group>

          </Form.Row>
          <Form.Row>
            <Form.Group as={Col}>
              <Button type="primary" onClick={this.updateChart}>Построить график</Button>
            </Form.Group>
          </Form.Row>
        </Form>
        <Row>
          <Col md={6}>
            <canvas id="currencyChart" width="400px" height="400px"></canvas>
          </Col>
          <Col md={6}>
            <h2>Отчет в формате JSON</h2>
            <pre id="jsonReport">
              {this.state.jsonReport}
            </pre>
          </Col>
        </Row>
      </React.Fragment>
    )
  }
}

export default App;
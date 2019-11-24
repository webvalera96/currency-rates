import React, {Component} from 'react';
import $ from 'jquery';
import {
  Form, Row, Col,
  Table, Container, Button,
} from 'react-bootstrap';
import axios from 'axios';
import 'react-dates/initialize';
import {SingleDatePicker,DateRangePicker, isInclusivelyBeforeDay} from "react-dates";
import {Line} from 'react-chartjs-2';
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
    this.datesChange = this.datesChange.bind(this);

    this.state = {
      fclist: null,
      currency: null,
      startDate: moment(new Date()).subtract(30, 'days'),
      endDate: moment(new Date()),
      focusedInput: null,

      // данные для компонента CurrencyChartReport
      jsonReport: null,
      chartData: null
    };

    this.componentDidMount = this.componentDidMount.bind(this);
    this.datesChange = this.datesChange.bind(this);
    this.currencySelectChange = this.currencySelectChange.bind(this);
    this.updateChartReport = this.updateChartReport.bind(this);
    this.updateChart = this.updateChart.bind(this);
  }

  updateChart() {
    this.updateChartReport(this.state.startDate, this.state.endDate, this.state.currency);
  }

  updateChartReport(startDate, endDate, currency) {
    if (startDate && endDate && currency) {
      let query = `begin_date=${startDate.format("DD/MM/YYYY")}&end_date=${endDate.format("DD/MM/YYYY")}&char_code=${currency}`;

      // отобразим отчет в формате JSON (для просмотра)
      axios.get(`/report?${query}`)
        .then(function(response) {
          let reportJSON = JSON.stringify(response.data, undefined, 2);
          this.setState({
            jsonReport: reportJSON
          });
        }.bind(this));

      // получим данные для построения графика и построим график
      axios.get(`/chart/get/dataset?${query}`)
        .then(function(response) {
          let dataSet = response.data;
          this.setState({
            chartData: {
              labels: dataSet.dates,
              datasets: [{
                label: this.state.currency,
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
          });
        }.bind(this));
    }
  }

  componentDidMount() {
    axios.get('/fc/list')
      .then(function (response) {
        const fclist = response.data.data;
        this.setState({
          fclist: fclist.map(function(fc, index) {
            return <option id={index} value={`${fc[1]}`}>{`${fc[0]} (${fc[1]})`}</option>
          }),
          currency: fclist[0][1]
        });

        this.updateChartReport(this.state.startDate, this.state.endDate, fclist[0][1])
      }.bind(this));
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

  datesChange(dateRange) {
    const { startDate, endDate } = dateRange;
    this.setState({ startDate, endDate });
    this.updateChartReport(startDate, endDate, this.state.currency);
  }

  currencySelectChange(event) {
    this.setState({
      currency: event.target.value
    });
    this.updateChartReport(this.state.startDate, this.state.endDate, event.target.value);
  }


  render() {
    return (
      <Container fluid={true}>
        <Row>
          <Col>
            <div >

                <h1>Информационная система "Курсы валют"</h1>
                <div>
                  <small><em>Разработал</em>: Цыплаков Валерий Сергеевич (<a href="mailto:webvalera96@gmail.com">webvalera96@gmail.com</a>)</small>
                </div>
                <div>
                  <small><em>Репозиторий</em>: <a href="https://github.com/webvalera96/currency-rates">https://github.com/webvalera96/currency-rates</a></small>
                </div>
                <div>
                  <small><em>Agendash:</em>: <a href="/dash">Управление автоматической выгрузкой</a></small>
                </div>

            </div>
          </Col>
        </Row>
        <Row >
          <Col lg={6} xl={6} md={12} sm={12}  xs={12}>
            <QuotesDataTables onUpdateChart={this.updateChart}/>
          </Col>
          <Col lg={6} xl={6} md={12} sm={12}  xs={12}>
            <Row>
              <Col lg={6} xl={6} md={6} sm={12}  xs={12}>
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
                    <Form.Row>
                      <DateRangePicker
                        startDate={this.state.startDate}
                        startDateId="startDateId"
                        endDate={this.state.endDate}
                        endDateId="endDateId"
                        onDatesChange={this.datesChange}
                        focusedInput={this.state.focusedInput}
                        onFocusChange={focusedInput => this.setState({ focusedInput })}
                        block={false}
                        small={true}
                        startDatePlaceholderText="Нач. дата"
                        endDatePlaceholderText="Кон. дата"
                        isOutsideRange={day => !isInclusivelyBeforeDay(day, moment())}
                      />
                    </Form.Row>
                  </Form.Group>
                </Form.Row>
                <Row>
                {
                  this.state.chartData &&
                  <CurrencyChart
                    chartData={this.state.chartData}
                  />
                }
                </Row>
              </Col>
              <Col lg={6} xl={6} md={6} sm={12}  xs={12}>
                <Row>
                  <h3>Отчет в формате JSON</h3>
                </Row>
                <pre id="jsonReport">
                  {this.state.jsonReport}
                </pre>
                {
                  this.state.startDate && this.state.endDate &&
                  <a download="report.json" href={`/report?begin_date=${this.state.startDate.format("DD/MM/YYYY")}&end_date=${this.state.endDate.format("DD/MM/YYYY")}&char_code=${this.state.currency}`}>
                    Скачать отчет
                  </a>
                }
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>

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

    axios.get(`/quotes?date_req=${date.format("DD/MM/YYYY")}`)
      .then(function(response) {



        // добавить новую точку на график
        this.props.onUpdateChart();

        $('#quotes-table').DataTable({
          "destroy": true,
          "autoWidth": false,
          data: response.data.data,
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



      }.bind(this)).catch(function(err) {
        if (err.response.status === 404) {
          let table = $('#quotes-table').DataTable();
          table.clear().draw();
        }
      }.bind(this));


  }

  dateChange(date) {
    this.setState({date});
    this.updateDataTable(date);
  }

  render() {
    return (
      <Container fluid={true}>
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

    this.options = {
      responsive: true,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false
          }
        }]
      }
    }
  }

  render() {
    return (
      <Line
        data={this.props.chartData}
        options={
          {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: false
                }
              }]
            }
          }
        }/>
    )
  }
}

export default App;
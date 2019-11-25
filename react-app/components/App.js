import React, {Component} from 'react';
import 'jquery';
import {
  Form, Row, Col,
  Container, Button,
} from 'react-bootstrap';
import axios from 'axios';
import 'react-dates/initialize';
import {DateRangePicker, isInclusivelyBeforeDay} from 'react-dates';
import moment from 'moment';
import {connect} from 'react-redux';
import actions from '../redux/actions';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-dates/lib/css/_datepicker.css';
import 'datatables.net-bs4/css/dataTables.bootstrap4.css';
import '../styles/App.css';

import HTTPClient, {createChartData} from "../lib/HTTPClient";
let httpClient = new HTTPClient();

import CurrencyChart from "./CurrencyChart";
import QuotesDataTables from "./QuotesDataTables";

moment.locale('ru');

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
      focusedInput: null
    };

    this.componentDidMount = this.componentDidMount.bind(this);
    this.datesChange = this.datesChange.bind(this);
    this.currencySelectChange = this.currencySelectChange.bind(this);
    this.updateChart = this.updateChart.bind(this);
  }

  updateChart(startDate, endDate, currency) {
    httpClient.fetchChartDataSet(startDate, endDate, currency)
      .then(function(dataSet) {
        this.props.updateChart(createChartData(dataSet, currency));
      }.bind(this));
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


        this.updateChart(this.state.startDate, this.state.endDate, fclist[0][1])
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
    this.updateChart(startDate, endDate, this.state.currency);
  }

  currencySelectChange(event) {
    this.setState({
      currency: event.target.value
    });
    this.updateChart(this.state.startDate, this.state.endDate, event.target.value);
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
            <QuotesDataTables
              updateChart={this.props.updateChart}
            />
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
                  this.props.chartData &&
                  <CurrencyChart
                    chartData={this.props.chartData}
                    updateChart={this.props.updateChart}
                  />
                }
                </Row>
              </Col>
              <Col lg={6} xl={6} md={6} sm={12}  xs={12}>
                <Row>
                  <h3>Отчет в формате JSON</h3>
                </Row>
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

function mapStateToProps(state) {
  return {
    chartData: state.get('chartData')
  };
}

export default connect(mapStateToProps, actions)(App);
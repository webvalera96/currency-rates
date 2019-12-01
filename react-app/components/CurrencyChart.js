import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import PropTypes from 'prop-types';
import moment from "moment";
import HTTPClient ,{createChartData} from "../lib/HTTPClient";
import axios from "axios";
import {DateRangePicker, isInclusivelyBeforeDay} from "react-dates";
import {
  Form, Row, Col,
} from 'react-bootstrap';
import Loader from "./Loader";
import Button from "react-bootstrap/Button";
const httpClient = new HTTPClient();

/**
 * Класс React-компонента, для отображения графика и элементов управления
 * @class CurrencyChart
 * @category client
 */
class CurrencyChart extends Component {

  /**
   * Конструктор класса
   * @param {object} props.chartData - Данные для построения графика
   * @param {function} props.updateChart - Функция для обновления переменной-состояния данных для построения графика Redux
   * @param {moment} props.chartStartDate - Дата начала построения графика
   * @param {function} props.updateChartStartDate - Функция для обновления переменной-состояния даты начала построения графика Redux
   * @param {moment} props.chartEndDate - Дата конца построения графика
   * @param {function} props.updateChartEndDate - Функция для обновления переменной-состояния даты конца построения графика Redux
   * @param {string} props.chartCurrency - Строка наименования курса валют
   * @param {function} pros.updateChartCurrency - Функция для обновления переменной-состояния наименования курса валют Redux
   */
  constructor(props) {
    super(props);

    this.state = {
      fclist: null,
      focusedInput: null,
      loading: false,

      currency: null,
      startDate: moment(new Date()).subtract(30, 'days'),
      endDate: moment(new Date()),

    };

    this.updateChart = this.updateChart.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.plotChart = this.plotChart.bind(this);
    this.datesChange = this.datesChange.bind(this);
    this.currencySelectChange = this.currencySelectChange.bind(this);
  }

  /**
   * Встроенный метод жизненного цикла React
   */
  componentDidMount() {
    axios.get('/db/fc/list')
      .then(function (response) {
        const fclist = response.data;

        let firstCurrencyElement = fclist[0][1];

        this.props.updateChartCurrency(firstCurrencyElement);

        this.setState({
          fclist: fclist.map(function(fc, index) {
            return <option id={index} key={index} value={`${fc[1]}`}>{`${fc[0]} (${fc[1]})`}</option>
          })
        });

        this.updateChart(this.props.chartStartDate, this.state.endDate, firstCurrencyElement)
      }.bind(this));
  }

  /**
   * Метод, для обновления графика
   * @param {moment} startDate - Дата начала построения графика
   * @param {moment} endDate - Дата конца построения графика
   * @param {string} currency - Наименование валюты (код) для построения графика
   */
  updateChart(startDate, endDate, currency) {
    this.setState({
      loading: true
    });
    httpClient.fetchChartDataSet(startDate, endDate, currency)
      .then(function(dataSet) {
        this.props.updateChart(createChartData(dataSet, currency));
        this.setState({
          loading: false
        })
      }.bind(this)).catch(function(err) {
        this.setState({
          loading: false
        });
        alert('Загрузка данных потребует больше времени. Вернитесь к странице позже.');
      });
  }

  /**
   * Метод для отрисовки графика
   * @param event
   */
  plotChart(event) {
    event.preventDefault();
    let startDate = this.props.chartStartDate;
    let endDate = this.props.chartEndDate;
    if (startDate && startDate.isValid() && endDate && endDate.isValid() && this.props.chartCurrency)
      this.updateChart(startDate, endDate, this.props.chartCurrency);
  }

  /**
   * Метод для обновления состояния переменных startDate, endDate компонента react-dates
   * @param {{moment,moment}} dateRange - Период времени для построения графика
   */
  datesChange(dateRange) {
    const { startDate, endDate } = dateRange;
    this.props.updateChartStartDate(startDate);
    this.props.updateChartEndDate(endDate);
  }

  currencySelectChange(event) {
    let currency = event.target.value;
    this.props.updateChartCurrency(currency);
  }

  render() {
    return (
      <React.Fragment>
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
                startDate={this.props.chartStartDate}
                startDateId="startDateId"
                endDate={this.props.chartEndDate}
                endDateId="endDateId"
                onDatesChange={this.datesChange}
                focusedInput={this.state.focusedInput}
                onFocusChange={focusedInput => this.setState({ focusedInput })}
                block={false}
                small={true}
                startDatePlaceholderText="Нач. дата"
                endDatePlaceholderText="Кон. дата"

                isOutsideRange={day => !isInclusivelyBeforeDay(day, moment().add(1, 'day'))}
                minDate={moment('01/01/2010', 'DD/MM/YYYY')}
              />
              <Button style={{
                marginLeft: "20px"
              }} onClick={this.plotChart}>Построить график</Button>
            </Form.Row>
          </Form.Group>



        </Form.Row>
        <Row>
          <Col>
          {
            this.state.loading &&
              <Loader />
          }
          {
            this.props.chartData && !this.state.loading &&
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
          }
          </Col>
        </Row>
      </React.Fragment>
    )
  }
}

CurrencyChart.propTypes = {
  chartData: PropTypes.object,
  updateChart: PropTypes.func.isRequired,

  chartStartDate: PropTypes.object.isRequired,
  updateChartStartDate: PropTypes.func.isRequired,

  chartEndDate: PropTypes.object.isRequired,
  updateChartEndDate: PropTypes.func.isRequired,

  chartCurrency: PropTypes.string,
  updateChartCurrency: PropTypes.func.isRequired
};

export default CurrencyChart;
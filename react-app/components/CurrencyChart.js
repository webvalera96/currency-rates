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

const httpClient = new HTTPClient();

class CurrencyChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fclist: null,
      focusedInput: null,


      currency: null,
      startDate: moment(new Date()).subtract(30, 'days'),
      endDate: moment(new Date()),

    };

    this.updateChart = this.updateChart.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.datesChange = this.datesChange.bind(this);
    this.currencySelectChange = this.currencySelectChange.bind(this);
  }

  componentDidMount() {
    axios.get('/fc/list')
      .then(function (response) {
        const fclist = response.data;

        let firstCurrencyElement = fclist[0][1];

        this.props.updateChartCurrency(firstCurrencyElement);

        this.setState({
          fclist: fclist.map(function(fc, index) {
            return <option id={index} value={`${fc[1]}`}>{`${fc[0]} (${fc[1]})`}</option>
          })
        });

        this.updateChart(this.props.chartStartDate, this.state.endDate, firstCurrencyElement)
      }.bind(this));
  }

  updateChart(startDate, endDate, currency) {
    httpClient.fetchChartDataSet(startDate, endDate, currency)
      .then(function(dataSet) {
        this.props.updateChart(createChartData(dataSet, currency));
      }.bind(this));
  }

  datesChange(dateRange) {
    const { startDate, endDate } = dateRange;
    this.props.updateChartStartDate(startDate);
    this.props.updateChartEndDate(endDate);
    this.updateChart(startDate, endDate, this.props.chartCurrency);
  }

  currencySelectChange(event) {
    let currency = event.target.value;
    this.props.updateChartCurrency(currency);
    this.updateChart(this.props.chartStartDate, this.props.chartEndDate, currency);
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
                isOutsideRange={day => !isInclusivelyBeforeDay(day, moment())}
              />
            </Form.Row>
          </Form.Group>
        </Form.Row>
        <Row>
          {
            this.props.chartData &&
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
import React, {Component} from 'react';
import moment from "moment";
import axios from 'axios';
import {Form, Col} from 'react-bootstrap';
import {DateRangePicker, isInclusivelyBeforeDay} from "react-dates";

/**
 * Класс React компонента, для отображения формы создания отчета
 * @class Report
 * @category client
 */
class Report extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fclist: null,
      focusedInput: null,

      currencies: [],
      startDate: moment(new Date()).subtract(30, 'days'),
      endDate: moment(new Date()),
    };


    this.selectCurrencies = React.createRef();
    this.currencySelectChange = this.currencySelectChange.bind(this);
    this.datesChange = this.datesChange.bind(this);
  }

  /**
   * Метод жизненного цикла React
   */
  componentDidMount() {
    axios.get('/db/fc/list')
      .then(function (response) {
        const fclist = response.data;

        this.setState({
          currencies: [fclist[0][1]],
          fclist: fclist.map(function(fc, index) {
            return <option id={index} key={index} value={`${fc[1]}`}>{`${fc[0]} (${fc[1]})`}</option>
          })
        });
      }.bind(this));
  }

  /**
   * Метод, вызываемыей для обновления состояния выбора курса валют,
   * для которого строится отчет
   * @param event
   */
  currencySelectChange(event) {
    event.preventDefault();
    let options = this.selectCurrencies.options;
    let values = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    this.setState({
      currencies: values
    })
  }


  /**
   * Метод, вызываемый для обновления выбранного периода,
   * для которого строится отчет
   * @param {{startDate: *, endDate: *}}dateRange
   */
  datesChange(dateRange) {
    const { startDate, endDate } = dateRange;
    this.setState({
      startDate, endDate
    })
  }

  render() {
    return (
      <React.Fragment>
          <Form.Group as={Col}>
            <Form.Label>
              Валюта
            </Form.Label>
            <Form.Control
              ref={(select) => {
               this.selectCurrencies = select
              }}
              id="currencyReport"
              name="currency"
              as="select"
              onChange={this.currencySelectChange}
              multiple={true}
            >
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
                isOutsideRange={day => !isInclusivelyBeforeDay(day, moment().add(1, 'day'))}
                minDate={moment('01/01/2010', 'DD/MM/YYYY')}
              />
              <a
                style={{
                  marginLeft: "20px"
                }}
                download={"report.json"}
                href={`/db/report?begin_date=${moment(this.state.startDate).format('DD/MM/YYYY')}&end_date=${moment(this.state.endDate).format('DD/MM/YYYY')}&char_codes=${JSON.stringify(this.state.currencies)}`
              }>Сформировать отчет</a>
            </Form.Row>
          </Form.Group>

      </React.Fragment>
    )
  }
}

export default Report;
import React, {Component} from 'react';
import $ from 'jquery';
import moment from 'moment';
import 'datatables.net-bs4/js/dataTables.bootstrap4';
import {
  Form, Row, Col,
  Table, Container
} from 'react-bootstrap';
import {SingleDatePicker, isInclusivelyBeforeDay} from 'react-dates';
// noinspection ES6CheckImport
import PropTypes from 'prop-types';
import HTTPClient, {createTableData} from "../lib/HTTPClient";
const httpClient = new HTTPClient();

/**
 * Класс компонента React
 * @class QuotesDataTables
 * @category client
 */
class QuotesDataTables extends Component {

  /**
   * Конструктор
   * @param props
   */
  constructor(props) {
    super(props);

    this.state = {
      date: moment(new Date()),
      realDate: null,
      focused: false
    };

    this.quotesTable = React.createRef();

    this.dateChange = this.dateChange.bind(this);
    this.updateDataTable = this.updateDataTable.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  /**
   * Метод жизненного цикла компонента React
   */
  componentDidMount() {
    this.updateDataTable(this.state.date);
  }

  /**
   * Метод жизненного цикла компонента React
   */
  componentWillUnmount() {
    $(this.quotesTable.current)
      .find('table')
      .DataTable()
      .destroy(true);
  }

  /**
   * Метод для получения котировок на текущую дату и обновления данных таблицы
   * @param {moment} date - Текущая дата, на которую запрашиваются котировки валют
   */
  updateDataTable(date) {

    httpClient.fetchQuotesDataForDate(date)
      .then(function(response) {
        let {realDate, arr} = response;
        this.setState({realDate: moment(realDate).format("DD.MM.YYYY")});
        $(this.quotesTable.current).DataTable(createTableData(arr));
      }.bind(this)).catch(function(err) {
        let table = $(this.quotesTable.current).DataTable();
        table.clear().draw();
      }.bind(this));
  }

  /**
   * Метод, вызывающийся при изменении даты в компоненте react-dates и обновляющий состояние компонента
   * @param {moment} date - Новое значение даты
   */
  dateChange(date) {
    this.setState({date});
    if (date && date.isValid())
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
                    isOutsideRange={day =>
                      !isInclusivelyBeforeDay(day, moment().add(1, 'day'))}
                    block={true}
                    small={true}
                    placeholder={"Дата"}
                    readOnly={false}

                  />
                </Form.Group>
              </Form.Row>
              <Form.Row>
                <p>
                  <strong>
                    Центральный банк Российской Федерации установил с{` ${this.state.realDate} `}
                    следующие курсы иностранных валют к рублю Российской Федерации без обязательств
                    Банка России покупать или продавать указанные валюты по данному курсу
                  </strong>
                </p>
              </Form.Row>
            </Form>
          </Col>
        </Row>
        <Row>
          <Col>
            <Table ref={this.quotesTable}>
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


export default QuotesDataTables;
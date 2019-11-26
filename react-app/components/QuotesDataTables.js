import React, {Component} from 'react';
import $ from 'jquery';
import moment from 'moment';
import 'datatables.net-bs4/js/dataTables.bootstrap4';
import {
  Form, Row, Col,
  Table, Container
} from 'react-bootstrap';
import {SingleDatePicker, isInclusivelyBeforeDay} from 'react-dates';
import PropTypes from 'prop-types';
import HTTPClient, {createChartData, createTableData} from "../lib/HTTPClient";

const httpClient = new HTTPClient();

class QuotesDataTables extends Component {

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

  componentDidMount() {
    this.updateDataTable(this.state.date);
  }

  componentWillUnmount() {
    $(this.quotesTable.current)
      .find('table')
      .DataTable()
      .destroy(true);
  }

  updateDataTable(date) {

    httpClient.fetchQuotesDataForDate(date)
      .then(function(jsonResponse) {
        let {realDate, arr} = JSON.parse(jsonResponse);
        let quotesData = JSON.stringify(arr);
        this.setState({realDate});
        $(this.quotesTable.current).DataTable(createTableData(quotesData));
          if (this.props.chartStartDate && this.props.chartEndDate && this.props.chartCurrency) {
            httpClient.fetchChartDataSet(this.props.chartStartDate, this.props.chartEndDate, this.props.chartCurrency)
              .then(function(dataSet) {
                this.props.updateChart(createChartData(dataSet, this.props.chartCurrency));
              }.bind(this));
          }
      }.bind(this)).catch(function(err) {
        let table = $(this.quotesTable.current).DataTable();
        table.clear().draw();
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
              <Form.Row>
                {this.state.realDate}
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

QuotesDataTables.propTypes = {
  updateChart: PropTypes.func.isRequired,
  chartStartDate: PropTypes.object.isRequired,
  chartEndDate: PropTypes.object.isRequired,
  chartCurrency: PropTypes.string
};

export default QuotesDataTables;
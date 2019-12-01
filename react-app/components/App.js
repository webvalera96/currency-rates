import React, {Component} from 'react';
import 'jquery';
import {
  Row, Col,
  Container
} from 'react-bootstrap';
import 'react-dates/initialize';
import moment from 'moment';
import {connect} from 'react-redux';
import actions from '../redux/actions';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-dates/lib/css/_datepicker.css';
import 'datatables.net-bs4/css/dataTables.bootstrap4.css';
import '../styles/App.css';

import Report from './Report';
import CurrencyChart from "./CurrencyChart";
import QuotesDataTables from "./QuotesDataTables";
moment.locale('ru');

/**
 * Входная точка приложения
 * @class App
 * @category client
 */
class App extends Component {
  /**
   * Конструктор
   * @param props
   */
  constructor(props) {
    super(props);
  }

  /**
   * Функция-рендер компонента
   * @returns {*}
   */
  render() {
    return (
      <Container fluid={true}>
        <Row>
          <Col>
            <div>
                <h1>Информационная система "Курсы валют"</h1>
                <div>
                  <small><em>Разработал</em>: Цыплаков Валерий Сергеевич (<a href="mailto:webvalera96@gmail.com">webvalera96@gmail.com</a>)</small>
                </div>
                <div>
                  <small><em>Репозиторий</em>: <a href="https://github.com/webvalera96/currency-rates">https://github.com/webvalera96/currency-rates</a></small>
                </div>
                <div>
                  <small><em>Загрузка данных с ЦБ РФ</em>: <a href="/dash">/dash</a></small>
                </div>
                <div>
                  <small><em>Документация (JSDoc)</em>: <a href="/docs">/docs</a></small>
                </div>

            </div>
          </Col>
        </Row>
        <Row >
          <Col lg={6} xl={6} md={12} sm={12}  xs={12}>
            <QuotesDataTables/>
          </Col>
          <Col lg={6} xl={6} md={12} sm={12}  xs={12}>
            <Row>
              <Col>
                  <CurrencyChart
                    {...this.props}
                  />
              </Col>

            </Row>
            <Row>
              <Col>
                <Report />
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    )
  }
}


/**
 * Функция, для создания соответствия переменным-состояния Redux и автоматически
 * создаваемыми свойствами компонентов React
 * @category client
 * @name mapStateToProps
 * @param state
 * @returns {{chartData: *, chartCurrency: *, chartStartDate: *, chartEndDate: *}}
 */
function mapStateToProps(state) {
  return {
    chartData: state.get('chartData'),
    chartStartDate: state.get('chartStartDate'),
    chartEndDate: state.get('chartEndDate'),
    chartCurrency: state.get('chartCurrency')
  }
}

export default connect(mapStateToProps, actions)(App);
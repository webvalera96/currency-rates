import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import reducer from './redux/reducer';
import App from "./components/App";
import moment from "moment";

const store = createStore(reducer);

store.dispatch({
  type: 'SET_STATE',
  state: {
    chartData: null,
    chartStartDate: moment(new Date()).subtract(30, 'days'),
    chartEndDate: moment(new Date()),
    chartCurrency: null
  }
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>
  ,
  document.getElementById("react-app")
);
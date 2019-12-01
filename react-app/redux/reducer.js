import {Map} from 'immutable';

/**
 * Функция reducer для Redux
 * @name Reducer
 * @function
 * @category client
 * @param {Immutable.MAP<K,V>} state - хранилище
 * @param {object} action - действие
 * @returns {Map<V, K>|*|Map<V, K>}
 */
export default function (state = Map(), action) {
  switch (action.type) {
    case 'SET_STATE':
      return state.merge(action.state);
    case 'UPDATE_CHART_DATA':
      return state.update('chartData', (chartData) => action.chartData );
    case 'UPDATE_CHART_START_DATE':
      return state.update('chartStartDate', (chartStartDate) => action.chartStartDate);
    case 'UPDATE_CHART_END_DATE':
      return state.update('chartEndDate', (chartEndDate) => action.chartEndDate);
    case 'UPDATE_CHART_CURRENCY':
      return state.update('chartCurrency', (chartCurrency) => action.chartCurrency);
  }

  return state;
};
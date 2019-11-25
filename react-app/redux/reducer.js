import {Map} from 'immutable';

export default function (state = Map(), action) {
  switch (action.type) {
    case 'UPDATE_CHART_DATA':
      return state.update('chartData', (chartData) => action.chartData )
  }
  return state;
};
import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import PropTypes from 'prop-types';

class CurrencyChart extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
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
    )
  }
}

CurrencyChart.propTypes = {
  chartData: PropTypes.object.isRequired,
  updateChart: PropTypes.func.isRequired
};

export default CurrencyChart;
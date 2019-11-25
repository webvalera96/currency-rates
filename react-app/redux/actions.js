let updateChart = function(chartData) {
  return {
    type: 'UPDATE_CHART_DATA',
    chartData
  }
};

module.exports = {updateChart};
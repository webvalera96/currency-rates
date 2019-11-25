let updateChart = function(chartData) {
  return {
    type: 'UPDATE_CHART_DATA',
    chartData
  }
};

let updateChartStartDate = function(chartStartDate) {
  return {
    type: 'UPDATE_CHART_START_DATE',
    chartStartDate
  }
};

let updateChartEndDate = function(chartEndDate) {
  return {
    type: 'UPDATE_CHART_END_DATE',
    chartEndDate
  }
};

let updateChartCurrency = function(chartCurrency) {
  return {
    type: 'UPDATE_CHART_CURRENCY',
    chartCurrency
  }
};


module.exports = {updateChart, updateChartStartDate, updateChartEndDate, updateChartCurrency};
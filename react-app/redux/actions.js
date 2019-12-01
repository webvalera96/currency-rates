/**
 * Метод, для обновления переменной состояния chartData в Redux
 * @category client
 * @param {object} chartData
 * @returns {{chartData: *, type: string}}
 */
let updateChart = function(chartData) {
  return {
    type: 'UPDATE_CHART_DATA',
    chartData
  }
};

/**
 * Метод, для обновления переменной состояния chartStartDate в Redux
 * @category client
 * @param {Date} chartStartDate - Начальная дата, для построения графика
 * @returns {{type: string, chartStartDate: *}}
 */
let updateChartStartDate = function(chartStartDate) {
  return {
    type: 'UPDATE_CHART_START_DATE',
    chartStartDate
  }
};

/**
 * Метод, для обновления переменной состояния chartEndDate в Redux
 * @category client
 * @param {Date} chartEndDate - Конечная дата, для построения графика
 * @returns {{type: string, chartEndDate: *}}
 */
let updateChartEndDate = function(chartEndDate) {
  return {
    type: 'UPDATE_CHART_END_DATE',
    chartEndDate
  }
};

/**
 * Метод, для обновления переменной состояния chartCurrency
 * @category client
 * @param {string} chartCurrency - Наименование валюты, для построения графика
 * @returns {{chartCurrency: *, type: string}}
 */
let updateChartCurrency = function(chartCurrency) {
  return {
    type: 'UPDATE_CHART_CURRENCY',
    chartCurrency
  }
};

module.exports = {updateChart, updateChartStartDate, updateChartEndDate, updateChartCurrency};
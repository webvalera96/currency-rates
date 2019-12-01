module.exports = {
  tags: {
    "allowUnknownTags": ["category"] //or true
  },
  plugins: [
    "node_modules/better-docs/category"
  ],
  opts: {
    "template": "node_modules/better-docs"
  },
  source: {
    "include": [
      "react-app/lib/HTTPClient.js",
      "react-app/redux/actions.js",
      "react-app/redux/reducer.js",
      "react-app/components/App.js",
      "react-app/components/CurrencyChart.js",
      "react-app/components/Loader.js",
      "react-app/components/QuotesDataTables.js",
      "react-app/components/Report.js",

      "routes/index.js",
      "routes/db.js"
    ],
    "includePattern": ".+\\.js(doc|x)?$",
    "excludePattern": "(^|\\/|\\\\)_"
  }
};
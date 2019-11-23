module.exports = function(request, iconv) {
    return {
        httpGet: async function(url) {
            return new Promise(((resolve, reject) => {
                let config = {
                    url: url,
                    encoding: null
                };

                request(config, (err, result, body) => {
                    if(!err) {
                        if(body) {
                            let c = iconv.encode(iconv.decode(body, 'windows-1251'), 'utf8').toString();
                            resolve(c);
                        } else {
                            reject(body);
                        }
                    } else {
                        reject(err);
                    }
                })
            }))
        },
        // получение данных для построения графика стоимости валют
        chartGetDataset(beginDate, endDate, charCode,db) {

        }
    }
};
/// <reference path="references.ts"/>

declare var require

module MetaHub {
  export function load_json(url:string):Promise {
    var def = when.defer()
    var fs = require('fs')
    fs.readFile(url, 'ascii', function (err, json) {
      if (err) throw err
      console.log(data);
      if (!json)
        throw new Error('Invalid JSON file: ' + url)

      def.resolve(JSON.parse(json))
    });

    return def.promise
  }
}
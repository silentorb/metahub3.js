/// <reference path="references.ts"/>
declare var when
declare var JQuery

module MetaHub {
  export function load_json(url:string):Promise {
    var def = when.defer()
    JQuery.get(url, function (json) {
      def.resolve(JSON.parse(json))
    })
    return def.promise
  }
}
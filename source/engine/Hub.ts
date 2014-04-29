/// <reference path="../references.ts"/>

///***var when = require('when')

module MetaHub {

  declare var load_json

  export class Hub {
    trellises:Trellis[] = []
    nodes:Node[]
    property_types:Property_Type[] = []

//    static load_json_from_file(filename:string) {
//      var fs = require('fs')
//      var json = fs.readFileSync(filename, 'ascii');
//      if (!json)
//        throw new Error('Could not find file: ' + filename)
//
//      return JSON.parse(json);
//    }

    load_schema_from_file(url:string):Promise {
      return MetaHub.load_json(url)
        .then((data)=> this.load_trellises(data.trellises))
    }

    load_trellises(trellises:ITrellis_Source[]) {
      // Due to cross referencing, loading trellises needs to be done in passes

      // First load the core trellises
      var trellis:Trellis, source:ITrellis_Source, name:string
      for (name in trellises) {
        source = trellises[name]
        trellis = this.trellises[name]
        if (!trellis)
          this.trellises[name] = new Trellis(name, this)

        trellis.load_properties(source)
      }

      // Connect everything together
      for (name in trellises) {
        source = trellises[name]
        trellis = this.trellises[name]
        trellis.initialize(source)
      }
    }

    sanitize_trellis(trellis):Trellis {
      if (!trellis)
        throw new Error('Trellis is empty');

      if (typeof trellis === 'string') {
        if (!this.trellises[trellis])
          throw new Error('Could not find trellis named: ' + trellis + '.');

        return this.trellises[trellis];
      }

      return trellis;
    }

  }
}
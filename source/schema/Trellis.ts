/// <reference path="../references.ts"/>

module MetaHub {

  export class Trellis {
    parent:Trellis = null
    hub:Hub
    name:string = null
//    primary_key:string = 'id'
    identity:Property[] = []
    // Property that are specific to this trellis and not inherited from a parent trellis
    properties = {}
    // Every property including inherited properties
    is_virtual:boolean = false

    constructor(name:string, hub:Hub) {
      this.hub = hub;
      this.name = name;
    }

    add_property(name:string, source):Property {
      var property = new Property(name, source, this);
      this.properties[name] = property;
      return property;
    }

    clone_property(property_name:string, target_trellis:Trellis) {
      if (this.properties[property_name] === undefined)
        throw new Error(this.name + ' does not have a property named ' + property_name + '.');

      target_trellis.add_property(property_name, this.properties[property_name]);
    }

    get_all_links(filter:(property:Property)=>boolean = null) {
      var result = {};
      var properties = this.get_all_properties();
      for (var name in properties) {
        var property = properties[name];
        if (property.other_trellis && (!filter || filter(property)))
          result[property.name] = property;
      }

      return result;
    }

    get_all_properties() {
      var result = {}
      var tree = this.get_tree();
      for (var i = 0; i < tree.length; ++i) {
        var trellis = tree[i];
        for (var name in trellis.properties) {
          var property = trellis.properties[name];
          result[property.name] = property;
        }
      }
      return result;
    }

    get_property(name:string):Property {
      var properties = this.get_all_properties()
      var property = properties[name]
      if (!property)
        throw new Error('Trellis ' + this.name + ' does not contain a property named ' + name + '.')

      return property
    }

    get_core_properties() {
      var result = {}
      for (var i in this.properties) {
        var property = this.properties[i];
        if (property.type != 'list')
          result[i] = property;
      }

      return result;
//      return Enumerable.From(this.properties).Where(
//        (p) => p.type != 'list'
//      );
    }

    get_links():Property[] {
      var result:Property[] = [];
      for (var name in this.properties) {
        var property = this.properties[name];
        if (property.other_trellis)
          result.push(property);
      }
      return result;
    }

    get_reference_property(other_trellis:Trellis):Property {
      var properties = this.get_all_properties()
      for (var i in properties) {
        var property = properties[i]
        if (property.other_trellis === other_trellis)
          return property
      }

      return null
    }

    get_tree():Trellis[] {
      var trellis = this;
      var tree:Trellis[] = [];

      do {
        tree.unshift(trellis)
      }
      while (trellis = trellis.parent);

      return tree;
    }

    initialize(source:ITrellis_Source) {
      var trellises = this.hub.trellises
      if (source.parent) {
        if (!trellises[source.parent])
          throw new Error(this.name + ' references a parent that does not exist: ' + source.parent + '.')

        this.set_parent(trellises[source.parent])
      }

      if (source.properties) {
        for (var j in source.properties) {
          var property:Property = this.sanitize_property(j)
          property.initialize_links(source.properties[j])
//          var property_source = source.properties[j]
//          if (property_source.trellis) {
//            property.other_trellis = this.hub.sanitize_trellis(property_source.trellis)
//            if (property_source.other_property)
//              property.other_property = property.other_trellis.sanitize_property(property_source.other_property)
//          }
        }
      }
    }

    load_properties(source:ITrellis_Source) {
      for (name in source.properties) {
        this.add_property(name, source.properties[name]);
      }
    }

    sanitize_property(property) {
      if (typeof property === 'string') {
        var properties = this.get_all_properties();
        if (properties[property] === undefined)
          throw new Error(this.name + ' does not contain a property named ' + property + '.');

        return properties[property];
      }

      return property;
    }

    set_parent(parent:Trellis) {
      this.parent = parent;

      if (!parent.identity)
        throw new Error(parent.name + ' needs a primary key when being inherited by ' + this.name + '.');

      this.identity = parent.identity.map((x) => x.clone(this))
    }
  }
}
/// <reference path="../references.ts"/>

module MetaHub {

  export class Property {
    name:string = null
    parent:Trellis = null
    type:string = null
    insert:string = null
    default_value:any
    other_trellis:Trellis = null
    other_property:Property = null
    is_private:boolean = false
    is_parent:boolean = false
    is_readonly:boolean = false
    is_virtual:boolean = false
    is_unique:boolean = false
    allow_null:boolean

    static source_attributes = [ 'type', 'insert', 'default_value', 'is_private', 'is_virtual', 'is_unique' ]

    constructor(name:string, source:IProperty_Source, trellis:Trellis) {
      for (var i in Property.source_attributes) {
        var key = Property.source_attributes[i]
        if (source[key] !== undefined)
          this[key] = source[key]
      }
      if (source.default_value !== undefined)
        this.default_value = source.default_value

      if (source.allow_null !== undefined)
        this.allow_null = source.allow_null

      this.name = name;
      this.parent = trellis;
    }

    clone(new_parent:Trellis):Property {
      var source:IProperty_Source = {
        type: this.type
      }
      for (var i in Property.source_attributes) {
        var key = Property.source_attributes[i]
        if (this[key] !== undefined)
          source[key] = this[key]
      }
      var result = new Property(this.name, source, new_parent)

      if (this.other_property)
        result.other_property = this.other_property

      if (this.other_trellis)
        result.other_trellis = this.other_trellis

      new_parent.properties[this.name] = result

      return result
    }

    get_allow_null():boolean {
      if (this.allow_null !== undefined)
        return this.allow_null

      var type = this.get_property_type()
      if (type && type.allow_null !== undefined)
        return type.allow_null

      return false
    }

    get_data():IProperty_Source {
      var result:IProperty_Source = {
        type: this.type
      }
      if (this.other_trellis)
        result.trellis = this.other_trellis.name;

      if (this.is_readonly)
        result.is_readonly = this.is_readonly;

      if (this.is_private)
        result.is_private = this.is_private;

      if (this.insert)
        result.insert = this.insert;

      return result;
    }

    get_default():any {
      var result
      if (this.default_value == undefined && this.parent.parent && this.parent.parent.properties[this.name])
        result = this.parent.parent.properties[this.name].get_default()
      else
        result = this.default_value

      if (result === undefined) {
        var type = this.get_property_type()
        if (type)
          result = type.default_value
      }
      return result
    }

//    get_type():string {
//      if (this.type == 'reference' || this.type == 'list') {
//        return this.other_trellis.properties[this.other_trellis.primary_key].type
//      }
//
//      return this.type
//    }

//    get_other_id(entity) {
//      var value = entity[this.other_trellis.primary_key];
//      if (value === undefined)
//        value = null;
//
//      return value;
//    }

    get_other_property(create_if_none:boolean = false):Property {
      var property;
      if (this.other_property) {
        return this.other_property;
      }

      if (!create_if_none)
        return null

      if (this.other_trellis === this.parent)
        return null

      // If there is no existing connection defined in this trellis, create a dummy
      // connection and assume that it is a list.  This means that implicit connections
      // are either one-to-many or many-to-many, never one-to-one.
      var attributes:IProperty_Source = <IProperty_Source>{}
      attributes.type = 'list'
      attributes.is_virtual = true
      attributes.trellis = this.parent.name
      var result = new Property(this.other_trellis.name, attributes, this.other_trellis)
      result.other_trellis = this.parent
      return result
    }

    get_property_type():Property_Type {
      var types = this.parent.hub.property_types;
      if (types[this.type] !== undefined)
        return types[this.type];

      return null;
    }

    get_referenced_trellis():Trellis {
      return this.other_trellis;
    }

    get_relationship():Relationships {
      if (this.type != 'list' && this.type != 'reference')
        return Relationships.none

      var other_property = this.get_other_property();
      if (!other_property) {
        if (this.type == 'list')
          return Relationships.one_to_many
        else
          return Relationships.one_to_one
      }

      if (this.type == 'list') {
        if (other_property.type == 'list')
          return Relationships.many_to_many;
        else
          return Relationships.one_to_many;
      }
      return Relationships.one_to_one;
    }

    initialize_links(source:IProperty_Source) {
      if (source.trellis) {
        this.other_trellis = this.parent.hub.sanitize_trellis(source.trellis)
        if (source.other_property)
          this.other_property = this.other_trellis.sanitize_property(source.other_property)
      }
    }
  }
}
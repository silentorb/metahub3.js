/// <reference path="../references.ts"/>

module MetaHub {

  export interface Schema_Source {
    tables?:any[];
  }

  export interface Property_Type {
    name:string
    default_value
    parent:number

    allow_null?:boolean
  }

  export enum Relationships {
    none,
    one_to_one,
    one_to_many,
    many_to_many
  }

  export interface IProperty_Source {
    name?:string
    type:string
    insert?:string
    is_virtual?:boolean
    is_readonly?:boolean
    is_private?:boolean
    property?:string
    trellis?:string
    default_value?:any
    allow_null?:boolean
    other_property?:string
  }

  export interface ITrellis_Source {
    name:string
    parent:string
    properties:IProperty_Source[]
  }

}

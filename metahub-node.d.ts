/// <reference path="defs/when.d.ts" />
declare module MetaHub {
    interface Schema_Source {
        tables?: any[];
    }
    interface Property_Type {
        name: string;
        default_value: any;
        parent: number;
        allow_null?: boolean;
    }
    enum Relationships {
        none = 0,
        one_to_one = 1,
        one_to_many = 2,
        many_to_many = 3,
    }
    interface IProperty_Source {
        name?: string;
        type: string;
        insert?: string;
        is_virtual?: boolean;
        is_readonly?: boolean;
        is_private?: boolean;
        property?: string;
        trellis?: string;
        default_value?: any;
        allow_null?: boolean;
        other_property?: string;
    }
    interface ITrellis_Source {
        name: string;
        parent: string;
        properties: IProperty_Source[];
    }
}
declare module MetaHub {
    class Hub {
        public trellises: Trellis[];
        public nodes: Node[];
        public property_types: Property_Type[];
        public load_schema_from_file(url: string): Promise;
        public load_trellises(trellises: ITrellis_Source[]): void;
        public sanitize_trellis(trellis: any): Trellis;
    }
}
declare module MetaHub {
    class Property {
        public name: string;
        public parent: Trellis;
        public type: string;
        public insert: string;
        public default_value: any;
        public other_trellis: Trellis;
        public other_property: Property;
        public is_private: boolean;
        public is_parent: boolean;
        public is_readonly: boolean;
        public is_virtual: boolean;
        public is_unique: boolean;
        public allow_null: boolean;
        static source_attributes: string[];
        constructor(name: string, source: IProperty_Source, trellis: Trellis);
        public clone(new_parent: Trellis): Property;
        public fullname(): string;
        public get_allow_null(): boolean;
        public get_data(): IProperty_Source;
        public get_default(): any;
        public get_other_property(create_if_none?: boolean): Property;
        public get_property_type(): Property_Type;
        public get_referenced_trellis(): Trellis;
        public get_relationship(): Relationships;
        public initialize_links(source: IProperty_Source): void;
    }
}
declare module MetaHub {
    class Trellis {
        public parent: Trellis;
        public hub: Hub;
        public name: string;
        public identity: Property[];
        public properties: {};
        public is_virtual: boolean;
        constructor(name: string, hub: Hub);
        public add_property(name: string, source: any): Property;
        public clone_property(property_name: string, target_trellis: Trellis): void;
        public get_all_links(filter?: (property: Property) => boolean): {};
        public get_all_properties(): {};
        public get_property(name: string): Property;
        public get_core_properties(): {};
        public get_links(): Property[];
        public get_reference_property(other_trellis: Trellis): Property;
        public get_tree(): Trellis[];
        public initialize(source: ITrellis_Source): void;
        public load_properties(source: ITrellis_Source): void;
        public sanitize_property(property: any): any;
        public set_parent(parent: Trellis): void;
    }
}
declare module MetaHub {
}
declare var when: any;
declare var JQuery: any;
declare module MetaHub {
    function load_json(url: string): Promise;
}

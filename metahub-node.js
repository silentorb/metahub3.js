/// <reference path="../references.ts"/>
var MetaHub;
(function (MetaHub) {
    (function (Relationships) {
        Relationships[Relationships["none"] = 0] = "none";
        Relationships[Relationships["one_to_one"] = 1] = "one_to_one";
        Relationships[Relationships["one_to_many"] = 2] = "one_to_many";
        Relationships[Relationships["many_to_many"] = 3] = "many_to_many";
    })(MetaHub.Relationships || (MetaHub.Relationships = {}));
    var Relationships = MetaHub.Relationships;
})(MetaHub || (MetaHub = {}));
/// <reference path="../references.ts"/>
var when = require('when')
var MetaHub;
(function (MetaHub) {
    var Hub = (function () {
        function Hub() {
            this.trellises = [];
            this.property_types = [];
        }
        //    static load_json_from_file(filename:string) {
        //      var fs = require('fs')
        //      var json = fs.readFileSync(filename, 'ascii');
        //      if (!json)
        //        throw new Error('Could not find file: ' + filename)
        //
        //      return JSON.parse(json);
        //    }
        Hub.prototype.load_schema_from_file = function (url) {
            var _this = this;
            return MetaHub.load_json(url).then(function (data) {
                return _this.load_trellises(data.trellises);
            });
        };

        Hub.prototype.load_trellises = function (trellises) {
            // Due to cross referencing, loading trellises needs to be done in passes
            // First load the core trellises
            var trellis, source, name;
            for (name in trellises) {
                source = trellises[name];
                trellis = this.trellises[name];
                if (!trellis)
                    this.trellises[name] = new MetaHub.Trellis(name, this);

                trellis.load_properties(source);
            }

            for (name in trellises) {
                source = trellises[name];
                trellis = this.trellises[name];
                trellis.initialize(source);
            }
        };

        Hub.prototype.sanitize_trellis = function (trellis) {
            if (!trellis)
                throw new Error('Trellis is empty');

            if (typeof trellis === 'string') {
                if (!this.trellises[trellis])
                    throw new Error('Could not find trellis named: ' + trellis + '.');

                return this.trellises[trellis];
            }

            return trellis;
        };
        return Hub;
    })();
    MetaHub.Hub = Hub;
})(MetaHub || (MetaHub = {}));
/// <reference path="../references.ts"/>
var MetaHub;
(function (MetaHub) {
    var Property = (function () {
        function Property(name, source, trellis) {
            this.name = null;
            this.parent = null;
            this.type = null;
            this.insert = null;
            this.other_trellis = null;
            this.other_property = null;
            this.is_private = false;
            this.is_parent = false;
            this.is_readonly = false;
            this.is_virtual = false;
            this.is_unique = false;
            for (var i in Property.source_attributes) {
                var key = Property.source_attributes[i];
                if (source[key] !== undefined)
                    this[key] = source[key];
            }
            if (source.default_value !== undefined)
                this.default_value = source.default_value;

            if (source.allow_null !== undefined)
                this.allow_null = source.allow_null;

            this.name = name;
            this.parent = trellis;
        }
        Property.prototype.clone = function (new_parent) {
            var source = {
                type: this.type
            };
            for (var i in Property.source_attributes) {
                var key = Property.source_attributes[i];
                if (this[key] !== undefined)
                    source[key] = this[key];
            }
            var result = new Property(this.name, source, new_parent);

            if (this.other_property)
                result.other_property = this.other_property;

            if (this.other_trellis)
                result.other_trellis = this.other_trellis;

            new_parent.properties[this.name] = result;

            return result;
        };

        Property.prototype.fullname = function () {
            return this.parent.name + '.' + this.name;
        };

        Property.prototype.get_allow_null = function () {
            if (this.allow_null !== undefined)
                return this.allow_null;

            var type = this.get_property_type();
            if (type && type.allow_null !== undefined)
                return type.allow_null;

            return false;
        };

        Property.prototype.get_data = function () {
            var result = {
                type: this.type
            };
            if (this.other_trellis)
                result.trellis = this.other_trellis.name;

            if (this.is_readonly)
                result.is_readonly = this.is_readonly;

            if (this.is_private)
                result.is_private = this.is_private;

            if (this.insert)
                result.insert = this.insert;

            return result;
        };

        Property.prototype.get_default = function () {
            var result;
            if (this.default_value == undefined && this.parent.parent && this.parent.parent.properties[this.name])
                result = this.parent.parent.properties[this.name].get_default();
            else
                result = this.default_value;

            if (result === undefined) {
                var type = this.get_property_type();
                if (type)
                    result = type.default_value;
            }
            return result;
        };

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
        Property.prototype.get_other_property = function (create_if_none) {
            if (typeof create_if_none === "undefined") { create_if_none = false; }
            var property;
            if (this.other_property) {
                return this.other_property;
            }

            if (!create_if_none)
                return null;

            if (this.other_trellis === this.parent)
                return null;

            // If there is no existing connection defined in this trellis, create a dummy
            // connection and assume that it is a list.  This means that implicit connections
            // are either one-to-many or many-to-many, never one-to-one.
            var attributes = {};
            attributes.type = 'list';
            attributes.is_virtual = true;
            attributes.trellis = this.parent.name;
            var result = new Property(this.other_trellis.name, attributes, this.other_trellis);
            result.other_trellis = this.parent;
            return result;
        };

        Property.prototype.get_property_type = function () {
            var types = this.parent.hub.property_types;
            if (types[this.type] !== undefined)
                return types[this.type];

            return null;
        };

        Property.prototype.get_referenced_trellis = function () {
            return this.other_trellis;
        };

        Property.prototype.get_relationship = function () {
            if (this.type != 'list' && this.type != 'reference')
                return 0 /* none */;

            //      var field = this.get_field_override();
            //      if (field && field.relationship) {
            //        return Relationships[field.relationship];
            //      }
            var other_property = this.get_other_property();
            if (!other_property) {
                if (this.type == 'list')
                    return 2 /* one_to_many */;
                else
                    return 1 /* one_to_one */;
            }

            //        throw new Error(this.parent.name + '.' + this.name + ' does not have a reciprocal reference.');
            if (this.type == 'list') {
                if (other_property.type == 'list')
                    return 3 /* many_to_many */;
                else
                    return 2 /* one_to_many */;
            }
            return 1 /* one_to_one */;
        };

        Property.prototype.initialize_links = function (source) {
            if (source.trellis) {
                this.other_trellis = this.parent.hub.sanitize_trellis(source.trellis);
                if (source.other_property)
                    this.other_property = this.other_trellis.sanitize_property(source.other_property);
            }
        };
        Property.source_attributes = ['type', 'insert', 'default_value', 'is_private', 'is_virtual', 'is_unique'];
        return Property;
    })();
    MetaHub.Property = Property;
})(MetaHub || (MetaHub = {}));
/// <reference path="../references.ts"/>
var MetaHub;
(function (MetaHub) {
    var Trellis = (function () {
        function Trellis(name, hub) {
            this.parent = null;
            this.name = null;
            //    primary_key:string = 'id'
            this.identity = [];
            // Property that are specific to this trellis and not inherited from a parent trellis
            this.properties = {};
            // Every property including inherited properties
            this.is_virtual = false;
            this.hub = hub;
            this.name = name;
        }
        Trellis.prototype.add_property = function (name, source) {
            var property = new MetaHub.Property(name, source, this);
            this.properties[name] = property;
            return property;
        };

        Trellis.prototype.clone_property = function (property_name, target_trellis) {
            if (this.properties[property_name] === undefined)
                throw new Error(this.name + ' does not have a property named ' + property_name + '.');

            target_trellis.add_property(property_name, this.properties[property_name]);
        };

        Trellis.prototype.get_all_links = function (filter) {
            if (typeof filter === "undefined") { filter = null; }
            var result = {};
            var properties = this.get_all_properties();
            for (var name in properties) {
                var property = properties[name];
                if (property.other_trellis && (!filter || filter(property)))
                    result[property.name] = property;
            }

            return result;
        };

        Trellis.prototype.get_all_properties = function () {
            var result = {};
            var tree = this.get_tree();
            for (var i = 0; i < tree.length; ++i) {
                var trellis = tree[i];
                for (var name in trellis.properties) {
                    var property = trellis.properties[name];
                    result[property.name] = property;
                }
            }
            return result;
        };

        Trellis.prototype.get_property = function (name) {
            var properties = this.get_all_properties();
            var property = properties[name];
            if (!property)
                throw new Error('Trellis ' + this.name + ' does not contain a property named ' + name + '.');

            return property;
        };

        Trellis.prototype.get_core_properties = function () {
            var result = {};
            for (var i in this.properties) {
                var property = this.properties[i];
                if (property.type != 'list')
                    result[i] = property;
            }

            return result;
            //      return Enumerable.From(this.properties).Where(
            //        (p) => p.type != 'list'
            //      );
        };

        Trellis.prototype.get_links = function () {
            var result = [];
            for (var name in this.properties) {
                var property = this.properties[name];
                if (property.other_trellis)
                    result.push(property);
            }
            return result;
        };

        Trellis.prototype.get_reference_property = function (other_trellis) {
            var properties = this.get_all_properties();
            for (var i in properties) {
                var property = properties[i];
                if (property.other_trellis === other_trellis)
                    return property;
            }

            return null;
        };

        Trellis.prototype.get_tree = function () {
            var trellis = this;
            var tree = [];

            do {
                tree.unshift(trellis);
            } while(trellis = trellis.parent);

            return tree;
        };

        Trellis.prototype.initialize = function (source) {
            var trellises = this.hub.trellises;
            if (source.parent) {
                if (!trellises[source.parent])
                    throw new Error(this.name + ' references a parent that does not exist: ' + source.parent + '.');

                this.set_parent(trellises[source.parent]);
            }

            if (source.properties) {
                for (var j in source.properties) {
                    var property = this.sanitize_property(j);
                    property.initialize_links(source.properties[j]);
                    //          var property_source = source.properties[j]
                    //          if (property_source.trellis) {
                    //            property.other_trellis = this.hub.sanitize_trellis(property_source.trellis)
                    //            if (property_source.other_property)
                    //              property.other_property = property.other_trellis.sanitize_property(property_source.other_property)
                    //          }
                }
            }
        };

        Trellis.prototype.load_properties = function (source) {
            for (name in source.properties) {
                this.add_property(name, source.properties[name]);
            }
        };

        Trellis.prototype.sanitize_property = function (property) {
            if (typeof property === 'string') {
                var properties = this.get_all_properties();
                if (properties[property] === undefined)
                    throw new Error(this.name + ' does not contain a property named ' + property + '.');

                return properties[property];
            }

            return property;
        };

        Trellis.prototype.set_parent = function (parent) {
            var _this = this;
            this.parent = parent;

            if (!parent.identity)
                throw new Error(parent.name + ' needs a primary key when being inherited by ' + this.name + '.');

            this.identity = parent.identity.map(function (x) {
                return x.clone(_this);
            });
        };
        return Trellis;
    })();
    MetaHub.Trellis = Trellis;
})(MetaHub || (MetaHub = {}));
/// <reference path="../references.ts"/>
/// <reference path="../defs/when.d.ts"/>
/// <reference path="engine/Interfaces.ts"/>
/// <reference path="engine/Hub.ts"/>
/// <reference path="schema/Property.ts"/>
/// <reference path="schema/Trellis.ts"/>
/// <reference path="code/Expression.ts"/>
/// <reference path="references.ts"/>

var MetaHub;
(function (MetaHub) {
    function load_json(url) {
        var def = when.defer();
        JQuery.get(url, function (json) {
            def.resolve(JSON.parse(json));
        });
        return def.promise;
    }
    MetaHub.load_json = load_json;
})(MetaHub || (MetaHub = {}));
//# sourceMappingURL=metahub-node.js.map

constructor("Model.Tuple", {
  eigenprops: {
    extended: function(subconstructor) {
      subconstructor.set = new Model.Relations.Set(this.determine_global_name(subconstructor));
      subconstructor.attribute("id", "string");
    },

    attribute: function(name, type) {
      this[name] = this.set.define_attribute(name, type);
      this.prototype[name] = function(value) {
        var field = this.fields_by_attribute_name[name];
        if (value) {
          return field.value(value);
        } else {
          return field.value();
        }
      };
    },

    attributes: function(attribute_name_type_pairs) {
      for (var name in attribute_name_type_pairs) {
        this.attribute(name, attribute_name_type_pairs[name]);
      }
    },

    determine_global_name: function(tuple_constructor) {
      return Inflection.pluralize(Inflection.underscore(tuple_constructor.basename));
    }
  },

  initialize: function(field_values_by_attribute_name) {
    this.initialize_fields_by_attribute_name();
    if (field_values_by_attribute_name) this.assign_field_values(field_values_by_attribute_name);
  },

  initialize_fields_by_attribute_name: function() {
    this.fields_by_attribute_name = {};
    for (var attr_name in this.constructor.set.attributes_by_name) {
      var attribute = this.constructor.set.attributes_by_name[attr_name];
      this.fields_by_attribute_name[attr_name] = new Model.Field(this, attribute);
    }
  },

  assign_field_values: function(field_values_by_attribute_name) {
    for (var attr_name in field_values_by_attribute_name) {
      this.fields_by_attribute_name[attr_name].value(field_values_by_attribute_name[attr_name])
    }
  }
});
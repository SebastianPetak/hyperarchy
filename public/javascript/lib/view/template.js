constructor("View.Template", {
  eigenprops: {
    to_view: function(properties) {
      return new this().to_view(properties);
    }
  },

  to_view: function(properties) {
    var builder = new View.Builder();
    this.builder = builder;
    this.content(properties);
    this.builder = null;

    var view_properties = { template: this };
    mixin(view_properties, this.default_view_properties);
    if (this.view_properties) mixin(view_properties, this.view_properties);
    if (properties) mixin(view_properties, properties);
    return builder.to_view(view_properties);
  },

  default_view_properties: {
    field_values: function() {
      var values = {};
      this.find("input").each(function() {
        var self = $(this);
        values[self.attr('name')] = self.val();
      });
      return values;
    }
  }
});
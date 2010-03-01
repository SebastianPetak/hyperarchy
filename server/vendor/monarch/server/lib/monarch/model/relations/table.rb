module Model
  module Relations
    class Table < Relation
      attr_reader :global_name, :tuple_class, :concrete_columns_by_name, :synthetic_columns_by_name,
                  :global_identity_map

      def initialize(global_name, tuple_class)
        @global_name, @tuple_class = global_name, tuple_class
        @concrete_columns_by_name = ActiveSupport::OrderedHash.new
        @synthetic_columns_by_name = ActiveSupport::OrderedHash.new
        @global_identity_map = {}

        initialize_event_system
      end

      def define_concrete_column(name, type, options={})
        concrete_columns_by_name[name] = ConcreteColumn.new(self, name, type, options)
      end

      def define_synthetic_column(name, type, signal_definition)
        synthetic_columns_by_name[name] = SyntheticColumn.new(self, name, type, signal_definition)
      end

      def concrete_columns
        concrete_columns_by_name.values
      end

      def synthetic_columns
        synthetic_columns_by_name.values
      end

      def column(column_or_name)
        case column_or_name
        when String, Symbol
          concrete_columns_by_name[column_or_name.to_sym] || synthetic_columns_by_name[column_or_name.to_sym]
        when Column
          column_or_name if column_or_name.table == self
        end
      end

      def table
        self
      end

      def create(field_values = {})
        insert(tuple_class.new(field_values))
      end

      def unsafe_create(field_values = {})
        insert(tuple_class.unsafe_new(field_values))
      end

      def insert(record)
        record.before_create if record.respond_to?(:before_create)
        return record if !record.valid?
        Origin.insert(self, record.field_values_by_column_name)
        on_insert_node.publish(record)
        local_identity_map[record.id] = record if local_identity_map
        record.mark_clean
        record.after_create if record.respond_to?(:after_create)
        record
      end

      def remove(record)
        Origin.destroy(self, record.id)
        on_remove_node.publish(record)
        local_identity_map.delete(record.id) if local_identity_map
        global_identity_map.delete(record.id)
      end

      def record_updated(record, changeset)
        on_update_node.publish(record, changeset)
      end

      def surface_tables
        [self]
      end

      def exposed_name
        @exposed_name || global_name
      end

      def pause_events
        event_nodes.each {|node| node.pause}
      end

      def resume_events
        event_nodes.each {|node| node.resume}
      end

      def cancel_events
        event_nodes.each {|node| node.cancel}
      end

      def build_sql_query(query=Sql::Select.new)
        query.add_from_table(self)
        query
      end

      def build_record_from_database(field_values)
        id = field_values[:id]

        if record_from_global_id_map = global_identity_map[id]
          record_from_global_id_map
        elsif local_identity_map && record_from_id_map = local_identity_map[id]
          record_from_id_map
        else
          record = tuple_class.unsafe_new(field_values)
          record.mark_clean
          local_identity_map[id] = record if local_identity_map
          record
        end
      end

      def initialize_identity_map
        Thread.current["#{global_name}_identity_map"] = {}
      end

      def local_identity_map
        Thread.current["#{global_name}_identity_map"]
      end

      def clear_identity_map
        Thread.current["#{global_name}_identity_map"] = nil
      end

      def load_fixtures(fixtures)
        fixtures.each do |id, field_values|
          record = tuple_class.unsafe_new(field_values.merge(:id => id.to_s))
          Origin.insert(self, record.field_values_by_column_name)
        end
      end

      def clear_table
        event_nodes.each do |event_node|
          event_node.clear
        end
        Origin.clear_table(global_name)
      end

      def create_table
        columns_to_generate = concrete_columns
        Origin.create_table(global_name) do
          columns_to_generate.each do |c|
            column c.name, c.ruby_type
          end
        end
      end

      def drop_table
        Origin.drop_table(global_name)
      end

      protected

      def has_operands?
        false
      end
    end
  end
end
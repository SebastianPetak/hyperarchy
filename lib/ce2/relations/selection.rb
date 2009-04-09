module Relations
  class Selection
    attr_reader :operand, :predicate

    def initialize(operand, predicate)
      @operand, @predicate = operand, predicate
    end

    def to_sql
      build_sql_query.to_sql
    end

    def build_sql_query(query=SqlQuery.new)
      query.add_condition(predicate)
      operand.build_sql_query(query)
    end
  end
end
module Resources
  class UserRepository < Model::ExposedRepository
    attr_reader :user
    def initialize(user)
      @user = user
    end

    expose :organizations do
      Organization.table
    end

    expose :elections do
      Election.table
    end
  end
end
require File.expand_path("#{File.dirname(__FILE__)}/../../monarch_spec_helper")

module Model
  describe ExposedRepository do
    attr_reader :user, :exposed_repository
    before do
      @user = User.find("jan")
      @exposed_repository = UserRepository.new(user)
    end

    describe ".expose(name, &relation_definition)" do
      it "binds the given relation definition to a table name" do
        exposed_repository.resolve_table_name(:blogs).should == user.blogs
      end
    end

    describe "#locate with subresource urls" do
      it "returns resources that delegate back to the ExposedRepository as appropriate" do
        mock(exposed_repository).fetch({:foo => "bar"})
        exposed_repository.locate('fetch').get({:foo => "bar"})

        mock(exposed_repository).mutate({:baz => "boo"})
        exposed_repository.locate('mutate').post({:baz => "boo"})

        mock(exposed_repository).subscribe({:bon => "quux"})
        exposed_repository.locate('subscribe').post({:bon => "quux"})
      end
    end

    describe "#fetch" do
      it "parses the 'relations' parameter from a JSON string into an array of wire representations and performs a #fetch with it, returning the resulting dataset as a JSON string" do
        relations = [{ "type" => "table", "name" => "blog_posts"}]
        dataset = nil
        mock.proxy(exposed_repository).perform_fetch(relations) {|result| dataset = result}
        response = Http::Response.new(*exposed_repository.fetch({:relations => relations.to_json}))

        response.should be_ok
        response.headers.should == { 'Content-Type' => 'application/json'}
        JSON.parse(response.body).should == { 'successful' => true, 'data' => dataset}
      end
    end

    describe "#mutate" do
      context "when called with a single create operation" do
        context "when the given field values are valid" do
          it "calls #create on the indicated 'relation' with the given 'field_values', then returns all field values as its result" do
            signed_up_at = Time.now

            field_values = {
              'great_name' => "Sharon Ly",
              'age' => 25,
              'signed_up_at' => signed_up_at.to_millis
            }

            User.new(field_values).should be_valid

            response = Http::Response.new(*exposed_repository.mutate(
              :operations => [['create', 'users', field_values]].to_json
            ))

            new_record = User.find(User[:full_name].eq('Sharon Ly The Great'))

            response.should be_ok
            response.body_from_json.should == {
              'successful' => true,
              'data' => {
                'primary' => [{
                  'id' => new_record.id,
                  'full_name' => "Sharon Ly The Great",
                  'age' => 25,
                  'signed_up_at' => signed_up_at.to_millis,
                  'has_hair' => nil,
                  'great_name' => "Sharon Ly The Great The Great",
                  'human' => true
                }],
                'secondary' => []
              }
            }
          end
        end

        context "when the given field values are invalid" do
          it "calls #create on the indicated 'relation' with the given 'field_values', then returns all the validation errors as its result" do
            field_values = {
              'full_name' => "Baby Sharon Ly",
              'age' => 2
            }

            invalid_example = User.new(field_values)
            invalid_example.should_not be_valid

            response = Http::Response.new(*exposed_repository.mutate({
              :operations => [['create', 'users', field_values]].to_json
            }))

            User.find(User[:full_name].eq("Baby Sharon Ly")).should be_nil
            
            response.should be_ok
            response.body_from_json.should == {
              'successful' => false,
              'data' => {
                'index' => 0,
                'errors' => { 'age' => invalid_example.field(:age).validation_errors}
              }
            }
          end
        end
      end

      context "when called with a single update operation" do
        context "when the given field values are valid" do
          it "finds the record with the given 'id' in the given 'relation', then updates it with the given field values and returns all changed field values as its result" do
            record = User.find('jan')

            new_signed_up_at = record.signed_up_at - 1.hours

            field_values = {
              'great_name' => "Jan Christian Nelson",
              'age' => record.age,
              'signed_up_at' => new_signed_up_at.to_millis
            }

            response = Http::Response.new(*exposed_repository.mutate({
              :operations => [['update', 'users', 'jan', field_values]].to_json
            }))
            record.reload
            record.full_name.should == "Jan Christian Nelson The Great"
            record.age.should == 31
            record.signed_up_at.to_millis.should == new_signed_up_at.to_millis

            response.should be_ok
            response.body_from_json.should == {
              'successful' => true,
              'data' => {
                'primary' => [{
                  'full_name' => "Jan Christian Nelson The Great",
                  'signed_up_at' => new_signed_up_at.to_millis,
                  'great_name' => "Jan Christian Nelson The Great The Great"
                }],
                'secondary' => []
              }
            }
          end
        end

        context "when the given field values are invalid" do
          it "returns the validation errors in an unsuccessful response" do
            record = User.find('jan')
            pre_update_age = record.age

            response = Http::Response.new(*exposed_repository.mutate({
              :operations => [['update', 'users', 'jan', { :age => 3}]].to_json
            }))

            validation_errors_on_age = record.field(:age).validation_errors
            record.reload
            record.age.should == pre_update_age

            response.should be_ok
            response.body_from_json.should == {
              'successful' => false,
              'data' => {
                'index' => 0,
                'errors' => { 'age' => ["User must be at least 10 years old"]}
              }
            }
          end
        end

        context "when the given field values would cause the record to no longer be contained by the exposed relation" do
          it "returns a security error and does not perform the update" do
            response = Http::Response.new(*exposed_repository.mutate(:operations => [['update', 'blogs', 'grain', { 'user_id' => 'wil' }]].to_json))
            response.body_from_json.should == {"data"=>{"errors"=>"Security violation", "index"=>0}, "successful"=>false}
            Blog.find('grain').reload.user_id.should == 'jan'
          end
        end
      end

      context "when called with a single destroy operation" do
        it "finds the record with the given 'id' in the given 'relation', then destroys it" do
          User.find('jan').should_not be_nil

          response = Http::Response.new(*exposed_repository.mutate(
            :operations => [['destroy', 'users', 'jan']].to_json
          ))

          User.find('jan').should be_nil

          response.should be_ok
          response.body_from_json.should == {
            'successful' => true,
            'data' => {
              'primary' => [nil],
              'secondary' => []
            }
          }
        end
      end

      context "when called with multiple operations" do
        context "when all operations are valid" do
          it "performs all operations and returns a result for each" do
            signed_up_at = Time.now
            User.find('jan').should_not be_nil

            response = Http::Response.new(*exposed_repository.mutate({
              :operations => [
                ['create', 'users', { 'full_name' => "Jake Frautschi", 'age' => 27, 'signed_up_at' => signed_up_at.to_millis }],
                ['update', 'users', 'jan', {'age' => 101}],
                ['destroy', 'users', 'wil']
              ].to_json
            }))

            jake = User.find(User[:full_name].eq("Jake Frautschi"))
            jake.should_not be_nil
            User.find("jan").age.should == 101
            User.find('wil').should be_nil

            response.should be_ok
            response.body_from_json.should == {
              'data' => {
                'primary' => [
                  {
                    'id' => jake.id,
                    'full_name' => "Jake Frautschi",
                    'age' => 27,
                    'signed_up_at' => signed_up_at.to_millis,
                    'has_hair' => nil,
                    'great_name' => "Jake Frautschi The Great",
                    'human' => true
                  },
                  { 'age' => 101 },
                  nil
                ],
                'secondary' => []
              },

              'successful' => true
            }
          end
        end

        context "when some operations are invalid" do
          manually_manage_identity_map

          it "rolls back all operations and returns validation errors for each" do
            signed_up_at = Time.now
            jan = User.find('jan')
            age_before_update = jan.age

            Model::Repository.initialize_local_identity_map
            response = Http::Response.new(*exposed_repository.mutate({
              :operations => [
                ['create', 'users', { 'full_name' => "Jake Frautschi", 'age' => 27, 'signed_up_at' => signed_up_at.to_millis }],
                ['update', 'users', 'jan', {'age' => 3}],
                ['destroy', 'users', 'wil']
              ].to_json
            }))
            Model::Repository.clear_local_identity_map

            User.find(User[:full_name].eq("Jake Frautschi")).should be_nil

            User.find("jan").age.should == age_before_update
            User.find('wil').should_not be_nil

            response.should be_ok
            response.body_from_json.should == {
              'data' => {
                'index' => 1,
                'errors' => { 'age' => ["User must be at least 10 years old"] }
              },
              'successful' => false
            }
          end
        end
      end
    end

    describe "#subscribe and #unsubscribe" do
      specify "#subscribe converts the 'relations' JSON into actual relations defined in terms of the exposed tables and calls #current_comet_client.subscribe with them and #unsubscribe calls #current_comet_client.unsubscribe with each subscription_id" do
        relations = [{ "type" => "table", "name" => "blogs"}, { "type" => "table", "name" => "blog_posts"}]

        mock_relation_1 = Object.new
        mock_relation_2 = Object.new
        mock(exposed_repository).build_relation_from_wire_representation({ "type" => "table", "name" => "blogs"}) { mock_relation_1 }
        mock(exposed_repository).build_relation_from_wire_representation({ "type" => "table", "name" => "blog_posts"}) { mock_relation_2 }

        exposed_repository.current_comet_client = Http::FakeCometClient.new
        mock(exposed_repository.current_comet_client).subscribe(mock_relation_1) { "mock_subscription_id_1"}
        mock(exposed_repository.current_comet_client).subscribe(mock_relation_2) { "mock_subscription_id_2"}
        response = Http::Response.new(*exposed_repository.subscribe({:relations => relations.to_json}))

        response.should be_ok
        response.headers.should == { 'Content-Type' => 'application/json'}
        parsed_repsonse_body = JSON.parse(response.body)
        parsed_repsonse_body['successful'].should be_true
        parsed_repsonse_body['data'].should == ["mock_subscription_id_1", "mock_subscription_id_2"]

        mock(exposed_repository.current_comet_client).unsubscribe("mock_subscription_id_1")
        mock(exposed_repository.current_comet_client).unsubscribe("mock_subscription_id_2")
        response = Http::Response.new(*exposed_repository.unsubscribe({:subscription_ids => ["mock_subscription_id_1", "mock_subscription_id_2"].to_json}))

        response.should be_ok
        response.headers.should == { 'Content-Type' => 'application/json'}
        response.body_from_json.should == {'successful' => true, 'data' => ""}
      end
    end

    describe "#build_relation_from_wire_representation" do
      before do
        publicize exposed_repository, :build_relation_from_wire_representation
      end

      it "delegates to Relation#from_wire_representation with self as the repository" do
        representation = {
          "type" => "table",
          "name" => "blogs"
        }
        mock(Relations::Relation).from_wire_representation(representation, exposed_repository)
        exposed_repository.build_relation_from_wire_representation(representation)
      end


      it "resolves relation names to primitive Tables" do
        relation = exposed_repository.build_relation_from_wire_representation({
          "type" => "table",
          "name" => "blog_posts"
        })
        relation.should == exposed_repository.user.blog_posts
      end
    end

    describe "#fetch" do
      attr_reader :blog_posts_relation_representation, :blogs_relation_representation

      before do
        publicize exposed_repository, :perform_fetch

        @blogs_relation_representation = {
          "type" => "selection",
          "operand" => {
            "type" => "table",
            "name" => "blogs"
          },
          "predicate" => {
            "type" => "eq",
            "left_operand" => {
              "type" => "column",
              "table" => "blogs",
              "name" => "id"
            },
            "right_operand" => {
              "type" => "scalar",
              "value" => "grain"
            }
          }
        }

        @blog_posts_relation_representation = {
          "type" => "selection",
          "operand" => {
            "type" => "table",
            "name" => "blog_posts"
          },
          "predicate" => {
            "type" => "eq",
            "left_operand" => {
              "type" => "column",
              "table" => "blog_posts",
              "name" => "blog_id"
            },
            "right_operand" => {
              "type" => "scalar",
              "value" => "grain"
            }
          }
        }

      end

      it "populates a relational dataset with the contents of an array of wire representations of relations" do
        dataset = exposed_repository.perform_fetch([blogs_relation_representation, blog_posts_relation_representation])

        blogs_dataset_fragment = dataset["blogs"]
        blogs_dataset_fragment.size.should == 1
        blogs_dataset_fragment["grain"].should == Blog.find("grain").wire_representation
      end

      it "can populate a dataset from exposed projections" do
        super_blog_posts_relation_representation = {
          "type" => "selection",
          "operand" => {
            "type" => "table",
            "name" => "super_blog_posts"
          },
          "predicate" => {
            "type" => "eq",
            "left_operand" => {
              "type" => "column",
              "table" => "super_blog_posts",
              "name" => "user_id"
            },
            "right_operand" => {
              "type" => "scalar",
              "value" => "jan"
            }
          }
        }

        dataset = exposed_repository.perform_fetch([super_blog_posts_relation_representation])
        expected_records = exposed_repository.resolve_table_name(:super_blog_posts).where(Blog[:user_id].eq('jan')).all
        expected_records.should_not be_empty

        expected_records.each do |record|
          dataset['super_blog_posts'][record.id].should == record.wire_representation
        end
      end
    end
  end
end
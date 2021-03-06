require 'spec_helper'

module Models
  describe User do
    let(:user) { User.make! }

    describe ".from_omniauth(auth_data)" do
      describe "when the user authenticates with Google OAuth2" do
        describe "when the user has a standard Google account" do
          it "does not create a group for them" do
            user = User.from_omniauth(standard_google_user_creds)
            user.full_name.should == "Bob Smith"
            user.email_address.should == "bob@gmail.com"
            user.uid.should == "12345"
            user.memberships.should be_empty
          end
        end

        describe "when the user has an Apps for Domains account" do
          it "creates a group for that domain if one does not exist already and makes them a member" do
            user = User.from_omniauth(apps_google_user_creds)
            user.memberships.count.should == 1
            user.groups.first.domain.should == "acme.com"
            user.groups.first.name.should == "acme.com"
          end
        end
      end

      describe "when the user authenticates with GitHub" do
        describe "when the user is a member of the GitHub staff team" do
          before do
            mock(User).is_github_team_member?("token", "nathansobo") { true }
          end

          it "creates a user for them and automatically makes them a member of the GitHub group" do
            user = User.from_omniauth(github_user_creds)
            user.full_name.should == "Nathan Sobo"
            user.email_address.should == "nathan@github.com"
            user.uid.should == "1789"
            user.memberships.count.should == 1
            user.groups.first.domain.should == "github.com"
            user.groups.first.name.should == "GitHub"
          end
        end

        describe "when the user is not a member of the GitHub staff team" do
          before do
            mock(User).is_github_team_member?("token", "nathansobo") { false }
          end

          it "does not create a user for them" do
            expect { User.from_omniauth(github_user_creds) }.to_not change User, :count
          end

          it "does not log them in even if they're an existing user" do
            User.create(:uid => "1789")
            User.from_omniauth(github_user_creds).should be_nil
          end
        end
      end
    end

    describe "security" do
      describe "#can_update? and #can_destroy?" do
        it "only the users themselves to update / destroy user records" do
          other_user = User.make!

          set_current_user(other_user)
          user.can_update?.should be_false
          user.can_destroy?.should be_false

          set_current_user(user)
          user.can_update?.should be_true
          user.can_destroy?.should be_true
        end
      end
    end

    let :standard_google_user_creds do
      Hashie::Mash.new({"provider"=>"google_oauth2",
       "uid"=>"12345",
       "info"=>
        {"name"=>"Bob Smith",
         "email"=>"bob@gmail.com",
         "first_name"=>"Bob",
         "last_name"=>"Smith",
         "image"=>
          "https://lh3.googleusercontent.com/-SE_y_kIv-Fc/AAAAAAAAAAI/AAAAAAAAAEc/DYjl78_QFew/photo.jpg"},
       "credentials"=>
        {"token"=>"token",
         "refresh_token"=>"refresh_token",
         "expires_at"=>1.day.from_now.to_millis,
         "expires"=>true},
       "extra"=>
        {"raw_info"=>
          {"id"=>"12345",
           "email"=>"bob@gmail.com",
           "verified_email"=>true,
           "name"=>"Bob Smith",
           "given_name"=>"Bob",
           "family_name"=>"Smith",
           "link"=>"https://plus.google.com/12345",
           "picture"=>
            "https://lh3.googleusercontent.com/-SE_y_kIv-Fc/AAAAAAAAAAI/AAAAAAAAAEc/DYjl78_QFew/photo.jpg",
           "gender"=>"male",
           "locale"=>"en"}}})
    end

    let :apps_google_user_creds do
      Hashie::Mash.new({"provider"=>"google_oauth2",
       "uid"=>"54321",
       "info"=>
        {"name"=>"John Doe",
         "email"=>"john@acme.com",
         "first_name"=>"John",
         "last_name"=>"Doe"},
       "credentials"=>
        {"token"=>"token",
         "refresh_token"=>"refesh_token",
         "expires_at"=>1.day.from_now.to_millis,
         "expires"=>true},
       "extra"=>
        {"raw_info"=>
          {"id"=>"54321",
           "email"=>"john@acme.com",
           "verified_email"=>true,
           "name"=>"John Doe",
           "given_name"=>"John",
           "family_name"=>"Doe",
           "link"=>"https://plus.google.com/54321",
           "gender"=>"male",
           "birthday"=>"0000-01-25",
           "locale"=>"en",
           "hd"=>"acme.com"}}})
    end

    let :github_user_creds do
      Hashie::Mash.new({"provider"=>"github",
       "uid"=>"1789",
       "info"=>
        {"nickname"=>"nathansobo",
         "email"=>"nathan@github.com",
         "name"=>"Nathan Sobo",
         "image"=>
          "https://secure.gravatar.com/avatar/bd964c4c26b160867008b423ae92b3e7?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png",
         "urls"=>{"GitHub"=>"https://github.com/nathansobo", "Blog"=>nil}},
       "credentials"=>
        {"token"=>"token", "expires"=>false},
       "extra"=>
        {"raw_info"=>
          {"login"=>"nathansobo",
           "id"=>1789,
           "avatar_url"=>
            "https://secure.gravatar.com/avatar/bd964c4c26b160867008b423ae92b3e7?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-user-420.png",
           "gravatar_id"=>"bd964c4c26b160867008b423ae92b3e7",
           "url"=>"https://api.github.com/users/nathansobo",
           "html_url"=>"https://github.com/nathansobo",
           "followers_url"=>"https://api.github.com/users/nathansobo/followers",
           "following_url"=>"https://api.github.com/users/nathansobo/following",
           "gists_url"=>"https://api.github.com/users/nathansobo/gists{/gist_id}",
           "starred_url"=>
            "https://api.github.com/users/nathansobo/starred{/owner}{/repo}",
           "subscriptions_url"=>
            "https://api.github.com/users/nathansobo/subscriptions",
           "organizations_url"=>"https://api.github.com/users/nathansobo/orgs",
           "repos_url"=>"https://api.github.com/users/nathansobo/repos",
           "events_url"=>"https://api.github.com/users/nathansobo/events{/privacy}",
           "received_events_url"=>
            "https://api.github.com/users/nathansobo/received_events",
           "type"=>"User",
           "name"=>"Nathan Sobo",
           "company"=>"GitHub",
           "blog"=>nil,
           "location"=>"Boulder, CO",
           "email"=>"nathan@github.com",
           "hireable"=>false,
           "bio"=>"",
           "public_repos"=>39,
           "followers"=>153,
           "following"=>1,
           "created_at"=>"2008-02-29T18:26:45Z",
           "updated_at"=>"2013-04-05T03:51:00Z",
           "public_gists"=>9,
           "total_private_repos"=>9,
           "owned_private_repos"=>7,
           "disk_usage"=>245892,
           "collaborators"=>16,
           "plan"=>
            {"name"=>"small",
             "space"=>1228800,
             "collaborators"=>5,
             "private_repos"=>10},
           "private_gists"=>9}}})
    end
  end
end

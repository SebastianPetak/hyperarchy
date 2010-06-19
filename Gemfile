source :gemcutter
source "http://gems.github.com/"

# monarch
gem "rack", "1.1.0"
gem "sinatra", "1.0"
gem "sequel", "3.12.0"
gem "activesupport", "3.0.0.beta"
gem "json", "1.2.0"
gem "guid", "0.1.1"
gem "cramp", "0.10"

## hyperarchy
gem "thin", "1.2.7"
gem "sinatra-reloader", "0.4.1", :require => "sinatra/reloader"
gem "warden", "0.10.7"
gem "erector", "0.6.7"
gem "rack-flash", "0.1.1"
gem "bcrypt-ruby", "2.1.1", :require => "bcrypt"
gem "pony", "1.0"
gem "rgl", "0.4.0", :require => ['rgl/base', 'rgl/adjacency', 'rgl/topsort']

group :test do
  gem "rspec", "1.2.6", :require => "spec"
  gem "rr", "0.10.0"
  gem "rack-test", "0.5.3", :require => "rack/test"
  gem "machinist", "1.0.6", :require => ["machinist", "machinist/blueprints", "sham"]
  gem "faker", "0.3.1"    
end

group :development do
  gem "net-ssh", "2.0.23"
  gem "grit", "2.0.0"
end
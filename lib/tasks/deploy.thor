$LOAD_PATH << File.expand_path('../..', __FILE__)
require 'deploy'

class Provision < Thor
  default_task :provision

  desc 'provision [env=demo]', 'provision a new server'
  def provision(env='demo')
    AppServer.new(env).provision
  end

  desc 'install_public_key [env=demo]', 'install the public ssh key after entering the root password'
  def install_public_key(env='demo')
    AppServer.new(env).install_public_key
  end

  desc 'reload_nginx_config [env=demo]', 'upload, test, and reload the nginx.conf'
  def reload_nginx_config(env='demo')
    AppServer.new(env).reload_nginx_config
  end
end

class Deploy < Thor
  default_task :deploy

  desc 'deploy [env=demo] [ref=origin/rails3]', 'deploy the specified revision to the specified environment'
  def deploy(env='demo', ref='origin/rails3')
    AppServer.new(env).deploy(ref)
  end

  desc "minify_js [env=demo]", "minify javascript for upload."
  def minify_js(env="demo")
    ENV['RAILS_ENV'] = env
    require File.expand_path('config/environment')
    GiftWrapper.clear_package_dir
    GiftWrapper.combine_js("underscore", "jquery-1.5.2")
    GiftWrapper.combine_js('app')
  end

  desc "update_nginx_config [env=demo]", "upload the current nginx config and tell nginx to reload it"
  def update_nginx_config(env="demo")
    AppServer.new(env).update_nginx_config
  end
end

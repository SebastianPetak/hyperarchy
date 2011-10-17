#!/usr/bin/env ruby

DIRECTORIES = {
  'rb' => ['app', 'lib', 'config'],
  'js' => ['app/assets/javascripts', 'vendor/princess/', 'vendor/socket_server'],
  'sass' => ['app/assets/stylesheets'],
  'erb' => ['app/views', 'lib/deploy/resources']
}

EXCLUSIONS = {
  'rb' => ['vendor'],
  'js' => ['node_modules', 'vendor']
}

HEADER_FILES = {
  'rb' => 'script/header.rb',
  'js' => 'script/header.js',
  'sass' => 'script/header.js',
  'erb' => 'script/header.erb'
}

def prepend_headers_for_filetype(extension)
  directories = DIRECTORIES[extension].join(' ')
  header_file = HEADER_FILES[extension]
  if exclusions =  EXCLUSIONS[extension]
    filter_command = exclusions.map {|expression| "grep -v #{expression}"}.join(' | ')
  else
    filter_command = 'cat'
  end

  find_command    = "find #{directories} -name '*.#{extension}'"
  prepend_command = "xargs -I file script/prepend #{header_file} file"
  command = "#{find_command} | #{filter_command} | #{prepend_command}"
  puts command
  system command
end

prepend_headers_for_filetype('rb')
prepend_headers_for_filetype('js')
prepend_headers_for_filetype('sass')
prepend_headers_for_filetype('erb')


#!/usr/bin/env ruby
# frozen_string_literal: true

require "nokogiri"
require "pathname"
require "uri"

SITE_ROOT = Pathname(ARGV.fetch(0, "_site")).expand_path
SITE_HOST = "ianyliu.github.io"
SCHOLAR_URL = "https://scholar.google.com/citations?hl=en&tzom=240&user=FOOA3twAAAAJ&inst=3404029378192158848"

errors = []

unless SITE_ROOT.directory?
  warn "Site output not found at #{SITE_ROOT}"
  exit 1
end

required_files = %w[
  index.html
  portfolio/index.html
  teaching/index.html
  publications/index.html
  files/IanLiu_CV.pdf
  assets/css/main.css
  assets/js/main.min.js
]

forbidden_files = %w[
  archive-layout-with-content/index.html
  collection-archive/index.html
  cv/index.html
  cv-json/index.html
  markdown/index.html
  non-menu-page/index.html
  page-archive/index.html
  talkmap/index.html
  talks/index.html
  terms/index.html
  year-archive/index.html
]

required_files.each do |relative_path|
  errors << "missing required output: /#{relative_path}" unless SITE_ROOT.join(relative_path).file?
end

forbidden_files.each do |relative_path|
  errors << "disabled demo page was published: /#{relative_path}" if SITE_ROOT.join(relative_path).exist?
end

def internal_target(source_file, raw_value)
  return if raw_value.nil? || raw_value.empty? || raw_value.start_with?("#")
  return if raw_value.match?(/\A(?:data|javascript|mailto|tel):/i)

  uri = URI.parse(raw_value)
  return if uri.host && uri.host != SITE_HOST
  return if uri.scheme && !%w[http https].include?(uri.scheme)

  path = URI::DEFAULT_PARSER.unescape(uri.path.to_s)
  return if path.empty?

  if path.start_with?("/")
    SITE_ROOT.join(path.delete_prefix("/"))
  else
    source_file.dirname.join(path)
  end.cleanpath
rescue URI::InvalidURIError
  nil
end

def target_exists?(target)
  target.file? ||
    target.join("index.html").file? ||
    Pathname("#{target}.html").file?
end

html_files = SITE_ROOT.glob("**/*.html").sort
checked_references = 0

SITE_ROOT.glob("**/*.{html,xml,json,txt}").sort.each do |text_file|
  content = text_file.read
  next unless content.match?(%r{https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:/|\z)}i)

  errors << "/#{text_file.relative_path_from(SITE_ROOT)}: production output contains a local-host URL"
end

html_files.each do |html_file|
  document = Nokogiri::HTML5(html_file.read)
  output_path = "/#{html_file.relative_path_from(SITE_ROOT)}"

  duplicate_ids = document.css("[id]").map { |node| node["id"] }
                          .reject(&:empty?)
                          .tally
                          .select { |_id, count| count > 1 }
  duplicate_ids.each_key do |id|
    errors << "#{output_path}: duplicate id #{id.inspect}"
  end

  document.css("[href], [src]").each do |node|
    attribute = node.key?("href") ? "href" : "src"
    raw_value = node[attribute].to_s.strip
    next if raw_value.empty?

    if raw_value.match?(%r{\Ahttps?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(?:/|\z)}i)
      errors << "#{output_path}: production URL points to a local host: #{raw_value}"
    end

    begin
      uri = URI.parse(raw_value)
      if uri.host == SITE_HOST && uri.path.to_s.include?("//")
        errors << "#{output_path}: same-origin URL contains a double slash: #{raw_value}"
      end
    rescue URI::InvalidURIError
      errors << "#{output_path}: invalid #{attribute}: #{raw_value.inspect}"
      next
    end

    target = internal_target(html_file, raw_value)
    next unless target

    checked_references += 1
    unless target.to_s.start_with?("#{SITE_ROOT}/") || target == SITE_ROOT
      errors << "#{output_path}: #{attribute} escapes the generated site: #{raw_value}"
      next
    end

    errors << "#{output_path}: broken internal #{attribute}: #{raw_value}" unless target_exists?(target)
  end
end

SITE_ROOT.glob("**/*.css").sort.each do |css_file|
  css_file.read.scan(/url\(\s*(['"]?)([^'")]+)\1\s*\)/i).each do |_quote, raw_value|
    target = internal_target(css_file, raw_value.strip)
    next unless target

    checked_references += 1
    errors << "/#{css_file.relative_path_from(SITE_ROOT)}: broken CSS asset: #{raw_value}" unless target_exists?(target)
  end
end

home = Nokogiri::HTML5(SITE_ROOT.join("index.html").read)
portfolio = Nokogiri::HTML5(SITE_ROOT.join("portfolio/index.html").read)

unless home.at_css("body.home--cinematic")
  errors << "/index.html: missing homepage cinematic hook"
end

if portfolio.at_css("body.home--cinematic")
  errors << "/portfolio/index.html: homepage cinematic hook leaked onto an internal page"
end

unless home.at_css("a[href='#{SCHOLAR_URL}']")
  errors << "/index.html: navigation does not link to the configured Google Scholar profile"
end

html_files.each do |html_file|
  next if html_file == SITE_ROOT.join("publications/index.html")

  document = Nokogiri::HTML5(html_file.read)
  document.css("a[href]").each do |link|
    target = internal_target(html_file, link["href"].to_s.strip)
    next unless target == SITE_ROOT.join("publications") ||
                target == SITE_ROOT.join("publications/index.html")

    errors << "/#{html_file.relative_path_from(SITE_ROOT)}: links to the retired publications listing"
  end
end

sitemap = SITE_ROOT.join("sitemap.xml")
if sitemap.file? && sitemap.read.include?("/publications/")
  errors << "/sitemap.xml: retired publications listing is still advertised"
end

css = SITE_ROOT.join("assets/css/main.css").read
errors << "/assets/css/main.css: cinematic motion CSS is missing" unless css.include?("home--cinematic")
errors << "/assets/css/main.css: reduced-motion fallback is missing" unless css.include?("prefers-reduced-motion")

if errors.empty?
  puts "Verified #{html_files.length} HTML files and #{checked_references} internal references."
  exit 0
end

warn "Site verification failed with #{errors.length} error#{errors.length == 1 ? '' : 's'}:"
errors.uniq.each { |error| warn "  - #{error}" }
exit 1

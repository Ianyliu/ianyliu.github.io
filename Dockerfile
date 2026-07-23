# Base image: Ruby with necessary dependencies for Jekyll
FROM ruby:3.2

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user with UID 1000
RUN groupadd -g 1000 vscode && \
    useradd -m -u 1000 -g vscode vscode

# Set the working directory
WORKDIR /usr/src/app

# Set permissions for the working directory
RUN chown -R vscode:vscode /usr/src/app

# Install from committed dependency locks before mounting the source tree.
COPY --chown=vscode:vscode Gemfile Gemfile.lock package.json package-lock.json ./

USER vscode
RUN gem install bundler:2.4.19
RUN bundle install --jobs 4
RUN npm ci

# Command to serve the Jekyll site
CMD ["bundle", "exec", "jekyll", "serve", "-H", "0.0.0.0", "-w"]

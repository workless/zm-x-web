# Use starter image
FROM node:8.1.2

# Install Basic Packages
RUN apt-get update && \
    apt-get install -y \
    vim

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app
RUN npm install

# Bundle app source
COPY . /app

RUN chmod +x /app/init

# Expose port
EXPOSE 443

# Default command to run
#CMD ["npm", "start"]

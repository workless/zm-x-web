# Use starter image
FROM node:8.1.2

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app
RUN npm install

# Bundle app source
COPY . /app

# Expose port
EXPOSE 8080

# Default command to run
#CMD ["npm", "start"]

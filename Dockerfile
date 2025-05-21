FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Set environment variable for port
ENV PORT=80

# Expose port
EXPOSE 80

# Start the application using the npm start script
CMD [ "npm", "start" ]

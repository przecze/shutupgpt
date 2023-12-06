FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Copy the source code into the container
COPY . .

# Build the app
RUN npm run build

# Install `serve` to run the application.
RUN npm install -g serve

# The port the app runs on
EXPOSE 3000

# Serve the app on port 3000
CMD ["serve", "-s", "build", "-l", "3000"]


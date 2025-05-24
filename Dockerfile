# Use the official Node.js LTS base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json before other files
COPY package*.json ./

# Install only production dependencies
RUN npm install 

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (change if needed)
EXPOSE 8000

# Start the application
CMD ["node", "server.js"]

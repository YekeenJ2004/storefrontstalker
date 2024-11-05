# Use an official Node.js image as the base
FROM node:18

# Create and set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's caching, if they exist
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the application port (replace 3000 with your app's port if different)
EXPOSE 3000

# Define the command to run the app
CMD ["node", "main.js"]
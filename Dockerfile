# Use the official Node.js 18 Alpine image 
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate the Prisma client inside the container
RUN npx prisma generate

# Port number your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
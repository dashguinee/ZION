FROM node:18-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create HLS storage directory
RUN mkdir -p /tmp/hls

# Expose port
EXPOSE 3000

# Start app
CMD [ "npm", "start" ]

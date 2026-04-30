FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache git
RUN git config --global url."https://github.com/".insteadOf "ssh://git@github.com/" \
  && git config --global url."https://github.com/".insteadOf "git@github.com:"

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173 4173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

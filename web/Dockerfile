FROM node:17-alpine3.14 

WORKDIR /usr/src/app

COPY . .

ARG BUILD_MODE=${BUILD_MODE}
ENV BUILD_MODE=${BUILD_MODE}

RUN sh BuildImage.sh

CMD ["sh", "Start.sh"]

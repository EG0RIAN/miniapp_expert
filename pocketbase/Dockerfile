FROM alpine:3.20

ARG PB_VERSION=0.21.3

WORKDIR /pb

RUN apk add --no-cache curl unzip ca-certificates && \
    curl -L -o pocketbase.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" && \
    unzip pocketbase.zip -d /usr/local/bin && \
    rm -f pocketbase.zip && \
    chmod +x /usr/local/bin/pocketbase

EXPOSE 8090

VOLUME ["/pb_data"]

CMD ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir", "/pb_data"]



FROM golang:1.23-alpine

ENV CGO_ENABLED=0 \
    GOCACHE=/opt/gocache \
    GOFLAGS=-buildvcs=false \
    GOTOOLCHAIN=local

RUN go build std \
    && chmod -R a+rwX /opt/gocache

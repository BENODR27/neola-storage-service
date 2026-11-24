FROM node:22-bookworm-slim AS runtime
WORKDIR /app
COPY package*.json ./
RUN --mount=type=secret,id=npm_ca \
    if [ -s /run/secrets/npm_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/npm_ca; fi; \
    npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node server.js config.js ./
COPY --chown=node:node routes ./routes
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node controllers ./controllers
COPY --chown=node:node config ./config
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
ENV NODE_ENV=production
EXPOSE 3052
CMD ["node", "server.js"]
FROM runtime AS customer
USER root
RUN node -e "require('node:fs').writeFileSync('/app/customer-policy.json',JSON.stringify({subscriptionRequired:true}))"
USER node
ENV NEOLA_CUSTOMER_DEPLOYMENT=true

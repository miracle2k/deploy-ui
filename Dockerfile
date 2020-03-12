FROM node:13

ENV NPM_CONFIG_LOGLEVEL warn

# Install and configure `serve`.
#RUN npm install -g serve
#CMD serve -s build

# Install all dependencies of the current project.
COPY client/package.json client/package.json
RUN cd client && yarn
COPY client client
RUN cd client && npm run build --production

COPY backend/package.json backend/package.json
RUN cd backend && yarn
COPY backend backend


WORKDIR backend
CMD yarn run start:prod
EXPOSE 5000
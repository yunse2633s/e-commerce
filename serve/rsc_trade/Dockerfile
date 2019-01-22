# Statusbar
#
# VERSION               1.0.0

FROM hub.c.163.com/nce2/nodejs:0.12.2

# Create app directory
RUN mkdir -p /rsc-other/rsc_trade
WORKDIR /rsc-other/rsc_trade

# Bundle app source
COPY . /rsc-other/rsc_trade
RUN npm install

EXPOSE 18082,17082
ENV HTTP_PORT 18082
CMD [ "npm", "start" ]

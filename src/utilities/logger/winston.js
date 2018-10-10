const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;
const Winston = require("winston");
const path = require("path");

String.prototype.capitalizeFirstLetter = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
Date.prototype.currentTimeLog = function() {
  return `${this.getFullYear()}.${this.getMonth() + 1}.${this.getDay()}.${this.getHours()}:${this.getMinutes()}:${this.getSeconds()}`;
};
Date.prototype.currentDay = function() {
  return `${this.getFullYear()}-${this.getMonth() + 1}-${this.getDay()}`;
};

const logFormat = printf(info => {
  return `[${info.level.capitalizeFirstLetter()}][${(new Date(info.timestamp)).currentTimeLog()}][${info.label}]: ${info.message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: "SystemLiar" }),
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console({}),
    new Winston.transports.File({
      filename: `${__dirname}/log/${(new Date).currentDay()}.log`,
      level: "info",
      maxsize:1000000,
      maxFiles:5
    })
  ]
});

exports.logger = logger;



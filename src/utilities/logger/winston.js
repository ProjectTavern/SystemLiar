const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf, prettyPrint } = format;
const Winston = require("winston");
const path = require("path");

String.prototype.capitalizeFirstLetter = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
Date.prototype.currentTimeLog = function() {
  return `${this.getFullYear()}.${this.getMonth() + 1}.${this.getDate()}.${this.getHours()}:${this.getMinutes()}:${this.getSeconds()}`;
};
Date.prototype.currentDay = function() {
  return `${this.getFullYear()}-${this.getMonth() + 1}-${this.getDate()}`;
};

const logFormat = printf(info => {
  return `[${info.level.capitalizeFirstLetter()}][${info.label}][${(new Date(info.timestamp)).currentTimeLog()}]: ${info.message}`;
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

const dataLogger = createLogger({
  format: combine(
    label({ label: "SystemLiar" }),
    timestamp(),
    prettyPrint()
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

logger.custLog = function (info, ...dataLogs) {
  this.info(info);
  dataLogs.forEach(dataLog => dataLogger.info(dataLog));
};

exports.logger = logger;
exports.dataLogger = dataLogger;



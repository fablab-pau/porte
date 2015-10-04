var Firebase = require('firebase');
var gpio = require('pi-gpio');
var async = require('async');

var FIREBASE_LOGIN = process.env.FIREBASE_LOGIN;
var FIREBASE_PASSWORD = process.env.FIREBASE_PASSWORD;

if(!FIREBASE_LOGIN || !FIREBASE_PASSWORD) {
  console.log('Set env for FIREBASE_LOGIN and FIREBASE_PASSWORD');
  process.exit(1);
}
var PIN_SWITCH = 10;
var PIN_GREEN = 16;
var PIN_RED = 18;

var PIN_ALL = [PIN_SWITCH, PIN_GREEN, PIN_RED];
var PIN_LED = [PIN_GREEN, PIN_RED];

var db = new Firebase('https://dazzling-inferno-8493.firebaseio.com');
var lastValue = null;

function gpioClose(id, callback) {
  try {
    gpio.close(id);
  } catch (e) {
  }
  process.nextTick(callback);
}

function gpioInput(id, callback) {
  gpio.open(id, "input", callback);
}

function gpioOutput(id, callback) {
  gpio.open(id, "output", callback);
}

function closeAll(callback) {
  async.map(PIN_ALL, gpioClose, callback)
}

function openInputs(callback) {
  async.map([PIN_SWITCH], gpioInput, callback)
}

function openOutputs(callback) {
  async.map(PIN_LED, gpioOutput, callback)
}

function sync() {
  gpio.read(PIN_SWITCH, function (err, value) {
    if (err) throw err;
    if(value !== lastValue) {
      gpio.write(PIN_GREEN, value === 1 ? 0 : 1);
      gpio.write(PIN_RED, value === 1 ? 1 : 0);
      db.set({
        open: value === 1
      });
      db.push();
      lastValue = value;
    }
    setTimeout(sync, 1000);
  });
}

db.authWithPassword({
  email: FIREBASE_LOGIN,
  password: FIREBASE_PASSWORD
}, function auth(err) {
  if (err) {
    console.log('Error connecting to the database');
    process.exit(1);
  }
  async.series([
    closeAll, openInputs, openOutputs
  ], function (err) {
    if (err) {
      console.log(error);
      process.exit(1);
    }
    sync();
  });


});

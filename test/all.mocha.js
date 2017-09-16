/* global describe, it */

'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const Holidays = require('..')
const ht = require('hashtree').hashTree

var writetests
var _countries

var years = [ 2015, 2016, 2017, 2018, 2019, 2020 ]
var WEEKDAYS = 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',')

// regenerate tests with `mocha test/all.mocha.js --writetests`
function options (argv) {
  function isOpt (a, s, l) {
    return (s === a || l === a)
  }

  for (var i = 0; i < argv.length; i++) {
    if (isOpt(argv[i], '-c', '--countries')) {
      var c = argv[++i].toUpperCase().split(',')
      _countries = {}
      for (var j in c) {
        _countries[c[j]] = c[j]
      }
    } else if (isOpt(argv[i], '-y', '--year')) {
      years = argv[++i].split(',')
    } else if (isOpt(argv[i], '-w', '--writetests')) {
      writetests = true
    }
  }
}
options(process.argv.splice(2))

function filename (name) {
  var file = path.join(__dirname, 'fixtures', name + '.json')
  return file
}

var SORTORDER = [ 'date', 'start', 'end', 'name', 'type', 'substitute' ]
function sorter (a, b) {
  var _a = SORTORDER.indexOf(a)
  var _b = SORTORDER.indexOf(b)
  if (_a >= 0 && _b >= 0) {
    return _a - _b
  } else {
    return a - b
  }
}

function addWeekday (arr) {
  if (!Array.isArray(arr)) return arr
  return arr.map((item) => {
    if (item.date) {
      item._weekday = WEEKDAYS[new Date(item.date).getDay()]
    }
    return item
  })
}

function writeFile (name, obj) {
  if (writetests) {
    if (Array.isArray(obj)) {
      obj = obj.map((item) => {
        item = JSON.parse(JSON.stringify(item))
        return ht.sort(item, sorter)
      })
    }

    var file = filename(name)
    fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8')
  }
}

function test (year, country, state, region) {
  var name = country + (state ? '-' + state : '') + (region ? '-' + region : '') + '-' + year

  it(name, function (done) {
    var hd = new Holidays(country, state, region)
    var res = hd.getHolidays(year)

    for (var i in res) {
      assert.ok(typeof res[i].name === 'string', 'translation missing for rule ' + i + ': ' + JSON.stringify(res[i]))
    }

    res = addWeekday(res)

    writeFile(name, res)
    fs.readFile(filename(name), 'utf8', function (err, exp) {
      assert.ok(!err, '' + err)
      assert.equal(JSON.stringify(res, null, 2), exp)
      done()
    })
  })
}

describe('#All Holidays', function () {
  years.forEach(function (year) {
    var countries = _countries || Holidays().getCountries()

    Object.keys(countries).forEach(function (country) {
      describe(year + ':' + country, function () {
        test(year, country)

        var states = Holidays().getStates(country)

        if (states) {
          Object.keys(states).forEach(function (state) {
            test(year, country, state)

            describe(state, function () {
              var regions = Holidays().getRegions(country, state)

              if (regions) {
                Object.keys(regions).forEach(function (region) {
                  test(year, country, state, region)
                })
              }
            })
          })
        }
      })
    })
  })
})

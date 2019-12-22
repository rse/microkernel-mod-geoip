/*
**  Microkernel -- Microkernel for Server Applications
**  Copyright (c) 2016-2019 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  external requirements  */
const schedule   = require("node-schedule")
const mmdbreader = require("maxmind-db-reader")

/*  the Microkernel module  */
class Module {
    constructor (options) {
        this.options = Object.assign({
            mmdbfile: ""
        }, options || {})
        this.job = null
        this.countries = null
    }
    get module () {
        return {
            name:  "microkernel-mod-geoip",
            tag:   "GEOIP",
            group: "BASE"
        }
    }
    latch (kernel) {
        kernel.latch("options:options", (options) => {
            options.push({
                name: "mmdbfile", type: "string", "default": this.options.mmdbfile,
                help: "Path to MaxMindDB File", helpArg: "PATH" })
        })
    }
    start (kernel) {
        /*  act only in case a database was configured  */
        const mmdbfile = kernel.rs("options:options").mmdbfile

        /*  define the updater job  */
        const updater = () => {
            if (mmdbfile !== "") {
                /*  read MaxMind GeoLite2 database  */
                return new Promise((resolve, reject) => {
                    mmdbreader.open(mmdbfile, (err, reader) => {
                        if (err)
                            reject(err)
                        else {
                            this.countries = reader
                            resolve()
                        }
                    })
                })
            }
            else
                return Promise.resolve()
        }

        /*  schedule the updater job to run every hour  */
        if (mmdbfile !== "") {
            kernel.sv("log", "geoip", "info", "starting GeoIP update scheduler")
            this.job = new schedule.Job("GeoIP Database Updater", updater)
            const rule = new schedule.RecurrenceRule()
            rule.hour   = null
            rule.minute = 8
            rule.second = 42
            this.job.schedule(rule)
        }

        /*  enrich request information with MaxMind GeoLite2 based country id  */
        kernel.register("geoip", (ip) => {
            return new Promise((resolve, reject) => {
                if (this.countries === null)
                    reject(new Error("GeoIP database still not available"))
                else
                    this.countries.getGeoData(ip, (err, geodata) => {
                        if (err)
                            reject(err)
                        else if (geodata !== null)
                            resolve(geodata.country.iso_code)
                        else
                            resolve("XX")
                    })
            })
        })

        /*  update initially  */
        return updater()
    }
    shutdown (kernel) {
        this.countries = null
        if (this.job !== null) {
            kernel.sv("log", "geoip", "info", "stopping GeoIP scheduler")
            this.job.cancel()
            this.job = null
        }
    }
}

/*  export the Microkernel module  */
module.exports = Module



microkernel-mod-geoip
=====================

Microkernel module for resolving geo-location of IP addresses

<p/>
<img src="https://nodei.co/npm/microkernel-mod-geoip.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/microkernel-mod-geoip.png" alt=""/>

About
-----

This is an extension module for the
[Microkernel](http://github.com/rse/microkernel) server
application environment, adding the capability to resolve
IP addresses to the geo-location.

Usage
-----

```shell
$ npm install microkernel
$ npm install microkernel-mod-ctx microkernel-mod-options
$ npm install microkernel-mod-geoip
```

```js
var Microkernel = require("microkernel")
var kernel = new Microkernel()

kernel.load(
    "microkernel-mod-hapi",
    [ "microkernel-mod-geoip", { mmdbfile: "GeoLite2-Country.mmdb" } ]
)

kernel.add(class ExampleModule {
    get module () {
        return {
            name:  "example",
            after: [ "HAPI", "GEOIP" ]
        }
    }
    latch (kernel) {
        kernel.latch("hapi:log", (info) => {
            info.msg += `, client-cc=${info.request.app.clientCC}`
        })
    }
    start (kernel) {
        kernel.rs("hapi").ext("onRequest", (request, reply) => {
            kernel.sv("geoip", request.app.clientAddress).then((cc) => {
                request.app.clientCC = cc
                reply.continue()
            }, (/* err */) => {
                reply.continue()
            })
        })
    }
})
```

License
-------

Copyright (c) 2016-2019 Dr. Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


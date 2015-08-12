vastacular
==========

Fetches/parses IAB VAST 2.0/3.0 XML.

API Documentation
-----------------

### VAST(*json*)

Accepts a JSON-formatted VAST document (described below.) All properties of the JSON-formatted VAST document will be copied to the VAST object. Any unspecified properties will be given default values. For example, if no mediaFiles are specified, the default will be an empty `Array`.

Here is complete JSON-formatted VAST document:

```javascript
{
    version: '2.0',
    ads: [
        {
            id: '12345',
            type: 'inline',
            system: {
                name: 'LiveRail',
                version: 'LR_DELIVERY_VERSION'
            },
            title: 'LiveRail creative 2',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
            survey: 'http://cinema6.com/survey',
            errors: ['http://cinema6.com/pixels/error'],
            impressions: [
                {
                    uri: 'http://cinema6.com/pixels/impression',
                    id: 'LR'
                }
            ],
            creatives: [
                {
                    id: '7969',
                    sequence: 1,
                    adID: 'foo',
                    type: 'linear',
                    duration: 30, // seconds
                    trackingEvents: [
                        {
                            event: 'start',
                            uri: 'http://cinema6.com/pixels/start'
                        },
                        {
                            event: 'midpoint',
                            uri: 'http://cinema6.com/pixels/midpoint'
                        }
                    ],
                    parameters: 'foo=bar',
                    videoClicks: {
                        clickThrough: 'http://cinema6.com/',
                        clickTrackings: ['http://cinema6.com/pixels/click'],
                        customClicks: [
                            {
                                id: 'some-id',
                                uri: 'http://cinema6.com/pixels/custom-click'
                            }
                        ]
                    },
                    mediaFiles: [
                        {
                            id: 'media-id',
                            delivery: 'streaming',
                            type: 'video/mp4',
                            uri: 'http://cinema6.com/videos/my-ad.mp4',
                            bitrate: 1024,
                            width: 1920,
                            height: 1080,
                            scalable: true,
                            maintainAspectRatio: true,
                            apiFramework: 'none'
                        }
                    ]
                },
                {
                    id: 'companion-id',
                    type: 'companions',
                    companions: [
                        {
                            width: 300,
                            height: 250,
                            expandedWidth: 800,
                            expandedHeight: 600,
                            apiFramework: '...',
                            resources: [
                                {
                                    type: 'static',
                                    creativeType: 'image/png',
                                    data: 'http://cinema6.com/images/ad.png' // or a blob of html
                                },
                                {
                                    type: 'iframe',
                                    data: 'http://cinema6.com/pages/ad.html'
                                },
                                {
                                    type: 'html',
                                    data: '<p>Hello!</p>'
                                }
                            ],
                            trackingEvents: [
                                {
                                    event: 'creativeView',
                                    uri: 'http://cinema6.com/pixels/companion-view'
                                }
                            ],
                            clickThrough: 'http://cinema6.com/store',
                            altText: 'Visit the Store!',
                            parameters: 'foo=bar'
                        }
                    ]
                },
                {
                    id: 'some-id',
                    type: 'nonLinear',
                    ads: [
                        {
                            id: 'linear-id',
                            width: 970,
                            height: 200,
                            expandedWidth: 800,
                            expandedHeight: 600,
                            scalable: true,
                            maintainAspectRatio: true,
                            minSuggestedDuration: 10, // seconds
                            apiFramework: '...',
                            resources: [
                                {
                                    type: 'static',
                                    creativeType: 'image/png',
                                    data: 'http://cinema6.com/images/ad.png' // or a blob of html
                                },
                                {
                                    type: 'iframe',
                                    data: 'http://cinema6.com/pages/ad.html'
                                },
                                {
                                    type: 'html',
                                    data: '<p>Hello!</p>'
                                }
                            ]
                            clickThrough: 'http://cinema6.com/store',
                            parameters: 'foo=bar'
                        }
                    ],
                    trackingEvents: [
                        {
                            event: 'start',
                            uri: 'http://cinema6.com/pixels/start'
                        },
                        {
                            event: 'midpoint',
                            uri: 'http://cinema6.com/pixels/midpoint'
                        }
                    ]
                }
            ]
        },
        {
            type: 'wrapper',
            vastAdTagURI: 'http://cinema6.com/vast/some-vast.xml'

            // Wrapper ad can also have any of the properties of the "inline" type
        }
    ]
}
```

#### VAST.prototype.wrappers
Returns all of the ads with type "wrapper."

#### VAST.prototype.inlines
Returns all of the ads with type "inline."

#### VAST.prototype.get(*prop*)
Gets the specified property from the `VAST` instance. If one of the parent properties is a non-object, it will return `undefined` instead of throwing a `TypeError`.

#### VAST.prototype.set(*prop*, *value*)
Sets the specified *prop* to the provided *value*. If one of the parent properties is a non-object, it will be converted into a POJO (`{}`.)

#### VAST.prototype.map(*array*, *mapper*)
Uses `Vast.prototype.get()` to retrieve the *array* and calls the *mapper* for each item in the *array* with the item, index and array. In the *mapper*, `this` will refer to the `VAST` instance. A new `Array` will be returned containing items with the result of each call of *mapper*.

If *array* does not resolve to an `Array`, an empty `Array` will be returned.

#### VAST.prototype.filter(*array*, *predicate*)
Uses `Vast.prototype.get()` to retrieve the *array* and calls the *predicate* for each item in the *array* with the item, index and array. In the *predicate*, `this` will refer to the `VAST` instance. A new `Array` will be returned containing items for which *predicate* returned something truthy.

If *array* does not resolve to an `Array`, an empty `Array` will be returned.

#### VAST.prototype.find(*array*, *predicate*)
Uses `Vast.prototype.get()` to retrieve the *array* and calls the *predicate* for each item in the *array* with the item, index and array. As soon as *predicate* returns a truthy value, the corresponding item will be returned. If *predicate* never returns something truthy, `undefined` will be returned.

If *array* does not resolve to an `Array`, `undefined` will be returned.

#### VAST.prototype.resolveWrappers(*[maxRedirects]*, *[cb]*)
Returns a `Promise`. This method will make a request for all the wrappers' `vastAdTagURI`s. A new `VAST` will be created, with each wrapper being replaced by the ad(s) that were fetched. This process will repeat recursively until there are no more wrappers or *maxRedirects* is exceeded.

When there are no more wrappers, the returned `Promise` will be fulfilled with the new wrapper-free `VAST` instance. If *maxRedirects* is exceeded, the `Promise` will be rejected with an `Error`.

If the optional callback *cb* is provided, it will be called in the Node.js conventional way: `(err, result)`.

#### VAST.prototype.copy()
Returns a new `VAST` instance that is a copy of `this` one.

#### VAST.prototype.toPOJO()
Returns the instance converted to JSON-formatted VAST.

#### VAST.prototype.toXML()
Returns the instance converted to VAST XML.

#### VAST.pojoFromXML(*xml*)
Converts a `String` of *xml* into JSON-formatted VAST.

#### VAST.fetch(*uri*, *[options]*, *[cb]*)
Returns a `Promise`. This method will make a network request for the provided *uri* and fulfill the returned `Promise` with a `VAST` instance representing the fetched VAST XML.

**options**:

```javascript
{
    resolveWrappers: Boolean, // Should 'wrapper' ads be automatically resolved?
    maxRedirects: Number // Maximum number of wrapper redirects that should be followed,
    headers: Object // Request headers to include
}
```

If the optional callback *cb* is provided, it will be called in the Node.js conventional way: `(err, result)`.

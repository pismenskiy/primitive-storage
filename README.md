# Primitive storage

[![BuildStatus](https://img.shields.io/travis/com/qiwi/primitive-storage.svg?maxAge=3600&branch=master)](https://travis-ci.com/qiwi/primitive-storage)
[![npm (tag)](https://img.shields.io/npm/v/@qiwi/primitive-storage/latest.svg)](https://www.npmjs.com/package/@qiwi/primitive-storage)
[![dependencies Status](https://david-dm.org/qiwi/primitive-storage/status.svg)](https://david-dm.org/qiwi/primitive-storage)
[![devDependencies Status](https://david-dm.org/qiwi/primitive-storage/dev-status.svg)](https://david-dm.org/qiwi/primitive-storage?type=dev)
[![Maintainability](https://api.codeclimate.com/v1/badges/b2f9b667caf025244af1/maintainability)](https://codeclimate.com/github/qiwi/primitive-storage/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/b2f9b667caf025244af1/test_coverage)](https://codeclimate.com/github/qiwi/primitive-storage/test_coverage)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![Greenkeeper badge](https://badges.greenkeeper.io/qiwi/primitive-storage.svg)](https://greenkeeper.io/)

Storage for basic purposes.  

#### Motivation
In 2018 it's easier to write own storage implementation than to find a suitable one.
* [memory-cache](https://www.npmjs.com/package/memory-cache) is good enough, but `setTimeout` for each entry set looks redundant (0.2.0)
* [data-store](https://www.npmjs.com/package/data-store) — very nice, but only synchronous saving is supported, no debouncing, no ttl (2.0.1)
* [node-cache](https://www.npmjs.com/package/node-cache) — pretty OK. Callbacks and events are supported. But no JSON.stringify handling, no persistency out of box (4.2.0)
* [CacheFactory](https://github.com/jmdobry/CacheFactory) — brilliant. localStorage, api, docs — everything is ok, but no file saving mechanism.

#### What's needed
* Key-Value scheme
* Optional TTL
* Optional value cloning
* Cycled refs handling (JSON.stringify, you know)
* Sync throttling
* Periodic compaction
* Both browser and server runtime support

#### Install
```bash
    npm i @qiwi/primitive-storage
    yarn add @qiwi/primitive-storage
```

#### Basic API
```javascript
interface IStorage {
  get(key: string): any,
  set(key: string, value: any, ttl?: number): void,
  remove(key: string): void,
  reset(): void
}
```
Also common aliases added for convenience:
* `put` = `set`
* `del` = `remove`
* `clear` = `reset`

#### Usage example
```javascript
    import factory from '@antongolub/primitive-storage'

    const storage = factory({defaultTtl: 60000})

    storage.set('foo', 'bar')
    storage.get('foo')  // 'bar'
    
    // A minute later
    storage.get('foo')  // undefined
```

#### Configuration

| Option        | Type    | Def     | Description                                            |
|---------------|---------|---------|--------------------------------------------------------|
| defaultTtl    | number  | -       | If defined, the value would be applied as default ttl<br/>for every `set()` call |
| debounce      | Object  | -       | Options for persistent storage sync debounce.<br/> If empty no delay processed. IDebounceOpts:<br/>{<br/>   delay: number,<br/>   maxDelay?: number,<br/>   leading?: boolean<br/>   trailing?: boolean<br/>}|
| path          | string  | -       | Filepath (NodeJS) or localStorage scope (Browser)      |
| compactTimer  | number  | -       | Period (ms) of automated `compact` method invocation<br/>If undefined, no periodic task is running |
| clone         | bool/fn | false   | `true` means that values are copied to storage on set.<br/>Default copier (JSON.parse(JSON.str(...))) may be replaced <br/>with custom.


#### Persistent data
It's very simple: if `path` property declared in opts, the data is being persisted: 
* In case of NodeJS runtime, the data would be saved as json file. 
* Browser operates with localStorage.
```javascript
    const storage = factory({path: './data.json'})
```

#### Compaction
Current impl is dumb: every `n` milliseconds the job filters out expired entries from the storage.
You're able to set `compactTimer` in storage opts, or just trigger `compact` method by hand.
